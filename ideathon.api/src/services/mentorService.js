const Mentor = require('../models/Mentor');
const fs = require('fs').promises;
const path = require('path');

class MentorService {

  // Tüm mentorleri listele (admin/superadmin)
  async getAllMentors(filters = {}, options = {}) {
    try {
      const { page = 1, limit = 10, sort = '-createdAt' } = options;
      const skip = (page - 1) * limit;

      let query = {};

      // Multi-Tenant: İdeathon filtresi
      if (filters.ideathonId) {
        query.ideathonId = filters.ideathonId;
      }

      // Aktiflik filtresi
      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
      }

      // Arama filtresi (isim veya statüde)
      if (filters.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { status: { $regex: filters.search, $options: 'i' } },
          { description: { $regex: filters.search, $options: 'i' } }
        ];
      }

      const mentors = await Mentor.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email');

      const total = await Mentor.countDocuments(query);

      return {
        mentors,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalMentors: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Mentorler getirilirken hata oluştu: ${error.message}`);
    }
  }

  // Mentor detayını getir
  async getMentorById(mentorId) {
    try {
      const mentor = await Mentor.findById(mentorId)
        .populate('createdBy', 'name email');

      if (!mentor) {
        throw new Error('Mentor bulunamadı');
      }

      return mentor;
    } catch (error) {
      if (error.name === 'CastError') {
        throw new Error('Geçersiz mentor ID');
      }
      throw error;
    }
  }

  // Yeni mentor oluştur
  async createMentor(mentorData, photoFile, createdBy) {
    try {
      // Fotoğraf kontrolü
      if (!photoFile) {
        throw new Error('Mentor fotoğrafı zorunludur');
      }

      // ideathonId mentorData içinde geliyor (controller'dan)
      const mentor = new Mentor({
        ...mentorData,
        photo: photoFile.filename, // Multer tarafından oluşturulan dosya adı
        createdBy
      });

      await mentor.save();
      return await this.getMentorById(mentor._id);
    } catch (error) {
      // Hata durumunda yüklenen dosyayı sil
      if (photoFile && photoFile.path) {
        try {
          await fs.unlink(photoFile.path);
        } catch (unlinkError) {
          console.error('Fotoğraf silme hatası:', unlinkError.message);
        }
      }
      throw error;
    }
  }

  // Mentor güncelle
  async updateMentor(mentorId, updateData, photoFile = null) {
    try {
      const mentor = await Mentor.findById(mentorId);

      if (!mentor) {
        throw new Error('Mentor bulunamadı');
      }

      // Eski fotoğraf yolunu kaydet
      const oldPhotoPath = photoFile ? path.join(__dirname, '../../uploads/mentors', mentor.photo) : null;

      // Güncellemeleri uygula
      Object.keys(updateData).forEach(key => {
        if (key !== 'photo' && key !== '_id') {
          mentor[key] = updateData[key];
        }
      });

      // Yeni fotoğraf varsa güncelle
      if (photoFile) {
        mentor.photo = photoFile.filename;
      }

      await mentor.save();

      // Eski fotoğrafı sil (yeni fotoğraf yüklendiyse)
      if (oldPhotoPath && photoFile) {
        try {
          await fs.unlink(oldPhotoPath);
        } catch (unlinkError) {
          console.error('Eski fotoğraf silme hatası:', unlinkError.message);
        }
      }

      return await this.getMentorById(mentor._id);
    } catch (error) {
      // Hata durumunda yeni yüklenen dosyayı sil
      if (photoFile && photoFile.path) {
        try {
          await fs.unlink(photoFile.path);
        } catch (unlinkError) {
          console.error('Yeni fotoğraf silme hatası:', unlinkError.message);
        }
      }
      throw error;
    }
  }

  // Mentor sil (soft delete - isActive = false)
  async deleteMentor(mentorId) {
    try {
      const mentor = await Mentor.findById(mentorId);

      if (!mentor) {
        throw new Error('Mentor bulunamadı');
      }

      mentor.isActive = false;
      await mentor.save();

      return { message: 'Mentor başarıyla silindi' };
    } catch (error) {
      throw error;
    }
  }

  // Mentor kalıcı olarak sil (hard delete)
  async hardDeleteMentor(mentorId) {
    try {
      const mentor = await Mentor.findById(mentorId);

      if (!mentor) {
        throw new Error('Mentor bulunamadı');
      }

      // Fotoğraf dosyasını sil
      if (mentor.photo) {
        const photoPath = path.join(__dirname, '../../uploads/mentors', mentor.photo);
        try {
          await fs.unlink(photoPath);
        } catch (unlinkError) {
          console.error('Fotoğraf silme hatası:', unlinkError.message);
        }
      }

      await Mentor.findByIdAndDelete(mentorId);

      return { message: 'Mentor kalıcı olarak silindi' };
    } catch (error) {
      throw error;
    }
  }

  // Aktif mentorleri getir (public API için)
  async getActiveMentors() {
    try {
      return await Mentor.findActiveMentors()
        .populate('createdBy', 'name');
    } catch (error) {
      throw new Error(`Aktif mentorler getirilirken hata oluştu: ${error.message}`);
    }
  }

  // Mentor sıralamasını güncelle
  async updateMentorOrder(mentorId, newOrder) {
    try {
      const mentor = await Mentor.findById(mentorId);

      if (!mentor) {
        throw new Error('Mentor bulunamadı');
      }

      mentor.order = newOrder;
      await mentor.save();

      return await this.getMentorById(mentor._id);
    } catch (error) {
      throw error;
    }
  }

  // Mentor istatistikleri
  async getMentorStats(ideathonId = null) {
    try {
      if (ideathonId) {
        const query = { ideathonId };
        return {
          total: await Mentor.countDocuments(query),
          active: await Mentor.countDocuments({ ...query, isActive: true }),
          inactive: await Mentor.countDocuments({ ...query, isActive: false })
        };
      }
      return await Mentor.getMentorStats();
    } catch (error) {
      throw new Error(`Mentor istatistikleri alınırken hata oluştu: ${error.message}`);
    }
  }

  // === SUPERADMIN İSTATİSTİK METODLARı ===

  // Mentor görüşme istatistikleri
  async getMentorMeetingStats(mentorId, ideathonId = null) {
    try {
      const MentorMeeting = require('../models/MentorMeeting');

      // Multi-Tenant: ideathonId filtresi
      const meetingFilter = { mentorUserId: mentorId };
      if (ideathonId) meetingFilter.ideathonId = ideathonId;

      const meetings = await MentorMeeting.find(meetingFilter);
      
      const stats = {
        total: meetings.length,
        completed: meetings.filter(m => m.status === 'completed').length,
        scheduled: meetings.filter(m => m.status === 'scheduled').length,
        cancelled: meetings.filter(m => m.status === 'cancelled').length,
        noShow: meetings.filter(m => m.status === 'no_show').length,
        rescheduled: meetings.filter(m => m.status === 'rescheduled').length
      };

      stats.completionRate = stats.total > 0 
        ? Math.round((stats.completed / stats.total) * 100) 
        : 0;

      return stats;
    } catch (error) {
      throw new Error(`Mentor görüşme istatistikleri alınırken hata: ${error.message}`);
    }
  }

  // Mentor puan istatistikleri
  async getMentorRatingStats(mentorId, ideathonId = null) {
    try {
      const MeetingFeedback = require('../models/MeetingFeedback');
      const MentorMeeting = require('../models/MentorMeeting');

      // Multi-Tenant: ideathonId filtresi
      const meetingFilter = { mentorUserId: mentorId };
      if (ideathonId) meetingFilter.ideathonId = ideathonId;

      // Mentor'un toplantılarını bul
      const meetings = await MentorMeeting.find(meetingFilter).select('_id');
      const meetingIds = meetings.map(m => m._id);

      // Bu toplantılara verilen feedbackleri bul
      const feedbacks = await MeetingFeedback.find({
        meetingId: { $in: meetingIds },
        feedbackType: 'participant_to_mentor',
        isVisible: true
      });

      if (feedbacks.length === 0) {
        return {
          average: 0,
          total: 0,
          distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        };
      }

      const totalRating = feedbacks.reduce((sum, f) => sum + f.rating, 0);
      const average = totalRating / feedbacks.length;

      return {
        average: Math.round(average * 10) / 10,
        total: feedbacks.length,
        distribution: {
          5: feedbacks.filter(f => f.rating === 5).length,
          4: feedbacks.filter(f => f.rating === 4).length,
          3: feedbacks.filter(f => f.rating === 3).length,
          2: feedbacks.filter(f => f.rating === 2).length,
          1: feedbacks.filter(f => f.rating === 1).length
        }
      };
    } catch (error) {
      throw new Error(`Mentor puan istatistikleri alınırken hata: ${error.message}`);
    }
  }

  // Tüm mentorler için genişletilmiş liste
  async getAllMentorsWithStats(filters = {}, options = {}) {
    try {
      const { page = 1, limit = 10, sort = '-createdAt' } = options;
      const skip = (page - 1) * limit;
      const ideathonId = filters.ideathonId || null;

      let query = {};

      // Multi-Tenant: İdeathon filtresi
      if (ideathonId) {
        query.ideathonId = ideathonId;
      }

      // Aktiflik filtresi
      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
      }

      // Arama filtresi
      if (filters.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { status: { $regex: filters.search, $options: 'i' } },
          { description: { $regex: filters.search, $options: 'i' } }
        ];
      }

      const mentors = await Mentor.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email');

      const total = await Mentor.countDocuments(query);

      console.log('📊 getAllMentorsWithStats - Mentor sayısı:', mentors.length);
      console.log('📊 getAllMentorsWithStats - Toplam:', total);

      // Eğer mentor yoksa direkt boş döndür
      if (mentors.length === 0) {
        return {
          mentors: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalMentors: 0,
            hasNext: false,
            hasPrev: false
          }
        };
      }

      // Her mentor için istatistikleri ekle
      const mentorsWithStats = await Promise.all(
        mentors.map(async (mentor) => {
          try {
            const User = require('../models/User');
            const MentorMeeting = require('../models/MentorMeeting');

            // Mentor'un User kaydını bul (email ile dene, sonra name ile dene)
            let mentorUser = await User.findOne({ 
              email: mentor.createdBy?.email,
              role: 'mentor'
            });

            // Email ile bulunamazsa, name ile dene
            if (!mentorUser) {
              mentorUser = await User.findOne({ 
                name: mentor.name,
                role: 'mentor'
              });
            }

            console.log(`🔍 Mentor "${mentor.name}" için User bulundu:`, !!mentorUser);

            if (!mentorUser) {
              return {
                ...mentor.toJSON(),
                meetingStats: {
                  total: 0,
                  completed: 0,
                  scheduled: 0,
                  cancelled: 0,
                  noShow: 0,
                  completionRate: 0
                },
                rating: {
                  average: 0,
                  totalRatings: 0,
                  distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
                },
                upcomingMeetings: 0,
                lastMeetingDate: null
              };
            }

            const meetingStats = await this.getMentorMeetingStats(mentorUser._id, ideathonId);
            const ratingStats = await this.getMentorRatingStats(mentorUser._id, ideathonId);

            // Multi-Tenant: ideathonId filtresi
            const meetingBaseFilter = { mentorUserId: mentorUser._id };
            if (ideathonId) meetingBaseFilter.ideathonId = ideathonId;

            // Yaklaşan görüşme sayısı
            const upcomingCount = await MentorMeeting.countDocuments({
              ...meetingBaseFilter,
              status: 'scheduled',
              startAt: { $gt: new Date() }
            });

            // Son görüşme tarihi
            const lastMeeting = await MentorMeeting.findOne({
              ...meetingBaseFilter,
              status: { $in: ['completed', 'scheduled'] }
            })
              .sort({ startAt: -1 })
              .select('startAt');

            return {
              ...mentor.toJSON(),
              meetingStats,
              rating: ratingStats,
              upcomingMeetings: upcomingCount,
              lastMeetingDate: lastMeeting ? lastMeeting.startAt : null
            };
          } catch (error) {
            console.error(`❌ Mentor "${mentor.name}" istatistik hatası:`, error.message);
            // Hata durumunda bile mentor verisini döndür
            return {
              ...mentor.toJSON(),
              meetingStats: {
                total: 0,
                completed: 0,
                scheduled: 0,
                cancelled: 0,
                noShow: 0,
                completionRate: 0
              },
              rating: {
                average: 0,
                totalRatings: 0,
                distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
              },
              upcomingMeetings: 0,
              lastMeetingDate: null
            };
          }
        })
      );

      console.log('✅ getAllMentorsWithStats - İstatistiklerle dönen mentor sayısı:', mentorsWithStats.length);

      return {
        mentors: mentorsWithStats,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalMentors: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('❌ getAllMentorsWithStats Hata:', error);
      throw new Error(`Mentorler istatistiklerle getirilirken hata: ${error.message}`);
    }
  }

  // Dashboard genel istatistikleri
  async getDashboardStats(ideathonId = null) {
    try {
      const MentorMeeting = require('../models/MentorMeeting');
      const MeetingFeedback = require('../models/MeetingFeedback');
      const User = require('../models/User');

      // Mentor sayıları
      const mentorQuery = ideathonId ? { ideathonId } : {};
      const mentorStats = ideathonId
        ? {
            total: await Mentor.countDocuments(mentorQuery),
            active: await Mentor.countDocuments({ ...mentorQuery, isActive: true }),
            inactive: await Mentor.countDocuments({ ...mentorQuery, isActive: false })
          }
        : await Mentor.getMentorStats();

      // Multi-Tenant: ideathonId filtresi
      const meetingFilter = {};
      if (ideathonId) meetingFilter.ideathonId = ideathonId;

      // Tüm görüşmeler
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
        thisMonth: allMeetings.filter(m => m.createdAt >= startOfMonth).length,
        thisWeek: allMeetings.filter(m => m.createdAt >= startOfWeek).length
      };

      // Tüm feedbackler — ideathon filtreli meeting'lerden
      const meetingIds = allMeetings.map(m => m._id);
      const feedbackFilter = {
        feedbackType: 'participant_to_mentor',
        isVisible: true
      };
      if (ideathonId) {
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

      // En iyi performans gösteren mentorlar
      // Multi-Tenant: İdeathon seçilmişse sadece o ideathon'daki mentor kullanıcıları
      let mentorUserQuery = { role: 'mentor' };
      if (ideathonId) {
        const UserIdeathonRole = require('../models/UserIdeathonRole');
        const mentorRoles = await UserIdeathonRole.find({
          ideathonId, role: 'mentor', isActive: true
        }).select('userId').lean();
        const mentorUserIds = mentorRoles.map(r => r.userId);
        mentorUserQuery._id = { $in: mentorUserIds };
      }

      const mentorUsers = await User.find(mentorUserQuery).select('_id name');
      const topPerformers = await Promise.all(
        mentorUsers.map(async (mentorUser) => {
          const mStats = await this.getMentorMeetingStats(mentorUser._id, ideathonId);
          const rStats = await this.getMentorRatingStats(mentorUser._id, ideathonId);
          
          return {
            mentorId: mentorUser._id,
            name: mentorUser.name,
            averageRating: rStats.average,
            completedMeetings: mStats.completed,
            totalMeetings: mStats.total
          };
        })
      );

      // Puana göre sırala ve ilk 5'i al
      const sortedPerformers = topPerformers
        .filter(p => p.totalMeetings > 0)
        .sort((a, b) => {
          if (b.averageRating !== a.averageRating) {
            return b.averageRating - a.averageRating;
          }
          return b.completedMeetings - a.completedMeetings;
        })
        .slice(0, 5);

      // Son aktiviteler (son 10 görüşme)
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

      return {
        mentors: mentorStats,
        meetings: meetingStats,
        ratings: ratingStats,
        topPerformers: sortedPerformers,
        recentActivity
      };
    } catch (error) {
      throw new Error(`Dashboard istatistikleri alınırken hata: ${error.message}`);
    }
  }

  // Tekil mentor detaylı istatistikleri
  async getMentorDetailedStats(mentorId, ideathonId = null) {
    try {
      const MentorMeeting = require('../models/MentorMeeting');
      const MeetingFeedback = require('../models/MeetingFeedback');
      const User = require('../models/User');

      // Mentor bilgisi
      const mentor = await this.getMentorById(mentorId);

      // Mentor User kaydını bul
      const mentorUser = await User.findOne({ 
        name: mentor.name,
        role: 'mentor'
      });

      if (!mentorUser) {
        return {
          mentor: mentor.toJSON(),
          meetingStats: {
            total: 0,
            byStatus: {},
            byMonth: [],
            completionRate: 0,
            averageDuration: 0
          },
          rating: {
            average: 0,
            total: 0,
            distribution: {},
            recentFeedbacks: []
          },
          upcomingMeetings: [],
          participants: {
            total: 0,
            repeating: 0
          }
        };
      }

      // Multi-Tenant: ideathonId filtresi
      const meetingFilter = { mentorUserId: mentorUser._id };
      if (ideathonId) meetingFilter.ideathonId = ideathonId;

      // Tüm görüşmeler
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
      const meetingIds = allMeetings.map(m => m._id);
      const feedbacks = await MeetingFeedback.find({
        meetingId: { $in: meetingIds },
        feedbackType: 'participant_to_mentor',
        isVisible: true
      })
        .populate('filledByUserId', 'name')
        .sort({ createdAt: -1 });

      const ratingStats = {
        average: feedbacks.length > 0
          ? Math.round((feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length) * 10) / 10
          : 0,
        total: feedbacks.length,
        distribution: {
          5: feedbacks.filter(f => f.rating === 5).length,
          4: feedbacks.filter(f => f.rating === 4).length,
          3: feedbacks.filter(f => f.rating === 3).length,
          2: feedbacks.filter(f => f.rating === 2).length,
          1: feedbacks.filter(f => f.rating === 1).length
        },
        recentFeedbacks: feedbacks.slice(0, 5).map(f => ({
          rating: f.rating,
          comment: f.comment,
          participantName: f.filledByUserId?.name || 'Anonim',
          createdAt: f.createdAt
        }))
      };

      // Yaklaşan görüşmeler
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
        meetingUrl: m.meetingUrl,
        title: m.title,
        description: m.description
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

      return {
        mentor: mentor.toJSON(),
        meetingStats: {
          total: allMeetings.length,
          byStatus,
          byMonth,
          completionRate,
          averageDuration
        },
        rating: ratingStats,
        upcomingMeetings: upcomingMeetingsData,
        participants: {
          total: uniqueParticipants.size,
          repeating: repeatingParticipants
        }
      };
    } catch (error) {
      throw new Error(`Mentor detaylı istatistikleri alınırken hata: ${error.message}`);
    }
  }
}

module.exports = new MentorService();









