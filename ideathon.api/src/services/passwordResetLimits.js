const { createHash } = require('node:crypto');
const { rateLimit } = require('express-rate-limit');

// These stores are process-local. Multi-instance deployments need a shared store.
function passwordResetLimits({ windowMs = 15 * 60 * 1000, ipLimit = 30, accountLimit = 10 } = {}) {
  const options = { windowMs, standardHeaders: true, legacyHeaders: false,
    message: { success: false, message: 'Çok fazla şifre sıfırlama isteği. Lütfen daha sonra tekrar deneyin.' } };
  const ip = rateLimit({ ...options, limit: ipLimit });
  const account = rateLimit({ ...options, limit: accountLimit,
    skip: req => typeof req.body?.email !== 'string' || !req.body.email.trim() || req.body.email.length > 254,
    keyGenerator: req => createHash('sha256').update(req.body.email.trim().toLowerCase()).digest('hex') });
  return [ip, account];
}

module.exports = { passwordResetLimits };
