const test = require('node:test');
const assert = require('node:assert/strict');
const { report, generate } = require('../src/services/entrepreneurExport');
const application = {
  _id: 'qa-export', status: 'submitted', applicant: { name: 'Çağrı Işık', email: 'qa@example.test' },
  answers: { venture_name: 'İş & Çözüm <test>', long: 'Uzun yanıt: ş, ğ, ı, İ, ç, ö, ü.\n'.repeat(500) + 'SON YANIT', zero: 0, no: false, list: ['Bir', 'İki'], kvkk_ack: true, terms: true },
  form: { sections: [{ id: 's', title: 'Girişim Bilgileri' }, { id: 'legal', title: 'Eski KVKK bölümü' }], questions: [
    { id: 'long', section: 's', label: 'Kaydedilen soru başlığı', type: 'textarea' }, { id: 'zero', section: 's', label: 'Sıfır', type: 'text' },
    { id: 'no', section: 's', label: 'Hayır', type: 'text' }, { id: 'list', section: 's', label: 'Seçenekler', type: 'multipleChoice' },
    { id: 'files', section: 's', label: 'Evraklar', type: 'file' }, { id: 'empty', section: 's', label: 'Boş', type: 'text' },
    { id: 'kvkk_ack', section: 'legal', label: 'KVKK Onayı', type: 'consent' },
  ], agreements: [{ id: 'terms', label: 'Kullanım Şartları', acknowledgement: 'Okudum.' }] },
  documents: [{ name: 'Türkçe evrak.pdf', size: 1024, mimeType: 'application/pdf', questionId: 'files' }],
  privacy: { acknowledgedAt: '2026-10-08T07:00:00Z', agreements: [{ id: 'terms', acceptedAt: '2026-10-08T07:00:00Z', acknowledgement: 'Okudum.' }] },
  previousVersions: [{ form: { sections: [{ id: 'old', title: 'Eski bölüm' }], questions: [{ id: 'old', section: 'old', label: 'Önceki soru', type: 'text' }] }, answers: { old: 'Önceki yanıt' } }],
};
test('report preserves all answers, files, consent dates and earlier responses', () => {
  const blocks = report(application);
  const text = blocks.map(b => b.value).join('\n');
  for (const value of ['SON YANIT', '0', 'Onaylanmadı', 'Bir\nİki', 'Yanıt verilmedi.', 'Türkçe evrak.pdf', 'KVKK Onayı', 'Onay tarihi: 8 Ekim 2026', 'Önceki yanıt']) assert.ok(text.includes(value), value);
  assert.equal(blocks.filter(b => b.value === 'KVKK Onayı').length, 1);
  assert.ok(!text.includes('Eski KVKK bölümü'));
});
test('PDF supports long responses over multiple pages and embedded Unicode fonts', async () => {
  const result = await generate(application, 'pdf');
  const raw = result.contents.toString('latin1');
  assert.ok(raw.startsWith('%PDF-'));
  assert.ok((raw.match(/\/Type \/Page\b/g) || []).length > 4);
  assert.match(raw, /\/ToUnicode/);
  assert.match(raw, /\/FontFile2/);
});
test('invalid export formats are rejected', async () => {
  for (const format of ['docx', 'html', undefined, ['pdf'], '__proto__']) await assert.rejects(generate(application, format), { status: 400 });
});
