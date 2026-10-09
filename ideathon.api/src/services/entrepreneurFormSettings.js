const { createHash } = require('node:crypto');
const Settings = require('../models/EntrepreneurFormSettings');
const Publication = require('../models/EntrepreneurFormPublication');
const initial = require('../config/entrepreneurForm');
const agreements = require('../config/entrepreneurAgreements');
const { withoutKvkk } = require('./entrepreneurConsentPolicy');

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

// Shared allowlist for save/publish. The two mandatory agreements come from config.
function validateForm(input, { forPublication = false } = {}) {
  if (!input || typeof input !== 'object') fail('Soru seti eksik.');
  if (!Array.isArray(input.sections) || input.sections.length > 20) fail('En fazla 20 bölüm olabilir.');
  const sectionIds = new Set();
  const sections = input.sections.map(section => {
    if (!identifier(section?.id) || sectionIds.has(section.id)) fail('Bölüm kimlikleri benzersiz olmalıdır.');
    sectionIds.add(section.id);
    return { id: section.id, title: text(section.title, 150, 'Bölüm adı', true), description: text(section.description || '', 1000, 'Bölüm açıklaması') };
  });
  if (!Array.isArray(input.questions) || input.questions.length > 100) fail('En fazla 100 soru olabilir.');
  const current = withoutKvkk({ ...input, sections });
  const ids = new Set();
  const questions = current.questions.map(item => {
    if (!identifier(item?.id) || ids.has(item.id) || !sectionIds.has(item.section)) fail('Soru kimliği veya bölümü geçersiz.');
    if (agreements.some(agreement => agreement.id === item.id)) fail('Bu soru kimliği zorunlu gizlilik/kullanım onayına ayrılmıştır.');
    ids.add(item.id);
    if (!['text', 'textarea', 'singleChoice', 'multipleChoice', 'file'].includes(item.type) || typeof item.required !== 'boolean') fail('Cevap türü veya zorunluluk bilgisi geçersiz.');
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
    return question;
  });
  questions.sort((a, b) => sections.findIndex(s => s.id === a.section) - sections.findIndex(s => s.id === b.section));
  if (forPublication && !questions.length) fail('Yayımlamak için en az bir başvuru sorusu ekleyin.');
  return { id: initial.id, title: text(input.title, 200, 'Form başlığı', true), description: text(input.description || '', 1500, 'Form açıklaması'), isMock: false, sourceUrl: null, maxFileSize: initial.maxFileSize, acceptedFileTypes: initial.acceptedFileTypes, sections: current.sections, questions, agreements: structuredClone(agreements) };
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

function currentPublication(settings) {
  if (settings.publication) return settings.publication;
  if (!settings.publishedAt) return null;
  // Existing publications have no trustworthy library source. Do not guess one
  // from matching content or from the settings' last editor.
  return { _id: `legacy-${hash(JSON.stringify(settings.active))}-${new Date(settings.publishedAt).getTime()}`,
    formVersion: String(settings.active.version || ''), title: settings.active.title, publishedAt: settings.publishedAt };
}

async function listPublications(query = {}) {
  const page = query.page === undefined ? 1 : Number(query.page);
  if ((query.page !== undefined && (typeof query.page !== 'string' || !/^\d+$/.test(query.page))) || !Number.isSafeInteger(page) || page < 1 || page > 100000) fail('Sayfa numarası geçersiz.', 400);
  const current = currentPublication(await getSettings());
  const filter = current ? { _id: { $ne: current._id } } : {};
  const limit = 12, offset = (page - 1) * limit;
  const [count, records] = await Promise.all([
    Publication.countDocuments(filter),
    Publication.find(filter).sort({ publishedAt: -1, _id: -1 }).skip(Math.max(0, offset - (current ? 1 : 0))).limit(page === 1 && current ? limit - 1 : limit).lean(),
  ]);
  const items = records.map(record => ({ ...record, isCurrent: false }));
  if (page === 1 && current) items.unshift({ ...current, isCurrent: true });
  const total = count + (current ? 1 : 0);
  return { items, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } };
}

async function updateSettings({ form, revision }, userId, publish = false, source = null) {
  if (!Number.isInteger(revision) || revision < 0) fail('Soru setinin kayıt sürümü eksik.', 409);
  const validated = validateForm(form, { forPublication: publish });
  const current = await getSettings();
  if (current.revision !== revision) fail('Soru seti başka bir oturumda değişti. Değişikliklerinizi indirin ve güncel sürümü yükleyin.', 409);
  const changes = { draft: validated, updatedBy: userId };
  if (publish) {
    validated.version = `admin-${revision + 1}-${hash(JSON.stringify(validated))}`;
    changes.active = validated;
    changes.publishedAt = new Date();
    const previous = currentPublication(current);
    if (previous) {
      await Publication.init();
      try {
        const { _id, ...record } = previous;
        await Publication.updateOne({ _id }, { $setOnInsert: record }, { upsert: true });
      } catch (error) { if (error.code !== 11000) throw error; }
    }
    changes.publication = { _id: validated.version, formVersion: validated.version, title: validated.title,
      publishedAt: changes.publishedAt, publishedBy: userId,
      ...(source ? { draftId: source._id, draftName: source.name, draftRevision: source.revision } : {}) };
  }
  const result = await Settings.findOneAndUpdate({ _id: 'entrepreneur', revision }, { $set: changes, $inc: { revision: 1 } }, { new: true }).lean();
  if (!result) fail('Soru seti başka bir oturumda değişti. Değişikliklerinizi indirin ve güncel sürümü yükleyin.', 409);
  return result;
}

module.exports = { validateForm, getSettings, updateSettings, currentPublication, listPublications };
