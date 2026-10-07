import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const provinces = require('../../ideathon.api/src/config/turkeyProvinces');
const source = await readFile(new URL('../lib/searchOptions.js', import.meta.url), 'utf8');
const { filterOptions } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('province search ignores case, Turkish diacritics and surrounding spaces', () => {
  for (const [query, result] of [['istanbul', 'İstanbul'], ['İSTANBUL', 'İstanbul'], ['ISTANBUL', 'İstanbul'], ['  izmir ', 'İzmir'], ['IGDIR', 'Iğdır'], ['sanliurfa', 'Şanlıurfa'], ['canakkale', 'Çanakkale'], ['duzce', 'Düzce']]) {
    assert.deepEqual(filterOptions(provinces, query), [result]);
  }
  assert.deepEqual(filterOptions(provinces, 'karahisar'), ['Afyonkarahisar']);
  assert.equal(filterOptions(provinces, '  ').length, 81);
  assert.deepEqual(filterOptions(provinces, 'olmayanşehir'), []);
});
