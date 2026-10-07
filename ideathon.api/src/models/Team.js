const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  // İdeathon referansı (Multi-Tenant)
  ideathonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ideathon',
    required: [true, 'İdeathon ID zorunludur'],
    index: true
  },

  // Takım bilgileri
  teamName: {
    type: String,
    required: [true, 'Takım adı zorunludur'],
    trim: true,
    minlength: [2, 'Takım adı en az 2 karakter olmalıdır'],
    maxlength: [100, 'Takım adı en fazla 100 karakter olabilir']
  },

  teamDescription: {
    type: String,
    trim: true,
    maxlength: [1000, 'Takım açıklaması en fazla 1000 karakter olabilir']
  },

  city: {
    type: String,
    trim: true,
    maxlength: [100, 'Şehir adı en fazla 100 karakter olabilir'],
    description: 'Takımın bulunduğu şehir'
  },

  // Takım üyeleri
  members: [{
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: false // Başvuru yapılmadan da takım oluşturulabilir
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    tcIdentity: {
      type: String,
      trim: true,
      match: [/^[0-9]{11}$/, 'TC Kimlik No 11 haneli sayı olmalıdır']
    },
    email: {
      type: String,
      trim: true
    },
    role: {
      type: String,
      trim: true,
      maxlength: [100, 'Rol en fazla 100 karakter olabilir']
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Takım istatistikleri
  teamStats: {
    memberCount: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    totalEvaluations: {
      type: Number,
      default: 0
    },
    ranking: {
      type: Number,
      default: 0
    }
  },


  // Takım juri değerlendirmeleri
  teamEvaluations: [{
    juriId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    juriName: {
      type: String,
      required: true
    },
    // Takım kriterleri
    criteria: {
      teamCohesion: {
        type: Number,
        min: 1,
        max: 10,
        description: 'Takım uyumu'
      },
      projectIdea: {
        type: Number,
        min: 1,
        max: 10,
        description: 'Proje fikri kalitesi'
      },
      innovation: {
        type: Number,
        min: 1,
        max: 10,
        description: 'Yenilikçilik'
      },
      feasibility: {
        type: Number,
        min: 1,
        max: 10,
        description: 'Uygulanabilirlik'
      },
      presentation: {
        type: Number,
        min: 1,
        max: 10,
        description: 'Sunum becerisi'
      },
      potential: {
        type: Number,
        min: 1,
        max: 10,
        description: 'Gelişim potansiyeli'
      }
    },
    // Genel takım puanı
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

  // Takım final değerlendirmesi
  finalTeamEvaluation: {
    evaluatedAt: Date,
    finalDecision: {
      type: String,
      enum: ['qualified', 'not_qualified', 'pending'],
      default: 'pending'
    }
  },

  // Sistem bilgileri
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  creationMethod: {
    type: String,
    enum: ['manual', 'random'],
    required: true
  },

  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for team size
teamSchema.virtual('teamSize').get(function() {
  return this.members.length;
});

// Virtual for completion status
teamSchema.virtual('isComplete').get(function() {
  return this.members.length >= 2 && this.members.length <= 10;
});

// Index'ler
teamSchema.index({ ideathonId: 1, teamName: 1 }, { unique: true });
teamSchema.index({ ideathonId: 1, 'teamStats.averageScore': -1 });
teamSchema.index({ ideathonId: 1, 'finalTeamEvaluation.ranking': 1 });
teamSchema.index({ ideathonId: 1, isActive: 1 });
teamSchema.index({ createdBy: 1 });

// Pre-save middleware
teamSchema.pre('save', function(next) {
  // Takım istatistiklerini güncelle
  this.teamStats.memberCount = this.members.length;

  // Takım değerlendirme ortalamasını hesapla
  if (this.teamEvaluations.length > 0) {
    const completedEvaluations = this.teamEvaluations.filter(
      evaluation => evaluation.status === 'completed'
    );

    if (completedEvaluations.length > 0) {
      const totalScore = completedEvaluations.reduce(
        (sum, evaluation) => sum + evaluation.overallScore, 0
      );
      this.teamStats.averageScore = Math.round(totalScore / completedEvaluations.length);
      this.teamStats.totalEvaluations = completedEvaluations.length;

      // Final evaluation'ı güncelle
      this.finalTeamEvaluation.evaluatedAt = new Date();
    }
  }

  next();
});

// Static methods
teamSchema.statics.createRandomTeams = async function(participants, teamSize = 4, createdBy) {
  const teams = [];
  const shuffled = [...participants].sort(() => Math.random() - 0.5);

  for (let i = 0; i < shuffled.length; i += teamSize) {
    const teamMembers = shuffled.slice(i, i + teamSize);

    if (teamMembers.length >= 2) { // Minimum 2 kişi
      const team = new this({
        teamName: `Takım ${teams.length + 1}`,
        teamDescription: `Otomatik oluşturulan takım ${teams.length + 1}`,
        members: teamMembers.map(member => ({
          applicationId: member._id,
          name: `${member.personalInfo.firstName} ${member.personalInfo.lastName}`,
          email: member.personalInfo.email,
          role: 'Üye'
        })),
        createdBy,
        creationMethod: 'random'
      });

      teams.push(team);
    }
  }

  return teams;
};

teamSchema.statics.getTopTeams = function(limit = 10) {
  return this.find({
    isActive: true,
    'finalTeamEvaluation.finalDecision': 'qualified'
  })
  .sort({ 'finalTeamEvaluation.averageScore': -1 })
  .limit(limit);
};

teamSchema.statics.getTeamsByRanking = function() {
  return this.find({
    isActive: true,
    'finalTeamEvaluation.finalDecision': 'qualified'
  })
  .sort({ 'finalTeamEvaluation.ranking': 1 });
};

module.exports = mongoose.model('Team', teamSchema);



