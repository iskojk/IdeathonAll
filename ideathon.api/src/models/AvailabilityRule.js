const mongoose = require('mongoose');

const availabilityRuleSchema = new mongoose.Schema({
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

  // Haftanın günü (0 = Pazar, 1 = Pazartesi, ..., 6 = Cumartesi)
  dayOfWeek: {
    type: Number,
    required: [true, 'Haftanın günü zorunludur'],
    min: [0, 'Gün 0-6 arasında olmalıdır'],
    max: [6, 'Gün 0-6 arasında olmalıdır'],
    description: '0=Pazar, 1=Pazartesi, 2=Salı, 3=Çarşamba, 4=Perşembe, 5=Cuma, 6=Cumartesi'
  },

  // Başlangıç saati (HH:MM formatı)
  startTime: {
    type: String,
    required: [true, 'Başlangıç saati zorunludur'],
    trim: true,
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Başlangıç saati HH:MM formatında olmalıdır (örn: 14:00)']
  },

  // Bitiş saati (HH:MM formatı)
  endTime: {
    type: String,
    required: [true, 'Bitiş saati zorunludur'],
    trim: true,
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Bitiş saati HH:MM formatında olmalıdır (örn: 15:00)']
  },

  // Toplantı süresi (dakika)
  meetingDuration: {
    type: Number,
    required: true,
    default: 25,
    min: [15, 'Toplantı süresi en az 15 dakika olmalıdır'],
    max: [180, 'Toplantı süresi en fazla 180 dakika olabilir'],
    description: 'Her slot kaç dakika (varsayılan 25 dk)'
  },

  // Toplantı arası (dakika) - isteğe bağlı
  breakTime: {
    type: Number,
    default: 0,
    min: [0, 'Toplantı arası negatif olamaz'],
    max: [60, 'Toplantı arası en fazla 60 dakika olabilir'],
    description: 'Toplantılar arası ara (varsayılan 0 dk)'
  },

  // Toplantı şekli
  meetingType: {
    type: String,
    enum: {
      values: ['jitsi', 'private', 'google-meet', 'teams', 'zoom'],
      message: 'Toplantı şekli: jitsi, private, google-meet, teams veya zoom olmalıdır'
    },
    default: 'jitsi',
    description: 'Toplantının hangi platformda yapılacağı'
  },

  // Özel konum/link (meetingType='private' ise zorunlu)
  customLocation: {
    type: String,
    trim: true,
    maxlength: [500, 'Özel konum en fazla 500 karakter olabilir'],
    description: 'Toplantı şekli "özel" ise link veya konum bilgisi'
  },

  // Aktiflik durumu
  isActive: {
    type: Boolean,
    default: true,
    description: 'Pasif kurallar slot üretmez'
  },

  // Kural oluşturma/güncelleme bilgisi
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    description: 'Kuralı oluşturan kullanıcı (mentor kendisi veya admin)'
  },

  // Son güncelleme bilgisi
  lastSyncedAt: {
    type: Date,
    description: 'Bu kurala göre slotlar en son ne zaman üretildi'
  },

  // Kural notları (opsiyonel)
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Not en fazla 500 karakter olabilir']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index'ler
availabilityRuleSchema.index({ ideathonId: 1, mentorUserId: 1, isActive: 1 });
availabilityRuleSchema.index({ ideathonId: 1, dayOfWeek: 1 });
availabilityRuleSchema.index({ isActive: 1 });

// Compound index - aynı mentor aynı ideathon'da aynı gün aynı saatte çakışan AKTIF kural ekleyemez
availabilityRuleSchema.index(
  { ideathonId: 1, mentorUserId: 1, dayOfWeek: 1, startTime: 1, endTime: 1 },
  { 
    unique: true,
    partialFilterExpression: { isActive: true }
  }
);

// Virtual for day name (Türkçe)
availabilityRuleSchema.virtual('dayName').get(function() {
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  return days[this.dayOfWeek] || 'Bilinmiyor';
});

// Virtual for time range display
availabilityRuleSchema.virtual('timeRange').get(function() {
  return `${this.startTime} - ${this.endTime}`;
});

// Virtual for slot count (kaç slot üretilebilir)
availabilityRuleSchema.virtual('slotCount').get(function() {
  const [startH, startM] = this.startTime.split(':').map(Number);
  const [endH, endM] = this.endTime.split(':').map(Number);
  
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  
  const totalMinutes = endMinutes - startMinutes;
  
  if (totalMinutes <= 0) return 0;
  
  return Math.floor(totalMinutes / this.meetingDuration);
});

// Validation - endTime startTime'dan sonra olmalı
availabilityRuleSchema.pre('save', function(next) {
  const [startH, startM] = this.startTime.split(':').map(Number);
  const [endH, endM] = this.endTime.split(':').map(Number);
  
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  
  if (endMinutes <= startMinutes) {
    return next(new Error('Bitiş saati başlangıç saatinden sonra olmalıdır'));
  }
  
  // En az bir slot üretilebilmeli
  const totalMinutes = endMinutes - startMinutes;
  if (totalMinutes < this.meetingDuration) {
    return next(new Error(`Zaman aralığı en az ${this.meetingDuration} dakika olmalıdır`));
  }
  
  next();
});

// Validation - meetingType='private' ise customLocation zorunlu
availabilityRuleSchema.pre('save', function(next) {
  if (this.meetingType === 'private' && !this.customLocation) {
    return next(new Error('Toplantı şekli "özel" seçildiğinde konum/link bilgisi zorunludur'));
  }
  next();
});

// Middleware - mentorUserId'nin User modelinde mentor rolü olduğunu kontrol et
availabilityRuleSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('mentorUserId')) {
    try {
      const User = mongoose.model('User');
      const user = await User.findById(this.mentorUserId);
      
      if (!user) {
        return next(new Error('Mentor kullanıcısı bulunamadı'));
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

// Static methods
availabilityRuleSchema.statics.findMentorRules = function(mentorUserId, activeOnly = true, ideathonId = null) {
  const query = { mentorUserId };
  if (activeOnly) {
    query.isActive = true;
  }
  // Multi-Tenant: ideathonId varsa filtrele
  if (ideathonId) query.ideathonId = ideathonId;
  return this.find(query).sort({ dayOfWeek: 1, startTime: 1 });
};

availabilityRuleSchema.statics.findByProgram = function(programId) {
  return this.find({ programId, isActive: true })
    .populate('mentorUserId', 'name email')
    .sort({ dayOfWeek: 1, startTime: 1 });
};

// Instance methods
// Türkiye kalıcı olarak UTC+3 kullanıyor (2016'dan beri DST yok)
const ISTANBUL_OFFSET_MS = 3 * 60 * 60 * 1000;

availabilityRuleSchema.methods.generateSlotsForDateRange = function(startDate, endDate) {
  const slots = [];
  const currentDate = new Date(startDate);
  currentDate.setUTCHours(0, 0, 0, 0);

  const endDateNorm = new Date(endDate);
  endDateNorm.setUTCHours(23, 59, 59, 999);
  
  while (currentDate <= endDateNorm) {
    // Istanbul timezone'unda gün kontrolü (UTC+3)
    const istanbulDate = new Date(currentDate.getTime() + ISTANBUL_OFFSET_MS);
    const istanbulDay = istanbulDate.getUTCDay();

    if (istanbulDay === this.dayOfWeek) {
      const [startH, startM] = this.startTime.split(':').map(Number);
      const [endH, endM] = this.endTime.split(':').map(Number);
      
      let slotStartMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      
      const breakTime = this.breakTime || 0;
      const slotInterval = this.meetingDuration + breakTime;

      // Istanbul tarih string'i (YYYY-MM-DD)
      const dateStr = istanbulDate.toISOString().split('T')[0];
      
      while (slotStartMinutes + this.meetingDuration <= endMinutes) {
        const h = String(Math.floor(slotStartMinutes / 60)).padStart(2, '0');
        const m = String(slotStartMinutes % 60).padStart(2, '0');

        // Saatleri Istanbul local olarak oluştur, +03:00 offset ile UTC'ye çevrilir
        const slotStartDate = new Date(`${dateStr}T${h}:${m}:00+03:00`);
        const slotEndDate = new Date(slotStartDate.getTime() + this.meetingDuration * 60 * 1000);
        
        slots.push({
          ideathonId: this.ideathonId,
          mentorUserId: this.mentorUserId,
          startAt: slotStartDate,
          endAt: slotEndDate,
          source: 'rule',
          ruleId: this._id,
          status: 'open',
          meetingType: this.meetingType,
          customLocation: this.customLocation
        });
        
        slotStartMinutes += slotInterval;
      }
    }
    
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }
  
  return slots;
};

module.exports = mongoose.model('AvailabilityRule', availabilityRuleSchema);








