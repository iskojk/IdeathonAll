const { createHash } = require('node:crypto');
const Settings = require('../models/EntrepreneurFormSettings');
const initial = require('../config/entrepreneurForm');
const { acknowledgement } = require('../config/entrepreneurQuestionSet');
const agreements = require('../config/entrepreneurAgreements');

const fail = (message, status = 422) => { throw Object.assign(new Error(message), { status }); };
const hash = value => createHash('sha256').update(value).digest('hex').slice(0, 16);
const identifier = value => typeof value === 'string' && /^[a-z][a-z0-9_]{0,63}$/.test(value) && !['constructor', 'prototype', '__proto__'].includes(value);
function text(value, max, label, required = false) {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) fail(`${label} geçersiz veya çok uzun.`);
  return value.trim();
}
function integer(value, max, label) {
  if (!Number.isInteger(value) || value < 1 || value > max) fail(`${label} 1–${max} arasında olmalıdır.`);
  return value;
}

// Shared allowlist for save/publish. Upload limits and mandatory KVKK cannot be bypassed.
function validateForm(input, { forPublication = false } = {}) {
  if (!input || typeof input !== 'object') fail('Soru seti eksik.');
  if (!Array.isArray(input.sections) || !input.sections.length || input.sections.length > 20) fail('1–20 bölüm olmalıdır.');
  const sectionIds = new Set();
  const sections = input.sections.map(section => {
    if (!identifier(section?.id) || sectionIds.has(section.id)) fail('Bölüm kimlikleri benzersiz olmalıdır.');
    sectionIds.add(section.id);
    return { id: section.id, title: text(section.title, 150, 'Bölüm adı', true), description: text(section.description || '', 1000, 'Bölüm açıklaması') };
  });
  if (!Array.isArray(input.questions) || !input.questions.length || input.questions.length > 100) fail('1–100 soru olmalıdır.');
  const ids = new Set();
  const questions = input.questions.map(item => {
    if (!identifier(item?.id) || ids.has(item.id) || !sectionIds.has(item.section)) fail('Soru kimliği veya bölümü geçersiz.');
    if (agreements.some(agreement => agreement.id === item.id)) fail('Bu soru kimliği zorunlu gizlilik/kullanım onayına ayrılmıştır.');
    ids.add(item.id);
    if (!['text', 'textarea', 'singleChoice', 'multipleChoice', 'file', 'consent'].includes(item.type) || typeof item.required !== 'boolean') fail('Cevap türü veya zorunluluk bilgisi geçersiz.');
    const question = { id: item.id, section: item.section, type: item.type, required: item.required, label: text(item.label, 500, 'Soru metni', true), help: text(item.help || '', item.type === 'consent' ? 20000 : 2000, 'Soru açıklaması'), placeholder: text(item.placeholder || '', 500, 'Yer tutucu') };
    if (['text', 'textarea'].includes(item.type)) {
      question.maxLength = integer(item.maxLength, 10000, 'Karakter sınırı');
      if (item.type === 'text') {
        if (!['text', 'email', 'tel', 'url', 'date', 'number'].includes(item.inputType || 'text')) fail('Metin formatı geçersiz.');
        question.inputType = item.inputType || 'text';
      }
      if (['name', 'email', 'phone'].includes(item.prefill)) question.prefill = item.prefill;
    }
    if (['singleChoice', 'multipleChoice'].includes(item.type)) {
      if (!Array.isArray(item.options) || item.options.length < 2 || item.options.length > (item.type === 'singleChoice' ? 100 : 30)) fail('Tek seçimde 2–100, çoklu seçimde 2–30 seçenek olmalıdır.');
      question.options = item.options.map(option => text(option, 300, 'Seçenek', true));
      if (new Set(question.options).size !== question.options.length) fail('Seçenekler tekrarlanmamalıdır.');
      if (item.searchPlaceholder) question.searchPlaceholder = text(item.searchPlaceholder, 100, 'Arama yer tutucusu');
    }
    if (item.type === 'file') question.maxFiles = integer(item.maxFiles, 10, 'Dosya sayısı');
    if (item.type === 'consent' && item.id !== 'kvkk_ack') fail('Onay türü yalnızca KVKK sorusunda kullanılabilir.');
    return question;
  });
  questions.sort((a, b) => sections.findIndex(s => s.id === a.section) - sections.findIndex(s => s.id === b.section));
  const consent = questions.find(question => question.id === 'kvkk_ack');
  if (forPublication && !questions.some(question => question.type !== 'consent')) fail('Yayımlamak için en az bir başvuru sorusu ekleyin.');
  if (!consent || consent.type !== 'consent' || !consent.required || questions.at(-1) !== consent || consent.help.length < 50) fail('Son soru zorunlu KVKK onayı ve aydınlatma metni olmalıdır.');
  const privacy = { text: consent.help, version: hash(consent.help), draft: input.privacy?.draft !== false };
  if (!privacy.draft && /\[[^\]]+\]/.test(privacy.text)) fail('KVKK metnindeki kurum bilgilerini tamamlamadan taslak işaretini kaldıramazsınız.');
  Object.assign(consent, { options: [acknowledgement], privacyVersion: privacy.version, privacyDraft: privacy.draft });
  return { id: initial.id, title: text(input.title, 200, 'Form başlığı', true), description: text(input.description || '', 1500, 'Form açıklaması'), isMock: false, sourceUrl: null, maxFileSize: initial.maxFileSize, acceptedFileTypes: initial.acceptedFileTypes, sections, questions, privacy, agreements: structuredClone(agreements) };
}

async function getSettings() {
  const existing = await Settings.findById('entrepreneur').lean();
  if (existing) return existing;
  try {
    return await Settings.findOneAndUpdate({ _id: 'entrepreneur' }, { $setOnInsert: { active: initial, draft: initial, revision: 0 } }, { upsert: true, new: true }).lean();
  } catch (error) {
    if (error.code !== 11000) throw error;
    return Settings.findById('entrepreneur').lean();
  }
}

async function updateSettings({ form, revision }, userId, publish = false) {
  if (!Number.isInteger(revision) || revision < 0) fail('Soru setinin kayıt sürümü eksik.', 409);
  const validated = validateForm(form, { forPublication: publish });
  await getSettings();
  const changes = { draft: validated, updatedBy: userId };
  if (publish) {
    validated.version = `admin-${revision + 1}-${hash(JSON.stringify(validated))}`;
    changes.active = validated;
    changes.publishedAt = new Date();
  }
  const result = await Settings.findOneAndUpdate({ _id: 'entrepreneur', revision }, { $set: changes, $inc: { revision: 1 } }, { new: true }).lean();
  if (!result) fail('Soru seti başka bir oturumda değişti. Değişikliklerinizi indirin ve güncel sürümü yükleyin.', 409);
  return result;
}

module.exports = { validateForm, getSettings, updateSettings };
