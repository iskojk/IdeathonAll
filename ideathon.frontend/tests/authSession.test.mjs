import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../lib/auth.js', import.meta.url), 'utf8');
const { getAuthUser } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('sessions restore from the existing API me format and the login/register format', () => {
  const user = { _id: 'user-123', name: 'Demo', role: 'user', ideathonId: null };
  assert.deepEqual(getAuthUser({ success: true, data: user }), user);
  assert.deepEqual(getAuthUser({ success: true, data: { user, token: 'example' } }), user);
});

test('an empty or failed response does not overwrite the current session with an invalid user', () => {
  for (const response of [null, {}, { success: false, data: { _id: 'user-123' } }, { success: true, data: {} }, { success: true, data: { user: null } }]) {
    assert.equal(getAuthUser(response), null);
  }
});
