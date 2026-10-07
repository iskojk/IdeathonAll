const AvailabilityRule = require('../models/AvailabilityRule');
const AvailabilitySlot = require('../models/AvailabilitySlot');
const MentorProfile = require('../models/MentorProfile');
const User = require('../models/User');
const MentorMeeting = require('../models/MentorMeeting');
const emailService = require('../services/emailService');

// ==================== AVAILABILITY RULES ====================

// @desc    Kendi müsaitlik kurallarını getir (mentor) - AKTİF + PASİF
// @route   GET /api/mentornet/availability/rules/me
// @access  Mentor
exports.getMyRules = async (req, res) => {
  try {
    // 🔥 Hem aktif hem pasif kuralları getir (activeOnly: false) — ideathonId filtresi
    const rules = await AvailabilityRule.findMentorRules(req.user._id, false, req.ideathonId);
    
    res.json({
      success: true,
      count: rules.length,
      data: rules
    });
  } catch (error) {
    console.error('getMyRules error:', error);
    res.status(500).json({
      success: false,
      message: 'Kurallar getirilirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Yeni müsaitlik kuralı oluştur (mentor)
// @route   POST /api/mentornet/availability/rules
// @access  Mentor
exports.createRule = async (req, res) => {
  try {
    const { 
      programId, 
      dayOfWeek, 
      startTime, 
      endTime, 
      meetingDuration, 
      breakTime,
      meetingType,
      customLocation,
      notes 
    } = req.body;
    
    // Mentor profili var mı kontrol et
    const mentorProfile = await MentorProfile.findOne({ userId: req.user._id });
    if (!mentorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Mentor profili bulunamadı. Önce mentor profili oluşturulmalı'
      });
    }
    
    const rule = new AvailabilityRule({
      ideathonId: req.ideathonId, // Multi-Tenant: JWT'den gelen ideathonId
      programId,
      mentorUserId: req.user._id,
      dayOfWeek,
      startTime,
      endTime,
      meetingDuration: meetingDuration || 25,
      breakTime: breakTime || 0,
      meetingType: meetingType || 'jitsi',
      customLocation,
      notes,
      createdBy: req.user._id
    });
    
    await rule.save();
    
    // Kural oluşturulduktan sonra ileriye 30 gün için slotlar üret
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 30);
    
    const slots = rule.generateSlotsForDateRange(today, futureDate);
    
    if (slots.length > 0) {
      await AvailabilitySlot.insertMany(slots);
      rule.lastSyncedAt = new Date();
      await rule.save();
    }
    
    res.status(201).json({
      success: true,
      message: `Müsaitlik kuralı oluşturuldu ve ${slots.length} slot üretildi`,
      data: rule,
      generatedSlotsCount: slots.length // ✅ Standardize edilmiş alan adı
    });
  } catch (error) {
    console.error('createRule error:', error);
    
    // Duplicate key hatası (aynı gün/saat çakışması)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Bu gün ve saat aralığı için zaten aktif bir kural mevcut'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Kural oluşturulurken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Müsaitlik kuralını güncelle (mentor)
// @route   PUT /api/mentornet/availability/rules/:id
// @access  Mentor
exports.updateRule = async (req, res) => {
  try {
    const { id } = req.params;
    const { dayOfWeek, startTime, endTime, meetingDuration, breakTime, meetingType, customLocation, isActive, notes } = req.body;
    
    const rule = await AvailabilityRule.findById(id);
    
    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Kural bulunamadı'
      });
    }
    
    // Sadece kendi kuralını güncelleyebilir
    if (rule.mentorUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bu kuralı güncelleme yetkiniz yok'
      });
    }
    
    // Kritik alanlar değişti mi kontrol et (slot yenileme gerekebilir)
    const criticalFieldsChanged = 
      (dayOfWeek !== undefined && dayOfWeek !== rule.dayOfWeek) ||
      (startTime !== undefined && startTime !== rule.startTime) ||
      (endTime !== undefined && endTime !== rule.endTime) ||
      (meetingDuration !== undefined && meetingDuration !== rule.meetingDuration) ||
      (breakTime !== undefined && breakTime !== rule.breakTime);

    const wasActive = rule.isActive;
    const willBeActive = isActive !== undefined ? isActive : rule.isActive;
    
    let cancelledCount = 0;
    let deletedCount = 0;
    let generatedCount = 0;
    
    // Eğer kritik alanlar değiştiyse ve kural aktifse, eski slotları temizle
    if (criticalFieldsChanged && willBeActive) {
      // 🔥 Eski open ve cancelled slotları SİL (cancel değil, direkt delete!)
      // Çünkü yeni parametrelerle slotlar yeniden oluşturulacak
      const deleteResult = await AvailabilitySlot.deleteMany(
        { 
          ruleId: id, 
          status: { $in: ['open', 'cancelled'] } // reserved ve booked'ları koruyoruz
        }
      );
      deletedCount = deleteResult.deletedCount;
    }
    
    // Kuralı güncelle
    if (dayOfWeek !== undefined) rule.dayOfWeek = dayOfWeek;
    if (startTime !== undefined) rule.startTime = startTime;
    if (endTime !== undefined) rule.endTime = endTime;
    if (meetingDuration !== undefined) rule.meetingDuration = meetingDuration;
    if (breakTime !== undefined) rule.breakTime = breakTime;
    if (meetingType !== undefined) rule.meetingType = meetingType;
    if (customLocation !== undefined) rule.customLocation = customLocation;
    if (isActive !== undefined) rule.isActive = isActive;
    if (notes !== undefined) rule.notes = notes;
    
    await rule.save();
    
    // Eğer kritik alanlar değiştiyse veya pasiften aktife geçtiyse, yeni slotlar oluştur
    if ((criticalFieldsChanged || (!wasActive && willBeActive)) && willBeActive) {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + 30);
      
      // 🔥 Pasiften aktife geçişte de cancelled slotları temizle
      if (!wasActive && willBeActive) {
        const deleteResult = await AvailabilitySlot.deleteMany(
          { ruleId: id, status: 'cancelled' }
        );
        deletedCount = deleteResult.deletedCount;
      }
      
      const newSlots = rule.generateSlotsForDateRange(today, futureDate);
      
      if (newSlots.length > 0) {
        // Artık cancelled slotlar temizlendiği için upsert sorunsuz çalışır
        for (const slot of newSlots) {
          await AvailabilitySlot.findOneAndUpdate(
            {
              mentorUserId: slot.mentorUserId,
              startAt: slot.startAt,
              endAt: slot.endAt
            },
            { $setOnInsert: slot },
            { upsert: true, new: true }
          );
        }
        generatedCount = newSlots.length;
        rule.lastSyncedAt = new Date();
        await rule.save();
      }
    }
    
    // Eğer aktiften pasife geçtiyse, open slotları iptal et
    if (wasActive && !willBeActive) {
      const cancelResult = await AvailabilitySlot.updateMany(
        { ruleId: id, status: 'open' },
        { $set: { status: 'cancelled', cancelledBy: req.user._id, cancelledAt: new Date() } }
      );
      cancelledCount = cancelResult.modifiedCount;
    }
    
    let message = 'Kural başarıyla güncellendi';
    if (deletedCount > 0 && generatedCount > 0) {
      message = `Kural güncellendi: ${deletedCount} slot silindi, ${generatedCount} yeni slot oluşturuldu`;
    } else if (cancelledCount > 0) {
      message = `Kural güncellendi ve ${cancelledCount} slot iptal edildi`;
    } else if (deletedCount > 0) {
      message = `Kural güncellendi ve ${deletedCount} slot silindi`;
    } else if (generatedCount > 0) {
      message = `Kural güncellendi ve ${generatedCount} slot oluşturuldu`;
    }
    
    res.json({
      success: true,
      message,
      data: rule,
      deletedSlotsCount: deletedCount,
      cancelledSlotsCount: cancelledCount,
      generatedSlotsCount: generatedCount
    });
  } catch (error) {
    console.error('updateRule error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Bu gün ve saat aralığı için zaten aktif bir kural mevcut'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Kural güncellenirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Müsaitlik kuralını sil (mentor) - HARD DELETE
// @route   DELETE /api/mentornet/availability/rules/:id
// @access  Mentor
exports.deleteRule = async (req, res) => {
  try {
    const { id } = req.params;
    
    const rule = await AvailabilityRule.findById(id);
    
    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Kural bulunamadı'
      });
    }
    
    // Sadece kendi kuralını silebilir
    if (rule.mentorUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bu kuralı silme yetkiniz yok'
      });
    }
    
    // 🔥 İlgili open slotları tamamen sil
    const deleteResult = await AvailabilitySlot.deleteMany(
      { ruleId: id, status: 'open' }
    );
    
    // 🔥 Kuralı tamamen sil (hard delete)
    await AvailabilityRule.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: `Kural ve ${deleteResult.deletedCount} slot tamamen silindi`,
      deletedSlotsCount: deleteResult.deletedCount
    });
  } catch (error) {
    console.error('deleteRule error:', error);
    res.status(500).json({
      success: false,
      message: 'Kural silinirken hata oluştu',
      error: error.message
    });
  }
};

