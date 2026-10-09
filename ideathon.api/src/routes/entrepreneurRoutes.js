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
const { workingApplication } = require('../services/entrepreneurWorkflow');
const { withoutKvkk, withoutKvkkAnswer, preserveKvkkAnswer } = require('../services/entrepreneurConsentPolicy');

const router = express.Router();
// Busboy rejects at the configured limit, so add one byte for an inclusive 10 MiB maximum.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 + 1, files: 1, fields: 1, parts: 3 } });
router.use(authenticate, requireActiveUser);
router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });

function conflict(message = 'Başvurunuz başka bir sekmede değişti. Sayfayı yenileyip tekrar deneyin.') {
  return Object.assign(new Error(message), { status: 409 });
}

function checkDraft(application, revision) {
  if (!application) throw conflict('Dosya yüklemeden önce taslağı kaydedin.');
  if (application.status !== 'draft' && !application.editDraft) throw conflict('Başvuruyu düzenlemek için önce Başvurumu Düzenle seçeneğini kullanın.');
  if (!Number.isInteger(Number(revision)) || revision === undefined || Number(revision) !== application.__v) throw conflict();
}

function publicApplication(application) {
  const data = workingApplication(application);
  return { _id: data._id, applicationNumber: data.applicationNumber, answers: withoutKvkkAnswer(data.answers), documents: data.documents, status: data.status, reviewStatus: data.reviewStatus || 'submitted', viewedAt: data.viewedAt, isResubmission: !!data.isResubmission, revision: data.__v, updatedAt: data.updatedAt, submittedAt: data.submittedAt, privacy: data.privacy, previousVersions: data.previousVersions };
}

const draftDocuments = application => application.editDraft?.documents || application.documents;
async function cleanDocuments(application, ids) {
  if (ids.length) await Document.deleteMany({ _id: { $in: ids }, userId: application.userId, applicationId: application._id })
    .catch(() => console.error('Girişimci düzenleme evrak temizliği tamamlanamadı.'));
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
  res.json({ success: true, data: { form: application ? withoutKvkk(application.form) : await getEntrepreneurForm(), application: application ? publicApplication(application) : null } });
});

router.post('/my/edit', async (req, res) => {
  const application = await Application.findOne({ userId: req.user._id, status: 'submitted' });
  if (!application) throw conflict('Düzenlenebilecek gönderilmiş bir başvurunuz yok.');
  if (req.body.revision !== application.__v) throw conflict();
  if (!application.editDraft) {
    application.editDraft = { answers: structuredClone(application.answers), documents: application.documents.toObject(), startedAt: new Date() };
    await application.save();
  }
  res.json({ success: true, data: { form: withoutKvkk(application.form), application: publicApplication(application) } });
});

router.post('/my/cancel-edit', async (req, res) => {
  const application = await Application.findOne({ userId: req.user._id, status: 'submitted' });
  if (!application?.editDraft) throw conflict('Açık bir düzenleme taslağınız yok.');
  checkDraft(application, req.body.revision);
  const originalIds = new Set(application.documents.map(doc => String(doc._id)));
  const unused = application.editDraft.documents.filter(doc => !originalIds.has(String(doc._id))).map(doc => doc._id);
  application.editDraft = undefined;
  await application.save();
  await cleanDocuments(application, unused);
  res.json({ success: true, data: { application: publicApplication(application) } });
});

router.get('/my/export', async (req, res) => {
  if (req.query.format !== 'pdf') return res.status(400).json({ success: false, message: 'Yalnızca PDF biçiminde dışa aktarılabilir.' });
  // Ownership comes only from the authenticated session, never a client-supplied ID.
  const application = await Application.findOne({ userId: req.user._id, status: 'submitted' })
    .select('applicationNumber form answers documents status reviewStatus source contact createdAt updatedAt submittedAt privacy previousVersions').lean();
  if (!application) return res.status(404).json({ success: false, message: 'İndirilebilecek gönderilmiş bir başvurunuz bulunamadı.' });
  const { _id, name, email, phone } = req.user;
  const file = await require('../services/entrepreneurExport').generate({ ...application, applicant: { _id, name, email, phone } }, 'pdf');
  res.type(file.mimeType).attachment(file.name).send(file.contents);
});

