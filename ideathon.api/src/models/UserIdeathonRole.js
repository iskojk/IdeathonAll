const mongoose = require('mongoose');

const userIdeathonRoleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Kullanıcı ID zorunludur']
  },
  ideathonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ideathon',
    required: [true, 'İdeathon ID zorunludur']
  },
  role: {
    type: String,
    enum: {
      values: ['juri', 'mentor', 'admin', 'user'],
      message: 'Geçersiz rol. Geçerli roller: juri, mentor, admin, user'
    },
    required: [true, 'Rol zorunludur']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Atayan kullanıcı ID zorunludur']
  },
  // Token invalidation desteği
  // Bu alan değiştiğinde, bu tarihten önce basılmış JWT'ler reddedilir
  lastRoleChangeAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Bir kullanıcı aynı ideathon'da aynı rolde iki kez olamaz
userIdeathonRoleSchema.index(
  { userId: 1, ideathonId: 1, role: 1 },
  { unique: true }
);
userIdeathonRoleSchema.index({ userId: 1, isActive: 1 });
userIdeathonRoleSchema.index({ ideathonId: 1, role: 1, isActive: 1 });

// Pre-save: lastRoleChangeAt güncelle
userIdeathonRoleSchema.pre('save', function (next) {
  if (this.isModified('isActive') || this.isModified('role') || this.isModified('ideathonId')) {
    this.lastRoleChangeAt = new Date();
  }
  next();
});

// Static: Kullanıcının aktif rollerini getir
userIdeathonRoleSchema.statics.getActiveRolesForUser = async function (userId) {
  return await this.find({ userId, isActive: true })
    .populate('ideathonId', 'name slug status')
    .lean();
};

// Static: Bir ideathon'daki aktif kullanıcıları role göre getir
userIdeathonRoleSchema.statics.getUsersByIdeathonAndRole = async function (ideathonId, role) {
  return await this.find({ ideathonId, role, isActive: true })
    .populate('userId', 'name email phone')
    .lean();
};

module.exports = mongoose.model('UserIdeathonRole', userIdeathonRoleSchema);




