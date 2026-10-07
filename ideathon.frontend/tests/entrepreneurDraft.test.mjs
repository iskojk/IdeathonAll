import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../lib/entrepreneurDraft.js', import.meta.url), 'utf8');
const { readDraft, storeDraft, clearDraft, canRestoreDraft } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('unsaved drafts survive remounts, stay per-user, and never overwrite a different server revision', () => {
  const storage = new Map();
  globalThis.sessionStorage = { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
  const form = { version: 2 };
  const application = { _id: 'application-a', revision: 3, status: 'draft' };
  storeDraft('user-a', form, application, { phone: 'incomplete', venture_name: 'Son yazılan yanıt' });
  const draft = readDraft('user-a');
  assert.equal(draft.answers.venture_name, 'Son yazılan yanıt');
  assert.equal(readDraft('user-b'), null);
  assert.ok(canRestoreDraft(draft, form, application));
  for (const next of [{ ...application, revision: 4 }, { ...application, status: 'submitted' }, { ...application, _id: 'other' }, null]) {
    assert.equal(canRestoreDraft(draft, form, next), false);
  }
  assert.equal(canRestoreDraft(draft, { version: 3 }, application), false);
  clearDraft('user-a');
  assert.equal(readDraft('user-a'), null);
  storeDraft('user-a', form, null, { venture_name: 'Henüz kayıt yok' });
  assert.ok(canRestoreDraft(readDraft('user-a'), form, null));
  delete globalThis.sessionStorage;
});

test('blocked or damaged storage does not crash the application', () => {
  globalThis.sessionStorage = { getItem() { return '{invalid'; }, setItem() { throw new Error('Blocked'); }, removeItem() { throw new Error('Blocked'); } };
  assert.equal(readDraft('user-a'), null);
  assert.doesNotThrow(() => storeDraft('user-a', { version: 2 }, null, {}));
  assert.doesNotThrow(() => clearDraft('user-a'));
  delete globalThis.sessionStorage;
});