router.put('/my', async (req, res) => {
  const { answers, submit = false, revision, formVersion } = req.body;
  if (typeof submit !== 'boolean') return res.status(400).json({ success: false, message: 'Gönderim durumu geçersiz.' });
  let application = await loadApplication(req.user._id);
  if (application) checkDraft(application, revision);
  const form = application ? withoutKvkk(application.form) : await getEntrepreneurForm();
  if (formVersion !== form.version) throw conflict('Soru seti güncellendi. Sayfayı yenileyin.');
  const result = validateAnswers(form, withoutKvkkAnswer(answers), application ? draftDocuments(application) : [], submit);
  if (Object.keys(result.errors).length) {
    return res.status(422).json({ success: false, message: 'Lütfen işaretli alanları kontrol edin.', errors: result.errors });
  }
  if (!application) application = new Application({ userId: req.user._id, form: JSON.parse(JSON.stringify(form)) });
  const resubmitting = !!application.editDraft;
  result.answers = preserveKvkkAnswer(application.answers, result.answers);
  if (!resubmitting || submit) application.form = form;
  let unused = [];
  if (resubmitting && !submit) application.editDraft.answers = result.answers;
  else application.answers = result.answers;
  if (submit) {
    if (resubmitting) {
      const retained = new Set(application.editDraft.documents.map(doc => String(doc._id)));
      unused = application.documents.filter(doc => !retained.has(String(doc._id))).map(doc => doc._id);
      application.documents = application.editDraft.documents.toObject();
      application.editDraft = undefined;
      if (application.source === 'admin') {
        const name = result.answers.full_name || [result.answers.first_name, result.answers.last_name].filter(Boolean).join(' ');
        application.contact = { ...application.toObject().contact, ...(name && { name }),
          ...(result.answers.email && { email: result.answers.email }), ...(result.answers.phone && { phone: result.answers.phone }),
          ...(result.answers.venture_name && { ventureName: result.answers.venture_name }) };
      }
    }
    application.status = 'submitted';
    application.submittedAt = new Date();
    application.reviewStatus = 'submitted';
    application.viewedAt = undefined;
    application.viewedBy = undefined;
    application.reviewedAt = undefined;
    application.reviewedBy = undefined;
    if (form.agreements?.length) application.privacy = { ...application.privacy,
      agreements: form.agreements.map(({ id, label, url, version, acknowledgement }) => ({ id, label, url, version, acknowledgement, acceptedAt: application.submittedAt })),
    };
  }
  await application.save();
  await cleanDocuments(application, unused);
  res.json({ success: true, data: { application: publicApplication(application) } });
});

router.post('/documents/:questionId', async (req, res, next) => {
  req.application = await loadApplication(req.user._id);
  if (!req.application || (req.application.status !== 'draft' && !req.application.editDraft)) throw conflict('Evrak yüklemek için açık bir başvuru taslağı gerekir.');
  req.question = req.application.form.questions.find(q => q.id === req.params.questionId && q.type === 'file');
  if (!req.question) return res.status(400).json({ success: false, message: 'Evrak alanı bulunamadı.' });
  next();
}, upload.single('file'), async (req, res) => {
  const application = req.application;
  checkDraft(application, req.body.revision);
  const count = draftDocuments(application).filter(doc => doc.questionId === req.question.id).length;
  if (count >= req.question.maxFiles) return res.status(422).json({ success: false, message: `Bu alana en fazla ${req.question.maxFiles} dosya eklenebilir.` });
  if (!req.file || !validDocument(req.file)) return res.status(422).json({ success: false, message: 'Geçerli bir PDF, PNG veya JPEG dosyası seçin.' });
  const name = normalizeDocumentName(req.file.originalname);
  const document = await Document.create({ userId: req.user._id, applicationId: application._id, name, mimeType: req.file.mimetype, contents: req.file.buffer });
  draftDocuments(application).push({ _id: document._id, questionId: req.question.id, name, mimeType: req.file.mimetype, size: req.file.size });
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
  const document = draftDocuments(application).id(req.params.id);
  if (!document) return res.status(404).json({ success: false, message: 'Evrak bulunamadı.' });
  const documentId = document._id;
  const keepSubmittedDocument = !!application.editDraft && !!application.documents.id(documentId);
  draftDocuments(application).pull(documentId);
  await application.save();
  if (!keepSubmittedDocument) await cleanDocuments(application, [documentId]);
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
