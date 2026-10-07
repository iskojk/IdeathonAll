const mongoose = require('mongoose');

const teamEvaluationSchema = new mongoose.Schema({
  // İdeathon referansı (Multi-Tenant)
  ideathonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ideathon',
    required: [true, 'İdeathon ID zorunludur'],
    index: true
  },

  // Takım referansı (kaynak doğrulama — yeni evaluation'larda zorunlu, legacy data'da null olabilir)
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },

  // Takım Bilgisi (snapshot — kaynak doğrulama teamId)
  teamName: {
    type: String,
    required: [true, 'Takım adı zorunludur'],
    trim: true,
    maxlength: [100, 'Takım adı en fazla 100 karakter olabilir']
  },

  // Juri Bilgisi
  juriId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Juri ID zorunludur']
  },
  juriName: {
    type: String,
    required: [true, 'Juri adı zorunludur'],
    trim: true
  },
  juriEmail: {
    type: String,
    required: [true, 'Juri e-posta zorunludur'],
    trim: true,
    lowercase: true
  },

  // Dinamik değerlendirme kriterleri (ideathon bazında yapı değişir)
  // Eski format: { problemDefinition: { score, comment }, ... }
  // Yeni format: { herhangi_key: { score, comment }, ... }
  criteria: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Değerlendirme kriterleri zorunludur']
  },

  // Toplam Puan (Otomatik hesaplanır — dinamik, max sabit değil)
  totalScore: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },

  // Genel Değerlendirme (İsteğe Bağlı)
  generalComment: {
    type: String,
    trim: true,
    maxlength: [2000, 'Genel yorum en fazla 2000 karakter olabilir']
  },

  // Değerlendirme Durumu
  status: {
    type: String,
    enum: {
      values: ['draft', 'submitted'],
      message: 'Geçersiz durum. Geçerli durumlar: draft, submitted'
    },
    default: 'submitted'
  },

  // Metadata
  evaluatedAt: {
    type: Date,
    default: Date.now
  },
  
  lastUpdatedAt: {
    type: Date
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Unique constraint: Bir juri aynı takımı aynı ideathon'da sadece bir kez değerlendirebilir
// partialFilterExpression: sadece ideathonId ve teamId OLAN dökümanlara uygulanır (legacy data korunur)
teamEvaluationSchema.index(
  { ideathonId: 1, juriId: 1, teamId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      ideathonId: { $type: 'objectId' },
      teamId: { $type: 'objectId' }
    }
  }
);

// Index'ler
teamEvaluationSchema.index({ ideathonId: 1, teamId: 1 });
teamEvaluationSchema.index({ ideathonId: 1, juriId: 1 });
teamEvaluationSchema.index({ ideathonId: 1, totalScore: -1 });
teamEvaluationSchema.index({ createdAt: -1 });

// Pre-save middleware: Toplam puanı dinamik olarak hesapla
teamEvaluationSchema.pre('save', function(next) {
  if (this.criteria && typeof this.criteria === 'object') {
    let total = 0;
    for (const value of Object.values(this.criteria)) {
      if (value && typeof value.score === 'number') {
        total += value.score;
      }
    }
    this.totalScore = total;
  }

  if (!this.isNew) {
    this.lastUpdatedAt = new Date();
  }

  next();
});

// Virtual: Yüzdelik dilim (artık ideathon'dan maxTotalScore alınmalı, fallback 100)
teamEvaluationSchema.virtual('scorePercentage').get(function() {
  return this.totalScore.toFixed(2);
});

// Static method: Takım için tüm değerlendirmeleri getir (ideathon filtreli)
teamEvaluationSchema.statics.getTeamEvaluations = async function(teamId, ideathonId = null) {
  const query = { teamId };
  if (ideathonId) query.ideathonId = ideathonId;
  return await this.find(query)
    .populate('juriId', 'name email')
    .populate('teamId', 'teamName')
    .sort({ totalScore: -1 });
};

// Static method: Takım için ortalama puanı hesapla (ideathon filtreli)
teamEvaluationSchema.statics.getTeamAverageScore = async function(teamId, ideathonId = null) {
  const match = { teamId: new mongoose.Types.ObjectId(teamId) };
  if (ideathonId) match.ideathonId = new mongoose.Types.ObjectId(ideathonId);

  const result = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$teamId',
        averageScore: { $avg: '$totalScore' },
        evaluationCount: { $sum: 1 },
        maxScore: { $max: '$totalScore' },
        minScore: { $min: '$totalScore' }
      }
    }
  ]);

  return result.length > 0 ? result[0] : null;
};

// Static method: Juri'nin değerlendirme istatistikleri (ideathon filtreli)
teamEvaluationSchema.statics.getJuriStats = async function(juriId, ideathonId = null) {
  const match = { juriId: new mongoose.Types.ObjectId(juriId) };
  if (ideathonId) match.ideathonId = new mongoose.Types.ObjectId(ideathonId);

  const result = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$juriId',
        totalEvaluations: { $sum: 1 },
        averageScore: { $avg: '$totalScore' },
        maxScore: { $max: '$totalScore' },
        minScore: { $min: '$totalScore' }
      }
    }
  ]);

  return result.length > 0 ? result[0] : {
    totalEvaluations: 0,
    averageScore: 0,
    maxScore: 0,
    minScore: 0
  };
};

// Static method: Tüm takımların sıralaması (ideathon filtreli)
// teamName her zaman mevcut olduğu için teamName üzerinden grupla (teamId null olabilir)
teamEvaluationSchema.statics.getTeamRankings = async function(ideathonId = null) {
  const pipeline = [];
  if (ideathonId) {
    pipeline.push({ $match: { ideathonId: new mongoose.Types.ObjectId(ideathonId) } });
  }
  pipeline.push(
    {
      // teamName üzerinden grupla (her zaman mevcut, teamId null olabilir)
      $group: {
        _id: '$teamName',
        teamId: { $first: '$teamId' },
        averageScore: { $avg: '$totalScore' },
        evaluationCount: { $sum: 1 },
        maxScore: { $max: '$totalScore' },
        minScore: { $min: '$totalScore' },
        // Her jürinin detaylı değerlendirmesi
        evaluations: {
          $push: {
            evaluationId: '$_id',
            juriId: '$juriId',
            juriName: '$juriName',
            juriEmail: '$juriEmail',
            totalScore: '$totalScore',
            criteria: '$criteria',
            generalComment: '$generalComment',
            evaluatedAt: '$evaluatedAt',
            status: '$status'
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        teamName: '$_id',
        teamId: 1,
        averageScore: { $round: ['$averageScore', 2] },
        evaluationCount: 1,
        maxScore: 1,
        minScore: 1,
        evaluations: 1
      }
    },
    { $sort: { averageScore: -1 } }
  );
  return await this.aggregate(pipeline);
};

module.exports = mongoose.model('TeamEvaluation', teamEvaluationSchema);

