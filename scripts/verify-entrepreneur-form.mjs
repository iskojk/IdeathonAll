import { readFile, writeFile, mkdtemp, mkdir, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const root = new URL('../', import.meta.url);
const adminDrafts = process.argv.includes('--admin-drafts');
const route = `__entrepreneur-qa-${process.pid}`;
const pageDirectory = new URL(adminDrafts ? 'ideathon.admin/src/pages/' : 'ideathon.frontend/pages/', root);
const page = new URL(`${route}.js`, pageDirectory);
const profile = await mkdtemp(join(tmpdir(), 'ideathon-browser-qa-'));
const nonce = randomBytes(24).toString('hex');
let browser;
let timer;
let resolveResult;
const result = new Promise(resolve => { resolveResult = resolve; });
// Use real browser time: virtual-time-budget can finish before React hydrates.
// The fixture reports completion to this short-lived loopback-only receiver.
const receiver = createServer((request, response) => {
  if (request.method !== 'POST' || request.url !== `/${nonce}`) { response.writeHead(404).end(); return; }
  let body = '';
  request.on('data', chunk => { body += chunk; if (body.length > 8192) request.destroy(); });
  request.on('end', () => {
    response.writeHead(204).end();
    if (/^(PASS|FAIL):/.test(body)) resolveResult(body);
  });
});
try {
  await new Promise(resolve => receiver.listen(0, '127.0.0.1', resolve));
  const reportUrl = `http://127.0.0.1:${receiver.address().port}/${nonce}`;
  const fixture = await readFile(new URL(adminDrafts ? 'ideathon.admin/tests/fixtures/entrepreneur-drafts-page.jsx' : 'ideathon.frontend/tests/fixtures/entrepreneur-form-page.js', root), 'utf8');
  await mkdir(pageDirectory, { recursive: true });
  await writeFile(page, fixture.replace('__QA_REPORT_URL__', reportUrl));
  const url = `http://127.0.0.1:${adminDrafts ? 3111 : 3110}/${route}`;
  // Give the dev server's file watcher a moment to discover the temporary route.
  let response;
  for (let attempt = 0; attempt < 10; attempt++) {
    response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (response.status !== 404) break;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  assert.equal(response.status, 200);
  browser = spawn(process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-background-networking',
    '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE 127.0.0.1',
    `--user-data-dir=${profile}`, url,
  ], { stdio: 'ignore' });
  browser.on('error', error => resolveResult(`FAIL: Chrome başlatılamadı: ${error.message}`));
  browser.on('exit', () => resolveResult('FAIL: Chrome test tamamlanmadan kapandı.'));
  timer = setTimeout(() => resolveResult('FAIL: Tarayıcı testi 60 saniyede tamamlanmadı.'), 60000);
  const message = await result;
  console.log(message);
  assert.ok(message.startsWith('PASS:'), message);
} finally {
  clearTimeout(timer);
  if (browser && browser.exitCode === null) {
    browser.kill('SIGTERM');
    await new Promise(resolve => { browser.once('exit', resolve); setTimeout(resolve, 3000).unref(); });
  }
  receiver.closeAllConnections();
  await new Promise(resolve => receiver.close(resolve));
  await rm(page, { force: true });
  await rm(profile, { recursive: true, force: true, maxRetries: 4, retryDelay: 250 });
}
