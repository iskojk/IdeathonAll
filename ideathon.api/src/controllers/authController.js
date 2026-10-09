const crypto = require('crypto');
const User = require('../models/User');
const UserIdeathonRole = require('../models/UserIdeathonRole');
const { generateToken } = require('../middleware/auth');
const emailService = require('../services/emailService');
const { normalizePhone } = require('../services/entrepreneurPhone');
const { AUTH_CODE_TTL_MS } = require('../config/authCode');
const identityConflict = error => error.keyPattern?.phoneKey || error.keyValue?.phoneKey
  ? 'Daha önce bu telefon numarası kullanılmıştır.'
  : 'Daha önce bu e-posta adresi kullanılmıştır.';

class AuthController {
  // Kullanıcı girişi
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email ve şifre zorunludur'
        });
      }

      // Email format kontrolü
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Geçerli bir email adresi giriniz'
        });
      }

      // Kullanıcıyı bul (şifre ile birlikte)
      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Geçersiz email veya şifre'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Hesabınız pasif durumda. Yönetici ile iletişime geçin.'
        });
      }

      // Şifre kontrolü
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        // Başarısız giriş denemesi counter'ını artır
        if (req.loginLimiter) {
          req.loginLimiter.attempts += 1;
        }

        return res.status(401).json({
          success: false,
          message: 'Geçersiz email veya şifre'
        });
      }

      // Başarılı giriş - counter'ı sıfırla
      if (req.loginLimiter) {
        req.loginLimiter.attempts = 0;
      }

      // ideathonId çözümle (rol bazlı)
      let ideathonId = null;
      let ideathonRole = null;
      let ideathonInfo = null;

      if (['juri', 'mentor'].includes(user.role)) {
        // Jüri/Mentor → UserIdeathonRole'den
        ideathonRole = await UserIdeathonRole.findOne({
          userId: user._id,
          role: user.role,
          isActive: true
        }).populate('ideathonId', 'name slug status').lean();

        if (!ideathonRole) {
          return res.status(403).json({
            success: false,
            message: 'Aktif bir ideathon atamanız bulunmuyor. Lütfen yönetici ile iletişime geçin.'
          });
        }

        ideathonId = ideathonRole.ideathonId._id;
        ideathonInfo = {
          _id: ideathonRole.ideathonId._id,
          name: ideathonRole.ideathonId.name,
          slug: ideathonRole.ideathonId.slug
        };
      } else if (user.role === 'user' && user.ideathonId) {
        // User → User modelindeki ideathonId'den
        ideathonId = user.ideathonId;
        const Ideathon = require('../models/Ideathon');
        const ideathon = await Ideathon.findById(user.ideathonId).select('name slug status').lean();
        if (ideathon) {
          ideathonInfo = {
            _id: ideathon._id,
            name: ideathon.name,
            slug: ideathon.slug
          };
        }
      }

      // JWT token oluştur — user için de ideathonId dahil
      const token = generateToken(user._id, ideathonId, user.role, user.sessionVersion);

      // Şifresiz kullanıcı bilgilerini döndür
      const userResponse = {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        ideathonId: ideathonId || null,
        createdAt: user.createdAt,
        ...(ideathonInfo && { ideathon: ideathonInfo })
      };

      res.status(200).json({
        success: true,
        message: 'Giriş başarılı',
        data: {
          user: userResponse,
          token
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Giriş yapılırken hata oluştu'
      });
    }
  }

  // Kullanıcı kaydı (sadece superadmin yapabilir)
  async register(req, res) {
    try {
      const { name, email, password, role, phone } = req.body;

      // Validation
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'İsim, email ve şifre zorunludur'
        });
      }

      // Email format kontrolü
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Geçerli bir email adresi giriniz'
        });
      }

      // Şifre uzunluğu kontrolü
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Şifre en az 6 karakter olmalıdır'
        });
      }

      // Role kontrolü
      if (role && !['superadmin', 'juri', 'mentor'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz rol. Geçerli roller: superadmin, juri, mentor'
        });
      }

      // Jüri/Mentor oluşturuluyorsa ideathonId zorunlu
      const { ideathonId } = req.body;
      if (['juri', 'mentor'].includes(role) && !ideathonId) {
        return res.status(400).json({
          success: false,
          message: 'Jüri veya mentor oluştururken ideathonId zorunludur'
        });
      }

      // ideathonId geçerliliğini kontrol et
      if (ideathonId) {
        const Ideathon = require('../models/Ideathon');
        const ideathon = await Ideathon.findById(ideathonId);
        if (!ideathon) {
          return res.status(404).json({
            success: false,
            message: 'Belirtilen ideathon bulunamadı'
          });
        }
      }

      // Kullanıcı oluştur
      const user = await User.create({
        name,
        email,
        password,
        phone,
        role: role || 'user',
        createdBy: req.user ? req.user._id : null
      });

      // Jüri/Mentor ise UserIdeathonRole kaydı oluştur
      if (['juri', 'mentor'].includes(role) && ideathonId) {
        await UserIdeathonRole.create({
          userId: user._id,
          ideathonId,
          role,
          assignedBy: req.user._id
        });
      }

      // Token oluştur (jüri/mentor ise ideathonId dahil)
      const token = generateToken(
        user._id,
        ['juri', 'mentor'].includes(role) ? ideathonId : null,
        role || 'user',
        user.sessionVersion
      );

      // Şifresiz response
      const userResponse = {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      };

      res.status(201).json({
        success: true,
        message: 'Kullanıcı başarıyla oluşturuldu',
        data: {
          user: userResponse,
          token
        }
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: identityConflict(error)
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Kullanıcı oluşturulurken hata oluştu'
      });
    }
  }

  // Public accounts are created only after email verification.
  async publicRegister(req, res) {
    return require('./registrationController').start(req, res);
  }

  // Kullanıcı profili güncelle (kendi profili)
  async updateProfile(req, res) {
    try {
      const { name, email, phone } = req.body;
      const userId = req.user._id;

      // Validation
      if (!name && !email && phone === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Güncellenecek en az bir alan belirtmelisiniz (name, email veya phone)'
        });
      }

      // Email format kontrolü
      if (email) {
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({
            success: false,
            message: 'Geçerli bir email adresi giriniz'
          });
        }
      }

      const User = require('../models/User');

      // Kullanıcıyı bul ve güncelle
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı'
        });
      }

      // Güncellemeleri uygula
      if (name) user.name = name;
      if (email) user.email = email.toLowerCase();
      if (phone !== undefined) user.phone = phone;

      await user.save();

      // Response için şifresiz user object
      const userResponse = {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      res.status(200).json({
        success: true,
        message: 'Profil başarıyla güncellendi',
        data: {
          user: userResponse
        }
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: identityConflict(error)
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Profil güncellenirken hata oluştu'
      });
    }
  }

  // Şifre değiştirme (mevcut şifre ile)
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user._id;

      // Validation
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Mevcut şifre ve yeni şifre zorunludur'
        });
      }

      // Şifre uzunluğu kontrolü
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Yeni şifre en az 6 karakter olmalıdır'
        });
      }

      const User = require('../models/User');

      // Kullanıcıyı bul
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı'
        });
      }

      // Mevcut şifreyi kontrol et
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);

      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Mevcut şifre yanlış'
        });
      }

      // Yeni şifreyi ayarla
      user.password = newPassword;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Şifreniz başarıyla değiştirildi'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Şifre değiştirilirken hata oluştu'
      });
    }
  }

  // Me endpoint - mevcut kullanıcı bilgileri + ideathon bağlamı
  async me(req, res) {
    try {
      const user = await User.findById(req.user._id)
        .select('-password')
        .populate('createdBy', 'name email');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı'
        });
      }

      const userData = user.toObject();

      // Jüri/Mentor ise aktif ideathon bilgisini ekle
      if (['juri', 'mentor'].includes(user.role) && req.jwtPayload?.ideathonId) {
        const ideathonRole = await UserIdeathonRole.findOne({
          userId: user._id,
          ideathonId: req.jwtPayload.ideathonId,
          isActive: true
        }).populate('ideathonId', 'name slug status').lean();

        if (ideathonRole) {
          userData.ideathon = {
            _id: ideathonRole.ideathonId._id,
            name: ideathonRole.ideathonId.name,
            slug: ideathonRole.ideathonId.slug,
            status: ideathonRole.ideathonId.status
          };
        }
      }

      // User (katılımcı) ise → User modelindeki ideathonId'den ideathon bilgisini ekle
      if (user.role === 'user' && user.ideathonId) {
        const Ideathon = require('../models/Ideathon');
        const ideathon = await Ideathon.findById(user.ideathonId).select('name slug status').lean();
        if (ideathon) {
          userData.ideathon = {
            _id: ideathon._id,
            name: ideathon.name,
            slug: ideathon.slug,
            status: ideathon.status
          };
        }
      }

      // Admin/Superadmin ise tüm ideathon atamalarını göster
      if (['admin', 'superadmin'].includes(user.role)) {
        const allRoles = await UserIdeathonRole.getActiveRolesForUser(user._id);
        if (allRoles.length > 0) {
          userData.ideathonRoles = allRoles;
        }
      }

      res.status(200).json({
        success: true,
        data: userData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Kullanıcı bilgileri alınırken hata oluştu'
      });
    }
  }

  // Token yenileme — JWT payload'daki ideathonId ve role'ü koru
  async refreshToken(req, res) {
    try {
      const ideathonId = req.jwtPayload?.ideathonId || null;
      const role = req.user.role;

      // Jüri/Mentor ise → hâlâ aktif mi kontrol et
      if (ideathonId && ['juri', 'mentor'].includes(role)) {
        const roleRecord = await UserIdeathonRole.findOne({
          userId: req.user._id,
          ideathonId,
          isActive: true
        }).lean();

        if (!roleRecord) {
          return res.status(401).json({
            success: false,
            message: 'İdeathon atamanız kaldırılmış. Lütfen tekrar giriş yapın.'
          });
        }
      }

      // Yeni token oluştur
      const token = generateToken(req.user._id, ideathonId, role, req.user.sessionVersion);

      res.status(200).json({
        success: true,
        message: 'Token yenilendi',
        data: {
          token
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Token yenilenirken hata oluştu'
      });
    }
  }

  // Şifre değiştirme
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      // Validation
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Mevcut şifre ve yeni şifre zorunludur'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Yeni şifre en az 6 karakter olmalıdır'
        });
      }

      // Kullanıcıyı şifre ile birlikte bul
      const user = await User.findById(req.user._id).select('+password');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı'
        });
      }

      // Mevcut şifre kontrolü
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Mevcut şifre yanlış'
        });
      }

      // Yeni şifre eskisiyle aynı olmamalı
      const isSamePassword = await user.comparePassword(newPassword);
      if (isSamePassword) {
        return res.status(400).json({
          success: false,
          message: 'Yeni şifre mevcut şifrenizden farklı olmalıdır'
        });
      }

      // Şifreyi güncelle
      user.password = newPassword;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Şifre başarıyla değiştirildi'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Şifre değiştirilirken hata oluştu'
      });
    }
  }

  // Logout (client-side'da token silmek yeterli, server-side'da blacklist yapılabilir)
  async logout(req, res) {
    try {
      // İleride token blacklist sistemi eklenebilir
      res.status(200).json({
        success: true,
        message: 'Çıkış yapıldı'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Çıkış yapılırken hata oluştu'
      });
    }
  }

  // İlk superadmin oluşturma (sadece sistem başlatılırken kullanılır)
  async createInitialSuperAdmin(req, res) {
    try {
      // Zaten superadmin var mı kontrol et
      const superAdminCount = await User.countDocuments({ role: 'superadmin' });

      if (superAdminCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Sistemde zaten superadmin mevcut'
        });
      }

      const { name, email, password } = req.body;

      // Validation
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'İsim, email ve şifre zorunludur'
        });
      }

      // İlk superadmin oluştur
      const superAdmin = await User.create({
        name,
        email,
        password,
        role: 'superadmin',
        createdBy: null // Sistem tarafından oluşturuldu
      });

      // Token oluştur
      const token = generateToken(superAdmin._id, null, 'superadmin', superAdmin.sessionVersion);

      const userResponse = {
        _id: superAdmin._id,
        name: superAdmin.name,
        email: superAdmin.email,
        phone: superAdmin.phone,
        role: superAdmin.role,
        isActive: superAdmin.isActive,
        createdAt: superAdmin.createdAt
      };

      res.status(201).json({
        success: true,
        message: 'İlk superadmin başarıyla oluşturuldu',
        data: {
          user: userResponse,
          token
        }
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: identityConflict(error)
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'İlk superadmin oluşturulurken hata oluştu'
      });
    }
  }

  // Reset codes are purpose-bound HMACs. Mail delivery never changes a password.
  async forgotPassword(req, res) {
    const mail = require('../services/authMail');
    const generic = { success: true, message: 'Bu adresle aktif bir hesap varsa şifre sıfırlama kodu gönderildi.' };
    try {
      const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
      if (!email || email.length > 254 || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        return res.status(400).json({ success: false, message: 'Geçerli bir e-posta adresi giriniz.' });
      }
      const user = await User.findOne({ email, isActive: true });
      if (!user) return res.json(generic);
      const now = new Date();
      const resetCode = crypto.randomInt(100000, 1000000).toString();
      const digest = mail.codeDigest('password_reset', email, resetCode);
      const saved = await User.updateOne({ _id: user._id, email, isActive: true, $or: [
        { passwordResetSentAt: { $exists: false } }, { passwordResetSentAt: { $lte: new Date(now.getTime() - 60000) } }
      ] }, { $set: { passwordResetCode: digest, passwordResetExpires: new Date(now.getTime() + AUTH_CODE_TTL_MS),
        passwordResetAttempts: 0, passwordResetSentAt: now } });
      if (saved.modifiedCount !== 1) return res.json(generic);
      try {
        await emailService.sendPasswordResetEmail(user.email, resetCode, user.name);
      } catch (error) {
        // A failed older send must never clear a newer code.
        await User.updateOne({ _id: user._id, passwordResetCode: digest }, { $unset: {
          passwordResetCode: 1, passwordResetExpires: 1, passwordResetAttempts: 1, passwordResetSentAt: 1
        } });
        console.error('Password reset email failed:', error.code || error.name || 'Error');
        return res.status(503).json({ success: false, message: 'E-posta gönderilemedi. Lütfen daha sonra tekrar deneyin.' });
      }
      return res.json(generic);
    } catch (error) {
      console.error('Password reset request failed:', error.code || error.name || 'Error');
      return res.status(503).json({ success: false, message: 'Şifre sıfırlama isteği tamamlanamadı. Lütfen tekrar deneyin.' });
    }
  }

  async resetPassword(req, res) {
    const mail = require('../services/authMail');
    const invalid = () => res.status(400).json({ success: false, message: 'Kod hatalı, süresi dolmuş veya deneme sınırı aşılmış. Yeni kod isteyin.' });
    try {
      const { code, newPassword } = req.body;
      const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
      if (!email || email.length > 254 || typeof code !== 'string' || !/^\d{6}$/.test(code) ||
          typeof newPassword !== 'string' || newPassword.length < 6 || Buffer.byteLength(newPassword) > 72) {
        return res.status(400).json({ success: false, message: 'E-posta, altı haneli kod ve 6–72 bayt uzunluğunda yeni şifre giriniz.' });
      }
      const user = await User.findOne({ email, isActive: true, passwordResetExpires: { $gt: new Date() } })
        .select('+passwordResetCode +passwordResetExpires +passwordResetAttempts');
      if (!user || !user.passwordResetCode || (user.passwordResetAttempts || 0) >= 5) return invalid();
      const digest = mail.codeDigest('password_reset', email, code);
      const filter = { _id: user._id, email, isActive: true, passwordResetCode: user.passwordResetCode,
        passwordResetExpires: { $gt: new Date() }, $or: [
          { passwordResetAttempts: { $exists: false } }, { passwordResetAttempts: { $lt: 5 } }
        ] };
      // Existing unexpired legacy codes remain usable once during rollout.
      const expected = /^\d{6}$/.test(user.passwordResetCode) ? code : digest;
      if (!mail.matchesCode(user.passwordResetCode, expected)) {
        await User.updateOne(filter, { $inc: { passwordResetAttempts: 1 } });
        return invalid();
      }
      const password = await require('bcryptjs').hash(newPassword, 12);
      filter.passwordResetExpires = { $gt: new Date() };
      const consumed = await User.updateOne(filter, { $set: { password }, $inc: { sessionVersion: 1 },
        $unset: { passwordResetCode: 1, passwordResetExpires: 1, passwordResetAttempts: 1, passwordResetSentAt: 1 } }, { runValidators: true });
      if (consumed.modifiedCount !== 1) return invalid();
      require('../services/socketService').io?.in(`user:${user._id}`).disconnectSockets(true);
      return res.json({ success: true, message: 'Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz.' });
    } catch (error) {
      console.error('Password reset failed:', error.code || error.name || 'Error');
      return res.status(503).json({ success: false, message: 'Şifre sıfırlama tamamlanamadı. Lütfen tekrar deneyin.' });
    }
  }

  // Mentor özel login (MentorProfile bilgilerini de döner)
  async mentorLogin(req, res) {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email ve şifre zorunludur'
        });
      }

      // Email format kontrolü
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Geçerli bir email adresi giriniz'
        });
      }

      // Kullanıcıyı bul (şifre ile birlikte)
      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Geçersiz email veya şifre'
        });
      }

      // Mentor rolü kontrolü
      if (user.role !== 'mentor') {
        return res.status(403).json({
          success: false,
          message: 'Bu giriş sadece mentorlar içindir'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Hesabınız pasif durumda. Yönetici ile iletişime geçin.'
        });
      }

      // Şifre kontrolü
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        // Başarısız giriş denemesi counter'ını artır
        if (req.loginLimiter) {
          req.loginLimiter.attempts += 1;
        }

        return res.status(401).json({
          success: false,
          message: 'Geçersiz email veya şifre'
        });
      }

      // Başarılı giriş - counter'ı sıfırla
      if (req.loginLimiter) {
        req.loginLimiter.attempts = 0;
      }

      // UserIdeathonRole'den ideathonId al
      const ideathonRole = await UserIdeathonRole.findOne({
        userId: user._id,
        role: 'mentor',
        isActive: true
      }).populate('ideathonId', 'name slug status').lean();

      if (!ideathonRole) {
        return res.status(403).json({
          success: false,
          message: 'Aktif bir ideathon atamanız bulunmuyor. Lütfen yönetici ile iletişime geçin.'
        });
      }

      // MentorProfile bilgilerini getir
      const MentorProfile = require('../models/MentorProfile');
      const mentorProfile = await MentorProfile.findOne({ userId: user._id })
        .populate('createdBy', 'name email');

      if (!mentorProfile) {
        return res.status(404).json({
          success: false,
          message: 'Mentor profili bulunamadı. Lütfen admin ile iletişime geçin.'
        });
      }

      if (!mentorProfile.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Mentor profiliniz pasif durumda. Yönetici ile iletişime geçin.'
        });
      }

      // JWT token oluştur — ideathonId dahil
      const token = generateToken(user._id, ideathonRole.ideathonId._id, 'mentor', user.sessionVersion);

      // Şifresiz kullanıcı bilgilerini döndür
      const userResponse = {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        ideathon: {
          _id: ideathonRole.ideathonId._id,
          name: ideathonRole.ideathonId.name,
          slug: ideathonRole.ideathonId.slug
        }
      };

      res.status(200).json({
        success: true,
        message: 'Mentor girişi başarılı',
        data: {
          user: userResponse,
          mentorProfile: {
            _id: mentorProfile._id,
            title: mentorProfile.title,
            about: mentorProfile.about,
            linkedin: mentorProfile.linkedin,
            expertiseTags: mentorProfile.expertiseTags,
            photo: mentorProfile.photo,
            photoUrl: mentorProfile.photo 
              ? `${req.protocol}://${req.get('host')}/uploads/mentors/${mentorProfile.photo}`
              : null,
            isActive: mentorProfile.isActive,
            stats: mentorProfile.stats,
            profileCompleteness: mentorProfile.profileCompleteness
          },
          token
        }
      });
    } catch (error) {
      console.error('Mentor login error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Giriş yapılırken hata oluştu'
      });
    }
  }

  // Admin/Superadmin: İdeathon seçerek yeni token al
  // Bu endpoint admin panelinde ideathon dropdown ile çalışır
  async selectIdeathon(req, res) {
    try {
      const { ideathonId } = req.body;

      // Sadece admin/superadmin kullanabilir
      if (!['admin', 'superadmin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Bu işlem sadece admin/superadmin tarafından yapılabilir'
        });
      }

      let selectedIdeathonId = null;

      if (ideathonId && ideathonId !== 'all') {
        const Ideathon = require('../models/Ideathon');
        const ideathon = await Ideathon.findById(ideathonId).lean();
        if (!ideathon) {
          return res.status(404).json({
            success: false,
            message: 'Belirtilen ideathon bulunamadı'
          });
        }
        selectedIdeathonId = ideathon._id;
      }

      // Yeni token oluştur (admin için ideathonId opsiyonel)
      const token = generateToken(req.user._id, selectedIdeathonId, req.user.role, req.user.sessionVersion);

      res.status(200).json({
        success: true,
        message: selectedIdeathonId ? 'İdeathon seçildi' : 'Tüm ideathonlar seçildi',
        data: { token }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'İdeathon seçilirken hata oluştu'
      });
    }
  }

  // 🆕 Profil Bilgilerimi Güncelle (Ad, Soyad, Email)
  async updateProfile(req, res) {
    try {
      const { name, email } = req.body;
      
      if (!name && !email) {
        return res.status(400).json({
          success: false,
          message: 'En az bir alan (name veya email) güncellenmelidir'
        });
      }
      
      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı'
        });
      }
      
      // Email değişiyorsa, benzersizlik kontrolü
      if (email && email !== user.email) {
        const emailExists = await User.findOne({ email: email.toLowerCase() });
        if (emailExists) {
          return res.status(400).json({
            success: false,
            message: 'Daha önce bu e-posta adresi kullanılmıştır.'
          });
        }
        user.email = email.toLowerCase();
      }
      
      if (name) {
        user.name = name;
      }
      
      await user.save();
      
      res.json({
        success: true,
        message: 'Profil başarıyla güncellendi',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('updateProfile error:', error);
      res.status(500).json({
        success: false,
        message: 'Profil güncellenirken hata oluştu',
        error: error.message
      });
    }
  }

  // 🆕 Şifre Değiştir
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;
      
      // Validation
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Tüm alanlar zorunludur'
        });
      }
      
      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Yeni şifreler eşleşmiyor'
        });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Yeni şifre en az 6 karakter olmalıdır'
        });
      }
      
      // Kullanıcıyı bul (şifre ile)
      const user = await User.findById(req.user._id).select('+password');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı'
        });
      }
      
      // Mevcut şifreyi kontrol et
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Mevcut şifre yanlış'
        });
      }
      
      // Yeni şifreyi kaydet
      user.password = newPassword;
      await user.save();
      
      res.json({
        success: true,
        message: 'Şifre başarıyla değiştirildi'
      });
    } catch (error) {
      console.error('changePassword error:', error);
      res.status(500).json({
        success: false,
        message: 'Şifre değiştirilirken hata oluştu',
        error: error.message
      });
    }
  }
}

module.exports = new AuthController();
