const MentorMeeting = require('../models/MentorMeeting');
const AvailabilitySlot = require('../models/AvailabilitySlot');
const MeetingFeedback = require('../models/MeetingFeedback');
const MeetingNote = require('../models/MeetingNote');
const Application = require('../models/Application');
const Team = require('../models/Team');
const User = require('../models/User');
const MentorIntegration = require('../models/MentorIntegration');
const emailService = require('../services/emailService');
const oauthService = require('../services/oauthService');

// ==================== HELPER FUNCTIONS ====================

/**
 * Add teamName to user object from Team model or Application model
 * @param {Object} userObj - User object (already converted to plain object)
 * @param {String} userId - User ID
 * @returns {Promise<Object>} User object with teamName added
 */
const addTeamNameToUser = async (userObj, userId) => {
  if (!userObj || !userId) return userObj;
  
  // 1. Önce Team modelinden kontrol et (YENİ SİSTEM)
  const team = await Team.findOne({ 
    createdBy: userId,
    isActive: true
  }).select('teamName').lean();
  
  if (team?.teamName) {
    userObj.teamName = team.teamName;
    return userObj;
  }
  
  // 2. Team modelinde yoksa Application modelinden bak (ESKİ SİSTEM)
  const application = await Application.findOne({ 
    userId: userId, 
    status: 'approved',
    'teamInfo.isInTeam': true
  }).select('teamInfo.teamName').lean();
  
  if (application?.teamInfo?.teamName) {
    userObj.teamName = application.teamInfo.teamName;
  } else {
    userObj.teamName = null;
  }
  
  return userObj;
};

/**
 * Add teamName to meetings' participants from Team or Application model
 * @param {Array} meetings - Array of meeting objects
 * @returns {Promise<Array>} Meetings with teamName added to participants
 */
const addTeamNameToMeetings = async (meetings) => {
  if (!meetings || meetings.length === 0) return [];
  
  // Collect all unique participant IDs
  const participantIds = new Set();
  meetings.forEach(meeting => {
    const meetingObj = meeting.toObject ? meeting.toObject() : meeting;
    if (meetingObj.participantUserId?._id) {
      participantIds.add(meetingObj.participantUserId._id.toString());
    }
  });
  
  const userIdsArray = Array.from(participantIds);
  
  // 1. Önce Team modelinden kontrol et (YENİ SİSTEM)
  const teams = await Team.find({ 
    createdBy: { $in: userIdsArray },
    isActive: true
  }).select('createdBy teamName').lean();
  
  const teamMap = new Map();
  teams.forEach(team => {
    if (team.teamName) {
      teamMap.set(team.createdBy.toString(), team.teamName);
    }
  });
  
  // 2. Team modelinde olmayan kullanıcılar için Application modelinden bak (ESKİ SİSTEM)
  const usersWithoutTeam = userIdsArray.filter(userId => !teamMap.has(userId));
  
  if (usersWithoutTeam.length > 0) {
    const applications = await Application.find({ 
      userId: { $in: usersWithoutTeam }, 
      status: 'approved',
      'teamInfo.isInTeam': true
    }).select('userId teamInfo.teamName').lean();
    
    applications.forEach(app => {
      if (app.teamInfo?.teamName) {
        teamMap.set(app.userId.toString(), app.teamInfo.teamName);
      }
    });
  }
  
  // Add teamName to each meeting's participant
  return meetings.map(meeting => {
    const meetingObj = meeting.toObject ? meeting.toObject() : { ...meeting };
    
    if (meetingObj.participantUserId?._id) {
      const userId = meetingObj.participantUserId._id.toString();
      meetingObj.participantUserId.teamName = teamMap.get(userId) || null;
    }
    
    return meetingObj;
  });
};

// ==================== MEETINGS ====================

