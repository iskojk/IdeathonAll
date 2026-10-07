const mongoose = require('mongoose');

const meetingNoteSchema = new mongoose.Schema({
  // Toplantı referansı
  meetingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MentorMeeting',
    required: [true, 'Toplantı ID zorunludur']
  },

  // Notu yazan (mentor veya participant)
  authorUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Yazar kullanıcı ID zorunludur']
  },

  // Not türü
  noteType: {
    type: String,
    enum: {
      values: ['general', 'action_item', 'summary', 'follow_up'],
      message: 'Not türü: general, action_item, summary veya follow_up olmalıdır'
    },
    default: 'general',
    description: 'Not tipi: genel, aksiyon maddesi, özet, takip'
  },

  // Not içeriği
  note: {
    type: String,
    required: [true, 'Not içeriği zorunludur'],
    trim: true,
    minlength: [1, 'Not en az 1 karakter olmalıdır'],
    maxlength: [5000, 'Not en fazla 5000 karakter olabilir']
  },

  // Not başlığı (opsiyonel)
  title: {
    type: String,
    trim: true,
    maxlength: [200, 'Başlık en fazla 200 karakter olabilir']
  },

  // Public mi? (tüm katılımcılar görebilir mi?)
  isPublic: {
    type: Boolean,
    default: false,
    description: 'true: herkes görebilir, false: sadece yazar görebilir'
  },

  // Paylaşılanlar (public değilse, kimlerle paylaşılıyor)
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    description: 'Bu not hangi kullanıcılarla paylaşıldı'
  }],

  // Aksiyon maddesi ise
  actionItem: {
    isCompleted: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date
    },
    dueDate: {
      type: Date,
      description: 'Son tarih'
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      description: 'Kim sorumlu'
    }
  },

  // Etiketler (arama/filtreleme için)
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Etiket en fazla 50 karakter olabilir']
  }],

  // Ekler (dosya yolları)
  attachments: [{
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
      type: Date,
      default: Date.now
    }
  }],

  // Pin - önemli notlar üstte
  isPinned: {
    type: Boolean,
    default: false
  },

  // Admin tarafından görünürlük kontrolü
  isVisible: {
    type: Boolean,
    default: true
  },

  // Son düzenleme
  lastEditedAt: {
    type: Date
  },

  lastEditedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index'ler
meetingNoteSchema.index({ meetingId: 1, createdAt: -1 });
meetingNoteSchema.index({ authorUserId: 1, createdAt: -1 });
meetingNoteSchema.index({ meetingId: 1, isPinned: -1, createdAt: -1 });
meetingNoteSchema.index({ noteType: 1 });
meetingNoteSchema.index({ 'actionItem.isCompleted': 1, 'actionItem.dueDate': 1 });
meetingNoteSchema.index({ tags: 1 });

// Text search
meetingNoteSchema.index({
  title: 'text',
  note: 'text',
  tags: 'text'
});

// Virtual for is editable
meetingNoteSchema.virtual('isEdited').get(function() {
  return !!this.lastEditedAt;
});

// Virtual for character count
meetingNoteSchema.virtual('characterCount').get(function() {
  return this.note ? this.note.length : 0;
});

// Static methods
meetingNoteSchema.statics.findByMeeting = function(meetingId, userId = null) {
  const query = { 
    meetingId,
    isVisible: true
  };
  
  // Eğer userId verilmişse, kullanıcının görebileceği notları filtrele
  if (userId) {
    query.$or = [
      { isPublic: true },
      { authorUserId: userId },
      { sharedWith: userId }
    ];
  } else {
    // userId yoksa sadece public olanları göster
    query.isPublic = true;
  }
  
  return this.find(query)
    .populate('authorUserId', 'name email')
    .populate('actionItem.assignedTo', 'name email')
    .sort({ isPinned: -1, createdAt: -1 });
};

meetingNoteSchema.statics.findByAuthor = function(authorUserId) {
  return this.find({ authorUserId, isVisible: true })
    .populate('meetingId')
    .sort({ createdAt: -1 });
};

meetingNoteSchema.statics.findActionItems = function(filters = {}) {
  const query = {
    noteType: 'action_item',
    isVisible: true
  };
  
  if (filters.assignedTo) {
    query['actionItem.assignedTo'] = filters.assignedTo;
  }
  
  if (filters.isCompleted !== undefined) {
    query['actionItem.isCompleted'] = filters.isCompleted;
  }
  
  if (filters.overdue) {
    query['actionItem.dueDate'] = { $lt: new Date() };
    query['actionItem.isCompleted'] = false;
  }
  
  return this.find(query)
    .populate('authorUserId', 'name email')
    .populate('meetingId')
    .populate('actionItem.assignedTo', 'name email')
    .sort({ 'actionItem.dueDate': 1 });
};

// Instance methods
meetingNoteSchema.methods.canEdit = function(userId) {
  return this.authorUserId.toString() === userId.toString();
};

meetingNoteSchema.methods.canView = function(userId) {
  if (this.isPublic) return true;
  if (this.authorUserId.toString() === userId.toString()) return true;
  if (this.sharedWith && this.sharedWith.some(id => id.toString() === userId.toString())) return true;
  return false;
};

meetingNoteSchema.methods.shareWith = function(userIds) {
  if (!Array.isArray(userIds)) {
    userIds = [userIds];
  }
  
  userIds.forEach(userId => {
    if (!this.sharedWith.includes(userId)) {
      this.sharedWith.push(userId);
    }
  });
  
  return this.save();
};

// Middleware - son düzenleme zamanını güncelle
meetingNoteSchema.pre('save', function(next) {
  if (this.isModified('note') && !this.isNew) {
    this.lastEditedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('MeetingNote', meetingNoteSchema);




















































