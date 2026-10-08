const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 150 },
  form: { type: mongoose.Schema.Types.Mixed, required: true },
  revision: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Import the pre-library working draft once, including concurrent first visits.
  legacyKey: { type: String },
}, { timestamps: true });
schema.index({ legacyKey: 1 }, { unique: true, sparse: true });
schema.index({ updatedAt: -1, _id: -1 });

module.exports = mongoose.model('EntrepreneurFormDraft', schema);
