const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Ideathon = require('../models/Ideathon');
const UserIdeathonRole = require('../models/UserIdeathonRole');

// ═══════════════════════════════════════════════════════════
// JWT TOKEN
// ═══════════════════════════════════════════════════════════

// JWT token oluştur (genişletilmiş)
// - Jüri/Mentor: generateToken(userId, ideathonId, 'juri'|'mentor')
// - Admin/Superadmin/User: generateToken(userId, null, 'admin'|'superadmin'|'user')
const generateToken = (userId, ideathonId = null, role = null) => {
  const payload = { userId };

  if (ideathonId) {
    payload.ideathonId = ideathonId;
  }
  if (role) {
    payload.role = role;
  }

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// JWT token doğrula
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Geçersiz token');
  }
};

// ═══════════════════════════════════════════════════════════
// AUTHENTICATION MIDDLEWARE
// ═══════════════════════════════════════════════════════════

// Authentication middleware - token kontrolü
const authenticate = async (req, res, next) => {
  try {
    let token;

    // Token'ı header'dan al
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Bu işlem için giriş yapmanız gerekiyor'
      });
    }

    // Token'ı doğrula
    const decoded = verifyToken(token);

    // Kullanıcıyı bul
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token geçersiz - kullanıcı bulunamadı'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Hesabınız pasif durumda'
      });
    }

    // JWT payload bilgilerini request'e ekle
    req.user = user;
    req.jwtPayload = decoded; // ideathonId, role vb. erişilebilir olsun

    // JWT'de ideathonId varsa req.ideathonId olarak set et (TÜM roller için)
    // Bu sayede conversations, meetings, unread-count vb. otomatik ideathon filtresi uygular
    if (decoded.ideathonId && mongoose.Types.ObjectId.isValid(decoded.ideathonId)) {
      req.ideathonId = new mongoose.Types.ObjectId(decoded.ideathonId);
    }

    // Jüri/Mentor ise: Token invalidation kontrolü
    if (decoded.ideathonId && ['juri', 'mentor'].includes(user.role)) {
      const roleRecord = await UserIdeathonRole.findOne({
        userId: decoded.userId,
        ideathonId: decoded.ideathonId,
        isActive: true
      }).lean();

      if (!roleRecord) {
        return res.status(401).json({
          success: false,
          message: 'İdeathon atamanız kaldırılmış veya pasif. Lütfen tekrar giriş yapın.'
        });
      }

      // Token, rol değişikliğinden ÖNCE basılmışsa reddet
      if (roleRecord.lastRoleChangeAt && decoded.iat * 1000 < roleRecord.lastRoleChangeAt.getTime()) {
        return res.status(401).json({
          success: false,
          message: 'Rol bilginiz güncellenmiş. Lütfen tekrar giriş yapın.'
        });
      }
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Token doğrulama hatası'
    });
  }
};

// Optional authentication - Token varsa doğrula, yoksa devam et
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    // Token'ı header'dan al
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Token yoksa, req.user null olarak devam et
    if (!token) {
      req.user = null;
      req.jwtPayload = null;
      return next();
    }

    // Token varsa doğrula
    try {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId).select('-password');

      if (user && user.isActive) {
        req.user = user;
        req.jwtPayload = decoded;

        // JWT'de ideathonId varsa req.ideathonId olarak set et
        if (decoded.ideathonId && mongoose.Types.ObjectId.isValid(decoded.ideathonId)) {
          req.ideathonId = new mongoose.Types.ObjectId(decoded.ideathonId);
        }
      } else {
        req.user = null;
        req.jwtPayload = null;
      }
    } catch (error) {
      // Token geçersizse de devam et (public erişim)
      req.user = null;
      req.jwtPayload = null;
    }

    next();
  } catch (error) {
    // Hata olursa da devam et
    req.user = null;
    req.jwtPayload = null;
    next();
  }
};

// ═══════════════════════════════════════════════════════════
// AUTHORIZATION MIDDLEWARE
// ═══════════════════════════════════════════════════════════

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Önce giriş yapmanız gerekiyor'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Bu işlem için yetkiniz yoktur.`
      });
    }

    next();
  };
};

