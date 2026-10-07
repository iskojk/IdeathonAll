const express = require('express');
const { authenticate, requireSuperAdminOrAdmin, requireSuperAdmin } = require('../middleware/auth');
const { getSettings, updateSettings } = require('../services/entrepreneurFormSettings');
const drafts = require('../services/entrepreneurFormDrafts');
const controller = require('../controllers/entrepreneurAdminController');

const router = express.Router();
// Girişimci havuzu globaldir; seçili Ideathon bu kayıtları filtrelemez.
router.use(authenticate, requireSuperAdminOrAdmin);
router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
router.get('/', controller.list);
router.get('/form', requireSuperAdmin, async (req, res) => {
  res.json({ success: true, data: await getSettings() });
});
router.put('/form', requireSuperAdmin, async (req, res) => {
  res.json({ success: true, data: await updateSettings(req.body, req.user._id) });
});
router.post('/form/publish', requireSuperAdmin, async (req, res) => {
  res.json({ success: true, data: await updateSettings(req.body, req.user._id, true) });
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
router.put('/form/drafts/:draftId', requireSuperAdmin, async (req, res) => {
  res.json({ success: true, data: await drafts.saveDraft(req.params.draftId, req.body, req.user._id) });
});
router.post('/form/drafts/:draftId/publish', requireSuperAdmin, async (req, res) => {
  res.json({ success: true, data: await drafts.publishDraft(req.params.draftId, req.body, req.user._id) });
});
router.get('/:id', controller.detail);
router.get('/:id/documents/:documentId', controller.document);
router.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  res.status(error.status || 500).json({ success: false, message: error.status ? error.message : 'Girişimci başvuruları yüklenemedi. Lütfen tekrar deneyin.' });
});

module.exports = router;
