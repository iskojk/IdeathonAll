import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
const r = createRequire(new URL('../ideathon.api/package.json', import.meta.url));
const env = r('dotenv').parse(readFileSync(new URL('../ideathon.api/.env', import.meta.url)));
assert.equal(env.MONGODB_URI, 'mongodb://127.0.0.1:27027/ideathon_local');
const mongoose = r('mongoose');
const dbName = `ideathon_local_draft_qa_${randomBytes(6).toString('hex')}`;
await mongoose.connect(`mongodb://127.0.0.1:27027/${dbName}`);
const drafts = r('./src/services/entrepreneurFormDrafts');
const settings = r('./src/services/entrepreneurFormSettings');
const Version = r('./src/models/EntrepreneurFormDraftVersion');
const Draft = r('./src/models/EntrepreneurFormDraft');
try {
  const initial = await settings.getSettings();
  assert.equal((await settings.listPublications()).items.length, 0);
  const consent = initial.active.questions.find(q => q.id === 'kvkk_ack');
  const blank = { ...structuredClone(initial.active), sections: initial.active.sections.filter(s => s.id === consent.section), questions: [consent] };
  let empty = await drafts.saveDraft(null, { name: 'Boş taslak', form: blank });
  assert.equal(empty.form.questions.length, 1);
  await assert.rejects(drafts.publishDraft(empty._id, { revision: 0, settingsRevision: initial.revision }), error => error.status === 422);
  assert.deepEqual(await settings.getSettings(), initial, 'Boş taslak yayımlanmamalı.');
  const form = { ...blank, sections: [{ id: 'business', title: 'Girişim', description: '' }, ...blank.sections], questions: [
    { id: 'first', section: 'business', type: 'text', label: 'Girişim adı', inputType: 'text', required: true, maxLength: 200 },
    { id: 'second', section: 'business', type: 'singleChoice', label: 'Aşama', options: ['Fikir', 'Ürün'], required: false },
    { id: 'third', section: 'business', type: 'multipleChoice', label: 'Alanlar', options: ['Yazılım', 'Donanım'], required: false },
    { id: 'fourth', section: 'business', type: 'file', label: 'Sunum', maxFiles: 2, required: false },
    consent,
  ] };
  let draft = await drafts.saveDraft(null, { name: 'İlk form', form });
  const unchanged = await drafts.saveDraft(draft._id, { name: draft.name, form: draft.form, revision: draft.revision });
  assert.deepEqual(unchanged, draft, 'Aynı içerik tarih veya sürüm artırmamalı.');
  assert.equal(await Version.countDocuments({ draftId: draft._id }), 0);
  const original = structuredClone(draft);
  const reordered = { ...form, questions: [form.questions[2], form.questions[0], form.questions[3], form.questions[1], consent] };
  draft = await drafts.saveDraft(draft._id, { name: 'Güncel form', form: reordered, revision: draft.revision });
  assert.deepEqual(draft.form.questions.map(q => q.id), ['third', 'first', 'fourth', 'second', 'kvkk_ack']);
  assert.deepEqual((await drafts.getVersion(draft._id, '0')).version.form, original.form);
  const revisionOne = structuredClone(draft);
  const competing = await Promise.allSettled(['A', 'B'].map(label => drafts.saveDraft(draft._id, { name: label, form: draft.form, revision: draft.revision })));
  assert.equal(competing.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(competing.find(result => result.status === 'rejected').reason.status, 409);
  draft = await drafts.getDraft(draft._id);
  assert.equal(draft.revision, 2);
  assert.deepEqual((await drafts.getVersion(draft._id, '1')).version.form, revisionOne.form);
  assert.equal(await Version.countDocuments({ draftId: draft._id }), 2);
  const copied = await drafts.saveDraft(null, { name: 'Ayrı kopya', form: draft.form });
  assert.notEqual(String(copied._id), String(draft._id));
  assert.equal(copied.revision, 0);
  assert.equal((await drafts.listVersions(copied._id)).items.length, 1);
  const historical = await drafts.getVersion(draft._id, '0');
  draft = await drafts.saveDraft(draft._id, { name: historical.version.name, form: historical.version.form, revision: historical.draft.revision });
  assert.equal(draft.revision, 3);
  assert.deepEqual(draft.form, original.form);
  // A copy appears below its source; saving a version must not reorder cards.
  const listed = (await drafts.listDrafts()).items.map(item => String(item._id));
  assert(listed.indexOf(String(draft._id)) < listed.indexOf(String(copied._id)), 'Yeni kopya kaynağından sonra listelenmeli.');
  const beforeInvalid = draft;
  await assert.rejects(drafts.saveDraft(draft._id, { name: 'Geçersiz', form: { ...draft.form, questions: draft.form.questions.map(q => q.type === 'singleChoice' ? { ...q, options: ['Tek'] } : q) }, revision: draft.revision }), error => error.status === 422);
  assert.deepEqual(await drafts.getDraft(draft._id), beforeInvalid);
  for (let i = 0; i < 12; i++) draft = await drafts.saveDraft(draft._id, { name: `Sürüm testi ${i}`, form: draft.form, revision: draft.revision });
  assert.deepEqual((await drafts.listDrafts()).items.map(item => String(item._id)), listed, 'Sürüm güncellemesi taslak kartlarının sırasını değiştirmemeli.');
  const first = await drafts.listVersions(draft._id), second = await drafts.listVersions(draft._id, { page: '2' });
  assert.equal(first.items.length, 12); assert.equal(second.items.length, 4);
  assert.deepEqual([...first.items, ...second.items].map(item => item.revision), Array.from({ length: 16 }, (_, index) => 15 - index));
  await assert.rejects(drafts.getVersion(draft._id, '-1'), error => error.status === 400);
  await assert.rejects(drafts.getVersion(draft._id, '999'), error => error.status === 404);
  await assert.rejects(drafts.saveDraft(draft._id, { name: 'Eski yazma', form: draft.form, revision: 0 }), error => error.status === 409);
  const activeBefore = await settings.getSettings(); assert.deepEqual(activeBefore, initial);
  const published = await drafts.publishDraft(draft._id, { revision: draft.revision, settingsRevision: initial.revision });
  assert.equal(String(published.settings.publication.draftId), String(draft._id));
  assert.equal(published.settings.publication.draftName, draft.name);
  assert.equal(published.settings.publication.draftRevision, draft.revision);
  assert.equal(published.settings.publication.formVersion, published.settings.active.version);
  assert.equal((await settings.listPublications()).items.length, 1);
  const active = structuredClone(published.settings.active);
  draft = await drafts.saveDraft(draft._id, { name: 'Yayımdan sonra', form: { ...draft.form, title: 'Yayımlanmamış başlık' }, revision: draft.revision });
  assert.deepEqual((await settings.getSettings()).active, active);
  assert.deepEqual((await settings.getSettings()).publication, published.settings.publication, 'Düzenleme/yeniden adlandırma yayın kimliğini değiştirmemeli.');
  await assert.rejects(drafts.publishDraft(draft._id, { revision: 0, settingsRevision: published.settings.revision }), error => error.status === 409);
  const legacy = await Draft.create({ name: 'Geçmişi olmayan eski taslak', revision: 5, form: original.form });
  await drafts.saveDraft(legacy._id, { name: `${legacy.name} güncel`, form: legacy.form, revision: 5 });
  assert.deepEqual((await drafts.listVersions(legacy._id)).items.map(item => item.revision), [6, 5]);
  // Removing a draft only changes its library visibility; publication and
  // version snapshots remain independent and can be recovered without renumbering.
  const historyBeforeDelete = await drafts.listVersions(draft._id);
  const settingsBeforeDelete = await settings.getSettings();
  await assert.rejects(drafts.deleteDraft(draft._id, { revision: draft.revision - 1 }), error => error.status === 409);
  const deleted = await drafts.deleteDraft(draft._id, { revision: draft.revision });
  const activeDrafts = await drafts.listDrafts();
  const deletedDrafts = await drafts.listDrafts({ view: 'deleted' });
  assert(!activeDrafts.items.some(item => String(item._id) === String(draft._id)));
  assert.equal(deletedDrafts.items.length, 1);
  assert.equal(String(deletedDrafts.items[0]._id), String(draft._id));
  assert.deepEqual((await Draft.findById(draft._id).lean()).form, draft.form);
  await assert.rejects(drafts.getDraft(draft._id), error => error.status === 404);
  await assert.rejects(drafts.saveDraft(draft._id, { name: 'Silinmiş forma yazma', form: draft.form, revision: draft.revision }), error => error.status === 404);
  await assert.rejects(drafts.publishDraft(draft._id, { revision: draft.revision, settingsRevision: settingsBeforeDelete.revision }), error => error.status === 404);
  await assert.rejects(drafts.listVersions(draft._id), error => error.status === 404);
  await assert.rejects(drafts.restoreDraft(draft._id, { revision: draft.revision, deletedAt: '2020-01-01T00:00:00Z' }), error => error.status === 409);
  const restored = await drafts.restoreDraft(draft._id, { revision: draft.revision, deletedAt: deleted.deletedAt.toISOString() });
  assert.deepEqual(restored.form, draft.form);
  assert.equal(restored.revision, draft.revision);
  assert.deepEqual(restored.updatedAt, draft.updatedAt);
  assert.deepEqual(await drafts.listVersions(draft._id), historyBeforeDelete);
  assert.equal((await drafts.listDrafts({ view: 'deleted' })).items.length, 0);
  assert.deepEqual(await settings.getSettings(), settingsBeforeDelete);
  await assert.rejects(drafts.restoreDraft(draft._id, { revision: draft.revision, deletedAt: deleted.deletedAt.toISOString() }), error => error.status === 409);
  await assert.rejects(drafts.listDrafts({ view: ['deleted'] }), error => error.status === 400);
  const importedLegacy = await Draft.findOne({ legacyKey: 'entrepreneur' }).lean();
  await drafts.deleteDraft(importedLegacy._id, { revision: importedLegacy.revision });
  await drafts.listDrafts();
  assert.equal(await Draft.countDocuments({ legacyKey: 'entrepreneur' }), 1, 'Silinen eski çalışma taslağı yeniden oluşturulmamalı.');
  assert((await Draft.findById(importedLegacy._id).lean()).deletedAt);
  // Switching publications preserves immutable source metadata, even after a
  // source draft is deleted; rejected races must never appear as publications.
  const switched = await drafts.publishDraft(copied._id, { revision: copied.revision, settingsRevision: settingsBeforeDelete.revision });
  let publications = await settings.listPublications();
  assert.equal(publications.items.length, 2);
  assert.equal(publications.items[0].isCurrent, true);
  assert.equal(String(publications.items[0].draftId), String(copied._id));
  assert.equal(String(publications.items[1].draftId), String(draft._id));
  assert.equal(publications.items[1].draftName, published.settings.publication.draftName);
  await drafts.deleteDraft(copied._id, { revision: copied.revision });
  assert.deepEqual((await settings.getSettings()).publication, switched.settings.publication);
  assert.deepEqual(await settings.listPublications(), publications);
  const concurrent = await Promise.allSettled([draft, empty].map(item => drafts.publishDraft(item._id, { revision: item.revision, settingsRevision: switched.settings.revision })));
  assert.equal(concurrent.filter(result => result.status === 'fulfilled').length, 1);
  // Empty forms fail validation before publication; the saved active event and
  // archive must still contain exactly the three committed publications.
  assert.equal(concurrent.find(result => result.status === 'rejected').reason.status, 422);
  publications = await settings.listPublications();
  assert.equal(publications.pagination.total, 3);
  const currentSettings = await settings.getSettings();
  const competitors = await Promise.allSettled(['A', 'B'].map(() => drafts.publishDraft(draft._id, { revision: draft.revision, settingsRevision: currentSettings.revision })));
  assert.equal(competitors.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(competitors.find(result => result.status === 'rejected').reason.status, 409);
  assert.equal((await settings.listPublications()).pagination.total, 4);
  for (let i = 0; i < 10; i++) {
    const latest = await settings.getSettings();
    await drafts.publishDraft(draft._id, { revision: draft.revision, settingsRevision: latest.revision });
  }
  const publicationPageOne = await settings.listPublications(), publicationPageTwo = await settings.listPublications({ page: '2' });
  assert.equal(publicationPageOne.items.length, 12); assert.equal(publicationPageTwo.items.length, 2);
  assert.equal(new Set([...publicationPageOne.items, ...publicationPageTwo.items].map(item => item._id)).size, 14);
  await assert.rejects(settings.listPublications({ page: ['1'] }), error => error.status === 400);
  const beforeLegacyPublish = await settings.getSettings();
  await settings.updateSettings({ form: draft.form, revision: beforeLegacyPublish.revision }, undefined, true);
  assert.equal((await settings.getSettings()).publication.draftId, undefined, 'Eski yayın ucu önceki taslağa bağlıymış gibi görünmemeli.');
  const legacyPublication = settings.currentPublication({ ...initial, publishedAt: new Date('2026-01-01'), active });
  assert.equal(legacyPublication.draftId, undefined, 'Kaynağı tutulmamış eski yayına taslak atanmamalı.');
  console.log('OK: Yayın kimliği/geçmişi, taslak değişiminde kaynak koruması, silinen kaynağın yayında kalması, eşzamanlı 409, sayfalama, eski yayın uyumluluğu ve değişmeyen kayıtta sürüm/tarih koruması geçti.');
  console.log('OK: Form silme/geri alma, sürüm ve yayım koruması, silinen forma yazma/yayım retleri ve eski taslağın tekrar oluşturulmaması geçti.');
  console.log('OK: Boş taslak, dört cevap formatı, soru sırası, ayrı kopya, sürüm geçmişi/yeniden düzenleme, sayfalama, eşzamanlı kayıt ve yayım izolasyonu geçti.');
} finally {
  assert.equal(mongoose.connection.name, dbName);
  await mongoose.connection.dropDatabase(); await mongoose.disconnect();
  console.log('OK: İzole test veritabanı temizlendi; gerçek soru seti, başvurular ve numara sayacı kullanılmadı.');
}
