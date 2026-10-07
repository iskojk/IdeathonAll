const MentorProfile = require('../models/MentorProfile');
const MentorMeeting = require('../models/MentorMeeting');
const MeetingFeedback = require('../models/MeetingFeedback');
const User = require('../models/User');
const UserIdeathonRole = require('../models/UserIdeathonRole');
const Application = require('../models/Application');
const Team = require('../models/Team');
const path = require('path');
const fs = require('fs');

// ==================== MENTOR PROFILE ====================

// @desc    Tüm mentorları listele (public/participant/mentor/admin)
// @route   GET /api/mentornet/mentors
// @access  Public (isActive=true olanlar) / Mentor/Admin (tüm liste)
exports.getMentors = async (req, res) => {
  try {
    const { searchText, expertiseTags, isActive, ideathonId } = req.query;
    
    const isAdmin = req.user && ['superadmin', 'admin'].includes(req.user.role);
    
    // Query oluştur
    const query = {};
    
    // Admin değilse sadece aktif mentorları göster
    if (!isAdmin) {
      query.isActive = true;
    } else if (isActive !== undefined) {
      // Admin ise ve isActive query parametresi varsa onu kullan
      query.isActive = isActive === 'true';
    }
    // Admin ise ve isActive parametresi yoksa tüm mentorları göster (hem aktif hem pasif)

    // Multi-Tenant: İdeathon filtresi
    // ÖNCELİK SIRASI:
    // 1. ?event=slug (frontend kullanıcı paneli — EN YÜKSEK ÖNCELİK)
    // 2. ?ideathonId=xxx veya X-Ideathon-Id header (admin paneli)
    // 3. req.ideathonId (JWT'den authenticate/optionalAuth middleware set eder)
    // 4. Giriş yapmış user'ın ideathonId'si (User model fallback)
    let filterIdeathonId = null;

    // 1. Slug'dan çözümle (?event=slug) — EN YÜKSEK ÖNCELİK
    if (req.query.event) {
      const Ideathon = require('../models/Ideathon');
      const ideathon = await Ideathon.findOne({ slug: req.query.event, status: 'active' })
        .select('_id').lean();
      if (ideathon) {
        filterIdeathonId = ideathon._id.toString();
      }
    }

    // 2. Admin paneli header/query
    if (!filterIdeathonId) {
      filterIdeathonId = req.headers['x-ideathon-id'] || ideathonId;
    }

    // 3. JWT'den gelen ideathonId
    if (!filterIdeathonId && req.ideathonId) {
      filterIdeathonId = req.ideathonId;
    }

    // 4. User rolü ise fallback → kendi ideathonId'sinden al
    if (!filterIdeathonId && req.user && req.user.role === 'user' && req.user.ideathonId) {
      filterIdeathonId = req.user.ideathonId.toString();
    }

    if (filterIdeathonId && filterIdeathonId !== 'all') {
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(filterIdeathonId)) {
        query.ideathonId = new mongoose.Types.ObjectId(filterIdeathonId);
      }
    }
    
    // Uzmanlık alanı filtresi
    if (expertiseTags) {
      const tagsArray = Array.isArray(expertiseTags) ? expertiseTags : [expertiseTags];
      query.expertiseTags = { $in: tagsArray };
    }
    
    // Text search filtresi
    if (searchText) {
      query.$text = { $search: searchText };
    }
    
    // Mentorları getir - admin/mentor email+phone görebilir, normal kullanıcılar göremez
    const userFields = isAdmin ? 'name email phone role' : 'name role';
    let mentorQuery = MentorProfile.find(query)
      .populate('userId', userFields)
      .populate('ideathonId', 'name slug status')
      .sort({ 'stats.averageRating': -1, createdAt: -1 });
    
    if (isAdmin) {
      mentorQuery = mentorQuery.populate('createdBy', 'name email');
    }

    const mentors = await mentorQuery;

    const safeMentors = isAdmin ? mentors : mentors.map(m => {
      const obj = m.toObject();
      delete obj.createdBy;
      return obj;
    });

    res.json({
      success: true,
      count: safeMentors.length,
      data: safeMentors
    });
  } catch (error) {
    console.error('getMentors error:', error);
    res.status(500).json({
      success: false,
      message: 'Mentorlar listelenirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Kendi mentor profilimi getir (mentor için)
// @route   GET /api/mentornet/mentors/profile
// @access  Private (Mentor only)
exports.getMyMentorProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const mentor = await MentorProfile.findOne({ userId })
      .populate('userId', 'name email phone role')
      .populate('createdBy', 'name email')
      .populate('ideathonId', 'name slug status');
    
    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: 'Mentor profili bulunamadı. Lütfen admin ile iletişime geçin.'
      });
    }
    
    res.json({
      success: true,
      data: mentor
    });
  } catch (error) {
    console.error('getMyMentorProfile error:', error);
    res.status(500).json({
      success: false,
      message: 'Mentor profili getirilirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Belirli bir mentoru getir
// @route   GET /api/mentornet/mentors/:userId
// @access  Public
exports.getMentorByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const isAdmin = req.user && ['superadmin', 'admin'].includes(req.user.role);
    const isMentor = req.user && req.user.role === 'mentor';
    
    // Admin/mentor email+phone görebilir, normal kullanıcılar göremez
    const userFields = (isAdmin || isMentor) ? 'name email phone role' : 'name role';
    let mentorQuery = MentorProfile.findOne({ userId })
      .populate('userId', userFields)
      .populate('ideathonId', 'name slug status');
    
    if (isAdmin) {
      mentorQuery = mentorQuery.populate('createdBy', 'name email');
    }
    
    const mentor = await mentorQuery;
    
    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: 'Mentor bulunamadı'
      });
    }
    
    // Admin değilse sadece aktif mentorları göster
    if (!mentor.isActive && !isAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Mentor bulunamadı'
      });
    }

    // Admin değilse createdBy alanını response'dan temizle
    const responseData = isAdmin ? mentor : (() => {
      const obj = mentor.toObject();
      delete obj.createdBy;
      return obj;
    })();
    
    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('getMentorByUserId error:', error);
    res.status(500).json({
      success: false,
      message: 'Mentor getirilirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Yeni mentor profili oluştur (admin)
// @route   POST /api/mentornet/mentors
// @access  Admin
exports.createMentorProfile = async (req, res) => {
  try {
    const { userId, title, about, linkedin, expertiseTags, photo, additionalInfo } = req.body;
    
    // Kullanıcı mevcut mu ve mentor rolünde mi kontrol et
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }
    
    if (user.role !== 'mentor') {
      return res.status(400).json({
        success: false,
        message: 'Kullanıcının rolü mentor olmalıdır'
      });
    }
    
    // Zaten profil var mı kontrol et
    const existingProfile = await MentorProfile.findOne({ userId });
    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: 'Bu kullanıcı için mentor profili zaten mevcut'
      });
    }
    
    // ideathonId zorunlu
    const ideathonId = req.body.ideathonId;
    if (!ideathonId) {
      return res.status(400).json({
        success: false,
        message: 'İdeathon seçimi zorunludur (ideathonId)'
      });
    }

    // İdeathon varlığını kontrol et
    const Ideathon = require('../models/Ideathon');
    const ideathon = await Ideathon.findById(ideathonId);
    if (!ideathon) {
      return res.status(404).json({
        success: false,
        message: 'Belirtilen ideathon bulunamadı'
      });
    }

    // İdeathondaki tüm user'ları otomatik ata (default hepsi seçili)
    const ideathonUsers = await User.find({
      role: 'user',
      ideathonId: ideathonId,
      isActive: true
    }).select('_id').lean();

    const assignedUserIds = ideathonUsers.map(u => u._id);

    const mentorProfile = new MentorProfile({
      userId,
      title,
      about,
      linkedin,
      expertiseTags,
      photo,
      additionalInfo,
      ideathonId,
      assignedUsers: assignedUserIds,
      createdBy: req.user._id
    });
    
    await mentorProfile.save();

    // ====== User model'e ideathonId ata ======
    user.ideathonId = ideathonId;
    await user.save();

    // ====== UserIdeathonRole kaydı oluştur (yoksa) ======
    const existingRole = await UserIdeathonRole.findOne({
      userId: user._id,
      ideathonId: ideathonId,
      role: 'mentor'
    });
    if (!existingRole) {
      await UserIdeathonRole.create({
        userId: user._id,
        ideathonId: ideathonId,
        role: 'mentor',
        assignedBy: req.user._id
      });
    }
    
    await mentorProfile.populate('userId', 'name email phone role');
    await mentorProfile.populate('createdBy', 'name email');
    
    res.status(201).json({
      success: true,
      message: 'Mentor profili başarıyla oluşturuldu',
      data: {
        ...mentorProfile.toObject(),
        ideathon: {
          _id: ideathon._id,
          name: ideathon.name,
          slug: ideathon.slug,
          status: ideathon.status
        },
        assignedUsersCount: assignedUserIds.length
      }
    });
  } catch (error) {
    console.error('createMentorProfile error:', error);
    res.status(500).json({
      success: false,
      message: 'Mentor profili oluşturulurken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Kendi mentor profilimi güncelle (mentor için)
// @route   PUT /api/mentornet/mentors/profile
// @access  Private (Mentor only)
exports.updateMyMentorProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { title, about, linkedin, expertiseTags, additionalInfo } = req.body;
    
    const mentor = await MentorProfile.findOne({ userId });
    
    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: 'Mentor profili bulunamadı'
      });
    }
    
    // Güncellenebilir alanlar
    if (title !== undefined) mentor.title = title;
    if (about !== undefined) mentor.about = about;
    if (linkedin !== undefined) mentor.linkedin = linkedin;
    if (expertiseTags !== undefined) mentor.expertiseTags = expertiseTags;
    if (additionalInfo !== undefined) mentor.additionalInfo = additionalInfo;
    
    await mentor.save();
    await mentor.populate('userId', 'name email phone role');
    await mentor.populate('createdBy', 'name email');
    await mentor.populate('ideathonId', 'name slug status');
    
    res.json({
      success: true,
      message: 'Mentor profili güncellendi',
      data: mentor
    });
  } catch (error) {
    console.error('updateMyMentorProfile error:', error);
    res.status(500).json({
      success: false,
      message: 'Mentor profili güncellenirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Mentor profilini güncelle (mentor self veya admin)
// @route   PATCH /api/mentornet/mentors/:userId
// @access  Mentor (kendi profili) veya Admin
exports.updateMentorProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    
    const mentorProfile = await MentorProfile.findOne({ userId });
    
    if (!mentorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Mentor profili bulunamadı'
      });
    }
    
    // Yetkilendirme: mentor kendi profilini veya admin herhangi bir profili güncelleyebilir
    const isAdmin = ['superadmin', 'admin'].includes(req.user.role);
    const isOwner = mentorProfile.userId.toString() === req.user._id.toString();
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Bu profili güncelleme yetkiniz yok'
      });
    }
    
    // ====== Admin ise: User model alanlarını da güncelleyebilir ======
    if (isAdmin && updates.userInfo) {
      const mentorUser = await User.findById(userId);
      if (mentorUser) {
        const userAllowedFields = ['name', 'email', 'phone'];
        
        // Email benzersizlik kontrolü
        if (updates.userInfo.email && updates.userInfo.email !== mentorUser.email) {
          const existingUser = await User.findOne({ email: updates.userInfo.email });
          if (existingUser) {
            return res.status(409).json({
              success: false,
              message: 'Bu email adresi zaten kullanılıyor'
            });
          }
        }
        
        userAllowedFields.forEach(field => {
          if (updates.userInfo[field] !== undefined) {
            mentorUser[field] = updates.userInfo[field];
          }
        });
        await mentorUser.save();
      }
    }

    // ====== Admin ise: ideathonId değiştirilebilir ======
    if (isAdmin && updates.ideathonId !== undefined) {
      const Ideathon = require('../models/Ideathon');
      const ideathon = await Ideathon.findById(updates.ideathonId);
      if (!ideathon) {
        return res.status(404).json({
          success: false,
          message: 'Belirtilen ideathon bulunamadı'
        });
      }
      
      const oldIdeathonId = mentorProfile.ideathonId ? mentorProfile.ideathonId.toString() : null;
      const newIdeathonId = updates.ideathonId.toString();
      
      mentorProfile.ideathonId = updates.ideathonId;
      
      // User model'deki ideathonId'yi de güncelle
      const mentorUser = await User.findById(userId);
      if (mentorUser) {
        mentorUser.ideathonId = updates.ideathonId;
        await mentorUser.save();
      }
      
      // UserIdeathonRole güncelle (eski kaydı deaktif et, yeni kayıt oluştur)
      if (oldIdeathonId && oldIdeathonId !== newIdeathonId) {
        await UserIdeathonRole.updateMany(
          { userId: userId, ideathonId: oldIdeathonId, role: 'mentor' },
          { isActive: false }
        );
      }
      const existingRole = await UserIdeathonRole.findOne({
        userId: userId,
        ideathonId: newIdeathonId,
        role: 'mentor'
      });
      if (!existingRole) {
        await UserIdeathonRole.create({
          userId: userId,
          ideathonId: newIdeathonId,
          role: 'mentor',
          assignedBy: req.user._id
        });
      } else if (!existingRole.isActive) {
        existingRole.isActive = true;
        await existingRole.save();
      }
    }

    // Profil güncellenebilir alanlar
    const allowedUpdates = ['title', 'about', 'linkedin', 'expertiseTags', 'photo', 'additionalInfo', 'isActive'];
    
    // Admin değilse isActive güncelleyemez
    if (!isAdmin && updates.isActive !== undefined) {
      delete updates.isActive;
    }
    
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        mentorProfile[field] = updates[field];
      }
    });
    
    await mentorProfile.save();
    await mentorProfile.populate('userId', 'name email phone role');
    await mentorProfile.populate('createdBy', 'name email');
    await mentorProfile.populate('ideathonId', 'name slug status');
    
    res.json({
      success: true,
      message: 'Mentor profili başarıyla güncellendi',
      data: {
        ...mentorProfile.toObject(),
        assignedUsersCount: (mentorProfile.assignedUsers || []).length
      }
    });
  } catch (error) {
    console.error('updateMentorProfile error:', error);
    res.status(500).json({
      success: false,
      message: 'Mentor profili güncellenirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Kendi mentor istatistiklerimi getir (mentor için - Dashboard)
// @route   GET /api/mentornet/mentors/profile/stats
// @access  Private (Mentor only)
exports.getMyMentorStats = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const mentorProfile = await MentorProfile.findOne({ userId });
    
    if (!mentorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Mentor profili bulunamadı'
      });
    }
    
    // Multi-Tenant: ideathonId filtresi (mentor JWT'den gelir)
    const ideathonId = req.ideathonId;
    const meetingBaseFilter = { mentorUserId: userId };
    if (ideathonId) meetingBaseFilter.ideathonId = ideathonId;
    
    // Meeting istatistikleri
    const meetingStats = await MentorMeeting.getMentorStats(userId);
    
    // Feedback istatistikleri
    const feedbackStats = await MeetingFeedback.getMentorAverageRating(userId);
    
    // Yaklaşan toplantılar
    const upcomingMeetingsCount = await MentorMeeting.countDocuments({
      ...meetingBaseFilter,
      status: 'scheduled',
      startAt: { $gte: new Date() }
    });
    
    // Müsait slotlar
    const AvailabilitySlot = require('../models/AvailabilitySlot');
    const slotBaseFilter = { mentorUserId: userId };
    if (ideathonId) slotBaseFilter.ideathonId = ideathonId;
    const availableSlotsCount = await AvailabilitySlot.countDocuments({
      ...slotBaseFilter,
      status: 'open',
      startAt: { $gte: new Date() }
    });
    
    // Bu hafta toplantılar
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    
    const thisWeekMeetings = await MentorMeeting.countDocuments({
      ...meetingBaseFilter,
      startAt: { $gte: startOfWeek, $lt: endOfWeek }
    });
    
    // Bu ay toplantılar
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    
    const thisMonthMeetings = await MentorMeeting.countDocuments({
      ...meetingBaseFilter,
      startAt: { $gte: startOfMonth, $lt: endOfMonth }
    });
    
    // Feedback yıldız dağılımı
    const feedbackDistribution = await MeetingFeedback.aggregate([
      {
        $lookup: {
          from: 'mentormeetings',
          localField: 'meetingId',
          foreignField: '_id',
          as: 'meeting'
        }
      },
      { $unwind: '$meeting' },
      { $match: { 'meeting.mentorUserId': userId } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const feedbackStatsFormatted = {
      '5star': feedbackDistribution.find(f => f._id === 5)?.count || 0,
      '4star': feedbackDistribution.find(f => f._id === 4)?.count || 0,
      '3star': feedbackDistribution.find(f => f._id === 3)?.count || 0,
      '2star': feedbackDistribution.find(f => f._id === 2)?.count || 0,
      '1star': feedbackDistribution.find(f => f._id === 1)?.count || 0
    };
    
    // Son feedbackler
    const recentFeedbacks = await MeetingFeedback.find()
      .populate({
        path: 'meetingId',
        match: { mentorUserId: userId },
        select: 'startAt'
      })
      .populate('filledByUserId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);
    
    const filteredFeedbacks = recentFeedbacks
      .filter(f => f.meetingId)
      .map(f => ({
        rating: f.rating,
        comment: f.comment,
        createdAt: f.createdAt,
        filledByUser: {
          name: f.filledByUserId?.name
        }
      }));
    
    res.json({
      success: true,
      data: {
        profile: {
          _id: mentorProfile._id,
          stats: mentorProfile.stats
        },
        upcomingMeetingsCount,
        availableSlotsCount,
        thisWeekMeetings,
        thisMonthMeetings,
        feedbackStats: feedbackStatsFormatted,
        recentFeedbacks: filteredFeedbacks
      }
    });
  } catch (error) {
    console.error('getMyMentorStats error:', error);
    res.status(500).json({
      success: false,
      message: 'İstatistikler getirilirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Mentor istatistiklerini getir
// @route   GET /api/mentornet/mentors/:userId/stats
// @access  Public
exports.getMentorStats = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const mentorProfile = await MentorProfile.findOne({ userId });
    
    if (!mentorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Mentor profili bulunamadı'
      });
    }
    
    // Meeting istatistikleri
    const meetingStats = await MentorMeeting.getMentorStats(userId);
    
    // Feedback istatistikleri
    const feedbackStats = await MeetingFeedback.getMentorAverageRating(userId);
    
    res.json({
      success: true,
      data: {
        profile: mentorProfile.stats,
        meetings: meetingStats,
        feedback: feedbackStats
      }
    });
  } catch (error) {
    console.error('getMentorStats error:', error);
    res.status(500).json({
      success: false,
      message: 'Mentor istatistikleri getirilirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Kendi mentor profil fotoğrafımı yükle (mentor için)
// @route   POST /api/mentornet/mentors/profile/photo
// @access  Private (Mentor only)
exports.uploadMyMentorPhoto = async (req, res) => {
  try {
    const userId = req.user._id;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Lütfen bir fotoğraf dosyası yükleyin'
      });
    }
    
    const mentorProfile = await MentorProfile.findOne({ userId });
    
    if (!mentorProfile) {
      // Yüklenen dosyayı sil
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Mentor profili bulunamadı'
      });
    }
    
    // Eski fotoğrafı sil (varsa)
    if (mentorProfile.photo) {
      const oldPhotoPath = path.join(__dirname, '../../uploads/mentors', mentorProfile.photo);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }
    
    // Yeni fotoğrafı kaydet
    mentorProfile.photo = req.file.filename;
    await mentorProfile.save();
    
    res.json({
      success: true,
      message: 'Profil fotoğrafı güncellendi',
      data: {
        photo: mentorProfile.photo,
        photoUrl: `${req.protocol}://${req.get('host')}/uploads/mentors/${mentorProfile.photo}`
      }
    });
  } catch (error) {
    console.error('uploadMyMentorPhoto error:', error);
    
    // Hata durumunda yüklenen dosyayı sil
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Fotoğraf yüklenirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Mentor profil fotoğrafı yükle
// @route   POST /api/mentornet/mentors/:userId/photo
// @access  Mentor (kendi profili) veya Admin
exports.uploadMentorPhoto = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Lütfen bir fotoğraf dosyası yükleyin'
      });
    }
    
    const mentorProfile = await MentorProfile.findOne({ userId });
    
    if (!mentorProfile) {
      // Yüklenen dosyayı sil
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Mentor profili bulunamadı'
      });
    }
    
    // Yetkilendirme: mentor kendi profilini veya admin herhangi bir profili güncelleyebilir
    const isAdmin = ['superadmin', 'admin'].includes(req.user.role);
    const isOwner = mentorProfile.userId.toString() === req.user._id.toString();
    
    if (!isAdmin && !isOwner) {
      // Yüklenen dosyayı sil
      fs.unlinkSync(req.file.path);
      return res.status(403).json({
        success: false,
        message: 'Bu profil fotoğrafını güncelleme yetkiniz yok'
      });
    }
    
    // Eski fotoğrafı sil (varsa)
    if (mentorProfile.photo && !mentorProfile.photo.startsWith('http')) {
      const oldPhotoPath = path.join(__dirname, '../../uploads/mentors', mentorProfile.photo);
      if (fs.existsSync(oldPhotoPath)) {
        try {
          fs.unlinkSync(oldPhotoPath);
        } catch (err) {
          console.error('Eski fotoğraf silinemedi:', err);
        }
      }
    }
    
    // Yeni fotoğraf bilgisini kaydet
    mentorProfile.photo = req.file.filename;
    await mentorProfile.save();
    
    await mentorProfile.populate('userId', 'name email');
    
    res.json({
      success: true,
      message: 'Fotoğraf başarıyla yüklendi',
      data: {
        photo: mentorProfile.photo,
        photoUrl: mentorProfile.photoUrl
      }
    });
  } catch (error) {
    // Hata durumunda yüklenen dosyayı sil
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Dosya silinemedi:', err);
      }
    }
    
    console.error('uploadMentorPhoto error:', error);
    res.status(500).json({
      success: false,
      message: 'Fotoğraf yüklenirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Mentor profilini sil (admin only)
// @route   DELETE /api/mentornet/mentors/:userId
// @access  SuperAdmin / Admin
exports.deleteMentorProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { hardDelete } = req.query; // ?hardDelete=true ise tamamen sil
    
    const mentorProfile = await MentorProfile.findOne({ userId });
    
    if (!mentorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Mentor profili bulunamadı'
      });
    }
    
    // Hard delete mı soft delete mi?
    if (hardDelete === 'true') {
      // Profil fotoğrafını sil (varsa)
      if (mentorProfile.photo && !mentorProfile.photo.startsWith('http') && mentorProfile.photo !== 'default.jpg') {
        const photoPath = path.join(__dirname, '../../uploads/mentors', mentorProfile.photo);
        if (fs.existsSync(photoPath)) {
          try {
            fs.unlinkSync(photoPath);
          } catch (err) {
            console.error('Fotoğraf silinemedi:', err);
          }
        }
      }
      
      await MentorProfile.findByIdAndDelete(mentorProfile._id);
      
      res.json({
        success: true,
        message: 'Mentor profili kalıcı olarak silindi',
        deletedProfile: {
          userId: mentorProfile.userId,
          title: mentorProfile.title
        }
      });
    } else {
      // Soft delete: isActive = false
      mentorProfile.isActive = false;
      await mentorProfile.save();
      
      res.json({
        success: true,
        message: 'Mentor profili deaktif edildi',
        data: mentorProfile
      });
    }
  } catch (error) {
    console.error('deleteMentorProfile error:', error);
    res.status(500).json({
      success: false,
      message: 'Mentor profili silinirken hata oluştu',
      error: error.message
    });
  }
};

