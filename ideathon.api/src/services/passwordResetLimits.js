const { createHash } = require('node:crypto');
const { rateLimit } = require('express-rate-limit');

// These stores are process-local. Multi-instance deployments need a shared store.
function passwordResetLimits({ windowMs = 15 * 60 * 1000, ipLimit = 30, accountLimit = 10,
  message = 'Çok fazla şifre sıfırlama isteği. Lütfen daha sonra tekrar deneyin.' } = {}) {
  const options = { windowMs, standardHeaders: true, legacyHeaders: false,
    message: { success: false, message } };
  const email = req => req.verificationEmail || req.body?.email;
  const ip = rateLimit({ ...options, limit: ipLimit });
  const account = rateLimit({ ...options, limit: accountLimit,
    skip: req => typeof email(req) !== 'string' || !email(req).trim() || email(req).length > 254,
    keyGenerator: req => createHash('sha256').update(email(req).trim().toLowerCase()).digest('hex') });
  return [ip, account];
}

module.exports = { passwordResetLimits };
