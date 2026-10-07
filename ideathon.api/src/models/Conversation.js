const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
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

  // Konuşma katılımcıları (mentor + participant)
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],

  // Konuşma türü
  type: {
    type: String,
    enum: {
      values: ['mentor_participant', 'group'],
      message: 'Tip: mentor_participant veya group olmalıdır'
    },
    default: 'mentor_participant',
    description: 'mentor_participant: 1-1 konuşma, group: grup konuşması'
  },

  // Konuşma başlığı (opsiyonel, genelde otomatik oluşur)
  title: {
    type: String,
    trim: true,
    maxlength: [200, 'Başlık en fazla 200 karakter olabilir']
  },

  // İlişkili toplantı (eğer bir toplantıdan başlatıldıysa)
  relatedMeetingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MentorMeeting',
    description: 'Bu konuşma bir toplantıdan mı başladı?'
  },

  // Son mesaj bilgileri (performans için cache)
  lastMessage: {
    text: {
      type: String,
      trim: true,
      maxlength: [500, 'Son mesaj önizlemesi en fazla 500 karakter olabilir']
    },
    senderUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sentAt: {
      type: Date
    }
  },

  // Son mesaj zamanı (sıralama için)
  lastMessageAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  // Konuşma aktif mi?
  isActive: {
    type: Boolean,
    default: true
  },

  // Arşivleme (kullanıcı bazlı)
  archivedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    description: 'Hangi kullanıcılar arşivledi'
  }],

  // Konuşmayı kim başlattı
  startedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Başlatan kullanıcı ID zorunludur']
  },

  // Participants key for unique constraint (sorted participants joined)
  participantsKey: {
    type: String,
    description: 'Sıralı participants ID\'lerinin birleşimi (unique constraint için)'
  },

  // Toplam mesaj sayısı (cache)
  messageCount: {
    type: Number,
    default: 0,
    min: 0
  },

  // Okunmamış sayısı (her kullanıcı için)
  unreadCount: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    count: {
      type: Number,
      default: 0,
      min: 0
    }
  }],

  // Metadata
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
conversationSchema.index({ ideathonId: 1, participants: 1, lastMessageAt: -1 });
conversationSchema.index({ ideathonId: 1, isActive: 1 });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ startedBy: 1 });

// Unique index - aynı ideathon'da aynı kişiler arası tek konuşma
conversationSchema.index(
  { ideathonId: 1, participantsKey: 1, type: 1 },
  { 
    unique: true,
    sparse: true,
    partialFilterExpression: { type: 'mentor_participant' }
  }
);

// Virtual for participant count
conversationSchema.virtual('participantCount').get(function() {
  return this.participants ? this.participants.length : 0;
});

// Virtual for is archived
conversationSchema.virtual('isArchived').get(function() {
  return this.archivedBy && this.archivedBy.length > 0;
});

// Pre-save: participantsKey'i otomatik oluştur
conversationSchema.pre('save', function(next) {
  if (this.type === 'mentor_participant' && this.participants && this.participants.length === 2) {
    // Participants'ları sırala ve birleştir
    const sorted = [...this.participants].sort((a, b) => 
      a.toString().localeCompare(b.toString())
    );
    this.participantsKey = sorted.join('_');
    console.log('📝 participantsKey oluşturuldu:', this.participantsKey);
  }
  next();
});

// Validation - en az 2 katılımcı olmalı
conversationSchema.pre('save', function(next) {
  if (!this.participants || this.participants.length < 2) {
    return next(new Error('Konuşmada en az 2 katılımcı olmalıdır'));
  }
  next();
});

// Validation - mentor_participant tipinde tam olarak 2 kişi olmalı
conversationSchema.pre('save', function(next) {
  if (this.type === 'mentor_participant' && this.participants.length !== 2) {
    return next(new Error('Mentor-participant konuşmasında tam olarak 2 katılımcı olmalıdır'));
  }
  next();
});

// Validation - participants içinde tekrar olmamalı
conversationSchema.pre('save', function(next) {
  const uniqueParticipants = [...new Set(this.participants.map(p => p.toString()))];
  if (uniqueParticipants.length !== this.participants.length) {
    return next(new Error('Katılımcılar listesinde tekrar olamaz'));
  }
  next();
});

// Static methods
conversationSchema.statics.findByUser = function(userId, filters = {}) {
  const query = {
    participants: userId,
    isActive: true
  };
  
  // Arşivlenmiş konuşmaları gösterme (eğer user arşivlemişse)
  if (!filters.includeArchived) {
    query.archivedBy = { $ne: userId };
  }
  
  if (filters.programId) {
    query.programId = filters.programId;
  }
  
  // Multi-Tenant: ideathonId varsa filtrele (mentor JWT'den gelir)
  if (filters.ideathonId) {
    query.ideathonId = filters.ideathonId;
  }
  
  return this.find(query)
    .populate('participants', 'name email role')
    .populate('lastMessage.senderUserId', 'name')
    .sort({ lastMessageAt: -1 });
};

conversationSchema.statics.findBetweenUsers = async function(user1Id, user2Id, programId = null, ideathonId = null) {
  const query = {
    type: 'mentor_participant',
    participants: { $all: [user1Id, user2Id], $size: 2 }
  };
  
  // programId kontrolü - null veya undefined ise ignore et
  // Sadece programId gerçekten varsa query'ye ekle
  if (programId !== null && programId !== undefined) {
    query.programId = programId;
  }
  
  // Multi-Tenant: ideathonId varsa filtrele
  if (ideathonId) {
    query.ideathonId = ideathonId;
  }
  
  console.log('🔍 findBetweenUsers query:', JSON.stringify(query));
  
  return this.findOne(query)
    .populate('participants', 'name email role');
};

