const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  form: { type: mongoose.Schema.Types.Mixed, required: true },
  answers: { type: mongoose.Schema.Types.Mixed, default: {} },
  previousVersions: { type: [mongoose.Schema.Types.Mixed], default: [] },
  privacy: mongoose.Schema.Types.Mixed,
  documents: [{
    _id: mongoose.Schema.Types.ObjectId,
    questionId: { type: String, required: true },
    name: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
  }],
  status: { type: String, enum: ['draft', 'submitted'], default: 'draft' },
  submittedAt: Date,
}, { timestamps: true, optimisticConcurrency: true });

schema.index({ status: 1, submittedAt: -1, _id: -1 });

module.exports = mongoose.model('EntrepreneurApplication', schema);
