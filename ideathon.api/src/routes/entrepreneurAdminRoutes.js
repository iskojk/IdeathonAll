const express = require('express');
const multer = require('multer');
const { authenticate, requireSuperAdminOrAdmin, requireSuperAdmin } = require('../middleware/auth');
const { getSettings, updateSettings, listPublications } = require('../services/entrepreneurFormSettings');
const drafts = require('../services/entrepreneurFormDrafts');
const controller = require('../controllers/entrepreneurAdminController');

const router = express.Router();
const importUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: require('../services/entrepreneurImport').MAX_SIZE, files: 1, fields: 0, parts: 2 } });
// Girişimci havuzu globaldir; seçili Ideathon bu kayıtları filtrelemez.
router.use(authenticate, requireSuperAdminOrAdmin);
router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
router.get('/', controller.list);
router.post('/', requireSuperAdmin, controller.create);
router.get('/entry-form', controller.entryForm);
router.get('/import/formats', controller.importFormats);
router.get('/import/template', controller.importTemplate);
router.post('/import/preview', requireSuperAdmin, importUpload.single('file'), controller.importPreview);
router.get('/accounts', controller.accounts);
router.get('/form', requireSuperAdmin, async (req, res) => {
  res.json({ success: true, data: await getSettings() });
});
router.put('/form', requireSuperAdmin, async (req, res) => {
  res.json({ success: true, data: await updateSettings(req.body, req.user._id) });
});
router.post('/form/publish', requireSuperAdmin, async (req, res) => {
  res.json({ success: true, data: await updateSettings(req.body, req.user._id, true) });
});
router.get('/form/publications', requireSuperAdmin, async (req, res) => {
  res.json({ success: true, data: await listPublications(req.query) });
});
router.get('/form/drafts', requireSuperAdmin, async (req, res) => {
  res.json({ success: true, data: await drafts.listDrafts(req.query) });
});
router.post('/form/drafts', requireSuperAdmin, async (req, res) => {
  res.status(201).json({ success: true, data: await drafts.saveDraft(null, req.body, req.user._id) });
});
router.get('/form/drafts/:draftId', requireSuperAdmin, async (req, res) => {
  res.json({ success: true, data: await drafts.getDraft(req.params.draftId) });
});
router.get('/form/drafts/:draftId/versions', requireSuperAdmin, async (req, res) => {
  res.json({ success: true, data: await drafts.listVersions(req.params.draftId, req.query) });
});
router.get('/form/drafts/:draftId/versions/:revision', requireSuperAdmin, async (req, res) => {
  res.json({ success: true, data: await drafts.getVersion(req.params.draftId, req.params.revision) });
});
router.put('/form/drafts/:draftId', requireSuperAdmin, async (req, res) => {
  res.json({ success: true, data: await drafts.saveDraft(req.params.draftId, req.body, req.user._id) });
});
router.post('/form/drafts/:draftId/delete', requireSuperAdmin, async (req, res) => {
  res.json({ success: true, data: await drafts.deleteDraft(req.params.draftId, req.body, req.user._id) });
});
router.post('/form/drafts/:draftId/restore', requireSuperAdmin, async (req, res) => {
  res.json({ success: true, data: await drafts.restoreDraft(req.params.draftId, req.body) });
});
router.post('/form/drafts/:draftId/publish', requireSuperAdmin, async (req, res) => {
  res.json({ success: true, data: await drafts.publishDraft(req.params.draftId, req.body, req.user._id) });
});
router.get('/:id/export', controller.export);
router.post('/:id/view', requireSuperAdmin, controller.markViewed);
router.post('/:id/review', requireSuperAdmin, controller.review);
router.get('/:id', controller.detail);
router.put('/:id', requireSuperAdmin, controller.update);
router.post('/:id/archive', requireSuperAdmin, controller.archive);
router.post('/:id/restore', requireSuperAdmin, controller.restore);
router.get('/:id/documents/:documentId', controller.document);
router.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof multer.MulterError) return res.status(422).json({ success: false, message: error.code === 'LIMIT_FILE_SIZE' ? 'Dosya boyutu en fazla 10 MB olabilir.' : 'Tek bir soru seti dosyası seçin.' });
  if (error.code === 11000) error = Object.assign(new Error('Bu hesabın zaten bir girişimci başvurusu var.'), { status: 409 });
  res.status(error.status || 500).json({ success: false, message: error.status ? error.message : 'Girişimci başvuruları yüklenemedi. Lütfen tekrar deneyin.', ...(error.errors && error.status === 422 ? { errors: error.errors } : {}) });
});

module.exports = router;
