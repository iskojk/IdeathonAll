import { verificationTarget } from './verification-target.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const requireFrontend = createRequire(new URL('../ideathon.frontend/package.json', import.meta.url));
const { io } = requireFrontend('socket.io-client');
const { accounts } = JSON.parse(readFileSync(new URL('../.local/credentials.json', import.meta.url)));
const base = verificationTarget().apiOrigin;
async function request(path, options = {}) {
  const response = await fetch(`${base}${path}`, { ...options, signal: AbortSignal.timeout(15000) });
  const body = await response.json();
  assert.equal(response.status, 200, `${path}: ${JSON.stringify(body)}`);
  return body;
}
assert.equal((await request('/health')).status, 'OK');
for (const account of accounts) {
  const origin = `http://localhost:${account.role === 'superadmin' ? 3111 : account.role === 'juri' ? 3112 : account.role === 'mentor' ? 3113 : 3110}`;
  const endpoint = account.role === 'mentor' ? '/api/auth/mentor-login' : '/api/auth/login';
  const result = await request(endpoint, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify({ email: account.email, password: account.password })
  });
  assert.equal(result.success, true);
  assert.equal(result.data.user.role, account.role);
  const token = result.data.token;
  const me = await request('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(me.success, true);
  if (account.role === 'superadmin') {
    const events = await request('/api/ideathons/dropdown', { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(events.success, true);
  }
  if (account.role === 'mentor' || account.role === 'user') {
    const handshake = await fetch(`${base}/socket.io/?EIO=4&transport=polling`, { headers: { Origin: origin } });
    assert.equal(handshake.headers.get('access-control-allow-origin'), origin);
    await new Promise((resolve, reject) => {
      const socket = io(base, { auth: { token }, extraHeaders: { Origin: origin }, reconnection: false });
      const timer = setTimeout(() => { socket.disconnect(); reject(new Error(`${account.role}: socket timeout`)); }, 10000);
      socket.once('connect', () => { clearTimeout(timer); socket.disconnect(); resolve(); });
      socket.once('connect_error', error => { clearTimeout(timer); socket.disconnect(); reject(error); });
    });
  }
  console.log(`OK: ${account.role} girişi, oturum doğrulama${['mentor', 'user'].includes(account.role) ? ', Socket.IO ve CORS' : ''}`);
}
for (const slug of ['ideathon-2025', 'ideathon-ankara', 'ideathon-izmir', 'ideathon-konya', 'ideathon-kahramanmaras']) {
  assert.equal((await request(`/api/ideathons/public/${slug}`)).success, true);
}
console.log('OK: Beş yerel etkinliğin public API yanıtı');
for (const [port, otherCookie] of [[3112, 'ideathon_mentor_token'], [3113, 'ideathon_juri_token']]) {
  const response = await fetch(`http://127.0.0.1:${port}/auth/login`, {
    headers: { Cookie: `token=old-shared-token; ${otherCookie}=other-panel-token` },
    redirect: 'manual', signal: AbortSignal.timeout(120000)
  });
  assert.equal(response.status, 200, `${port}: başka panelin çerezi giriş ekranını engellememeli`);
}
console.log('OK: Jüri ve mentor oturum çerezleri birbirinden bağımsız');
