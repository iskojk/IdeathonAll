const test = require('node:test');
const assert = require('node:assert/strict');
const User = require('../src/models/User');
const account = phone => new User({ name: 'Test Hesabı', email: 'phone-test@example.com', password: 'test-only-secret', phone });

test('registration phone keys normalize equivalent domestic and international formats', async () => {
  for (const phone of ['0532 123 45 67', '+90 (532) 123-45-67', '00905321234567']) {
    const user = account(phone);
    await user.validate();
    assert.equal(user.phoneKey, '+905321234567');
    assert.equal(user.phone, phone, 'Displayed phone is preserved');
  }
});
test('invalid new phone fails model validation, empty phones are outside the unique index', async () => {
  await assert.rejects(account('abc').validate(), /Geçerli bir telefon numarası/);
  const user = account('05321234567');
  await user.validate();
  user.phone = '';
  await user.validate();
  assert.equal(user.phoneKey, undefined);
  const index = User.schema.indexes().find(([, options]) => options.name === 'user_phone_unique');
  assert.equal(index[1].unique, true);
  assert.deepEqual(index[1].partialFilterExpression, { phoneKey: { $type: 'string' } });
});
