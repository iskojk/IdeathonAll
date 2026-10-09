const jwt = require('jsonwebtoken');
const User = require('../models/User');

class SocketService {
  constructor() {
    this.io = null;
    this.onlineUsers = new Map(); // userId -> socketId mapping
  }

  /**
   * Socket.IO sunucusunu başlat
   * @param {Server} httpServer - HTTP server instance
   */
  initialize(httpServer) {
    const socketIO = require('socket.io');
    
    this.io = socketIO(httpServer, {
      cors: {
        origin: [
          process.env.FRONTEND_URL,
          process.env.ADMIN_PANEL_URL,
          process.env.JURI_PANEL_URL,
          process.env.MENTOR_PANEL_URL,
          ...(process.env.CORS_ALLOWED_ORIGINS || '').split(',')
        ].map(origin => origin?.trim()).filter(Boolean),
        methods: ['GET', 'POST'],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    // Redis Adapter - Production için multiple instance desteği
    if (process.env.NODE_ENV === 'production' && process.env.REDIS_URL) {
      this.setupRedisAdapter();
    } else {
      console.log('ℹ️  Redis adapter disabled (development mode or REDIS_URL not set)');
    }

    // JWT Authentication Middleware
    this.io.use(async (socket, next) => {
      try {
        console.log('🔌 Socket connection attempt');
        
        // Token'ı al
        let token = socket.handshake.auth.token || socket.handshake.headers.authorization;
        
        if (!token) {
          console.log('❌ Token bulunamadı');
          return next(new Error('Authentication error: Token bulunamadı'));
        }

        // Bearer prefix'i varsa kaldır
        token = token.replace(/^Bearer\s+/i, '');

        // Token'ı doğrula
        console.log('🔓 Token decode ediliyor...');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✅ Token decoded:', { userId: decoded.userId });
        
        // Kullanıcıyı veritabanından al
        console.log('👤 User aranıyor:', decoded.userId);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
          console.log('❌ User bulunamadı:', decoded.userId);
          return next(new Error('Authentication error: Kullanıcı bulunamadı'));
        }

        console.log('✅ User bulundu:', {
          id: user._id,
          email: user.email,
          role: user.role
        });

        if (!user.isActive) {
          console.log('❌ User aktif değil');
          return next(new Error('Authentication error: Kullanıcı aktif değil'));
        }

        if ((decoded.sessionVersion || 0) !== (user.sessionVersion || 0)) {
          return next(new Error('Authentication error: Oturum sona erdi'));
        }

        // Socket'e user bilgisini ekle
        socket.user = user;
        socket.userId = user._id.toString();
        
        // Multi-Tenant: JWT'den ideathonId ve role bilgisini socket'e ekle
        if (decoded.ideathonId) {
          socket.ideathonId = decoded.ideathonId;
        }
        if (decoded.role) {
          socket.userRole = decoded.role;
        }
        
        console.log('✅ Socket auth başarılı!', decoded.ideathonId ? `(ideathon: ${decoded.ideathonId})` : '');
        next();
      } catch (error) {
        console.error('❌ Socket auth error:', error.message);
        next(new Error('Authentication error: ' + error.message));
      }
    });

    // Connection handler
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    console.log('✅ Socket.IO initialized');
  }

  /**
   * Redis Adapter kurulumu (multiple instance desteği için)
   */
  setupRedisAdapter() {
    try {
      const { createAdapter } = require('@socket.io/redis-adapter');
      const { createClient } = require('redis');

      console.log('🔧 Setting up Redis adapter...');
      console.log('   Redis URL:', process.env.REDIS_URL);

      const pubClient = createClient({ url: process.env.REDIS_URL });
      const subClient = pubClient.duplicate();

      // Error handlers
      pubClient.on('error', (err) => console.error('❌ Redis PubClient Error:', err));
      subClient.on('error', (err) => console.error('❌ Redis SubClient Error:', err));

      Promise.all([pubClient.connect(), subClient.connect()])
        .then(() => {
          this.io.adapter(createAdapter(pubClient, subClient));
          console.log('✅ Redis adapter connected successfully');
          console.log('   Multiple instances can now share Socket.IO events');
        })
        .catch((err) => {
          console.error('❌ Redis adapter connection failed:', err);
          console.warn('⚠️  Falling back to in-memory adapter');
          console.warn('⚠️  Real-time messaging will only work within same instance');
        });
    } catch (error) {
      console.error('❌ Redis adapter setup error:', error);
      console.warn('⚠️  Socket.IO will use in-memory adapter');
    }
  }

  /**
   * Socket connection handler
   */
  handleConnection(socket) {
    const userId = socket.userId;
    const userName = socket.user.name;
    
    console.log(`🔌 User connected: ${userName} (${userId})`);

    // Kullanıcıyı online users listesine ekle
    this.onlineUsers.set(userId, socket.id);

    // Kullanıcıyı kendi room'una ekle
    socket.join(`user:${userId}`);
    
    // Online status'ü broadcast et
    this.io.emit('user:online', { userId });

    // Event handlers
    this.setupEventHandlers(socket);

    // Disconnect handler
    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });
  }

