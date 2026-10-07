const mongoose = require('mongoose');

const mentorMeetingSchema = new mongoose.Schema({
  // İdeathon referansı (Multi-Tenant)
  ideathonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ideathon',
    required: [true, 'İdeathon ID zorunludur'],
    index: true
  },

  // Program/Dönem referansı (LEGACY — kod sadece ideathonId ile çalışır)
  programId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program',
    required: false,
    description: '[LEGACY] Hangi program/dönem için'
  },

  // Mentor referansı
  mentorUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Mentor kullanıcı ID zorunludur'],
    description: 'Mentor (User.role = mentor)'
  },

  // Katılımcı referansı (zorunlu)
  participantUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Katılımcı kullanıcı ID zorunludur'],
    description: 'Katılımcı (User.role = user)'
  },

  // Katılımcının başvurusu (opsiyonel ama önerilen - raporlama için)
  participantApplicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    description: 'Katılımcının Application kaydı'
  },

  // Eğer toplantı takım görüşmesi ise
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    description: 'Takım görüşmesi ise Team referansı'
  },

  // Hangi slot üzerinden oluşturuldu
  slotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AvailabilitySlot',
    required: [true, 'Slot ID zorunludur']
  },

  // Toplantı zamanları
  startAt: {
    type: Date,
    required: [true, 'Başlangıç zamanı zorunludur']
  },

  endAt: {
    type: Date,
    required: [true, 'Bitiş zamanı zorunludur']
  },

  timezone: {
    type: String,
    default: 'Europe/Istanbul',
    trim: true
  },

  // Toplantı sağlayıcısı
  meetingProvider: {
    type: String,
    enum: {
      values: ['jitsi', 'google', 'zoom', 'teams', 'manual'],
      message: 'Provider: jitsi, google, zoom, teams veya manual olmalıdır'
    },
    default: 'jitsi',
    required: true
  },

  // Toplantı linki
  meetingUrl: {
    type: String,
    trim: true,
    maxlength: [500, 'Toplantı linki en fazla 500 karakter olabilir']
  },

  // Toplantı başlığı (opsiyonel)
  title: {
    type: String,
    trim: true,
    maxlength: [200, 'Başlık en fazla 200 karakter olabilir'],
    description: 'Toplantı başlığı (örn: Proje Danışmanlığı)'
  },

  // Toplantı açıklaması
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Açıklama en fazla 1000 karakter olabilir']
  },

  // Kim planladı/oluşturdu
  plannedByUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Planlayan kullanıcı ID zorunludur'],
    description: 'Toplantıyı kim oluşturdu (genellikle participant veya admin)'
  },

  // Toplantı durumu
  status: {
    type: String,
    enum: {
      values: ['scheduled', 'completed', 'cancelled', 'no_show', 'rescheduled'],
      message: 'Durum: scheduled, completed, cancelled, no_show veya rescheduled olmalıdır'
    },
    default: 'scheduled',
    required: true
  },

  // İptal bilgileri
  cancelledAt: {
    type: Date
  },

  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    description: 'Kim iptal etti'
  },

  cancellationReason: {
    type: String,
    trim: true,
    maxlength: [500, 'İptal nedeni en fazla 500 karakter olabilir']
  },

  // 🆕 No-show bilgileri
  noShowAt: {
    type: Date
  },

  noShowBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    description: 'Kim no-show olarak işaretledi'
  },

  noShowReason: {
    type: String,
    trim: true,
    maxlength: [500, 'No-show nedeni en fazla 500 karakter olabilir']
  },

  // Yeniden planlama bilgileri
  rescheduledAt: {
    type: Date
  },

  rescheduledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  rescheduledToMeetingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MentorMeeting',
    description: 'Hangi yeni toplantıya taşındı'
  },

  rescheduledFromMeetingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MentorMeeting',
    description: 'Hangi eski toplantıdan geldi'
  },

  // Tamamlanma bilgileri
  completedAt: {
    type: Date
  },

  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    description: 'Kim tamamlandı olarak işaretledi (genellikle mentor)'
  },

  // Katılım bilgileri
  attendance: {
    mentorJoined: {
      type: Boolean,
      default: false
    },
    mentorJoinedAt: {
      type: Date
    },
    participantJoined: {
      type: Boolean,
      default: false
    },
    participantJoinedAt: {
      type: Date
    }
  },

  // Hatırlatmalar gönderildi mi
  reminders: {
    oneDayBefore: {
      type: Boolean,
      default: false
    },
    oneHourBefore: {
      type: Boolean,
      default: false
    },
    afterMeeting: {
      type: Boolean,
      default: false
    }
  },

  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    description: 'Ek bilgiler için esnek alan'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index'ler
