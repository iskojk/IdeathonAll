const mongoose = require('mongoose');

const availabilitySlotSchema = new mongoose.Schema({
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
    description: '[LEGACY] Hangi program/dönem için geçerli'
  },

  // Mentor referansı
  mentorUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Mentor kullanıcı ID zorunludur'],
    description: 'User.role = mentor olmalı'
  },

  // Slot zamanları (UTC)
  startAt: {
    type: Date,
    required: [true, 'Başlangıç zamanı zorunludur'],
    description: 'Slot başlangıç zamanı (UTC)'
  },

  endAt: {
    type: Date,
    required: [true, 'Bitiş zamanı zorunludur'],
    description: 'Slot bitiş zamanı (UTC)'
  },

  // Timezone bilgisi (opsiyonel, default: Europe/Istanbul)
  timezone: {
    type: String,
    default: 'Europe/Istanbul',
    trim: true
  },

  // Slot kaynağı
  source: {
    type: String,
    enum: {
      values: ['rule', 'manual'],
      message: 'Kaynak rule veya manual olmalıdır'
    },
    required: true,
    description: 'rule: AvailabilityRule ile otomatik oluşturuldu, manual: mentor elle ekledi'
  },

  // Eğer rule kaynaklıysa, hangi kuraldan geldi
  ruleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AvailabilityRule',
    required: function() {
      return this.source === 'rule';
    },
    description: 'Bu slot hangi AvailabilityRule ile oluşturuldu (source=rule ise zorunlu)'
  },

  // Slot durumu
  status: {
    type: String,
    enum: {
      values: ['open', 'reserved', 'booked', 'cancelled', 'completed'],
      message: 'Durum: open, reserved, booked, cancelled veya completed olmalıdır'
    },
    default: 'open',
    required: true,
    description: 'open: müsait, reserved: geçici rezerve, booked: toplantı var, cancelled: iptal, completed: tamamlandı'
  },

  // Rezervasyon süresi (reserved durumunda)
  reservedAt: {
    type: Date,
    description: 'Ne zaman rezerve edildi'
  },

  reservedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    description: 'Kim rezerve etti (participant)'
  },

  reservationExpiresAt: {
    type: Date,
    description: 'Rezervasyon ne zaman sona eriyor (örn: 15 dakika sonra)'
  },

  // Eğer toplantı oluşturulduysa (booked/completed durumunda)
  bookedMeetingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MentorMeeting',
    description: 'Bu slot hangi toplantı için kullanıldı'
  },

  // İptal bilgileri
  cancelledAt: {
    type: Date
  },

  cancellationReason: {
    type: String,
    trim: true,
    maxlength: [500, 'İptal nedeni en fazla 500 karakter olabilir']
  },

  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    description: 'Kim iptal etti (mentor veya admin)'
  },

  // Ek notlar
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Not en fazla 500 karakter olabilir']
  },

  // Toplantı şekli (rule'dan gelir veya manuel girilir)
  meetingType: {
    type: String,
    enum: {
      values: ['jitsi', 'private', 'google-meet', 'teams', 'zoom'],
      message: 'Toplantı şekli: jitsi, private, google-meet, teams veya zoom olmalıdır'
    },
    default: 'jitsi',
    description: 'Toplantının hangi platformda yapılacağı'
  },

  // Özel konum/link
  customLocation: {
    type: String,
    trim: true,
    maxlength: [500, 'Özel konum en fazla 500 karakter olabilir'],
    description: 'Toplantı şekli "özel" ise link veya konum bilgisi'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index'ler
availabilitySlotSchema.index({ ideathonId: 1, mentorUserId: 1, startAt: 1 });
availabilitySlotSchema.index({ ideathonId: 1, mentorUserId: 1, status: 1 });
availabilitySlotSchema.index({ ideathonId: 1, status: 1, startAt: 1 });
availabilitySlotSchema.index({ bookedMeetingId: 1 });
availabilitySlotSchema.index({ ruleId: 1 });

// Compound index - aynı mentor aynı ideathon'da aynı zamanda birden fazla slot olamaz
availabilitySlotSchema.index(
  { ideathonId: 1, mentorUserId: 1, startAt: 1, endAt: 1 },
  { unique: true }
);

// Rezervasyon süresi dolmuşları bul
availabilitySlotSchema.index({ 
  status: 1, 
  reservationExpiresAt: 1 
});

// Virtual for duration (dakika)
availabilitySlotSchema.virtual('duration').get(function() {
  if (!this.startAt || !this.endAt) return 0;
  return Math.round((this.endAt - this.startAt) / (1000 * 60));
});

// Virtual for is past
availabilitySlotSchema.virtual('isPast').get(function() {
  return this.endAt < new Date();
});

// Virtual for is available
availabilitySlotSchema.virtual('isAvailable').get(function() {
  return this.status === 'open' && this.startAt > new Date();
});

// Virtual for formatted date
availabilitySlotSchema.virtual('formattedDate').get(function() {
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
availabilitySlotSchema.virtual('formattedTime').get(function() {
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
availabilitySlotSchema.pre('save', function(next) {
  if (this.endAt <= this.startAt) {
    return next(new Error('Bitiş zamanı başlangıç zamanından sonra olmalıdır'));
  }
  next();
});

// Validation - booked ise bookedMeetingId zorunlu
availabilitySlotSchema.pre('save', function(next) {
  if ((this.status === 'booked' || this.status === 'completed') && !this.bookedMeetingId) {
    return next(new Error('Booked veya completed durumunda bookedMeetingId zorunludur'));
  }
  next();
});

// Validation - reserved ise reservedBy ve reservationExpiresAt zorunlu
availabilitySlotSchema.pre('save', function(next) {
  if (this.status === 'reserved' && (!this.reservedBy || !this.reservationExpiresAt)) {
    return next(new Error('Reserved durumunda reservedBy ve reservationExpiresAt zorunludur'));
  }
  next();
});

// Static methods
availabilitySlotSchema.statics.findAvailableSlots = function(mentorUserId, fromDate, toDate, programId = null, ideathonId = null) {
  const query = {
    mentorUserId,
    status: 'open',
    startAt: { $gte: fromDate, $lte: toDate }
  };
  
  if (programId) {
    query.programId = programId;
  }
  
  // Multi-Tenant: ideathonId varsa filtrele
  if (ideathonId) query.ideathonId = ideathonId;
  
  return this.find(query).sort({ startAt: 1 });
};

availabilitySlotSchema.statics.findMentorSlots = function(mentorUserId, filters = {}) {
  const query = { mentorUserId };
  
  if (filters.status) {
    query.status = filters.status;
  } else if (filters.statusExclude) {
    // Belirtilen status hariç tüm slotları getir
    query.status = { $ne: filters.statusExclude };
  }
  
  if (filters.fromDate) {
    query.startAt = { $gte: new Date(filters.fromDate) };
  }
  
  if (filters.toDate) {
    query.endAt = { $lte: new Date(filters.toDate) };
  }
  
  if (filters.programId) {
    query.programId = filters.programId;
  }
  
  // Multi-Tenant: ideathonId varsa filtrele
  if (filters.ideathonId) {
    query.ideathonId = filters.ideathonId;
  }
  
  return this.find(query)
    .populate('bookedMeetingId')
    .sort({ startAt: 1 });
};

// Rezervasyon süresi dolmuş slotları open'a çevir
availabilitySlotSchema.statics.expireReservations = async function() {
  const now = new Date();
  const result = await this.updateMany(
    {
      status: 'reserved',
      reservationExpiresAt: { $lt: now }
    },
    {
      $set: { 
        status: 'open',
        reservedBy: null,
        reservedAt: null,
        reservationExpiresAt: null
      }
    }
  );
  
  return result;
};

// Slot'u rezerve et (atomic operation)
availabilitySlotSchema.statics.reserveSlot = async function(slotId, userId, expirationMinutes = 15) {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + expirationMinutes);
  
  const slot = await this.findOneAndUpdate(
    {
      _id: slotId,
      status: 'open'
    },
    {
      $set: {
        status: 'reserved',
        reservedBy: userId,
        reservedAt: new Date(),
        reservationExpiresAt: expiresAt
      }
    },
    {
      new: true,
      runValidators: true
    }
  );
  
  return slot;
};

// Slot'u book et (atomic operation)
availabilitySlotSchema.statics.bookSlot = async function(slotId, meetingId, userId = null) {
  const query = {
    _id: slotId,
    $or: [
      { status: 'open' },
      { status: 'reserved', reservedBy: userId }
    ]
  };
  
  const slot = await this.findOneAndUpdate(
    query,
    {
      $set: {
        status: 'booked',
        bookedMeetingId: meetingId,
        reservedBy: null,
        reservedAt: null,
        reservationExpiresAt: null
      }
    },
    {
      new: true,
      runValidators: true
    }
  );
  
  return slot;
};

// Slot'u sil (tamamen veritabanından kaldır)
availabilitySlotSchema.statics.cancelSlot = async function(slotId, userId, reason) {
  // Önce slot'u bul ve kontrol et
  const slot = await this.findOne({
    _id: slotId,
    status: { $in: ['open', 'reserved'] }
  });
  
  if (!slot) {
    return null;
  }
  
  // Slot'u tamamen sil (cancelled yerine)
  await this.findByIdAndDelete(slotId);
  
  return slot;
};

// Geçmiş booked slotları completed yap
availabilitySlotSchema.statics.markPastSlotsCompleted = async function() {
  const now = new Date();
  const result = await this.updateMany(
    {
      status: 'booked',
      endAt: { $lt: now }
    },
    {
      $set: { status: 'completed' }
    }
  );
  
  return result;
};

module.exports = mongoose.model('AvailabilitySlot', availabilitySlotSchema);







