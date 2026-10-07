const mongoose = require('mongoose');
const Draft = require('../models/EntrepreneurFormDraft');
const { getSettings, validateForm, updateSettings } = require('./entrepreneurFormSettings');

const fail = (message, status = 422) => { throw Object.assign(new Error(message), { status }); };
const conflict = () => fail('Bu taslak başka bir oturumda değişti. Değişikliklerinizi indirin ve güncel taslağı yükleyin.', 409);
function validateName(name) {
  if (typeof name !== 'string' || !name.trim() || name.length > 150) fail('Taslak adı 1–150 karakter olmalıdır.');
  return name.trim();
}
function checkId(id) {
  if (!mongoose.isValidObjectId(id)) fail('Soru taslağı bulunamadı.', 404);
}
function checkRevision(revision) {
  if (!Number.isInteger(revision) || revision < 0) conflict();
}

async function ensureLegacyDraft() {
  if (await Draft.exists({ legacyKey: 'entrepreneur' })) return;
  const settings = await getSettings();
  // The singleton source is left intact for compatibility and active publication.
  // Wait for the unique index before concurrent first-time imports can proceed.
  await Draft.init();
  try {
    await Draft.findOneAndUpdate({ legacyKey: 'entrepreneur' }, { $setOnInsert: {
      name: 'Mevcut soru taslağı', form: settings.draft, revision: 0,
      createdBy: settings.updatedBy, updatedBy: settings.updatedBy,
      createdAt: settings.createdAt || new Date(), updatedAt: settings.updatedAt || new Date(),
    } }, { upsert: true, new: true, timestamps: false, setDefaultsOnInsert: true });
  } catch (error) { if (error.code !== 11000) throw error; }
}

async function listDrafts(query = {}) {
  const page = query.page === undefined ? 1 : Number(query.page);
  if ((query.page !== undefined && (typeof query.page !== 'string' || !/^\d+$/.test(query.page))) || !Number.isSafeInteger(page) || page < 1 || page > 100000) fail('Sayfa numarası geçersiz.', 400);
  await ensureLegacyDraft();
  const limit = 12;
  const [total, records] = await Promise.all([
    Draft.countDocuments(),
    Draft.find().sort({ updatedAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit)
      .select('name revision createdAt updatedAt form.title form.questions.id').lean(),
  ]);
  return { items: records.map(({ form, ...record }) => ({ ...record, title: form.title, questionCount: form.questions.length })), pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } };
}

async function getDraft(id) {
  checkId(id);
  const draft = await Draft.findById(id).lean();
  if (!draft) fail('Soru taslağı bulunamadı.', 404);
  return draft;
}

async function saveDraft(id, input = {}, userId) {
  if (id) { checkId(id); checkRevision(input.revision); }
  const changes = { name: validateName(input.name), form: validateForm(input.form), updatedBy: userId };
  if (!id) return (await Draft.create({ ...changes, createdBy: userId })).toObject();
  const result = await Draft.findOneAndUpdate({ _id: id, revision: input.revision }, { $set: changes, $inc: { revision: 1 } }, { new: true }).lean();
  if (!result) { await getDraft(id); conflict(); }
  return result;
}

async function publishDraft(id, input = {}, userId) {
  checkRevision(input.revision);
  const draft = await getDraft(id);
  if (draft.revision !== input.revision) conflict();
  // Publish this saved snapshot. An edit saved afterwards remains an unpublished
  // draft; the active form never references a mutable library document.
  const settings = await updateSettings({ form: draft.form, revision: input.settingsRevision }, userId, true);
  return { settings, draft };
}

module.exports = { listDrafts, getDraft, saveDraft, publishDraft };
