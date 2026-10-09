const path = require('node:path');
const crypto = require('node:crypto');
const nodemailer = require('nodemailer');

// Explicit process environment wins, including isolated Mailpit configurations.
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.auth-mail'), quiet: true });

function verificationSecret() {
  const secret = process.env.AUTH_VERIFICATION_SECRET;
  if (!secret || secret.length < 32) throw new Error('AUTH_VERIFICATION_SECRET must contain at least 32 characters.');
  return secret;
}

function codeDigest(purpose, identity, code) {
  return crypto.createHmac('sha256', verificationSecret())
    .update(JSON.stringify([purpose, String(identity), code])).digest('hex');
}

function matchesCode(expected, actual) {
  if (typeof expected !== 'string' || typeof actual !== 'string' || expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
}

const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

let transporter;
function getTransport() {
  if (transporter) return transporter;
  const host = process.env.AUTH_SMTP_HOST;
  const port = Number(process.env.AUTH_SMTP_PORT || 587);
  const address = process.env.AUTH_MAIL_FROM;
  if (!host || !address || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Authentication email configuration is incomplete.');
  }
  const local = ['localhost', '127.0.0.1', '::1'].includes(host);
  const isolatedQA = /\/ideathon_release_qa_[a-f0-9]{12}(?:\?|$)/.test(process.env.MONGODB_URI || '');
  if ((process.env.RELEASE_QA_DB || isolatedQA || process.env.NODE_ENV === 'test') && !local) {
    throw new Error('Tests may only use a loopback authentication SMTP server.');
  }
  if (!local && (!process.env.AUTH_SMTP_USER || !process.env.AUTH_SMTP_PASS)) {
    throw new Error('Authentication SMTP credentials are missing.');
  }
  transporter = nodemailer.createTransport({
    host, port,
    secure: process.env.AUTH_SMTP_SECURE === 'true',
    requireTLS: !local || process.env.AUTH_SMTP_REQUIRE_TLS === 'true',
    auth: local && !process.env.AUTH_SMTP_USER ? undefined : {
      user: process.env.AUTH_SMTP_USER, pass: process.env.AUTH_SMTP_PASS
    },
    tls: { rejectUnauthorized: true, minVersion: 'TLSv1.2' },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000,
    logger: false, debug: false
  });
  return transporter;
}

async function sendCode(email, code, name, purpose) {
  const registration = purpose === 'registration';
  const title = registration ? 'Kayıt doğrulama kodunuz' : 'Şifre sıfırlama kodunuz';
  const minutes = registration ? 10 : 15;
  const sender = process.env.AUTH_MAIL_FROM_NAME || 'AFZ-Girişimci Başvurum';
  const introduction = registration
    ? `${sender} platformuna hoş geldiniz. Hesabınızı oluşturmak ve başvuru sürecinize devam etmek için e-posta adresinizi doğrulayın.`
    : `${sender} platformundaki hesabınız için bir şifre sıfırlama talebi aldık.`;
  const instruction = registration
    ? 'Aşağıdaki kodu kayıt ekranındaki doğrulama alanına girerek hesabınızı oluşturabilirsiniz.'
    : 'Yeni şifrenizi belirlemek için aşağıdaki kodu şifre sıfırlama ekranına girin.';
  const disclaimer = registration
    ? 'Bu kaydı siz başlatmadıysanız bu e-postayı dikkate almayın.'
    : 'Bu talebi siz oluşturmadıysanız bu e-postayı dikkate almayın. Şifreniz, sıfırlama işlemi tamamlanana kadar değişmez.';
  const expiry = `Bu kod ${minutes} dakika geçerlidir ve yalnızca bir kez kullanılabilir.`;
  const text = `${sender}\n\nMerhaba ${name},\n\n${introduction}\n\n${instruction}\n\n${title}: ${code}\n\n${expiry}\nGüvenliğiniz için bu kodu kimseyle paylaşmayın.\n\n${disclaimer}\n\n${sender} Ekibi`;
  return getTransport().sendMail({
    from: { name: sender, address: process.env.AUTH_MAIL_FROM }, to: email,
    subject: `${title} - ${sender}`, text,
    html: `<div lang="tr" style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;color:#263248;line-height:1.6">
      <h2 style="font-size:22px;line-height:1.35;margin:0 0 24px">${escapeHtml(sender)}</h2>
      <p>Merhaba ${escapeHtml(name)},</p>
      <p>${escapeHtml(introduction)}</p>
      <p>${escapeHtml(instruction)}</p>
      <p style="margin-bottom:8px;font-weight:bold">${title}</p>
      <p style="font-size:32px;font-weight:bold;letter-spacing:6px;white-space:nowrap;margin:8px 0 24px">${escapeHtml(code)}</p>
      <p>${expiry}<br>Güvenliğiniz için bu kodu kimseyle paylaşmayın.</p>
      <p style="font-size:14px">${escapeHtml(disclaimer)}</p>
      <p style="margin-top:24px;font-weight:bold">${escapeHtml(sender)} Ekibi</p>
    </div>`
  });
}

module.exports = { codeDigest, matchesCode, verificationSecret, sendCode };