// Superadmin kontrolü
const requireSuperAdmin = authorize('superadmin');

const requireSuperAdminOrAdmin = authorize('superadmin', 'admin');

// Juri veya superadmin kontrolü
const requireJuriOrAdmin = authorize('superadmin', 'juri');

// Mentor kontrolü
const requireMentor = authorize('mentor');

// Mentor veya admin kontrolü
const requireMentorOrAdmin = authorize('superadmin', 'admin', 'mentor');

// Herhangi bir aktif kullanıcı kontrolü
const requireActiveUser = authorize('superadmin', 'juri', 'mentor', 'user');

// Sadece kendi hesabını düzenleme izni
const requireOwnership = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Önce giriş yapmanız gerekiyor'
    });
  }

  // Superadmin her şeyi yapabilir
  if (req.user.role === 'superadmin') {
    return next();
  }

  // Kullanıcı sadece kendi hesabını düzenleyebilir
  if (req.params.id !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Sadece kendi hesabınızı düzenleyebilirsiniz'
    });
  }

  next();
};

// ═══════════════════════════════════════════════════════════
// IDEATHON CONTEXT MIDDLEWARE'LERİ
// ═══════════════════════════════════════════════════════════

/**
 * 1) attachIdeathonFromJwtOnly
 *    Kullanım: Jüri ve Mentor route'ları (ZORUNLU)
 *    Kaynak: SADECE JWT payload
 *    Token'da ideathonId yoksa → 401
 */
const attachIdeathonFromJwtOnly = (req, res, next) => {
  const ideathonId = req.jwtPayload?.ideathonId;

  if (!ideathonId) {
    return res.status(401).json({
      success: false,
      message: 'Token ideathon bilgisi içermiyor. Lütfen tekrar giriş yapın.'
    });
  }

  if (!mongoose.Types.ObjectId.isValid(ideathonId)) {
    return res.status(401).json({
      success: false,
      message: 'Token içindeki ideathon ID geçersiz. Lütfen tekrar giriş yapın.'
    });
  }

  req.ideathonId = new mongoose.Types.ObjectId(ideathonId);
  next();
};

// Slug → ObjectId çözümleme cache (5 dakika TTL)
const slugCache = new Map();
const SLUG_CACHE_TTL = 5 * 60 * 1000;

/**
 * 2) attachIdeathonFromQuerySlug
 *    Kullanım: Public (katılımcı) route'ları
 *    Kaynak: ?event=<slug> query parametresi
 */
const attachIdeathonFromQuerySlug = async (req, res, next) => {
  try {
    const slug = req.query.event;

    // Slug yoksa body'den ideathonId kontrolü yap (fallback)
    if (!slug) {
      if (req.body && req.body.ideathonId) {
        req.ideathonId = req.body.ideathonId;
        return next();
    }
      return res.status(400).json({
        success: false,
        message: 'event query parametresi zorunludur (örn: ?event=ek-ideathon-2025)'
      });
    }

    // Cache kontrol
    const cached = slugCache.get(slug);
    if (cached && Date.now() - cached.ts < SLUG_CACHE_TTL) {
      req.ideathonId = cached.data._id;
      req.ideathonName = cached.data.name;
      return next();
    }

    // DB'den çözümle
    const ideathon = await Ideathon.findOne({ slug, status: 'active' })
      .select('_id name')
      .lean();
      
    if (!ideathon) {
      return res.status(404).json({
        success: false,
        message: 'Geçersiz veya aktif olmayan ideathon'
      });
    }

    // Cache'e yaz
    slugCache.set(slug, { data: ideathon, ts: Date.now() });

    req.ideathonId = ideathon._id;
    req.ideathonName = ideathon.name;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'İdeathon çözümlenirken hata oluştu'
    });
  }
};

/**
 * 2b) attachIdeathonFromQuerySlugOptional
 *     attachIdeathonFromQuerySlug ile aynı mantık, ancak slug yoksa hata vermez.
 *     Kullanım: Register gibi slug'ın opsiyonel olduğu route'lar
 */
