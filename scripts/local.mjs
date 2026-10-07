import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, openSync, closeSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import net from 'node:net';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const state = join(root, '.local');
mkdirSync(join(state, 'logs'), { recursive: true });
const services = [
  { name: 'api', port: 5010, entry: 'src/server.js', path: '/health' },
  { name: 'frontend', port: 3110, path: '/' },
  { name: 'admin', port: 3111, path: '/auth/login' },
  { name: 'juri', port: 3112, path: '/auth/login' },
  { name: 'mentor', port: 3113, path: '/auth/login' },
];
function run(command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} başarısız: ${result.status}`);
}
function writeIfMissing(path, text) {
  if (!existsSync(path)) writeFileSync(path, text, { mode: 0o600 });
}
function configure() {
  writeIfMissing(join(root, 'ideathon.api/.env'), `NODE_ENV=development
HOST=127.0.0.1
PORT=5010
MONGODB_URI=mongodb://127.0.0.1:27027/ideathon_local
JWT_SECRET=${randomBytes(32).toString('hex')}
JWT_EXPIRE=7d
INTEGRATION_ENCRYPTION_KEY=${randomBytes(16).toString('hex')}
OAUTH_STATE_SECRET=${randomBytes(32).toString('hex')}
FRONTEND_URL=http://localhost:3110
BACKEND_URL=http://localhost:5010
ADMIN_PANEL_URL=http://localhost:3111
JURI_PANEL_URL=http://localhost:3112
MENTOR_PANEL_URL=http://localhost:3113
FRONTEND_MENTOR_URL=http://localhost:3113
CORS_ALLOWED_ORIGINS=http://127.0.0.1:3110,http://127.0.0.1:3111,http://127.0.0.1:3112,http://127.0.0.1:3113
SMTP_HOST=127.0.0.1
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=noreply@ideathon.dev
SMTP_PASS=local-mailpit
MAIL_FROM_APPLICATION_ONE=admin@ideathon.dev
MAIL_FROM_APPLICATION_TWO=admin@ideathon.dev
ADMIN_EMAILS=admin@ideathon.dev
`);
  writeIfMissing(join(root, 'ideathon.frontend/.env.local'), `NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_API_URL=http://localhost:5010/api
NEXT_PUBLIC_MENTORNET_API_URL=http://localhost:5010/api/mentornet
NEXT_PUBLIC_SOCKET_URL=http://localhost:5010
`);
  for (const name of ['admin', 'juri', 'mentor']) {
    writeIfMissing(join(root, `ideathon.${name}/.env.local`), `NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_API_BASE_URL=http://localhost:5010
