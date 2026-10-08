const mongoose = require('mongoose');
const Application = require('../models/EntrepreneurApplication');
const Document = require('../models/EntrepreneurDocument');
const User = require('../models/User');
const { getEntrepreneurForm } = require('./entrepreneurFormSource');
const { validateContact, updateAnswers, editableQuestions } = require('./entrepreneurPoolManagement');
const { validateAnswers } = require('./entrepreneurValidation');

function fail(status, message) { throw Object.assign(new Error(message), { status }); }
function validId(id) { return typeof id === 'string' && /^[a-f\d]{24}$/i.test(id); }
function integer(value, fallback, max) {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !/^\d+$/.test(value) || Number(value) < 1 || Number(value) > max) fail(400, 'Sayfalama bilgisi geçersiz.');
  return Number(value);
}

exports.list = async (query) => {
  const page = integer(query.page, 1, 1000000);
  const limit = integer(query.limit, 10, 50);
  const search = query.search === undefined ? '' : query.search;
  if (typeof search !== 'string' || search.length > 150) fail(400, 'Arama metni en fazla 150 karakter olabilir.');
  const searchField = query.searchField === undefined ? 'all' : query.searchField;
  if (!['all', 'name', 'email', 'venture'].includes(searchField)) fail(400, 'Arama alanı geçersiz.');
  const sort = query.sort || 'newest';
  if (!['newest', 'oldest'].includes(sort)) fail(400, 'Sıralama seçimi geçersiz.');
  const view = query.view || 'active';
  if (!['active', 'archived'].includes(view)) fail(400, 'Havuz görünümü geçersiz.');
  const pipeline = [
    { $match: { status: 'submitted', archivedAt: view === 'archived' ? { $ne: null } : null } },
    { $lookup: { from: User.collection.name, localField: 'userId', foreignField: '_id', pipeline: [{ $project: { name: 1, email: 1, phone: 1 } }], as: 'applicant' } },
    { $unwind: { path: '$applicant', preserveNullAndEmptyArrays: true } },
    { $set: { contactName: { $ifNull: ['$answers.full_name', { $trim: { input: { $concat: [
      { $convert: { input: '$answers.first_name', to: 'string', onError: '', onNull: '' } }, ' ',
      { $convert: { input: '$answers.last_name', to: 'string', onError: '', onNull: '' } },
    ] } } }] } } },
    { $set: {
      searchName: { $ifNull: ['$contact.name', { $cond: [{ $eq: ['$contactName', ''] }, '$applicant.name', '$contactName'] }] },
      searchEmail: { $ifNull: ['$contact.email', '$answers.email'] },
      searchVenture: { $ifNull: ['$contact.ventureName', '$answers.venture_name'] },
    } },
    { $sort: { submittedAt: sort === 'newest' ? -1 : 1, _id: sort === 'newest' ? -1 : 1 } },
  ];
  if (search.trim()) {
    const pattern = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const fields = { name: ['searchName'], email: ['searchEmail', 'applicant.email'], venture: ['searchVenture'] };
    const selected = searchField === 'all' ? Object.values(fields).flat() : fields[searchField];
    pipeline.push({ $match: { $or: selected.map(key => ({ [key]: { $regex: pattern, $options: 'i' } })) } });
  }
  pipeline.push({ $facet: {
    count: [{ $count: 'total' }],
    data: [
      { $skip: (page - 1) * limit }, { $limit: limit },
      { $project: {
        _id: 1, applicationNumber: 1, status: 1, source: 1, submittedAt: 1, applicant: 1, archivedAt: 1,
        reviewStatus: { $ifNull: ['$reviewStatus', 'submitted'] }, viewedAt: 1,
        revision: { $ifNull: ['$__v', 0] },
        ventureName: { $ifNull: ['$contact.ventureName', { $convert: { input: '$answers.venture_name', to: 'string', onError: '', onNull: '' } }] },
        contactName: { $ifNull: ['$contact.name', { $cond: [{ $eq: ['$contactName', ''] }, '$applicant.name', { $convert: { input: '$contactName', to: 'string', onError: '$applicant.name', onNull: '$applicant.name' } }] }] },
        contactEmail: { $ifNull: ['$contact.email', { $convert: { input: '$answers.email', to: 'string', onError: '$applicant.email', onNull: '$applicant.email' } }] },
        documentCount: { $size: { $ifNull: ['$documents', []] } },
        questionCount: { $size: { $ifNull: ['$form.questions', []] } },
      } },
    ],
  } });
  const [result] = await Application.aggregate(pipeline);
  const total = result.count[0]?.total || 0;
  return { data: result.data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

exports.detail = async (id) => {
  if (!validId(id)) fail(404, 'Başvuru bulunamadı.');
  const application = await Application.findOne({ _id: id, status: 'submitted' })
    .select('applicationNumber userId form answers documents status source contact archivedAt createdAt updatedAt submittedAt privacy previousVersions reviewStatus viewedAt reviewedAt __v')
    .populate('userId', 'name email phone').lean();
  if (!application) fail(404, 'Başvuru bulunamadı.');
  const { userId, ...data } = application;
  return { ...data, reviewStatus: data.reviewStatus || 'submitted', revision: data.__v, applicant: userId || (data.contact ? { name: data.contact.name, email: data.contact.email, phone: data.contact.phone } : null) };
};

exports.markViewed = async (id, body, actorId) => {
  if (!validId(id)) fail(404, 'Başvuru bulunamadı.');
  if (typeof body?.submittedAt !== 'string' || !Number.isFinite(Date.parse(body.submittedAt))) fail(422, 'Başvuru tarihi geçersiz.');
  const submittedAt = new Date(body.submittedAt);
  const current = await Application.findOne({ _id: id, status: 'submitted', submittedAt }).lean();
  if (!current) fail(409, 'Başvuru yeniden gönderilmiş. Güncel başvuruyu açın.');
  // Only mark the exact submission that was displayed, never an unseen revision.
  await Application.updateOne({ _id: id, status: 'submitted', submittedAt,
    $or: [{ reviewStatus: 'submitted' }, { reviewStatus: { $exists: false } }, { reviewStatus: null }] },
  { $set: { reviewStatus: 'viewed', viewedAt: new Date(), viewedBy: actorId } }, { timestamps: false });
  return exports.detail(id);
};

exports.review = async (id, body, actorId) => {
  if (!validId(id)) fail(404, 'Başvuru bulunamadı.');
  if (!body || !['under_review', 'reviewed', 'approved', 'rejected'].includes(body.reviewStatus)) fail(422, 'Geçerli bir değerlendirme durumu seçin.');
  const expected = revision(body.revision);
  const updated = await Application.findOneAndUpdate({ _id: id, status: 'submitted', archivedAt: null, __v: expected },
    { $set: { reviewStatus: body.reviewStatus, reviewedAt: new Date(), reviewedBy: actorId }, $inc: { __v: 1 } }, { new: true, runValidators: true });
  if (!updated) fail(409, 'Başvuru başka bir oturumda değişti. Güncel kaydı açıp tekrar deneyin.');
  return exports.detail(id);
};

exports.entryForm = async () => getEntrepreneurForm();

exports.accounts = async (query) => {
  const search = query.search || '';
  if (typeof search !== 'string' || search.length > 150) fail(400, 'Arama metni geçersiz.');
  const pattern = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = { role: 'user', isActive: true };
  if (pattern) match.$or = [{ name: { $regex: pattern, $options: 'i' } }, { email: { $regex: pattern, $options: 'i' } }];
  return User.aggregate([
    { $match: match }, { $sort: { name: 1 } },
    { $lookup: { from: Application.collection.name, localField: '_id', foreignField: 'userId', pipeline: [{ $project: { _id: 1 } }], as: 'applications' } },
    { $match: { 'applications.0': { $exists: false } } }, { $limit: 20 },
    { $project: { _id: 1, name: 1, email: 1, phone: 1 } },
  ]);
};

exports.create = async (body, actorId) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail(422, 'Girişimci bilgileri geçersiz.');
  const contact = validateContact(body.contact);
  const form = structuredClone(await getEntrepreneurForm());
  if (body.entryFormVersion !== undefined && body.entryFormVersion !== form.version) fail(409, 'Soru seti güncellendi. Dosyayı yeniden aktarın ve eşleşmeleri kontrol edin.');
  let userId;
  if (body.userId !== undefined && body.userId !== null && body.userId !== '') {
    if (!validId(body.userId)) fail(422, 'Kullanıcı hesabı geçersiz.');
    const account = await User.exists({ _id: body.userId, role: 'user', isActive: true });
    if (!account) fail(422, 'Aktif bir kullanıcı hesabı seçin.');
    if (await Application.exists({ userId: body.userId })) fail(409, 'Bu hesabın zaten bir girişimci başvurusu var. Mevcut kaydı düzenleyin.');
    userId = body.userId;
  }
  const answers = updateAnswers(form, {}, body.answers, contact);
  if (body.entryFormVersion !== undefined) {
    const validation = validateAnswers({ questions: editableQuestions(form) }, answers, [], true);
    if (Object.keys(validation.errors).length) throw Object.assign(new Error('Aktarılan başvurudaki zorunlu yanıtları tamamlayın.'), { status: 422, errors: validation.errors });
  }
  const application = await Application.create({ ...(userId ? { userId } : {}), source: 'admin', contact, form, answers, status: 'submitted', submittedAt: new Date(), createdBy: actorId, updatedBy: actorId });
  return exports.detail(String(application._id));
};

function revision(value) {
  if (!Number.isInteger(value) || value < 0) fail(409, 'Kayıt sürümü eksik. Listeyi yenileyin.');
  return value;
}

exports.update = async (id, body, actorId) => {
  if (!validId(id)) fail(404, 'Başvuru bulunamadı.');
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail(422, 'Girişimci bilgileri geçersiz.');
  const expected = revision(body.revision);
  const application = await Application.findOne({ _id: id, status: 'submitted', archivedAt: null }).lean();
  if (!application) fail(404, 'Düzenlenebilecek başvuru bulunamadı.');
  if (application.editDraft) fail(409, 'Girişimci başvurusunu düzenliyor. Yeniden göndermesini bekleyin.');
  const contact = validateContact(body.contact);
  const answers = updateAnswers(application.form, application.answers, body.answers, contact);
  const updated = await Application.findOneAndUpdate({ _id: id, status: 'submitted', archivedAt: null, editDraft: { $exists: false }, __v: expected },
    { $set: { contact, answers, updatedBy: actorId }, $inc: { __v: 1 } }, { new: true, runValidators: true });
  if (!updated) fail(409, 'Başvuru başka bir oturumda değişti. Güncel kaydı açıp tekrar deneyin.');
  return exports.detail(id);
};

exports.setArchived = async (id, body, actorId, archived) => {
  if (!validId(id)) fail(404, 'Başvuru bulunamadı.');
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail(422, 'Kayıt sürümü geçersiz.');
  const expected = revision(body.revision);
  const updated = await Application.findOneAndUpdate({ _id: id, status: 'submitted', archivedAt: archived ? null : { $ne: null }, __v: expected },
    { $set: { archivedAt: archived ? new Date() : null, archivedBy: archived ? actorId : null, updatedBy: actorId }, $inc: { __v: 1 } }, { new: true });
  if (!updated) fail(409, 'Kayıt değişmiş veya zaten bu durumda. Listeyi yenileyin.');
  return exports.detail(id);
};

exports.document = async (id, documentId) => {
  if (!validId(id) || !validId(documentId)) fail(404, 'Evrak bulunamadı.');
  // Bir taslağın veya başka başvurunun evrakı bu uçtan okunamaz.
  const application = await Application.findOne({ _id: id, status: 'submitted', 'documents._id': new mongoose.Types.ObjectId(documentId) }).select('userId').lean();
  if (!application) fail(404, 'Evrak bulunamadı.');
  const document = await Document.findOne({ _id: documentId, applicationId: id, userId: application.userId }).select('+contents');
  if (!document) fail(404, 'Evrak bulunamadı.');
  return document;
};
