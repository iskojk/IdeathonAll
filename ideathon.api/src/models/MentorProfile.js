const mongoose = require('mongoose');

const mentorProfileSchema = new mongoose.Schema({
  // Mentor kullanıcı referansı (User.role = 'mentor' olmalı)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Kullanıcı ID zorunludur'],
    unique: true
  },

  // Profil bilgileri
  title: {
    type: String,
    required: [true, 'Ünvan zorunludur'],
    trim: true,
    maxlength: [200, 'Ünvan en fazla 200 karakter olabilir'],
    description: 'Örn: Kıdemli Yazılım Geliştirici, Girişimcilik Uzmanı'
  },

  about: {
    type: String,
    required: [true, 'Hakkında bilgisi zorunludur'],
    trim: true,
    maxlength: [2000, 'Hakkında bilgisi en fazla 2000 karakter olabilir']
  },

  linkedin: {
    type: String,
    trim: true,
    maxlength: [300, 'LinkedIn profil linki en fazla 300 karakter olabilir']
  },

  // Uzmanlık etiketleri (filtre için)
  expertiseTags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Her etiket en fazla 50 karakter olabilir']
  }],

  // Profil fotoğrafı
  photo: {
    type: String,
    trim: true,
    description: 'Avatar/profil fotoğrafı dosya yolu veya URL'
  },

  // Aktiflik durumu
  isActive: {
    type: Boolean,
    default: true,
    description: 'Mentorların participant tarafında görünüp görünmeyeceğini belirler'
  },

  // Multi-Tenant: İdeathon bağlantısı
  ideathonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ideathon',
    index: true
    // required değil — mevcut profiller için geriye uyumluluk
  },

  // Kim oluşturdu (admin)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Oluşturan kullanıcı ID zorunludur']
  },

  // Ek bilgiler (isteğe bağlı)
  additionalInfo: {
    languages: [{
      type: String,
      trim: true,
      maxlength: [50, 'Dil adı en fazla 50 karakter olabilir']
    }],
    availability: {
      type: String,
      trim: true,
      maxlength: [500, 'Müsaitlik bilgisi en fazla 500 karakter olabilir'],
      description: 'Genel müsaitlik durumu hakkında not'
    }
  },

  // İstatistikler (otomatik hesaplanacak)
  stats: {
    totalMeetings: {
      type: Number,
      default: 0,
      min: 0
    },
    completedMeetings: {
      type: Number,
      default: 0,
      min: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 0,
      min: 0
    }
  },

  // Mentora atanmış kullanıcılar (superadmin tarafından yönetilir)
  assignedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Email Tercihleri (MentorNet için)
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
      description: 'Müsait zaman eklendiğinde/çıkarıldığında email gönder'
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

// Index'ler
mentorProfileSchema.index({ userId: 1 }, { unique: true });
mentorProfileSchema.index({ isActive: 1 });
mentorProfileSchema.index({ expertiseTags: 1 });
mentorProfileSchema.index({ 'stats.averageRating': -1 });
mentorProfileSchema.index({ createdAt: -1 });
mentorProfileSchema.index({ ideathonId: 1, isActive: 1 });

// Text search için
mentorProfileSchema.index({
  title: 'text',
  about: 'text',
  expertiseTags: 'text'
});

// Virtual for photo URL
mentorProfileSchema.virtual('photoUrl').get(function() {
  if (!this.photo) return null;
  // Eğer tam URL ise direkt döndür, değilse base URL ekle
  if (this.photo.startsWith('http')) {
    return this.photo;
  }
  return `${process.env.BACKEND_URL || process.env.BASE_URL || 'http://localhost:5010'}/uploads/mentors/${this.photo}`;
});

// Virtual for completion percentage
mentorProfileSchema.virtual('profileCompleteness').get(function() {
  let completeness = 0;
  const fields = [
    this.title,
    this.about,
    this.linkedin,
    this.photo,
    this.expertiseTags && this.expertiseTags.length > 0
  ];
  
  fields.forEach(field => {
    if (field) completeness += 20;
  });
  
  return completeness;
});

// Static methods
mentorProfileSchema.statics.findActiveMentors = function(filters = {}) {
  const query = { isActive: true };
  
  // Multi-Tenant: ideathonId filtresi
  if (filters.ideathonId) {
    query.ideathonId = filters.ideathonId;
  }
  
  // Etiket filtresi
  if (filters.expertiseTags && filters.expertiseTags.length > 0) {
    query.expertiseTags = { $in: filters.expertiseTags };
  }
  
  // Text search
  if (filters.searchText) {
    query.$text = { $search: filters.searchText };
  }
  
  return this.find(query)
    .populate('userId', 'name email')
    .sort({ 'stats.averageRating': -1, createdAt: -1 });
};

mentorProfileSchema.statics.getMentorStats = async function(ideathonId = null) {
  const matchFilter = {};
  if (ideathonId) matchFilter.ideathonId = ideathonId;

  const stats = await this.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$isActive',
        count: { $sum: 1 },
        avgRating: { $avg: '$stats.averageRating' },
        totalMeetings: { $sum: '$stats.totalMeetings' }
      }
    }
  ]);

  return {
    total: await this.countDocuments(matchFilter),
    active: stats.find(s => s._id === true)?.count || 0,
    inactive: stats.find(s => s._id === false)?.count || 0,
    totalMeetings: stats.reduce((sum, s) => sum + s.totalMeetings, 0)
  };
};

// Instance methods
mentorProfileSchema.methods.updateStats = async function(meetingData) {
  if (meetingData.incrementMeetings) {
    this.stats.totalMeetings += 1;
  }
  
  if (meetingData.incrementCompleted) {
    this.stats.completedMeetings += 1;
  }
  
  if (meetingData.newRating) {
    const totalScore = this.stats.averageRating * this.stats.totalRatings + meetingData.newRating;
    this.stats.totalRatings += 1;
    this.stats.averageRating = totalScore / this.stats.totalRatings;
  }
  
  return this.save();
};

// Middleware - userId'nin User modelinde mentor rolü olduğunu kontrol et
mentorProfileSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('userId')) {
    try {
      const User = mongoose.model('User');
      const user = await User.findById(this.userId);
      
      if (!user) {
        return next(new Error('Kullanıcı bulunamadı'));
      }
      
      if (user.role !== 'mentor') {
        return next(new Error('Kullanıcının rolü mentor olmalıdır'));
      }
      
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

module.exports = mongoose.model('MentorProfile', mentorProfileSchema);













