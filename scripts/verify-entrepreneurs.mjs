import { requireAuthSandbox, mailpitCodes } from './auth-verification.mjs';
import { verificationTarget } from './verification-target.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';

const requireAPI = createRequire(new URL('../ideathon.api/package.json', import.meta.url));
const mongoose = requireAPI('mongoose');
const dotenv = requireAPI('dotenv');
const env = dotenv.parse(readFileSync(new URL('../ideathon.api/.env', import.meta.url)));
assert.equal(env.MONGODB_URI, 'mongodb://127.0.0.1:27027/ideathon_local', 'Bu test yalnızca yerel veritabanında çalışır.');
const target = verificationTarget(env.MONGODB_URI);
requireAuthSandbox(target);
const mailbox = mailpitCodes();
const pendingEmails = [];
const base = `${target.apiOrigin}/api`;
const userIds = [];
await mongoose.connect(target.mongoURI);
const User = requireAPI('./src/models/User');
const Application = requireAPI('./src/models/EntrepreneurApplication');
const Document = requireAPI('./src/models/EntrepreneurDocument');
const Settings = requireAPI('./src/models/EntrepreneurFormSettings');
const FormDraft = requireAPI('./src/models/EntrepreneurFormDraft');
let settingsBefore;
let lastSettingsRevision;

async function request(path, { token, method = 'GET', body, expected = 200 } = {}) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const response = await fetch(base + path, { method, headers, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000) });
  const failure = response.status === expected ? '' : (await response.clone().json().catch(() => ({}))).message || '';
  assert.equal(response.status, expected, `${method} ${path}: beklenen HTTP ${expected}, gelen ${response.status}. ${failure}`);
  return response;
}

async function createTestUser() {
  const email = `entrepreneur-qa-${randomBytes(8).toString('hex')}@example.com`;
  pendingEmails.push(email);
  const response = await request('/auth/register', { method: 'POST', expected: 202, body: { name: 'Yerel Girişimci Testi', email, password: randomBytes(24).toString('base64url') } });
  const begun = (await response.json()).data;
  const code = await mailbox.read(email);
  const { data } = await (await request('/auth/register/verify', { method: 'POST', expected: 201, body: { registrationToken: begun.registrationToken, code } })).json();
  userIds.push(data.user._id);
  assert.equal(data.user.ideathonId, null);
  return data.token;
}

async function createRoleToken(role) {
  const user = await User.create({ name: 'Yerel Havuz Testi', email: `pool-${randomBytes(8).toString('hex')}@example.com`, password: randomBytes(24).toString('base64url'), role });
  userIds.push(String(user._id));
  return requireAPI('jsonwebtoken').sign({ userId: String(user._id), role }, env.JWT_SECRET, { expiresIn: '10m' });
}

