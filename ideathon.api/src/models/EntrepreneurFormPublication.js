const mongoose = require('mongoose');

// The current publication lives in Settings. Outgoing publications are archived
// before replacement, so standalone MongoDB never loses a committed event.
const schema = new mongoose.Schema({
  _id: { type: String },
  formVersion: String,
  title: { type: String, required: true },
  draftId: { type: mongoose.Schema.Types.ObjectId, ref: 'EntrepreneurFormDraft' },
  draftName: String,
  draftRevision: Number,
  publishedAt: { type: Date, required: true },
  publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { versionKey: false });
schema.index({ publishedAt: -1, _id: -1 });

module.exports = mongoose.model('EntrepreneurFormPublication', schema);
