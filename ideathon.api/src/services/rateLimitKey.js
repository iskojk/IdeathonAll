const jwt = require('jsonwebtoken');
const { ipKeyGenerator } = require('express-rate-limit');

function generalRateLimitKey(req) {
  const authorization = req.headers.authorization;
  if (authorization?.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authorization.slice(7), process.env.JWT_SECRET);
      const userId = decoded?.userId || decoded?.id;
      if (typeof userId === 'string' && /^[a-f0-9]{24}$/i.test(userId)) return `user_${userId.toLowerCase()}`;
    } catch (_) { /* Invalid tokens share the unauthenticated IP limit. */ }
  }
  return `ip_${ipKeyGenerator(req.ip)}`;
}

module.exports = { generalRateLimitKey };
