const test = require('node:test');
const assert = require('node:assert/strict');
const initial = require('../src/config/entrepreneurForm');
const { validateForm } = require('../src/services/entrepreneurFormSettings');

test('Word template validates with 21 questions and a versioned privacy text', () => {
  const result = validateForm(initial);
  assert.equal(result.questions.length, 21);
  assert.equal(result.questions.at(-1).type, 'consent');
  assert.equal(result.privacy.version, initial.privacy.version);
});
test('dynamic count, types and question order are preserved after validation', () => {
  const form = structuredClone(initial);
  form.questions.splice(1, 1);
  form.questions.splice(0, 0, { id: 'custom', section: 'contact', label: 'Yeni soru', type: 'singleChoice', required: false, options: ['Evet', 'Hayır'] });
  const result = validateForm(form);
  assert.equal(result.questions[0].id, 'custom');
  assert.equal(result.questions.length, 21);
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
    assert.equal(result.questions.length, 21);
  }
});
test('KVKK cannot be removed, made optional, moved ahead or replaced by another format', () => {
  for (const mutate of [
    f => f.questions.pop(),
    f => { f.questions.at(-1).required = false; },
    f => { f.questions.at(-1).type = 'text'; },
    f => { f.questions.at(-1).section = 'contact'; },
    f => { f.questions.at(-1).help = ''; },
    f => { f.privacy.draft = false; },
  ]) { const form = structuredClone(initial); mutate(form); assert.throws(() => validateForm(form), error => error.status === 422); }
  const edited = structuredClone(initial); edited.questions.at(-1).help += '\nYeni açıklama.';
  assert.notEqual(validateForm(edited).privacy.version, initial.privacy.version);
});
