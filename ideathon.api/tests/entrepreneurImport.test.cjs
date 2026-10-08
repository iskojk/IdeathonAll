const test = require('node:test');
const assert = require('node:assert/strict');
const ExcelJS = require('exceljs');
const excel = require('../src/services/entrepreneurImportExcel');
const { preview, matchFields, capabilities } = require('../src/services/entrepreneurImport');
const form = {
  version: 'test-v1', sections: [{ id: 'contact', title: 'Kişi bilgileri' }, { id: 'venture', title: 'Girişim' }],
  questions: [
    { id: 'full_name', section: 'contact', label: 'Ad soyad', type: 'text', required: true },
    { id: 'email', section: 'contact', label: 'E-posta', type: 'text', inputType: 'email', required: true },
    { id: 'phone', section: 'contact', label: 'Telefon', type: 'text', inputType: 'tel' },
    { id: 'venture_name', section: 'venture', label: 'Girişim adı', type: 'text', required: true },
    { id: 'focus', section: 'venture', label: 'Odak alanları', type: 'multipleChoice', options: ['Yapay zekâ', 'Gayrimenkul'] },
    { id: 'stage', section: 'venture', label: 'Aşama', type: 'singleChoice', options: ['Fikir', 'PoC'] },
    { id: 'date', section: 'venture', label: 'Kuruluş tarihi', type: 'text', inputType: 'date' },
    { id: 'team_size', section: 'venture', label: 'Ekip büyüklüğü', type: 'text', inputType: 'number' },
    { id: 'kvkk_ack', label: 'KVKK', type: 'consent', required: true },
    { id: 'pitch', label: 'Sunum', type: 'file', required: true },
  ],
};
const values = { full_name: 'Deneme Girişimci', email: 'excel@example.com', phone: '0532 123 45 67', venture_name: 'Excel Testi', focus: 'Yapay zekâ\nGayrimenkul', stage: 'PoC', date: new Date('2026-10-08'), team_size: 0 };
async function filled() {
  const file = await excel.template(form);
  const book = new ExcelJS.Workbook(); await book.xlsx.load(file.contents);
  book.getWorksheet('Başvuru').eachRow((row, i) => { if (i >= 8) row.getCell(4).value = values[row.getCell(1).value]; });
  return book;
}
async function upload(book, active = form) { return preview({ buffer: Buffer.from(await book.xlsx.writeBuffer()), originalname: 'başvuru.xlsx' }, active); }

test('Excel template and preview roundtrip use current questions, typed values and contact autofill', async () => {
  assert.equal(capabilities().ready, true);
  const book = await filled();
  assert.equal(book.getWorksheet('Başvuru').getColumn(1).hidden, true);
  assert.equal(book.getWorksheet('Başvuru').getRow(7).getCell(4).value, 'Yanıt');
  const result = await upload(book);
  assert.equal(result.status, 'review');
  assert.deepEqual(result.contact, { name: 'Deneme Girişimci', email: 'excel@example.com', phone: '+905321234567', ventureName: 'Excel Testi' });
  assert.deepEqual(result.answers.focus, ['Yapay zekâ', 'Gayrimenkul']);
  assert.equal(result.answers.team_size, '0'); assert.equal(result.answers.date, '2026-10-08');
  assert.equal(result.answers.kvkk_ack, undefined); assert.equal(result.answers.pitch, undefined);
  assert.equal(result.matches.length, 8); assert.equal(result.issues.length, 0);
  await assert.rejects(upload(book, { ...form, version: 'new-form' }), { status: 409 });
});

test('generic Excel headers and exact labels match independently of row order', async () => {
  const book = new ExcelJS.Workbook(); const sheet = book.addWorksheet('Yanıtlar');
  sheet.addRow(['Yanıt', 'Soru', 'Bölüm']);
  sheet.addRow(['Excel Testi', 'Girişim adı', 'Girişim']);
  sheet.addRow(['Deneme Girişimci', 'Ad soyad', 'Kişi bilgileri']);
  sheet.addRow(['excel@example.com', 'E-posta', 'Kişi bilgileri']);
  const result = await upload(book);
  assert.equal(result.contact.name, 'Deneme Girişimci'); assert.equal(result.matches.length, 3);
  sheet.addRow(['Fikir', 'Aşama değişti', 'Girişim']);
  const changed = await upload(book); assert.equal(changed.answers.stage, undefined); assert.equal(changed.issues.length, 1);
});

test('duplicates, ambiguous labels, unknown fields, invalid formats and consent never get guessed', () => {
  const result = matchFields(form, [
    { questionId: 'full_name', label: 'Ad soyad', value: 'Birinci' }, { questionId: 'full_name', label: 'Ad soyad', value: 'İkinci' },
    { questionId: 'email', value: 'invalid' }, { questionId: 'kvkk_ack', value: true }, { questionId: 'stage', value: 'Uydurma' },
    { questionId: 'venture_name', label: 'Yanlış soru', value: 'Yanlış yanıt' },
  ]);
  for (const id of ['full_name', 'email', 'kvkk_ack', 'stage', 'venture_name']) assert.equal(result.answers[id], undefined);
  assert.equal(result.matches.length, 0); assert.ok(result.issues.length >= 6);
  const ambiguous = { ...form, questions: [...form.questions, { ...form.questions[0], id: 'other_name', section: 'venture' }] };
  assert.equal(matchFields(ambiguous, [{ label: 'Ad soyad', value: 'Deneme' }]).matches.length, 0);
  assert.equal(matchFields(ambiguous, [{ label: 'Ad soyad', section: 'Kişi bilgileri', value: 'Deneme' }]).answers.full_name, 'Deneme');
});

test('invalid files, blank answers, formulas and multiple applicant tables are rejected', async () => {
  await assert.rejects(preview({ originalname: 'file.pdf', buffer: Buffer.from('%PDF-1.4') }, form), { status: 422 });
  await assert.rejects(preview({ originalname: 'file.xlsx', buffer: Buffer.from('PK\x03\x04fake') }, form), { status: 422 });
  const blank = await excel.template(form); await assert.rejects(preview({ originalname: 'blank.xlsx', buffer: blank.contents }, form), { status: 422 });
  const book = await filled(); book.getWorksheet('Başvuru').getCell('D8').value = { formula: '1+1', result: 2 };
  await assert.rejects(upload(book), { status: 422 });
  const duplicate = await filled(); duplicate.addWorksheet('İkinci').addRow(['Soru', 'Yanıt']);
  await assert.rejects(upload(duplicate), { status: 422 });
});
