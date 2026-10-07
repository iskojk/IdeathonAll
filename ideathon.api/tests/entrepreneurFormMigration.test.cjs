const test = require('node:test');
const assert = require('node:assert/strict');
const template = require('../src/config/entrepreneurForm');
const { draftFormUpgrade } = require('../src/services/entrepreneurFormMigration');

function legacyDraft() {
  const form = structuredClone(require('./fixtures/entrepreneurFormV2.json'));
  form.version = 1;
  form.questions = form.questions.map(q => q.id === 'city' ? { id: 'city', section: 'contact', type: 'text', required: true, maxLength: 100 } : q.id === 'pitch_deck' ? { ...q, required: true } : q);
  return { status: 'draft', form, answers: { city: ' ISTANBUL ', venture_name: 'Korunacak girişim' }, documents: [{ questionId: 'pitch_deck', name: 'sunum.pdf' }] };
}

test('v1 mock drafts keep answers and uploads while adopting optional documents and province selection', () => {
  const draft = legacyDraft();
  const original = structuredClone(draft);
  const upgrade = draftFormUpgrade(draft);
  assert.equal(upgrade.form.version, template.version);
  assert.equal(upgrade.form.questions.find(q => q.id === 'city').options.length, 81);
  assert.ok(upgrade.form.questions.filter(q => q.type === 'file').every(q => !q.required));
  assert.deepEqual(upgrade.answers, { ...original.answers, city: 'İstanbul' });
  assert.deepEqual(upgrade.documents, original.documents);
  assert.deepEqual(upgrade.previousVersions[0].answers, original.answers);
  assert.deepEqual(draft, original);
  assert.equal(draftFormUpgrade({ ...draft, ...upgrade }), null);
});

test('unmatched city text is preserved for correction; Turkish spellings normalize', () => {
  for (const [oldCity, expected] of [['igdir', 'Iğdır'], ['sanliurfa', 'Şanlıurfa'], [' izmir ', 'İzmir'], ['Amsterdam', 'Amsterdam']]) {
    const draft = legacyDraft();
    draft.answers.city = oldCity;
    assert.equal(draftFormUpgrade(draft).answers.city, expected);
  }
});

test('submitted, different and current form snapshots are never rewritten', () => {
  assert.equal(draftFormUpgrade(null), null);
  const draft = legacyDraft();
  for (const application of [
    { ...draft, status: 'submitted' },
    { ...draft, form: { ...draft.form, id: 'other-form' } },
    { ...draft, form: template },
  ]) assert.equal(draftFormUpgrade(application), null);
});

test('open custom forms gain unchecked agreements without changing their questions or existing answers', () => {
  const draft = legacyDraft();
  draft.form.isMock = false;
  draft.form.version = 'custom-published-version';
  draft.answers.kvkk_ack = true;
  draft.answers.terms_ack = true; // A stale or invented value is not consent to the new version.
  const original = structuredClone(draft);
  const upgraded = draftFormUpgrade(draft);
  assert.deepEqual(upgraded.form.questions, original.form.questions);
  assert.deepEqual(upgraded.form.agreements, template.agreements);
  assert.notEqual(upgraded.form.version, original.form.version);
  assert.deepEqual(upgraded.answers, { city: ' ISTANBUL ', venture_name: 'Korunacak girişim', kvkk_ack: true });
  assert.equal(upgraded.documents, undefined);
  assert.deepEqual(draft, original);
  assert.equal(draftFormUpgrade({ ...draft, ...upgraded }), null);
});

test('changed agreement definitions only reset acceptance for the changed agreement', () => {
  const draft = { status: 'draft', form: structuredClone(template), answers: { kvkk_ack: true, privacy_policy_ack: true, terms_ack: true } };
  draft.form.agreements[1].version = 'older';
  const upgraded = draftFormUpgrade(draft);
  assert.deepEqual(upgraded.answers, { kvkk_ack: true, privacy_policy_ack: true });
  assert.equal(draftFormUpgrade({ ...draft, status: 'submitted' }), null);
});

test('v2 Word migration preserves removed answers and merges company documents without assuming consent', () => {
  const draft = legacyDraft(); draft.form.version = 2;
  draft.answers = { full_name: 'Ali Can Yılmaz', notes: 'Saklanacak eski not', problem: 'Eski problem', city: 'ankara', focus_areas: ['Akıllı şehirler', 'Diğer'] };
  draft.documents.push({ questionId: 'company_documents', name: 'şirket.pdf' });
  const upgraded = draftFormUpgrade(draft);
  assert.equal(upgraded.answers.focus_areas, 'Akıllı şehirler, Diğer');
  assert.deepEqual(upgraded.previousVersions[0].answers.focus_areas, ['Akıllı şehirler', 'Diğer']);
  assert.equal(upgraded.answers.first_name, 'Ali Can');
  assert.equal(upgraded.answers.last_name, 'Yılmaz');
  assert.match(upgraded.answers.solution, /Eski problem/);
  assert.equal(upgraded.answers.kvkk_ack, undefined);
  assert.equal(upgraded.previousVersions[0].answers.notes, 'Saklanacak eski not');
  assert.equal(upgraded.documents[1].questionId, 'additional_documents');
  assert.equal(upgraded.previousVersions[0].documents[1].questionId, 'company_documents');
});
