const mongoose = require('mongoose');

// A new attempt never overwrites somebody else's pending registration details.
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  email: { type: String, required: true, index: true },
  name: { type: String, required: true },
  phone: String,
  phoneKey: String,
  passwordHash: { type: String, required: true, select: false },
  ideathonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ideathon' },
  codeDigest: { type: String, select: false },
  attempts: { type: Number, default: 0 },
  codeExpiresAt: { type: Date, required: true },
  resendAvailableAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
  verifiedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null }
}, { timestamps: true });
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PendingRegistration', schema);
