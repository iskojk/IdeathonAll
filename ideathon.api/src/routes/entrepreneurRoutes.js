const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const { authenticate, requireActiveUser } = require('../middleware/auth');
const Application = require('../models/EntrepreneurApplication');
const Document = require('../models/EntrepreneurDocument');
const { getEntrepreneurForm } = require('../services/entrepreneurFormSource');
const { draftFormUpgrade } = require('../services/entrepreneurFormMigration');
const { validateAnswers, validDocument } = require('../services/entrepreneurValidation');
const { normalizeDocumentName } = require('../services/entrepreneurDocumentName');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 1, parts: 3 } });
router.use(authenticate, requireActiveUser);
router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });

function conflict(message = 'Başvurunuz başka bir sekmede değişti. Sayfayı yenileyip tekrar deneyin.') {
  return Object.assign(new Error(message), { status: 409 });
}

function checkDraft(application, revision) {
  if (!application) throw conflict('Dosya yüklemeden önce taslağı kaydedin.');
  if (application.status !== 'draft') throw conflict('Gönderilmiş başvuru değiştirilemez.');
  if (!Number.isInteger(Number(revision)) || revision === undefined || Number(revision) !== application.__v) throw conflict();
}

function publicApplication(application) {
  const data = application.toObject ? application.toObject() : application;
  return { _id: data._id, answers: data.answers, documents: data.documents, status: data.status, revision: data.__v, updatedAt: data.updatedAt, submittedAt: data.submittedAt, privacy: data.privacy, previousVersions: data.previousVersions };
}

async function loadApplication(userId) {
  const application = await Application.findOne({ userId });
  const upgrade = draftFormUpgrade(application);
  if (upgrade) {
    application.set(upgrade);
    // optimisticConcurrency eski sekmelerin eski zorunluluklarla kayıt yapmasını engeller.
    await application.save();
  }
  return application;
}

router.get('/my', async (req, res) => {
  const application = await loadApplication(req.user._id);
  res.json({ success: true, data: { form: application?.form || await getEntrepreneurForm(), application: application ? publicApplication(application) : null } });
});

router.put('/my', async (req, res) => {
  const { answers, submit = false, revision, formVersion } = req.body;
  if (typeof submit !== 'boolean') return res.status(400).json({ success: false, message: 'Gönderim durumu geçersiz.' });
  let application = await loadApplication(req.user._id);
  if (application) checkDraft(application, revision);
  const form = application?.form || await getEntrepreneurForm();
  if (formVersion !== form.version) throw conflict('Soru seti güncellendi. Sayfayı yenileyin.');
  const result = validateAnswers(form, answers, application?.documents || [], submit);
  if (Object.keys(result.errors).length) {
    return res.status(422).json({ success: false, message: 'Lütfen işaretli alanları kontrol edin.', errors: result.errors });
  }
  if (!application) application = new Application({ userId: req.user._id, form: JSON.parse(JSON.stringify(form)) });
  application.answers = result.answers;
  if (submit) {
    application.status = 'submitted';
    application.submittedAt = new Date();
    const consent = form.questions.find(question => question.id === 'kvkk_ack' && question.type === 'consent');
    if (consent) application.privacy = { text: consent.help, version: consent.privacyVersion, draft: consent.privacyDraft, acknowledgedAt: application.submittedAt };
    if (form.agreements?.length) application.privacy = { ...application.privacy,
      agreements: form.agreements.map(({ id, label, url, version, acknowledgement }) => ({ id, label, url, version, acknowledgement, acceptedAt: application.submittedAt })),
    };
  }
  await application.save();
  res.json({ success: true, data: { application: publicApplication(application) } });
});

router.post('/documents/:questionId', async (req, res, next) => {
  req.application = await loadApplication(req.user._id);
  if (!req.application || req.application.status !== 'draft') throw conflict('Evrak yüklemek için açık bir başvuru taslağı gerekir.');
  req.question = req.application.form.questions.find(q => q.id === req.params.questionId && q.type === 'file');
  if (!req.question) return res.status(400).json({ success: false, message: 'Evrak alanı bulunamadı.' });
  next();
}, upload.single('file'), async (req, res) => {
  const application = req.application;
  checkDraft(application, req.body.revision);
  const count = application.documents.filter(doc => doc.questionId === req.question.id).length;
  if (count >= req.question.maxFiles) return res.status(422).json({ success: false, message: `Bu alana en fazla ${req.question.maxFiles} dosya eklenebilir.` });
  if (!req.file || !validDocument(req.file)) return res.status(422).json({ success: false, message: 'Geçerli bir PDF, PNG veya JPEG dosyası seçin.' });
  const name = normalizeDocumentName(req.file.originalname);
  const document = await Document.create({ userId: req.user._id, applicationId: application._id, name, mimeType: req.file.mimetype, contents: req.file.buffer });
  application.documents.push({ _id: document._id, questionId: req.question.id, name, mimeType: req.file.mimetype, size: req.file.size });
  try { await application.save(); }
  catch (error) { await Document.deleteOne({ _id: document._id }); throw error; }
  res.status(201).json({ success: true, data: { application: publicApplication(application) } });
});

router.get('/documents/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ success: false, message: 'Evrak bulunamadı.' });
  const document = await Document.findOne({ _id: req.params.id, userId: req.user._id }).select('+contents');
  if (!document) return res.status(404).json({ success: false, message: 'Evrak bulunamadı.' });
  res.type(document.mimeType).attachment(document.name).send(document.contents);
});

router.delete('/documents/:id', async (req, res) => {
  const application = await loadApplication(req.user._id);
  checkDraft(application, req.body.revision);
  const document = application.documents.id(req.params.id);
  if (!document) return res.status(404).json({ success: false, message: 'Evrak bulunamadı.' });
  const documentId = document._id;
  application.documents.pull(documentId);
  await application.save();
  await Document.deleteOne({ _id: documentId, userId: req.user._id });
  res.json({ success: true, data: { application: publicApplication(application) } });
});

router.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof multer.MulterError) {
    return res.status(422).json({ success: false, message: error.code === 'LIMIT_FILE_SIZE' ? 'Dosya boyutu en fazla 10 MB olabilir.' : 'Tek seferde bir dosya yükleyin.' });
  }
  if (error.name === 'VersionError' || error.code === 11000) error = conflict();
  res.status(error.status || 500).json({ success: false, message: error.status ? error.message : 'Başvuru işlemi tamamlanamadı. Lütfen tekrar deneyin.' });
});

module.exports = router;