mentorMeetingSchema.index({ ideathonId: 1, mentorUserId: 1, startAt: -1 });
mentorMeetingSchema.index({ ideathonId: 1, participantUserId: 1, startAt: -1 });
mentorMeetingSchema.index({ ideathonId: 1, status: 1, startAt: 1 });
mentorMeetingSchema.index({ slotId: 1 });
mentorMeetingSchema.index({ teamId: 1 });
mentorMeetingSchema.index({ startAt: 1 });

// Compound index - mentor ve participant birlikte arama için
mentorMeetingSchema.index({ ideathonId: 1, mentorUserId: 1, participantUserId: 1, startAt: -1 });

// Virtual for duration (dakika)
mentorMeetingSchema.virtual('duration').get(function() {
  if (!this.startAt || !this.endAt) return 0;
  return Math.round((this.endAt - this.startAt) / (1000 * 60));
});

// Virtual for is past
mentorMeetingSchema.virtual('isPast').get(function() {
  return this.endAt < new Date();
});

// Virtual for is upcoming
mentorMeetingSchema.virtual('isUpcoming').get(function() {
  return this.startAt > new Date() && this.status === 'scheduled';
});

// Virtual for is today
mentorMeetingSchema.virtual('isToday').get(function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return this.startAt >= today && this.startAt < tomorrow;
});

// Virtual for formatted date
mentorMeetingSchema.virtual('formattedDate').get(function() {
  if (!this.startAt) return '';
  return this.startAt.toLocaleDateString('tr-TR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    timeZone: 'Europe/Istanbul'
  });
});

// Virtual for formatted time
mentorMeetingSchema.virtual('formattedTime').get(function() {
  if (!this.startAt || !this.endAt) return '';
  const startTime = this.startAt.toLocaleTimeString('tr-TR', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'Europe/Istanbul'
  });
  const endTime = this.endAt.toLocaleTimeString('tr-TR', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'Europe/Istanbul'
  });
  return `${startTime} - ${endTime}`;
});

// Validation - endAt startAt'dan sonra olmalı
mentorMeetingSchema.pre('save', function(next) {
  if (this.endAt <= this.startAt) {
    return next(new Error('Bitiş zamanı başlangıç zamanından sonra olmalıdır'));
  }
  next();
});

// Validation - mentor ve participant farklı olmalı
mentorMeetingSchema.pre('save', function(next) {
  if (this.mentorUserId.toString() === this.participantUserId.toString()) {
    return next(new Error('Mentor ve katılımcı aynı olamaz'));
  }
  next();
});

// Auto-complete past meetings
mentorMeetingSchema.pre('save', function(next) {
  if (this.status === 'scheduled' && this.endAt < new Date()) {
    // Geçmiş scheduled toplantıları otomatik completed yap
    // Ama bunu iş kurallarına göre ayarlayabilirsiniz (no_show da olabilir)
  }
  next();
});

// Static methods
mentorMeetingSchema.statics.findUpcoming = function(userId, role = 'participant', limit = 10, ideathonId = null) {
  const now = new Date();
  const bufferMs = 20 * 60 * 1000;
  const cutoff = new Date(now.getTime() - bufferMs);
  const query = {
    status: 'scheduled',
    startAt: { $gt: cutoff }
  };
  
  if (role === 'mentor') {
    query.mentorUserId = userId;
  } else {
    query.participantUserId = userId;
  }
  
  // Multi-Tenant: ideathonId varsa filtrele
  if (ideathonId) query.ideathonId = ideathonId;
  
  return this.find(query)
    .populate('mentorUserId', 'name email')
    .populate('participantUserId', 'name email')
    .populate('slotId')
    .sort({ startAt: 1 })
    .limit(limit);
};

