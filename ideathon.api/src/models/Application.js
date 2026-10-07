const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  // İdeathon referansı (Multi-Tenant)
  ideathonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ideathon',
    required: [true, 'İdeathon ID zorunludur'],
    index: true
  },

  // Başvuruyu yapan kullanıcı
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Kullanıcı ID zorunludur']
  },

  // Kişisel Bilgiler (Required)
  personalInfo: {
    firstName: {
      type: String,
      required: [true, 'Ad alanı zorunludur'],
      trim: true,
      minlength: [2, 'Ad en az 2 karakter olmalıdır'],
      maxlength: [50, 'Ad en fazla 50 karakter olabilir']
    },
    lastName: {
      type: String,
      required: [true, 'Soyad alanı zorunludur'],
      trim: true,
      minlength: [2, 'Soyad en az 2 karakter olmalıdır'],
      maxlength: [50, 'Soyad en fazla 50 karakter olabilir']
    },
    tcIdentity: {
      type: String,
      required: [true, 'TC Kimlik No alanı zorunludur'],
      trim: true,
      match: [/^[0-9]{11}$/, 'TC Kimlik No 11 haneli sayı olmalıdır'],
      minlength: [11, 'TC Kimlik No 11 karakter olmalıdır'],
      maxlength: [11, 'TC Kimlik No 11 karakter olmalıdır']
    },
    birthDate: {
      type: Date,
      required: [true, 'Doğum tarihi alanı zorunludur']
    },
    phone: {
      type: String,
      required: [true, 'Telefon alanı zorunludur'],
      trim: true,
      match: [/^[0-9+\-\s()]+$/, 'Geçerli bir telefon numarası giriniz']
    },
    email: {
      type: String,
      required: [true, 'E-posta alanı zorunludur'],
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Geçerli bir e-posta adresi giriniz']
    },
    city: {
      type: String,
      required: [true, 'İkamet şehri alanı zorunludur'],
      trim: true,
      maxlength: [50, 'Şehir adı en fazla 50 karakter olabilir']
    }
  },

  // Sosyal Medya ve Profil
  socialInfo: {
    linkedinProfile: {
      type: String,
      trim: true,
      maxlength: [200, 'LinkedIn profili en fazla 200 karakter olabilir']
    },
    personalWebsite: {
      type: String,
      trim: true,
      maxlength: [200, 'Kişisel web sitesi en fazla 200 karakter olabilir']
    }
  },

  // Sağlık Bilgileri
  healthInfo: {
    healthDeclaration: {
      type: String,
      trim: true,
      maxlength: [500, 'Sağlık beyanı en fazla 500 karakter olabilir']
    },
    emergencyContact: {
      name: {
        type: String,
        trim: true,
        maxlength: [100, 'Acil durum kişi adı en fazla 100 karakter olabilir']
      },
      phone: {
        type: String,
        trim: true,
        match: [/^[0-9+\-\s()]+$/, 'Geçerli bir telefon numarası giriniz'],
        maxlength: [20, 'Acil durum telefonu en fazla 20 karakter olabilir']
      }
    }
  },

  // Profil Bilgileri
  profileInfo: {
    participantType: {
      type: String,
      trim: true,
      maxlength: [50, 'Katılımcı profili en fazla 50 karakter olabilir']
    },

    // Öğrenci ise
    studentInfo: {
      school: {
        type: String,
        trim: true,
        maxlength: [100, 'Okul adı en fazla 100 karakter olabilir']
      },
      department: {
        type: String,
        trim: true,
        maxlength: [100, 'Bölüm en fazla 100 karakter olabilir']
      },
      grade: {
        type: String,
        trim: true,
        maxlength: [20, 'Sınıf en fazla 20 karakter olabilir']
      }
    },

    // Girişimci, çalışan, yeni mezun ise
    professionalInfo: {
      educationLevel: {
        type: String,
        trim: true,
        maxlength: [50, 'Eğitim durumu en fazla 50 karakter olabilir']
      },
      field: {
        type: String,
        trim: true,
        maxlength: [100, 'Bölüm/Alan en fazla 100 karakter olabilir']
      },
      graduationYear: {
        type: Number,
        min: 1950,
        max: new Date().getFullYear() + 10
      }
    }
  },

  // Takım Bilgileri (takım ise)
  teamInfo: {
    // Başvuru aşamasındaki takım bilgileri
    isInTeam: {
      type: Boolean,
      default: false
    },
    teamName: {
      type: String,
      trim: true,
      maxlength: [100, 'Takım adı en fazla 100 karakter olabilir']
    },
    teamSize: {
      type: Number,
      min: 1,
      max: 5
    },
    teamMembers: [{
      name: {
        type: String,
        trim: true,
        maxlength: [100, 'Üye adı en fazla 100 karakter olabilir']
      },
      tcIdentity: {
        type: String,
        trim: true,
        match: [/^[0-9]{11}$/, 'Takım üyesi TC Kimlik No 11 haneli sayı olmalıdır'],
        minlength: [11, 'Takım üyesi TC Kimlik No 11 karakter olmalıdır'],
        maxlength: [11, 'Takım üyesi TC Kimlik No 11 karakter olmalıdır']
      },
      role: {
        type: String,
        trim: true,
        maxlength: [100, 'Rol en fazla 100 karakter olabilir']
      }
    }],
    // Katılımcı olduktan sonraki takım bilgileri (admin tarafından atanır)
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    teamRole: {
      type: String,
      trim: true,
      maxlength: [100, 'Takım rolü en fazla 100 karakter olabilir']
    }
  },

  // İlgi Alanları ve Deneyim
  interestsInfo: {
    observationField: [{
      type: String,
      trim: true,
      maxlength: [200, 'Her gözlem alanı en fazla 200 karakter olabilir']
    }],
    hasPreviousExperience: {
      type: Boolean,
      default: false
    },
    previousExperienceDescription: {
      type: String,
      trim: true,
      maxlength: [1000, 'Önceki deneyim açıklaması en fazla 1000 karakter olabilir']
    }
  },

  // Yetkinlikler ve Motivasyon
  competenciesInfo: {
    competencies: [{
      type: String,
      trim: true,
      maxlength: [100, 'Her yetkinlik en fazla 100 karakter olabilir']
    }],
    otherCompetency: {
      type: String,
      trim: true,
      maxlength: [200, 'Diğer yetkinlik en fazla 200 karakter olabilir']
    },
    selfDescription: {
      type: String,
      trim: true,
      maxlength: [200, 'Kendini tanımlama en fazla 200 karakter olabilir']
    },
    motivation: {
      type: String,
      trim: true,
      maxlength: [1000, 'Motivasyon açıklaması en fazla 1000 karakter olabilir']
    }
  },

  // Ek Bilgiler
  additionalInfo: {
    projectLink: {
      type: String,
      trim: true,
      maxlength: [500, 'Proje linki en fazla 500 karakter olabilir']
    },
    videoLink: {
      type: String,
      trim: true,
      maxlength: [500, 'Video linki en fazla 500 karakter olabilir']
    }
  },

  // V2 Ön Değerlendirme - Sunum ve Proje Açıklaması (isteğe bağlı)
  presentationInfo: {
    // Sunum dosyası (PDF, PPT, PPTX, vb.)
    presentationFile: {
      filename: {
        type: String,
        trim: true
      },
      originalName: {
        type: String,
        trim: true
      },
      path: {
        type: String,
        trim: true
      },
      size: {
        type: Number
      },
      mimetype: {
        type: String,
        trim: true
      },
      uploadedAt: {
        type: Date
      }
    },
    // Proje açıklaması (text)
    projectDescription: {
      type: String,
      trim: true,
      maxlength: [5000, 'Proje açıklaması en fazla 5000 karakter olabilir']
    },
    // Son güncelleme tarihi
    lastUpdatedAt: {
      type: Date
    }
  },

  // Katılım Onayları
  consents: {
    informationAccuracy: {
      type: Boolean,
      required: [true, 'Bilgi doğruluğu onayı zorunludur'],
      default: false
    },
    rulesCompliance: {
      type: Boolean,
      required: [true, 'Kurallar onayı zorunludur'],
      default: false
    },
    kvkkConsent: {
      type: Boolean,
      required: [true, 'KVKK onayı zorunludur'],
      default: false
    }
  },


  // Başvuru durumu
  status: {
    type: String,
    enum: {
      values: ['pending', 'under_review', 'approved', 'rejected', 'withdrawn'],
      message: 'Geçersiz durum. Geçerli durumlar: pending, under_review, approved, rejected, withdrawn'
    },
    default: 'pending'
  },

  // Katılımcı durumu (superadmin onayı sonrası)
  participantStatus: {
    type: String,
    enum: {
      values: ['not_participant', 'participant', 'grouped'],
      message: 'Geçersiz katılımcı durumu'
    },
    default: 'not_participant'
  },

  // Takım bilgileri (gruplandırılınca)

  // V2 Juri Ön Değerlendirme (gerçek başvuru durumunu etkilemez)
  preEvaluations: [{
    juriId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    juriName: {
      type: String,
      required: true
    },
    decision: {
      type: String,
      enum: {
        values: ['approve', 'reject', 'undecided'],
        message: 'Karar: approve, reject veya undecided olmalıdır'
      },
      required: true
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Yorum en fazla 1000 karakter olabilir']
    },
    evaluatedAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date
    }
  }],

  // Juri değerlendirmeleri
  evaluations: [{
    juriId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    juriName: {
      type: String,
      required: true
    },
    evaluationType: {
      type: String,
      enum: ['individual', 'team'],
      required: true,
      default: 'individual'
    },
    // Çoklu kriter puanlaması
    criteria: {
      projectDiscovery: {
        type: Number,
        min: 1,
        max: 10,
        description: 'Projeyi nasıl buldunuz?'
      },
      projectContribution: {
        type: Number,
        min: 1,
        max: 10,
        description: 'Kullanıcının proje katkısı nedir?'
      },
      technicalSkills: {
        type: Number,
        min: 1,
        max: 10,
        description: 'Teknik beceriler'
      },
      creativity: {
        type: Number,
        min: 1,
        max: 10,
        description: 'Yaratıcılık'
      },
      teamwork: {
        type: Number,
        min: 1,
        max: 10,
        description: 'Takım çalışması'
      },
      communication: {
        type: Number,
        min: 1,
        max: 10,
        description: 'İletişim becerileri'
      }
    },
    // Genel puan (tüm kriterlerin ortalaması)
    overallScore: {
      type: Number,
      min: 0,
      max: 100
    },
    comment: {
      type: String,
      maxlength: [1000, 'Yorum en fazla 1000 karakter olabilir']
    },
    evaluationDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending'
    }
  }],

  // Genel değerlendirme (tüm juri'lerin ortalaması)
  finalEvaluation: {
    averageScore: {
      type: Number,
      min: 0,
      max: 100
    },
    totalEvaluations: {
      type: Number,
      default: 0
    },
    evaluatedAt: Date,
    finalDecision: {
      type: String,
      enum: ['approved', 'rejected', 'pending'],
      default: 'pending'
    },
    finalComment: {
      type: String,
      maxlength: [2000, 'Final yorum en fazla 2000 karakter olabilir']
    }
  },

  // Sistem bilgileri
  applicationNumber: {
    type: String
  },

  // Metadata
  ipAddress: String,
  userAgent: String,
  submittedAt: {
    type: Date,
    default: Date.now
  },

  // İptal/çekilme durumunda
  withdrawnAt: Date,
  withdrawnReason: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