try {
  const token = await createTestUser();
  const otherToken = await createTestUser();
  const adminToken = await createRoleToken('admin');
  const superadminToken = await createRoleToken('superadmin');
  const deniedTokens = [token, await createRoleToken('mentor'), await createRoleToken('juri'), await createRoleToken('support')];
  // Initialize the legacy draft before tests temporarily change global settings.
  const alreadyImported = await FormDraft.exists({ legacyKey: 'entrepreneur' });
  const initialLibrary = (await (await request('/entrepreneurs/admin/form/drafts', { token: superadminToken })).json()).data;
  assert.ok(initialLibrary.items.length >= 1);
  const legacySnapshot = await FormDraft.findOne({ legacyKey: 'entrepreneur' }).lean();
  if (!alreadyImported) assert.deepEqual(legacySnapshot.form, (await Settings.findById('entrepreneur').lean()).draft);
  await Promise.all([1, 2].map(() => request('/entrepreneurs/admin/form/drafts', { token: superadminToken })));
  assert.equal(await FormDraft.countDocuments({ legacyKey: 'entrepreneur' }), 1);
  const searchKey = `Havuz-${randomBytes(8).toString('hex')}`;
  await request('/entrepreneurs/my', { expected: 401 });
  await request('/entrepreneurs/my/export?format=pdf', { expected: 401 });
  await request('/entrepreneurs/my/export?format=pdf', { token, expected: 404 });
  const initial = await (await request('/entrepreneurs/my', { token })).json();
  const form = initial.data.form;
  assert.equal(form.questions.length, 21);
  assert.deepEqual(form.agreements.map(item => item.id), ['privacy_policy_ack', 'terms_ack']);
  assert.equal(initial.data.application, null);
  await request('/entrepreneurs/my', { token, method: 'PUT', body: { answers: {}, formVersion: form.version, submit: true }, expected: 422 });
  const draft = await (await request('/entrepreneurs/my', { token, method: 'PUT', body: { answers: { venture_name: 'Örnek yerel girişim' }, formVersion: form.version } })).json();
  let application = draft.data.application;
  assert.equal(application.status, 'draft');
  await request('/entrepreneurs/my/export?format=pdf', { token, expected: 404 });
  const reloaded = await (await request('/entrepreneurs/my', { token })).json();
  assert.equal(reloaded.data.application.answers.venture_name, 'Örnek yerel girişim');
  assert.equal((await (await request('/entrepreneurs/my', { token: otherToken })).json()).data.application, null);
  await request('/entrepreneurs/my', { token, method: 'PUT', expected: 409, body: { answers: {}, revision: 999, formVersion: form.version } });
  console.log('OK: Bağımsız kayıt, oturum koruması, taslak kaydı, yeniden yükleme ve sürüm çakışması');

  function uploadBody(contents, name, type, revision) {
    const data = new FormData();
    data.append('revision', String(revision));
    data.append('file', new Blob([contents], { type }), name);
    return data;
  }
  await request('/entrepreneurs/documents/pitch_deck', { token, method: 'POST', expected: 422, body: uploadBody('<script/>', 'invalid.pdf', 'application/pdf', application.revision) });
  await request('/entrepreneurs/documents/pitch_deck', { token, method: 'POST', expected: 422, body: uploadBody(new Uint8Array(10 * 1024 * 1024 + 1), 'oversize.pdf', 'application/pdf', application.revision) });
  const pdf = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n';
  const documentName = 'girişim-çığ-şirket.pdf';
  application = (await (await request('/entrepreneurs/documents/pitch_deck', { token, method: 'POST', expected: 201, body: uploadBody(pdf, documentName, 'application/pdf', application.revision) })).json()).data.application;
  let document = application.documents[0];
  assert.equal(document.name, documentName);
  await request(`/entrepreneurs/admin/${application._id}`, { token: adminToken, expected: 404 });
  await request(`/entrepreneurs/admin/${application._id}/documents/${document._id}`, { token: adminToken, expected: 404 });
  const draftPool = await (await request('/entrepreneurs/admin', { token: adminToken })).json();
  assert.ok(!draftPool.data.some(item => item._id === application._id));
  await request(`/entrepreneurs/admin/${application._id}/export?format=pdf`, { token: adminToken, expected: 404 });
  await request('/entrepreneurs/documents/pitch_deck', { token, method: 'POST', expected: 422, body: uploadBody(pdf, 'ikinci.pdf', 'application/pdf', application.revision) });
  await request(`/entrepreneurs/documents/${document._id}`, { expected: 401 });
  await request(`/entrepreneurs/documents/${document._id}`, { token: otherToken, expected: 404 });
  const download = await request(`/entrepreneurs/documents/${document._id}`, { token });
  assert.match(download.headers.get('content-disposition'), /^attachment/);
  assert.ok(download.headers.get('content-disposition').includes(encodeURIComponent(documentName)));
  assert.equal(await download.text(), pdf);
  application = (await (await request(`/entrepreneurs/documents/${document._id}`, { token, method: 'DELETE', body: { revision: application.revision } })).json()).data.application;
  assert.equal(application.documents.length, 0);
  await request(`/entrepreneurs/documents/${document._id}`, { token, expected: 404 });
  application = (await (await request('/entrepreneurs/documents/pitch_deck', { token, method: 'POST', expected: 201, body: uploadBody(pdf, documentName, 'application/pdf', application.revision) })).json()).data.application;
  console.log('OK: Evrak yükleme/indirme/kaldırma, boyut ve içerik doğrulaması, kullanıcılar arası erişim engeli');

  const answers = {};
  for (const question of [...form.questions, ...form.agreements]) {
    if (question.type === 'file') continue;
    answers[question.id] = question.type === 'consent' ? true : question.type === 'multipleChoice' ? question.options.slice(0, 2) : question.type === 'singleChoice' ? question.options[0] : question.inputType === 'email' ? 'local-test@example.com' : question.inputType === 'url' ? 'https://example.com' : question.inputType === 'tel' ? '+905321234567' : question.inputType === 'date' ? '2024-02-29' : 'Yerel örnek yanıt';
  }
  answers.venture_name = `${searchKey} [örnek]`;
  for (const submit of [false, true]) {
    const rejected = await (await request('/entrepreneurs/my', { token, method: 'PUT', expected: 422, body: { answers: { ...answers, phone: 'abc' }, submit, revision: application.revision, formVersion: form.version } })).json();
    assert.ok(rejected.errors.phone);
  }
  await request('/entrepreneurs/my', { token, method: 'PUT', expected: 422, body: { answers: { ...answers, city: 'Geçersiz seçim' }, revision: application.revision, formVersion: form.version } });
  for (const company_founded of ['2025-02-29', '2026-04-31', 'belirsiz']) {
    const rejected = await (await request('/entrepreneurs/my', { token, method: 'PUT', expected: 422, body: { answers: { ...answers, company_founded }, submit: true, revision: application.revision, formVersion: form.version } })).json();
    assert.deepEqual(Object.keys(rejected.errors), ['company_founded']);
  }
  for (const id of ['kvkk_ack', ...form.agreements.map(item => item.id)]) {
    for (const value of [undefined, false, 'true']) {
      const rejected = await (await request('/entrepreneurs/my', { token, method: 'PUT', expected: 422, body: { answers: { ...answers, [id]: value }, submit: true, revision: application.revision, formVersion: form.version } })).json();
      assert.deepEqual(Object.keys(rejected.errors), [id]);
    }
  }
  application = (await (await request('/entrepreneurs/my', { token, method: 'PUT', body: { answers: { ...answers, phone: '0532 123 45 67' }, submit: true, revision: application.revision, formVersion: form.version } })).json()).data.application;
  assert.equal(application.answers.phone, '+905321234567');
  assert.equal(application.status, 'submitted');
  assert.ok(application.submittedAt);
  assert.equal(application.privacy.text, form.privacy.text);
  assert.equal(application.privacy.acknowledgedAt, application.submittedAt);
  assert.deepEqual(application.privacy.agreements, form.agreements.map(({ id, label, url, version, acknowledgement }) => ({ id, label, url, version, acknowledgement, acceptedAt: application.submittedAt })));
  assert.equal(application.answers.stage, answers.stage);
  assert.equal(application.answers.company_founded, '2024-02-29');
  assert.deepEqual(application.answers.focus_areas, answers.focus_areas);
  await request('/entrepreneurs/my', { token, method: 'PUT', expected: 409, body: { answers, revision: application.revision, formVersion: form.version } });
  await request(`/entrepreneurs/documents/${application.documents[0]._id}`, { token, method: 'DELETE', body: { revision: application.revision }, expected: 409 });
  const final = (await (await request('/entrepreneurs/my', { token })).json()).data;
  assert.equal(final.application.status, 'submitted');
  assert.equal(final.form.version, form.version);
  console.log('OK: Tüm soru türleriyle başvuru gönderimi, kalıcılık ve gönderim sonrası değişiklik koruması');

  const ownPdf = await request('/entrepreneurs/my/export?format=pdf', { token });
  assert.equal(ownPdf.headers.get('cache-control'), 'no-store');
  assert.match(ownPdf.headers.get('content-type'), /application\/pdf/);
  assert.match(application.applicationNumber, /^AFZ\d{2}\d{3,}$/);
  assert.ok(ownPdf.headers.get('content-disposition').includes(application.applicationNumber));
  const ownPdfContents = Buffer.from(await ownPdf.arrayBuffer());
  assert.equal(ownPdfContents.subarray(0, 5).toString(), '%PDF-');
  assert.ok(ownPdfContents.length > 1000);
  await request('/entrepreneurs/my/export?format=pdf', { token: otherToken, expected: 404 });
  await request('/entrepreneurs/my/export?format=docx', { token, expected: 400 });
  await request('/entrepreneurs/my/export?format=html', { token, expected: 400 });
  await request('/entrepreneurs/my/export?format=pdf&format=pdf', { token, expected: 400 });

  const detailPath = `/entrepreneurs/admin/${application._id}`;
  const filePath = `${detailPath}/documents/${application.documents[0]._id}`;
  for (const path of ['/entrepreneurs/admin', detailPath, filePath, `${detailPath}/export?format=pdf`, `${detailPath}/export?format=docx`]) {
    await request(path, { expected: 401 });
    for (const deniedToken of deniedTokens) await request(path, { token: deniedToken, expected: 403 });
  }
  for (const managerToken of [adminToken, superadminToken]) {
    const pool = await (await request(`/entrepreneurs/admin?search=${encodeURIComponent(searchKey)}`, { token: managerToken })).json();
    assert.equal(pool.pagination.total, 1);
    assert.equal(pool.data[0]._id, application._id);
    assert.equal(pool.data[0].ventureName, answers.venture_name);
    assert.equal(pool.data[0].documentCount, 1);
    assert.equal(pool.data[0].questionCount, 21);
    assert.equal(pool.data[0].answers, undefined);
    const detail = (await (await request(detailPath, { token: managerToken })).json()).data;
    assert.deepEqual(detail.answers, answers);
    assert.deepEqual(detail.form, form);
    assert.deepEqual(detail.privacy.agreements, application.privacy.agreements);
    assert.equal(detail.applicant._id, userIds[0]);
    assert.deepEqual(Object.keys(detail.applicant).sort(), ['_id', 'email', 'name']);
    assert.equal(detail.documents[0]._id, application.documents[0]._id);
    assert.equal(detail.documents[0].name, documentName);
    const adminDownload = await request(filePath, { token: managerToken });
    assert.equal(adminDownload.headers.get('cache-control'), 'no-store');
    assert.match(adminDownload.headers.get('content-disposition'), /^attachment/);
    assert.ok(adminDownload.headers.get('content-disposition').includes(encodeURIComponent(documentName)));
    assert.equal(await adminDownload.text(), pdf);
    for (const format of ['pdf']) {
      const exported = await request(`${detailPath}/export?format=${format}`, { token: managerToken });
      assert.equal(exported.headers.get('cache-control'), 'no-store');
      assert.match(exported.headers.get('content-disposition'), /^attachment/);
      assert.ok(exported.headers.get('content-disposition').includes(`.${format}`));
      assert.match(exported.headers.get('content-type'), /application\/pdf/);
      const contents = Buffer.from(await exported.arrayBuffer());
      assert.ok(contents.length > 1000);
      assert.equal(contents.subarray(0, 5).toString(), '%PDF-');
    }
  }
  // Havuz seçili Ideathon'a göre kaybolmaz.
  const globalResponse = await fetch(`${base}/entrepreneurs/admin?search=${encodeURIComponent(searchKey)}`, { headers: { Authorization: `Bearer ${adminToken}`, 'X-Ideathon-Id': new mongoose.Types.ObjectId().toString() } });
  assert.equal(globalResponse.status, 200);
  assert.equal((await globalResponse.json()).pagination.total, 1);
  for (const query of ['page=0', 'limit=51', 'sort=invalid', 'search=a&search=b']) await request(`/entrepreneurs/admin?${query}`, { token: adminToken, expected: 400 });
  await request(`${detailPath}/export?format=docx`, { token: adminToken, expected: 400 });
  await request(`${detailPath}/export?format=html`, { token: adminToken, expected: 400 });
  await request('/entrepreneurs/admin/invalid-id/export?format=pdf', { token: adminToken, expected: 404 });
  await request('/entrepreneurs/admin/invalid-id', { token: adminToken, expected: 404 });
  await request(`${detailPath}/documents/${new mongoose.Types.ObjectId()}`, { token: adminToken, expected: 404 });

  // Yeni bir soru seti mevcut başvurunun saklanan başlıklarını değiştirmez.
  const nextForm = structuredClone(form);
  nextForm.version = 'qa-next-version';
  nextForm.questions[0].label = 'Değişen soru başlığı';
  nextForm.questions.push({ id: 'extra_question', section: 'contact', type: 'textarea', label: 'Dinamik ek soru', required: false });
  const second = await Application.create({ userId: userIds[1], form: nextForm, answers: { ...answers, venture_name: `${searchKey} ikinci`, extra_question: 'Soru sayısı dinamik' }, status: 'submitted', submittedAt: new Date(Date.now() + 1000) });
  const otherOwnPdf = await request(`/entrepreneurs/my/export?format=pdf&applicationId=${application._id}&userId=${userIds[0]}`, { token: otherToken });
  assert.ok(otherOwnPdf.headers.get('content-disposition').includes(second.applicationNumber), 'Client-supplied IDs must not select another applicant');
  assert.ok(!otherOwnPdf.headers.get('content-disposition').includes(application.applicationNumber));
  await otherOwnPdf.arrayBuffer();
  const firstOwnPdf = await request(`/entrepreneurs/my/export?format=pdf&applicationId=${second._id}`, { token });
  assert.ok(firstOwnPdf.headers.get('content-disposition').includes(application.applicationNumber));
  await firstOwnPdf.arrayBuffer();
  console.log('OK: Girişimci kendi gönderilmiş başvurusunu PDF indirir; taslaklar, oturumsuz erişim, farklı format ve başka hesaba erişim engellenir');
  const secondDetail = (await (await request(`/entrepreneurs/admin/${second._id}`, { token: adminToken })).json()).data;
  assert.equal(secondDetail.form.questions.length, 22);
  assert.equal(secondDetail.answers.extra_question, 'Soru sayısı dinamik');
  assert.equal((await (await request(detailPath, { token: adminToken })).json()).data.form.questions[0].label, form.questions[0].label);
  await request(`/entrepreneurs/admin/${second._id}/documents/${application.documents[0]._id}`, { token: adminToken, expected: 404 });
  const pageOne = await (await request(`/entrepreneurs/admin?search=${searchKey}&limit=1`, { token: adminToken })).json();
  const pageTwo = await (await request(`/entrepreneurs/admin?search=${searchKey}&limit=1&page=2`, { token: adminToken })).json();
  assert.equal(pageOne.pagination.total, 2);
  assert.equal(pageOne.pagination.pages, 2);
  assert.equal(pageOne.data[0]._id, String(second._id));
  assert.equal(pageTwo.data[0]._id, application._id);
  const oldest = await (await request(`/entrepreneurs/admin?search=${searchKey}&limit=1&sort=oldest`, { token: adminToken })).json();
  assert.equal(oldest.data[0]._id, application._id);
  const literal = await (await request(`/entrepreneurs/admin?search=${encodeURIComponent(`${searchKey} [örnek]`)}`, { token: adminToken })).json();
  assert.equal(literal.pagination.total, 1);
  const noMatch = await (await request(`/entrepreneurs/admin?search=${searchKey}-missing`, { token: adminToken })).json();
  assert.equal(noMatch.pagination.total, 0);
  console.log('OK: Admin/superadmin havuzu, arama/sıralama/sayfalama, dinamik başvuru detayları, güvenli evrak erişimi, taslak ve yetki koruması');

  // V1 taslakları yanıtlarını kaybetmeden yenilenir; belgesiz gönderim havuzda görünür.
  const legacyToken = await createTestUser();
  const legacyForm = structuredClone(requireAPI('./tests/fixtures/entrepreneurFormV2.json'));
  legacyForm.version = 1;
  legacyForm.questions = legacyForm.questions.map(q => q.id === 'city' ? { id: 'city', section: 'contact', type: 'text', required: true, maxLength: 100 } : q.id === 'pitch_deck' ? { ...q, required: true } : q);
  const legacyDraft = await Application.create({ userId: userIds.at(-1), form: legacyForm, answers: { city: 'istanbul', venture_name: 'Belgesiz test' } });
  await request('/entrepreneurs/my', { token: legacyToken, method: 'PUT', expected: 409, body: { answers: legacyDraft.answers, revision: 0, formVersion: 1 } });
  const migrated = (await (await request('/entrepreneurs/my', { token: legacyToken })).json()).data;
  assert.equal(migrated.form.version, requireAPI('./src/config/entrepreneurForm').version);
  assert.equal(migrated.application.revision, 1);
  assert.equal(migrated.application.answers.city, 'İstanbul');
  assert.equal(migrated.application.answers.venture_name, 'Belgesiz test');
  assert.equal(migrated.form.questions.find(q => q.id === 'city').options.length, 81);
  assert.ok(migrated.form.questions.filter(q => q.type === 'file').every(q => !q.required));
  assert.equal((await (await request('/entrepreneurs/my', { token: legacyToken })).json()).data.application.revision, 1);
  const noFileAnswers = { ...answers, venture_name: `Belgesiz-${randomBytes(8).toString('hex')}`, city: 'Iğdır' };
  for (const city of ['', 'Listede olmayan şehir']) {
    const rejected = await (await request('/entrepreneurs/my', { token: legacyToken, method: 'PUT', expected: 422, body: { answers: { ...noFileAnswers, city }, submit: true, revision: 1, formVersion: migrated.form.version } })).json();
    assert.deepEqual(Object.keys(rejected.errors), ['city']);
  }
  const noFileApplication = (await (await request('/entrepreneurs/my', { token: legacyToken, method: 'PUT', body: { answers: noFileAnswers, submit: true, revision: 1, formVersion: migrated.form.version } })).json()).data.application;
  assert.equal(noFileApplication.status, 'submitted');
  assert.equal(noFileApplication.documents.length, 0);
  const noFilePool = (await (await request(`/entrepreneurs/admin?search=${encodeURIComponent(noFileAnswers.venture_name)}`, { token: adminToken })).json()).data;
  assert.equal(noFilePool.length, 1);
  assert.equal(noFilePool[0].documentCount, 0);
  const noFileDetail = (await (await request(`/entrepreneurs/admin/${noFileApplication._id}`, { token: adminToken })).json()).data;
  assert.equal(noFileDetail.answers.city, 'Iğdır');
  assert.equal(noFileDetail.documents.length, 0);
  console.log('OK: Taslak sürüm geçişi, zorunlu/geçerli şehir seçimi ve belgesiz başvurunun havuzda görüntülenmesi');

  // Previously opened Word forms gain the new controls without losing their snapshot.
  const oldWordToken = await createTestUser();
  const oldWordForm = structuredClone(form);
  delete oldWordForm.agreements;
  oldWordForm.version = 'qa-before-agreements';
  const oldWordAnswers = { venture_name: 'Eski taslak korunuyor', kvkk_ack: true };
  await Application.create({ userId: userIds.at(-1), form: oldWordForm, answers: oldWordAnswers });
  const upgradedWord = (await (await request('/entrepreneurs/my', { token: oldWordToken })).json()).data;
  assert.deepEqual(upgradedWord.form.questions, oldWordForm.questions);
  assert.deepEqual(upgradedWord.form.agreements, form.agreements);
  assert.deepEqual(upgradedWord.application.answers, oldWordAnswers);
  assert.equal(upgradedWord.application.revision, 1);
  await request('/entrepreneurs/my', { token: oldWordToken, method: 'PUT', expected: 409, body: { answers, revision: 0, formVersion: oldWordForm.version, submit: true } });
  const unacceptedAnswers = { ...answers };
  for (const agreement of form.agreements) delete unacceptedAnswers[agreement.id];
  const rejectedWord = await (await request('/entrepreneurs/my', { token: oldWordToken, method: 'PUT', expected: 422, body: { answers: unacceptedAnswers, revision: 1, formVersion: upgradedWord.form.version, submit: true } })).json();
  assert.deepEqual(Object.keys(rejectedWord.errors).sort(), ['privacy_policy_ack', 'terms_ack']);
  assert.equal((await (await request('/entrepreneurs/my', { token: oldWordToken })).json()).data.application.revision, 1);
  console.log('OK: KVKK, gizlilik ve kullanım şartları ayrı ayrı zorunlu; onay kayıtları havuz detayında; eski taslakta yeni onaylar atlanamıyor');

  // Only superadmin can manage the form. Save and publish are separate and use
  // optimistic revisions; real settings are restored conditionally in finally.
  for (const deniedToken of [adminToken, ...deniedTokens]) {
    for (const [path, method] of [['/entrepreneurs/admin/form', 'GET'], ['/entrepreneurs/admin/form', 'PUT'], ['/entrepreneurs/admin/form/publish', 'POST']]) {
      await request(path, { token: deniedToken, method, body: method === 'GET' ? undefined : {}, expected: 403 });
    }
  }
  settingsBefore = (await (await request('/entrepreneurs/admin/form', { token: superadminToken })).json()).data;
  const changed = structuredClone(settingsBefore.draft);
  changed.agreements = []; // Settings must not allow removal of mandatory controls.
  changed.questions = changed.questions.filter(q => q.id !== 'last_name');
  changed.questions[0] = { ...changed.questions[0], label: 'Dinamik ad sorusu', type: 'textarea' };
  changed.questions.splice(0, 0, { id: 'custom_question', section: 'contact', type: 'singleChoice', label: 'Yeni dinamik soru', required: true, options: ['Birinci', 'İkinci'] });
  const freshToken = await createTestUser();
  let config = (await (await request('/entrepreneurs/admin/form', { token: superadminToken, method: 'PUT', body: { form: changed, revision: settingsBefore.revision } })).json()).data;
  lastSettingsRevision = config.revision;
  assert.equal(config.active.version, settingsBefore.active.version);
  assert.equal((await (await request('/entrepreneurs/my', { token: freshToken })).json()).data.form.version, settingsBefore.active.version);
  await request('/entrepreneurs/admin/form/publish', { token: superadminToken, method: 'POST', body: { form: changed, revision: settingsBefore.revision }, expected: 409 });
  config = (await (await request('/entrepreneurs/admin/form/publish', { token: superadminToken, method: 'POST', body: { form: changed, revision: config.revision } })).json()).data;
  lastSettingsRevision = config.revision;
  const active = (await (await request('/entrepreneurs/my', { token: freshToken })).json()).data.form;
  assert.notEqual(active.version, form.version);
  assert.equal(active.questions[0].id, 'custom_question');
  assert.equal(active.questions[1].type, 'textarea');
  assert.equal(active.questions.some(q => q.id === 'last_name'), false);
  assert.equal(active.questions.length, 21);
  assert.deepEqual(active.agreements, form.agreements);
  await request('/entrepreneurs/my', { token: freshToken, method: 'PUT', expected: 409, body: { answers: {}, formVersion: form.version } });
  const dynamicAnswers = { ...answers, custom_question: 'İkinci', venture_name: searchKey + ' dinamik' };
  delete dynamicAnswers.last_name;
  const dynamicApplication = (await (await request('/entrepreneurs/my', { token: freshToken, method: 'PUT', body: { answers: dynamicAnswers, formVersion: active.version, submit: true } })).json()).data.application;
  const dynamicDetail = (await (await request(`/entrepreneurs/admin/${dynamicApplication._id}`, { token: superadminToken })).json()).data;
  assert.equal(dynamicDetail.form.version, active.version);
  assert.equal(dynamicDetail.answers.custom_question, 'İkinci');
  assert.equal(dynamicDetail.privacy.version, active.privacy.version);
  assert.deepEqual((await (await request(detailPath, { token: superadminToken })).json()).data.form, form);
  console.log('OK: Süperadmin yetkisi, taslak/yayın ayrımı, soru ekleme-silme-tür-sıra değişimi, eşzamanlı düzenleme koruması, yeni formun havuza gönderimi ve eski başvuruların korunması');

  const draftBase = '/entrepreneurs/admin/form/drafts';
  const savedA = (await (await request(draftBase, { token: superadminToken, method: 'POST', expected: 201, body: { name: 'QA ilk soru seti', form } })).json()).data;
  const savedB = (await (await request(draftBase, { token: superadminToken, method: 'POST', expected: 201, body: { name: 'QA ikinci soru seti', form: changed } })).json()).data;
  assert.notEqual(savedA._id, savedB._id);
  for (const [path, method] of [[draftBase, 'GET'], [draftBase, 'POST'], [`${draftBase}/${savedA._id}`, 'GET'], [`${draftBase}/${savedA._id}`, 'PUT'], [`${draftBase}/${savedA._id}/publish`, 'POST']]) {
    await request(path, { method, body: method === 'GET' ? undefined : {}, expected: 401 });
    for (const deniedToken of [adminToken, ...deniedTokens]) await request(path, { token: deniedToken, method, body: method === 'GET' ? undefined : {}, expected: 403 });
  }
  const editedA = structuredClone(savedA.form); editedA.questions[0].label = 'İlk taslaktaki güncel soru';
  const updatedA = (await (await request(`${draftBase}/${savedA._id}`, { token: superadminToken, method: 'PUT', body: { name: 'QA yeniden adlandırılan taslak', form: editedA, revision: savedA.revision } })).json()).data;
  assert.equal(updatedA.revision, savedA.revision + 1);
  assert.equal(updatedA.name, 'QA yeniden adlandırılan taslak');
  assert.deepEqual((await (await request(`${draftBase}/${savedB._id}`, { token: superadminToken })).json()).data.form, savedB.form);
  assert.deepEqual((await (await request(`${draftBase}/${savedA._id}`, { token: superadminToken })).json()).data.form, editedA);
  assert.equal((await (await request('/entrepreneurs/admin/form', { token: superadminToken })).json()).data.active.version, active.version);
  await request(`${draftBase}/${savedA._id}`, { token: superadminToken, method: 'PUT', expected: 409, body: { name: 'Eski sekme', form, revision: savedA.revision } });
  for (const name of ['', ' '.repeat(5), 'x'.repeat(151)]) await request(draftBase, { token: superadminToken, method: 'POST', expected: 422, body: { name, form } });
  const invalidDraftForm = structuredClone(form); invalidDraftForm.questions.pop();
  await request(`${draftBase}/${savedA._id}`, { token: superadminToken, method: 'PUT', expected: 422, body: { name: updatedA.name, form: invalidDraftForm, revision: updatedA.revision } });
  await request(`${draftBase}/invalid-id`, { token: superadminToken, expected: 404 });
  await request(`${draftBase}/${new mongoose.Types.ObjectId()}`, { token: superadminToken, expected: 404 });
  for (const query of ['page=0', 'page=abc', 'page=1&page=2']) await request(`${draftBase}?${query}`, { token: superadminToken, expected: 400 });
  const listed = (await (await request(draftBase, { token: superadminToken })).json()).data;
  assert.ok(listed.items.some(item => item._id === savedA._id && item.name === updatedA.name && item.questionCount === editedA.questions.filter(question => question.type !== 'consent').length));
  assert.ok(listed.items.some(item => item._id === savedB._id));
  assert.equal(listed.items[0].form, undefined);
  assert.ok(listed.items[0].updatedAt);
  await request(`${draftBase}/${savedA._id}/publish`, { token: superadminToken, method: 'POST', expected: 409, body: { revision: savedA.revision, settingsRevision: config.revision } });
  await request(`${draftBase}/${savedA._id}/publish`, { token: superadminToken, method: 'POST', expected: 409, body: { revision: updatedA.revision, settingsRevision: config.revision - 1 } });
  const publishedDraft = (await (await request(`${draftBase}/${savedA._id}/publish`, { token: superadminToken, method: 'POST', body: { revision: updatedA.revision, settingsRevision: config.revision } })).json()).data;
  lastSettingsRevision = publishedDraft.settings.revision;
  assert.deepEqual(publishedDraft.settings.active.questions, editedA.questions);
  assert.deepEqual((await (await request(detailPath, { token: superadminToken })).json()).data.form, form);
  assert.deepEqual((await (await request(`${draftBase}/${savedB._id}`, { token: superadminToken })).json()).data.form, savedB.form);
  console.log('OK: Çoklu adlandırılmış taslak, listeleme/açma, bağımsız düzenleme, sürüm çakışması, süperadmin yetkisi ve seçilen taslağı yayımlama');

} finally {
  if (settingsBefore && lastSettingsRevision !== undefined) {
    const restored = await Settings.updateOne({ _id: 'entrepreneur', revision: lastSettingsRevision }, { $set: { active: settingsBefore.active, draft: settingsBefore.draft, publishedAt: settingsBefore.publishedAt || null, updatedBy: settingsBefore.updatedBy || null }, $inc: { revision: 1 } });
    assert.equal(restored.matchedCount, 1, 'Soru seti test sırasında başka bir oturumda değişti; üzerine yazılmadı.');
  }
  const pendingCollection = mongoose.connection.db.collection('pendingregistrations');
  const attempts = await pendingCollection.find({ email: { $in: pendingEmails } }).toArray();
  userIds.push(...attempts.map(item => item.userId));
  await pendingCollection.deleteMany({ email: { $in: pendingEmails } });
  await mailbox.cleanup();
  await Document.deleteMany({ userId: { $in: userIds } });
  await FormDraft.deleteMany({ createdBy: { $in: userIds }, legacyKey: { $exists: false } });
  await Application.deleteMany({ userId: { $in: userIds } });
  await User.deleteMany({ _id: { $in: userIds } });
  await mongoose.disconnect();
  console.log('Yerel test kayıtları temizlendi.');
}