  /**
   * Event handler'ları kur
   */
  setupEventHandlers(socket) {
    const userId = socket.userId;

    // Conversation room'una katıl
    socket.on('join:conversation', (data) => {
      const { conversationId } = data;
      
      if (!conversationId) {
        return socket.emit('error', { message: 'conversationId gerekli' });
      }

      const roomName = `conversation:${conversationId}`;
      socket.join(roomName);
      
      // Detaylı log (production debug için)
      console.log(`👥 JOIN: User ${userId} joined conversation`);
      console.log(`   ConversationId: ${conversationId}`);
      console.log(`   ConversationId Type: ${typeof conversationId}`);
      console.log(`   Room Name: ${roomName}`);
      console.log(`   User Rooms:`, Array.from(socket.rooms));
      
      socket.emit('conversation:joined', { conversationId });
    });

    // Conversation room'undan ayrıl
    socket.on('leave:conversation', (data) => {
      const { conversationId } = data;
      
      if (!conversationId) {
        return socket.emit('error', { message: 'conversationId gerekli' });
      }

      socket.leave(`conversation:${conversationId}`);
      console.log(`👋 User ${userId} left conversation ${conversationId}`);
    });

    // Mesaj gönderme (client'tan gelen, DB kaydı için HTTP kullanılacak)
    socket.on('message:send', (data) => {
      // Bu event şimdilik sadece typing indicator için kullanılabilir
      // Gerçek mesaj gönderimi HTTP POST ile yapılacak
      const { conversationId } = data;
      
      if (conversationId) {
        // Typing indicator'ı conversation'daki diğer kullanıcılara gönder
        socket.to(`conversation:${conversationId}`).emit('user:typing', {
          userId,
          userName: socket.user.name,
          conversationId
        });
      }
    });

    // Typing durumunu durdur
    socket.on('message:stop-typing', (data) => {
      const { conversationId } = data;
      
      if (conversationId) {
        socket.to(`conversation:${conversationId}`).emit('user:stop-typing', {
          userId,
          conversationId
        });
      }
    });

    // Mesaj okundu bildirimi
    socket.on('message:read', (data) => {
      const { conversationId, messageIds } = data;
      
      if (!conversationId) {
        return socket.emit('error', { message: 'conversationId gerekli' });
      }

      // Conversation'daki diğer kullanıcılara bildir
      socket.to(`conversation:${conversationId}`).emit('messages:read', {
        conversationId,
        messageIds,
        readBy: userId
      });
    });
  }

  /**
   * Disconnect handler
   */
  handleDisconnect(socket) {
    const userId = socket.userId;
    const userName = socket.user.name;
    
    console.log(`🔴 User disconnected: ${userName} (${userId})`);

    // Kullanıcıyı online users listesinden çıkar
    this.onlineUsers.delete(userId);

    // Offline status'ü broadcast et
    this.io.emit('user:offline', { userId });
  }

