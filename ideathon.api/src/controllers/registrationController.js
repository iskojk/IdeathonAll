const crypto = require('node:crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Ideathon = require('../models/Ideathon');
const UserIdeathonRole = require('../models/UserIdeathonRole');
const PendingRegistration = require('../models/PendingRegistration');
const { normalizePhone } = require('../services/entrepreneurPhone');
const mail = require('../services/authMail');
const { generateToken } = require('../middleware/auth');

const CODE_TTL = 10 * 60 * 1000;
const ATTEMPT_TTL = 30 * 60 * 1000;
const COOLDOWN = 60 * 1000;
const MAX_ATTEMPTS = 5;
const fail = (status, message) => Object.assign(new Error(message), { status });
const emailConflict = 'Daha önce bu e-posta adresi kullanılmıştır.';
const phoneConflict = 'Daha önce bu telefon numarası kullanılmıştır.';

function errorResponse(res, error) {
  if (error.code === 11000) return res.status(409).json({ success: false,
    message: error.keyPattern?.phoneKey || error.keyValue?.phoneKey ? phoneConflict : emailConflict });
  if (error.name === 'ValidationError') return res.status(400).json({ success: false, message: 'Kayıt bilgilerinizi kontrol edin.' });
  // SMTP/database errors may contain credentials, addresses or pending data.
  if (!error.status) console.error('Registration operation failed:', error.code || error.name || 'Error');
  return res.status(error.status || 503).json({ success: false,
    message: error.status ? error.message : 'İşlem şu anda tamamlanamıyor. Lütfen daha sonra tekrar deneyin.' });
}

async function ensureEventOpen(ideathonId) {
  if (!ideathonId) return;
  if (!mongoose.isValidObjectId(ideathonId)) throw fail(400, 'Geçersiz ideathon.');
  const event = await Ideathon.findById(ideathonId).select('registrationOpen').lean();
  if (!event) throw fail(404, 'Belirtilen ideathon bulunamadı.');
  if (!event.registrationOpen) throw fail(403, 'Bu ideathon için kayıt kapalıdır.');
}

async function ensureIdentityAvailable(email, phoneKey) {
  if (await User.exists({ email })) throw fail(409, emailConflict);
  if (phoneKey && await User.phoneInUse(phoneKey)) throw fail(409, phoneConflict);
}

function data(pending, registrationToken) {
  return { verificationRequired: true, registrationToken, email: pending.email,
    expiresAt: pending.expiresAt, codeExpiresAt: pending.codeExpiresAt,
    resendAvailableAt: pending.resendAvailableAt };
}

async function start(req, res) {
  try {
    const { name, password, phone, entrepreneur } = req.body;
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 50 ||
        !email || email.length > 254 || typeof password !== 'string' || password.length < 6 || Buffer.byteLength(password) > 72) {
      throw fail(400, 'Ad soyad, geçerli e-posta ve 6–72 bayt uzunluğunda şifre giriniz.');
    }
    if (entrepreneur === true && (typeof phone !== 'string' || !phone.trim())) throw fail(400, 'Telefon numarası zorunludur.');
    const phoneKey = phone ? (typeof phone === 'string' && normalizePhone(phone)) : undefined;
    if (phone && !phoneKey) throw fail(400, 'Geçerli bir telefon numarası giriniz.');
    const ideathonId = entrepreneur === true ? null : req.ideathonId || req.body.ideathonId || null;
    // Validate using the same rules as the final User before sending anything.
    await new User({ name, email, phone: phone || undefined, password, role: 'user', ideathonId }).validate();
    await ensureEventOpen(ideathonId);
    await ensureIdentityAvailable(email, phoneKey);
    mail.verificationSecret();
    const now = Date.now();
    const pending = new PendingRegistration({
      userId: new mongoose.Types.ObjectId(), name: name.trim(), email, phone: phone || undefined,
      phoneKey, ideathonId: ideathonId || undefined, passwordHash: await bcrypt.hash(password, 12),
      codeExpiresAt: new Date(now + CODE_TTL), resendAvailableAt: new Date(now + COOLDOWN),
      expiresAt: new Date(now + ATTEMPT_TTL)
    });
    const code = crypto.randomInt(100000, 1000000).toString();
    pending.codeDigest = mail.codeDigest('registration', pending._id, code);
    const registrationToken = jwt.sign({ purpose: 'registration', pendingId: pending._id.toString() },
      mail.verificationSecret(), { algorithm: 'HS256', expiresIn: '30m', audience: 'registration' });
    await pending.save();
    try {
      await mail.sendCode(email, code, pending.name, 'registration');
    } catch (error) {
      await PendingRegistration.deleteOne({ _id: pending._id, verifiedAt: null });
      throw error;
    }
    return res.status(202).json({ success: true, message: 'Doğrulama kodu e-posta adresinize gönderildi.', data: data(pending, registrationToken) });
  } catch (error) { return errorResponse(res, error); }
}

