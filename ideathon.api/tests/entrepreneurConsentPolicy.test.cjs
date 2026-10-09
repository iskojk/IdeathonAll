const test = require('node:test');
const assert = require('node:assert/strict');
const Application = require('../src/models/EntrepreneurApplication');
const Settings = require('../src/models/EntrepreneurFormSettings');
const template = require('../src/config/entrepreneurForm');
const { withoutKvkk } = require('../src/services/entrepreneurConsentPolicy');
const router = require('../src/routes/entrepreneurRoutes');

function legacyForm() {
  const form = structuredClone(template);
  form.version = 'previous-publication';
  form.sections.push({ id: 'privacy', title: 'KVKK' });
  form.questions.push({ id: 'kvkk_ack', section: 'privacy', type: 'consent', required: true, label: 'KVKK', help: 'Önceki aydınlatma metni' });
  form.privacy = { text: 'Önceki aydınlatma metni', version: 'old-proof' };
  return form;
}

function validAnswers() {
  return Object.fromEntries([...template.questions, ...template.agreements].filter(q => q.type !== 'file').map(q => [q.id,
    q.type === 'consent' ? true : q.type === 'singleChoice' ? q.options[0] : q.inputType === 'email' ? 'fixture@example.com' : q.inputType === 'tel' ? '+905321234567' : q.inputType === 'date' ? '2024-02-29' : 'Örnek yanıt',
  ]));
}

async function call(method, path, body = {}) {
  const layer = router.stack.find(layer => layer.route?.path === path && layer.route.methods[method]);
  const response = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  await layer.route.stack.at(-1).handle({ user: { _id: '507f1f77bcf86cd799439011' }, body }, response);
  return response;
}

test('retiring KVKK preserves source snapshots and other questions in the same section', () => {
  const form = legacyForm();
  form.questions.push({ id: 'additional_note', section: 'privacy', type: 'text', label: 'Not', required: false, maxLength: 100 });
  const before = structuredClone(form);
  const current = withoutKvkk(form);
  assert.equal(current.questions.some(q => q.id === 'kvkk_ack'), false);
  assert.ok(current.sections.some(s => s.id === 'privacy'));
  assert.ok(current.questions.some(q => q.id === 'additional_note'));
  assert.deepEqual(current.agreements, template.agreements);
  assert.notEqual(current.version, form.version);
  assert.deepEqual(withoutKvkk(current), current);
  assert.deepEqual(form, before);
});

test('new submissions require both remaining agreements and never invent KVKK evidence', async t => {
  t.mock.method(Application, 'findOne', async () => null);
  t.mock.method(Settings, 'findById', () => ({ lean: async () => ({ active: legacyForm() }) }));
  let saved;
  t.mock.method(Application.prototype, 'save', async function () { saved = this; this.__v = 0; return this; });
  const initial = await call('get', '/my');
  const form = initial.body.data.form;
  assert.equal(form.questions.some(q => q.id === 'kvkk_ack'), false);
  for (const id of ['privacy_policy_ack', 'terms_ack']) {
    const rejected = await call('put', '/my', { formVersion: form.version, answers: { ...validAnswers(), [id]: false }, submit: true });
    assert.equal(rejected.statusCode, 422);
    assert.ok(rejected.body.errors[id]);
    assert.equal(saved, undefined);
  }
  const response = await call('put', '/my', { formVersion: form.version, answers: { ...validAnswers(), kvkk_ack: true }, submit: true });
  assert.equal(response.statusCode, 200);
  assert.equal(saved.status, 'submitted');
  assert.equal(saved.answers.kvkk_ack, undefined);
  assert.equal(saved.privacy.acknowledgedAt, undefined);
  assert.deepEqual(saved.privacy.agreements.map(a => a.id), ['privacy_policy_ack', 'terms_ack']);
  assert.ok(saved.privacy.agreements.every(a => a.acceptedAt));
});

test('viewing, editing, cancelling and resubmitting a legacy application retain its historical evidence', async t => {
  const application = new Application({ userId: '507f1f77bcf86cd799439011', status: 'submitted',
    applicationNumber: 'AFZ26001', form: legacyForm(), answers: { ...validAnswers(), kvkk_ack: true }, documents: [], __v: 0,
    privacy: { text: 'Önceki aydınlatma metni', version: 'old-proof', acknowledgedAt: new Date('2026-10-01T10:00:00Z') } });
  t.mock.method(Application, 'findOne', async () => application);
  t.mock.method(Application.prototype, 'save', async function () { this.__v++; return this; });
  const original = application.toObject();
  const view = await call('get', '/my');
  assert.equal(view.body.data.form.questions.some(q => q.id === 'kvkk_ack'), false);
  assert.deepEqual(application.toObject(), original);
  const opened = await call('post', '/my/edit', { revision: application.__v });
  const formVersion = opened.body.data.form.version;
  const updated = { ...validAnswers(), venture_name: 'Düzenlenen girişim' };
  await call('put', '/my', { revision: application.__v, formVersion, answers: updated });
  assert.deepEqual(application.answers, original.answers);
  assert.deepEqual(application.form, original.form);
  assert.deepEqual(application.privacy, original.privacy);
  assert.equal(application.editDraft.answers.venture_name, updated.venture_name);
  await call('post', '/my/cancel-edit', { revision: application.__v });
  assert.deepEqual(application.answers, original.answers);
  assert.deepEqual(application.form, original.form);
  assert.equal(application.editDraft, undefined);
  await call('post', '/my/edit', { revision: application.__v });
  const submitted = await call('put', '/my', { revision: application.__v, formVersion, answers: updated, submit: true });
  assert.equal(submitted.statusCode, 200);
  assert.equal(application.applicationNumber, original.applicationNumber);
  assert.equal(application.answers.venture_name, updated.venture_name);
  assert.equal(application.answers.kvkk_ack, true);
  assert.equal(application.privacy.text, original.privacy.text);
  assert.equal(application.privacy.acknowledgedAt.getTime(), original.privacy.acknowledgedAt.getTime());
  assert.equal(application.form.questions.some(q => q.id === 'kvkk_ack'), false);
  assert.deepEqual(application.privacy.agreements.map(a => a.id), ['privacy_policy_ack', 'terms_ack']);
  assert.equal(submitted.body.data.application.answers.kvkk_ack, undefined);
});