// ==================== AVAILABILITY SLOTS ====================

// @desc    Mentor'un müsait slotlarını getir (participant/public)
// @route   GET /api/mentornet/availability/:mentorUserId
// @access  Public
exports.getAvailableSlots = async (req, res) => {
  try {
    const { mentorUserId } = req.params;
    const { programId, fromDate, toDate } = req.query;
    
    // ÖNEMLİ: Mentor profili ve aktif müsaitlik kontrolü
    const mentorProfile = await MentorProfile.findOne({ userId: mentorUserId, isActive: true });
    
    if (!mentorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Mentor bulunamadı veya aktif değil'
      });
    }
    
    // Mentor'un aktif bir müsaitlik kuralı veya manuel slot'u var mı kontrol et
    const hasActiveRules = await AvailabilityRule.countDocuments({
      mentorUserId,
      isActive: true
    });
    
    const hasSlots = await AvailabilitySlot.countDocuments({
      mentorUserId,
      status: 'open',
      startAt: { $gte: new Date() }
    });
    
    // Eğer hiç müsaitlik tanımlanmamışsa uyarı döndür
    if (hasActiveRules === 0 && hasSlots === 0) {
      return res.json({
        success: true,
        count: 0,
        data: [],
        message: 'Bu mentor henüz müsaitlik oluşturmamış. Lütfen daha sonra tekrar kontrol edin.'
      });
    }
    
    // Default: bugünden itibaren 30 gün
    const from = fromDate ? new Date(fromDate) : new Date();
    const to = toDate ? new Date(toDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    const slots = await AvailabilitySlot.findAvailableSlots(mentorUserId, from, to, programId);
    
    res.json({
      success: true,
      count: slots.length,
      data: slots
    });
  } catch (error) {
    console.error('getAvailableSlots error:', error);
    res.status(500).json({
      success: false,
      message: 'Müsait slotlar getirilirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Mentor'un tüm slotlarını getir (kendi slotları - mentor)
// @route   GET /api/mentornet/availability/slots/me
// @access  Mentor
exports.getMySlots = async (req, res) => {
  try {
    const { status, fromDate, toDate, programId, includeCancelled } = req.query;
    
    // Varsayılan olarak cancelled slotları hariç tut
    // Frontend açıkça includeCancelled=true gönderirse dahil et
    const filters = { fromDate, toDate, programId, ideathonId: req.ideathonId };
    
    // Status filtresi varsa kullan, yoksa cancelled hariç hepsini getir
    if (status) {
      filters.status = status;
    } else if (includeCancelled !== 'true') {
      // Cancelled hariç tüm statusleri getir
      filters.statusExclude = 'cancelled';
    }
    
    const slots = await AvailabilitySlot.findMentorSlots(req.user._id, filters);
    
    res.json({
      success: true,
      count: slots.length,
      data: slots
    });
  } catch (error) {
    console.error('getMySlots error:', error);
    res.status(500).json({
      success: false,
      message: 'Slotlar getirilirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Manuel slot ekle (mentor)
// @route   POST /api/mentornet/availability/slots
// @access  Mentor
exports.createManualSlot = async (req, res) => {
  try {
    const { 
      programId, 
      startAt, 
      endAt, 
      timezone, 
      meetingType, 
      customLocation, 
      notes,
      participantUserId,
      title,
      description
    } = req.body;
    
    if (!startAt || !endAt) {
      return res.status(400).json({
        success: false,
        message: 'Başlangıç ve bitiş zamanı zorunludur'
      });
    }
    
    const startDate = new Date(startAt);
    const endDate = new Date(endAt);
    
    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: 'Bitiş zamanı başlangıç zamanından sonra olmalıdır'
      });
    }

    // Katılımcı seçildiyse, ideathon onaylı başvuru kontrolü yap
    let approvedApplication = null;
    if (participantUserId) {
      const participant = await User.findById(participantUserId);
      if (!participant) {
        return res.status(404).json({
          success: false,
          message: 'Katılımcı bulunamadı'
        });
      }

      const mentorProfile = await MentorProfile.findOne({ userId: req.user._id });
      if (!mentorProfile) {
        return res.status(404).json({
          success: false,
          message: 'Mentor profili bulunamadı'
        });
      }

      const Application = require('../models/Application');
      const mentorIdeathonId = mentorProfile.ideathonId || req.ideathonId;

      approvedApplication = await Application.findOne({
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
    }
    
    const slot = new AvailabilitySlot({
      ideathonId: req.ideathonId,
      programId,
      mentorUserId: req.user._id,
      startAt: startDate,
      endAt: endDate,
      timezone: timezone || 'Europe/Istanbul',
      source: 'manual',
      status: 'open',
      meetingType: meetingType || 'jitsi',
      customLocation,
      notes
    });
    
    await slot.save();

    // Katılımcı seçildiyse, direkt toplantı oluştur
    let meeting = null;
    if (participantUserId) {
      const MentorIntegration = require('../models/MentorIntegration');
      const oauthService = require('../services/oauthService');

      const bookedSlot = await AvailabilitySlot.bookSlot(slot._id, null, req.user._id);
      if (!bookedSlot) {
        return res.status(400).json({
          success: false,
          message: 'Slot rezerve edilemedi'
        });
      }

      const resolvedProvider = (meetingType === 'google-meet' ? 'google' : meetingType) || 'jitsi';

      meeting = new MentorMeeting({
        ideathonId: req.ideathonId,
        mentorUserId: req.user._id,
        participantUserId,
        participantApplicationId: approvedApplication?._id || null,
        teamId: approvedApplication?.teamInfo?.teamId || null,
        slotId: slot._id,
        startAt: startDate,
        endAt: endDate,
        timezone: timezone || 'Europe/Istanbul',
        meetingProvider: resolvedProvider,
        meetingUrl: '',
        title: title || null,
        description: description || null,
        plannedByUserId: req.user._id
      });

      await meeting.save();

      // Meeting URL
      let meetingUrl = `https://meet.jit.si/emlak-konut-${meeting._id}`;
      if (resolvedProvider !== 'jitsi' && resolvedProvider !== 'private') {
        try {
          const integration = await MentorIntegration.findActiveIntegration(req.user._id, resolvedProvider);
          if (integration && integration.isTokenValid()) {
            const tokens = integration.getDecryptedTokens();
            const eventData = {
              meetingId: meeting._id.toString(),
              title: meeting.title || 'Emlak Konut Ideathon - Mentor Görüşmesi',
              description: meeting.description || `Mentor: ${req.user.name}`,
              startTime: meeting.startAt.toISOString(),
              endTime: meeting.endAt.toISOString(),
              attendees: [integration.email]
            };
            const meetingData = await oauthService.createMeeting(resolvedProvider, tokens.accessToken, eventData);
            if (meetingData.meetingUrl) {
              meetingUrl = meetingData.meetingUrl;
              meeting.metadata = {
                eventId: meetingData.eventId || meetingData.meetingId,
                htmlLink: meetingData.htmlLink,
                provider: resolvedProvider
              };
            }
          }
        } catch (providerError) {
          console.error('Provider meeting oluşturma hatası, Jitsi fallback:', providerError);
          meeting.meetingProvider = 'jitsi';
        }
      }

      meeting.meetingUrl = meetingUrl;
      await meeting.save();

      bookedSlot.bookedMeetingId = meeting._id;
      bookedSlot.status = 'booked';
      await bookedSlot.save();

      await meeting.populate([
        { path: 'mentorUserId', select: 'name email' },
        { path: 'participantUserId', select: 'name email' },
        { path: 'slotId' }
      ]);

      // Mentor stats
      try {
        const mp = await MentorProfile.findOne({ userId: req.user._id });
        if (mp) await mp.updateStats({ incrementMeetings: true });
      } catch (statsErr) {
        console.error('Stats güncelleme hatası:', statsErr);
      }

      // Email bildirimleri
      try {
        const mentorProfileForEmail = await MentorProfile.findOne({ userId: req.user._id });
        const participantUser = await User.findById(participantUserId);
        await emailService.sendMeetingCreatedToMentor(
          meeting, meeting.mentorUserId, meeting.participantUserId,
          mentorProfileForEmail?.emailPreferences
        );
        await emailService.sendMeetingCreatedToParticipant(
          meeting, meeting.mentorUserId, meeting.participantUserId,
          participantUser?.emailPreferences
        );
      } catch (emailErr) {
        console.error('Email gönderme hatası (ama toplantı oluşturuldu):', emailErr);
      }
    } else {
      // Katılımcı seçilmediyse, mevcut email bildirimi akışı
      try {
        const pastMeetings = await MentorMeeting.find({
          mentorUserId: req.user._id,
          status: { $in: ['completed', 'scheduled'] }
        }).populate('participantUserId', 'name email').distinct('participantUserId');
        
        const uniqueParticipants = [...new Map(pastMeetings.map(p => [p?._id?.toString(), p])).values()].filter(p => p);
        
        if (uniqueParticipants.length > 0) {
          const mentorProfile = await MentorProfile.findOne({ userId: req.user._id });
          const mentorUser = await User.findById(req.user._id);
          
          const participantsPreferences = {};
          for (const participant of uniqueParticipants) {
            const pUser = await User.findById(participant._id);
            participantsPreferences[participant.email] = pUser?.emailPreferences;
          }
          
          await emailService.sendAvailabilityUpdated(
            {
              _id: mentorProfile?._id || req.user._id,
              userId: req.user._id,
              name: mentorUser?.name || 'Mentor',
              title: mentorProfile?.title
            },
            uniqueParticipants,
            'added',
            participantsPreferences
          );
        }
      } catch (emailError) {
        console.error('Müsaitlik email gönderme hatası:', emailError);
      }
    }
    
    res.status(201).json({
      success: true,
      message: meeting
        ? 'Slot oluşturuldu ve toplantı planlandı'
        : 'Manuel slot başarıyla oluşturuldu',
      data: slot,
      meeting: meeting ? meeting.toObject() : null
    });
  } catch (error) {
    console.error('createManualSlot error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Bu zaman aralığında zaten bir slot mevcut'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Manuel slot oluşturulurken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Slot'u iptal et (mentor)
// @route   DELETE /api/mentornet/availability/slots/:id
// @access  Mentor
exports.cancelSlot = async (req, res) => {
  try {
    const { id } = req.params;
    // ✅ reason opsiyonel - body undefined olabilir
    const reason = req.body?.reason || 'Mentor tarafından silindi';
    
    const slot = await AvailabilitySlot.findById(id);
    
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Slot bulunamadı'
      });
    }
    
    // Sadece kendi slotunu iptal edebilir
    if (slot.mentorUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bu slotu iptal etme yetkiniz yok'
      });
    }

    // ✅ Booked veya reserved slot silinemez
    if (slot.status === 'booked' || slot.status === 'reserved') {
      return res.status(400).json({
        success: false,
        message: 'Bu slot için rezervasyon/toplantı var, silemezsiniz. Önce toplantıyı iptal edin.'
      });
    }
    
    await AvailabilitySlot.cancelSlot(id, req.user._id, reason);
    
    res.json({
      success: true,
      message: 'Slot başarıyla silindi'
    });
  } catch (error) {
    console.error('cancelSlot error:', error);
    res.status(500).json({
      success: false,
      message: 'Slot silinirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Süresi dolmuş rezervasyonları temizle (cron job için)
// @route   POST /api/mentornet/availability/expire-reservations
// @access  Admin
exports.expireReservations = async (req, res) => {
  try {
    const result = await AvailabilitySlot.expireReservations();
    
    res.json({
      success: true,
      message: 'Süresi dolmuş rezervasyonlar temizlendi',
      modified: result.modifiedCount
    });
  } catch (error) {
    console.error('expireReservations error:', error);
    res.status(500).json({
      success: false,
      message: 'Rezervasyonlar temizlenirken hata oluştu',
      error: error.message
    });
  }
};

module.exports = exports;

