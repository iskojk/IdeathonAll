const Team = require('../models/Team');
const Ideathon = require('../models/Ideathon');
const User = require('../models/User');
const Application = require('../models/Application');
const applicationService = require('../services/applicationService');

class TeamController {

  /**
   * Takımları listele (ideathon bazlı)
   * GET /api/teams?ideathonId=xxx
   */
  async list(req, res) {
    try {
      const ideathonId = req.ideathonId;
      if (!ideathonId) {
        return res.status(400).json({
          success: false,
          message: 'ideathonId zorunludur (X-Ideathon-Id header veya ?ideathonId query)'
        });
      }

      const { page = 1, limit = 50, search } = req.query;
      const filter = { ideathonId, isActive: true };

      if (search) {
        filter.teamName = { $regex: search, $options: 'i' };
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [teams, total] = await Promise.all([
        Team.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .populate('createdBy', 'name email phone')
          .lean(),
        Team.countDocuments(filter)
      ]);

      res.status(200).json({
        success: true,
        data: teams,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Takım listeleme hatası:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Takımlar listelenirken hata oluştu'
      });
    }
  }

  /**
   * Takım detayı
   * GET /api/teams/:teamId
   */
  async getById(req, res) {
    try {
      const team = await Team.findById(req.params.teamId)
        .populate('createdBy', 'name email phone')
        .lean();

      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Takım bulunamadı'
        });
      }