// Runs after the IP limiter and before the account limiter.
async function loadAttempt(req, res, next) {
  try {
    const token = req.body.registrationToken;
    if (typeof token !== 'string' || token.length > 2048) throw fail(400, 'Geçersiz kayıt isteği.');
    let decoded;
    try {
      decoded = jwt.verify(token, mail.verificationSecret(), { algorithms: ['HS256'], audience: 'registration' });
    } catch { throw fail(410, 'Doğrulama oturumunun süresi doldu. Lütfen yeniden kayıt olun.'); }
    if (decoded.purpose !== 'registration' || !mongoose.isValidObjectId(decoded.pendingId)) throw fail(400, 'Geçersiz kayıt isteği.');
    const pending = await PendingRegistration.findById(decoded.pendingId).select('+codeDigest +passwordHash');
    if (!pending || pending.expiresAt.getTime() <= Date.now()) throw fail(410, 'Doğrulama oturumunun süresi doldu. Lütfen yeniden kayıt olun.');
    if (pending.completedAt) throw fail(409, 'Bu kayıt tamamlandı. Hesabınızla giriş yapabilirsiniz.');
    req.registration = pending;
    req.verificationEmail = pending.email;
    next();
  } catch (error) { return errorResponse(res, error); }
}

async function verify(req, res) {
  try {
    const pending = req.registration;
    const code = req.body.code;
    if (typeof code !== 'string' || !/^\d{6}$/.test(code)) throw fail(400, 'Altı haneli doğrulama kodunu giriniz.');
    if (pending.attempts >= MAX_ATTEMPTS) throw fail(429, 'Çok fazla yanlış kod girdiniz. Yeni kod isteyin.');
    if (pending.codeExpiresAt.getTime() <= Date.now()) throw fail(400, 'Kodun süresi doldu. Yeni kod isteyin.');
    const current = { _id: pending._id, codeDigest: pending.codeDigest, completedAt: null,
      attempts: { $lt: MAX_ATTEMPTS }, expiresAt: { $gt: new Date() }, codeExpiresAt: { $gt: new Date() } };
    if (!mail.matchesCode(pending.codeDigest, mail.codeDigest('registration', pending._id, code))) {
      await PendingRegistration.updateOne({ ...current, verifiedAt: null }, { $inc: { attempts: 1 } });
      throw fail(400, 'Doğrulama kodu hatalı veya artık geçerli değil.');
    }
    const verified = await PendingRegistration.findOneAndUpdate(current,
      { $set: { verifiedAt: pending.verifiedAt || new Date() } }, { new: true });
    if (!verified) throw fail(400, 'Kod artık geçerli değil. Yeni kod isteyin.');
    // All operations below are retryable on standalone MongoDB; no transaction required.
    let user = await User.findById(pending.userId).select('+password');
    if (!user) {
      await ensureEventOpen(pending.ideathonId);
      await ensureIdentityAvailable(pending.email, pending.phoneKey);
      try {
        // insertMany validates but does not run save hooks: hash exactly once.
        [user] = await User.insertMany([{
          _id: pending.userId, name: pending.name, email: pending.email, phone: pending.phone,
          phoneKey: pending.phoneKey, password: pending.passwordHash, role: 'user',
          ideathonId: pending.ideathonId, createdBy: null, emailVerifiedAt: verified.verifiedAt
        }]);
      } catch (error) {
        if (error.code !== 11000) throw error;
        user = await User.findById(pending.userId).select('+password');
        if (!user) throw error;
      }
    }
    // A partially completed attempt cannot issue a new session after recovery
    // or an administrator has changed/disabled the newly created account.
    if (!user.isActive || user.email !== pending.email || user.password !== pending.passwordHash || (user.sessionVersion || 0) !== 0) {
      throw fail(409, 'Hesabınız oluşturuldu. Lütfen giriş ekranından devam edin.');
    }
    if (pending.ideathonId) await UserIdeathonRole.updateOne({ userId: user._id, ideathonId: pending.ideathonId, role: 'user' },
      { $setOnInsert: { isActive: true, assignedBy: user._id } }, { upsert: true, runValidators: true });
    const consumed = await PendingRegistration.updateOne({ _id: pending._id, completedAt: null, verifiedAt: { $ne: null } },
      { $set: { completedAt: new Date() }, $unset: { passwordHash: 1, codeDigest: 1 } });
    if (consumed.modifiedCount !== 1) throw fail(409, 'Bu kayıt tamamlandı. Hesabınızla giriş yapabilirsiniz.');
    const token = generateToken(user._id, user.ideathonId, user.role, user.sessionVersion);
    return res.status(201).json({ success: true, message: 'E-posta doğrulandı ve hesabınız oluşturuldu.', data: {
      token, user: { _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role,
        isActive: user.isActive, ideathonId: user.ideathonId || null, emailVerifiedAt: user.emailVerifiedAt, createdAt: user.createdAt }
    } });
  } catch (error) { return errorResponse(res, error); }
}

