const mongoose = require('mongoose');
const { nextApplicationNumber } = require('../services/entrepreneurApplicationNumber');
const { reviewStatuses } = require('../services/entrepreneurWorkflow');

const documentFields = {
  _id: mongoose.Schema.Types.ObjectId,
  questionId: { type: String, required: true },
  name: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
};

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: function () { return this.source !== 'admin'; } },
  source: { type: String, enum: ['self', 'admin'], default: 'self' },
  contact: {
    name: String,
    email: String,
    phone: String,
    ventureName: String,
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  archivedAt: { type: Date, default: null },
  archivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  form: { type: mongoose.Schema.Types.Mixed, required: true },
  answers: { type: mongoose.Schema.Types.Mixed, default: {} },
  previousVersions: { type: [mongoose.Schema.Types.Mixed], default: [] },
  privacy: mongoose.Schema.Types.Mixed,
  documents: [documentFields],
  status: { type: String, enum: ['draft', 'submitted'], default: 'draft' },
  submittedAt: Date,
  applicationNumber: { type: String, match: /^AFZ\d{2}\d{3,}$/ },
  reviewStatus: { type: String, enum: Object.keys(reviewStatuses), default: 'submitted' },
  viewedAt: Date,
  viewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // The pool and exports retain the submitted version until the owner resubmits.
  editDraft: { type: new mongoose.Schema({
    answers: mongoose.Schema.Types.Mixed,
    documents: [documentFields],
    startedAt: Date,
  }, { _id: false }), default: undefined },
}, { timestamps: true, optimisticConcurrency: true });

schema.index({ status: 1, submittedAt: -1, _id: -1 });
// Account-free pool entries may coexist; an account still has at most one application.
schema.index({ userId: 1 }, { name: 'entrepreneur_account_unique', unique: true, partialFilterExpression: { userId: { $type: 'objectId' } } });

schema.index({ applicationNumber: 1 }, { name: 'entrepreneur_number_unique', unique: true, partialFilterExpression: { applicationNumber: { $type: 'string' } } });
schema.post('init', function(document) { document.$locals.savedApplicationNumber = document.applicationNumber; });
schema.pre('save', async function() {
  if (this.$locals.savedApplicationNumber && this.applicationNumber !== this.$locals.savedApplicationNumber) throw new Error('Başvuru numarası değiştirilemez.');
  if (this.status === 'submitted' && !this.applicationNumber) this.applicationNumber = await nextApplicationNumber(this.submittedAt || new Date());
});
schema.post('save', function(document) { document.$locals.savedApplicationNumber = document.applicationNumber; });

module.exports = mongoose.model('EntrepreneurApplication', schema);