const attachIdeathonFromQuerySlugOptional = async (req, res, next) => {
  try {
    const slug = req.query.event;

    // Slug yoksa → devam et (zorunlu değil)
    if (!slug) {
      // Body'den ideathonId kontrolü (fallback)
      if (req.body && req.body.ideathonId) {
        req.ideathonId = req.body.ideathonId;
      }
      return next();
    }

    // Cache kontrol
    const cached = slugCache.get(slug);
    if (cached && Date.now() - cached.ts < SLUG_CACHE_TTL) {
      req.ideathonId = cached.data._id;
      req.ideathonName = cached.data.name;
      return next();
    }

    // DB'den çözümle
    const ideathon = await Ideathon.findOne({ slug, status: 'active' })
      .select('_id name')
      .lean();

    if (!ideathon) {
      return res.status(404).json({
        success: false,
        message: 'Geçersiz veya aktif olmayan ideathon'
      });
    }

    // Cache'e yaz
    slugCache.set(slug, { data: ideathon, ts: Date.now() });

    req.ideathonId = ideathon._id;
    req.ideathonName = ideathon.name;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'İdeathon çözümlenirken hata oluştu'
    });
  }
};

/**
 * 3) attachIdeathonFromHeaderOrQuery
 *    Kullanım: Admin/Superadmin route'ları (OPSİYONEL)
 *    Kaynak: X-Ideathon-Id header VEYA ?ideathonId query
 *    ideathonId yoksa veya 'all' ise → req.ideathonId = null (tümü)
 */
const attachIdeathonFromHeaderOrQuery = (req, res, next) => {
  const ideathonId = req.headers['x-ideathon-id'] || req.query.ideathonId;

  if (ideathonId && ideathonId !== 'all') {
    if (!mongoose.Types.ObjectId.isValid(ideathonId)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz ideathon ID formatı'
      });
    }
    req.ideathonId = new mongoose.Types.ObjectId(ideathonId);
  } else {
    req.ideathonId = null; // null → tüm ideathonlar (filtresiz)
  }

    next();
};

/**
 * Slug cache temizleme (ideathon güncellendiğinde çağrılabilir)
 */
const clearSlugCache = (slug = null) => {
  if (slug) {
    slugCache.delete(slug);
  } else {
    slugCache.clear();
  }
};

// ═══════════════════════════════════════════════════════════
// RATE LIMITING
// ═══════════════════════════════════════════════════════════

// Rate limiting için basit counter (şimdilik basit implementasyon)
const loginAttemptLimiter = new Map();

const checkLoginAttempts = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 dakika
  const maxAttempts = 100;

  if (!loginAttemptLimiter.has(ip)) {
    loginAttemptLimiter.set(ip, { attempts: 0, resetTime: now + windowMs });
  }

  const userAttempts = loginAttemptLimiter.get(ip);

  // Reset time geçtiyse sıfırla
  if (now > userAttempts.resetTime) {
    userAttempts.attempts = 0;
    userAttempts.resetTime = now + windowMs;
  }

  // Çok fazla deneme varsa blokla
  if (userAttempts.attempts >= maxAttempts) {
    return res.status(429).json({
      success: false,
      message: 'Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.'
    });
  }

  // Başarısız girişlerde attempt sayısını artır (auth controller'da kullanılacak)
  req.loginLimiter = userAttempts;
  next();
};

// ═══════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════

module.exports = {
  generateToken,
  verifyToken,
  authenticate,
  optionalAuth,
  authorize,
  requireSuperAdmin,
  requireSuperAdminOrAdmin,
  requireJuriOrAdmin,
  requireMentor,
  requireMentorOrAdmin,
  requireActiveUser,
  requireOwnership,
  checkLoginAttempts,
  // Yeni: Ideathon context middleware'leri
  attachIdeathonFromJwtOnly,
  attachIdeathonFromQuerySlug,
  attachIdeathonFromQuerySlugOptional,
  attachIdeathonFromHeaderOrQuery,
  clearSlugCache
};
