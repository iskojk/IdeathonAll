const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  draftId: { type: mongoose.Schema.Types.ObjectId, ref: 'EntrepreneurFormDraft', required: true },
  revision: { type: Number, required: true, min: 0 },
  name: { type: String, required: true },
  form: { type: mongoose.Schema.Types.Mixed, required: true },
  savedAt: { type: Date, required: true },
  savedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { versionKey: false });
schema.index({ draftId: 1, revision: -1 }, { unique: true });

module.exports = mongoose.model('EntrepreneurFormDraftVersion', schema);