  /**
   * Kullanıcının online olup olmadığını kontrol et
   * @param {String} userId 
   * @returns {Boolean}
   */
  isUserOnline(userId) {
    return this.onlineUsers.has(userId);
  }

  /**
   * Belirli bir kullanıcıya mesaj gönder
   * @param {String} userId 
   * @param {String} event 
   * @param {Object} data 
   */
  emitToUser(userId, event, data) {
    if (this.io) {
      this.io.to(`user:${userId}`).emit(event, data);
      return true;
    }
    return false;
  }

  /**
   * Belirli bir conversation'a mesaj gönder
   * @param {String} conversationId 
   * @param {String} event 
   * @param {Object} data 
   */
  emitToConversation(conversationId, event, data) {
    if (this.io) {
      this.io.to(`conversation:${conversationId}`).emit(event, data);
      return true;
    }
    return false;
  }

  /**
   * Yeni mesaj bildirimini gönder
   * @param {Object} params - Mesaj parametreleri
   * @param {String} params.senderId - Gönderen kullanıcı ID
   * @param {String} params.receiverId - Alıcı kullanıcı ID
   * @param {String} params.conversationId - Conversation ID
   * @param {Object} params.message - Mesaj objesi
   */
  sendNewMessage({ senderId, receiverId, conversationId, message }) {
    const timestamp = new Date().toISOString();
    
    console.log(`[${timestamp}] 📨 EMIT START: Sending message`);
    console.log(`  Sender: ${senderId}`);
    console.log(`  Receiver: ${receiverId}`);
    console.log(`  ConversationId: ${conversationId}`);
    console.log(`  Receiver Online: ${this.isUserOnline(receiverId)} (sadece log)`);
    console.log(`  Message Text: ${message.text?.substring(0, 50)}...`);
    
    // CONVERSATION ROOM'UNA GÖNDER (EN ÖNEMLİ - HER ZAMAN)
    const convRoom = `conversation:${conversationId}`;
    this.io.to(convRoom).emit('message:new', message);
    console.log(`  ✅ Conversation room emit: ${convRoom}`);
    
    // RECEIVER'A GÖNDER (opsiyonel ama önerilen)
    if (receiverId) {
      this.io.to(`user:${receiverId}`).emit('message:new', message);
      console.log(`  ✅ Receiver user room emit: user:${receiverId}`);
    }
    
    // SENDER'A GÖNDER (diğer tab'ları için)
    if (senderId) {
      this.io.to(`user:${senderId}`).emit('message:new', message);
      console.log(`  ✅ Sender user room emit: user:${senderId} (for other tabs)`);
    }
    
    // Offline log (sadece bilgilendirme)
    if (!this.isUserOnline(receiverId)) {
      console.log(`  📭 Receiver offline (mesaj yine de emit edildi)`);
    }
    
    console.log(`[${timestamp}] 📨 EMIT END - SUCCESS`);
    return true;
  }

  /**
   * Mesaj okundu bildirimini gönder
   * @param {String} senderId - Mesajı gönderen kullanıcı ID
   * @param {Object} data - Okundu bilgisi
   */
  sendMessageRead(senderId, data) {
    if (!this.isUserOnline(senderId)) {
      return false;
    }

    console.log(`✅ Sending read receipt to user ${senderId}`);
    this.emitToUser(senderId, 'message:read', data);
    
    return true;
  }

  /**
   * Online kullanıcı sayısını döndür
   * @returns {Number}
   */
  getOnlineUsersCount() {
    return this.onlineUsers.size;
  }

  /**
   * Online kullanıcıları döndür
   * @returns {Array}
   */
  getOnlineUserIds() {
    return Array.from(this.onlineUsers.keys());
  }

  /**
   * Socket.IO instance'ını döndür
   * @returns {SocketIO}
   */
  getIO() {
    return this.io;
  }
}

// Singleton instance
const socketService = new SocketService();

module.exports = socketService;
