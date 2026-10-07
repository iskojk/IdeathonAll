const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'İsim alanı zorunludur'],
    trim: true,
    minlength: [2, 'İsim en az 2 karakter olmalıdır'],
    maxlength: [50, 'İsim en fazla 50 karakter olabilir']
  },
  email: {
    type: String,
    required: [true, 'E-posta alanı zorunludur'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Geçerli bir e-posta adresi giriniz']
  },
  phone: {
    type: String,
    required: false,
    trim: true,
    maxlength: [15, 'Telefon numarası en fazla 15 karakter olabilir']
  },
  password: {
    type: String,
    required: [true, 'Şifre alanı zorunludur'],
    minlength: [6, 'Şifre en az 6 karakter olmalıdır'],
    select: false // Varsayılan olarak şifreyi döndürme
  },
  role: {
    type: String,
    enum: {
      values: ['superadmin', 'admin', 'support', 'juri', 'mentor', 'user'],
      message: 'Rol şu değerlerden biri olmalıdır: superadmin, admin, support, juri, mentor, user'
    },
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  ideathonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ideathon',
    index: true
    // required değil — superadmin/admin gibi global roller ideathon'a bağlı olmayabilir
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  // Juri işlemlerini kayıt etmek için
  juriOperations: [{
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application'
    },
    action: {
      type: String,
      enum: ['reviewed', 'scored', 'approved', 'rejected', 'commented'],
      required: true
    },
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    comment: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],

  // Şifre sıfırlama için
  passwordResetCode: String,
  passwordResetExpires: Date,

  // Email Tercihleri (Toplantı Sistemi için)
  emailPreferences: {
    meetingCreated: {
      type: Boolean,
      default: true,
      description: 'Toplantı oluşturulduğunda email gönder'
    },
    meetingCancelled: {
      type: Boolean,
      default: true,
      description: 'Toplantı iptal edildiğinde email gönder'
    },
    meetingNoteAdded: {
      type: Boolean,
      default: true,
      description: 'Toplantı notu eklendiğinde email gönder'
    },
    availabilityUpdated: {
      type: Boolean,
      default: true,
      description: 'Kayıtlı olduğu mentor müsait zaman eklediğinde/çıkardığında email gönder'
    },
    newMessage: {
      type: Boolean,
      default: true,
      description: 'Yeni mesaj aldığında email gönder'
    },
    meetingReminder: {
      type: Boolean,
      default: true,
      description: 'Toplantı hatırlatma email gönder'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Email index

// Virtual for full name (şimdilik sadece name var ama ileride firstName lastName olabilir)
userSchema.virtual('displayName').get(function() {
  return this.name;
});

// Password hash middleware
userSchema.pre('save', async function(next) {
  // Şifre değişmemişse hashleme
  if (!this.isModified('password')) return next();

  try {
    // Hash şifreyi
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Şifre karşılaştırma instance method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Juri operation ekleme method
userSchema.methods.addJuriOperation = function(operationData) {
  this.juriOperations.push({
    ...operationData,
    timestamp: new Date()
  });
  return this.save();
};

// Şifre reset kodu oluşturma method (6 haneli sayı)
userSchema.methods.createPasswordResetCode = function() {
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 haneli sayı

  this.passwordResetCode = resetCode;

  // 15 dakika geçerli
  this.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 minutes

  return resetCode;
};

// Aktif juri'leri bulma static method
userSchema.statics.findActiveJuris = function() {
  return this.find({ role: 'juri', isActive: true });
};

// Superadmin sayısını kontrol etme static method
userSchema.statics.getSuperAdminCount = function() {
  return this.countDocuments({ role: 'superadmin', isActive: true });
};

module.exports = mongoose.model('User', userSchema);