      res.status(200).json({
        success: true,
        data: team
      });
    } catch (error) {
      console.error('Takım detay hatası:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Takım bilgisi alınırken hata oluştu'
      });
    }
  }

  /**
   * Yeni takım oluştur
   * POST /api/teams
   * Body: { ideathonId, teamName, teamDescription?, city?, members?: [] }
   */
  async create(req, res) {
    try {
      const ideathonId = req.ideathonId;
      if (!ideathonId) {
        return res.status(400).json({
          success: false,
          message: 'ideathonId zorunludur'
        });
      }

      const { teamName, teamDescription, city, members } = req.body;

      if (!teamName || !teamName.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Takım adı zorunludur'
        });
      }

      const existing = await Team.findOne({
        ideathonId,
        teamName: teamName.trim(),
        isActive: true
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Bu ideathon\'da aynı isimde aktif bir takım zaten var'
        });
      }

      const teamData = {
        ideathonId,
        teamName: teamName.trim(),
        teamDescription: teamDescription || '',
        city: city || '',
        members: Array.isArray(members) ? members : [],
        createdBy: req.user._id,
        creationMethod: 'manual'
      };

      const team = await Team.create(teamData);

      res.status(201).json({
        success: true,
        message: 'Takım başarıyla oluşturuldu',
        data: team
      });
    } catch (error) {
      console.error('Takım oluşturma hatası:', error);
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({ success: false, message: 'Validasyon hatası', errors });
      }
      res.status(500).json({
        success: false,
        message: error.message || 'Takım oluşturulurken hata oluştu'
      });
    }
  }

  /**
   * Takım bilgilerini güncelle
   * PUT /api/teams/:teamId
   * Body: { teamName?, teamDescription?, city? }
   */
  async update(req, res) {
    try {
      const team = await Team.findById(req.params.teamId);
      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Takım bulunamadı'
        });
      }

      const { teamName, teamDescription, city } = req.body;

      if (teamName !== undefined) {
        if (!teamName.trim()) {
          return res.status(400).json({
            success: false,
            message: 'Takım adı boş olamaz'
          });
        }
        const duplicate = await Team.findOne({
          ideathonId: team.ideathonId,
          teamName: teamName.trim(),
          isActive: true,
          _id: { $ne: team._id }
        });
        if (duplicate) {
          return res.status(409).json({
            success: false,
            message: 'Bu ideathon\'da aynı isimde aktif bir takım zaten var'
          });
        }
        team.teamName = teamName.trim();
      }
      if (teamDescription !== undefined) team.teamDescription = teamDescription;
      if (city !== undefined) team.city = city;

      await team.save();

      res.status(200).json({
        success: true,
        message: 'Takım başarıyla güncellendi',
        data: team
      });
    } catch (error) {
      console.error('Takım güncelleme hatası:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Takım güncellenirken hata oluştu'
      });
    }
  }

  /**
   * Takımı deaktif et (soft delete)
   * DELETE /api/teams/:teamId
   */
  async delete(req, res) {
    try {
      const team = await Team.findById(req.params.teamId);
      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Takım bulunamadı'
        });
      }

      team.isActive = false;
      await team.save();

      res.status(200).json({
        success: true,
        message: 'Takım başarıyla deaktif edildi'
      });
    } catch (error) {
      console.error('Takım silme hatası:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Takım silinirken hata oluştu'
      });
    }
  }

  /**
   * Takıma üye ekle
   * POST /api/teams/:teamId/members
   * Body: { name, email?, tcIdentity?, role? }
   */
  async addMember(req, res) {
    try {
      const team = await Team.findById(req.params.teamId);
      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Takım bulunamadı'
        });
      }

      const { name, email, tcIdentity, role } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Üye adı zorunludur'
        });
      }

      const ideathon = await Ideathon.findById(team.ideathonId).select('settings.maxTeamSize').lean();
      const maxTeamSize = ideathon?.settings?.maxTeamSize || 5;

      if (team.members.length >= maxTeamSize) {
        return res.status(400).json({
          success: false,
          message: `Takım en fazla ${maxTeamSize} üye içerebilir`
        });
      }

      const member = {
        name: name.trim(),
        email: email || '',
        tcIdentity: tcIdentity || '',
        role: role || 'Üye',
        joinedAt: new Date()
      };

      team.members.push(member);
      await team.save();

      try {
        await applicationService.syncTeamToApplication(team);
      } catch (syncError) {
        console.error('Team → Application sync hatası:', syncError.message);
      }

      const addedMember = team.members[team.members.length - 1];

      res.status(201).json({
        success: true,
        message: 'Üye başarıyla eklendi',
        data: addedMember
      });
    } catch (error) {
      console.error('Üye ekleme hatası:', error);
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({ success: false, message: 'Validasyon hatası', errors });
      }
      res.status(500).json({
        success: false,
        message: error.message || 'Üye eklenirken hata oluştu'
      });
    }
  }

  /**
   * Takım üyesini güncelle
   * PUT /api/teams/:teamId/members/:memberId
   * Body: { name?, email?, tcIdentity?, role? }
   */
  async updateMember(req, res) {
    try {
      const team = await Team.findById(req.params.teamId);
      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Takım bulunamadı'
        });
      }

      const member = team.members.id(req.params.memberId);
      if (!member) {
        return res.status(404).json({
          success: false,
          message: 'Üye bulunamadı'
        });
      }

      const { name, email, tcIdentity, role } = req.body;

      if (name !== undefined) {
        if (!name.trim()) {
          return res.status(400).json({ success: false, message: 'Üye adı boş olamaz' });
        }
        member.name = name.trim();
      }
      if (email !== undefined) member.email = email;
      if (tcIdentity !== undefined) member.tcIdentity = tcIdentity;
      if (role !== undefined) member.role = role;

      await team.save();

      try {
        await applicationService.syncTeamToApplication(team);
      } catch (syncError) {
        console.error('Team → Application sync hatası:', syncError.message);
      }

      res.status(200).json({
        success: true,
        message: 'Üye bilgileri güncellendi',
        data: member
      });
    } catch (error) {
      console.error('Üye güncelleme hatası:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Üye güncellenirken hata oluştu'
      });
    }
  }

  /**
   * Takımdan üye çıkar
   * DELETE /api/teams/:teamId/members/:memberId
   */
  async removeMember(req, res) {
    try {
      const team = await Team.findById(req.params.teamId);
      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Takım bulunamadı'
        });
      }

      const member = team.members.id(req.params.memberId);
      if (!member) {
        return res.status(404).json({
          success: false,
          message: 'Üye bulunamadı'
        });
      }

      member.deleteOne();
      await team.save();

      try {
        await applicationService.syncTeamToApplication(team);
      } catch (syncError) {
        console.error('Team → Application sync hatası:', syncError.message);
      }

      res.status(200).json({
        success: true,
        message: 'Üye başarıyla takımdan çıkarıldı'
      });
    } catch (error) {
      console.error('Üye çıkarma hatası:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Üye çıkarılırken hata oluştu'
      });
    }
  }
  /**
   * Takım liderinin (createdBy User) bilgilerini güncelle
   * PUT /api/teams/:teamId/leader
   * Body: { name?, email?, phone? }
   */
  async updateLeader(req, res) {
    try {
      const team = await Team.findById(req.params.teamId);
      if (!team) {
        return res.status(404).json({ success: false, message: 'Takım bulunamadı' });
      }

      const userId = team.createdBy;
      if (!userId) {
        return res.status(400).json({ success: false, message: 'Takım liderinin kullanıcı kaydı bulunamadı' });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
      }

      const { name, email, phone } = req.body;

      if (name !== undefined) {
        if (!name.trim() || name.trim().length < 2) {
          return res.status(400).json({ success: false, message: 'Ad soyad en az 2 karakter olmalıdır' });
        }
        user.name = name.trim();
      }

      if (email !== undefined) {
        if (!email.trim()) {
          return res.status(400).json({ success: false, message: 'E-posta boş olamaz' });
        }
        const existingUser = await User.findOne({ email: email.trim().toLowerCase(), _id: { $ne: userId } });
        if (existingUser) {
          return res.status(409).json({ success: false, message: 'Bu e-posta adresi başka bir kullanıcıya ait' });
        }
        user.email = email.trim().toLowerCase();
      }

      if (phone !== undefined) {
        user.phone = phone.trim();
      }

      await user.save();

      // Application.personalInfo senkronizasyonu
      const application = await Application.findOne({
        userId,
        ideathonId: team.ideathonId,
        status: { $ne: 'withdrawn' }
      });

      if (application) {
        const nameParts = user.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        if (name !== undefined) {
          application.personalInfo.firstName = firstName;
          application.personalInfo.lastName = lastName;
        }
        if (email !== undefined) {
          application.personalInfo.email = user.email;
        }
        if (phone !== undefined) {
          application.personalInfo.phone = user.phone;
        }

        await application.save();
      }

      res.status(200).json({
        success: true,
        message: 'Takım lideri bilgileri güncellendi',
        data: { _id: user._id, name: user.name, email: user.email, phone: user.phone }
      });
    } catch (error) {
      console.error('Takım lideri güncelleme hatası:', error);
      res.status(500).json({ success: false, message: error.message || 'Takım lideri güncellenirken hata oluştu' });
    }
  }
}

module.exports = new TeamController();
