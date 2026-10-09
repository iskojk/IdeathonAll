const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
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
  const user = new User();
  for (let index = 0; index < 20; index++) assert.match(user.createPasswordResetCode(), /^\d{6}$/);
  assert.ok(user.passwordResetExpires > new Date());
});

test('failed reset email delivery clears the usable code and expiry', async t => {
  const User = require('../src/models/User');
  const emailService = require('../src/services/emailService');
  assert.equal(emailService.transporter.options.tls.rejectUnauthorized, true);
  assert.equal(emailService.transporter.options.tls.ciphers, undefined);
  const controller = require('../src/controllers/authController');
  const user = new User({ name: 'Reset Test', email: 'reset@example.com', isActive: true });
  t.mock.method(User, 'findOne', async () => user);
  t.mock.method(user, 'save', async () => user);
  t.mock.method(emailService, 'sendPasswordResetEmail', async () => { throw new Error('Simulated delivery failure'); });
  t.mock.method(console, 'error', () => {});
  const response = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  await controller.forgotPassword({ body: { email: user.email } }, response);
  assert.equal(response.statusCode, 500);
  assert.equal(user.passwordResetCode, undefined);
  assert.equal(user.passwordResetExpires, undefined);
});
