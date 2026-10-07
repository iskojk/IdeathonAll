const User = require('../models/User');
const UserIdeathonRole = require('../models/UserIdeathonRole');
const Team = require('../models/Team');

class UserService {
  // Tüm kullanıcıları listele
  async getAllUsers(filters = {}, options = {}) {
    try {
      const { page = 1, limit = 10, sort = '-createdAt' } = options;
      const skip = (page - 1) * limit;

      let query = {};

      // Multi-Tenant: İdeathon seçilmişse, o ideathon'a bağlı kullanıcıları filtrele
      if (filters.ideathonId) {
        const roles = await UserIdeathonRole.find({
          ideathonId: filters.ideathonId,
          isActive: true
        }).select('userId').lean();
        query._id = { $in: roles.map(r => r.userId) };
      }

      // Role filtresi
      if (filters.role) {
        query.role = filters.role;
      }

      // Aktiflik filtresi
      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
      }

      // İsim arama
      if (filters.search) {
        query.name = { $regex: filters.search, $options: 'i' };
      }

      const users = await User.find(query)
        .select('-password') // Şifreyi döndürme
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email');

      const total = await User.countDocuments(query);

      // Multi-Tenant: Her kullanıcı için ideathon rol bilgisini ekle
      const usersWithRoles = await Promise.all(
        users.map(async (user) => {
          const userObj = user.toObject();
          const ideathonRoles = await UserIdeathonRole.find({
            userId: user._id,
            isActive: true
          }).populate('ideathonId', 'name slug status').lean();
          userObj.ideathonRoles = ideathonRoles;
          return userObj;
        })
      );

      return {
        users: usersWithRoles,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Kullanıcılar getirilirken hata oluştu: ${error.message}`);
    }
  }

  // ID'ye göre kullanıcı getir
  async getUserById(userId) {
    try {
      const user = await User.findById(userId)
        .select('-password')
        .populate('createdBy', 'name email');

      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      return user;
    } catch (error) {
      if (error.name === 'CastError') {
        throw new Error('Geçersiz kullanıcı ID');
      }
      throw error;
    }
  }

  // Email'e göre kullanıcı getir
  async getUserByEmail(email) {
    try {
      return await User.findOne({ email: email.toLowerCase() });
    } catch (error) {
      throw new Error(`Email ile kullanıcı aranırken hata oluştu: ${error.message}`);
    }
  }

  // Yeni kullanıcı oluştur
  async createUser(userData, createdBy = null) {
    try {
      // Email kontrolü
      const existingUser = await this.getUserByEmail(userData.email);
      if (existingUser) {
        throw new Error('Bu email adresi zaten kullanılıyor');
      }

      // Superadmin kontrolü - sadece bir superadmin olabilir
      if (userData.role === 'superadmin') {
        const superAdminCount = await User.getSuperAdminCount();
        if (superAdminCount > 0) {
          throw new Error('Sistemde zaten bir superadmin mevcut');
        }
      }

      // Kullanıcı oluştur
      const user = new User({
        ...userData,
        createdBy: createdBy || null
      });

      await user.save();

      // Şifreyi döndürmeden kullanıcıyı getir
      return await this.getUserById(user._id);
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Bu email adresi zaten kullanılıyor');
      }
      throw error;
    }
  }

  // Kullanıcı güncelle
  async updateUser(userId, updateData, updatedBy = null) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      // Email değişikliği kontrolü
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await this.getUserByEmail(updateData.email);
        if (existingUser) {
          throw new Error('Bu email adresi zaten kullanılıyor');
        }
      }

      // Superadmin rolü kontrolü
      if (updateData.role === 'superadmin' && user.role !== 'superadmin') {
        const superAdminCount = await User.getSuperAdminCount();
        if (superAdminCount > 0) {
          throw new Error('Sistemde zaten bir superadmin mevcut');
        }
      }

      // Güncelleme
      Object.keys(updateData).forEach(key => {
        if (key !== 'password' || updateData[key]) { // Boş şifre güncellemesi yapma
          user[key] = updateData[key];
        }
      });

      await user.save();

      return await this.getUserById(user._id);
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Bu email adresi zaten kullanılıyor');
      }
      throw error;
    }
  }

  // Kullanıcı sil (soft delete - isActive = false)
  async deleteUser(userId, deletedBy = null) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      // Superadmin silinemez
      if (user.role === 'superadmin') {
        throw new Error('Superadmin kullanıcısı silinemez');
      }

      // Soft delete
      user.isActive = false;
      await user.save();

      // Multi-Tenant: UserIdeathonRole kayıtlarını da deaktif et
      await UserIdeathonRole.updateMany(
        { userId },
        { isActive: false, lastRoleChangeAt: new Date() }
      );

      // Kullanicinin olusturdugu takimlari da pasife al
      await Team.updateMany(
        { createdBy: userId, isActive: true },
        { isActive: false }
      );

      return { message: 'Kullanıcı başarıyla silindi' };
    } catch (error) {
      throw error;
    }
  }

  // Kullanıcıyı aktifleştir/pasifleştir
  async toggleUserStatus(userId, isActive, updatedBy = null) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      // Superadmin'in durumu değiştirilemez
      if (user.role === 'superadmin') {
        throw new Error('Superadmin kullanıcısının durumu değiştirilemez');
      }

      user.isActive = isActive;
      await user.save();

      // Multi-Tenant: Kullanıcı pasif yapılırsa UserIdeathonRole kayıtlarını da deaktif et
      // Aktif yapılırsa UserIdeathonRole'leri OTOMATİK aktif YAPMA (bilinçli atama gereksin)
      if (!isActive) {
        await UserIdeathonRole.updateMany(
          { userId },
          { isActive: false, lastRoleChangeAt: new Date() }
        );

        // Kullanicinin olusturdugu takimlari da pasife al
        await Team.updateMany(
          { createdBy: userId, isActive: true },
          { isActive: false }
        );
      } else {
        // Kullanici aktif yapilirsa, olusturdugu takimlari da aktife al
        await Team.updateMany(
          { createdBy: userId, isActive: false },
          { isActive: true }
        );
      }

      return await this.getUserById(user._id);
    } catch (error) {
      throw error;
    }
  }

  // Juri listesi getir
  async getActiveJuris(ideathonId = null) {
    try {
      // Multi-Tenant: İdeathon seçilmişse sadece o ideathon'daki jürileri döndür
      if (ideathonId) {
        const juriRoles = await UserIdeathonRole.find({
          ideathonId,
          role: 'juri',
          isActive: true
        }).select('userId').lean();

        const juriUserIds = juriRoles.map(r => r.userId);
        return await User.find({
          _id: { $in: juriUserIds },
          role: 'juri',
          isActive: true
        })
          .select('name email _id')
          .sort('name');
      }

      // Varsayılan: tüm aktif jürileri döndür
      return await User.findActiveJuris()
        .select('name email _id')
        .sort('name');
    } catch (error) {
      throw new Error(`Juri listesi getirilirken hata oluştu: ${error.message}`);
    }
  }

  // Şifre kontrolü
  async validatePassword(userId, password) {
    try {
      const user = await User.findById(userId).select('password');
      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      return await user.comparePassword(password);
    } catch (error) {
      throw error;
    }
  }

  // Juri operation ekle
  async addJuriOperation(userId, operationData) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      if (user.role !== 'juri') {
        throw new Error('Bu işlem sadece juri üyeleri için geçerlidir');
      }

      await user.addJuriOperation(operationData);

      return { message: 'Juri işlemi başarıyla kaydedildi' };
    } catch (error) {
      throw error;
    }
  }

  // Kullanıcının juri işlemlerini getir
  async getUserJuriOperations(userId, filters = {}) {
    try {
      const user = await User.findById(userId).populate({
        path: 'juriOperations.applicationId',
        select: 'title status'
      });

      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      if (user.role !== 'juri') {
        throw new Error('Bu işlem sadece juri üyeleri için geçerlidir');
      }

      let operations = user.juriOperations;

      // Filtreleme
      if (filters.action) {
        operations = operations.filter(op => op.action === filters.action);
      }

      if (filters.applicationId) {
        operations = operations.filter(op => op.applicationId?.toString() === filters.applicationId);
      }

      // Tarihe göre sırala (en yeni önce)
      operations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return operations;
    } catch (error) {
      throw error;
    }
  }

  // === ADMIN/JURI ACCOUNT MANAGEMENT ===

  // Admin/Juri hesaplarını listele (sadece superadmin için)
  async getAdminJuriAccounts(filters = {}, options = {}) {
    try {
      const { page = 1, limit = 10, sort = '-createdAt' } = options;
      const skip = (page - 1) * limit;

      // Sadece admin ve juri rollerini getir (mentor ayrı yönetilir)
      let query = {
        role: { $in: ['admin', 'juri'] }
      };

      // Role filtresi
      if (filters.role && ['admin', 'juri'].includes(filters.role)) {
        query.role = filters.role;
      }

      // Aktiflik filtresi
      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
      }

      // İsim arama
      if (filters.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { email: { $regex: filters.search, $options: 'i' } }
        ];
      }

      // Ideathon filtresi: sadece bu ideathon'a atanmış kullanıcıları getir
      if (filters.ideathonId) {
        const roleRecords = await UserIdeathonRole.find({
          ideathonId: filters.ideathonId,
          isActive: true
        }).select('userId').lean();
        const userIds = roleRecords.map(r => r.userId);
        query._id = { $in: userIds };
      }

      const accounts = await User.find(query)
        .select('-password -juriOperations')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email role');

      const total = await User.countDocuments(query);

      // Multi-Tenant: Her hesap için ideathon rol bilgisini ekle
      const accountsWithRoles = await Promise.all(
        accounts.map(async (account) => {
          const accountObj = account.toObject();
          const roles = await UserIdeathonRole.find({ 
            userId: account._id, 
            isActive: true 
          }).populate('ideathonId', 'name slug status');
          accountObj.ideathonRoles = roles;
          return accountObj;
        })
      );

      return {
        accounts: accountsWithRoles,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalAccounts: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Admin/Juri hesapları getirilirken hata oluştu: ${error.message}`);
    }
  }

  // Admin/Juri hesabı detayı getir
  async getAdminJuriAccount(accountId) {
    try {
      const account = await User.findOne({
        _id: accountId,
        role: { $in: ['admin', 'juri'] }
      })
        .select('-password -juriOperations')
        .populate('createdBy', 'name email role');

      if (!account) {
        throw new Error('Admin/Juri hesabı bulunamadı');
      }

      // Multi-Tenant: İdeathon rol bilgisini ekle
      const accountObj = account.toObject();
      const roles = await UserIdeathonRole.find({ 
        userId: account._id, 
        isActive: true 
      }).populate('ideathonId', 'name slug status');
      accountObj.ideathonRoles = roles;

      return accountObj;
    } catch (error) {
      if (error.name === 'CastError') {
        throw new Error('Geçersiz hesap ID');
      }
      throw error;
    }
  }

  // Yeni admin/juri hesabı oluştur
  // Multi-Tenant: Juri hesabı oluştururken ideathonId zorunlu, UserIdeathonRole kaydı yapılır
  async createAdminJuriAccount(accountData, createdBy) {
    try {
      // Sadece admin ve juri rolleri kabul edilir (mentor ayrı yönetilir)
      if (!accountData.role || !['admin', 'juri'].includes(accountData.role)) {
        throw new Error('Geçersiz rol. Sadece admin veya juri rolleri oluşturulabilir');
      }

      // Jüri hesabı için ideathonId zorunlu
      if (accountData.role === 'juri' && !accountData.ideathonId) {
        throw new Error('Jüri hesabı oluştururken ideathonId zorunludur');
      }

      // Email kontrolü
      const existingUser = await this.getUserByEmail(accountData.email);
      if (existingUser) {
        throw new Error('Bu email adresi zaten kullanılıyor');
      }

      // ideathonId'yi ayır
      const { ideathonId, ...userData } = accountData;

      // Hesap oluştur
      const account = new User({
        ...userData,
        ideathonId: ideathonId || undefined,
        createdBy
      });

      await account.save();

      // Multi-Tenant: Juri ise UserIdeathonRole kaydı oluştur
      if (accountData.role === 'juri' && ideathonId) {
        await UserIdeathonRole.create({
          userId: account._id,
          ideathonId: ideathonId,
          role: 'juri',
          isActive: true,
          assignedBy: createdBy
        });
      }

      return await this.getAdminJuriAccount(account._id);
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Bu email adresi zaten kullanılıyor');
      }
      throw error;
    }
  }

  // Admin/Juri hesabı güncelle
  async updateAdminJuriAccount(accountId, updateData, updatedBy) {
    try {
      const account = await User.findOne({
        _id: accountId,
        role: { $in: ['admin', 'juri'] }
      });

      if (!account) {
        throw new Error('Admin/Juri hesabı bulunamadı');
      }

      // Rol değişikliği kontrolü - sadece admin/juri arası geçişe izin ver
      if (updateData.role && !['admin', 'juri'].includes(updateData.role)) {
        throw new Error('Geçersiz rol. Sadece admin veya juri rolleri kullanılabilir');
      }

      // Email değişikliği kontrolü
      if (updateData.email && updateData.email !== account.email) {
        const existingUser = await this.getUserByEmail(updateData.email);
        if (existingUser) {
          throw new Error('Bu email adresi zaten kullanılıyor');
        }
      }

      // Multi-Tenant: İdeathon ataması değiştiyse UserIdeathonRole güncelle
      const { ideathonId: newIdeathonId, ...restUpdateData } = updateData;
      if (newIdeathonId) {
        const effectiveRole = restUpdateData.role || account.role;
        // Eski atamaları deaktif et
        await UserIdeathonRole.updateMany(
          { userId: accountId, role: 'juri' },
          { isActive: false, lastRoleChangeAt: new Date() }
        );
        // Yeni atama oluştur/güncelle
        await UserIdeathonRole.findOneAndUpdate(
          { userId: accountId, ideathonId: newIdeathonId, role: effectiveRole },
          { isActive: true, assignedBy: updatedBy, lastRoleChangeAt: new Date() },
          { upsert: true, new: true }
        );

        // User.ideathonId'yi de güncelle
        account.ideathonId = newIdeathonId;
      } else if (restUpdateData.role && restUpdateData.role !== account.role) {
        // Rol değişti ama ideathon değişmedi — mevcut atamalardaki rolleri güncelle
        await UserIdeathonRole.updateMany(
          { userId: accountId, role: account.role, isActive: true },
          { role: restUpdateData.role, lastRoleChangeAt: new Date() }
        );
      }

      // User güncelleme
      Object.keys(restUpdateData).forEach(key => {
        if (key !== 'password' || restUpdateData[key]) {
          account[key] = restUpdateData[key];
        }
      });

      await account.save();

      return await this.getAdminJuriAccount(account._id);
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Bu email adresi zaten kullanılıyor');
      }
      throw error;
    }
  }

  // Admin/Juri hesabı sil (soft delete)
  async deleteAdminJuriAccount(accountId, deletedBy) {
    try {
      const account = await User.findOne({
        _id: accountId,
        role: { $in: ['admin', 'juri'] }
      });

      if (!account) {
        throw new Error('Admin/Juri hesabı bulunamadı');
      }

      // Soft delete
      account.isActive = false;
      await account.save();

      // Multi-Tenant: UserIdeathonRole kayıtlarını da pasifleştir
      await UserIdeathonRole.updateMany(
        { userId: accountId },
        { isActive: false }
      );

      // Iliskili takimlari da pasife al
      await Team.updateMany(
        { createdBy: accountId, isActive: true },
        { isActive: false }
      );

      return { message: 'Admin/Juri hesabı başarıyla silindi' };
    } catch (error) {
      throw error;
    }
  }

  // Admin/Juri hesap istatistikleri
  async getAdminJuriStats() {
    try {
      const stats = await User.aggregate([
        {
          $match: {
            role: { $in: ['admin', 'juri'] }
          }
        },
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
            activeCount: {
              $sum: { $cond: ['$isActive', 1, 0] }
            }
          }
        }
      ]);

      const totalAccounts = await User.countDocuments({
        role: { $in: ['admin', 'juri'] }
      });

      const activeAccounts = await User.countDocuments({
        role: { $in: ['admin', 'juri'] },
        isActive: true
      });

      return {
        total: totalAccounts,
        active: activeAccounts,
        inactive: totalAccounts - activeAccounts,
        byRole: stats.reduce((acc, stat) => {
          acc[stat._id] = {
            total: stat.count,
            active: stat.activeCount,
            inactive: stat.count - stat.activeCount
          };
          return acc;
        }, {})
      };
    } catch (error) {
      throw new Error(`Admin/Juri istatistikleri alınırken hata oluştu: ${error.message}`);
    }
  }

  // === CHAT USERS MANAGEMENT ===

  // Superadmin: Yeni chat user (üye) oluştur + opsiyonel takım
  async createChatUser(userData, createdBy) {
    try {
      const Team = require('../models/Team');
      const Ideathon = require('../models/Ideathon');

      // Email kontrolü
      const existingUser = await this.getUserByEmail(userData.email);
      if (existingUser) {
        throw new Error('Bu email adresi zaten kullanılıyor');
      }

      // ideathonId zorunlu
      if (!userData.ideathonId) {
        throw new Error('İdeathon ID zorunludur. Kullanıcının hangi ideathon\'a bağlanacağı belirtilmelidir');
      }

      // İdeathon varlığını kontrol et
      const ideathon = await Ideathon.findById(userData.ideathonId);
      if (!ideathon) {
        throw new Error('Belirtilen ideathon bulunamadı');
      }

      // Kullanıcı oluştur (her zaman role: 'user')
      const user = new User({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        phone: userData.phone || undefined,
        role: 'user',
        ideathonId: userData.ideathonId,
        isActive: true,
        createdBy: createdBy
      });

      await user.save();

      let team = null;

      // Takım bilgisi gönderildiyse takım oluştur
      if (userData.teamName) {
        // Aynı ideathon'da aynı takım adıyla takım var mı kontrol et
        const existingTeam = await Team.findOne({
          ideathonId: userData.ideathonId,
          teamName: userData.teamName,
          isActive: true
        });

        if (existingTeam) {
          throw new Error(`"${userData.teamName}" isimli takım bu ideathon'da zaten mevcut`);
        }

        // Takım üyelerini hazırla (başvuru/profil mantığıyla — oluşturulan kullanıcı dahil EDİLMEZ)
        const members = [];

        if (userData.teamMembers && Array.isArray(userData.teamMembers)) {
          for (const member of userData.teamMembers) {
            if (!member.name) {
              throw new Error('Her takım üyesinin adı zorunludur');
            }

            // TC Kimlik No validation
            if (member.tcIdentity && !/^[0-9]{11}$/.test(member.tcIdentity)) {
              throw new Error(`${member.name} için geçersiz TC Kimlik No. 11 haneli sayı olmalıdır`);
            }

            members.push({
              name: member.name.trim(),
              tcIdentity: member.tcIdentity || undefined,
              email: member.email || undefined,
              role: member.role || 'Üye',
              joinedAt: new Date()
            });
          }
        }

        // Takım oluştur
        team = new Team({
          ideathonId: userData.ideathonId,
          teamName: userData.teamName.trim(),
          teamDescription: userData.teamDescription || undefined,
          city: userData.city || undefined,
          members: members,
          createdBy: user._id,
          creationMethod: 'manual',
          isActive: true
        });

        await team.save();
      }

      // Oluşturulan kullanıcıyı döndür (takım + ideathon bilgisiyle)
      return await this._enrichChatUser(user._id);
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Bu email adresi zaten kullanılıyor');
      }
      throw error;
    }
  }

  // HELPER: Chat user'a takım ve ideathon bilgisini ekle
  async _enrichChatUser(userId) {
    const Team = require('../models/Team');
    const Ideathon = require('../models/Ideathon');

    const user = await User.findById(userId)
      .select('-password -juriOperations')
      .populate('createdBy', 'name email role')
      .lean();

    if (!user) return null;

    // İdeathon bilgisi (id + isim)
    let ideathonInfo = null;
    if (user.ideathonId) {
      const ideathon = await Ideathon.findById(user.ideathonId)
        .select('name slug status')
        .lean();
      if (ideathon) {
        ideathonInfo = {
          _id: ideathon._id,
          name: ideathon.name,
          slug: ideathon.slug,
          status: ideathon.status
        };
      }
    }
    user.ideathon = ideathonInfo;

    // Takım bilgisi — createdBy ile veya Application'daki teamInfo ile bul
    let teamInfo = null;

    // 1. Önce Team modelinden bak (createdBy ile)
    const team = await Team.findOne({
      createdBy: userId,
      isActive: true
    }).lean();

    if (team) {
      teamInfo = {
        _id: team._id,
        teamName: team.teamName,
        teamDescription: team.teamDescription || null,
        city: team.city || null,
        members: team.members || [],
        memberCount: (team.members || []).length,
        createdAt: team.createdAt
      };
    } else {
      // 2. Application modelinden bak (teamInfo ile)
      const Application = require('../models/Application');
      const application = await Application.findOne({
        userId: userId,
        status: 'approved',
        'teamInfo.isInTeam': true
      }).select('teamInfo').lean();

      if (application && application.teamInfo) {
        teamInfo = {
          _id: null,
          teamName: application.teamInfo.teamName || null,
          teamDescription: null,
          city: null,
          members: (application.teamInfo.teamMembers || []).map(m => ({
            name: m.name,
            tcIdentity: m.tcIdentity || null,
            role: m.role || 'Üye'
          })),
          memberCount: (application.teamInfo.teamMembers || []).length,
          createdAt: null
        };
      }
    }
    user.team = teamInfo;

    return user;
  }

  // Chat userlarını listele (sadece user rolü için)
  async getChatUsers(filters = {}, options = {}) {
    try {
      const { page = 1, limit = 10, sort = '-createdAt' } = options;
      const skip = (page - 1) * limit;
      const Team = require('../models/Team');
      const Ideathon = require('../models/Ideathon');

      // Sadece user rolünü getir
      let query = {
        role: 'user'
      };

      // Multi-Tenant: İdeathon filtresi
      if (filters.ideathonId) {
        query.ideathonId = filters.ideathonId;
      }

      // Aktiflik filtresi
      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
      }

      // İsim arama
      if (filters.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { email: { $regex: filters.search, $options: 'i' } }
        ];
      }

      // Pasif kullanicilar her zaman en sona
      let sortObj = {};
      if (typeof sort === 'string') {
        const desc = sort.startsWith('-');
        const field = desc ? sort.substring(1) : sort;
        sortObj = { isActive: -1, [field]: desc ? -1 : 1 };
      } else {
        sortObj = { isActive: -1, ...sort };
      }

      const users = await User.find(query)
        .select('-password -juriOperations')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email role')
        .lean();

      const total = await User.countDocuments(query);

      // Her kullanıcıya takım + ideathon bilgisi ekle
      const userIds = users.map(u => u._id);

      // Toplu takım sorgusu (performans için)
      const teams = await Team.find({
        createdBy: { $in: userIds },
        isActive: true
      }).lean();
      const teamMap = new Map();
      teams.forEach(t => {
        teamMap.set(t.createdBy.toString(), {
          _id: t._id,
          teamName: t.teamName,
          teamDescription: t.teamDescription || null,
          city: t.city || null,
          members: t.members || [],
          memberCount: (t.members || []).length,
          createdAt: t.createdAt
        });
      });

      // Toplu ideathon sorgusu
      const ideathonIds = [...new Set(users.filter(u => u.ideathonId).map(u => u.ideathonId.toString()))];
      const ideathons = await Ideathon.find({ _id: { $in: ideathonIds } })
        .select('name slug status')
        .lean();
      const ideathonMap = new Map();
      ideathons.forEach(i => {
        ideathonMap.set(i._id.toString(), {
          _id: i._id,
          name: i.name,
          slug: i.slug,
          status: i.status
        });
      });

      // Application'dan takım bilgisi olmayanlar için
      const usersWithoutTeam = userIds.filter(id => !teamMap.has(id.toString()));
      let appTeamMap = new Map();
      if (usersWithoutTeam.length > 0) {
        const Application = require('../models/Application');
        const applications = await Application.find({
          userId: { $in: usersWithoutTeam },
          status: 'approved',
          'teamInfo.isInTeam': true
        }).select('userId teamInfo').lean();

        applications.forEach(app => {
          if (app.teamInfo) {
            appTeamMap.set(app.userId.toString(), {
              _id: null,
              teamName: app.teamInfo.teamName || null,
              teamDescription: null,
              city: null,
              members: (app.teamInfo.teamMembers || []).map(m => ({
                name: m.name,
                tcIdentity: m.tcIdentity || null,
                role: m.role || 'Üye'
              })),
              memberCount: (app.teamInfo.teamMembers || []).length,
              createdAt: null
            });
          }
        });
      }

      // Kullanıcılara takım + ideathon bilgisi ekle
      const enrichedUsers = users.map(user => {
        const uid = user._id.toString();
        user.team = teamMap.get(uid) || appTeamMap.get(uid) || null;
        user.ideathon = user.ideathonId
          ? (ideathonMap.get(user.ideathonId.toString()) || null)
          : null;
        return user;
      });

      return {
        users: enrichedUsers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Chat kullanıcıları getirilirken hata oluştu: ${error.message}`);
    }
  }

  // Chat user detayını getir
  async getChatUser(userId) {
    try {
      const userExists = await User.findOne({
        _id: userId,
        role: 'user'
      });

      if (!userExists) {
        throw new Error('Chat kullanıcısı bulunamadı');
      }

      return await this._enrichChatUser(userId);
    } catch (error) {
      if (error.name === 'CastError') {
        throw new Error('Geçersiz kullanıcı ID');
      }
      throw error;
    }
  }

  // Chat user güncelle
  async updateChatUser(userId, updateData, updatedBy) {
    try {
      const user = await User.findOne({
        _id: userId,
        role: 'user'
      });

      if (!user) {
        throw new Error('Chat kullanıcısı bulunamadı');
      }

      // Email değişikliği kontrolü
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await this.getUserByEmail(updateData.email);
        if (existingUser) {
          throw new Error('Bu email adresi zaten kullanılıyor');
        }
      }

      // İdeathon değişikliği kontrolü
      if (updateData.ideathonId) {
        const Ideathon = require('../models/Ideathon');
        const ideathon = await Ideathon.findById(updateData.ideathonId);
        if (!ideathon) {
          throw new Error('Belirtilen ideathon bulunamadı');
        }
        user.ideathonId = updateData.ideathonId;
      }

      // Güncellenebilir alanlar
      const allowedFields = ['name', 'email', 'phone', 'isActive'];
      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key) && updateData[key] !== undefined) {
          user[key] = updateData[key];
        }
      });

      await user.save();

      return await this._enrichChatUser(user._id);
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Bu email adresi zaten kullanılıyor');
      }
      throw error;
    }
  }

  // Chat user sil (soft delete)
  async deleteChatUser(userId, deletedBy) {
    try {
      const user = await User.findOne({
        _id: userId,
        role: 'user'
      });

      if (!user) {
        throw new Error('Chat kullanıcısı bulunamadı');
      }

      // Soft delete
      user.isActive = false;
      await user.save();

      // Kullanicinin olusturdugu takimlari da pasife al
      await Team.updateMany(
        { createdBy: userId, isActive: true },
        { isActive: false }
      );

      return { message: 'Chat kullanıcısı başarıyla silindi' };
    } catch (error) {
      throw error;
    }
  }

  // Chat users istatistikleri
  async getChatUsersStats(ideathonId = null) {
    try {
      const baseQuery = { role: 'user' };

      // Multi-Tenant: İdeathon filtresi
      if (ideathonId) {
        baseQuery.ideathonId = ideathonId;
      }

      const totalUsers = await User.countDocuments(baseQuery);

      const activeUsers = await User.countDocuments({
        ...baseQuery,
        isActive: true
      });

      return {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers
      };
    } catch (error) {
      throw new Error(`Chat kullanıcıları istatistikleri alınırken hata oluştu: ${error.message}`);
    }
  }

  // İstatistikler
  async getUserStats(ideathonId = null) {
    try {
      // Multi-Tenant: İdeathon seçilmişse sadece o ideathon'a bağlı kullanıcı istatistikleri
      if (ideathonId) {
        const roles = await UserIdeathonRole.find({
          ideathonId,
          isActive: true
        }).select('userId role').lean();

        const userIds = [...new Set(roles.map(r => r.userId.toString()))];
        const userObjectIds = userIds.map(id => require('mongoose').Types.ObjectId(id));

        const stats = await User.aggregate([
          { $match: { _id: { $in: userObjectIds } } },
          {
            $group: {
              _id: '$role',
              count: { $sum: 1 },
              activeCount: {
                $sum: { $cond: ['$isActive', 1, 0] }
              }
            }
          }
        ]);

        const totalUsers = await User.countDocuments({ _id: { $in: userObjectIds } });
        const activeUsers = await User.countDocuments({ _id: { $in: userObjectIds }, isActive: true });

        return {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
          byRole: stats.reduce((acc, stat) => {
            acc[stat._id] = {
              total: stat.count,
              active: stat.activeCount,
              inactive: stat.count - stat.activeCount
            };
            return acc;
          }, {}),
          ideathonId
        };
      }

      // Varsayılan: tüm kullanıcı istatistikleri
      const stats = await User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
            activeCount: {
              $sum: { $cond: ['$isActive', 1, 0] }
            }
          }
        }
      ]);

      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ isActive: true });

      return {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        byRole: stats.reduce((acc, stat) => {
          acc[stat._id] = {
            total: stat.count,
            active: stat.activeCount,
            inactive: stat.count - stat.activeCount
          };
          return acc;
        }, {})
      };
    } catch (error) {
      throw new Error(`İstatistikler alınırken hata oluştu: ${error.message}`);
    }
  }
}

module.exports = new UserService();













