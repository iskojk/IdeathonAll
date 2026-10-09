const test = require('node:test');
const assert = require('node:assert/strict');
const initial = require('../src/config/entrepreneurForm');
const { validateForm } = require('../src/services/entrepreneurFormSettings');

test('Application template validates with 20 questions and only two mandatory agreements', () => {
  const result = validateForm(initial);
  assert.equal(result.questions.length, 20);
  assert.equal(result.questions.some(q => q.id === 'kvkk_ack'), false);
  assert.deepEqual(result.agreements.map(q => q.id), ['privacy_policy_ack', 'terms_ack']);
  assert.equal(result.privacy, undefined);
});
test('dynamic count, types and question order are preserved after validation', () => {
  const form = structuredClone(initial);
  form.questions.splice(1, 1);
  form.questions.splice(0, 0, { id: 'custom', section: 'contact', label: 'Yeni soru', type: 'singleChoice', required: false, options: ['Evet', 'Hayır'] });
  const result = validateForm(form);
  assert.equal(result.questions[0].id, 'custom');
  assert.equal(result.questions.length, 20);
  assert.equal(result.questions.some(q => q.id === 'last_name'), false);
});
test('malformed IDs, references, options and limits are rejected', () => {
  for (const mutate of [
    f => { f.questions[0].id = 'constructor'; },
    f => { f.questions[0].id = 'terms_ack'; },
    f => { f.questions[0].id = 'privacy_policy_ack'; },
    f => { f.questions[1].id = f.questions[0].id; },
    f => { f.questions[0].section = 'missing'; },
    f => { f.questions[0].maxLength = 10001; },
    f => { f.questions[0].type = 'html'; },
    f => { f.questions[4].options = ['A', 'A']; },
    f => { f.questions[18].maxFiles = 100; },
    f => { f.questions.push(null); },
  ]) { const form = structuredClone(initial); mutate(form); assert.throws(() => validateForm(form), error => error.status === 422); }
});

test('privacy and terms controls cannot be removed or altered by form settings', () => {
  for (const agreements of [undefined, [], [{ id: 'terms_ack', required: false, url: 'javascript:alert(1)' }]]) {
    const result = validateForm({ ...initial, agreements });
    assert.deepEqual(result.agreements, initial.agreements);
    assert.equal(result.questions.length, 20);
  }
});
test('legacy KVKK is retired without changing the source and empty drafts remain saveable', () => {
  const legacy = structuredClone(initial);
  legacy.sections.push({ id: 'privacy', title: 'KVKK' });
  legacy.questions.push({ id: 'kvkk_ack', section: 'privacy', label: 'KVKK', type: 'consent', required: true, help: 'Eski metin' });
  legacy.privacy = { text: 'Eski metin', version: 'previous', draft: false };
  const original = structuredClone(legacy);
  assert.deepEqual(validateForm(legacy), validateForm(initial));
  assert.deepEqual(legacy, original);
  const empty = { ...initial, sections: [], questions: [] };
  assert.deepEqual(validateForm(empty).questions, []);
  assert.deepEqual(validateForm(empty).agreements, initial.agreements);
  assert.throws(() => validateForm(empty, { forPublication: true }), error => error.status === 422);
  assert.doesNotThrow(() => validateForm(initial, { forPublication: true }));
});
