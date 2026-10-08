const { editableQuestions } = require('./entrepreneurPoolManagement');
const { validateAnswers } = require('./entrepreneurValidation');
const { normalizeDocumentName } = require('./entrepreneurDocumentName');

const MAX_SIZE = 10 * 1024 * 1024;
// A format adapter must return { fields: [{ questionId?, label?, section?, value }] }.
const adapters = Object.freeze([require('./entrepreneurImportExcel')]);
const capabilities = () => ({ ready: adapters.length > 0, maxSize: MAX_SIZE, formats: adapters.map(({ id, label, extensions }) => ({ id, label, extensions })) });
const fail = message => { throw Object.assign(new Error(message), { status: 422 }); };
const normalized = value => typeof value === 'string' ? value.normalize('NFC').trim().replace(/\s+/g, ' ') : '';

function matchFields(form, fields) {
  if (!Array.isArray(fields) || fields.length > 500) fail('Dosyadaki soru ve yanıtlar okunamadı.');
  const questions = editableQuestions(form);
  const answers = {};
  const matches = [];
  const issues = [];
  const seen = new Set();
  const duplicated = new Set();
  for (const field of fields) {
    if (!field || typeof field !== 'object') fail('Dosyadaki soru ve yanıtlar okunamadı.');
    const candidates = questions.filter(q => field.questionId ? q.id === field.questionId && (!field.label || normalized(q.label) === normalized(field.label)) : normalized(field.label) && normalized(q.label) === normalized(field.label) && (!field.section || normalized(form.sections?.find(s => s.id === q.section)?.title) === normalized(field.section)));
    if (candidates.length !== 1) {
      issues.push({ label: normalized(field.label).slice(0, 500) || 'İsimsiz alan', reason: candidates.length > 1 ? 'Birden fazla soruyla eşleşiyor; otomatik aktarılmadı.' : 'Soru setiyle birebir eşleşmedi veya onay/evrak alanı olduğu için aktarılmadı.' });
      continue;
    }
    const q = candidates[0];
    if (seen.has(q.id)) {
      delete answers[q.id]; duplicated.add(q.id);
      issues.push({ questionId: q.id, label: q.label, reason: 'Bu sorunun birden fazla yanıtı var; otomatik aktarılmadı.' });
      continue;
    }
    seen.add(q.id);
    const validation = validateAnswers({ questions: [q] }, { [q.id]: field.value });
    if (Object.keys(validation.errors).length) {
      issues.push({ questionId: q.id, label: q.label, reason: validation.errors[q.id] || 'Yanıt formatı geçersiz.' });
      continue;
    }
    if (Object.hasOwn(validation.answers, q.id)) {
      answers[q.id] = validation.answers[q.id];
      matches.push({ questionId: q.id, label: q.label });
    }
  }
  for (const q of questions) if (q.required && !Object.hasOwn(answers, q.id) && !issues.some(item => item.questionId === q.id)) issues.push({ questionId: q.id, label: q.label, reason: 'Zorunlu sorunun yanıtı eksik; kaydetmeden önce tamamlayın.' });
  const name = answers.full_name || [answers.first_name, answers.last_name].filter(Boolean).join(' ');
  const contact = { name: typeof name === 'string' ? name : '', email: typeof answers.email === 'string' ? answers.email : '', phone: typeof answers.phone === 'string' ? answers.phone : '', ventureName: typeof answers.venture_name === 'string' ? answers.venture_name : '' };
  return { contact, answers, matches: matches.filter(item => !duplicated.has(item.questionId)), issues };
}

async function preview(file, form, readers = adapters) {
  if (!file?.buffer?.length) fail('Doldurulmuş soru seti dosyasını seçin.');
  if (file.buffer.length > MAX_SIZE) fail('Dosya boyutu en fazla 10 MB olabilir.');
  const info = { name: normalizeDocumentName(file.originalname), size: file.buffer.length };
  if (!readers.length) return { status: 'awaiting_format', file: info, message: 'Dosya seçildi. Dosya formatı kesinleştiğinde otomatik soru–cevap eşleştirmesi etkinleşecek. Henüz kayıt oluşturulmadı.' };
  const reader = readers.find(adapter => adapter.accepts(file));
  if (!reader) fail('Bu dosya biçimi henüz desteklenmiyor.');
  const parsed = await reader.parse(file.buffer, form);
  const matched = matchFields(form, parsed.fields);
  if (!matched.matches.length) fail('Dosyadaki yanıtlar soru setiyle eşleşmedi. Güncel Excel şablonunu kullanın.');
  return { status: 'review', file: info, form, ...matched };
}

module.exports = { capabilities, preview, matchFields, MAX_SIZE };