// @desc    Toplantı oluştur (participant/admin)
// @route   POST /api/mentornet/meetings
// @access  Authenticated User
exports.createMeeting = async (req, res) => {
  try {
    const {
      programId,
      mentorUserId,
      slotId,
      participantApplicationId,
      teamId,
      title,
      description,
      meetingProvider
    } = req.body;
    
    if (!mentorUserId || !slotId) {
      return res.status(400).json({
        success: false,
        message: 'Mentor ve slot bilgisi zorunludur'
      });
    }
    
    // ÖNEMLİ: Önce slot'un varlığını ve mentor'a ait olduğunu kontrol et
    const slotCheck = await AvailabilitySlot.findById(slotId);
    
    if (!slotCheck) {
      return res.status(404).json({
        success: false,
        message: 'Slot bulunamadı'
      });
    }
    
    if (slotCheck.mentorUserId.toString() !== mentorUserId) {
      return res.status(400).json({
        success: false,
        message: 'Bu slot seçilen mentora ait değil'
      });
    }
    
    if (slotCheck.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'Bu slot artık müsait değil'
      });
    }
    
    // Slot kontrolü - atomic operation ile slot'u book et
    const slot = await AvailabilitySlot.bookSlot(slotId, null, req.user._id);
    
    if (!slot) {
      return res.status(400).json({
        success: false,
        message: 'Slot müsait değil veya daha önce rezerve edilmiş'
      });
    }
    
    // ideathonId: slot'un ideathonId'sini miras al (Multi-Tenant)
    const meetingIdeathonId = slotCheck.ideathonId || req.ideathonId;

    // Provider: önce request body, sonra slot'un meetingType'ı, en son jitsi
    const resolvedProvider = meetingProvider || slotCheck.meetingType || 'jitsi';
    // "google-meet" → "google" mapping (backend OAuth servisi "google" bekler)
    const normalizedProvider = resolvedProvider === 'google-meet' ? 'google' : resolvedProvider;

    // Önce meeting'i oluştur (ID almak için)
    const meeting = new MentorMeeting({
      ideathonId: meetingIdeathonId,
      programId,
      mentorUserId,
      participantUserId: req.user._id,
      participantApplicationId,
      teamId,
      slotId,
      startAt: slot.startAt,
      endAt: slot.endAt,
      timezone: slot.timezone,
      meetingProvider: normalizedProvider,
      meetingUrl: '',
      title,
      description,
      plannedByUserId: req.user._id
    });
    
    await meeting.save();
    
    // 🔗 Meeting URL oluştur (provider'a göre)
    const provider = meeting.meetingProvider || 'jitsi';
    let meetingUrl = '';
    let meetingMetadata = {};
    let fallbackToJitsi = false;
    
    if (provider === 'jitsi') {
      // Format: https://meet.jit.si/emlak-konut-{meetingId}
      meetingUrl = `https://meet.jit.si/emlak-konut-${meeting._id}`;
    } else if (provider === 'google' || provider === 'microsoft' || provider === 'zoom') {
      // OAuth entegrasyonundan meeting oluştur
      try {
        const integration = await MentorIntegration.findActiveIntegration(mentorUserId, provider);
        
        if (!integration) {
          // Entegrasyon yoksa veya bağlı değilse Jitsi kullan
          console.log(`⚠️ ${provider} entegrasyonu bulunamadı, Jitsi'ye geçiliyor`);
          fallbackToJitsi = true;
        } else {
          // Token geçerli mi kontrol et
          if (!integration.isTokenValid()) {
            console.log(`⚠️ ${provider} token'ı geçersiz, refresh ediliyor...`);
            
            try {
              // Refresh token ile yenile
              const tokens = integration.getDecryptedTokens();
              
              if (!tokens.refreshToken) {
                console.error(`❌ ${provider} refresh token bulunamadı`);
                fallbackToJitsi = true;
              } else {
                const refreshedTokens = await oauthService.refreshToken(provider, tokens.refreshToken);
                await integration.updateTokens(
                  refreshedTokens.accessToken,
                  refreshedTokens.refreshToken,
                  refreshedTokens.expiresIn
                );
              }
            } catch (refreshError) {
              console.error(`❌ ${provider} token refresh hatası:`, refreshError);
              
              // ✅ INVALID_GRANT: Kullanıcı izni geri aldı -> status: 'error'
              if (refreshError.code === 'INVALID_GRANT') {
                integration.status = 'error';
                await integration.save();
                console.log(`⚠️ ${provider} entegrasyonu 'error' durumuna alındı (kullanıcı tekrar bağlanmalı)`);
              } else {
                // Diğer hatalar: revoke
                await integration.revoke();
              }
              
              fallbackToJitsi = true;
            }
          }
          
          if (!fallbackToJitsi) {
            // Meeting bilgilerini hazırla
            const tokens = integration.getDecryptedTokens();
            const eventData = {
              meetingId: meeting._id.toString(), // ✅ Google requestId için unique ID
              title: meeting.title || 'Emlak Konut Ideathon - Mentor Görüşmesi',
              description: meeting.description || `Mentor: ${req.user.name}`,
              startTime: meeting.startAt.toISOString(),
              endTime: meeting.endAt.toISOString(),
              attendees: [
                integration.email // Mentor'un email'i
                // Katılımcı email'i eklenebilir
              ]
            };
            
            try {
              // Provider'a göre meeting oluştur
              const meetingData = await oauthService.createMeeting(provider, tokens.accessToken, eventData);
              
              meetingUrl = meetingData.meetingUrl;
              
              // meetingUrl boş mu kontrol et (kritik)
              if (!meetingUrl) {
                console.error(`❌ ${provider} meetingUrl boş döndü`);
                fallbackToJitsi = true;
              } else {
                meetingMetadata = {
                  eventId: meetingData.eventId || meetingData.meetingId,
                  htmlLink: meetingData.htmlLink,
                  startUrl: meetingData.startUrl,
                  provider: provider
                };
                
                console.log(`✅ ${provider} meeting oluşturuldu: ${meetingUrl}`);
              }
            } catch (createError) {
              console.error(`❌ ${provider} meeting oluşturma hatası:`, createError);
              fallbackToJitsi = true;
            }
          }
        }
      } catch (error) {
        console.error(`❌ ${provider} genel hata:`, error);
        fallbackToJitsi = true;
      }
    }
    
    // Fallback: Jitsi kullan
    if (fallbackToJitsi || !meetingUrl) {
      console.log(`🔄 Jitsi fallback aktif: ${provider} → jitsi`);
      meetingUrl = `https://meet.jit.si/emlak-konut-${meeting._id}`;
      meeting.meetingProvider = 'jitsi';
      meetingMetadata = {
        originalProvider: provider,
        fallbackReason: 'Provider integration failed or unavailable'
      };
    }
    
    // Meeting URL'i güncelle
    meeting.meetingUrl = meetingUrl;
    if (Object.keys(meetingMetadata).length > 0) {
      meeting.metadata = meetingMetadata;
    }
    await meeting.save();
    
    // Slot'u meeting ile ilişkilendir
    slot.bookedMeetingId = meeting._id;
    slot.status = 'booked';
    await slot.save();
    
    await meeting.populate([
      { path: 'mentorUserId', select: 'name email' },
      { path: 'participantUserId', select: 'name email' },
      { path: 'slotId' }
    ]);
    
    // 📊 Mentor stats'ini güncelle (toplantı sayısını artır)
    try {
      const MentorProfile = require('../models/MentorProfile');
      const mentorProfile = await MentorProfile.findOne({ userId: mentorUserId });
      if (mentorProfile) {
        await mentorProfile.updateStats({ incrementMeetings: true });
        console.log(`📊 Mentor stats güncellendi: ${mentorUserId} - Toplam: ${mentorProfile.stats.totalMeetings}`);
      }
    } catch (statsError) {
      console.error('Stats güncelleme hatası:', statsError);
    }
    
    // Email bildirimleri gönder (async - yanıt beklenmez) - Tercih kontrolü ile
    try {
      // Mentor ve Participant email tercihlerini al
      const MentorProfile = require('../models/MentorProfile');
      const mentorProfile = await MentorProfile.findOne({ userId: mentorUserId });
      const participantUser = await User.findById(req.user._id);
      
      await emailService.sendMeetingCreatedToMentor(
        meeting, 
        meeting.mentorUserId, 
        meeting.participantUserId,
        mentorProfile?.emailPreferences
      );
      await emailService.sendMeetingCreatedToParticipant(
        meeting, 
        meeting.mentorUserId, 
        meeting.participantUserId,
        participantUser?.emailPreferences
      );
    } catch (emailError) {
      console.error('Email gönderme hatası (ama toplantı oluşturuldu):', emailError);
    }
    
    // Add teamName to participant
    const meetingObj = meeting.toObject();
    if (meetingObj.participantUserId?._id) {
      const userId = meetingObj.participantUserId._id.toString();
      await addTeamNameToUser(meetingObj.participantUserId, userId);
    }
    
    res.status(201).json({
      success: true,
      message: 'Toplantı başarıyla oluşturuldu',
      data: meetingObj
    });
  } catch (error) {
    console.error('createMeeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Toplantı oluşturulurken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Mentor tarafından toplantı planla (mentor kendi slotu + atanmış kullanıcı)
// @route   POST /api/mentornet/meetings/plan
// @access  Mentor
exports.planMeeting = async (req, res) => {
  try {
    const {
      slotId,
      participantUserId,
      participantApplicationId,
      teamId,
      title,
      description,
      meetingProvider
    } = req.body;

    if (!slotId || !participantUserId) {
      return res.status(400).json({
        success: false,
        message: 'Slot ve katılımcı bilgisi zorunludur'
      });
    }

    const mentorUserId = req.user._id;

    // Slot kontrolü
    const slotCheck = await AvailabilitySlot.findById(slotId);

    if (!slotCheck) {
      return res.status(404).json({
        success: false,
        message: 'Slot bulunamadı'
      });
    }

    if (slotCheck.mentorUserId.toString() !== mentorUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Bu slot size ait değil'
      });
    }

    if (slotCheck.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'Bu slot artık müsait değil'
      });
    }

    // Katılımcı kontrolü
    const participant = await User.findById(participantUserId);
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Katılımcı bulunamadı'
      });
    }

    // Mentor profili ve ideathon kontrolü
    const MentorProfile = require('../models/MentorProfile');
    const mentorProfile = await MentorProfile.findOne({ userId: mentorUserId });

    if (!mentorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Mentor profili bulunamadı'
      });
    }

    // Katılımcının mentor'un ideathon'unda onaylanmış başvurusu var mı kontrol et
    const Application = require('../models/Application');
    const mentorIdeathonId = mentorProfile.ideathonId || req.ideathonId;

    const approvedApplication = await Application.findOne({
      ideathonId: mentorIdeathonId,
      userId: participantUserId,
      status: 'approved'
    });

    if (!approvedApplication) {
      return res.status(403).json({
        success: false,
        message: 'Bu katılımcının ideathon\'da onaylanmış başvurusu bulunmamaktadır'
      });
    }

    // Slot'u atomic olarak book et
    const slot = await AvailabilitySlot.bookSlot(slotId, null, mentorUserId);

    if (!slot) {
      return res.status(400).json({
        success: false,
        message: 'Slot müsait değil veya daha önce rezerve edilmiş'
      });
    }

    const meetingIdeathonId = slotCheck.ideathonId || req.ideathonId;

    const resolvedProvider = meetingProvider || slotCheck.meetingType || 'jitsi';
    const normalizedProvider = resolvedProvider === 'google-meet' ? 'google' : resolvedProvider;

    const resolvedApplicationId = participantApplicationId || approvedApplication._id;
    const resolvedTeamId = teamId || approvedApplication.teamInfo?.teamId || null;

    const meeting = new MentorMeeting({
      ideathonId: meetingIdeathonId,
      mentorUserId,
      participantUserId,
      participantApplicationId: resolvedApplicationId,
      teamId: resolvedTeamId,
      slotId,
      startAt: slot.startAt,
      endAt: slot.endAt,
      timezone: slot.timezone,
      meetingProvider: normalizedProvider,
      meetingUrl: '',
      title,
      description,
      plannedByUserId: mentorUserId
    });

    await meeting.save();

    // Meeting URL oluştur
    const provider = meeting.meetingProvider || 'jitsi';
    let meetingUrl = '';
    let meetingMetadata = {};
    let fallbackToJitsi = false;

    if (provider === 'jitsi') {
      meetingUrl = `https://meet.jit.si/emlak-konut-${meeting._id}`;
    } else if (provider === 'google' || provider === 'microsoft' || provider === 'zoom') {
      try {
        const integration = await MentorIntegration.findActiveIntegration(mentorUserId, provider);

        if (!integration) {
          fallbackToJitsi = true;
        } else {
          if (!integration.isTokenValid()) {
            try {
              const tokens = integration.getDecryptedTokens();
              if (!tokens.refreshToken) {
                fallbackToJitsi = true;
              } else {
                const refreshedTokens = await oauthService.refreshToken(provider, tokens.refreshToken);
                await integration.updateTokens(
                  refreshedTokens.accessToken,
                  refreshedTokens.refreshToken,
                  refreshedTokens.expiresIn
                );
              }
            } catch (refreshError) {
              console.error(`${provider} token refresh hatası:`, refreshError);
              if (refreshError.code === 'INVALID_GRANT') {
                integration.status = 'error';
                await integration.save();
              } else {
                await integration.revoke();
              }
              fallbackToJitsi = true;
            }
          }

          if (!fallbackToJitsi) {
            const tokens = integration.getDecryptedTokens();
            const eventData = {
              meetingId: meeting._id.toString(),
              title: meeting.title || 'Emlak Konut Ideathon - Mentor Görüşmesi',
              description: meeting.description || `Mentor: ${req.user.name}`,
              startTime: meeting.startAt.toISOString(),
              endTime: meeting.endAt.toISOString(),
              attendees: [integration.email]
            };

            try {
              const meetingData = await oauthService.createMeeting(provider, tokens.accessToken, eventData);
              meetingUrl = meetingData.meetingUrl;

              if (!meetingUrl) {
                fallbackToJitsi = true;
              } else {
                meetingMetadata = {
                  eventId: meetingData.eventId || meetingData.meetingId,
                  htmlLink: meetingData.htmlLink,
                  startUrl: meetingData.startUrl,
                  provider: provider
                };
              }
            } catch (createError) {
              console.error(`${provider} meeting oluşturma hatası:`, createError);
              fallbackToJitsi = true;
            }
          }
        }
      } catch (error) {
        console.error(`${provider} genel hata:`, error);
        fallbackToJitsi = true;
      }
    }

    if (fallbackToJitsi || !meetingUrl) {
      meetingUrl = `https://meet.jit.si/emlak-konut-${meeting._id}`;
      meeting.meetingProvider = 'jitsi';
      meetingMetadata = {
        originalProvider: provider,
        fallbackReason: 'Provider integration failed or unavailable'
      };
    }

    meeting.meetingUrl = meetingUrl;
    if (Object.keys(meetingMetadata).length > 0) {
      meeting.metadata = meetingMetadata;
    }
    await meeting.save();

    slot.bookedMeetingId = meeting._id;
    slot.status = 'booked';
    await slot.save();

    await meeting.populate([
      { path: 'mentorUserId', select: 'name email' },
      { path: 'participantUserId', select: 'name email' },
      { path: 'slotId' }
    ]);

    // Mentor stats güncelle
    try {
      if (mentorProfile) {
        await mentorProfile.updateStats({ incrementMeetings: true });
      }
    } catch (statsError) {
      console.error('Stats güncelleme hatası:', statsError);
    }

    // Email bildirimleri
    try {
      const participantUser = await User.findById(participantUserId);
      await emailService.sendMeetingCreatedToMentor(
        meeting,
        meeting.mentorUserId,
        meeting.participantUserId,
        mentorProfile?.emailPreferences
      );
      await emailService.sendMeetingCreatedToParticipant(
        meeting,
        meeting.mentorUserId,
        meeting.participantUserId,
        participantUser?.emailPreferences
      );
    } catch (emailError) {
      console.error('Email gönderme hatası (ama toplantı oluşturuldu):', emailError);
    }

    const meetingObj = meeting.toObject();
    if (meetingObj.participantUserId?._id) {
      const userId = meetingObj.participantUserId._id.toString();
      await addTeamNameToUser(meetingObj.participantUserId, userId);
    }

    res.status(201).json({
      success: true,
      message: 'Toplantı mentor tarafından başarıyla planlandı',
      data: meetingObj
    });
  } catch (error) {
    console.error('planMeeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Toplantı planlanırken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Toplantıları listele (role bazlı)
// @route   GET /api/mentornet/meetings
// @access  Authenticated User
exports.getMeetings = async (req, res) => {
  try {
    const { type, status, programId, fromDate, toDate } = req.query;
    
    // Multi-Tenant: ideathonId çözümle
    // ÖNCELİK: ?event=slug > req.ideathonId (JWT) > user.ideathonId
    const isMentor = req.user.role === 'mentor';
    let ideathonId = null;

    // 1. Slug'dan çözümle (?event=slug) — EN YÜKSEK ÖNCELİK
    if (req.query.event) {
      const Ideathon = require('../models/Ideathon');
      const ideathon = await Ideathon.findOne({ slug: req.query.event, status: 'active' })
        .select('_id').lean();
      if (ideathon) ideathonId = ideathon._id;
    }

    // 2. JWT'den gelen ideathonId
    if (!ideathonId && req.ideathonId) {
      ideathonId = req.ideathonId;
    }

    // 3. User modelinden fallback
    if (!ideathonId && req.user.role === 'user' && req.user.ideathonId) {
      ideathonId = req.user.ideathonId;
    }
    
    let meetings = [];
    
    // type: upcoming | past
    if (type === 'upcoming') {
      const role = isMentor ? 'mentor' : 'participant';
      meetings = await MentorMeeting.findUpcoming(req.user._id, role, 50, ideathonId);
    } else if (type === 'past') {
      const role = isMentor ? 'mentor' : 'participant';
      meetings = await MentorMeeting.findPast(req.user._id, role, 50, ideathonId);
    } else if (status) {
      // Belirli status
      const filters = { programId, fromDate, toDate };
      
      // Mentor ise kendi toplantıları + ideathon filtresi
      if (isMentor) {
        filters.mentorUserId = req.user._id;
        if (ideathonId) filters.ideathonId = ideathonId;
      } else if (req.user.role === 'user') {
        filters.participantUserId = req.user._id;
        if (ideathonId) filters.ideathonId = ideathonId;
      }
      // Admin ise tüm toplantılar
      
      meetings = await MentorMeeting.findByStatus(status, filters);
    } else {
      // Tüm toplantılar (role bazlı)
      const query = {};
      
      if (isMentor) {
        query.mentorUserId = req.user._id;
        if (ideathonId) query.ideathonId = ideathonId;
      } else if (req.user.role === 'user') {
        query.participantUserId = req.user._id;
        if (ideathonId) query.ideathonId = ideathonId;
      }
      
      if (programId) query.programId = programId;
      if (fromDate) query.startAt = { $gte: new Date(fromDate) };
      if (toDate) query.endAt = { $lte: new Date(toDate) };
      
      meetings = await MentorMeeting.find(query)
        .populate('mentorUserId', 'name email')
        .populate('participantUserId', 'name email')
        .sort({ startAt: -1 })
        .limit(100);
    }
    
    // Add teamName to participants
    const meetingsWithTeams = await addTeamNameToMeetings(meetings);
    
    // Normal kullanıcılar için meetingUrl'u gizle
    const isRegularUser = req.user.role === 'user';
    const safeData = isRegularUser
      ? meetingsWithTeams.map(m => { const obj = typeof m.toObject === 'function' ? m.toObject() : { ...m }; delete obj.meetingUrl; return obj; })
      : meetingsWithTeams;
    
    res.json({
      success: true,
      count: safeData.length,
      data: safeData
    });
  } catch (error) {
    console.error('getMeetings error:', error);
    res.status(500).json({
      success: false,
      message: 'Toplantılar getirilirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Toplantı detayı getir
// @route   GET /api/mentornet/meetings/:id
// @access  Meeting participant/mentor/admin
exports.getMeetingById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const meeting = await MentorMeeting.findById(id)
      .populate('mentorUserId', 'name email role')
      .populate('participantUserId', 'name email role')
      .populate('participantApplicationId')
      .populate('teamId')
      .populate('slotId')
      .populate('cancelledBy', 'name email role'); // İptal eden kişi bilgisi
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Toplantı bulunamadı'
      });
    }
    
    // Yetkilendirme kontrolü
    const isAdmin = ['superadmin', 'admin'].includes(req.user.role);
    const isMentor = meeting.mentorUserId._id.toString() === req.user._id.toString();
    const isParticipant = meeting.participantUserId._id.toString() === req.user._id.toString();
    
    if (!isAdmin && !isMentor && !isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Bu toplantıyı görüntüleme yetkiniz yok'
      });
    }
    
    // Multi-Tenant: User rolü için ideathon kontrolü
    // ÖNCELİK: ?event=slug > req.ideathonId (JWT) > user.ideathonId
    let meetingIdeathonId = null;
    if (req.query.event) {
      const Ideathon = require('../models/Ideathon');
      const ideathon = await Ideathon.findOne({ slug: req.query.event, status: 'active' })
        .select('_id').lean();
      if (ideathon) meetingIdeathonId = ideathon._id;
    }
    if (!meetingIdeathonId && req.ideathonId) meetingIdeathonId = req.ideathonId;
    if (!meetingIdeathonId && req.user.role === 'user' && req.user.ideathonId) meetingIdeathonId = req.user.ideathonId;

    if (req.user.role === 'user' && meetingIdeathonId && meeting.ideathonId) {
      if (meeting.ideathonId.toString() !== meetingIdeathonId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Bu toplantıyı görüntüleme yetkiniz yok'
        });
      }
    }
    
    // Add teamName to participant
    const meetingObj = meeting.toObject();
    if (meetingObj.participantUserId?._id) {
      const userId = meetingObj.participantUserId._id.toString();
      await addTeamNameToUser(meetingObj.participantUserId, userId);
    }
    
    // Normal kullanıcılar için meetingUrl'u gizle (sadece join endpoint'inden erişilebilir)
    if (!isAdmin && !isMentor) {
      delete meetingObj.meetingUrl;
    }
    
    res.json({
      success: true,
      data: meetingObj
    });
  } catch (error) {
    console.error('getMeetingById error:', error);
    res.status(500).json({
      success: false,
      message: 'Toplantı getirilirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Toplantıyı iptal et
// @route   PATCH /api/mentornet/meetings/:id/cancel
// @access  Meeting mentor/participant/admin
exports.cancelMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const meeting = await MentorMeeting.findById(id);
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Toplantı bulunamadı'
      });
    }
    
    // Yetkilendirme
    const isAdmin = ['superadmin', 'admin'].includes(req.user.role);
    const isMentor = meeting.mentorUserId.toString() === req.user._id.toString();
    const isParticipant = meeting.participantUserId.toString() === req.user._id.toString();
    
    if (!isAdmin && !isMentor && !isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Bu toplantıyı iptal etme yetkiniz yok'
      });
    }
    
    const cancelledMeeting = await MentorMeeting.cancelMeeting(id, req.user._id, reason);
    
    if (!cancelledMeeting) {
      return res.status(400).json({
        success: false,
        message: 'Toplantı iptal edilemedi'
      });
    }
    
    // Email bildirimi gönder - Tercih kontrolü ile
    try {
      await cancelledMeeting.populate([
        { path: 'mentorUserId', select: 'name email' },
        { path: 'participantUserId', select: 'name email' }
      ]);
      
      // Email tercihlerini al
      const MentorProfile = require('../models/MentorProfile');
      const mentorProfile = await MentorProfile.findOne({ userId: cancelledMeeting.mentorUserId._id });
      const participantUser = await User.findById(cancelledMeeting.participantUserId._id);
      
      await emailService.sendMeetingCancelled(
        cancelledMeeting,
        cancelledMeeting.mentorUserId,
        cancelledMeeting.participantUserId,
        req.user.name,
        reason || 'Sebep belirtilmedi',
        mentorProfile?.emailPreferences,
        participantUser?.emailPreferences
      );
    } catch (emailError) {
      console.error('Email gönderme hatası:', emailError);
    }
    
    // Response için objeyi hazırla (cancellationReason dahil)
    const responseData = cancelledMeeting.toObject();
    
    res.json({
      success: true,
      message: 'Toplantı başarıyla iptal edildi',
      data: responseData
    });
  } catch (error) {
    console.error('cancelMeeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Toplantı iptal edilirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Toplantıyı tamamla (mentor/admin)
// @route   PATCH /api/mentornet/meetings/:id/complete
// @access  Meeting mentor/admin
exports.completeMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    
    const meeting = await MentorMeeting.findById(id);
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Toplantı bulunamadı'
      });
    }
    
    // Sadece mentor veya admin tamamlayabilir
    const isAdmin = ['superadmin', 'admin'].includes(req.user.role);
    const isMentor = meeting.mentorUserId.toString() === req.user._id.toString();
    
    if (!isAdmin && !isMentor) {
      return res.status(403).json({
        success: false,
        message: 'Bu toplantıyı tamamlama yetkiniz yok'
      });
    }
    
    const completedMeeting = await MentorMeeting.completeMeeting(id, req.user._id);
    
    if (!completedMeeting) {
      return res.status(400).json({
        success: false,
        message: 'Toplantı tamamlanamadı'
      });
    }
    
    // 📊 Mentor stats'ini güncelle (tamamlanan toplantı sayısını artır)
    try {
      const MentorProfile = require('../models/MentorProfile');
      const mentorProfile = await MentorProfile.findOne({ userId: completedMeeting.mentorUserId });
      if (mentorProfile) {
        await mentorProfile.updateStats({ incrementCompleted: true });
        console.log(`✅ Mentor stats güncellendi: ${completedMeeting.mentorUserId} - Tamamlanan: ${mentorProfile.stats.completedMeetings}`);
      }
    } catch (statsError) {
      console.error('Stats güncelleme hatası:', statsError);
    }
    
    // Feedback talebi email'i gönder (participant'a)
    try {
      await completedMeeting.populate([
        { path: 'mentorUserId', select: 'name email' },
        { path: 'participantUserId', select: 'name email' }
      ]);
      
      await emailService.sendFeedbackRequest(
        completedMeeting,
        completedMeeting.mentorUserId,
        completedMeeting.participantUserId
      );
    } catch (emailError) {
      console.error('Feedback email gönderme hatası:', emailError);
    }
    
    res.json({
      success: true,
      message: 'Toplantı başarıyla tamamlandı',
      data: completedMeeting
    });
  } catch (error) {
    console.error('completeMeeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Toplantı tamamlanırken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Toplantıyı yeniden planla (reschedule)
// @route   POST /api/mentornet/meetings/:id/reschedule
// @access  Meeting mentor/participant/admin
exports.rescheduleMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const { newSlotId, reason } = req.body;
    
    if (!newSlotId) {
      return res.status(400).json({
        success: false,
        message: 'Yeni slot ID zorunludur'
      });
    }
    
    const oldMeeting = await MentorMeeting.findById(id)
      .populate('mentorUserId', 'name email')
      .populate('participantUserId', 'name email');
    
    if (!oldMeeting) {
      return res.status(404).json({
        success: false,
        message: 'Toplantı bulunamadı'
      });
    }
    
    // Sadece scheduled toplantılar yeniden planlanabilir
    if (oldMeeting.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Sadece planlanmış toplantılar yeniden planlanabilir'
      });
    }
    
    // Yetkilendirme
    const isAdmin = ['superadmin', 'admin'].includes(req.user.role);
    const isMentor = oldMeeting.mentorUserId._id.toString() === req.user._id.toString();
    const isParticipant = oldMeeting.participantUserId._id.toString() === req.user._id.toString();
    
    if (!isAdmin && !isMentor && !isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Bu toplantıyı yeniden planlama yetkiniz yok'
      });
    }
    
    // Yeni slot kontrolü
    const newSlot = await AvailabilitySlot.findById(newSlotId);
    
    if (!newSlot) {
      return res.status(404).json({
        success: false,
        message: 'Yeni slot bulunamadı'
      });
    }
    
    if (newSlot.mentorUserId.toString() !== oldMeeting.mentorUserId._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Yeni slot aynı mentora ait değil'
      });
    }
    
    if (newSlot.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'Yeni slot müsait değil'
      });
    }
    
    // Atomic olarak yeni slot'u book et
    const bookedNewSlot = await AvailabilitySlot.bookSlot(newSlotId, null, req.user._id);
    
    if (!bookedNewSlot) {
      return res.status(400).json({
        success: false,
        message: 'Yeni slot rezerve edilemedi'
      });
    }
    
    // Eski meeting'i rescheduled olarak işaretle
    oldMeeting.status = 'rescheduled';
    oldMeeting.rescheduledAt = new Date();
    oldMeeting.rescheduledBy = req.user._id;
    await oldMeeting.save();
    
    // Eski slot'u serbest bırak
    if (oldMeeting.slotId) {
      await AvailabilitySlot.findByIdAndUpdate(
        oldMeeting.slotId,
        {
          $set: {
            status: 'open',
            bookedMeetingId: null
          }
        }
      );
    }
    
    // Yeni meeting oluştur (ideathonId eski meeting'den miras alır)
    const newMeeting = new MentorMeeting({
      ideathonId: oldMeeting.ideathonId,
      programId: oldMeeting.programId,
      mentorUserId: oldMeeting.mentorUserId._id,
      participantUserId: oldMeeting.participantUserId._id,
      participantApplicationId: oldMeeting.participantApplicationId,
      teamId: oldMeeting.teamId,
      slotId: newSlotId,
      startAt: bookedNewSlot.startAt,
      endAt: bookedNewSlot.endAt,
      timezone: bookedNewSlot.timezone,
      meetingProvider: oldMeeting.meetingProvider,
      meetingUrl: oldMeeting.meetingUrl,
      title: oldMeeting.title,
      description: oldMeeting.description,
      plannedByUserId: req.user._id,
      rescheduledFromMeetingId: oldMeeting._id
    });
    
    await newMeeting.save();
    
    // Yeni slot'a meeting ID'sini ekle
    bookedNewSlot.bookedMeetingId = newMeeting._id;
    await bookedNewSlot.save();
    
    // Eski meeting'e yeni meeting referansını ekle
    oldMeeting.rescheduledToMeetingId = newMeeting._id;
    await oldMeeting.save();
    
    // Populate yeni meeting
    await newMeeting.populate([
      { path: 'mentorUserId', select: 'name email' },
      { path: 'participantUserId', select: 'name email' },
      { path: 'slotId' }
    ]);
    
    // Email bildirimi gönder
    try {
      await emailService.sendMeetingRescheduled(
        newMeeting,
        oldMeeting,
        newMeeting.mentorUserId,
        newMeeting.participantUserId,
        req.user.name,
        reason || 'Sebep belirtilmedi'
      );
    } catch (emailError) {
      console.error('Email gönderme hatası:', emailError);
    }
    
    res.json({
      success: true,
      message: 'Toplantı başarıyla yeniden planlandı',
      data: {
        oldMeeting: {
          _id: oldMeeting._id,
          status: oldMeeting.status,
          rescheduledToMeetingId: oldMeeting.rescheduledToMeetingId
        },
        newMeeting
      }
    });
  } catch (error) {
    console.error('rescheduleMeeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Toplantı yeniden planlanırken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Toplantı için feedback ver
// @route   POST /api/mentornet/meetings/:id/feedback
// @access  Meeting participant/mentor
exports.createFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, wouldMeetAgain, suggestions, isAnonymous } = req.body;
    
    const meeting = await MentorMeeting.findById(id);
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Toplantı bulunamadı'
      });
    }
    
    // Toplantı tamamlanmış olmalı
    if (meeting.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Sadece tamamlanmış toplantılar için feedback verilebilir'
      });
    }
    
    // Katılımcı mı mentor mu kontrol et
    const isMentor = meeting.mentorUserId.toString() === req.user._id.toString();
    const isParticipant = meeting.participantUserId.toString() === req.user._id.toString();
    
    if (!isMentor && !isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Bu toplantı için feedback verme yetkiniz yok'
      });
    }
    
    const feedbackType = isMentor ? 'mentor_to_participant' : 'participant_to_mentor';
    
    // Daha önce feedback vermiş mi kontrol et
    const existingFeedback = await MeetingFeedback.findOne({
      meetingId: id,
      filledByUserId: req.user._id
    });
    
    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: 'Bu toplantı için zaten feedback verdiniz'
      });
    }
    
    const feedback = new MeetingFeedback({
      meetingId: id,
      filledByUserId: req.user._id,
      feedbackType,
      rating,
      comment,
      wouldMeetAgain,
      suggestions,
      isAnonymous: isAnonymous && !isMentor // Sadece participant anonymous olabilir
    });
    
    await feedback.save();
    await feedback.populate('filledByUserId', 'name email');
    
    // 📊 Eğer participant mentor'a feedback verdiyse, mentor stats'ini güncelle
    if (feedbackType === 'participant_to_mentor' && rating) {
      try {
        const MentorProfile = require('../models/MentorProfile');
        const mentorProfile = await MentorProfile.findOne({ userId: meeting.mentorUserId });
        if (mentorProfile) {
          await mentorProfile.updateStats({ newRating: rating });
          console.log(`⭐ Mentor rating güncellendi: ${meeting.mentorUserId} - Yeni ortalama: ${mentorProfile.stats.averageRating.toFixed(2)}`);
        }
      } catch (statsError) {
        console.error('Stats güncelleme hatası:', statsError);
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Feedback başarıyla kaydedildi',
      data: feedback
    });
  } catch (error) {
    console.error('createFeedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Feedback kaydedilirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Kendi verdiğim feedback'leri listele
// @route   GET /api/mentornet/feedbacks/my-given
// @access  Authenticated User
exports.getMyGivenFeedbacks = async (req, res) => {
  try {
    const feedbacks = await MeetingFeedback.find({ filledByUserId: req.user._id })
      .populate('meetingId', 'startAt endAt status')
      .populate({
        path: 'meetingId',
        populate: [
          { path: 'mentorUserId', select: 'name email' },
          { path: 'participantUserId', select: 'name email' }
        ]
      })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: feedbacks.length,
      data: feedbacks
    });
  } catch (error) {
    console.error('getMyGivenFeedbacks error:', error);
    res.status(500).json({
      success: false,
      message: 'Feedbackler getirilirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Bana verilen feedback'leri listele
// @route   GET /api/mentornet/feedbacks/received
// @access  Authenticated User (Mentor)
exports.getReceivedFeedbacks = async (req, res) => {
  try {
    // Multi-Tenant: Mentor olarak sadece kendi ideathon'undaki feedback'ler
    // Önce bu mentor'a ait meeting ID'lerini bul (ideathonId ile)
    const meetingQuery = { mentorUserId: req.user._id };
    if (req.ideathonId) meetingQuery.ideathonId = req.ideathonId;
    const myMeetingIds = await MentorMeeting.find(meetingQuery).distinct('_id');
    
    // Mentor olarak aldığım feedback'ler (sadece kendi meeting'lerimden)
    const feedbacks = await MeetingFeedback.find({
      feedbackType: 'participant_to_mentor',
      meetingId: { $in: myMeetingIds }
    })
      .populate('meetingId')
      .populate('filledByUserId', 'name email');
    
    // Sadece benim toplantılarım (zaten filtrelenmiş ama güvenlik katmanı)
    const myFeedbacks = [];
    for (const feedback of feedbacks) {
      if (feedback.meetingId && feedback.meetingId.mentorUserId.toString() === req.user._id.toString()) {
        const feedbackObj = feedback.toObject();
        
        // Anonim feedback ise kişisel bilgileri gizle
        if (feedbackObj.isAnonymous) {
          // Kullanıcı bilgilerini gizle
          if (feedbackObj.filledByUserId) {
            feedbackObj.filledByUserId = {
              _id: feedbackObj.filledByUserId._id,
              name: '*******',
              email: '*******'
            };
          }
          
          // Toplantı bilgilerini gizle
          if (feedbackObj.meetingId) {
            feedbackObj.meetingId = {
              _id: feedbackObj.meetingId._id,
              startAt: '*******',
              endAt: '*******',
              title: '*******',
              description: '*******',
              // Sadece rating ve comment görünsün
              mentorUserId: feedbackObj.meetingId.mentorUserId,
              participantUserId: feedbackObj.meetingId.participantUserId
            };
          }
        }
        
        myFeedbacks.push(feedbackObj);
      }
    }
    
    res.json({
      success: true,
      count: myFeedbacks.length,
      data: myFeedbacks
    });
  } catch (error) {
    console.error('getReceivedFeedbacks error:', error);
    res.status(500).json({
      success: false,
      message: 'Feedbackler getirilirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Feedback düzenle
// @route   PUT /api/mentornet/feedbacks/:id
// @access  Feedback sahibi
exports.updateFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, wouldMeetAgain, suggestions } = req.body;
    
    const feedback = await MeetingFeedback.findById(id);
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback bulunamadı'
      });
    }
    
    // Sadece kendi feedback'ini düzenleyebilir
    if (feedback.filledByUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bu feedbacki düzenleme yetkiniz yok'
      });
    }
    
    // Güncelle
    if (rating !== undefined) feedback.rating = rating;
    if (comment !== undefined) feedback.comment = comment;
    if (wouldMeetAgain !== undefined) feedback.wouldMeetAgain = wouldMeetAgain;
    if (suggestions !== undefined) feedback.suggestions = suggestions;
    feedback.updatedAt = new Date();
    
    await feedback.save();
    
    // Eğer rating değiştiyse ve participant_to_mentor ise, mentor stats'ini güncelle
    if (rating !== undefined && feedback.feedbackType === 'participant_to_mentor') {
      try {
        const MentorProfile = require('../models/MentorProfile');
        const meeting = await MentorMeeting.findById(feedback.meetingId);
        if (meeting) {
          const mentorProfile = await MentorProfile.findOne({ userId: meeting.mentorUserId });
          if (mentorProfile) {
            // Stats'i yeniden hesapla (tüm feedback'leri al)
            const allFeedbacks = await MeetingFeedback.find({
              feedbackType: 'participant_to_mentor'
            }).populate('meetingId');
            
            const mentorFeedbacks = allFeedbacks.filter(f => 
              f.meetingId && f.meetingId.mentorUserId.toString() === meeting.mentorUserId.toString()
            );
            
            const totalRating = mentorFeedbacks.reduce((sum, f) => sum + f.rating, 0);
            mentorProfile.stats.averageRating = totalRating / mentorFeedbacks.length;
            mentorProfile.stats.totalRatings = mentorFeedbacks.length;
            await mentorProfile.save();
            
            console.log(`⭐ Mentor rating güncellendi (feedback düzenlendi): ${meeting.mentorUserId}`);
          }
        }
      } catch (statsError) {
        console.error('Stats güncelleme hatası:', statsError);
      }
    }
    
    res.json({
      success: true,
      message: 'Feedback başarıyla güncellendi',
      data: feedback
    });
  } catch (error) {
    console.error('updateFeedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Feedback güncellenirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    🆕 Manuel katılım toggle (İşaretle/Kaldır)
// @route   PATCH /api/mentornet/meetings/:id/attendance/toggle
// @access  Meeting participant/mentor
exports.toggleAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { attended } = req.body; // true/false
    
    if (attended === undefined) {
      return res.status(400).json({
        success: false,
        message: 'attended alanı (true/false) zorunludur'
      });
    }
    
    const meeting = await MentorMeeting.findById(id);
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Toplantı bulunamadı'
      });
    }
    
    // Yetkilendirme
    const isMentor = meeting.mentorUserId.toString() === req.user._id.toString();
    const isParticipant = meeting.participantUserId.toString() === req.user._id.toString();
    
    if (!isMentor && !isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Bu toplantı katılım bilgisini değiştirme yetkiniz yok'
      });
    }
    
    // Katılımı güncelle
    if (isMentor) {
      meeting.attendance.mentorJoined = attended;
      if (attended) {
        meeting.attendance.mentorJoinedAt = meeting.attendance.mentorJoinedAt || new Date();
      } else {
        meeting.attendance.mentorJoinedAt = null;
      }
    } else if (isParticipant) {
      meeting.attendance.participantJoined = attended;
      if (attended) {
        meeting.attendance.participantJoinedAt = meeting.attendance.participantJoinedAt || new Date();
      } else {
        meeting.attendance.participantJoinedAt = null;
      }
    }
    
    // Her iki taraf da katıldıysa ve toplantı bittiyse otomatik tamamla
    const bothJoined = meeting.attendance.mentorJoined && meeting.attendance.participantJoined;
    const meetingEnded = new Date() > new Date(meeting.endAt);
    
    if (bothJoined && meetingEnded && meeting.status === 'scheduled') {
      meeting.status = 'completed';
      meeting.completedAt = new Date();
      
      // Stats güncelle
      try {
        const MentorProfile = require('../models/MentorProfile');
        const mentorProfile = await MentorProfile.findOne({ userId: meeting.mentorUserId });
        if (mentorProfile) {
          await mentorProfile.updateStats({ incrementCompleted: true });
          console.log(`📊 Mentor stats otomatik güncellendi (toggle): ${meeting.mentorUserId}`);
        }
      } catch (statsError) {
        console.error('Stats güncelleme hatası:', statsError);
      }
    }
    
    await meeting.save();
    
    res.json({
      success: true,
      message: attended ? 'Katılım kaydedildi' : 'Katılım kaldırıldı',
      data: {
        attendance: meeting.attendance,
        status: meeting.status,
        autoCompleted: bothJoined && meetingEnded && meeting.status === 'completed'
      }
    });
  } catch (error) {
    console.error('toggleAttendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Katılım bilgisi güncellenirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    🆕 Meeting durumunu değiştir (Mentor)
// @route   PATCH /api/mentornet/meetings/:id/status
// @access  Meeting mentor/admin
exports.updateMeetingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    
    // Status validasyonu
    const validStatuses = ['scheduled', 'completed', 'cancelled', 'no_show', 'rescheduled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Geçersiz durum. Geçerli durumlar: ${validStatuses.join(', ')}`
      });
    }
    
    const meeting = await MentorMeeting.findById(id);
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Toplantı bulunamadı'
      });
    }
    
    // Yetkilendirme - Sadece mentor veya admin
    const isAdmin = ['superadmin', 'admin'].includes(req.user.role);
    const isMentor = meeting.mentorUserId.toString() === req.user._id.toString();
    
    if (!isAdmin && !isMentor) {
      return res.status(403).json({
        success: false,
        message: 'Bu toplantının durumunu değiştirme yetkiniz yok'
      });
    }
    
    const oldStatus = meeting.status;
    meeting.status = status;
    
    // Duruma göre ek alanları güncelle
    if (status === 'completed' && oldStatus !== 'completed') {
      meeting.completedAt = new Date();
      meeting.completedBy = req.user._id;
      
      // Stats güncelle
      try {
        const MentorProfile = require('../models/MentorProfile');
        const mentorProfile = await MentorProfile.findOne({ userId: meeting.mentorUserId });
        if (mentorProfile) {
          await mentorProfile.updateStats({ incrementCompleted: true });
          console.log(`✅ Mentor stats güncellendi (status: completed): ${meeting.mentorUserId}`);
        }
      } catch (statsError) {
        console.error('Stats güncelleme hatası:', statsError);
      }
    } else if (status === 'cancelled') {
      meeting.cancelledAt = new Date();
      meeting.cancelledBy = req.user._id;
      if (reason) meeting.cancellationReason = reason;
    } else if (status === 'no_show') {
      meeting.noShowAt = new Date();
      meeting.noShowBy = req.user._id;
      if (reason) meeting.noShowReason = reason;
    }
    
    await meeting.save();
    
    res.json({
      success: true,
      message: `Toplantı durumu '${status}' olarak güncellendi`,
      data: {
        _id: meeting._id,
        status: meeting.status,
        oldStatus,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('updateMeetingStatus error:', error);
    res.status(500).json({
      success: false,
      message: 'Toplantı durumu güncellenirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Toplantı notlarını getir
// @route   GET /api/mentornet/meetings/:id/notes
// @access  Meeting participant/mentor/admin
exports.getMeetingNotes = async (req, res) => {
  try {
    const { id } = req.params;
    
    const meeting = await MentorMeeting.findById(id);
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Toplantı bulunamadı'
      });
    }
    
    // Yetkilendirme
    const isAdmin = ['superadmin', 'admin'].includes(req.user.role);
    const isMentor = meeting.mentorUserId.toString() === req.user._id.toString();
    const isParticipant = meeting.participantUserId.toString() === req.user._id.toString();
    
    if (!isAdmin && !isMentor && !isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Bu toplantı notlarını görüntüleme yetkiniz yok'
      });
    }
    
    const notes = await MeetingNote.findByMeeting(id, req.user._id);
    
    res.json({
      success: true,
      count: notes.length,
      data: notes
    });
  } catch (error) {
    console.error('getMeetingNotes error:', error);
    res.status(500).json({
      success: false,
      message: 'Notlar getirilirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Belirli bir toplantı için kendi verdiğim feedback'i getir
// @route   GET /api/mentornet/meetings/:id/my-feedback
// @access  Meeting participant/mentor
exports.getMyFeedbackForMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Toplantıyı kontrol et
    const meeting = await MentorMeeting.findById(id);
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Toplantı bulunamadı'
      });
    }
    
    // Yetkili mi kontrol et (mentor veya participant)
    const isMentor = meeting.mentorUserId.toString() === req.user._id.toString();
    const isParticipant = meeting.participantUserId.toString() === req.user._id.toString();
    
    if (!isMentor && !isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Bu toplantı için feedback görüntüleme yetkiniz yok'
      });
    }
    
    // Kendi feedback'imi bul
    const feedback = await MeetingFeedback.findOne({
      meetingId: id,
      filledByUserId: req.user._id
    })
      .populate('filledByUserId', 'name email')
      .populate('meetingId', 'startAt endAt status');
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Bu toplantı için henüz feedback vermediniz',
        data: null
      });
    }
    
    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error('getMyFeedbackForMeeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Feedback getirilirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Toplantı notu ekle
// @route   POST /api/mentornet/meetings/:id/notes
// @access  Meeting participant/mentor
exports.createMeetingNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note, title, noteType, isPublic, tags } = req.body;
    
    const meeting = await MentorMeeting.findById(id);
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Toplantı bulunamadı'
      });
    }
    
    // Yetkilendirme
    const isMentor = meeting.mentorUserId.toString() === req.user._id.toString();
    const isParticipant = meeting.participantUserId.toString() === req.user._id.toString();
    
    if (!isMentor && !isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Bu toplantı için not ekleme yetkiniz yok'
      });
    }
    
    const meetingNote = new MeetingNote({
      meetingId: id,
      authorUserId: req.user._id,
      note,
      title,
      noteType: noteType || 'general',
      isPublic: isPublic !== undefined ? isPublic : false,
      tags
    });
    
    await meetingNote.save();
    await meetingNote.populate('authorUserId', 'name email');
    
    // Email bildirimi gönder (public note ise) - Tercih kontrolü ile
    if (isPublic) {
      try {
        await meeting.populate([
          { path: 'mentorUserId', select: 'name email' },
          { path: 'participantUserId', select: 'name email' }
        ]);
        
        // Email tercihlerini al
        const MentorProfile = require('../models/MentorProfile');
        const mentorProfile = await MentorProfile.findOne({ userId: meeting.mentorUserId._id });
        const participantUser = await User.findById(meeting.participantUserId._id);
        
        await emailService.sendMeetingNoteAdded(
          meeting,
          meeting.mentorUserId,
          meeting.participantUserId,
          meetingNote,
          mentorProfile?.emailPreferences,
          participantUser?.emailPreferences
        );
      } catch (emailError) {
        console.error('Not eklendi email gönderme hatası:', emailError);
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Not başarıyla eklendi',
      data: meetingNote
    });
  } catch (error) {
    console.error('createMeetingNote error:', error);
    res.status(500).json({
      success: false,
      message: 'Not eklenirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Toplantıya katılım kaydı
// @route   POST /api/mentornet/meetings/:id/join
// @access  Meeting participant/mentor
exports.joinMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    
    const meeting = await MentorMeeting.findById(id);
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Toplantı bulunamadı'
      });
    }
    
    // Yetkilendirme
    const isMentor = meeting.mentorUserId.toString() === req.user._id.toString();
    const isParticipant = meeting.participantUserId.toString() === req.user._id.toString();
    
    if (!isMentor && !isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Bu toplantıya katılma yetkiniz yok'
      });
    }
    
    // Katılım kaydı
    if (isMentor && !meeting.attendance.mentorJoined) {
      meeting.attendance.mentorJoined = true;
      meeting.attendance.mentorJoinedAt = new Date();
    } else if (isParticipant && !meeting.attendance.participantJoined) {
      meeting.attendance.participantJoined = true;
      meeting.attendance.participantJoinedAt = new Date();
    }
    
    // 🎯 Her iki taraf da katıldı mı kontrol et
    const bothJoined = meeting.attendance.mentorJoined && meeting.attendance.participantJoined;
    
    // 🎯 Her iki taraf da katıldıysa ve toplantı süresi dolmuşsa, otomatik tamamla
    const meetingEnded = new Date() > new Date(meeting.endAt);
    
    if (bothJoined && meetingEnded && meeting.status === 'scheduled') {
      meeting.status = 'completed';
      meeting.completedAt = new Date();
      
      console.log(`✅ Toplantı otomatik tamamlandı: ${meeting._id} (Her iki taraf katıldı ve süre doldu)`);
      
      // 📊 Mentor stats'ini güncelle
      try {
        const MentorProfile = require('../models/MentorProfile');
        const mentorProfile = await MentorProfile.findOne({ userId: meeting.mentorUserId });
        if (mentorProfile) {
          await mentorProfile.updateStats({ incrementCompleted: true });
          console.log(`📊 Mentor stats otomatik güncellendi: ${meeting.mentorUserId}`);
        }
      } catch (statsError) {
        console.error('Stats güncelleme hatası:', statsError);
      }
    }
    
    await meeting.save();
    
    res.json({
      success: true,
      message: 'Toplantıya katılım kaydedildi',
      data: {
        attendance: meeting.attendance,
        meetingUrl: meeting.meetingUrl,
        status: meeting.status,
        autoCompleted: bothJoined && meetingEnded
      }
    });
  } catch (error) {
    console.error('joinMeeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Katılım kaydedilirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Toplantı katılım bilgisini getir
// @route   GET /api/mentornet/meetings/:id/attendance
// @access  Meeting participant/mentor/admin
exports.getMeetingAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    
    const meeting = await MentorMeeting.findById(id)
      .populate('mentorUserId', 'name email')
      .populate('participantUserId', 'name email');
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Toplantı bulunamadı'
      });
    }
    
    // Yetkilendirme
    const isAdmin = ['superadmin', 'admin'].includes(req.user.role);
    const isMentor = meeting.mentorUserId._id.toString() === req.user._id.toString();
    const isParticipant = meeting.participantUserId._id.toString() === req.user._id.toString();
    
    if (!isAdmin && !isMentor && !isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Bu toplantı katılım bilgilerini görüntüleme yetkiniz yok'
      });
    }
    
    res.json({
      success: true,
      data: {
        meetingId: meeting._id,
        status: meeting.status,
        startAt: meeting.startAt,
        endAt: meeting.endAt,
        attendance: meeting.attendance,
        mentor: {
          name: meeting.mentorUserId.name,
          email: meeting.mentorUserId.email,
          joined: meeting.attendance.mentorJoined,
          joinedAt: meeting.attendance.mentorJoinedAt
        },
        participant: {
          name: meeting.participantUserId.name,
          email: meeting.participantUserId.email,
          joined: meeting.attendance.participantJoined,
          joinedAt: meeting.attendance.participantJoinedAt
        }
      }
    });
  } catch (error) {
    console.error('getMeetingAttendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Katılım bilgisi getirilirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Geçmiş toplantıları otomatik tamamla (Manuel tetikleme - Admin)
// @route   POST /api/mentornet/meetings/auto-complete
// @access  Admin Only
exports.autoCompletePastMeetings = async (req, res) => {
  try {
    console.log('🔄 Manuel: Geçmiş toplantıları tamamlama başlatıldı...');
    
    const result = await MentorMeeting.autoCompletePastMeetings();
    
    res.json({
      success: true,
      message: `${result.modifiedCount} geçmiş toplantı tamamlandı`,
      data: {
        completedCount: result.modifiedCount,
        matchedCount: result.matchedCount
      }
    });
  } catch (error) {
    console.error('autoCompletePastMeetings error:', error);
    res.status(500).json({
      success: false,
      message: 'Toplantılar tamamlanırken hata oluştu',
      error: error.message
    });
  }
};

// @desc    İptal edilmiş toplantıları listele (mentor paneli için)
// @route   GET /api/mentornet/meetings/cancelled
// @access  Authenticated User (Mentor/Participant)
exports.getCancelledMeetings = async (req, res) => {
  try {
    const { programId, fromDate, toDate, limit = 50 } = req.query;
    
    const query = { status: 'cancelled' };
    
    // Multi-Tenant: ideathonId çözümle
    // ÖNCELİK: ?event=slug > req.ideathonId (JWT) > user.ideathonId
    let ideathonId = null;
    if (req.query.event) {
      const Ideathon = require('../models/Ideathon');
      const ideathon = await Ideathon.findOne({ slug: req.query.event, status: 'active' })
        .select('_id').lean();
      if (ideathon) ideathonId = ideathon._id;
    }
    if (!ideathonId && req.ideathonId) ideathonId = req.ideathonId;
    if (!ideathonId && req.user.role === 'user' && req.user.ideathonId) ideathonId = req.user.ideathonId;
    
    // Mentor ise kendi toplantıları + ideathon filtresi
    if (req.user.role === 'mentor') {
      query.mentorUserId = req.user._id;
      if (ideathonId) query.ideathonId = ideathonId;
    } else if (req.user.role === 'user') {
      // Katılımcı ise kendi toplantıları + ideathon filtresi
      query.participantUserId = req.user._id;
      if (ideathonId) query.ideathonId = ideathonId;
    }
    // Admin ise tüm toplantılar
    
    if (programId) query.programId = programId;
    if (fromDate) query.cancelledAt = { $gte: new Date(fromDate) };
    if (toDate) {
      query.cancelledAt = query.cancelledAt || {};
      query.cancelledAt.$lte = new Date(toDate);
    }
    
    const meetings = await MentorMeeting.find(query)
      .populate('mentorUserId', 'name email role')
      .populate('participantUserId', 'name email role')
      .populate('cancelledBy', 'name email role')
      .populate('slotId')
      .sort({ cancelledAt: -1 })
      .limit(parseInt(limit));
    
    // Add teamName to participants
    const meetingsWithTeams = await addTeamNameToMeetings(meetings);
    
    res.json({
      success: true,
      count: meetingsWithTeams.length,
      data: meetingsWithTeams
    });
  } catch (error) {
    console.error('getCancelledMeetings error:', error);
    res.status(500).json({
      success: false,
      message: 'İptal edilmiş toplantılar getirilirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Tamamlanmış toplantıları listele (mentor paneli için)
// @route   GET /api/mentornet/meetings/completed
// @access  Authenticated User (Mentor/Participant)
exports.getCompletedMeetings = async (req, res) => {
  try {
    const { programId, fromDate, toDate, limit = 50 } = req.query;
    
    const query = { status: 'completed' };
    
    // Multi-Tenant: ideathonId çözümle
    // ÖNCELİK: ?event=slug > req.ideathonId (JWT) > user.ideathonId
    let ideathonId = null;
    if (req.query.event) {
      const Ideathon = require('../models/Ideathon');
      const ideathon = await Ideathon.findOne({ slug: req.query.event, status: 'active' })
        .select('_id').lean();
      if (ideathon) ideathonId = ideathon._id;
    }
    if (!ideathonId && req.ideathonId) ideathonId = req.ideathonId;
    if (!ideathonId && req.user.role === 'user' && req.user.ideathonId) ideathonId = req.user.ideathonId;
    
    // Mentor ise kendi toplantıları + ideathon filtresi
    if (req.user.role === 'mentor') {
      query.mentorUserId = req.user._id;
      if (ideathonId) query.ideathonId = ideathonId;
    } else if (req.user.role === 'user') {
      // Katılımcı ise kendi toplantıları + ideathon filtresi
      query.participantUserId = req.user._id;
      if (ideathonId) query.ideathonId = ideathonId;
    }
    // Admin ise tüm toplantılar
    
    if (programId) query.programId = programId;
    if (fromDate) query.completedAt = { $gte: new Date(fromDate) };
    if (toDate) {
      query.completedAt = query.completedAt || {};
      query.completedAt.$lte = new Date(toDate);
    }
    
    const meetings = await MentorMeeting.find(query)
      .populate('mentorUserId', 'name email role')
      .populate('participantUserId', 'name email role')
      .populate('completedBy', 'name email role')
      .populate('slotId')
      .sort({ completedAt: -1 })
      .limit(parseInt(limit));
    
    // Add teamName to participants
    const meetingsWithTeams = await addTeamNameToMeetings(meetings);
    
    res.json({
      success: true,
      count: meetingsWithTeams.length,
      data: meetingsWithTeams
    });
  } catch (error) {
    console.error('getCompletedMeetings error:', error);
    res.status(500).json({
      success: false,
      message: 'Tamamlanmış toplantılar getirilirken hata oluştu',
      error: error.message
    });
  }
};

module.exports = exports;

