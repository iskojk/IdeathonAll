const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Ad zorunludur'],
    trim: true,
    maxlength: [50, 'Ad en fazla 50 karakter olabilir']
  },
  lastName: {
    type: String,
    required: [true, 'Soyad zorunludur'],
    trim: true,
    maxlength: [50, 'Soyad en fazla 50 karakter olabilir']
  },
  email: {
    type: String,
    required: [true, 'Email zorunludur'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Geçerli bir email adresi giriniz']
  },
  phone: {
    type: String,
    required: [true, 'Telefon zorunludur'],
    trim: true,
    match: [/^[0-9+\-\s()]+$/, 'Geçerli bir telefon numarası giriniz'],
    maxlength: [20, 'Telefon en fazla 20 karakter olabilir']
  },
  message: {
    type: String,
    required: [true, 'Mesaj zorunludur'],
    trim: true,
    maxlength: [1000, 'Mesaj en fazla 1000 karakter olabilir']
  },
  status: {
    type: String,
    enum: ['new', 'read', 'replied', 'closed'],
    default: 'new'
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  // Multi-Tenant: İdeathon bağlantısı
  ideathonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ideathon',
    index: true
    // required değil — eski veriler ve genel iletişim formları
  }
}, {
  timestamps: true
});

// İndexler
contactSchema.index({ email: 1 });
contactSchema.index({ status: 1 });
contactSchema.index({ createdAt: -1 });
contactSchema.index({ ideathonId: 1, status: 1 });
contactSchema.index({ ideathonId: 1, createdAt: -1 });

module.exports = mongoose.model('Contact', contactSchema);

