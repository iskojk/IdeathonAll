const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Application = require('../models/Application');
const Team = require('../models/Team');
const emailService = require('../services/emailService');
const socketService = require('../services/socketService');

// ==================== HELPER FUNCTIONS ====================

/**
 * Add teamName to users from Team model or Application model
 * @param {Array} users - Array of user objects or IDs
 * @returns {Promise<Array>} Users with teamName added
 */
const addTeamNameToUsers = async (users) => {
  if (!users || users.length === 0) return [];
  
  // Extract user IDs
  const userIds = users.map(u => (u._id || u).toString()).filter(Boolean);
  
  if (userIds.length === 0) return users;
  
  // 1. Önce Team modelinden kontrol et (YENİ SİSTEM)
  const teams = await Team.find({ 
    createdBy: { $in: userIds },
    isActive: true
  }).select('createdBy teamName').lean();
  
  const teamMap = new Map();
  teams.forEach(team => {
    if (team.teamName) {
      teamMap.set(team.createdBy.toString(), team.teamName);
    }
  });
  
  // 2. Team modelinde olmayan kullanıcılar için Application modelinden bak (ESKİ SİSTEM)
  const usersWithoutTeam = userIds.filter(userId => !teamMap.has(userId));
  
  if (usersWithoutTeam.length > 0) {
    const applications = await Application.find({ 
      userId: { $in: usersWithoutTeam }, 
      status: 'approved',
      'teamInfo.isInTeam': true
    }).select('userId teamInfo.teamName').lean();
    
    applications.forEach(app => {
      if (app.teamInfo?.teamName) {
        teamMap.set(app.userId.toString(), app.teamInfo.teamName);
      }
    });
  }
  
  // Add teamName to each user
  return users.map(user => {
    const userObj = user.toObject ? user.toObject() : { ...user };
    const userId = (user._id || user).toString();
    userObj.teamName = teamMap.get(userId) || null;
    return userObj;
  });
};

/**
 * Add teamName to participants in conversations from Team or Application model
 * @param {Array} conversations - Array of conversation objects
 * @returns {Promise<Array>} Conversations with teamName added to participants
 */
const addTeamNameToConversations = async (conversations) => {
  if (!conversations || conversations.length === 0) return [];
  
  // Collect all unique participant IDs
  const allParticipantIds = new Set();
  conversations.forEach(conv => {
    const convObj = conv.toObject ? conv.toObject() : conv;
    if (convObj.participants) {
      convObj.participants.forEach(p => {
        const userId = (p._id || p).toString();
        allParticipantIds.add(userId);
      });
    }
  });
  
  const userIdsArray = Array.from(allParticipantIds);
  
  // 1. Önce Team modelinden kontrol et (YENİ SİSTEM)
  const teams = await Team.find({ 
    createdBy: { $in: userIdsArray },
    isActive: true
  }).select('createdBy teamName').lean();
  
  const teamMap = new Map();
  teams.forEach(team => {
    if (team.teamName) {
      teamMap.set(team.createdBy.toString(), team.teamName);
    }
  });
  
  // 2. Team modelinde olmayan kullanıcılar için Application modelinden bak (ESKİ SİSTEM)
  const usersWithoutTeam = userIdsArray.filter(userId => !teamMap.has(userId));
  
  if (usersWithoutTeam.length > 0) {
    const applications = await Application.find({ 
      userId: { $in: usersWithoutTeam }, 
      status: 'approved',
      'teamInfo.isInTeam': true
    }).select('userId teamInfo.teamName').lean();
    
    applications.forEach(app => {
      if (app.teamInfo?.teamName) {
        teamMap.set(app.userId.toString(), app.teamInfo.teamName);
      }
    });
  }
  
  // Add teamName to each conversation's participants
  return conversations.map(conv => {
    const convObj = conv.toObject ? conv.toObject() : { ...conv };
    
    if (convObj.participants) {
      convObj.participants = convObj.participants.map(participant => {
        const pObj = participant.toObject ? participant.toObject() : { ...participant };
        const userId = (participant._id || participant).toString();
        pObj.teamName = teamMap.get(userId) || null;
        return pObj;
      });
    }
    
    return convObj;
  });
};

// ==================== CONVERSATIONS ====================