mentorMeetingSchema.statics.findPast = function(userId, role = 'participant', limit = 10, ideathonId = null) {
  const now = new Date();
  const query = {
    endAt: { $lt: now }
  };
  
  if (role === 'mentor') {
    query.mentorUserId = userId;
  } else {
    query.participantUserId = userId;
  }
  
  // Multi-Tenant: ideathonId varsa filtrele
  if (ideathonId) query.ideathonId = ideathonId;
  
  return this.find(query)
    .populate('mentorUserId', 'name email')
    .populate('participantUserId', 'name email')
    .populate('slotId')
    .sort({ startAt: -1 })
    .limit(limit);
};

mentorMeetingSchema.statics.findByStatus = function(status, filters = {}) {
  const query = { status };
  
  if (filters.mentorUserId) {
    query.mentorUserId = filters.mentorUserId;
  }
  
  if (filters.participantUserId) {
    query.participantUserId = filters.participantUserId;
  }
  
  if (filters.programId) {
    query.programId = filters.programId;
  }
  
  // Multi-Tenant: ideathonId varsa filtrele
  if (filters.ideathonId) {
    query.ideathonId = filters.ideathonId;
  }
  
  if (filters.fromDate) {
    query.startAt = { $gte: new Date(filters.fromDate) };
  }
  
  if (filters.toDate) {
    query.endAt = { $lte: new Date(filters.toDate) };
  }
  
  return this.find(query)
    .populate('mentorUserId', 'name email')
    .populate('participantUserId', 'name email')
    .sort({ startAt: -1 });
};

// Toplantıyı iptal et (atomic)
mentorMeetingSchema.statics.cancelMeeting = async function(meetingId, userId, reason) {
  const meeting = await this.findOneAndUpdate(
    {
      _id: meetingId,
      status: 'scheduled'
    },
    {
      $set: {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledBy: userId,
        cancellationReason: reason
      }
    },
    {
      new: true,
      runValidators: true
    }
  );
  
  // 🗑️ Slot'u tamamen sil (cancelled yerine) - yeni slot açılabilsin
  if (meeting && meeting.slotId) {
    const AvailabilitySlot = mongoose.model('AvailabilitySlot');
    const slot = await AvailabilitySlot.findById(meeting.slotId);
    
    if (slot) {
      // Her durumda tamamen sil (manuel veya rule farketmeksizin)
      await AvailabilitySlot.findByIdAndDelete(meeting.slotId);
      console.log(`🗑️ Slot tamamen silindi: ${meeting.slotId}`);
    }
  }
  
  return meeting;
};

// Toplantıyı tamamla
mentorMeetingSchema.statics.completeMeeting = async function(meetingId, userId) {
  const meeting = await this.findOneAndUpdate(
    {
      _id: meetingId,
      status: 'scheduled'
    },
    {
      $set: {
        status: 'completed',
        completedAt: new Date(),
        completedBy: userId
      }
    },
    {
      new: true,
      runValidators: true
    }
  );
  
  // Slot'u completed yap
  if (meeting && meeting.slotId) {
    const AvailabilitySlot = mongoose.model('AvailabilitySlot');
    await AvailabilitySlot.findByIdAndUpdate(
      meeting.slotId,
      { $set: { status: 'completed' } }
    );
  }
  
  return meeting;
};

// Geçmiş scheduled toplantıları otomatik completed/no_show yap
mentorMeetingSchema.statics.autoCompletePastMeetings = async function() {
  const now = new Date();
  const result = await this.updateMany(
    {
      status: 'scheduled',
      endAt: { $lt: now }
    },
    {
      $set: { 
        status: 'completed',
        completedAt: now
      }
    }
  );
  
  return result;
};

// İstatistikler
mentorMeetingSchema.statics.getMentorStats = async function(mentorUserId) {
  const total = await this.countDocuments({ mentorUserId });
  const completed = await this.countDocuments({ mentorUserId, status: 'completed' });
  const scheduled = await this.countDocuments({ mentorUserId, status: 'scheduled' });
  const cancelled = await this.countDocuments({ mentorUserId, status: 'cancelled' });
  
  return {
    total,
    completed,
    scheduled,
    cancelled,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
  };
};

module.exports = mongoose.model('MentorMeeting', mentorMeetingSchema);

