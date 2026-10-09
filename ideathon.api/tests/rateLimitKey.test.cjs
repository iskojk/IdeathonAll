const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { generalRateLimitKey } = require('../src/services/rateLimitKey');
const { randomBytes } = require('node:crypto');

test('signed userId tokens isolate users sharing an IP, including legacy id tokens', () => {
  const previous = process.env.JWT_SECRET;
  process.env.JWT_SECRET = randomBytes(32).toString('hex');
  try {
    const key = payload => generalRateLimitKey({ ip: '127.0.0.1', headers: { authorization: `Bearer ${jwt.sign(payload, process.env.JWT_SECRET)}` } });
    const first = 'a'.repeat(24), second = 'b'.repeat(24);
    assert.equal(key({ userId: first }), `user_${first}`);
    assert.equal(key({ id: first }), key({ userId: first }));
    assert.notEqual(key({ userId: first }), key({ userId: second }));
    assert.equal(key({ userId: 'malformed' }), 'ip_127.0.0.1');
    const forged = jwt.sign({ userId: first }, randomBytes(32).toString('hex'));
    assert.equal(generalRateLimitKey({ ip: '127.0.0.1', headers: { authorization: `Bearer ${forged}` } }), 'ip_127.0.0.1');
    assert.equal(generalRateLimitKey({ ip: '127.0.0.1', headers: {} }), 'ip_127.0.0.1');
  } finally {
    if (previous === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previous;
  }
});
