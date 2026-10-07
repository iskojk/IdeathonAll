const Team = require('../models/Team');
const User = require('../models/User');
const applicationService = require('../services/applicationService');

/**
 * Frontend User Team Management Controller
 * Kullanıcılar başvuru yapmadan önce takım oluşturabilir ve yönetebilir
 * 
 * ÖNEMLİ: Team ↔ Application.teamInfo senkronizasyonu
 * Her Team yazma işleminden sonra applicationService.syncTeamToApplication() çağrılır.
 * Böylece takım değişiklikleri başvuru formundaki teamInfo alanına yansır.
 */

// @desc    Kullanıcının takımını getir
// @route   GET /api/user-teams/my-team
// @access  Authenticated User
exports.getMyTeam = async (req, res) => {
  try {
    const userId = req.user._id;

    // Multi-Tenant: ideathonId ile filtreleme
    const teamQuery = { 
      createdBy: userId,
      isActive: true
    };
    if (req.ideathonId) {
      teamQuery.ideathonId = req.ideathonId;
    }

    // Kullanıcının oluşturduğu takımı bul
    const team = await Team.findOne(teamQuery).select('-teamEvaluations -finalTeamEvaluation');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Henüz bir takım oluşturmadınız'
      });
    }

    res.json({
      success: true,
      data: {
        team: team
      }
    });
  } catch (error) {
    console.error('getMyTeam error:', error);
    res.status(500).json({
      success: false,
      message: 'Takım bilgileri getirilirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Takım oluştur
// @route   POST /api/user-teams/my-team
// @access  Authenticated User
exports.createTeam = async (req, res) => {
  try {
    const userId = req.user._id;
    const { teamName, teamDescription, city } = req.body;

    // Validation
    if (!teamName || teamName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Takım adı en az 2 karakter olmalıdır'
      });
    }

    if (teamName.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Takım adı en fazla 100 karakter olabilir'
      });
    }

    // Multi-Tenant: ideathonId ile filtreleme
    const existingQuery = { 
      createdBy: userId,
      isActive: true
    };
    if (req.ideathonId) {
      existingQuery.ideathonId = req.ideathonId;
    }

    // Kullanıcının zaten bir takımı var mı kontrol et
    const existingTeam = await Team.findOne(existingQuery);

    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: 'Zaten bir takımınız var. Önce mevcut takımı silmelisiniz.'
      });
    }

    // Yeni takım oluştur
    const team = new Team({
      teamName: teamName.trim(),
      teamDescription: teamDescription ? teamDescription.trim() : '',
      city: city ? city.trim() : '',
      members: [],
      createdBy: userId,
      creationMethod: 'manual',
      isActive: true,
      ...(req.ideathonId && { ideathonId: req.ideathonId })
    });

    await team.save();

    // ─── Team → Application senkronizasyonu ───
    try {
      await applicationService.syncTeamToApplication(team);
    } catch (syncError) {
      console.error('Team → Application sync hatası:', syncError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Takım başarıyla oluşturuldu',
      data: {
        team: team
      }
    });
  } catch (error) {
    console.error('createTeam error:', error);
    res.status(500).json({
      success: false,
      message: 'Takım oluşturulurken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Takım bilgilerini güncelle
// @route   PUT /api/user-teams/my-team
// @access  Authenticated User
exports.updateTeam = async (req, res) => {
  try {
    const userId = req.user._id;
    const { teamName, teamDescription, city } = req.body;

    // Kullanıcının takımını bul
    const team = await Team.findOne({ 
      createdBy: userId,
      isActive: true
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Takım bulunamadı'
      });
    }

    // Validation
    if (teamName) {
      if (teamName.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Takım adı en az 2 karakter olmalıdır'
        });
      }
      if (teamName.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Takım adı en fazla 100 karakter olabilir'
        });
      }
      team.teamName = teamName.trim();
    }

    if (teamDescription !== undefined) {
      if (teamDescription && teamDescription.length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Takım açıklaması en fazla 1000 karakter olabilir'
        });
      }
      team.teamDescription = teamDescription ? teamDescription.trim() : '';
    }

    if (city !== undefined) {
      if (city && city.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Şehir adı en fazla 100 karakter olabilir'
        });
      }
      team.city = city ? city.trim() : '';
    }

    await team.save();

    // ─── Team → Application senkronizasyonu ───
    try {
      await applicationService.syncTeamToApplication(team);
    } catch (syncError) {
      console.error('Team → Application sync hatası:', syncError.message);
    }

    res.json({
      success: true,
      message: 'Takım bilgileri güncellendi',
      data: {
        team: team
      }
    });
  } catch (error) {
    console.error('updateTeam error:', error);
    res.status(500).json({
      success: false,
      message: 'Takım güncellenirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Takıma üye ekle
// @route   POST /api/user-teams/my-team/members
// @access  Authenticated User
exports.addMember = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, tcIdentity, email, role } = req.body;

    // Validation
    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Üye adı en az 2 karakter olmalıdır'
      });
    }

    if (!tcIdentity) {
      return res.status(400).json({
        success: false,
        message: 'TC Kimlik No zorunludur'
      });
    }

    // TC Kimlik No validation
    if (!/^[0-9]{11}$/.test(tcIdentity)) {
      return res.status(400).json({
        success: false,
        message: 'TC Kimlik No 11 haneli sayı olmalıdır'
      });
    }

    // Kullanıcının takımını bul
    const team = await Team.findOne({ 
      createdBy: userId,
      isActive: true
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Önce bir takım oluşturmalısınız'
      });
    }

    // Maksimum üye kontrolü (takım lideri + 4 üye = 5 kişi)
    if (team.members.length >= 4) {
      return res.status(400).json({
        success: false,
        message: 'Takım en fazla 5 kişi olabilir (siz dahil)'
      });
    }

    // Aynı TC ile üye var mı kontrol et
    const existingMember = team.members.find(
      member => member.tcIdentity === tcIdentity
    );

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'Bu TC Kimlik No ile bir üye zaten ekli'
      });
    }

    // Yeni üye ekle
    team.members.push({
      name: name.trim(),
      tcIdentity: tcIdentity.trim(),
      email: email ? email.trim() : '',
      role: role ? role.trim() : 'Takım Üyesi'
    });

    await team.save();

    // ─── Team → Application senkronizasyonu ───
    try {
      await applicationService.syncTeamToApplication(team);
    } catch (syncError) {
      console.error('Team → Application sync hatası:', syncError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Takım üyesi başarıyla eklendi',
      data: {
        team: team
      }
    });
  } catch (error) {
    console.error('addMember error:', error);
    res.status(500).json({
      success: false,
      message: 'Takım üyesi eklenirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Takım üyesini güncelle
// @route   PUT /api/user-teams/my-team/members/:memberIndex
// @access  Authenticated User
exports.updateMember = async (req, res) => {
  try {
    const userId = req.user._id;
    const { memberIndex } = req.params;
    const { name, tcIdentity, email, role } = req.body;

    // Validation
    if (!name && !tcIdentity && !email && role === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Güncellenecek en az bir alan belirtmelisiniz'
      });
    }

    // TC Kimlik No validation (eğer gönderildiyse)
    if (tcIdentity && !/^[0-9]{11}$/.test(tcIdentity)) {
      return res.status(400).json({
        success: false,
        message: 'TC Kimlik No 11 haneli sayı olmalıdır'
      });
    }

    // Kullanıcının takımını bul
    const team = await Team.findOne({ 
      createdBy: userId,
      isActive: true
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Takım bulunamadı'
      });
    }

    // Takım üyesi kontrolü
    const index = parseInt(memberIndex);
    if (isNaN(index) || index < 0 || index >= team.members.length) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz üye index'
      });
    }

    // Aynı TC ile başka üye var mı kontrol et (kendisi hariç)
    if (tcIdentity) {
      const existingMemberIndex = team.members.findIndex(
        (member, idx) => member.tcIdentity === tcIdentity && idx !== index
      );

      if (existingMemberIndex !== -1) {
        return res.status(400).json({
          success: false,
          message: 'Bu TC Kimlik No ile başka bir üye zaten ekli'
        });
      }
    }

    // Üye bilgilerini güncelle
    if (name) team.members[index].name = name.trim();
    if (tcIdentity) team.members[index].tcIdentity = tcIdentity.trim();
    if (email !== undefined) team.members[index].email = email ? email.trim() : '';
    if (role !== undefined) team.members[index].role = role ? role.trim() : 'Takım Üyesi';

    await team.save();

    // ─── Team → Application senkronizasyonu ───
    try {
      await applicationService.syncTeamToApplication(team);
    } catch (syncError) {
      console.error('Team → Application sync hatası:', syncError.message);
    }

    res.json({
      success: true,
      message: 'Takım üyesi güncellendi',
      data: {
        team: team
      }
    });
  } catch (error) {
    console.error('updateMember error:', error);
    res.status(500).json({
      success: false,
      message: 'Takım üyesi güncellenirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Takım üyesini sil
// @route   DELETE /api/user-teams/my-team/members/:memberIndex
// @access  Authenticated User
exports.deleteMember = async (req, res) => {
  try {
    const userId = req.user._id;
    const { memberIndex } = req.params;

    // Kullanıcının takımını bul
    const team = await Team.findOne({ 
      createdBy: userId,
      isActive: true
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Takım bulunamadı'
      });
    }

    // Takım üyesi kontrolü
    const index = parseInt(memberIndex);
    if (isNaN(index) || index < 0 || index >= team.members.length) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz üye index'
      });
    }

    // Üyeyi sil
    team.members.splice(index, 1);

    await team.save();

    // ─── Team → Application senkronizasyonu ───
    try {
      await applicationService.syncTeamToApplication(team);
    } catch (syncError) {
      console.error('Team → Application sync hatası:', syncError.message);
    }

    res.json({
      success: true,
      message: 'Takım üyesi silindi',
      data: {
        team: team
      }
    });
  } catch (error) {
    console.error('deleteMember error:', error);
    res.status(500).json({
      success: false,
      message: 'Takım üyesi silinirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Takımı sil
// @route   DELETE /api/user-teams/my-team
// @access  Authenticated User
exports.deleteTeam = async (req, res) => {
  try {
    const userId = req.user._id;

    // Kullanıcının takımını bul
    const team = await Team.findOne({ 
      createdBy: userId,
      isActive: true
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Takım bulunamadı'
      });
    }

    // Soft delete - isActive'i false yap
    team.isActive = false;
    await team.save();

    // ─── Team silindi → Application teamInfo temizle ───
    try {
      const Application = require('../models/Application');
      const application = await Application.findOne({
        userId: userId,
        ideathonId: team.ideathonId,
        status: { $ne: 'withdrawn' }
      });
      if (application && application.teamInfo) {
        application.teamInfo = {
          isInTeam: false,
          teamName: '',
          teamSize: 0,
          teamMembers: [],
          teamId: application.teamInfo.teamId,
          teamRole: application.teamInfo.teamRole
        };
        await application.save();
        console.log(`✅ Application teamInfo temizlendi (team silindi): ${application._id}`);
      }
    } catch (syncError) {
      console.error('Team silme → Application sync hatası:', syncError.message);
    }

    res.json({
      success: true,
      message: 'Takım başarıyla silindi'
    });
  } catch (error) {
    console.error('deleteTeam error:', error);
    res.status(500).json({
      success: false,
      message: 'Takım silinirken hata oluştu',
      error: error.message
    });
  }
};

module.exports = exports;