NEXT_PUBLIC_API_BASE_URL_APP=http://localhost:5010/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5010
NEXT_PUBLIC_APP_NAME=EMLAK${name.toUpperCase()}
NEXT_PUBLIC_AUTH_COOKIE_NAME=ideathon_${name}_token
`);
  }
}
function pidFile(s) { return join(state, `${s.name}.pid`); }
function processStartedAt(pid) {
  const result = spawnSync('ps', ['-p', String(pid), '-o', 'lstart='], { encoding: 'utf8' });
  if (result.error) throw result.error;
  return result.stdout.trim();
}
function currentPid(s) {
  if (!existsSync(pidFile(s))) return null;
  const { pid, startedAt } = JSON.parse(readFileSync(pidFile(s), 'utf8'));
  try { process.kill(pid, 0); } catch (error) {
    if (error.code !== 'ESRCH') throw error;
    unlinkSync(pidFile(s)); return null;
  }
  if (!startedAt || processStartedAt(pid) !== startedAt) {
    unlinkSync(pidFile(s)); return null;
  }
  return pid;
}
function portOpen(port) {
  return new Promise(resolve => {
    const socket = net.connect({ port, host: '127.0.0.1' });
    const done = result => { socket.destroy(); resolve(result); };
    socket.once('connect', () => done(true));
    socket.once('error', () => done(false));
    socket.setTimeout(1000, () => done(false));
  });
}
async function start() {
  configure();
  for (const s of services) {
    const cwd = join(root, `ideathon.${s.name}`);
    if (!existsSync(join(cwd, 'node_modules'))) throw new Error('Önce npm run setup çalıştırın.');
    if (!currentPid(s) && await portOpen(s.port)) throw new Error(`${s.port} portu başka bir süreç tarafından kullanılıyor.`);
  }
  run('docker', ['compose', 'up', '-d', '--wait']);
  run(process.execPath, ['scripts/seed-local.cjs']);
  for (const s of services) {
    if (currentPid(s)) { console.log(`${s.name} zaten çalışıyor.`); continue; }
    const cwd = join(root, `ideathon.${s.name}`);
    const args = s.entry ? [s.entry] : ['node_modules/next/dist/bin/next', 'dev', '-H', '127.0.0.1', '-p', String(s.port)];
    const log = openSync(join(state, 'logs', `${s.name}.log`), 'a');
    const child = spawn(process.execPath, args, {
      cwd, detached: true, stdio: ['ignore', log, log],
      env: { ...process.env, NODE_ENV: 'development', NEXT_TELEMETRY_DISABLED: '1' }
    });
    await new Promise((resolve, reject) => { child.once('spawn', resolve); child.once('error', reject); });
    writeFileSync(pidFile(s), JSON.stringify({ pid: child.pid, startedAt: processStartedAt(child.pid) }));
    child.unref();
    closeSync(log);
    console.log(`${s.name}: http://localhost:${s.port}${s.path}`);
  }
  for (const s of services) {
    let ready = false;
    for (let i = 0; i < 60; i++) {
      if (!currentPid(s)) throw new Error(`${s.name} kapandı. .local/logs/${s.name}.log dosyasına bakın.`);
      if (await portOpen(s.port)) { ready = true; break; }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    if (!ready) throw new Error(`${s.name} zamanında başlamadı. .local/logs/${s.name}.log dosyasına bakın.`);
  }
  console.log('Servisler başladı. Giriş bilgileri: .local/credentials.json\nYerel e-postalar: http://localhost:8025');
}
async function stop() {
  const stopping = [];
  for (const s of services) {
    const pid = currentPid(s);
    if (!pid) continue;
    try { process.kill(-pid, 'SIGTERM'); } catch (e) { if (e.code !== 'ESRCH') throw e; }
    stopping.push(s);
  }
  await Promise.all(stopping.map(async s => {
    for (let i = 0; i < 60; i++) {
      if (!currentPid(s)) { console.log(`${s.name} durduruldu.`); return; }
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    throw new Error(`${s.name} kapanmadı; süreç kaydı korundu. .local/logs/${s.name}.log dosyasını kontrol edin.`);
  }));
  run('docker', ['compose', 'stop']);
}
async function status() {
  for (const s of services) {
    try {
      const response = await fetch(`http://127.0.0.1:${s.port}${s.path}`, { signal: AbortSignal.timeout(120000) });
      console.log(`${s.name}: HTTP ${response.status} — http://localhost:${s.port}${s.path}`);
      if (!response.ok) process.exitCode = 1;
    } catch { console.log(`${s.name}: erişilemiyor`); process.exitCode = 1; }
  }
  run('docker', ['compose', 'ps']);
}
try {
  const action = process.argv[2];
  if (action === 'setup') {
    configure();
    for (const s of services) {
      const cwd = join(root, `ideathon.${s.name}`);
      run('npm', [existsSync(join(cwd, 'package-lock.json')) ? 'ci' : 'install', '--no-audit', '--no-fund'], cwd);
    }
  } else if (action === 'up') await start();
  else if (action === 'down') await stop();
  else if (action === 'status') await status();
  else if (action === 'configure') configure();
  else throw new Error('Kullanım: node scripts/local.mjs setup|up|down|status');
} catch (error) { console.error(error.message); process.exitCode = 1; }
