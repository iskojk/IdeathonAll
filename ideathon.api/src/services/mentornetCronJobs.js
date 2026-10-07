const cron = require('node-cron');
const AvailabilitySlot = require('../models/AvailabilitySlot');
const AvailabilityRule = require('../models/AvailabilityRule');
const MentorMeeting = require('../models/MentorMeeting');
const MentorProfile = require('../models/MentorProfile');
const User = require('../models/User');
const emailService = require('./emailService');

class MentorNetCronJobs {
  constructor() {
    this.jobs = [];
  }

  // Cron job'ları başlat
  start() {
    console.log('🕐 MentorNet Cron Jobs başlatılıyor...');

    // 1. Her 5 dakikada bir: Rezervasyon süresi dolmuş slotları temizle
    this.expireReservationsJob();

    // 2. Her gün saat 00:00'da: Geçmiş scheduled toplantıları completed yap
    this.autoCompletePastMeetingsJob();

    // 3. Her gün saat 09:00'da: Yarın olan toplantılar için hatırlatma (1 gün önce)
    this.sendOneDayBeforeRemindersJob();

    // 4. Her saat başı: 1 saat sonrası toplantılar için hatırlatma
    this.sendOneHourBeforeRemindersJob();

    // 5. Her gün saat 03:00'da: Yeni slotlar üret (30 gün sonrası için)
    this.generateFutureSlotsJob();

    console.log(`✅ ${this.jobs.length} Cron Job aktif edildi`);
  }

  // Tüm job'ları durdur
  stop() {
    this.jobs.forEach(job => job.stop());
    console.log('⏹️ Tüm Cron Jobs durduruldu');
  }

  // 1. Rezervasyon süreleri dolmuş slotları temizle
  expireReservationsJob() {
    const job = cron.schedule('*/5 * * * *', async () => {
      try {
        const result = await AvailabilitySlot.expireReservations();
        if (result.modifiedCount > 0) {
          console.log(`🔄 ${result.modifiedCount} rezervasyon süresi doldu ve temizlendi`);
        }
      } catch (error) {
        console.error('❌ Rezervasyon temizleme hatası:', error);
      }
    });

    this.jobs.push(job);
    console.log('✓ Rezervasyon temizleme job\'u aktif (Her 5 dakika)');
  }

  // 2. Geçmiş scheduled toplantıları completed yap (her 15 dakikada bir)
  autoCompletePastMeetingsJob() {
    const job = cron.schedule('*/15 * * * *', async () => {
      try {
        const result = await MentorMeeting.autoCompletePastMeetings();
        if (result.modifiedCount > 0) {
          console.log(`✅ ${result.modifiedCount} geçmiş toplantı otomatik tamamlandı`);
        }
      } catch (error) {
        console.error('❌ Toplantı tamamlama hatası:', error);
      }
    });

    this.jobs.push(job);
    console.log('✓ Otomatik toplantı tamamlama job\'u aktif (Her 15 dakika)');
  }

  // 3. 1 gün önce hatırlatma
  sendOneDayBeforeRemindersJob() {
    const job = cron.schedule('0 9 * * *', async () => {
      try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const dayAfterTomorrow = new Date(tomorrow);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

        // Yarın olan toplantıları bul
        const meetings = await MentorMeeting.find({
          status: 'scheduled',
          startAt: {
            $gte: tomorrow,
            $lt: dayAfterTomorrow
          },
          'reminders.oneDayBefore': false
        })
          .populate('mentorUserId', 'name email')
          .populate('participantUserId', 'name email');

        for (const meeting of meetings) {
          try {
            // Email tercihlerini al
            const mentorProfile = await MentorProfile.findOne({ userId: meeting.mentorUserId._id });
            const participantUser = await User.findById(meeting.participantUserId._id);
            
            await emailService.sendMeetingReminderOneDayBefore(
              meeting,
              meeting.mentorUserId,
              meeting.participantUserId,
              mentorProfile?.emailPreferences,
              participantUser?.emailPreferences
            );

            // Hatırlatma gönderildi olarak işaretle
            meeting.reminders.oneDayBefore = true;
            await meeting.save();
          } catch (emailError) {
            console.error(`Email hatası (meeting ${meeting._id}):`, emailError);
          }
        }

        if (meetings.length > 0) {
          console.log(`📧 ${meetings.length} toplantı için 1 gün öncesi hatırlatma gönderildi`);
        }
      } catch (error) {
        console.error('❌ 1 gün öncesi hatırlatma hatası:', error);
      }
    });

