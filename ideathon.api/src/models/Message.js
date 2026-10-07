const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Konuşma referansı
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: [true, 'Konuşma ID zorunludur'],
    index: true
  },

  // Gönderen
  senderUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Gönderen kullanıcı ID zorunludur']
  },

  // Mesaj içeriği
  text: {
    type: String,
    required: [true, 'Mesaj içeriği zorunludur'],
    trim: true,
    minlength: [1, 'Mesaj en az 1 karakter olmalıdır'],
    maxlength: [5000, 'Mesaj en fazla 5000 karakter olabilir']
  },

  // Mesaj tipi
  messageType: {
    type: String,
    enum: {
      values: ['text', 'file', 'image', 'link', 'system'],
      message: 'Tip: text, file, image, link veya system olmalıdır'
    },
    default: 'text'
  },

  // Dosya ekleri (file, image için)
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
    url: {
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

  // Okundu bilgisi
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Reply/yanıt (bir mesaja yanıt ise)
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    description: 'Hangi mesaja yanıt'
  },

  // İlişkili toplantı (bir toplantıdan bahsediyorsa)
  relatedMeetingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MentorMeeting',
    description: 'Bir toplantıyla ilgili mi?'
  },

  // Mesaj durumu
  status: {
    type: String,
    enum: {
      values: ['sent', 'delivered', 'read', 'failed'],
      message: 'Durum: sent, delivered, read veya failed olmalıdır'
    },
    default: 'sent'
  },

  // Düzenleme bilgisi
  isEdited: {
    type: Boolean,
    default: false
  },

  editedAt: {
    type: Date
  },

  originalText: {
    type: String,
    trim: true,
    description: 'Düzenleme öncesi orijinal metin'
  },

  // Silindi mi?
  isDeleted: {
    type: Boolean,
    default: false
  },

  deletedAt: {
    type: Date
  },

  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // IP ve metadata
  ipAddress: {
    type: String,
    trim: true
  },

  metadata: {
    type: mongoose.Schema.Types.Mixed,
    description: 'Ek bilgiler için'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index'ler
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderUserId: 1, createdAt: -1 });
messageSchema.index({ conversationId: 1, status: 1 });
messageSchema.index({ 'readBy.userId': 1 });
messageSchema.index({ createdAt: -1 });

// Virtual for is read
messageSchema.virtual('isRead').get(function() {
  return this.status === 'read' || (this.readBy && this.readBy.length > 0);
});

// Virtual for attachment count
messageSchema.virtual('attachmentCount').get(function() {
  return this.attachments ? this.attachments.length : 0;
});

// Virtual for character count
messageSchema.virtual('characterCount').get(function() {
  return this.text ? this.text.length : 0;
});

// Virtual for formatted time
messageSchema.virtual('formattedTime').get(function() {
  if (!this.createdAt) return '';
  return this.createdAt.toLocaleTimeString('tr-TR', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'Europe/Istanbul'
  });
});

// Virtual for formatted date
messageSchema.virtual('formattedDate').get(function() {
  if (!this.createdAt) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const messageDate = new Date(this.createdAt);
  messageDate.setHours(0, 0, 0, 0);
  
  const diffTime = today - messageDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Bugün';
  if (diffDays === 1) return 'Dün';
  if (diffDays < 7) return this.createdAt.toLocaleDateString('tr-TR', { weekday: 'long', timeZone: 'Europe/Istanbul' });
  
  return this.createdAt.toLocaleDateString('tr-TR', { 
    day: 'numeric', 
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Istanbul'
  });
});

// Static methods
messageSchema.statics.findByConversation = function(conversationId, filters = {}) {
  const query = {
    conversationId,
    isDeleted: false
  };
  
  if (filters.beforeDate) {
    query.createdAt = { $lt: new Date(filters.beforeDate) };
  }
  
  if (filters.afterDate) {
    query.createdAt = { $gt: new Date(filters.afterDate) };
  }
  
  const limit = filters.limit || 50;
  
  return this.find(query)
    .populate('senderUserId', 'name email role')
    .populate('replyTo', 'text senderUserId')
    .sort({ createdAt: filters.ascending ? 1 : -1 })
    .limit(limit);
};

messageSchema.statics.findUnreadByUser = async function(userId, conversationId = null, ideathonId = null) {
  const query = {
    isDeleted: false,
    senderUserId: { $ne: userId },
    'readBy.userId': { $ne: userId }
  };
  
  if (conversationId) {
    query.conversationId = conversationId;
  } else {
    // Sadece kullanıcının katılımcı olduğu konuşmalardaki mesajları getir
    const Conversation = mongoose.model('Conversation');
    const convQuery = { participants: userId, isActive: true };
    
    // Multi-Tenant: ideathonId varsa sadece o ideathon'daki konuşmaları filtrele
    if (ideathonId) {
      convQuery.ideathonId = ideathonId;
    }
    
    const userConversations = await Conversation.find(convQuery, { _id: 1 }).lean();
    
    const conversationIds = userConversations.map(c => c._id);
    
    if (conversationIds.length === 0) {
      return [];
    }
    
    query.conversationId = { $in: conversationIds };
  }
  
  return this.find(query)
    .populate('conversationId')
    .populate('senderUserId', 'name email')
    .sort({ createdAt: -1 });
};

