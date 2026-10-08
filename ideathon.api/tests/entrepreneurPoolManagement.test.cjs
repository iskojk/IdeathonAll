const test = require('node:test');
const assert = require('node:assert/strict');
const { validateContact, updateAnswers } = require('../src/services/entrepreneurPoolManagement');
const Application = require('../src/models/EntrepreneurApplication');
const form = require('../src/config/entrepreneurForm');
const contact = { name: 'Deneme Girişimci', email: 'test@example.com', phone: '0532 123 45 67', ventureName: 'Örnek Girişim' };

test('manual pool entries validate contact and preserve phone formatting', () => {
  assert.equal(validateContact(contact).phone, '+905321234567');
  for (const patch of [{ name: '' }, { email: 'invalid' }, { phone: 'abc' }, { ventureName: [] }]) {
    assert.throws(() => validateContact({ ...contact, ...patch }), error => error.status === 422);
  }
});

test('admins may edit answers without changing consent evidence or unrelated answers', () => {
  const before = { stage: 'Fikir', solution: 'Mevcut çözüm', kvkk_ack: true, privacy_policy_ack: true, terms_ack: true };
  const after = updateAnswers(form, before, { stage: 'Pilot' }, validateContact(contact));
  assert.equal(after.stage, 'Pilot');
  assert.equal(after.solution, before.solution);
  for (const id of ['kvkk_ack', 'privacy_policy_ack', 'terms_ack']) {
    assert.equal(after[id], true);
    assert.throws(() => updateAnswers(form, before, { [id]: false }, contact), error => error.status === 422);
  }
  assert.deepEqual(before, { stage: 'Fikir', solution: 'Mevcut çözüm', kvkk_ack: true, privacy_policy_ack: true, terms_ack: true });
  assert.throws(() => updateAnswers(form, before, { nonexistent: 'value' }, contact), error => error.status === 422);
});

test('manual entry does not manufacture consent or require an account; self submissions retain account requirement', async () => {
  const answers = updateAnswers(form, {}, {}, validateContact(contact));
  assert.equal(answers.kvkk_ack, undefined);
  assert.equal(answers.privacy_policy_ack, undefined);
  assert.equal(answers.first_name, 'Deneme');
  await new Application({ source: 'admin', form, answers, contact, status: 'submitted' }).validate();
  await assert.rejects(new Application({ form }).validate(), error => !!error.errors.userId);
});

test('imported multipart names preserve the original first-name and surname answers', () => {
  const source = { first_name: 'Ayşe Deniz', last_name: 'Yılmaz Kaya' };
  const person = { ...contact, name: 'Ayşe Deniz Yılmaz Kaya' };
  const result = updateAnswers(form, {}, source, person);
  assert.equal(result.first_name, source.first_name); assert.equal(result.last_name, source.last_name);
  const renamed = updateAnswers(form, result, {}, { ...person, name: 'Farklı Kişi' });
  assert.equal(renamed.first_name, 'Farklı'); assert.equal(renamed.last_name, 'Kişi');
});
