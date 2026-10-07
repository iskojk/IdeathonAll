const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeDocumentName } = require('../src/services/entrepreneurDocumentName');

test('multipart UTF-8 names retain Turkish letters and Unicode without damaging decoded or Latin-1 names', () => {
  for (const name of ['girişim-çığ-şirket.pdf', 'ürün-özeti.pdf', 'sunum.pdf', 'sunum-🚀.pdf', '資料.pdf']) {
    assert.equal(normalizeDocumentName(Buffer.from(name).toString('latin1')), name);
    assert.equal(normalizeDocumentName(name), name);
  }
  assert.equal(normalizeDocumentName('café.pdf'), 'café.pdf');
});

test('decoded upload names cannot retain directory paths or control characters', () => {
  assert.equal(normalizeDocumentName(Buffer.from('../girişim.pdf').toString('latin1')), 'girişim.pdf');
  assert.equal(normalizeDocumentName('C:\\files\\sunum.pdf'), 'sunum.pdf');
  assert.equal(normalizeDocumentName('sunum\u0000\r\n.pdf'), 'sunum.pdf');
});
