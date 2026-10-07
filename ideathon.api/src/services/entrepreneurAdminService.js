const mongoose = require('mongoose');
const Application = require('../models/EntrepreneurApplication');
const Document = require('../models/EntrepreneurDocument');
const User = require('../models/User');

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
  const sort = query.sort || 'newest';
  if (!['newest', 'oldest'].includes(sort)) fail(400, 'Sıralama seçimi geçersiz.');
  const pipeline = [
    { $match: { status: 'submitted' } },
    { $lookup: { from: User.collection.name, localField: 'userId', foreignField: '_id', pipeline: [{ $project: { name: 1, email: 1, phone: 1 } }], as: 'applicant' } },
    { $unwind: { path: '$applicant', preserveNullAndEmptyArrays: true } },
    { $set: { contactName: { $ifNull: ['$answers.full_name', { $trim: { input: { $concat: [
      { $convert: { input: '$answers.first_name', to: 'string', onError: '', onNull: '' } }, ' ',
      { $convert: { input: '$answers.last_name', to: 'string', onError: '', onNull: '' } },
    ] } } }] } } },
    { $sort: { submittedAt: sort === 'newest' ? -1 : 1, _id: sort === 'newest' ? -1 : 1 } },
  ];
  if (search.trim()) {
    const pattern = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    pipeline.push({ $match: { $or: ['answers.venture_name', 'answers.full_name', 'contactName', 'answers.email', 'applicant.name', 'applicant.email'].map(key => ({ [key]: { $regex: pattern, $options: 'i' } })) } });
  }
  pipeline.push({ $facet: {
    count: [{ $count: 'total' }],
    data: [
      { $skip: (page - 1) * limit }, { $limit: limit },
      { $project: {
        _id: 1, status: 1, submittedAt: 1, applicant: 1,
        ventureName: { $convert: { input: '$answers.venture_name', to: 'string', onError: '', onNull: '' } },
        contactName: { $cond: [{ $eq: ['$contactName', ''] }, '$applicant.name', { $convert: { input: '$contactName', to: 'string', onError: '$applicant.name', onNull: '$applicant.name' } }] },
        contactEmail: { $convert: { input: '$answers.email', to: 'string', onError: '$applicant.email', onNull: '$applicant.email' } },
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
    .select('userId form answers documents status createdAt updatedAt submittedAt privacy previousVersions')
    .populate('userId', 'name email phone').lean();
  if (!application) fail(404, 'Başvuru bulunamadı.');
  const { userId, ...data } = application;
  return { ...data, applicant: userId };
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