async function resend(req, res) {
  try {
    const pending = req.registration;
    if (pending.verifiedAt) throw fail(409, 'E-posta zaten doğrulandı. Aynı kodla kaydı tamamlamayı tekrar deneyin veya giriş yapın.');
    const now = Date.now();
    if (pending.resendAvailableAt.getTime() > now) {
      res.set('Retry-After', String(Math.ceil((pending.resendAvailableAt.getTime() - now) / 1000)));
      throw fail(429, 'Yeni kod istemek için 60 saniye bekleyin.');
    }
    const code = crypto.randomInt(100000, 1000000).toString();
    const digest = mail.codeDigest('registration', pending._id, code);
    const updated = await PendingRegistration.findOneAndUpdate({ _id: pending._id, verifiedAt: null,
      completedAt: null, resendAvailableAt: { $lte: new Date(now) }, expiresAt: { $gt: new Date(now) } },
    { $set: { codeDigest: digest, attempts: 0, codeExpiresAt: new Date(Math.min(now + CODE_TTL, pending.expiresAt.getTime())),
      resendAvailableAt: new Date(now + COOLDOWN) } }, { new: true });
    if (!updated) throw fail(409, 'Kod isteği değişti. Lütfen tekrar deneyin.');
    try { await mail.sendCode(pending.email, code, pending.name, 'registration'); }
    catch (error) {
      await PendingRegistration.updateOne({ _id: pending._id, codeDigest: digest, verifiedAt: null },
        { $set: { codeExpiresAt: new Date(0), resendAvailableAt: new Date() }, $unset: { codeDigest: 1 } });
      throw error;
    }
    return res.json({ success: true, message: 'Yeni doğrulama kodu gönderildi.', data: data(updated, req.body.registrationToken) });
  } catch (error) { return errorResponse(res, error); }
}

module.exports = { start, loadAttempt, verify, resend };
