import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../lib/authRoutes.js', import.meta.url), 'utf8');
const { safeRedirect, loginUrl, isAuthPage, authFlowLinks } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('login redirects accept local paths and reject external or ambiguous targets', () => {
  for (const value of ['https://example.com', '//example.com', '/\\example.com', '/\n/example.com', ['/', '//example.com'], undefined]) {
    assert.equal(safeRedirect(value, '/girisimciler/basvuru'), '/girisimciler/basvuru');
  }
  assert.equal(safeRedirect('/basvuru?edit=123'), '/basvuru?edit=123');
});

test('expired entrepreneur sessions return to their login and preserve the destination', () => {
  const destination = '/girisimciler/basvuru?event=ideathon-2025';
  assert.equal(loginUrl(destination), `/girisimciler/login?redirect=${encodeURIComponent(destination)}`);
  assert.equal(loginUrl('/basvuru?edit=123'), '/login?redirect=%2Fbasvuru%3Fedit%3D123');
  assert.equal(loginUrl('/girisimciler-other'), '/login?redirect=%2Fgirisimciler-other');
});

test('401 handling recognizes both existing and entrepreneur authentication pages', () => {
  for (const path of ['/login', '/register', '/forgot-password', '/reset-password', '/girisimciler/login', '/girisimciler/register']) {
    assert.equal(isAuthPage(path), true);
  }
  assert.equal(isAuthPage('/girisimciler/basvuru'), false);
});

test('entrepreneur recovery and resend keep the return destination through every step', () => {
  const destination = '/girisimciler/basvuru?step=documents';
  const links = authFlowLinks({ entrepreneur: true, redirect: destination });
  const register = new URL(links.register, 'https://example.com');
  assert.equal(register.pathname, '/girisimciler/register');
  assert.equal(register.searchParams.get('redirect'), destination);
  const reset = new URL(links.resetPassword('ornek+demo@example.com'), 'https://example.com');
  assert.equal(reset.searchParams.get('email'), 'ornek+demo@example.com');
  assert.equal(reset.searchParams.get('source'), 'girisimciler');
  const recoveryLinks = authFlowLinks({ entrepreneur: reset.searchParams.get('source') === 'girisimciler', redirect: reset.searchParams.get('redirect') });
  assert.equal(recoveryLinks.login, links.login);
  assert.equal(recoveryLinks.forgotPassword, links.forgotPassword);
  assert.equal(new URL(recoveryLinks.login, 'https://example.com').pathname, '/girisimciler/login');
});

test('standard auth links retain existing destinations and reject external return URLs', () => {
  const links = authFlowLinks();
  assert.equal(links.login, '/login');
  assert.equal(links.register, '/register');
  assert.equal(links.forgotPassword, '/forgot-password');
  assert.equal(links.resetPassword('test@example.com'), '/reset-password?email=test%40example.com');
  const malicious = authFlowLinks({ entrepreneur: true, redirect: '//external.example' });
  assert.equal(malicious.login, '/girisimciler/login');
  assert.equal(malicious.forgotPassword, '/forgot-password?source=girisimciler');
});
