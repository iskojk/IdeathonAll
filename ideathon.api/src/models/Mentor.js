const mongoose = require('mongoose');

const mentorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Mentör adı alanı zorunludur'],
    trim: true,
    minlength: [2, 'Mentör adı en az 2 karakter olmalıdır'],
    maxlength: [100, 'Mentör adı en fazla 100 karakter olabilir']
  },
  photo: {
    type: String, // Dosya yolu veya URL
    required: [true, 'Mentör fotoğrafı zorunludur']
  },
  status: {
    type: String,
    required: [true, 'Mentör statüsü alanı zorunludur'],
    trim: true,
    maxlength: [200, 'Mentör statüsü en fazla 200 karakter olabilir'],
    description: 'Mentörün hangi alanda uzman olduğunu belirtir'
  },
  description: {
    type: String,
    required: [true, 'Mentör açıklaması zorunludur'],
    trim: true,
    maxlength: [1000, 'Mentör açıklaması en fazla 1000 karakter olabilir']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0,
    min: 0,
    description: 'Mentörlerin sıralaması için'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Multi-Tenant: Opsiyonel — mentor kartı ideathon'a bağlıysa
  ideathonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ideathon',
    index: true
    // required değil — global mentorlar da olabilir
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index'ler
mentorSchema.index({ isActive: 1 });
mentorSchema.index({ order: 1 });
mentorSchema.index({ createdAt: -1 });

// Virtual for photo URL
mentorSchema.virtual('photoUrl').get(function() {
  if (!this.photo) return null;
  // Eğer tam URL ise direkt döndür, değilse base URL ekle
  if (this.photo.startsWith('http')) {
    return this.photo;
  }
  return `${process.env.BACKEND_URL || process.env.BASE_URL || 'http://localhost:5010'}/uploads/mentors/${this.photo}`;
});

// Static methods
mentorSchema.statics.findActiveMentors = function() {
  return this.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
};

mentorSchema.statics.getMentorStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$isActive',
        count: { $sum: 1 }
      }
    }
  ]);

  return {
    total: await this.countDocuments(),
    active: stats.find(s => s._id === true)?.count || 0,
    inactive: stats.find(s => s._id === false)?.count || 0
  };
};

module.exports = mongoose.model('Mentor', mentorSchema);






