import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';

const requireAPI = createRequire(new URL('../ideathon.api/package.json', import.meta.url));
const env = requireAPI('dotenv').parse(readFileSync(new URL('../ideathon.api/.env', import.meta.url)));
assert.equal(env.MONGODB_URI, 'mongodb://127.0.0.1:27027/ideathon_local', 'Bu test yalnızca yerel veritabanında çalışır.');
assert.equal(env.SMTP_HOST, '127.0.0.1', 'Test e-postaları yalnızca Mailpit üzerinden gönderilir.');
assert.equal(env.SMTP_PORT, '1025');
const mongoose = requireAPI('mongoose');
const User = requireAPI('./src/models/User');
const Ideathon = requireAPI('./src/models/Ideathon');
const UserIdeathonRole = requireAPI('./src/models/UserIdeathonRole');
const Application = requireAPI('./src/models/EntrepreneurApplication');
const userIds = [];
const messageIds = [];
const base = 'http://127.0.0.1:5010/api';
const mailpit = 'http://127.0.0.1:8025';
const authSource = readFileSync(new URL('../ideathon.frontend/lib/auth.js', import.meta.url), 'utf8');
const { getAuthUser } = await import(`data:text/javascript;base64,${Buffer.from(authSource).toString('base64')}`);

async function request(path, { method = 'GET', body, token, expected = 200 } = {}) {
  const response = await fetch(base + path, {
    method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20000),
  });
  assert.equal(response.status, expected, `${method} ${path}: beklenen HTTP ${expected}, gelen ${response.status}`);
  return response.json();
}

async function resetCodeFromEmail(email) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const response = await fetch(`${mailpit}/api/v1/messages?limit=100`, { signal: AbortSignal.timeout(5000) });
    assert.equal(response.status, 200);
    const result = await response.json();
    const message = result.messages.find(item => item.To?.some(to => to.Address === email) && !messageIds.includes(item.ID));
    if (message) {
      messageIds.push(message.ID);
      const detailResponse = await fetch(`${mailpit}/api/v1/message/${encodeURIComponent(message.ID)}`, { signal: AbortSignal.timeout(5000) });
      assert.equal(detailResponse.status, 200);
      const detail = await detailResponse.json();
      const text = detail.Text || detail.HTML.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ');
      const code = text.match(/\b\d{6}\b/)?.[0];
      assert.ok(code, 'Yerel e-postada altı haneli sıfırlama kodu bulunamadı.');
      return code;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error('Şifre sıfırlama e-postası yerel Mailpit kutusuna ulaşmadı.');
}

await mongoose.connect(env.MONGODB_URI);
try {
  const event = await Ideathon.findOne({ registrationOpen: true }).select('_id slug').lean();
  for (const entrepreneur of [false, true]) {
    const email = `auth-flow-${randomBytes(8).toString('hex')}@example.com`;
    const password = randomBytes(24).toString('base64url');
    const newPassword = randomBytes(24).toString('base64url');
    const registerPath = entrepreneur || !event ? '/auth/register' : `/auth/register?event=${encodeURIComponent(event.slug)}`;
    const registration = await request(registerPath, { method: 'POST', expected: 201, body: { name: 'Yerel Auth Akış Testi', email, password, ...(entrepreneur ? { entrepreneur: true, phone: '05' + Array.from(randomBytes(9), byte => byte % 10).join('') } : {}) } });
    const { user, token } = registration.data;
    userIds.push(user._id);
    assert.equal(registration.data.verificationRequired, undefined, 'Kayıt bir OTP adımı beklememeli.');
    assert.equal(user.role, 'user');
    assert.equal(user.ideathonId, entrepreneur || !event ? null : String(event._id));
    assert.ok(token, 'Kayıt başarılı olduğunda doğrudan oturum açılmalı.');
    const registrationMailbox = await fetch(`${mailpit}/api/v1/messages?limit=100`, { signal: AbortSignal.timeout(5000) });
    assert.equal(registrationMailbox.status, 200);
    assert.equal((await registrationMailbox.json()).messages.some(item => item.To?.some(to => to.Address === email)), false,
      'Doğrudan kayıt akışında doğrulama e-postası gönderilmemeli.');
    const stored = await User.findById(user._id).select('+password').lean();
    assert.notEqual(stored.password, password);
    assert.match(stored.password, /^\$2[aby]\$/);
    const session = await request('/auth/me', { token });
    assert.equal(getAuthUser(session)?._id, user._id, 'Önbellek olmadan gerçek /me yanıtıyla oturum kurulabilmeli.');
    assert.equal(getAuthUser(registration)?._id, user._id);
    const login = await request('/auth/login', { method: 'POST', body: { email, password } });
    assert.equal(login.data.user._id, user._id);

    let applicationId;
    if (entrepreneur) {
      const { data } = await request('/entrepreneurs/my', { token });
      const draft = await request('/entrepreneurs/my', { method: 'PUT', token, body: { answers: {}, formVersion: data.form.version } });
      applicationId = draft.data.application._id;
    }

    await request('/auth/forgot-password', { method: 'POST', body: { email } });
    const code = await resetCodeFromEmail(email);
    await request('/auth/reset-password', { method: 'POST', expected: 400, body: { email, code: '000000', newPassword } });
    await request('/auth/reset-password', { method: 'POST', body: { email, code, newPassword } });
    await request('/auth/reset-password', { method: 'POST', expected: 400, body: { email, code, newPassword } });
    await request('/auth/login', { method: 'POST', expected: 401, body: { email, password } });
    const relogin = await request('/auth/login', { method: 'POST', body: { email, password: newPassword } });
    assert.equal(relogin.data.user._id, user._id);
    if (entrepreneur) {
      const reloaded = await request('/entrepreneurs/my', { token: relogin.data.token });
      assert.equal(reloaded.data.application._id, applicationId);
    }

    // Süresi dolmuş bir kod da kabul edilmemeli; yalnızca kendi test hesabımızı değiştiririz.
    await request('/auth/forgot-password', { method: 'POST', body: { email } });
    const expiredCode = await resetCodeFromEmail(email);
    await User.updateOne({ _id: user._id }, { $set: { passwordResetExpires: new Date(Date.now() - 1000) } });
    await request('/auth/reset-password', { method: 'POST', expected: 400, body: { email, code: expiredCode, newPassword: password } });
    console.log(`OK: ${entrepreneur ? 'Girişimci' : 'Mevcut Ideathon'} kaydı, ortak giriş/oturum, SMTP kodu, şifre sıfırlama, hatalı/tekrar kullanılan/süresi dolmuş kod kontrolü${entrepreneur ? ', başvuruya yeniden erişim' : ''}`);
  }
} finally {
  await Application.deleteMany({ userId: { $in: userIds } });
  await UserIdeathonRole.deleteMany({ userId: { $in: userIds } });
  await User.deleteMany({ _id: { $in: userIds } });
  await mongoose.disconnect();
  if (messageIds.length) {
    const response = await fetch(`${mailpit}/api/v1/messages`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ IDs: messageIds }), signal: AbortSignal.timeout(5000) });
    assert.ok(response.ok, 'Yalnızca bu testin e-postaları temizlenemedi.');
  }
  console.log('Bu testin geçici hesapları, taslakları ve e-postaları temizlendi; mevcut demo başvuruları korundu.');
}
