const mongoose = require('mongoose');

const ideathonSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'İdeathon adı zorunludur'],
    trim: true,
    maxlength: [200, 'İdeathon adı en fazla 200 karakter olabilir']
  },
  slug: {
    type: String,
    required: [true, 'Slug zorunludur'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Slug sadece küçük harf, rakam ve tire içerebilir']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Açıklama en fazla 2000 karakter olabilir']
  },
  status: {
    type: String,
    enum: {
      values: ['draft', 'active', 'completed', 'archived'],
      message: 'Geçersiz durum. Geçerli durumlar: draft, active, completed, archived'
    },
    default: 'draft'
  },
  startDate: { type: Date },
  endDate: { type: Date },

  // Aşama yönetimi
  phases: {
    applicationStart: { type: Date },
    applicationEnd: { type: Date },
    evaluationStart: { type: Date },
    evaluationEnd: { type: Date },
    mentorshipStart: { type: Date },
    mentorshipEnd: { type: Date },
    finalStart: { type: Date },
    finalEnd: { type: Date }
  },

  // Açma/Kapama Kontrolleri
  registrationOpen: {
    type: Boolean,
    default: true
  },
  applicationOpen: {
    type: Boolean,
    default: true
  },
  individualApplicationOpen: {
    type: Boolean,
    default: true
  },
  teamCreationOpen: {
    type: Boolean,
    default: true
  },
  presentationUploadOpen: {
    type: Boolean,
    default: true
  },
  applicationEditOpen: {
    type: Boolean,
    default: true
  },

  // Yapılandırma
  settings: {
    maxTeamSize: { type: Number, default: 5 },
    maxApplications: { type: Number, default: 0 }, // 0 = sınırsız
    allowPublicRegistration: { type: Boolean, default: true },
    requireTeam: { type: Boolean, default: false }
  },

  // İdeathon tipi: standard (tam akış) veya evaluation_only (sadece değerlendirme — DemoDay vb.)
  type: {
    type: String,
    enum: {
      values: ['standard', 'evaluation_only'],
      message: 'Geçersiz tip. Geçerli tipler: standard, evaluation_only'
    },
    default: 'standard'
  },

  // Dinamik değerlendirme kriterleri (ideathon bazında tanımlanır)
  evaluationCriteria: [{
    key: {
      type: String,
      required: [true, 'Kriter anahtarı zorunludur'],
      trim: true
    },
    name: {
      type: String,
      required: [true, 'Kriter adı zorunludur'],
      trim: true,
      maxlength: [200, 'Kriter adı en fazla 200 karakter olabilir']
    },
    maxScore: {
      type: Number,
      required: [true, 'Maksimum puan zorunludur'],
      min: [1, 'Maksimum puan en az 1 olmalıdır']
    },
    order: {
      type: Number,
      default: 0
    },
    evaluationPoints: [{
      type: String,
      trim: true,
      maxlength: [500, 'Değerlendirme maddesi en fazla 500 karakter olabilir']
    }]
  }],

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index'ler (slug unique zaten schema'da tanımlı)
ideathonSchema.index({ status: 1 });
ideathonSchema.index({ isDefault: 1 });

// Virtual: Aktif mi?
ideathonSchema.virtual('isActive').get(function () {
  return this.status === 'active';
});

// Virtual: Toplam maksimum puan (evaluationCriteria'dan hesaplanır)
ideathonSchema.virtual('maxTotalScore').get(function () {
  if (!this.evaluationCriteria || this.evaluationCriteria.length === 0) return 0;
  return this.evaluationCriteria.reduce((sum, c) => sum + (c.maxScore || 0), 0);
});

module.exports = mongoose.model('Ideathon', ideathonSchema);

