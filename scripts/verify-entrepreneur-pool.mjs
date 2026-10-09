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
const ids = [];
const applicationIds = [];
const marker = `Havuz-QA-${randomBytes(7).toString('hex')}`;
const hash = document => createHash('sha256').update(mongoose.mongo.BSON.serialize(document)).digest('hex');
const originalCollections = ['entrepreneurapplications', 'entrepreneurdocuments', 'entrepreneurformsettings', 'entrepreneurformdrafts'];
const originals = new Map();
for (const name of originalCollections) originals.set(name, (await mongoose.connection.db.collection(name).find({}).toArray()).map(document => ({ _id: document._id, hash: hash(document) })));

async function token(role) {
  const user = await User.create({ name: 'Yerel Havuz Testi', email: `pool-${randomBytes(8).toString('hex')}@example.com`, password: randomBytes(24).toString('base64url'), role });
  ids.push(user._id);
  return { user, token: requireAPI('jsonwebtoken').sign({ userId: String(user._id), role }, env.JWT_SECRET, { expiresIn: '10m' }) };
}
async function request(path, roleToken, method = 'GET', body, expected = 200) {
  const multipart = body instanceof FormData;
  const response = await fetch(`${target.apiOrigin}/api${path}`, { method, headers: { ...(roleToken ? { Authorization: `Bearer ${roleToken}` } : {}), ...(body && !multipart ? { 'Content-Type': 'application/json' } : {}) }, body: multipart ? body : body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000) });
  const failureMessage = response.status !== expected ? (await response.clone().json().catch(() => ({}))).message || '' : '';
  assert.equal(response.status, expected, `${method} ${path}: HTTP ${response.status} (beklenen ${expected}) ${failureMessage}`);
  if (response.headers.get('content-type')?.includes('application/pdf') || response.headers.get('content-type')?.includes('spreadsheetml')) return response;
  return response.json();
}
const base = '/entrepreneurs/admin';
try {
  const admin = await token('admin');
  const superadmin = await token('superadmin');
  const owner = await token('user');
  const other = await token('user');
  const self = await token('user');
  const denied = [owner, await token('mentor'), await token('juri'), await token('support')];
  await request(base, undefined, 'POST', { contact: {} }, 401);
  for (const role of denied) {
    await request(base, role.token, 'POST', { contact: {} }, 403);
    await request(`${base}/entry-form`, role.token, 'GET', undefined, 403);
    await request(`${base}/accounts`, role.token, 'GET', undefined, 403);
    await request(`${base}/import/formats`, role.token, 'GET', undefined, 403);
    await request(`${base}/import/template`, role.token, 'GET', undefined, 403);
    await request(`${base}/import/preview`, role.token, 'POST', undefined, 403);
  }
  const initialTotal = (await request(base, admin.token)).pagination.total;
  const importFormats = (await request(`${base}/import/formats`, admin.token)).data;
  assert.equal(importFormats.ready, true); assert.equal(importFormats.formats[0].id, 'xlsx');
  const importForm = (await request(`${base}/entry-form`, admin.token)).data;
  const template = await request(`${base}/import/template`, admin.token);
  const ExcelJS = requireAPI('exceljs'); const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(await template.arrayBuffer()));
  workbook.getWorksheet('Başvuru').eachRow((row, index) => {
    if (index < 8) return;
    const q = importForm.questions.find(q => q.id === row.getCell(1).value);
    const value = q.id === 'venture_name' ? `${marker}-excel` : q.id === 'email' ? `import-${marker}@example.com` : q.id === 'phone' || q.inputType === 'tel' ? '0532 123 45 67' : q.type === 'multipleChoice' || q.type === 'singleChoice' ? q.options[0] : q.inputType === 'date' ? '2026-10-08' : q.inputType === 'number' ? '3' : q.inputType === 'url' ? 'https://example.com' : q.inputType === 'email' ? `import-${marker}@example.com` : 'Excel test yanıtı';
    row.getCell(4).value = value;
  });
  const excelUpload = new FormData(); excelUpload.append('file', new Blob([await workbook.xlsx.writeBuffer()], { type: importFormats.formats[0].id === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : '' }), 'qa-başvuru.xlsx');
  const preview = (await request(`${base}/import/preview`, superadmin.token, 'POST', excelUpload)).data;
  assert.equal(preview.status, 'review'); assert.equal(preview.contact.ventureName, `${marker}-excel`);
  assert.equal(preview.contact.email, `import-${marker}@example.com`); assert.equal(preview.contact.phone, '+905321234567');
  assert.equal(preview.issues.length, 0); assert.ok(preview.matches.length > 10);
  assert.equal((await request(base, admin.token)).pagination.total, initialTotal, 'Önizleme başvuru oluşturmamalı');
  await request(`${base}/import/preview`, superadmin.token, 'POST', undefined, 422);
  const invalidExcel = new FormData(); invalidExcel.append('file', new Blob(['not excel']), 'qa.pdf');
  await request(`${base}/import/preview`, superadmin.token, 'POST', invalidExcel, 422);
  const oversized = new FormData(); oversized.append('file', new Blob([new Uint8Array(importFormats.maxSize + 1)]), 'qa.xlsx');
  await request(`${base}/import/preview`, superadmin.token, 'POST', oversized, 422);
  await request(base, superadmin.token, 'POST', { contact: preview.contact, answers: preview.answers, entryFormVersion: 'outdated' }, 409);
  const missing = importForm.questions.find(q => q.required && !['file', 'consent'].includes(q.type) && !['full_name', 'first_name', 'last_name', 'email', 'phone', 'venture_name'].includes(q.id));
  if (missing) await request(base, superadmin.token, 'POST', { contact: preview.contact, answers: { ...preview.answers, [missing.id]: '' }, entryFormVersion: importForm.version }, 422);
  const imported = (await request(base, superadmin.token, 'POST', { contact: preview.contact, answers: preview.answers, entryFormVersion: preview.form.version }, 201)).data;
  applicationIds.push(imported._id);
  assert.equal(imported.answers.kvkk_ack, undefined); assert.equal(imported.privacy, undefined);
  assert.equal(imported.documents.length, 0); assert.equal(await User.countDocuments({ email: preview.contact.email }), 0);
  assert.deepEqual(imported.form, importForm);
  for (const [id, answer] of Object.entries(preview.answers)) assert.deepEqual(imported.answers[id], answer, 'Aktarılan sorunun yanıtı korunmalı');
  await Application.deleteOne({ _id: imported._id }); // This run's disposable import fixture.
  const contact = { name: 'Yerel Test Girişimci', email: 'pool-qa@example.com', phone: '0532 123 45 67', ventureName: marker };
  await request(base, superadmin.token, 'POST', { contact: { ...contact, email: 'invalid' } }, 422);
  await request(base, superadmin.token, 'POST', { contact, answers: { kvkk_ack: true } }, 422);
  await request(base, superadmin.token, 'POST', { contact, answers: { unknown: 'value' } }, 422);
  let record = (await request(base, superadmin.token, 'POST', { contact, answers: { stage: 'Fikir' } }, 201)).data;
  applicationIds.push(record._id);
  const second = (await request(base, superadmin.token, 'POST', { contact: { ...contact, ventureName: `${marker}-2` } }, 201)).data;
  applicationIds.push(second._id);
  assert.equal(record.source, 'admin');
  assert.equal(record.contact.phone, '+905321234567');
  assert.equal(record.answers.kvkk_ack, undefined);
  assert.equal(record.privacy, undefined);
  assert.equal(await User.countDocuments({ email: contact.email }), 0, 'Manuel kayıt hesap açmamalı');
  assert.equal((await request(`${base}?search=${marker}`, admin.token)).pagination.total, 2);
  // Field filters must remain separate and regex metacharacters are plain text.
  for (const searchField of ['all', 'venture']) assert.equal((await request(`${base}?search=${marker.toLowerCase()}&searchField=${searchField}`, admin.token)).pagination.total, 2);
  for (const searchField of ['name', 'email']) assert.equal((await request(`${base}?search=${marker}&searchField=${searchField}`, admin.token)).pagination.total, 0);
  const byName = await request(`${base}?search=${encodeURIComponent(contact.name)}&searchField=name`, admin.token);
  assert.ok(byName.data.some(item => item._id === record._id));
  const byEmail = await request(`${base}?search=${encodeURIComponent(contact.email.toUpperCase())}&searchField=email`, admin.token);
  assert.ok(byEmail.data.some(item => item._id === record._id));
  for (const searchField of ['all', 'name', 'email', 'venture']) assert.equal((await request(`${base}?search=.*&searchField=${searchField}`, admin.token)).pagination.total, 0);
  await request(`${base}?searchField=invalid`, admin.token, 'GET', undefined, 400);
  await request(`${base}?searchField=name&searchField=email`, admin.token, 'GET', undefined, 400);
  assert.equal((await request(base, admin.token)).pagination.total, initialTotal + 2);
  const originalForm = record.form;
  record = (await request(`${base}/${record._id}`, superadmin.token, 'PUT', { revision: record.revision, contact: { ...contact, ventureName: `${marker}-guncel` }, answers: { stage: 'Pilot', solution: 'Doğrulanacak teknik çözüm' }, status: 'draft', source: 'self', form: {}, userId: String(other.user._id) })).data;
  assert.equal(record.answers.stage, 'Pilot');
  assert.equal(record.answers.solution, 'Doğrulanacak teknik çözüm');
  assert.deepEqual(record.form, originalForm);
  assert.equal(record.status, 'submitted');
  assert.equal(record.source, 'admin');
  assert.equal(record.applicant.email, contact.email);
  await request(`${base}/${record._id}`, superadmin.token, 'PUT', { revision: record.revision - 1, contact }, 409);
  await request(`${base}/${record._id}`, superadmin.token, 'PUT', { revision: record.revision, contact, answers: { kvkk_ack: true } }, 422);
  for (const role of denied) {
    await request(`${base}/${record._id}`, role.token, 'PUT', { revision: record.revision, contact }, 403);
    await request(`${base}/${record._id}/archive`, role.token, 'POST', { revision: record.revision }, 403);
    await request(`${base}/${record._id}/restore`, role.token, 'POST', { revision: record.revision }, 403);
  }
  const document = await Document.create({ userId: owner.user._id, applicationId: record._id, name: 'qa.pdf', mimeType: 'application/pdf', contents: Buffer.from('%PDF-1.4\nQA') });
  record = (await request(`${base}/${record._id}/archive`, superadmin.token, 'POST', { revision: record.revision })).data;
  assert.ok(record.archivedAt);
  assert.equal((await request(`${base}?search=${marker}`, admin.token)).pagination.total, 1);
  assert.equal((await request(`${base}?view=archived&search=${marker}`, admin.token)).pagination.total, 1);
  assert.ok(await Document.exists({ _id: document._id }), 'Havuzdan çıkarma evrakı silmemeli');
  await request(`${base}/${record._id}`, superadmin.token, 'PUT', { revision: record.revision, contact }, 404);
  record = (await request(`${base}/${record._id}/restore`, superadmin.token, 'POST', { revision: record.revision })).data;
  assert.equal(record.archivedAt, null);
  assert.equal((await request(`${base}?search=${marker}`, admin.token)).pagination.total, 2);
  const pdf = await request(`${base}/${record._id}/export?format=pdf`, admin.token);
  assert.equal(Buffer.from(await pdf.arrayBuffer()).subarray(0, 5).toString(), '%PDF-');
  const linked = (await request(base, superadmin.token, 'POST', { userId: String(owner.user._id), contact: { ...contact, email: owner.user.email, ventureName: `${marker}-hesap` } }, 201)).data;
  applicationIds.push(linked._id);
  // The registered account email remains searchable after contact email edits.
  const changedContact = (await request(`${base}/${linked._id}`, superadmin.token, 'PUT', { revision: linked.revision, contact: { ...linked.contact, email: `contact-${marker}@example.com` } })).data;
  assert.equal(changedContact.contact.email, `contact-${marker}@example.com`);
  const registeredEmail = await request(`${base}?search=${encodeURIComponent(owner.user.email)}&searchField=email`, admin.token);
  assert.ok(registeredEmail.data.some(item => item._id === linked._id));
  await request(base, superadmin.token, 'POST', { userId: String(owner.user._id), contact }, 409);
  assert.equal((await request('/entrepreneurs/my', owner.token)).data.application._id, linked._id);
  assert.equal((await request('/entrepreneurs/my', other.token)).data.application, null);
  assert.equal((await request(`${base}/accounts?search=${owner.user.email}`, admin.token)).data.length, 0);
  await request(`${base}/form`, admin.token, 'GET', undefined, 403);
  const selfForm = (await request('/entrepreneurs/my', self.token)).data.form;
  const selfAnswers = Object.fromEntries([...selfForm.questions, ...(selfForm.agreements || [])].filter(q => q.required && q.type !== 'file').map(q => [q.id,
    q.type === 'consent' ? true : q.type === 'multipleChoice' ? [q.options[0]] : q.type === 'singleChoice' ? q.options[0] : q.inputType === 'email' ? self.user.email : q.inputType === 'tel' ? '0532 123 45 67' : q.inputType === 'date' ? '2025-01-01' : q.inputType === 'number' ? '3' : q.inputType === 'url' ? 'https://example.com' : 'Yerel test yanıtı',
  ]));
  selfAnswers.venture_name = `${marker}-self`;
  let own = (await request('/entrepreneurs/my', self.token, 'PUT', { answers: selfAnswers, formVersion: selfForm.version })).data.application;
  applicationIds.push(own._id);
  const upload = new FormData();
  upload.append('revision', String(own.revision));
  upload.append('file', new Blob([Buffer.from('%PDF-1.4\nQA')], { type: 'application/pdf' }), 'qa-sunum.pdf');
  own = (await request('/entrepreneurs/documents/pitch_deck', self.token, 'POST', upload, 201)).data.application;
  own = (await request('/entrepreneurs/my', self.token, 'PUT', { answers: selfAnswers, revision: own.revision, formVersion: selfForm.version, submit: true })).data.application;
  const beforeEdit = (await request(`${base}/${own._id}`, admin.token)).data;
  let edited = (await request(`${base}/${own._id}`, superadmin.token, 'PUT', { revision: beforeEdit.revision, contact: { ...contact, email: self.user.email, ventureName: `${marker}-self-updated` }, answers: { stage: 'Teknik pilot' } })).data;
  assert.deepEqual(edited.privacy, beforeEdit.privacy);
  assert.deepEqual(edited.form, beforeEdit.form);
  assert.deepEqual(edited.documents, beforeEdit.documents);
  for (const agreement of ['kvkk_ack', 'privacy_policy_ack', 'terms_ack']) assert.deepEqual(edited.answers[agreement], beforeEdit.answers[agreement]);
  edited = (await request(`${base}/${own._id}/archive`, superadmin.token, 'POST', { revision: edited.revision })).data;
  assert.equal((await request('/entrepreneurs/my', self.token)).data.application._id, own._id);
  await request(`/entrepreneurs/documents/${own.documents[0]._id}`, self.token);
  await request('/entrepreneurs/my/export?format=pdf', self.token);
  await request(`${base}/${own._id}/restore`, superadmin.token, 'POST', { revision: edited.revision });
  console.log('OK: Excel şablonu/önizleme/kişi eşleştirme/kayıt; dosya ve sürüm kontrolleri; alan bazlı arama; havuz yönetimi; yetkiler; PDF ve evrak koruması.');
} finally {
  // Remove only this run’s explicitly disposable fixtures, including failed-run records.
  const created = await Application.find({ 'contact.ventureName': { $regex: `^${marker}` } }).select('_id').lean();
  const allApplicationIds = [...applicationIds, ...created.map(item => item._id)];
  await Document.deleteMany({ applicationId: { $in: allApplicationIds } });
  await Application.deleteMany({ _id: { $in: allApplicationIds } });
  await User.deleteMany({ _id: { $in: ids } });
  try {
    for (const [name, documents] of originals) for (const document of documents) assert.equal(hash(await mongoose.connection.db.collection(name).findOne({ _id: document._id })), document.hash, `${name}: özgün kayıt değişmemeli`);
    console.log('OK: Test kayıtları temizlendi; mevcut başvurular, evraklar ve soru setleri birebir korundu.');
  } finally { await mongoose.disconnect(); }
}
