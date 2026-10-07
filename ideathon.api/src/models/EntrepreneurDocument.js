const mongoose = require('mongoose');

// Evraklar herkese açık /uploads dizinine yazılmaz; sahibi ve gönderimden sonra yetkili yöneticiler okuyabilir.
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'EntrepreneurApplication', required: true },
  name: { type: String, required: true },
  mimeType: { type: String, required: true },
  contents: { type: Buffer, required: true, select: false },
}, { timestamps: true });

module.exports = mongoose.model('EntrepreneurDocument', schema);