conversationSchema.statics.createOrGet = async function(user1Id, user2Id, programId = null, startedBy = null, ideathonId = null) {
  console.log('🔄 createOrGet called');
  console.log('user1Id:', user1Id);
  console.log('user2Id:', user2Id);
  console.log('programId:', programId);
  console.log('ideathonId:', ideathonId);
  
  // Önce mevcut konuşma var mı kontrol et (ideathonId ile)
  let conversation = await this.findBetweenUsers(user1Id, user2Id, programId, ideathonId);
  let isNew = false;
  
  if (conversation) {
    console.log('✅ Mevcut konuşma bulundu:', conversation._id);
    conversation.isNew = false;
    return conversation;
  }
  
  console.log('🆕 Yeni konuşma oluşturuluyor...');
  
  // Yoksa yeni konuşma oluştur
  // Participants array'ini sırala (küçükten büyüğe) - unique index için
  const sortedParticipants = [user1Id, user2Id].sort((a, b) => 
    a.toString().localeCompare(b.toString())
  );
  
  const convData = {
    programId: programId || undefined, // null yerine undefined kullan
    participants: sortedParticipants,
    type: 'mentor_participant',
    startedBy: startedBy || user1Id,
    unreadCount: [
      { userId: user1Id, count: 0 },
      { userId: user2Id, count: 0 }
    ]
  };
  
  // Multi-Tenant: ideathonId varsa ekle
  if (ideathonId) {
    convData.ideathonId = ideathonId;
  }
  
  conversation = new this(convData);
  
  isNew = true;
  
  try {
    await conversation.save();
    console.log('✅ Yeni konuşma kaydedildi:', conversation._id);
  } catch (saveError) {
    console.error('❌ Konuşma kaydetme hatası:', saveError.message);
    
    // Duplicate key error ise tekrar dene (race condition)
    if (saveError.code === 11000) {
      console.log('⚠️ Duplicate key error - mevcut konuşmayı getirmeye çalışıyorum...');
      conversation = await this.findBetweenUsers(user1Id, user2Id, programId, ideathonId);
      
      if (conversation) {
        console.log('✅ Mevcut konuşma bulundu (retry):', conversation._id);
        conversation.isNew = false;
        return conversation;
      }
    }
    
    throw saveError;
  }
  
  // isNew flag'ini conversation objesine ekle (virtual field)
  conversation.isNew = isNew;
  
  return conversation;
};

// Instance methods
conversationSchema.methods.addMessage = async function(messageData) {
  console.log('📝 addMessage çağrıldı:', {
    conversationId: this._id,
    text: messageData.text?.substring(0, 30),
    senderId: messageData.senderUserId
  });
  
  // lastMessage ve lastMessageAt güncelle
  this.lastMessage = {
    text: messageData.text ? messageData.text.substring(0, 500) : '',
    senderUserId: messageData.senderUserId,
    sentAt: new Date()
  };
  this.lastMessageAt = new Date();
  this.messageCount += 1;
  
  console.log('✅ lastMessage set edildi:', {
    text: this.lastMessage.text.substring(0, 30),
    sentAt: this.lastMessage.sentAt
  });
  
  // Yeni mesaj geldiğinde alıcı için arşivden çıkar (mentor paneli için)
  // Gönderen arşivlemişse gönderen için arşivde kalır ama alıcı için arşivden çıkar
  this.participants.forEach(participantId => {
    if (participantId.toString() !== messageData.senderUserId.toString()) {
      // Alıcı bu konuşmayı arşivlemişse, otomatik olarak arşivden çıkar
      const archivedIndex = this.archivedBy.findIndex(
        id => id.toString() === participantId.toString()
      );
      if (archivedIndex > -1) {
        this.archivedBy.splice(archivedIndex, 1);
        console.log('📤 Konuşma arşivden çıkarıldı (yeni mesaj geldi):', participantId);
      }
    }
  });
  
  // Gönderen dışındaki tüm katılımcıların unread count'unu artır
  this.participants.forEach(participantId => {
    if (participantId.toString() !== messageData.senderUserId.toString()) {
      const unread = this.unreadCount.find(u => u.userId.toString() === participantId.toString());
      if (unread) {
        unread.count += 1;
      } else {
        this.unreadCount.push({ userId: participantId, count: 1 });
      }
    }
  });
  
  const result = await this.save();
  console.log('✅ Conversation kaydedildi! ID:', result._id);
  
  return result;
};

conversationSchema.methods.markAsRead = function(userId) {
  const unread = this.unreadCount.find(u => u.userId.toString() === userId.toString());
  if (unread) {
    unread.count = 0;
  }
  return this.save();
};

conversationSchema.methods.getUnreadCount = function(userId) {
  const unread = this.unreadCount.find(u => u.userId.toString() === userId.toString());
  return unread ? unread.count : 0;
};

conversationSchema.methods.archive = function(userId) {
  if (!this.archivedBy.includes(userId)) {
    this.archivedBy.push(userId);
  }
  return this.save();
};

conversationSchema.methods.unarchive = function(userId) {
  this.archivedBy = this.archivedBy.filter(id => id.toString() !== userId.toString());
  return this.save();
};

conversationSchema.methods.getOtherParticipant = function(userId) {
  if (this.type === 'mentor_participant') {
    return this.participants.find(p => p.toString() !== userId.toString());
  }
  return null;
};

module.exports = mongoose.model('Conversation', conversationSchema);
















