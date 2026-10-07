const userService = require('../services/userService');

class UserController {
  // Tüm kullanıcıları listele
  async getAllUsers(req, res) {
    try {
      const filters = {
        role: req.query.role,
        isActive: req.query.isActive === 'true' ? true :
                 req.query.isActive === 'false' ? false : undefined,
        search: req.query.search,
        ideathonId: req.ideathonId || undefined
      };

      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sort: req.query.sort || '-createdAt'
      };

      const result = await userService.getAllUsers(filters, options);

      res.status(200).json({
        success: true,
        data: result.users,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Tek kullanıcı getir
  async getUser(req, res) {
    try {
      const user = await userService.getUserById(req.params.id);

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      const statusCode = error.message.includes('bulunamadı') ||
                        error.message.includes('Geçersiz') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Yeni kullanıcı oluştur
  async createUser(req, res) {
    try {
      const userData = req.body;

      // Validation
      if (!userData.name || !userData.email || !userData.password) {
        return res.status(400).json({
          success: false,
          message: 'İsim, email ve şifre alanları zorunludur'
        });
      }

      // Role validation
      if (userData.role && !['superadmin', 'admin', 'juri', 'user', 'mentor'].includes(userData.role)) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz rol. Geçerli roller: superadmin, admin, juri, user, mentor'
        });
      }

      // ideathonId varsa User modeline dahil et (mentor/juri oluşturulurken)
      if (userData.ideathonId) {
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(userData.ideathonId)) {
          return res.status(400).json({
            success: false,
            message: 'Geçersiz ideathon ID formatı'
          });
        }
      }

      // createdBy: req.user varsa kullan, yoksa null
      const createdBy = req.user ? req.user._id : null;
      const user = await userService.createUser(userData, createdBy);

      res.status(201).json({
        success: true,
        message: 'Kullanıcı başarıyla oluşturuldu',
        data: user
      });
    } catch (error) {
      const statusCode = error.message.includes('zaten') ? 409 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Kullanıcı güncelle
  async updateUser(req, res) {
    try {
      const userId = req.params.id;
      const updateData = req.body;

      // Validation
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Güncellenecek veri bulunamadı'
        });
      }

      // Email format kontrolü
      if (updateData.email) {
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(updateData.email)) {
          return res.status(400).json({
            success: false,
            message: 'Geçerli bir email adresi giriniz'
          });
        }
      }

      // Role validation
      if (updateData.role && !['superadmin', 'admin', 'juri', 'user', 'mentor'].includes(updateData.role)) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz rol. Geçerli roller: superadmin, admin, juri, user, mentor'
        });
      }

      const user = await userService.updateUser(userId, updateData, null);

      res.status(200).json({
        success: true,
        message: 'Kullanıcı başarıyla güncellendi',
        data: user
      });
    } catch (error) {
      const statusCode = error.message.includes('bulunamadı') ||
                        error.message.includes('Geçersiz') ? 404 :
                        error.message.includes('zaten') ? 409 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Kullanıcı sil
  async deleteUser(req, res) {
    try {
      const result = await userService.deleteUser(req.params.id, null);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      const statusCode = error.message.includes('bulunamadı') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Kullanıcı durumunu değiştir (aktif/pasif)
  async toggleUserStatus(req, res) {
    try {
      const { isActive } = req.body;

      if (isActive === undefined) {
        return res.status(400).json({
          success: false,
          message: 'isActive alanı zorunludur'
        });
      }

      const user = await userService.toggleUserStatus(req.params.id, isActive, null);

      res.status(200).json({
        success: true,
        message: `Kullanıcı başarıyla ${isActive ? 'aktifleştirildi' : 'pasifleştirildi'}`,
        data: user
      });
    } catch (error) {
      const statusCode = error.message.includes('bulunamadı') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Aktif juri listesi
  async getActiveJuris(req, res) {
    try {
      const ideathonId = req.ideathonId || undefined;
      const juris = await userService.getActiveJuris(ideathonId);

      res.status(200).json({
        success: true,
        data: juris,
        count: juris.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Juri operation ekle
  async addJuriOperation(req, res) {
    try {
      const { applicationId, action, score, comment } = req.body;

      if (!applicationId || !action) {
        return res.status(400).json({
          success: false,
          message: 'applicationId ve action alanları zorunludur'
        });
      }

      const validActions = ['reviewed', 'scored', 'approved', 'rejected', 'commented'];
      if (!validActions.includes(action)) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz action. Geçerli değerler: ' + validActions.join(', ')
        });
      }

      if (action === 'scored' && (score === undefined || score < 0 || score > 100)) {
        return res.status(400).json({
          success: false,
          message: 'Score 0-100 arası bir değer olmalıdır'
        });
      }

      const result = await userService.addJuriOperation(req.params.id, {
        applicationId,
        action,
        score,
        comment
      });

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      const statusCode = error.message.includes('bulunamadı') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Kullanıcının juri işlemlerini getir
  async getUserJuriOperations(req, res) {
    try {
      const filters = {
        action: req.query.action,
        applicationId: req.query.applicationId
      };

      const operations = await userService.getUserJuriOperations(req.params.id, filters);

      res.status(200).json({
        success: true,
        data: operations,
        count: operations.length
      });
    } catch (error) {
      const statusCode = error.message.includes('bulunamadı') ||
                        error.message.includes('sadece juri') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // === ADMIN/JURI ACCOUNT MANAGEMENT (Superadmin Only) ===

  // Admin/Juri hesaplarını listele
  async getAdminJuriAccounts(req, res) {
    try {
      const filters = {
        role: req.query.role,
        isActive: req.query.isActive === 'true' ? true :
                 req.query.isActive === 'false' ? false : undefined,
        search: req.query.search && req.query.search !== 'undefined' ? req.query.search : undefined,
        ideathonId: req.query.ideathonId && req.query.ideathonId !== 'all' ? req.query.ideathonId : undefined
      };

      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sort: req.query.sort || '-createdAt'
      };

      const result = await userService.getAdminJuriAccounts(filters, options);

      res.status(200).json({
        success: true,
        data: result.accounts,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Admin/Juri hesabı detayı getir
  async getAdminJuriAccount(req, res) {
    try {
      const account = await userService.getAdminJuriAccount(req.params.id);

      res.status(200).json({
        success: true,
        data: account
      });
    } catch (error) {
      const statusCode = error.message.includes('bulunamadı') ||
                        error.message.includes('Geçersiz') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Yeni admin/juri hesabı oluştur
  // Multi-Tenant: Juri hesabı için ideathonId zorunlu
  async createAdminJuriAccount(req, res) {
    try {
      const accountData = req.body;

      // Validation
      if (!accountData.name || !accountData.email || !accountData.password || !accountData.role) {
        return res.status(400).json({
          success: false,
          message: 'İsim, email, şifre ve rol alanları zorunludur'
        });
      }

      // Sadece admin ve juri rolleri kabul edilir (mentor ayrı yönetilir)
      if (!['admin', 'juri'].includes(accountData.role)) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz rol. Sadece admin veya juri rolleri oluşturulabilir'
        });
      }

      // Juri hesabı için ideathonId zorunlu
      if (accountData.role === 'juri' && !accountData.ideathonId) {
        return res.status(400).json({
          success: false,
          message: 'Jüri hesabı oluştururken ideathonId zorunludur'
        });
      }

      const account = await userService.createAdminJuriAccount(accountData, req.user._id);

      res.status(201).json({
        success: true,
        message: 'Admin/Juri hesabı başarıyla oluşturuldu',
        data: account
      });
    } catch (error) {
      const statusCode = error.message.includes('zaten') ? 409 :
                         error.message.includes('zorunlu') ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Admin/Juri hesabı güncelle
  async updateAdminJuriAccount(req, res) {
    try {
      const accountId = req.params.id;
      const updateData = req.body;

      // Validation
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Güncellenecek veri bulunamadı'
        });
      }

      // Email format kontrolü
      if (updateData.email) {
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(updateData.email)) {
          return res.status(400).json({
            success: false,
            message: 'Geçerli bir email adresi giriniz'
          });
        }
      }

      // Rol kontrolü (sadece admin ve juri, mentor ayrı yönetilir)
      if (updateData.role && !['admin', 'juri'].includes(updateData.role)) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz rol. Sadece admin veya juri rolleri kullanılabilir'
        });
      }

      // ideathonId format kontrolü
      if (updateData.ideathonId) {
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(updateData.ideathonId)) {
          return res.status(400).json({
            success: false,
            message: 'Geçersiz ideathon ID formatı'
          });
        }
      }

      const account = await userService.updateAdminJuriAccount(accountId, updateData, req.user._id);

      res.status(200).json({
        success: true,
        message: 'Admin/Juri hesabı başarıyla güncellendi',
        data: account
      });
    } catch (error) {
      const statusCode = error.message.includes('bulunamadı') ||
                        error.message.includes('Geçersiz') ? 404 :
                        error.message.includes('zaten') ? 409 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Admin/Juri hesabı sil
  async deleteAdminJuriAccount(req, res) {
    try {
      const result = await userService.deleteAdminJuriAccount(req.params.id, req.user._id);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      const statusCode = error.message.includes('bulunamadı') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Admin/Juri hesap istatistikleri
  async getAdminJuriStats(req, res) {
    try {
      const stats = await userService.getAdminJuriStats();

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // === CHAT USERS MANAGEMENT (Superadmin/Admin Only) ===

  // Superadmin: Yeni üye oluştur (+ opsiyonel takım ve takım üyeleri)
  async createChatUser(req, res) {
    try {
      const userData = req.body;

      // Temel validation
      if (!userData.name || !userData.email || !userData.password) {
        return res.status(400).json({
          success: false,
          message: 'İsim, email ve şifre alanları zorunludur'
        });
      }

      // ideathonId zorunlu
      if (!userData.ideathonId) {
        return res.status(400).json({
          success: false,
          message: 'İdeathon ID zorunludur'
        });
      }

      // Email format kontrolü
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(userData.email)) {
        return res.status(400).json({
          success: false,
          message: 'Geçerli bir email adresi giriniz'
        });
      }

      // Şifre uzunluğu kontrolü
      if (userData.password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Şifre en az 6 karakter olmalıdır'
        });
      }

      const result = await userService.createChatUser(userData, req.user._id);

      res.status(201).json({
        success: true,
        message: result.team
          ? 'Üye ve takım başarıyla oluşturuldu'
          : 'Üye başarıyla oluşturuldu',
        data: result
      });
    } catch (error) {
      const statusCode = error.message.includes('zaten') ? 409 :
                         error.message.includes('zorunlu') || error.message.includes('Geçersiz') || error.message.includes('geçersiz') ? 400 :
                         error.message.includes('bulunamadı') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Chat userlarını listele (NEW_USERS endpoint)
  async getChatUsers(req, res) {
    try {
      const filters = {
        isActive: req.query.isActive === 'true' ? true :
                 req.query.isActive === 'false' ? false : undefined,
        search: req.query.search && req.query.search !== 'undefined' ? req.query.search : undefined,
        ideathonId: req.ideathonId || undefined
      };

      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sort: req.query.sort || '-createdAt'
      };

      const result = await userService.getChatUsers(filters, options);

      res.status(200).json({
        success: true,
        data: result.users,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Chat user detayını getir
  async getChatUser(req, res) {
    try {
      const user = await userService.getChatUser(req.params.id);

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      const statusCode = error.message.includes('bulunamadı') ||
                        error.message.includes('Geçersiz') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Chat user güncelle (ideathon değişikliği dahil)
  async updateChatUser(req, res) {
    try {
      const userId = req.params.id;
      const updateData = req.body;

      // Validation
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Güncellenecek veri bulunamadı'
        });
      }

      // Email format kontrolü
      if (updateData.email) {
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(updateData.email)) {
          return res.status(400).json({
            success: false,
            message: 'Geçerli bir email adresi giriniz'
          });
        }
      }

      // İdeathonId format kontrolü
      if (updateData.ideathonId) {
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(updateData.ideathonId)) {
          return res.status(400).json({
            success: false,
            message: 'Geçersiz ideathon ID formatı'
          });
        }
      }

      const user = await userService.updateChatUser(userId, updateData, req.user._id);

      res.status(200).json({
        success: true,
        message: 'Chat kullanıcısı başarıyla güncellendi',
        data: user
      });
    } catch (error) {
      const statusCode = error.message.includes('bulunamadı') ||
                        error.message.includes('Geçersiz') ? 404 :
                        error.message.includes('zaten') ? 409 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Chat user sil (soft delete)
  async deleteChatUser(req, res) {
    try {
      const result = await userService.deleteChatUser(req.params.id, req.user._id);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      const statusCode = error.message.includes('bulunamadı') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Chat users istatistikleri
  async getChatUsersStats(req, res) {
    try {
      const stats = await userService.getChatUsersStats(req.ideathonId || null);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Kullanıcı istatistikleri
  async getUserStats(req, res) {
    try {
      const ideathonId = req.ideathonId || undefined;
      const stats = await userService.getUserStats(ideathonId);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ==================== EMAIL TERCİHLERİ ====================

  // Email tercihlerini getir (kendi)
  async getMyEmailPreferences(req, res) {
    try {
      const User = require('../models/User');
      const user = await User.findById(req.user._id).select('emailPreferences');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı'
        });
      }

      res.status(200).json({
        success: true,
        data: user.emailPreferences || {
          meetingCreated: true,
          meetingCancelled: true,
          meetingNoteAdded: true,
          availabilityUpdated: true,
          newMessage: true,
          meetingReminder: true
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Email tercihleri getirilirken hata oluştu',
        error: error.message
      });
    }
  }

  // Email tercihlerini güncelle (kendi)
  async updateMyEmailPreferences(req, res) {
    try {
      const User = require('../models/User');
      const { 
        meetingCreated, 
        meetingCancelled, 
        meetingNoteAdded, 
        availabilityUpdated, 
        newMessage, 
        meetingReminder 
      } = req.body;

      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı'
        });
      }

      // Email tercihlerini güncelle
      if (!user.emailPreferences) {
        user.emailPreferences = {};
      }

      if (meetingCreated !== undefined) user.emailPreferences.meetingCreated = meetingCreated;
      if (meetingCancelled !== undefined) user.emailPreferences.meetingCancelled = meetingCancelled;
      if (meetingNoteAdded !== undefined) user.emailPreferences.meetingNoteAdded = meetingNoteAdded;
      if (availabilityUpdated !== undefined) user.emailPreferences.availabilityUpdated = availabilityUpdated;
      if (newMessage !== undefined) user.emailPreferences.newMessage = newMessage;
      if (meetingReminder !== undefined) user.emailPreferences.meetingReminder = meetingReminder;

      await user.save();

      res.status(200).json({
        success: true,
        message: 'Email tercihleri başarıyla güncellendi',
        data: user.emailPreferences
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Email tercihleri güncellenirken hata oluştu',
        error: error.message
      });
    }
  }
}

module.exports = new UserController();
