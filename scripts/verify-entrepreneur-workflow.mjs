import { verificationTarget } from './verification-target.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { randomBytes, createHash } from 'node:crypto';
const requireAPI = createRequire(new URL('../ideathon.api/package.json', import.meta.url));
const mongoose = requireAPI('mongoose');
const env = requireAPI('dotenv').parse(readFileSync(new URL('../ideathon.api/.env', import.meta.url)));
assert.equal(env.MONGODB_URI, 'mongodb://127.0.0.1:27027/ideathon_local');
const target = verificationTarget(env.MONGODB_URI);
await mongoose.connect(target.mongoURI, { autoIndex: false });
const User = requireAPI('./src/models/User');
const Application = requireAPI('./src/models/EntrepreneurApplication');
const Document = requireAPI('./src/models/EntrepreneurDocument');
const userIds = [], applicationIds = [];
const originals = new Map();
const hash = value => createHash('sha256').update(mongoose.mongo.BSON.serialize(value)).digest('hex');
for (const name of ['users', 'entrepreneurapplications', 'entrepreneurdocuments', 'entrepreneurformsettings', 'entrepreneurformdrafts']) {
  originals.set(name, (await mongoose.connection.db.collection(name).find({}).toArray()).map(value => ({ _id: value._id, hash: hash(value) })));
}
async function account(role) {
  const user = await User.create({ name: 'Yerel İş Akışı Testi', email: `workflow-${randomBytes(8).toString('hex')}@example.com`, password: randomBytes(24).toString('base64url'), role });
  userIds.push(user._id);
  return { user, token: requireAPI('jsonwebtoken').sign({ userId: String(user._id), role }, env.JWT_SECRET, { expiresIn: '10m' }) };
}
async function request(path, account, method = 'GET', body, expected = 200) {
  const response = await fetch(`${target.apiOrigin}/api/entrepreneurs${path}`, { method,
    headers: { ...(account ? { Authorization: `Bearer ${account.token}` } : {}), ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}) },
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000) });
  assert.equal(response.status, expected, `${method} ${path}: ${(await response.clone().json().catch(() => ({}))).message || response.status}`);
  if (response.headers.get('content-type')?.includes('application/pdf')) return Buffer.from(await response.arrayBuffer());
  if (response.headers.get('content-disposition')) return Buffer.from(await response.arrayBuffer());
  return response.json();
}
const form = { id: 'workflow-qa', version: 'workflow-qa-v1', title: 'Yerel Test Başvurusu', sections: [{ id: 'general', title: 'Girişim bilgileri' }], questions: [
  { id: 'venture_name', label: 'Girişim adı', section: 'general', type: 'text', required: true },
  { id: 'solution', label: 'Çözüm', section: 'general', type: 'textarea', required: true },
  { id: 'email', label: 'E-posta', section: 'general', type: 'text', inputType: 'email', required: true },
  { id: 'pitch_deck', label: 'Sunum', section: 'general', type: 'file', maxFiles: 2 },
  { id: 'kvkk_ack', label: 'KVKK', section: 'general', type: 'consent', required: true, help: 'Test onay metni', privacyVersion: 'test-v1' },
], agreements: [{ id: 'terms_ack', label: 'Kullanım Şartları', type: 'consent', required: true, acknowledgement: 'Test onayı', version: 'test-v1' }] };
const initialAnswers = { venture_name: 'İş Akışı QA', solution: 'İlk gönderilen çözüm', email: 'workflow@example.com', kvkk_ack: true, terms_ack: true };
let app;
const save = (who, answers, submit = false, extra = {}, expected = 200) => request('/my', who, 'PUT', { answers, submit, revision: app.revision, formVersion: form.version, ...extra }, expected);
async function upload(who, name) {
  const data = new FormData(); data.append('revision', String(app.revision));
  data.append('file', new Blob([Buffer.from('%PDF-1.4\nYerel QA')], { type: 'application/pdf' }), name);
  return (await request('/documents/pitch_deck', who, 'POST', data, 201)).data.application;
}
try {
  const owner = await account('user'), other = await account('user'), superadmin = await account('superadmin'), admin = await account('admin');
  const fixture = await Application.create({ userId: owner.user._id, form, answers: initialAnswers });
  applicationIds.push(fixture._id);
  app = (await request('/my', owner)).data.application;
  app = await upload(owner, 'original.pdf');
  const originalDocument = app.documents[0]._id;
  app = (await save(owner, initialAnswers, true)).data.application;
  const firstDate = app.submittedAt;
  assert.equal(app.status, 'submitted'); assert.equal(app.reviewStatus, 'submitted');
  await save(owner, initialAnswers, false, { reviewStatus: 'approved' }, 409);
  let detail = (await request(`/admin/${app._id}`, superadmin)).data;
  await request(`/admin/${app._id}/export?format=pdf`, superadmin);
  assert.equal((await request('/my', owner)).data.application.reviewStatus, 'submitted', 'Liste/PDF/detay GET kendiliğinden görüntülendi yapmamalı');
  for (const who of [admin, owner, other]) {
    await request(`/admin/${app._id}/view`, who, 'POST', { submittedAt: firstDate }, 403);
    await request(`/admin/${app._id}/review`, who, 'POST', { reviewStatus: 'approved', revision: detail.revision }, 403);
  }
  await request(`/admin/${app._id}/view`, undefined, 'POST', { submittedAt: firstDate }, 401);
  detail = (await request(`/admin/${app._id}/view`, superadmin, 'POST', { submittedAt: firstDate })).data;
  const viewedAt = detail.viewedAt;
  assert.equal(detail.reviewStatus, 'viewed'); assert.equal(detail.revision, app.revision);
  detail = (await request(`/admin/${app._id}/view`, superadmin, 'POST', { submittedAt: firstDate })).data;
  assert.equal(detail.viewedAt, viewedAt, 'Tekrar görüntüleme ilk zamanı değiştirmemeli');
  assert.equal((await request('/my', owner)).data.application.reviewStatus, 'viewed');
  for (const reviewStatus of ['under_review', 'reviewed', 'approved', 'rejected']) {
    const oldRevision = detail.revision;
    detail = (await request(`/admin/${app._id}/review`, superadmin, 'POST', { reviewStatus, revision: oldRevision })).data;
    assert.equal((await request('/my', owner)).data.application.reviewStatus, reviewStatus);
    await request(`/admin/${app._id}/review`, superadmin, 'POST', { reviewStatus: 'approved', revision: oldRevision }, 409);
  }
  await request(`/admin/${app._id}/review`, superadmin, 'POST', { reviewStatus: 'submitted', revision: detail.revision }, 422);
  detail = (await request(`/admin/${app._id}/view`, superadmin, 'POST', { submittedAt: firstDate })).data;
  assert.equal(detail.reviewStatus, 'rejected', 'Görüntüleme kararı geriye almamalı');
  await request('/my/edit', other, 'POST', { revision: detail.revision }, 409);
  await request('/my/edit', owner, 'POST', { revision: -1 }, 409);
  app = (await request('/my/edit', owner, 'POST', { revision: detail.revision })).data.application;
  assert.equal(app.isResubmission, true); assert.equal(app.status, 'draft');
  assert.equal((await request('/my', owner)).data.application.isResubmission, true);
  const changedAnswers = { ...initialAnswers, solution: 'Yeniden düzenlenen çözüm', venture_name: 'Yeni girişim adı' };
  app = (await save(owner, changedAnswers)).data.application;
  const oldDetail = (await request(`/admin/${app._id}`, admin)).data;
  assert.equal(oldDetail.answers.solution, initialAnswers.solution);
  assert.equal(oldDetail.editDraft, undefined, 'Yönetici düzenleme taslağını almamalı');
  assert.equal(oldDetail.reviewStatus, 'rejected');
  assert.ok((await request('/admin', admin)).data.some(record => record._id === app._id), 'Düzenlenen başvuru havuzda kalmalı');
  const pdf = await request('/my/export?format=pdf', owner); assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
  await request(`/admin/${app._id}`, superadmin, 'PUT', { revision: oldDetail.revision, contact: { name: 'Test', email: 'test@example.com', ventureName: 'Çakışan düzenleme' } }, 409);
  app = (await request(`/documents/${originalDocument}`, owner, 'DELETE', { revision: app.revision })).data.application;
  assert.equal(app.documents.length, 0);
  await request(`/admin/${app._id}/documents/${originalDocument}`, admin);
  app = await upload(owner, 'cancelled.pdf'); const cancelledDocument = app.documents[0]._id;
  await save(owner, { ...changedAnswers, terms_ack: false }, true, {}, 422);
  app = (await request('/my/cancel-edit', owner, 'POST', { revision: app.revision })).data.application;
  assert.equal(app.status, 'submitted'); assert.equal(app.reviewStatus, 'rejected');
  assert.equal(app.answers.solution, initialAnswers.solution); assert.equal(app.documents[0]._id, originalDocument);
  assert.equal(await Document.exists({ _id: cancelledDocument }), null);
  app = (await request('/my/edit', owner, 'POST', { revision: app.revision })).data.application;
  app = (await request(`/documents/${originalDocument}`, owner, 'DELETE', { revision: app.revision })).data.application;
  app = await upload(owner, 'resubmitted.pdf'); const newDocument = app.documents[0]._id;
  const staleRevision = app.revision;
  app = (await save(owner, changedAnswers, true, { source: 'admin', reviewStatus: 'approved', viewedAt: new Date().toISOString() })).data.application;
  assert.equal(app.reviewStatus, 'submitted'); assert.equal(app.viewedAt, undefined); assert.equal(app.isResubmission, false);
  assert.equal(app.answers.solution, changedAnswers.solution); assert.notEqual(app.submittedAt, firstDate);
  assert.equal(await Document.exists({ _id: originalDocument }), null); assert.ok(await Document.exists({ _id: newDocument }));
  await request(`/admin/${app._id}/view`, superadmin, 'POST', { submittedAt: firstDate }, 409);
  await request('/my', owner, 'PUT', { answers: initialAnswers, revision: staleRevision, formVersion: form.version }, 409);
  detail = (await request(`/admin/${app._id}`, admin)).data;
  assert.equal(detail.source, 'self'); assert.equal(detail.answers.solution, changedAnswers.solution);
  assert.equal(detail.privacy.acknowledgedAt, app.submittedAt);
  detail = (await request(`/admin/${app._id}/view`, superadmin, 'POST', { submittedAt: app.submittedAt })).data;
  assert.equal(detail.reviewStatus, 'viewed');
  const manual = await Application.create({ userId: other.user._id, source: 'admin', contact: { name: 'Manuel kişi', email: 'manual@example.com', ventureName: 'Manuel girişim' }, form, answers: initialAnswers, status: 'submitted', submittedAt: new Date() });
  applicationIds.push(manual._id);
  app = (await request('/my', other)).data.application;
  app = (await request('/my/edit', other, 'POST', { revision: app.revision })).data.application;
  app = (await save(other, changedAnswers, true)).data.application;
  detail = (await request(`/admin/${app._id}`, admin)).data;
  assert.equal(detail.source, 'admin'); assert.equal(detail.contact.ventureName, changedAnswers.venture_name);
  // Legacy submissions are read correctly without rewriting them in a migration.
  await Application.collection.updateOne({ _id: manual._id }, { $unset: { reviewStatus: '' } });
  assert.equal((await request(`/admin/${app._id}`, admin)).data.reviewStatus, 'submitted');
  console.log('OK: Sistem/Manuel ayrımı, süperadmin görüntüleme ve karar yetkileri, durum geçişleri, eski kayıtlar, düzenleme/iptal/yeniden gönderim, evrak/PDF/onay koruması ve sürüm çakışmaları.');
} finally {
  await Document.deleteMany({ applicationId: { $in: applicationIds } });
  await Application.deleteMany({ _id: { $in: applicationIds } });
  await User.deleteMany({ _id: { $in: userIds } });
  try {
    for (const [name, documents] of originals) for (const document of documents) assert.equal(hash(await mongoose.connection.db.collection(name).findOne({ _id: document._id })), document.hash, `${name}: özgün kayıt değişmemeli`);
    console.log('OK: Test kayıtları temizlendi; özgün kullanıcılar, başvurular, evraklar ve soru setleri birebir korundu.');
  } finally { await mongoose.disconnect(); }
}
