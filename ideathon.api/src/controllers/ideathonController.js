const Ideathon = require('../models/Ideathon');
const UserIdeathonRole = require('../models/UserIdeathonRole');
const { clearSlugCache } = require('../middleware/auth');

class IdeathonController {
  // Tüm ideathon'ları listele (Admin/Superadmin)
  async list(req, res) {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const filter = {};
      if (status) filter.status = status;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [ideathons, total] = await Promise.all([
        Ideathon.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .populate('createdBy', 'name email')
          .lean(),
        Ideathon.countDocuments(filter)
      ]);

      res.status(200).json({
        success: true,
        data: ideathons,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'İdeathonlar listelenirken hata oluştu'
      });
    }
  }

  // Tekil ideathon getir
  async getById(req, res) {
    try {
      const ideathon = await Ideathon.findById(req.params.id)
        .populate('createdBy', 'name email')
        .lean();

      if (!ideathon) {
        return res.status(404).json({
          success: false,
          message: 'İdeathon bulunamadı'
        });
      }

      // İlgili rol istatistikleri
      const [juriCount, mentorCount] = await Promise.all([
        UserIdeathonRole.countDocuments({ ideathonId: ideathon._id, role: 'juri', isActive: true }),
        UserIdeathonRole.countDocuments({ ideathonId: ideathon._id, role: 'mentor', isActive: true })
      ]);

      res.status(200).json({
        success: true,
        data: {
          ...ideathon,
          stats: { juriCount, mentorCount }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'İdeathon bilgisi alınırken hata oluştu'
      });
    }
  }

  // Yeni ideathon oluştur (Superadmin)
  async create(req, res) {
    try {
      const { name, slug, description, status, startDate, endDate, phases, settings, registrationOpen, applicationOpen, individualApplicationOpen, teamCreationOpen, presentationUploadOpen, applicationEditOpen, type, evaluationCriteria } = req.body;

      if (!name || !slug) {
        return res.status(400).json({
          success: false,
          message: 'name ve slug alanları zorunludur'
        });
      }

      // evaluationCriteria validasyonu
      if (evaluationCriteria && Array.isArray(evaluationCriteria)) {
        const keys = evaluationCriteria.map(c => c.key);
        const uniqueKeys = new Set(keys);
        if (keys.length !== uniqueKeys.size) {
          return res.status(400).json({
            success: false,
            message: 'evaluationCriteria içinde tekrar eden key değerleri var'
          });
        }
        for (const c of evaluationCriteria) {
          if (!c.key || !c.name || !c.maxScore || c.maxScore < 1) {
            return res.status(400).json({
              success: false,
              message: 'Her kriter için key, name ve maxScore (min 1) zorunludur'
            });
          }
        }
      }

      const createData = {
        name,
        slug,
        description,
        status: status || 'draft',
        startDate,
        endDate,
        phases,
        settings,
        createdBy: req.user._id
      };

      if (type !== undefined) createData.type = type;
      if (evaluationCriteria !== undefined) createData.evaluationCriteria = evaluationCriteria;

      if (registrationOpen !== undefined) createData.registrationOpen = registrationOpen;
      if (applicationOpen !== undefined) createData.applicationOpen = applicationOpen;
      if (individualApplicationOpen !== undefined) createData.individualApplicationOpen = individualApplicationOpen;
      if (teamCreationOpen !== undefined) createData.teamCreationOpen = teamCreationOpen;
      if (presentationUploadOpen !== undefined) createData.presentationUploadOpen = presentationUploadOpen;
      if (applicationEditOpen !== undefined) createData.applicationEditOpen = applicationEditOpen;

      const ideathon = await Ideathon.create(createData);

      res.status(201).json({
        success: true,
        message: 'İdeathon başarıyla oluşturuldu',
        data: ideathon
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'Bu slug zaten kullanılıyor'
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || 'İdeathon oluşturulurken hata oluştu'
      });
    }
  }

  // İdeathon güncelle (Superadmin)
  async update(req, res) {
    try {
      const { name, slug, description, status, startDate, endDate, phases, settings, registrationOpen, applicationOpen, individualApplicationOpen, teamCreationOpen, presentationUploadOpen, applicationEditOpen, type, evaluationCriteria } = req.body;

      const ideathon = await Ideathon.findById(req.params.id);
      if (!ideathon) {
        return res.status(404).json({
          success: false,
          message: 'İdeathon bulunamadı'
        });
      }

      // evaluationCriteria validasyonu
      if (evaluationCriteria !== undefined && Array.isArray(evaluationCriteria)) {
        const keys = evaluationCriteria.map(c => c.key);
        const uniqueKeys = new Set(keys);
        if (keys.length !== uniqueKeys.size) {
          return res.status(400).json({
            success: false,
            message: 'evaluationCriteria içinde tekrar eden key değerleri var'
          });
        }
        for (const c of evaluationCriteria) {
          if (!c.key || !c.name || !c.maxScore || c.maxScore < 1) {
            return res.status(400).json({
              success: false,
              message: 'Her kriter için key, name ve maxScore (min 1) zorunludur'
            });
          }
        }
      }

      const oldSlug = ideathon.slug;

      if (name !== undefined) ideathon.name = name;
      if (slug !== undefined) ideathon.slug = slug;
      if (description !== undefined) ideathon.description = description;
      if (status !== undefined) ideathon.status = status;
      if (startDate !== undefined) ideathon.startDate = startDate;
      if (endDate !== undefined) ideathon.endDate = endDate;
      if (phases !== undefined) ideathon.phases = { ...ideathon.phases, ...phases };
      if (settings !== undefined) ideathon.settings = { ...ideathon.settings, ...settings };

      if (type !== undefined) ideathon.type = type;
      if (evaluationCriteria !== undefined) ideathon.evaluationCriteria = evaluationCriteria;

      if (registrationOpen !== undefined) ideathon.registrationOpen = registrationOpen;
      if (applicationOpen !== undefined) ideathon.applicationOpen = applicationOpen;
      if (individualApplicationOpen !== undefined) ideathon.individualApplicationOpen = individualApplicationOpen;
      if (teamCreationOpen !== undefined) ideathon.teamCreationOpen = teamCreationOpen;
      if (presentationUploadOpen !== undefined) ideathon.presentationUploadOpen = presentationUploadOpen;
      if (applicationEditOpen !== undefined) ideathon.applicationEditOpen = applicationEditOpen;

      await ideathon.save();

      // Slug değiştiyse cache'i temizle
      if (slug && slug !== oldSlug) {
        clearSlugCache(oldSlug);
        clearSlugCache(slug);
      }

      res.status(200).json({
        success: true,
        message: 'İdeathon başarıyla güncellendi',
        data: ideathon
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'Bu slug zaten kullanılıyor'
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || 'İdeathon güncellenirken hata oluştu'
      });
    }
  }

  // İdeathon sil (Superadmin) — soft delete değil; dikkatli kullanılmalı
  async delete(req, res) {
    try {
      const ideathon = await Ideathon.findById(req.params.id);
      if (!ideathon) {
        return res.status(404).json({
          success: false,
          message: 'İdeathon bulunamadı'
        });
      }

      // Atanmış aktif kullanıcı var mı kontrol et
      const activeRoles = await UserIdeathonRole.countDocuments({
        ideathonId: ideathon._id,
        isActive: true
      });

      if (activeRoles > 0) {
        return res.status(400).json({
          success: false,
          message: `Bu ideathon'a ${activeRoles} aktif kullanıcı atanmış. Önce atamaları kaldırın.`
        });
      }

      await ideathon.deleteOne();
      clearSlugCache(ideathon.slug);

      res.status(200).json({
        success: true,
        message: 'İdeathon başarıyla silindi'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'İdeathon silinirken hata oluştu'
      });
    }
  }

  // İdeathon'a kullanıcı ata (jüri/mentor) — Superadmin
  async assignUser(req, res) {
    try {
      const { userId, role } = req.body;
      const { id: ideathonId } = req.params;

      if (!userId || !role) {
        return res.status(400).json({
          success: false,
          message: 'userId ve role alanları zorunludur'
        });
      }

      if (!['juri', 'mentor'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Geçerli roller: juri, mentor'
        });
      }

      // Ideathon var mı?
      const ideathon = await Ideathon.findById(ideathonId);
      if (!ideathon) {
        return res.status(404).json({
          success: false,
          message: 'İdeathon bulunamadı'
        });
      }

      // Kullanıcı var mı?
      const User = require('../models/User');
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı'
        });
      }

      // Kullanıcının rolü uyumlu mu?
      if (user.role !== role) {
        // User tablosundaki rolü güncelle
        user.role = role;
        await user.save();
      }

      // Atama yap (upsert)
      const assignment = await UserIdeathonRole.findOneAndUpdate(
        { userId, ideathonId, role },
        {
          userId,
          ideathonId,
          role,
          isActive: true,
          assignedBy: req.user._id,
          lastRoleChangeAt: new Date()
        },
        { upsert: true, new: true }
      ).populate('userId', 'name email')
       .populate('ideathonId', 'name slug');

      res.status(200).json({
        success: true,
        message: `Kullanıcı ${role} olarak ideathon'a atandı`,
        data: assignment
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'Bu kullanıcı zaten bu ideathon\'a bu rolle atanmış'
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || 'Kullanıcı atanırken hata oluştu'
      });
    }
  }

  // İdeathon'dan kullanıcı atamasını kaldır — Superadmin
  async unassignUser(req, res) {
    try {
      const { userId, role } = req.body;
      const { id: ideathonId } = req.params;

      const assignment = await UserIdeathonRole.findOneAndUpdate(
        { userId, ideathonId, role },
        { isActive: false, lastRoleChangeAt: new Date() },
        { new: true }
      );

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Atama bulunamadı'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Kullanıcı ataması kaldırıldı',
        data: assignment
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Atama kaldırılırken hata oluştu'
      });
    }
  }

  // İdeathon'daki kullanıcıları listele
  async listUsers(req, res) {
    try {
      const { id: ideathonId } = req.params;
      const { role } = req.query;

      const filter = { ideathonId, isActive: true };
      if (role) filter.role = role;

      const assignments = await UserIdeathonRole.find(filter)
        .populate('userId', 'name email phone role isActive')
        .populate('assignedBy', 'name email')
        .sort({ createdAt: -1 })
        .lean();

      res.status(200).json({
        success: true,
        data: assignments
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Kullanıcılar listelenirken hata oluştu'
      });
    }
  }

  // ═══════════════════════════════════════════════════════════
  // PUBLIC ENDPOINT: Slug ile ideathon durumlarını getir
  // ═══════════════════════════════════════════════════════════
  // Frontend kullanıcı paneli bu endpoint'i çağırarak:
  //   - registrationOpen (Kayıt ol aç/kapat)
  //   - applicationOpen (Başvuru yap aç/kapat)
  //   - individualApplicationOpen (Bireysel başvuru aç/kapat)
  // durumlarını öğrenir.
  async getPublicBySlug(req, res) {
    try {
      const { slug } = req.params;

      if (!slug) {
        return res.status(400).json({
          success: false,
          message: 'Slug parametresi zorunludur'
        });
      }

      const ideathon = await Ideathon.findOne({ slug })
        .select('_id name slug status description startDate endDate phases registrationOpen applicationOpen individualApplicationOpen teamCreationOpen presentationUploadOpen applicationEditOpen settings.maxTeamSize settings.requireTeam')
        .lean();

      if (!ideathon) {
        return res.status(404).json({
          success: false,
          message: 'İdeathon bulunamadı'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          _id: ideathon._id,
          name: ideathon.name,
          slug: ideathon.slug,
          status: ideathon.status,
          description: ideathon.description,
          startDate: ideathon.startDate,
          endDate: ideathon.endDate,
          phases: ideathon.phases,
          // Açma/Kapama kontrolleri
          registrationOpen: ideathon.registrationOpen,
          applicationOpen: ideathon.applicationOpen,
          individualApplicationOpen: ideathon.individualApplicationOpen,
          teamCreationOpen: ideathon.teamCreationOpen,
          presentationUploadOpen: ideathon.presentationUploadOpen,
          applicationEditOpen: ideathon.applicationEditOpen,
          // Ayarlar
          maxTeamSize: ideathon.settings?.maxTeamSize || 5,
          requireTeam: ideathon.settings?.requireTeam || false
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'İdeathon bilgisi alınırken hata oluştu'
      });
    }
  }

  // Dropdown için kısa ideathon listesi (id + name + slug)
  async listDropdown(req, res) {
    try {
      const ideathons = await Ideathon.find({ status: { $in: ['active', 'draft'] } })
        .select('_id name slug status')
        .sort({ createdAt: -1 })
        .lean();

      res.status(200).json({
        success: true,
        data: ideathons
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'İdeathonlar listelenirken hata oluştu'
      });
    }
  }
}

module.exports = new IdeathonController();