// ==================== EMAIL TERCİHLERİ (Mentor için) ====================

// @desc    Email tercihlerini getir (mentor - kendi)
// @route   GET /api/mentornet/mentors/email-preferences
// @access  Mentor
exports.getMyEmailPreferences = async (req, res) => {
  try {
    const mentorProfile = await MentorProfile.findOne({ userId: req.user._id });

    if (!mentorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Mentor profili bulunamadı'
      });
    }

    res.json({
      success: true,
      data: mentorProfile.emailPreferences || {
        meetingCreated: true,
        meetingCancelled: true,
        meetingNoteAdded: true,
        availabilityUpdated: true,
        newMessage: true,
        meetingReminder: true
      }
    });
  } catch (error) {
    console.error('getMyEmailPreferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Email tercihleri getirilirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Email tercihlerini güncelle (mentor - kendi)
// @route   PATCH /api/mentornet/mentors/email-preferences
// @access  Mentor
exports.updateMyEmailPreferences = async (req, res) => {
  try {
    const { 
      meetingCreated, 
      meetingCancelled, 
      meetingNoteAdded, 
      availabilityUpdated, 
      newMessage, 
      meetingReminder 
    } = req.body;

    const mentorProfile = await MentorProfile.findOne({ userId: req.user._id });

    if (!mentorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Mentor profili bulunamadı'
      });
    }

    // Email tercihlerini güncelle
    if (!mentorProfile.emailPreferences) {
      mentorProfile.emailPreferences = {};
    }

    if (meetingCreated !== undefined) mentorProfile.emailPreferences.meetingCreated = meetingCreated;
    if (meetingCancelled !== undefined) mentorProfile.emailPreferences.meetingCancelled = meetingCancelled;
    if (meetingNoteAdded !== undefined) mentorProfile.emailPreferences.meetingNoteAdded = meetingNoteAdded;
    if (availabilityUpdated !== undefined) mentorProfile.emailPreferences.availabilityUpdated = availabilityUpdated;
    if (newMessage !== undefined) mentorProfile.emailPreferences.newMessage = newMessage;
    if (meetingReminder !== undefined) mentorProfile.emailPreferences.meetingReminder = meetingReminder;

    await mentorProfile.save();

    res.json({
      success: true,
      message: 'Email tercihleri başarıyla güncellendi',
      data: mentorProfile.emailPreferences
    });
  } catch (error) {
    console.error('updateMyEmailPreferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Email tercihleri güncellenirken hata oluştu',
      error: error.message
    });
  }
};