    this.jobs.push(job);
    console.log('✓ 1 gün öncesi hatırlatma job\'u aktif (Her gün 09:00)');
  }

  // 4. 1 saat önce hatırlatma
  sendOneHourBeforeRemindersJob() {
    const job = cron.schedule('0 * * * *', async () => {
      try {
        const oneHourLater = new Date();
        oneHourLater.setHours(oneHourLater.getHours() + 1);
        oneHourLater.setMinutes(0, 0, 0);
        
        const twoHoursLater = new Date(oneHourLater);
        twoHoursLater.setHours(twoHoursLater.getHours() + 1);

        // 1 saat sonra başlayacak toplantıları bul
        const meetings = await MentorMeeting.find({
          status: 'scheduled',
          startAt: {
            $gte: oneHourLater,
            $lt: twoHoursLater
          },
          'reminders.oneHourBefore': false
        })
          .populate('mentorUserId', 'name email')
          .populate('participantUserId', 'name email');

        for (const meeting of meetings) {
          try {
            // Email tercihlerini al
            const mentorProfile = await MentorProfile.findOne({ userId: meeting.mentorUserId._id });
            const participantUser = await User.findById(meeting.participantUserId._id);
            
            await emailService.sendMeetingReminderOneHourBefore(
              meeting,
              meeting.mentorUserId,
              meeting.participantUserId,
              mentorProfile?.emailPreferences,
              participantUser?.emailPreferences
            );

            // Hatırlatma gönderildi olarak işaretle
            meeting.reminders.oneHourBefore = true;
            await meeting.save();
          } catch (emailError) {
            console.error(`Email hatası (meeting ${meeting._id}):`, emailError);
          }
        }

        if (meetings.length > 0) {
          console.log(`📧 ${meetings.length} toplantı için 1 saat öncesi hatırlatma gönderildi`);
        }
      } catch (error) {
        console.error('❌ 1 saat öncesi hatırlatma hatası:', error);
      }
    });

    this.jobs.push(job);
    console.log('✓ 1 saat öncesi hatırlatma job\'u aktif (Her saat başı)');
  }

  // 5. Yeni slotlar üret (30 gün sonrası için)
  generateFutureSlotsJob() {
    const job = cron.schedule('0 3 * * *', async () => {
      try {
        // Aktif tüm kuralları al
        const rules = await AvailabilityRule.find({ isActive: true });

        let totalSlotsCreated = 0;

        for (const rule of rules) {
          try {
            // 30 gün sonrası için slotlar üret
            const startDate = new Date();
            startDate.setDate(startDate.getDate() + 30);
            
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 1); // 1 gün

            const slots = rule.generateSlotsForDateRange(startDate, endDate);

            if (slots.length > 0) {
              // Aynı slotlar zaten var mı kontrol et (çakışma önlemi)
              for (const slotData of slots) {
                const existingSlot = await AvailabilitySlot.findOne({
                  mentorUserId: slotData.mentorUserId,
                  startAt: slotData.startAt,
                  endAt: slotData.endAt
                });

                if (!existingSlot) {
                  await AvailabilitySlot.create(slotData);
                  totalSlotsCreated++;
                }
              }

              // Rule'un lastSyncedAt'ini güncelle
              rule.lastSyncedAt = new Date();
              await rule.save();
            }
          } catch (slotError) {
            console.error(`Slot üretim hatası (rule ${rule._id}):`, slotError);
          }
        }

        if (totalSlotsCreated > 0) {
          console.log(`🆕 ${totalSlotsCreated} yeni slot oluşturuldu (30 gün sonrası için)`);
        }
      } catch (error) {
        console.error('❌ Slot üretim hatası:', error);
      }
    });

    this.jobs.push(job);
    console.log('✓ Yeni slot üretim job\'u aktif (Her gün 03:00)');
  }

  // Manuel olarak çalıştırma metodları (test için)
  async runExpireReservations() {
    console.log('🔄 Manuel: Rezervasyon temizleme başlatılıyor...');
    const result = await AvailabilitySlot.expireReservations();
    console.log(`✅ ${result.modifiedCount} rezervasyon temizlendi`);
    return result;
  }

  async runAutoCompleteMeetings() {
    console.log('✅ Manuel: Geçmiş toplantıları tamamlama başlatılıyor...');
    const result = await MentorMeeting.autoCompletePastMeetings();
    console.log(`✅ ${result.modifiedCount} toplantı tamamlandı`);
    return result;
  }

  async runGenerateSlots() {
    console.log('🆕 Manuel: Slot üretimi başlatılıyor...');
    const rules = await AvailabilityRule.find({ isActive: true });
    let totalSlotsCreated = 0;

    for (const rule of rules) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 30);
      
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);

      const slots = rule.generateSlotsForDateRange(startDate, endDate);

      for (const slotData of slots) {
        const existingSlot = await AvailabilitySlot.findOne({
          mentorUserId: slotData.mentorUserId,
          startAt: slotData.startAt,
          endAt: slotData.endAt
        });

        if (!existingSlot) {
          await AvailabilitySlot.create(slotData);
          totalSlotsCreated++;
        }
      }
    }

    console.log(`✅ ${totalSlotsCreated} slot oluşturuldu`);
    return { slotsCreated: totalSlotsCreated };
  }
}

module.exports = new MentorNetCronJobs();