applicationSchema.virtual('fullName').get(function() {
  return `${this.personalInfo.firstName} ${this.personalInfo.lastName}`;
});

// Virtual for display status
applicationSchema.virtual('displayStatus').get(function() {
  const statusMap = {
    'pending': 'Bekliyor',
    'under_review': 'İnceleniyor',
    'approved': 'Onaylandı',
    'rejected': 'Reddedildi',
    'withdrawn': 'İptal Edildi'
  };
  return statusMap[this.status] || this.status;
});

// Virtual for participant type display
applicationSchema.virtual('displayParticipantType').get(function() {
  const typeMap = {
    'student': 'Öğrenci',
    'entrepreneur': 'Girişimci',
    'employee': 'Çalışan',
    'recent_graduate': 'Yeni Mezun',
    'other': 'Diğer'
  };
  return typeMap[this.profileInfo.participantType] || this.profileInfo.participantType;
});

// Pre-save middleware - application number oluştur
applicationSchema.pre('save', async function(next) {
  if (this.isNew && !this.applicationNumber) {
    // Benzersiz application number oluştur (EMK + timestamp + random)
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.applicationNumber = `EMK${timestamp}${random}`;
  }
  next();
});

// Index'ler
applicationSchema.index({ ideathonId: 1, userId: 1 });
applicationSchema.index({ ideathonId: 1, status: 1 });
applicationSchema.index({ ideathonId: 1, 'personalInfo.email': 1 });
applicationSchema.index({ ideathonId: 1, 'personalInfo.tcIdentity': 1 });
applicationSchema.index({ ideathonId: 1, 'profileInfo.participantType': 1 });
applicationSchema.index({ ideathonId: 1, createdAt: -1 });
applicationSchema.index({ userId: 1 });
applicationSchema.index({ createdAt: -1 });

// Compound indexes
applicationSchema.index({ ideathonId: 1, userId: 1, status: 1 }); // User'ın başvuruları
applicationSchema.index(
  { ideathonId: 1, userId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['pending', 'under_review', 'approved', 'rejected'] }
    }
  }
); // Aynı ideathon'a aynı user birden fazla aktif başvuru yapamaz (withdrawn hariç)

// Static methods
applicationSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        averageScore: { $avg: '$finalEvaluation.averageScore' }
      }
    }
  ]);

  const totalApplications = await this.countDocuments();

  return {
    total: totalApplications,
    byStatus: stats.reduce((acc, stat) => {
      acc[stat._id] = {
        count: stat.count,
        averageScore: stat.averageScore || 0
      };
      return acc;
    }, {}),
    byParticipantType: await this.aggregate([
      { $group: { _id: '$profileInfo.participantType', count: { $sum: 1 } } }
    ]),
    byInterestField: await this.aggregate([
      { $group: { _id: '$interestsInfo.observationField', count: { $sum: 1 } } }
    ])
  };
};

applicationSchema.statics.findByStatus = function(status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

applicationSchema.statics.findByParticipantType = function(participantType) {
  return this.find({ 'profileInfo.participantType': participantType }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Application', applicationSchema);