// ==================== PARTICIPANTS & TEAMS ====================

// ==================== SUPERADMIN STATS ====================

// @desc    Superadmin Dashboard İstatistikleri
// @route   GET /api/mentornet/stats/dashboard
// @access  SuperAdmin / Admin
exports.getSuperadminDashboard = async (req, res) => {
  try {
    // Geçmiş scheduled toplantıları otomatik tamamla
    await MentorMeeting.autoCompletePastMeetings();

    // Multi-Tenant: ideathonId filtresi (admin header/query'den)
    const ideathonId = req.ideathonId;
    const meetingFilter = {};
    if (ideathonId) meetingFilter.ideathonId = ideathonId;

    // Mentor sayıları — ideathonId filtreli
    const profileFilter = {};
    if (ideathonId) profileFilter.ideathonId = ideathonId;
    const totalMentors = await MentorProfile.countDocuments(profileFilter);
    const activeMentors = await MentorProfile.countDocuments({ ...profileFilter, isActive: true });
    const inactiveMentors = await MentorProfile.countDocuments({ ...profileFilter, isActive: false });

    // Görüşme istatistikleri — ideathonId filtreli
    const allMeetings = await MentorMeeting.find(meetingFilter);
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const meetingStats = {
      total: allMeetings.length,
      completed: allMeetings.filter(m => m.status === 'completed').length,
      scheduled: allMeetings.filter(m => m.status === 'scheduled').length,
      cancelled: allMeetings.filter(m => m.status === 'cancelled').length,
      noShow: allMeetings.filter(m => m.status === 'no_show').length,
      thisMonth: allMeetings.filter(m => new Date(m.createdAt) >= startOfMonth).length,
      thisWeek: allMeetings.filter(m => new Date(m.createdAt) >= startOfWeek).length
    };

    // Tüm feedbackler — ideathonId varsa ilgili meeting'lerin feedback'leri
    let feedbackFilter = {
      feedbackType: 'participant_to_mentor',
      isVisible: true
    };
    if (ideathonId) {
      const meetingIds = allMeetings.map(m => m._id);
      feedbackFilter.meetingId = { $in: meetingIds };
    }
    const allFeedbacks = await MeetingFeedback.find(feedbackFilter);

    const ratingStats = {
      overall: allFeedbacks.length > 0 
        ? Math.round((allFeedbacks.reduce((sum, f) => sum + f.rating, 0) / allFeedbacks.length) * 10) / 10
        : 0,
      totalFeedbacks: allFeedbacks.length,
      distribution: {
        5: allFeedbacks.filter(f => f.rating === 5).length,
        4: allFeedbacks.filter(f => f.rating === 4).length,
        3: allFeedbacks.filter(f => f.rating === 3).length,
        2: allFeedbacks.filter(f => f.rating === 2).length,
        1: allFeedbacks.filter(f => f.rating === 1).length
      }
    };

    // En iyi performans gösteren mentorlar — ideathonId filtreli
    const topPerformerFilter = { isActive: true };
    if (ideathonId) topPerformerFilter.ideathonId = ideathonId;
    const allMentorProfiles = await MentorProfile.find(topPerformerFilter)
      .populate('userId', 'name email')
      .select('userId stats');

    const topPerformers = allMentorProfiles
      .filter(mp => mp.stats && mp.stats.completedMeetings > 0)
      .sort((a, b) => {
        if (b.stats.averageRating !== a.stats.averageRating) {
          return b.stats.averageRating - a.stats.averageRating;
        }
        return b.stats.completedMeetings - a.stats.completedMeetings;
      })
      .slice(0, 5)
      .map(mp => ({
        mentorUserId: mp.userId?._id,
        name: mp.userId?.name || 'Bilinmeyen',
        email: mp.userId?.email,
        averageRating: mp.stats.averageRating || 0,
        completedMeetings: mp.stats.completedMeetings || 0,
        totalMeetings: mp.stats.totalMeetings || 0
      }));

    // Son aktiviteler (son 10 görüşme) — ideathonId filtreli
    const recentMeetings = await MentorMeeting.find(meetingFilter)
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('mentorUserId', 'name')
      .populate('participantUserId', 'name');

    const recentActivity = recentMeetings.map(meeting => ({
      type: `meeting_${meeting.status}`,
      mentorName: meeting.mentorUserId?.name || 'Bilinmeyen',
      participantName: meeting.participantUserId?.name || 'Bilinmeyen',
      timestamp: meeting.createdAt,
      status: meeting.status
    }));

    res.json({
      success: true,
      data: {
        mentors: {
          total: totalMentors,
          active: activeMentors,
          inactive: inactiveMentors
        },
        meetings: meetingStats,
        ratings: ratingStats,
        topPerformers,
        recentActivity
      }
    });
  } catch (error) {
    console.error('getSuperadminDashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Dashboard istatistikleri getirilirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Tüm mentorları genişletilmiş istatistiklerle listele (SuperAdmin)
// @route   GET /api/mentornet/mentors/with-stats
// @access  SuperAdmin / Admin
exports.getMentorsWithExtendedStats = async (req, res) => {
  try {
    const { searchText, expertiseTags, isActive, page = 1, limit = 10 } = req.query;
    
    const isAdmin = req.user && ['superadmin', 'admin'].includes(req.user.role);
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Bu endpoint sadece admin kullanıcılar için'
      });
    }
    
    // Query oluştur
    const query = {};
    
    // Multi-Tenant: ideathonId filtresi
    const ideathonId = req.ideathonId;
    if (ideathonId) {
      query.ideathonId = ideathonId;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    if (expertiseTags) {
      const tagsArray = Array.isArray(expertiseTags) ? expertiseTags : [expertiseTags];
      query.expertiseTags = { $in: tagsArray };
    }
    
    if (searchText) {
      query.$text = { $search: searchText };
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Mentorları getir
    const mentors = await MentorProfile.find(query)
      .populate('userId', 'name email phone role')
      .populate('createdBy', 'name email')
      .populate('ideathonId', 'name slug status')
      .sort({ 'stats.averageRating': -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await MentorProfile.countDocuments(query);

    // Her mentor için genişletilmiş istatistikler
    const mentorsWithStats = await Promise.all(
      mentors.map(async (mentor) => {
        const userId = mentor.userId?._id;
        
        if (!userId) {
          return {
            ...mentor.toJSON(),
            extendedStats: {
              upcomingMeetings: 0,
              lastMeetingDate: null,
              meetingsByStatus: {
                completed: 0,
                scheduled: 0,
                cancelled: 0,
                noShow: 0
              }
            }
          };
        }

        // Multi-Tenant base filter
        const baseFilter = { mentorUserId: userId };
        if (ideathonId) baseFilter.ideathonId = ideathonId;

        // Yaklaşan görüşmeler
        const upcomingCount = await MentorMeeting.countDocuments({
          ...baseFilter,
          status: 'scheduled',
          startAt: { $gt: new Date() }
        });

        // Son görüşme tarihi
        const lastMeeting = await MentorMeeting.findOne({
          ...baseFilter,
          status: { $in: ['completed', 'scheduled'] }
        })
          .sort({ startAt: -1 })
          .select('startAt');

        // Status'e göre görüşmeler
        const meetings = await MentorMeeting.find(baseFilter);
        const meetingsByStatus = {
          completed: meetings.filter(m => m.status === 'completed').length,
          scheduled: meetings.filter(m => m.status === 'scheduled').length,
          cancelled: meetings.filter(m => m.status === 'cancelled').length,
          noShow: meetings.filter(m => m.status === 'no_show').length
        };

        return {
          ...mentor.toJSON(),
          extendedStats: {
            upcomingMeetings: upcomingCount,
            lastMeetingDate: lastMeeting ? lastMeeting.startAt : null,
            meetingsByStatus
          }
        };
      })
    );

    res.json({
      success: true,
      count: mentorsWithStats.length,
      data: mentorsWithStats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalMentors: total,
        hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('getMentorsWithExtendedStats error:', error);
    res.status(500).json({
      success: false,
      message: 'Mentorlar genişletilmiş istatistiklerle getirilirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Tekil mentor detaylı istatistikleri (SuperAdmin)
// @route   GET /api/mentornet/mentors/:id/detailed-stats
// @access  SuperAdmin / Admin
exports.getMentorDetailedStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    const isAdmin = req.user && ['superadmin', 'admin'].includes(req.user.role);
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Bu endpoint sadece admin kullanıcılar için'
      });
    }

    // Geçmiş scheduled toplantıları otomatik tamamla (istatistik doğruluğu için)
    await MentorMeeting.autoCompletePastMeetings();

    // ID'nin User ID mi yoksa MentorProfile ID mi olduğunu kontrol et
    let mentorProfile = await MentorProfile.findOne({ userId: id })
      .populate('userId', 'name email phone role')
      .populate('createdBy', 'name email')
      .populate('ideathonId', 'name slug status');

    // User ID ile bulunamadıysa, MentorProfile ID ile dene
    if (!mentorProfile) {
      mentorProfile = await MentorProfile.findById(id)
        .populate('userId', 'name email phone role')
        .populate('createdBy', 'name email')
        .populate('ideathonId', 'name slug status');
    }

    if (!mentorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Mentor profili bulunamadı'
      });
    }

    const userId = mentorProfile.userId._id;

    // Multi-Tenant: ideathonId filtresi (admin header/query'den)
    const ideathonId = req.ideathonId;
    const meetingFilter = { mentorUserId: userId };
    if (ideathonId) meetingFilter.ideathonId = ideathonId;

    // Tüm görüşmeler — ideathonId filtreli
    const allMeetings = await MentorMeeting.find(meetingFilter)
      .populate('participantUserId', 'name email')
      .sort({ startAt: -1 });

    // Status'e göre grupla
    const byStatus = {
      completed: allMeetings.filter(m => m.status === 'completed').length,
      scheduled: allMeetings.filter(m => m.status === 'scheduled').length,
      cancelled: allMeetings.filter(m => m.status === 'cancelled').length,
      noShow: allMeetings.filter(m => m.status === 'no_show').length,
      rescheduled: allMeetings.filter(m => m.status === 'rescheduled').length
    };

    // Aylık istatistikler (son 6 ay)
    const byMonth = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const monthKey = `${year}-${month}`;
      
      const count = allMeetings.filter(m => {
        const meetingDate = new Date(m.startAt);
        const meetingMonth = `${meetingDate.getFullYear()}-${String(meetingDate.getMonth() + 1).padStart(2, '0')}`;
        return meetingMonth === monthKey;
      }).length;
      
      byMonth.push({ month: monthKey, count });
    }

    // Ortalama süre
    const completedMeetings = allMeetings.filter(m => m.status === 'completed');
    const totalDuration = completedMeetings.reduce((sum, m) => {
      return sum + (m.duration || 0);
    }, 0);
    const averageDuration = completedMeetings.length > 0 
      ? Math.round(totalDuration / completedMeetings.length) 
      : 0;

    const completionRate = allMeetings.length > 0
      ? Math.round((byStatus.completed / allMeetings.length) * 100)
      : 0;

    // Puan istatistikleri
    const feedbackStats = await MeetingFeedback.getMentorAverageRating(userId);

    // Son feedbackler
    const meetingIds = allMeetings.map(m => m._id);
    const recentFeedbacks = await MeetingFeedback.find({
      meetingId: { $in: meetingIds },
      feedbackType: 'participant_to_mentor',
      isVisible: true
    })
      .populate('filledByUserId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    const formattedFeedbacks = recentFeedbacks.map(f => ({
      rating: f.rating,
      comment: f.comment,
      participantName: f.isAnonymous ? 'Anonim' : (f.filledByUserId?.name || 'Anonim'),
      createdAt: f.createdAt,
      isAnonymous: f.isAnonymous || false
    }));

    // Yaklaşan görüşmeler — ideathonId filtreli
    const upcomingMeetings = await MentorMeeting.find({
      ...meetingFilter,
      status: 'scheduled',
      startAt: { $gt: new Date() }
    })
      .populate('participantUserId', 'name email')
      .sort({ startAt: 1 })
      .limit(10);

    const upcomingMeetingsData = upcomingMeetings.map(m => ({
      _id: m._id,
      participant: m.participantUserId?.name || 'Bilinmeyen',
      participantEmail: m.participantUserId?.email,
      startAt: m.startAt,
      endAt: m.endAt,
      title: m.title,
      description: m.description,
      provider: m.provider
    }));

    // Katılımcı istatistikleri
    const uniqueParticipants = new Set(
      allMeetings.map(m => m.participantUserId?._id?.toString()).filter(Boolean)
    );

    const participantCounts = {};
    allMeetings.forEach(m => {
      const participantId = m.participantUserId?._id?.toString();
      if (participantId) {
        participantCounts[participantId] = (participantCounts[participantId] || 0) + 1;
      }
    });

    const repeatingParticipants = Object.values(participantCounts).filter(count => count > 1).length;

    res.json({
      success: true,
      data: {
        mentor: mentorProfile,
        meetingStats: {
          total: allMeetings.length,
          byStatus,
          byMonth,
          completionRate,
          averageDuration
        },
        rating: {
          ...feedbackStats,
          recentFeedbacks: formattedFeedbacks
        },
        upcomingMeetings: upcomingMeetingsData,
        participants: {
          total: uniqueParticipants.size,
          repeating: repeatingParticipants
        }
      }
    });
  } catch (error) {
    console.error('getMentorDetailedStats error:', error);
    res.status(500).json({
      success: false,
      message: 'Mentor detaylı istatistikleri getirilirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Katılımcıları takımlarıyla beraber getir (Mentor Paneli için)
// @route   GET /api/mentornet/participants
// @access  Mentor / Admin
exports.getParticipantsWithTeams = async (req, res) => {
  try {
    const isAdmin = req.user && ['superadmin', 'admin'].includes(req.user.role);
    const isMentor = req.user && req.user.role === 'mentor';

    // Multi-Tenant: ideathonId filtresi
    let ideathonId = req.ideathonId;

    // Admin ise header/query'den de alabilir
    if (isAdmin) {
      const Ideathon = require('../models/Ideathon');
      if (req.query.event) {
        const ideathon = await Ideathon.findOne({ slug: req.query.event, status: 'active' }).select('_id').lean();
        if (ideathon) ideathonId = ideathon._id.toString();
      } else if (req.headers['x-ideathon-id']) {
        ideathonId = req.headers['x-ideathon-id'];
      } else if (req.query.ideathonId) {
        ideathonId = req.query.ideathonId;
      }
    }

    // Mentor ise: sadece kendisine atanmış kullanıcıları göster
    let assignedUserIds = null;
    let mentorIdeathonId = null;
    if (isMentor) {
      const mentorProfile = await MentorProfile.findOne({ userId: req.user._id }).lean();
      if (mentorProfile) {
        assignedUserIds = (mentorProfile.assignedUsers || []).map(id => id.toString());
        mentorIdeathonId = mentorProfile.ideathonId;
        // Mentor'un ideathon'unu kullan
        if (!ideathonId && mentorIdeathonId) {
          ideathonId = mentorIdeathonId.toString();
        }
      }
    }

    const teamQuery = { isActive: true };
    const appQuery = { status: 'approved' };
    if (ideathonId) {
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(ideathonId)) {
        teamQuery.ideathonId = ideathonId;
        appQuery.ideathonId = ideathonId;
      }
    }
    
    // 1. YENİ SİSTEM: Team modelinden aktif takımları çek
    const activeTeams = await Team.find(teamQuery)
      .populate('createdBy', 'name email _id')
      .select('teamName teamDescription city members createdBy createdAt')
      .lean();

    // 2. ESKİ SİSTEM: Onaylanmış başvuruları getir
    const approvedApplications = await Application.find(appQuery)
      .select('userId personalInfo teamInfo applicationNumber submittedAt')
      .lean();

    // Takım yöneticilerini (team owners) ve takım üyelerini ayır
    const teamOwnersMap = new Map(); // teamName -> owner data
    const teamMembersMap = new Map(); // teamName -> [members]
    const individualParticipants = []; // Takımsız katılımcılar
    const processedUserIds = new Set(); // İşlenmiş user ID'ler

    // Helper: bu userId atanmış mı? Sadece admin tüm kayıtları görebilir
    const isUserAssigned = (uid) => {
      if (isAdmin) return true;
      if (!assignedUserIds) return false;
      return assignedUserIds.includes(uid);
    };

    // ============ YENİ SİSTEM: Team modelinden gelen takımları işle ============
    for (const team of activeTeams) {
      const teamName = team.teamName.trim();
      const createdBy = team.createdBy;
      
      if (!createdBy || !createdBy._id) continue;
      
      const userId = createdBy._id.toString();

      // Mentor ise: sadece atanmış kullanıcıların takımlarını göster
      if (!isUserAssigned(userId)) continue;

      processedUserIds.add(userId);
      
      // Kullanıcının Application'ı varsa bilgilerini al, yoksa User'dan al
      const userApplication = approvedApplications.find(app => 
        app.userId?.toString() === userId
      );
      
      const ownerData = {
        userId: userId,
        applicationId: userApplication?._id?.toString() || null,
        firstName: userApplication?.personalInfo?.firstName || createdBy.name.split(' ')[0] || '',
        lastName: userApplication?.personalInfo?.lastName || createdBy.name.split(' ').slice(1).join(' ') || '',
        fullName: userApplication ? 
          `${userApplication.personalInfo?.firstName || ''} ${userApplication.personalInfo?.lastName || ''}`.trim() :
          createdBy.name,
        email: userApplication?.personalInfo?.email || createdBy.email || '',
        phone: userApplication?.personalInfo?.phone || '',
        city: team.city || userApplication?.personalInfo?.city || '',
        tcIdentity: userApplication?.personalInfo?.tcIdentity || '',
        applicationNumber: userApplication?.applicationNumber || null,
        submittedAt: userApplication?.submittedAt || team.createdAt,
        teamName: teamName,
        isTeamOwner: true,
        role: 'Takım Yöneticisi',
        isAssigned: true
      };
      
      teamOwnersMap.set(teamName, ownerData);
      
      // Takım üyelerini ekle
      const teamMembers = (team.members || []).map(member => ({
        firstName: member.name ? member.name.split(' ')[0] : '',
        lastName: member.name ? member.name.split(' ').slice(1).join(' ') : '',
        fullName: member.name || '',
        email: member.email || '',
        phone: '',
        tcIdentity: member.tcIdentity || '',
        role: member.role || 'Takım Üyesi',
        isTeamMember: true
      }));
      
      teamMembersMap.set(teamName, teamMembers);
    }

    // ============ ESKİ SİSTEM: Application modelinden gelen başvuruları işle ============
    approvedApplications.forEach(app => {
      const userId = app.userId?.toString();
      
      // Bu kullanıcı zaten Team modelinde işlendiyse atla
      if (userId && processedUserIds.has(userId)) {
        return;
      }

      // Mentor ise: sadece atanmış kullanıcıları göster
      if (userId && !isUserAssigned(userId)) return;
      
      const isInTeam = app.teamInfo?.isInTeam;
      const teamName = app.teamInfo?.teamName?.trim();
      
      const participantData = {
        userId: userId || null,
        applicationId: app._id.toString(),
        firstName: app.personalInfo?.firstName || '',
        lastName: app.personalInfo?.lastName || '',
        fullName: `${app.personalInfo?.firstName || ''} ${app.personalInfo?.lastName || ''}`.trim(),
        email: app.personalInfo?.email || '',
        phone: app.personalInfo?.phone || '',
        city: app.personalInfo?.city || '',
        tcIdentity: app.personalInfo?.tcIdentity || '',
        applicationNumber: app.applicationNumber,
        submittedAt: app.submittedAt,
        isAssigned: true
      };

      if (isInTeam && teamName) {
        // Takım üyesi
        const hasOriginalTeamMembers = app.teamInfo?.teamMembers && 
                                      Array.isArray(app.teamInfo.teamMembers) && 
                                      app.teamInfo.teamMembers.length > 0;

        if (hasOriginalTeamMembers) {
          // Bu kişi takım yöneticisi (team owner)
          if (!teamOwnersMap.has(teamName)) {
            teamOwnersMap.set(teamName, {
              ...participantData,
              teamName: teamName,
              isTeamOwner: true,
              role: 'Takım Yöneticisi'
            });
            teamMembersMap.set(teamName, []);
          }

          // Takım üyelerini ekle
          const teamMembers = app.teamInfo.teamMembers.map(member => {
            const nameParts = (member.name || '').trim().split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            
            return {
              firstName: firstName,
              lastName: lastName,
              fullName: member.name || '',
              email: member.email || '',
              phone: member.phone || '',
              tcIdentity: member.tcIdentity || '',
              role: member.role || 'Takım Üyesi',
              isTeamMember: true
            };
          });

          if (!teamMembersMap.has(teamName)) {
            teamMembersMap.set(teamName, []);
          }
          teamMembersMap.get(teamName).push(...teamMembers);
        } else {
          // Takıma sonradan eklenen bireysel katılımcı
          if (!teamMembersMap.has(teamName)) {
            teamMembersMap.set(teamName, []);
          }
          
          teamMembersMap.get(teamName).push({
            ...participantData,
            role: 'Takıma Eklenen Üye',
            isAddedMember: true
          });
        }
      } else {
        // Takımsız bireysel katılımcı
        individualParticipants.push({
          ...participantData,
          role: 'Bireysel Katılımcı',
          isIndividual: true
        });
      }
      
      if (userId) {
        processedUserIds.add(userId);
      }
    });

    // Takımları oluştur
    const teams = [];
    teamOwnersMap.forEach((owner, teamName) => {
      const members = teamMembersMap.get(teamName) || [];
      
      teams.push({
        teamName: teamName,
        teamOwner: owner,
        teamMembers: members,
        totalMembers: members.length,
        createdAt: owner.submittedAt
      });
    });

    // Tüm katılımcıları birleştir (takım yöneticileri + bireysel)
    const allParticipants = [
      ...Array.from(teamOwnersMap.values()),
      ...individualParticipants
    ];

    res.json({
      success: true,
      count: allParticipants.length,
      data: {
        participants: allParticipants.sort((a, b) => {
          return a.fullName.localeCompare(b.fullName, 'tr');
        }),
        teams: teams.sort((a, b) => {
          return a.teamName.localeCompare(b.teamName, 'tr');
        }),
        summary: {
          totalParticipants: allParticipants.length,
          totalTeams: teams.length,
          totalIndividualParticipants: individualParticipants.length,
          totalTeamOwners: teamOwnersMap.size
        }
      }
    });
  } catch (error) {
    console.error('getParticipantsWithTeams error:', error);
    res.status(500).json({
      success: false,
      message: 'Katılımcılar getirilirken hata oluştu',
      error: error.message
    });
  }
};

// ==================== MENTOR USER ASSIGNMENT ====================

// @desc    Mentor'a superadmin tarafından atanmış kullanıcıları getir
// @route   GET /api/mentornet/mentors/my-assigned-users
// @access  Mentor
exports.getMyAssignedUsers = async (req, res) => {
  try {
    const mentorProfile = await MentorProfile.findOne({ userId: req.user._id }).lean();

    if (!mentorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Mentor profili bulunamadı'
      });
    }

    const assignedUserIds = mentorProfile.assignedUsers || [];
    if (assignedUserIds.length === 0) {
      return res.json({
        success: true,
        count: 0,
        data: []
      });
    }

    const ideathonId = mentorProfile.ideathonId || req.ideathonId;

    const Application = require('../models/Application');
    const Team = require('../models/Team');

    const query = {
      userId: { $in: assignedUserIds },
      status: 'approved'
    };
    if (ideathonId) {
      query.ideathonId = ideathonId;
    }

    const applications = await Application.find(query)
      .populate('userId', 'name email phone')
      .select('userId personalInfo teamInfo')
      .lean();

    const teamIds = applications
      .map(a => a.teamInfo?.teamId)
      .filter(Boolean);

    const teamsMap = new Map();
    if (teamIds.length > 0) {
      const teams = await Team.find({ _id: { $in: teamIds } })
        .select('teamName')
        .lean();
      teams.forEach(t => teamsMap.set(t._id.toString(), t.teamName));
    }

    const data = applications
      .filter(a => a.userId)
      .map(a => {
        const teamName = a.teamInfo?.teamId
          ? teamsMap.get(a.teamInfo.teamId.toString()) || a.teamInfo?.teamName || null
          : a.teamInfo?.teamName || null;

        return {
          _id: a.userId._id,
          name: a.userId.name,
          email: a.userId.email,
          phone: a.userId.phone || null,
          applicationId: a._id,
          teamName,
          teamId: a.teamInfo?.teamId || null
        };
      });

    res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    console.error('getMyAssignedUsers error:', error);
    res.status(500).json({
      success: false,
      message: 'Katılımcılar getirilirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Mentora atanmış kullanıcıları getir + ideathondaki tüm kullanıcıları göster
// @route   GET /api/mentornet/mentors/:userId/assigned-users
// @access  SuperAdmin / Admin
exports.getMentorAssignedUsers = async (req, res) => {
  try {
    const { userId } = req.params;

    const mentorProfile = await MentorProfile.findOne({ userId })
      .populate('userId', 'name email phone role')
      .lean();

    if (!mentorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Mentor profili bulunamadı'
      });
    }

    const assignedUserIds = (mentorProfile.assignedUsers || []).map(id => id.toString());

    let allIdeathonUsers = [];
    let ideathonInfo = null;

    if (mentorProfile.ideathonId) {
      const Ideathon = require('../models/Ideathon');
      const Application = require('../models/Application');
      const Team = require('../models/Team');

      const ideathon = await Ideathon.findById(mentorProfile.ideathonId).select('name slug status').lean();
      if (ideathon) {
        ideathonInfo = { _id: ideathon._id, name: ideathon.name, slug: ideathon.slug, status: ideathon.status };
      }

      // Basvurulari getir (takim ve durum bilgisiyle)
      const applications = await Application.find({
        ideathonId: mentorProfile.ideathonId,
        status: { $ne: 'withdrawn' }
      })
        .populate('userId', 'name email phone')
        .select('userId status teamInfo')
        .lean();

      // Takim isimlerini cek
      const teamIds = applications.map(a => a.teamInfo?.teamId).filter(Boolean);
      const teamsMap = new Map();
      if (teamIds.length > 0) {
        const teams = await Team.find({ _id: { $in: teamIds } }).select('teamName').lean();
        teams.forEach(t => teamsMap.set(t._id.toString(), t.teamName));
      }

      const seen = new Set();
      for (const app of applications) {
        if (!app.userId || seen.has(app.userId._id.toString())) continue;
        seen.add(app.userId._id.toString());

        const teamName = app.teamInfo?.teamId
          ? teamsMap.get(app.teamInfo.teamId.toString()) || app.teamInfo?.teamName || null
          : app.teamInfo?.teamName || null;

        allIdeathonUsers.push({
          _id: app.userId._id,
          name: app.userId.name,
          email: app.userId.email,
          phone: app.userId.phone || null,
          teamName,
          applicationStatus: app.status
        });
      }
    }

    const usersWithAssignment = allIdeathonUsers.map(user => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || null,
      teamName: user.teamName || null,
      applicationStatus: user.applicationStatus || null,
      isAssigned: assignedUserIds.includes(user._id.toString())
    }));

    usersWithAssignment.sort((a, b) => {
      if (a.isAssigned !== b.isAssigned) return b.isAssigned - a.isAssigned;
      return a.name.localeCompare(b.name, 'tr');
    });

    const assignedCount = usersWithAssignment.filter(u => u.isAssigned).length;

    res.json({
      success: true,
      data: {
        mentor: {
          _id: mentorProfile._id,
          userId: mentorProfile.userId,
          title: mentorProfile.title,
          ideathonId: mentorProfile.ideathonId
        },
        ideathon: ideathonInfo,
        users: usersWithAssignment,
        summary: {
          totalUsers: allIdeathonUsers.length,
          totalIdeathonUsers: allIdeathonUsers.length,
          assignedCount,
          unassignedCount: allIdeathonUsers.length - assignedCount
        }
      }
    });
  } catch (error) {
    console.error('getMentorAssignedUsers error:', error);
    res.status(500).json({
      success: false,
      message: 'Mentor atanmış kullanıcıları getirilirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Mentora kullanıcı ata/çıkar (toplu güncelleme)
// @route   PUT /api/mentornet/mentors/:userId/assign-users
// @access  SuperAdmin / Admin
exports.updateMentorAssignedUsers = async (req, res) => {
  try {
    const { userId } = req.params;
    const { assignedUserIds } = req.body;

    if (!Array.isArray(assignedUserIds)) {
      return res.status(400).json({
        success: false,
        message: 'assignedUserIds bir array olmalıdır'
      });
    }

    const mentorProfile = await MentorProfile.findOne({ userId });

    if (!mentorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Mentor profili bulunamadı'
      });
    }

    // Gönderilen user ID'lerin geçerliliğini kontrol et
    const mongoose = require('mongoose');
    const validIds = assignedUserIds.filter(id => mongoose.Types.ObjectId.isValid(id));

    // Kullanıcıların varlığını kontrol et (sadece ideathondaki user'lar)
    const existingUsers = await User.find({
      _id: { $in: validIds },
      role: 'user',
      isActive: true
    }).select('_id').lean();

    const existingUserIds = existingUsers.map(u => u._id);

    // Güncelle
    mentorProfile.assignedUsers = existingUserIds;
    await mentorProfile.save();

    await mentorProfile.populate('userId', 'name email phone role');

    // İdeathon bilgisi
    let ideathonInfo = null;
    if (mentorProfile.ideathonId) {
      const Ideathon = require('../models/Ideathon');
      const ideathon = await Ideathon.findById(mentorProfile.ideathonId).select('name slug status').lean();
      if (ideathon) {
        ideathonInfo = { _id: ideathon._id, name: ideathon.name, slug: ideathon.slug, status: ideathon.status };
      }
    }

    res.json({
      success: true,
      message: `Mentora ${existingUserIds.length} kullanıcı atandı`,
      data: {
        mentor: {
          _id: mentorProfile._id,
          userId: mentorProfile.userId,
          title: mentorProfile.title,
          ideathonId: mentorProfile.ideathonId
        },
        ideathon: ideathonInfo,
        assignedUsersCount: existingUserIds.length
      }
    });
  } catch (error) {
    console.error('updateMentorAssignedUsers error:', error);
    res.status(500).json({
      success: false,
      message: 'Mentor kullanıcı ataması güncellenirken hata oluştu',
      error: error.message
    });
  }
};

module.exports = exports;

