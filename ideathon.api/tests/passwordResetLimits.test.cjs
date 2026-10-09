const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
process.env.AUTH_VERIFICATION_SECRET = require('node:crypto').randomBytes(32).toString('hex');
const { passwordResetLimits } = require('../src/services/passwordResetLimits');

test('password reset limits normalize accounts, block repeated attempts, and retain a separate IP limit', async () => {
  const app = express(); app.use(express.json());
  app.post('/account', ...passwordResetLimits({ ipLimit: 20, accountLimit: 2 }), (_req, res) => res.sendStatus(200));
  app.post('/ip', ...passwordResetLimits({ ipLimit: 2, accountLimit: 20 }), (_req, res) => res.sendStatus(200));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const request = async (path, email) => (await fetch(`http://127.0.0.1:${server.address().port}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })).status;
  try {
    assert.equal(await request('/account', 'QA@example.com'), 200);
    assert.equal(await request('/account', ' qa@EXAMPLE.com '), 200);
    assert.equal(await request('/account', 'qa@example.com'), 429);
    assert.equal(await request('/account', 'other@example.com'), 200);
    assert.equal(await request('/account', {}), 200); // Controller validates malformed input; limiter must not throw.
    assert.equal(await request('/ip', 'first@example.com'), 200);
    assert.equal(await request('/ip', 'second@example.com'), 200);
    assert.equal(await request('/ip', 'third@example.com'), 429);
  } finally {
    server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
  }
});

test('reset codes use six digits and reset metadata is excluded from ordinary user queries', () => {
  const User = require('../src/models/User');
  assert.equal(User.schema.path('passwordResetCode').options.select, false);
  assert.equal(User.schema.path('passwordResetExpires').options.select, false);
  const user = new User({ email: 'code-test@example.com' });
  for (let index = 0; index < 20; index++) assert.match(user.createPasswordResetCode(), /^\d{6}$/);
  assert.ok(user.passwordResetExpires > new Date());
  const code = user.createPasswordResetCode();
  assert.match(user.passwordResetCode, /^[a-f0-9]{64}$/);
  assert.notEqual(user.passwordResetCode, code);
});

test('failed reset email delivery clears the usable code and expiry', async t => {
  const User = require('../src/models/User');
  const emailService = require('../src/services/emailService');
  assert.equal(emailService.transporter.options.tls.rejectUnauthorized, true);
  assert.equal(emailService.transporter.options.tls.ciphers, undefined);
  const controller = require('../src/controllers/authController');
  const user = new User({ name: 'Reset Test', email: 'reset@example.com', isActive: true });
  t.mock.method(User, 'findOne', async () => user);
  const writes = [];
  t.mock.method(User, 'updateOne', async (filter, update) => { writes.push({ filter, update }); return { modifiedCount: 1 }; });
  t.mock.method(emailService, 'sendPasswordResetEmail', async () => { throw new Error('Simulated delivery failure'); });
  t.mock.method(console, 'error', () => {});
  const response = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  await controller.forgotPassword({ body: { email: user.email } }, response);
  assert.equal(response.statusCode, 503);
  assert.equal(writes.length, 2);
  assert.equal(writes[1].filter.passwordResetCode, writes[0].update.$set.passwordResetCode);
  assert.equal(writes[1].update.$unset.passwordResetCode, 1);
  assert.equal(writes[1].update.$unset.passwordResetExpires, 1);
});
