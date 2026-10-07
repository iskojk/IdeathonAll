const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  _id: { type: String, default: 'entrepreneur' },
  active: { type: mongoose.Schema.Types.Mixed, required: true },
  draft: { type: mongoose.Schema.Types.Mixed, required: true },
  revision: { type: Number, default: 0 },
  publishedAt: Date,
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
module.exports = mongoose.model('EntrepreneurFormSettings', schema);