// @desc    Kullanıcının konuşmalarını listele
// @route   GET /api/mentornet/messages/conversations
// @access  Authenticated User
exports.getConversations = async (req, res) => {
  try {
    console.log('📋 getConversations - User:', req.user._id);
    
    const { includeArchived, programId } = req.query;
    
    // Multi-Tenant: ideathonId çözümle
    // ÖNCELİK SIRASI:
    // 1. ?event=slug (URL'den gelen — EN YÜKSEK ÖNCELİK)
    // 2. ?ideathonId=xxx (query param)
    // 3. req.ideathonId (JWT'den authenticate middleware set eder)
    // 4. User modelindeki ideathonId (user rolü fallback)
    let resolvedIdeathonId = null;

    // 1. Slug'dan çözümle (?event=slug) — EN YÜKSEK ÖNCELİK
    if (req.query.event) {
      const Ideathon = require('../models/Ideathon');
      const ideathon = await Ideathon.findOne({ slug: req.query.event, status: 'active' })
        .select('_id').lean();
      if (ideathon) resolvedIdeathonId = ideathon._id;
    }

    // 2. Query param ideathonId
    if (!resolvedIdeathonId && req.query.ideathonId) {
      resolvedIdeathonId = req.query.ideathonId;
    }

    // 3. JWT'den gelen ideathonId
    if (!resolvedIdeathonId && req.ideathonId) {
      resolvedIdeathonId = req.ideathonId;
    }

    // 4. User modelinden fallback
    if (!resolvedIdeathonId && req.user.role === 'user' && req.user.ideathonId) {
      resolvedIdeathonId = req.user.ideathonId;
    }

    const filters = {
      includeArchived: includeArchived === 'true',
      programId,
      ideathonId: resolvedIdeathonId || undefined
    };
    
    const conversations = await Conversation.findByUser(req.user._id, filters);
    
    console.log(`✅ ${conversations.length} konuşma bulundu`);
    
    // Her konuşma için unread count ekle ve lastMessage kontrol et
    const conversationsWithUnread = conversations.map(conv => {
      const convObj = conv.toObject();
      convObj.unreadCount = conv.getUnreadCount(req.user._id);
      
      // LastMessage debug
      if (!convObj.lastMessage || !convObj.lastMessage.text) {
        console.log('⚠️ No lastMessage for conversation:', convObj._id);
      } else {
        console.log('✅ Conversation', convObj._id.toString().substring(0, 8), 'lastMessage:', convObj.lastMessage.text.substring(0, 30));
      }
      
      return convObj;
    });
    
    // Add teamName to participants
    const conversationsWithTeams = await addTeamNameToConversations(conversationsWithUnread);
    
    res.json({
      success: true,
      count: conversationsWithTeams.length,
      data: conversationsWithTeams
    });
  } catch (error) {
    console.error('❌ getConversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Konuşmalar getirilirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Konuşma detayı getir
// @route   GET /api/mentornet/messages/conversations/:id
// @access  Conversation participant
exports.getConversationById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const conversation = await Conversation.findById(id)
      .populate('participants', 'name email role')
      .populate('lastMessage.senderUserId', 'name');
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Konuşma bulunamadı'
      });
    }
    
    // Yetkilendirme - sadece katılımcılar görebilir
    const isParticipant = conversation.participants.some(
      p => p._id.toString() === req.user._id.toString()
    );
    
    if (!isParticipant && !['superadmin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Bu konuşmayı görüntüleme yetkiniz yok'
      });
    }
    
    const convObj = conversation.toObject();
    convObj.unreadCount = conversation.getUnreadCount(req.user._id);
    
    // Add teamName to participants
    const [convWithTeams] = await addTeamNameToConversations([convObj]);
    
    res.json({
      success: true,
      data: convWithTeams
    });
  } catch (error) {
    console.error('getConversationById error:', error);
    res.status(500).json({
      success: false,
      message: 'Konuşma getirilirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Yeni konuşma başlat veya mevcut konuşmayı getir
// @route   POST /api/mentornet/messages/conversations
// @access  Authenticated User
exports.createOrGetConversation = async (req, res) => {
  try {
    console.log('🆕 Create or get conversation');
    console.log('Requester:', req.user._id, req.user.role);
    console.log('Participant ID:', req.body.participantUserId);
    
    const { participantUserId, programId } = req.body;
    
    if (!participantUserId) {
      return res.status(400).json({
        success: false,
        message: 'Katılımcı kullanıcı ID zorunludur'
      });
    }
    
    // Kendisiyle konuşma başlatamasın
    if (participantUserId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Kendinizle konuşma başlatamazsınız'
      });
    }
    
    // Kullanıcı mevcut mu kontrol et
    const otherUser = await User.findById(participantUserId);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }
    
    // Multi-Tenant: ideathonId çözümle
    // ÖNCELİK: ?event=slug > req.ideathonId (JWT) > user.ideathonId
    let convIdeathonId = null;
    if (req.query.event) {
      const Ideathon = require('../models/Ideathon');
      const ideathon = await Ideathon.findOne({ slug: req.query.event, status: 'active' })
        .select('_id').lean();
      if (ideathon) convIdeathonId = ideathon._id;
    }
    if (!convIdeathonId && req.ideathonId) {
      convIdeathonId = req.ideathonId;
    }
    if (!convIdeathonId && req.user.role === 'user' && req.user.ideathonId) {
      convIdeathonId = req.user.ideathonId;
    }

    // Mevcut konuşma var mı veya yeni oluştur — Multi-Tenant: ideathonId eklendi
    const conversation = await Conversation.createOrGet(
      req.user._id,
      participantUserId,
      programId,
      req.user._id,
      convIdeathonId
    );
    
    const isNew = conversation.isNew || false;
    console.log(isNew ? '✅ Yeni konuşma oluşturuldu' : '✅ Mevcut konuşma bulundu');
    
    await conversation.populate('participants', 'name email role');
    
    const convObj = conversation.toObject();
    convObj.unreadCount = conversation.getUnreadCount(req.user._id);
    
    // Add teamName to participants
    const [convWithTeams] = await addTeamNameToConversations([convObj]);
    
    res.status(isNew ? 201 : 200).json({
      success: true,
      message: isNew ? 'Yeni konuşma oluşturuldu' : 'Mevcut konuşma bulundu',
      isNew: isNew,
      data: convWithTeams
    });
  } catch (error) {
    console.error('❌ createOrGetConversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Konuşma oluşturulurken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Konuşmayı arşivle
// @route   PATCH /api/mentornet/messages/conversations/:id/archive
// @access  Conversation participant
exports.archiveConversation = async (req, res) => {
  try {
    const { id } = req.params;
    
    const conversation = await Conversation.findById(id);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Konuşma bulunamadı'
      });
    }
    
    // Yetkilendirme
    const isParticipant = conversation.participants.some(
      p => p.toString() === req.user._id.toString()
    );
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Bu konuşmayı arşivleme yetkiniz yok'
      });
    }
    
    await conversation.archive(req.user._id);
    
    res.json({
      success: true,
      message: 'Konuşma arşivlendi'
    });
  } catch (error) {
    console.error('archiveConversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Konuşma arşivlenirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Konuşmayı arşivden çıkar
// @route   PATCH /api/mentornet/messages/conversations/:id/unarchive
// @access  Conversation participant
exports.unarchiveConversation = async (req, res) => {
  try {
    const { id } = req.params;
    
    const conversation = await Conversation.findById(id);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Konuşma bulunamadı'
      });
    }
    
    // Yetkilendirme
    const isParticipant = conversation.participants.some(
      p => p.toString() === req.user._id.toString()
    );
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Bu konuşmayı arşivden çıkarma yetkiniz yok'
      });
    }
    
    await conversation.unarchive(req.user._id);
    
    res.json({
      success: true,
      message: 'Konuşma arşivden çıkarıldı'
    });
  } catch (error) {
    console.error('unarchiveConversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Konuşma arşivden çıkarılırken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Arşivlenmiş konuşmaları getir (mentor paneli için)
// @route   GET /api/mentornet/messages/conversations/archived
// @access  Authenticated User
exports.getArchivedConversations = async (req, res) => {
  try {
    console.log('📦 getArchivedConversations - User:', req.user._id);
    
    const { programId } = req.query;
    
    // Sadece arşivlenmiş konuşmaları getir — Multi-Tenant: ideathonId filtresi
    const query = {
      participants: req.user._id,
      isActive: true,
      archivedBy: req.user._id
    };
    
    if (req.ideathonId) query.ideathonId = req.ideathonId;
    if (programId) {
      query.programId = programId;
    }
    
    const conversations = await Conversation.find(query)
      .populate('participants', 'name email role')
      .populate('lastMessage.senderUserId', 'name')
      .sort({ lastMessageAt: -1 });
    
    console.log(`✅ ${conversations.length} arşivlenmiş konuşma bulundu`);
    
    // Her konuşma için unread count ekle
    const conversationsWithUnread = conversations.map(conv => {
      const convObj = conv.toObject();
      convObj.unreadCount = conv.getUnreadCount(req.user._id);
      return convObj;
    });
    
    // Add teamName to participants
    const conversationsWithTeams = await addTeamNameToConversations(conversationsWithUnread);
    
    res.json({
      success: true,
      count: conversationsWithTeams.length,
      data: conversationsWithTeams
    });
  } catch (error) {
    console.error('❌ getArchivedConversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Arşivlenmiş konuşmalar getirilirken hata oluştu',
      error: error.message
    });
  }
};

// ==================== MESSAGES ====================

// @desc    Konuşmanın mesajlarını getir
// @route   GET /api/mentornet/messages/:conversationId
// @access  Conversation participant
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit, beforeDate, afterDate, ascending } = req.query;
    
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Konuşma bulunamadı'
      });
    }
    
    // Yetkilendirme
    const isParticipant = conversation.participants.some(
      p => p.toString() === req.user._id.toString()
    );
    
    if (!isParticipant && !['superadmin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Bu mesajları görüntüleme yetkiniz yok'
      });
    }
    
    const filters = {
      limit: parseInt(limit) || 50,
      beforeDate,
      afterDate,
      ascending: ascending === 'true'
    };
    
    const messages = await Message.findByConversation(conversationId, filters);
    
    res.json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    console.error('getMessages error:', error);
    res.status(500).json({
      success: false,
      message: 'Mesajlar getirilirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Mesaj gönder
// @route   POST /api/mentornet/messages/:conversationId
// @access  Conversation participant
exports.sendMessage = async (req, res) => {
  try {
    console.log('📨 sendMessage - Conversation:', req.params.conversationId);
    console.log('   User:', req.user._id);
    console.log('   Text:', req.body.text?.substring(0, 50));
    
    const { conversationId } = req.params;
    const { text, messageType, replyTo, relatedMeetingId } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Mesaj içeriği boş olamaz'
      });
    }
    
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Konuşma bulunamadı'
      });
    }
    
    // Yetkilendirme
    const isParticipant = conversation.participants.some(
      p => p.toString() === req.user._id.toString()
    );
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Bu konuşmaya mesaj gönderme yetkiniz yok'
      });
    }
    
    console.log('✅ Authorization OK, mesaj oluşturuluyor...');
    
    const message = new Message({
      conversationId,
      senderUserId: req.user._id,
      text: text.trim(),
      messageType: messageType || 'text',
      replyTo,
      relatedMeetingId,
      status: 'sent',
      ipAddress: req.ip
    });
    
    console.log('💾 Mesaj kaydediliyor...');
    await message.save();
    console.log('✅ Mesaj kaydedildi! ID:', message._id);
    
    await message.populate([
      { path: 'senderUserId', select: 'name email role' },
      { path: 'replyTo', select: 'text senderUserId' }
    ]);
    
    console.log('✅ Mesaj populate edildi');
    
    // Not: Conversation güncelleme post-save hook'ta yapılıyor
    
    // Alıcıyı bul (gönderen hariç)
    await conversation.populate('participants', '_id name email');
    const receiver = conversation.participants.find(
      p => p._id.toString() !== req.user._id.toString()
    );
    
    if (receiver) {
      // 🔥 Socket.IO ile gerçek zamanlı mesaj gönder
      const messageData = {
        ...message.toObject(),
        conversationId: conversation._id.toString() // String'e çevir
      };
      
      console.log('🚀 Socket emit hazırlanıyor...');
      console.log('   Sender ID:', req.user._id.toString());
      console.log('   Receiver ID:', receiver._id.toString());
      console.log('   Conversation ID:', conversation._id.toString());
      console.log('   Message ID:', message._id.toString());
      
      // HER DURUMDA EMIT YAP (offline kontrolü emit'i engellemesin)
      socketService.sendNewMessage({
        senderId: req.user._id.toString(),
        receiverId: receiver._id.toString(),
        conversationId: conversation._id.toString(),
        message: messageData
      });
      
      console.log('✅ Socket emit tamamlandı (online/offline fark etmeksizin)');
      
      // Alıcı offline ise email gönder (opsiyonel)
      if (!socketService.isUserOnline(receiver._id.toString())) {
        try {
          const receiverUser = await User.findById(receiver._id);
          
          await emailService.sendNewMessage(
            message.senderUserId,
            receiver,
            conversation,
            text.trim(),
            receiverUser?.emailPreferences
          );
        } catch (emailError) {
          console.error('Mesaj email gönderme hatası:', emailError);
        }
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Mesaj gönderildi',
      data: message
    });
  } catch (error) {
    console.error('sendMessage error:', error);
    res.status(500).json({
      success: false,
      message: 'Mesaj gönderilirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Mesajları okundu olarak işaretle
// @route   POST /api/mentornet/messages/:conversationId/mark-read
// @access  Conversation participant
exports.markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Konuşma bulunamadı'
      });
    }
    
    // Yetkilendirme
    const isParticipant = conversation.participants.some(
      p => p.toString() === req.user._id.toString()
    );
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Bu konuşmadaki mesajları işaretleme yetkiniz yok'
      });
    }
    
    const result = await Message.markAsReadBulk(conversationId, req.user._id);
    
    // 🔥 Socket.IO ile okundu bilgisini gönder
    // Conversation'daki diğer kullanıcıyı bul
    await conversation.populate('participants', '_id');
    const otherParticipant = conversation.participants.find(
      p => p._id.toString() !== req.user._id.toString()
    );
    
    if (otherParticipant) {
      socketService.sendMessageRead(otherParticipant._id.toString(), {
        conversationId,
        readBy: req.user._id,
        readByName: req.user.name,
        readAt: new Date()
      });
    }
    
    res.json({
      success: true,
      message: 'Mesajlar okundu olarak işaretlendi',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('markAsRead error:', error);
    res.status(500).json({
      success: false,
      message: 'Mesajlar işaretlenirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Kullanıcının toplam okunmamış mesaj sayısı
// @route   GET /api/mentornet/messages/unread-count
// @access  Authenticated User
exports.getUnreadCount = async (req, res) => {
  try {
    console.log('📊 Unread count endpoint çağrıldı');
    console.log('User ID:', req.user._id);
    console.log('User Role:', req.user.role);
    
    // Multi-Tenant: ideathonId çözümle (slug > JWT > user.ideathonId)
    let unreadIdeathonId = null;
    if (req.query.event) {
      const Ideathon = require('../models/Ideathon');
      const ideathon = await Ideathon.findOne({ slug: req.query.event, status: 'active' })
        .select('_id').lean();
      if (ideathon) unreadIdeathonId = ideathon._id;
    }
    if (!unreadIdeathonId && req.ideathonId) {
      unreadIdeathonId = req.ideathonId;
    }
    if (!unreadIdeathonId && req.user.role === 'user' && req.user.ideathonId) {
      unreadIdeathonId = req.user.ideathonId;
    }
    console.log('Ideathon ID (resolved):', unreadIdeathonId);
    
    const count = await Message.getUnreadCount(req.user._id, null, unreadIdeathonId);
    
    console.log('✅ Unread count başarılı:', count);
    
    res.json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error) {
    console.error('❌ getUnreadCount error:', error);
    res.status(500).json({
      success: false,
      message: 'Okunmamış mesaj sayısı alınırken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Online kullanıcı kontrolü
// @route   GET /api/mentornet/messages/online-status/:userId
// @access  Authenticated User
exports.checkOnlineStatus = async (req, res) => {
  try {
    console.log('🔍 Online status check için:', req.params.userId);
    
    const { userId } = req.params;
    
    const isOnline = socketService.isUserOnline(userId);
    
    console.log(`✅ User ${userId} online: ${isOnline}`);
    
    res.json({
      success: true,
      data: {
        userId,
        isOnline,
        lastChecked: new Date()
      }
    });
  } catch (error) {
    console.error('❌ checkOnlineStatus error:', error);
    res.status(500).json({
      success: false,
      message: 'Online status kontrol edilirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Tüm online kullanıcıları getir
// @route   GET /api/mentornet/messages/online-users
// @access  Authenticated User
exports.getOnlineUsers = async (req, res) => {
  try {
    console.log('👥 Online users listesi istendi');
    
    const onlineUserIds = socketService.getOnlineUserIds();
    const onlineCount = socketService.getOnlineUsersCount();
    
    console.log(`📊 Online user count: ${onlineCount}`);
    console.log(`📊 Online user IDs:`, onlineUserIds);
    
    // Online kullanıcıların bilgilerini getir
    const onlineUsers = await User.find({
      _id: { $in: onlineUserIds }
    }).select('name email role');
    
    console.log('✅ Online users:', onlineUsers.map(u => ({ id: u._id, name: u.name })));
    
    // Add teamName to online users
    const onlineUsersWithTeams = await addTeamNameToUsers(onlineUsers);
    
    res.json({
      success: true,
      data: {
        count: onlineCount,
        users: onlineUsersWithTeams
      }
    });
  } catch (error) {
    console.error('❌ getOnlineUsers error:', error);
    res.status(500).json({
      success: false,
      message: 'Online kullanıcılar getirilirken hata oluştu',
      error: error.message
    });
  }
};

module.exports = exports;