messageSchema.statics.getUnreadCount = async function(userId, conversationId = null, ideathonId = null) {
  const query = {
    isDeleted: false,
    senderUserId: { $ne: userId },
    'readBy.userId': { $ne: userId }
  };
  
  if (conversationId) {
    query.conversationId = conversationId;
  } else {
    // Sadece kullanıcının katılımcı olduğu konuşmalardaki okunmamış mesajları say
    const Conversation = mongoose.model('Conversation');
    const convQuery = { participants: userId, isActive: true };
    
    // Multi-Tenant: ideathonId varsa sadece o ideathon'daki konuşmaları filtrele
    if (ideathonId) {
      convQuery.ideathonId = ideathonId;
    }
    
    const userConversations = await Conversation.find(convQuery, { _id: 1 }).lean();
    
    const conversationIds = userConversations.map(c => c._id);
    
    if (conversationIds.length === 0) {
      return 0;
    }
    
    query.conversationId = { $in: conversationIds };
  }
  
  return this.countDocuments(query);
};

messageSchema.statics.markAsReadBulk = async function(conversationId, userId) {
  const result = await this.updateMany(
    {
      conversationId,
      senderUserId: { $ne: userId },
      'readBy.userId': { $ne: userId },
      isDeleted: false
    },
    {
      $push: {
        readBy: {
          userId,
          readAt: new Date()
        }
      },
      $set: {
        status: 'read'
      }
    }
  );
  
  // Conversation'ın unread count'unu da güncelle
  const Conversation = mongoose.model('Conversation');
  const conversation = await Conversation.findById(conversationId);
  if (conversation) {
    await conversation.markAsRead(userId);
  }
  
  return result;
};

// Instance methods
messageSchema.methods.markAsRead = function(userId) {
  // Zaten okunmuş mu kontrol et
  const alreadyRead = this.readBy.some(r => r.userId.toString() === userId.toString());
  
  if (!alreadyRead) {
    this.readBy.push({
      userId,
      readAt: new Date()
    });
    this.status = 'read';
  }
  
  return this.save();
};

messageSchema.methods.isReadBy = function(userId) {
  return this.readBy.some(r => r.userId.toString() === userId.toString());
};

messageSchema.methods.canEdit = function(userId, timeLimit = 15) {
  // Sadece gönderen düzenleyebilir
  if (this.senderUserId.toString() !== userId.toString()) {
    return false;
  }
  
  // Silindiyse düzenlenemez
  if (this.isDeleted) {
    return false;
  }
  
  // Zaman sınırı kontrolü (örn: 15 dakika içinde)
  const now = new Date();
  const messageTime = new Date(this.createdAt);
  const diffMinutes = Math.floor((now - messageTime) / (1000 * 60));
  
  return diffMinutes <= timeLimit;
};

messageSchema.methods.editMessage = function(newText, userId) {
  if (!this.canEdit(userId)) {
    throw new Error('Bu mesaj düzenlenemez');
  }
  
  this.originalText = this.text;
  this.text = newText;
  this.isEdited = true;
  this.editedAt = new Date();
  
  return this.save();
};

messageSchema.methods.softDelete = function(userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  
  return this.save();
};

// Post-save hook - Conversation'ı güncelle
messageSchema.post('save', async function() {
  if (!this.isDeleted && this.isNew) {
    try {
      console.log('📨 Post-save hook: Mesaj kaydedildi, conversation güncelleniyor...');
      console.log('   Message ID:', this._id);
      console.log('   Conversation ID:', this.conversationId);
      console.log('   Text:', this.text.substring(0, 50));
      
      const Conversation = mongoose.model('Conversation');
      const conversation = await Conversation.findById(this.conversationId);
      
      if (!conversation) {
        console.error('⚠️ Conversation bulunamadı:', this.conversationId);
        return;
      }
      
      console.log('✅ Conversation bulundu, addMessage çağrılıyor...');
      await conversation.addMessage({
        text: this.text,
        senderUserId: this.senderUserId
      });
      
      console.log('✅ Conversation güncellendi! lastMessage:', {
        text: conversation.lastMessage?.text?.substring(0, 30),
        sentAt: conversation.lastMessage?.sentAt
      });
    } catch (error) {
      console.error('❌ Conversation güncelleme hatası:', error);
    }
  }
});

module.exports = mongoose.model('Message', messageSchema);


















