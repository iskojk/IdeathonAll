const mongoose = require('mongoose');
const { isDeepStrictEqual } = require('node:util');
const Draft = require('../models/EntrepreneurFormDraft');
const Version = require('../models/EntrepreneurFormDraftVersion');
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
  const view = query.view === undefined ? 'active' : query.view;
  if (!['active', 'deleted'].includes(view)) fail('Taslak görünümü geçersiz.', 400);
  const page = query.page === undefined ? 1 : Number(query.page);
  if ((query.page !== undefined && (typeof query.page !== 'string' || !/^\d+$/.test(query.page))) || !Number.isSafeInteger(page) || page < 1 || page > 100000) fail('Sayfa numarası geçersiz.', 400);
  await ensureLegacyDraft();
  const limit = 12;
  const filter = { deletedAt: view === 'deleted' ? { $ne: null } : null };
  const [total, records] = await Promise.all([
    Draft.countDocuments(filter),
    Draft.find(filter).sort(view === 'deleted' ? { deletedAt: -1, _id: -1 } : { createdAt: 1, _id: 1 }).skip((page - 1) * limit).limit(limit)
      .select('name revision createdAt updatedAt deletedAt form.title form.questions.type').lean(),
  ]);
  return { items: records.map(({ form, ...record }) => ({ ...record, title: form.title, questionCount: form.questions.filter(q => q.type !== 'consent').length })), pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } };
}

async function getDraft(id) {
  checkId(id);
  const draft = await Draft.findOne({ _id: id, deletedAt: null }).lean();
  if (!draft) fail('Soru taslağı bulunamadı.', 404);
  return draft;
}

async function saveDraft(id, input = {}, userId) {
  if (id) { checkId(id); checkRevision(input.revision); }
  const changes = { name: validateName(input.name), form: validateForm(input.form), updatedBy: userId };
  if (!id) return (await Draft.create({ ...changes, createdBy: userId })).toObject();
  const current = await getDraft(id);
  if (current.revision !== input.revision) conflict();
  if (current.name === changes.name && isDeepStrictEqual(validateForm(current.form), changes.form)) return current;
  // Preserve the outgoing snapshot before advancing the draft. This also works
  // on standalone MongoDB: a failed write cannot destroy an older version.
  await Version.init();
  try {
    await Version.updateOne({ draftId: current._id, revision: current.revision }, { $setOnInsert: {
      name: current.name, form: current.form, savedAt: current.updatedAt,
      savedBy: current.updatedBy || current.createdBy,
    } }, { upsert: true });
  } catch (error) { if (error.code !== 11000) throw error; }
  const result = await Draft.findOneAndUpdate({ _id: id, revision: input.revision, deletedAt: null }, { $set: changes, $inc: { revision: 1 } }, { new: true }).lean();
  if (!result) { await getDraft(id); conflict(); }
  return result;
}

async function deleteDraft(id, input = {}, userId) {
  checkId(id); checkRevision(input.revision);
  const result = await Draft.findOneAndUpdate({ _id: id, revision: input.revision, deletedAt: null }, {
    $set: { deletedAt: new Date(), deletedBy: userId },
  }, { new: true, timestamps: false }).lean();
  if (!result) { await getDraft(id); conflict(); }
  return { _id: result._id, deletedAt: result.deletedAt };
}

async function restoreDraft(id, input = {}) {
  checkId(id); checkRevision(input.revision);
  // Match the deletion timestamp too: a stale list cannot undo a later deletion.
  const deletedAt = typeof input.deletedAt === 'string' ? new Date(input.deletedAt) : new Date(NaN);
  if (!Number.isFinite(deletedAt.getTime())) fail('Silinen form bilgisi güncel değil. Listeyi yenileyin.', 409);
  const result = await Draft.findOneAndUpdate({ _id: id, revision: input.revision, deletedAt }, {
    $unset: { deletedAt: 1, deletedBy: 1 },
  }, { new: true, timestamps: false }).lean();
  if (!result) fail('Bu form başka bir oturumda değişti. Silinen formlar listesini yenileyin.', 409);
  return result;
}

async function listVersions(id, query = {}) {
  const page = query.page === undefined ? 1 : Number(query.page);
  if ((query.page !== undefined && (typeof query.page !== 'string' || !/^\d+$/.test(query.page))) || !Number.isSafeInteger(page) || page < 1 || page > 100000) fail('Sayfa numarası geçersiz.', 400);
  const current = await getDraft(id);
  const filter = { draftId: current._id, revision: { $lt: current.revision } };
  const limit = 12, offset = (page - 1) * limit;
  const [count, records] = await Promise.all([
    Version.countDocuments(filter),
    Version.find(filter).sort({ revision: -1 }).skip(Math.max(0, offset - 1)).limit(page === 1 ? limit - 1 : limit).select('revision name savedAt form.questions.type').lean(),
  ]);
  const items = records.map(({ form, ...record }) => ({ ...record, questionCount: form.questions.filter(q => q.type !== 'consent').length, isCurrent: false }));
  if (page === 1) items.unshift({ revision: current.revision, name: current.name, savedAt: current.updatedAt, questionCount: current.form.questions.filter(q => q.type !== 'consent').length, isCurrent: true });
  return { items, pagination: { page, limit, total: count + 1, pages: Math.max(1, Math.ceil((count + 1) / limit)) } };
}

async function getVersion(id, revision) {
  if (typeof revision !== 'string' || !/^\d+$/.test(revision) || !Number.isSafeInteger(Number(revision))) fail('Sürüm numarası geçersiz.', 400);
  const current = await getDraft(id);
  const version = Number(revision) === current.revision ? { revision: current.revision, name: current.name, form: current.form, savedAt: current.updatedAt } : await Version.findOne({ draftId: current._id, revision: Number(revision) }).select('revision name form savedAt').lean();
  if (!version) fail('Taslak sürümü bulunamadı.', 404);
  return { draft: current, version };
}

async function publishDraft(id, input = {}, userId) {
  checkRevision(input.revision);
  const draft = await getDraft(id);
  if (draft.revision !== input.revision) conflict();
  // Publish this saved snapshot. An edit saved afterwards remains an unpublished
  // draft; the active form never references a mutable library document.
  const settings = await updateSettings({ form: draft.form, revision: input.settingsRevision }, userId, true, draft);
  return { settings, draft };
}

module.exports = { listDrafts, getDraft, saveDraft, publishDraft, listVersions, getVersion, deleteDraft, restoreDraft };
