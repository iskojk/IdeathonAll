const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: true
      }
    });

    setTimeout(() => this.verifyConnection(), 1000);
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ SMTP bağlantısı başarılı');
    } catch (error) {
      console.error('❌ SMTP bağlantı hatası:', error.message);
    }
  }

  // Türkiye saatine göre tarih/saat formatlama
  formatDateTR(date) {
    return new Date(date).toLocaleDateString('tr-TR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      timeZone: 'Europe/Istanbul'
    });
  }

  formatTimeTR(date) {
    return new Date(date).toLocaleTimeString('tr-TR', {
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Europe/Istanbul'
    });
  }

  formatDateTimeTR(date) {
    return new Date(date).toLocaleDateString('tr-TR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Europe/Istanbul'
    });
  }

  getMeetingsPageUrl() {
    return `${process.env.FRONTEND_URL || 'https://ideathon.anahtarfikirler.com'}/mentorluk/toplantilar`;
  }

  // Base email sending method
  async sendEmail(to, subject, html, options = {}) {
    try {
      const mailOptions = {
        from: `"Emlak Konut" <${process.env.SMTP_USER}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
        ...options
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Email gönderildi: ${subject} -> ${to}`);
      return result;
    } catch (error) {
      console.error('❌ Email gönderme hatası:', error.message);
      throw new Error(`Email gönderilemedi: ${error.message}`);
    }
  }

  // ==================== BASE TEMPLATE STYLE ====================
  getBaseStyle() {
    return `
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333333;
          background-color: #f5f5f5;
          margin: 0;
          padding: 0;
        }
        .email-wrapper {
          width: 100%;
          background-color: #f5f5f5;
          padding: 40px 20px;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 2px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .email-header {
          background-color: #005DAD;
          color: #ffffff;
          padding: 30px 40px;
          text-align: center;
        }
        .email-header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .email-header p {
          margin: 10px 0 0 0;
          font-size: 14px;
          opacity: 0.9;
          font-weight: 400;
        }
        .email-body {
          padding: 40px;
          color: #333333;
        }
        .email-body h2 {
          color: #005DAD;
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 20px 0;
        }
        .email-body p {
          margin: 0 0 15px 0;
          font-size: 15px;
          line-height: 1.6;
          color: #555555;
        }
        .info-card {
          background-color: #f8f9fa;
          border-left: 3px solid #005DAD;
          padding: 20px;
          margin: 25px 0;
          border-radius: 2px;
        }
        .info-row {
          margin: 12px 0;
          font-size: 14px;
        }
        .info-label {
          font-weight: 600;
          color: #333333;
          display: inline-block;
          min-width: 140px;
        }
        .info-value {
          color: #555555;
        }
        .button {
          display: inline-block;
          padding: 14px 32px;
          background-color: #005DAD;
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 2px;
          font-weight: 600;
          font-size: 15px;
          text-align: center;
          margin: 20px 0;
        }
        .button:hover {
          background-color: #004a8d;
        }
        .button-center {
          text-align: center;
        }
        .alert-info {
          background-color: #e7f3ff;
          border-left: 3px solid #005DAD;
          padding: 15px 20px;
          margin: 20px 0;
          border-radius: 2px;
        }
        .alert-success {
          background-color: #e8f5e9;
          border-left: 3px solid #4caf50;
          padding: 15px 20px;
          margin: 20px 0;
          border-radius: 2px;
        }
        .alert-warning {
          background-color: #fff8e1;
          border-left: 3px solid #ff9800;
          padding: 15px 20px;
          margin: 20px 0;
          border-radius: 2px;
        }
        .alert-danger {
          background-color: #ffebee;
          border-left: 3px solid #f44336;
          padding: 15px 20px;
          margin: 20px 0;
          border-radius: 2px;
        }
        .email-footer {
          background-color: #f8f9fa;
          padding: 30px 40px;
          text-align: center;
          border-top: 1px solid #e0e0e0;
        }
        .email-footer p {
          margin: 5px 0;
          font-size: 13px;
          color: #777777;
          line-height: 1.5;
        }
        .email-footer a {
          color: #005DAD;
          text-decoration: none;
        }
        .divider {
          height: 1px;
          background-color: #e0e0e0;
          margin: 30px 0;
        }
        @media only screen and (max-width: 600px) {
          .email-wrapper {
            padding: 20px 10px;
          }
          .email-body {
            padding: 30px 20px;
          }
          .email-footer {
            padding: 20px;
          }
          .info-label {
            display: block;
            min-width: auto;
            margin-bottom: 5px;
          }
        }
      </style>
    `;
  }

  // ==================== TOPLANTI SİSTEMİ EMAILS ====================

  // 1. Toplantı Oluşturuldu - Mentor'a
  async sendMeetingCreatedToMentor(meeting, mentor, participant, mentorPreferences) {
    // Email tercih kontrolü - SADECE MENTOR'UN TERCİHİ
    if (mentorPreferences && mentorPreferences.meetingCreated === false) {
      console.log(`📭 Mentor ${mentor.email} için meetingCreated email tercihi kapalı`);
      return;
    }

    const html = this.getMeetingCreatedMentorTemplate(meeting, mentor, participant);
    
    return await this.sendEmail(
      mentor.email,
      'Toplantı Oluşturuldu - Emlak Konut',
      html
    );
  }

  // 2. Toplantı Oluşturuldu - Katılımcı'ya
  async sendMeetingCreatedToParticipant(meeting, mentor, participant, participantPreferences) {
    // Email tercih kontrolü - SADECE KATILIMCININ TERCİHİ
    if (participantPreferences && participantPreferences.meetingCreated === false) {
      console.log(`📭 Katılımcı ${participant.email} için meetingCreated email tercihi kapalı`);
      return;
    }

    const html = this.getMeetingCreatedParticipantTemplate(meeting, mentor, participant);
    
    return await this.sendEmail(
      participant.email,
      `Toplantınız Oluşturuldu - ${mentor.name}`,
      html
    );
  }

  // 3. Toplantı İptal Edildi - HER KULLANICIYA AYRI AYRI
  async sendMeetingCancelled(meeting, mentor, participant, cancelledBy, reason, mentorPreferences, participantPreferences) {
    const html = this.getMeetingCancelledTemplate(meeting, mentor, participant, cancelledBy, reason);
    const subject = 'Toplantı İptal Edildi - Emlak Konut';
    
    // Mentor'a gönder (kendi tercihi kontrol edilir)
    if (!mentorPreferences || mentorPreferences.meetingCancelled !== false) {
      await this.sendEmail(mentor.email, subject, html);
    } else {
      console.log(`📭 Mentor ${mentor.email} için meetingCancelled email tercihi kapalı`);
    }
    
    // Katılımcı'ya gönder (kendi tercihi kontrol edilir)
    if (!participantPreferences || participantPreferences.meetingCancelled !== false) {
      await this.sendEmail(participant.email, subject, html);
    } else {
      console.log(`📭 Katılımcı ${participant.email} için meetingCancelled email tercihi kapalı`);
    }
  }

  // 4. Toplantı Notu Eklendi - HER KULLANICIYA AYRI AYRI
  async sendMeetingNoteAdded(meeting, mentor, participant, note, mentorPreferences, participantPreferences) {
    const html = this.getMeetingNoteAddedTemplate(meeting, mentor, participant, note);
    const subject = 'Toplantı Notu Eklendi - Emlak Konut';
    
    // Mentor'a gönder (kendi tercihi kontrol edilir)
    if (!mentorPreferences || mentorPreferences.meetingNoteAdded !== false) {
      await this.sendEmail(mentor.email, subject, html);
    } else {
      console.log(`📭 Mentor ${mentor.email} için meetingNoteAdded email tercihi kapalı`);
    }
    
    // Katılımcı'ya gönder (kendi tercihi kontrol edilir)
    if (!participantPreferences || participantPreferences.meetingNoteAdded !== false) {
      await this.sendEmail(participant.email, subject, html);
    } else {
      console.log(`📭 Katılımcı ${participant.email} için meetingNoteAdded email tercihi kapalı`);
    }
  }

  // 5. Mentor Müsaitlik Güncellendi - HER KATILIMCIYA AYRI AYRI
  async sendAvailabilityUpdated(mentor, participants, action, participantsPreferences = {}) {
    const html = this.getAvailabilityUpdatedTemplate(mentor, action);
    const subject = `Mentor Müsaitlik Güncellendi - ${mentor.name}`;
    
    // Her katılımcıya ayrı ayrı gönder (kendi tercihine göre)
    for (const participant of participants) {
      const prefs = participantsPreferences[participant.email];
      
      if (!prefs || prefs.availabilityUpdated !== false) {
        await this.sendEmail(participant.email, subject, html);
      } else {
        console.log(`📭 Katılımcı ${participant.email} için availabilityUpdated email tercihi kapalı`);
      }
    }
  }

  // 6. Yeni Mesaj - SADECE ALICININ TERCİHİ
  async sendNewMessage(sender, receiver, conversation, message, receiverPreferences) {
    // Sadece ALICININ tercihi kontrol edilir (gönderen değil)
    if (receiverPreferences && receiverPreferences.newMessage === false) {
      console.log(`📭 Alıcı ${receiver.email} için newMessage email tercihi kapalı`);
      return;
    }

    const html = this.getNewMessageTemplate(sender, receiver, conversation, message);
    
    return await this.sendEmail(
      receiver.email,
      `Yeni Mesajınız Var - ${sender.name}`,
      html
    );
  }

  // 7. Toplantı Hatırlatma - 1 Gün Önce - HER KULLANICIYA AYRI AYRI
  async sendMeetingReminderOneDayBefore(meeting, mentor, participant, mentorPreferences, participantPreferences) {
    const html = this.getMeetingReminderTemplate(meeting, mentor, participant, '1 gün');
    const subject = 'Toplantı Hatırlatması - Emlak Konut';
    
    // Mentor'a gönder (kendi tercihi kontrol edilir)
    if (!mentorPreferences || mentorPreferences.meetingReminder !== false) {
      await this.sendEmail(mentor.email, subject, html);
    } else {
      console.log(`📭 Mentor ${mentor.email} için meetingReminder email tercihi kapalı`);
    }
    
    // Katılımcı'ya gönder (kendi tercihi kontrol edilir)
    if (!participantPreferences || participantPreferences.meetingReminder !== false) {
      await this.sendEmail(participant.email, subject, html);
    } else {
      console.log(`📭 Katılımcı ${participant.email} için meetingReminder email tercihi kapalı`);
    }
  }

  // 8. Toplantı Hatırlatma - 1 Saat Önce - HER KULLANICIYA AYRI AYRI
  async sendMeetingReminderOneHourBefore(meeting, mentor, participant, mentorPreferences, participantPreferences) {
    const html = this.getMeetingReminderTemplate(meeting, mentor, participant, '1 saat');
    const subject = 'Toplantınız 1 Saat Sonra Başlıyor - Emlak Konut';
    
    // Mentor'a gönder (kendi tercihi kontrol edilir)
    if (!mentorPreferences || mentorPreferences.meetingReminder !== false) {
      await this.sendEmail(mentor.email, subject, html);
    } else {
      console.log(`📭 Mentor ${mentor.email} için meetingReminder email tercihi kapalı`);
    }
    
    // Katılımcı'ya gönder (kendi tercihi kontrol edilir)
    if (!participantPreferences || participantPreferences.meetingReminder !== false) {
      await this.sendEmail(participant.email, subject, html);
    } else {
      console.log(`📭 Katılımcı ${participant.email} için meetingReminder email tercihi kapalı`);
    }
  }

  // ==================== LEGACY EMAILS (Eski sistem) ====================

  async sendPasswordResetEmail(email, resetCode, userName) {
    const html = this.getPasswordResetTemplate(userName, resetCode);
    return await this.sendEmail(
      email,
      'Şifre Sıfırlama Kodu - Emlak Konut',
      html
    );
  }

  async sendNewApplicationNotification(application) {
    const adminEmails = [
      process.env.MAIL_FROM_APPLICATION_ONE,
      process.env.MAIL_FROM_APPLICATION_TWO
    ].filter(email => email);

    if (adminEmails.length === 0) {
      console.warn('⚠️  Admin email adresleri tanımlanmamış');
      return;
    }

    const html = this.getNewApplicationAdminTemplate(application);
    return await this.sendEmail(
      adminEmails,
      `Yeni Başvuru Alındı - ${application.applicationNumber}`,
      html
    );
  }

  async sendApplicationConfirmationEmail(application) {
    const html = this.getApplicationConfirmationTemplate(application);
    return await this.sendEmail(
      application.applicantInfo.email,
      'Başvurunuz Alındı - Emlak Konut',
      html
    );
  }

  async sendApplicationStatusUpdateEmail(application, oldStatus, newStatus) {
    const html = this.getApplicationStatusUpdateTemplate(application, oldStatus, newStatus);
    return await this.sendEmail(
      application.applicantInfo.email,
      `Başvuru Durumu Güncellendi - ${application.applicationNumber}`,
      html
    );
  }

  async sendJuriEvaluationCompleteEmail(application) {
    const html = this.getJuriEvaluationCompleteTemplate(application);
    return await this.sendEmail(
      application.applicantInfo.email,
      `Başvurunuz Değerlendirildi - ${application.applicationNumber}`,
      html
    );
  }

  async sendContactFormNotification(contact) {
    const html = this.getContactFormTemplate(contact);
    const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : ['admin@emlak.com'];
    return await this.sendEmail(
      adminEmails,
      'Yeni İletişim Formu - Emlak Konut',
      html
    );
  }

  // ==================== TOPLANTI SİSTEMİ EMAIL TEMPLATES ====================

  getMeetingCreatedMentorTemplate(meeting, mentor, participant) {
    const meetingDate = this.formatDateTR(meeting.startAt);
    const meetingTime = `${this.formatTimeTR(meeting.startAt)} - ${this.formatTimeTR(meeting.endAt)}`;

    return `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Toplantı Oluşturuldu</title>
        ${this.getBaseStyle()}
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="email-header">
              <h1>Emlak Konut</h1>
              <p>Yeni Toplantı Oluşturuldu</p>
          </div>

            <div class="email-body">
              <h2>Sayın ${mentor.name},</h2>

              <p>Yeni bir toplantı talebi oluşturuldu. Aşağıda toplantı detaylarını bulabilirsiniz.</p>

              <div class="info-card">
              <div class="info-row">
                  <span class="info-label">Katılımcı</span>
                  <span class="info-value">${participant.name}</span>
              </div>
              <div class="info-row">
                  <span class="info-label">Email</span>
                  <span class="info-value">${participant.email}</span>
              </div>
              <div class="info-row">
                  <span class="info-label">Tarih</span>
                  <span class="info-value">${meetingDate}</span>
              </div>
                <div class="info-row">
                  <span class="info-label">Saat</span>
                  <span class="info-value">${meetingTime}</span>
                </div>
                ${meeting.description ? `
                <div class="info-row">
                  <span class="info-label">Açıklama</span>
                  <span class="info-value">${meeting.description}</span>
                </div>
                ` : ''}
            </div>

              <div class="alert-success">
                <strong>Toplantı Onaylandı</strong>
                <p style="margin: 5px 0 0 0;">Toplantınız takvime eklendi. Size hatırlatma bildirimleri göndereceğiz.</p>
            </div>

              <div class="button-center">
                <a href="${this.getMeetingsPageUrl()}" class="button">Toplantılarıma Git</a>
          </div>

              <p>Toplantı zamanı geldiğinde web sitesindeki "Toplantılarım" sayfasından toplantıya katılabilirsiniz.</p>

              <div class="divider"></div>

              <p>Saygılarımızla,<br><strong>Emlak Konut</strong></p>
            </div>

            <div class="email-footer">
              <p>Bu email Emlak Konut sistemi tarafından otomatik olarak gönderilmiştir.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
    `;
  }

  getMeetingCreatedParticipantTemplate(meeting, mentor, participant) {
    const meetingDate = this.formatDateTR(meeting.startAt);
    const meetingTime = `${this.formatTimeTR(meeting.startAt)} - ${this.formatTimeTR(meeting.endAt)}`;

    return `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Toplantı Oluşturuldu</title>
        ${this.getBaseStyle()}
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="email-header">
              <h1>Emlak Konut</h1>
              <p>Toplantınız Oluşturuldu</p>
          </div>

            <div class="email-body">
              <h2>Sayın ${participant.name},</h2>

              <p><strong>${mentor.name}</strong> ile toplantınız başarıyla oluşturuldu.</p>

              <div class="info-card">
                <div class="info-row">
                  <span class="info-label">Mentor</span>
                  <span class="info-value">${mentor.name}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Tarih</span>
                  <span class="info-value">${meetingDate}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Saat</span>
                  <span class="info-value">${meetingTime}</span>
                </div>
            </div>

              <div class="alert-success">
                <strong>Başarılı</strong>
                <p style="margin: 5px 0 0 0;">Toplantınız onaylandı. Size 1 gün ve 1 saat öncesinden hatırlatma göndereceğiz.</p>
            </div>

              <div class="alert-info">
                <strong>Toplantı Öncesi Hazırlık</strong>
                <p style="margin: 10px 0 0 0;">
                  • Görüşmek istediğiniz konuları not alın<br>
                  • Sorularınızı hazırlayın<br>
                  • İnternet bağlantınızı kontrol edin<br>
                  • Toplantıya 5 dakika önce giriş yapın
                </p>
              </div>

              <div class="button-center">
                <a href="${this.getMeetingsPageUrl()}" class="button">Toplantılarıma Git</a>
          </div>

              <p>Toplantı zamanı geldiğinde web sitesindeki <strong>Toplantılarım</strong> sayfasından toplantıya katılabilirsiniz.</p>

              <div class="divider"></div>

              <p>Saygılarımızla,<br><strong>Emlak Konut</strong></p>
            </div>

            <div class="email-footer">
              <p>Bu email Emlak Konut sistemi tarafından otomatik olarak gönderilmiştir.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
    `;
  }

  getMeetingCancelledTemplate(meeting, mentor, participant, cancelledBy, reason) {
    const meetingDate = this.formatDateTimeTR(meeting.startAt);

    return `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Toplantı İptal Edildi</title>
        ${this.getBaseStyle()}
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="email-header">
              <h1>Emlak Konut</h1>
              <p>Toplantı İptal Edildi</p>
          </div>

            <div class="email-body">
              <h2>Toplantı İptal Bilgisi</h2>

              <div class="alert-danger">
                Toplantınız iptal edildi.
              </div>

              <div class="info-card">
              <div class="info-row">
                  <span class="info-label">Mentor</span>
                  <span class="info-value">${mentor.name}</span>
              </div>
              <div class="info-row">
                  <span class="info-label">Katılımcı</span>
                  <span class="info-value">${participant.name}</span>
              </div>
              <div class="info-row">
                  <span class="info-label">İptal Edilen Tarih</span>
                  <span class="info-value">${meetingDate}</span>
              </div>
              <div class="info-row">
                  <span class="info-label">İptal Eden</span>
                  <span class="info-value">${cancelledBy}</span>
              </div>
                ${reason ? `
              <div class="info-row">
                  <span class="info-label">İptal Nedeni</span>
                  <span class="info-value">${reason}</span>
              </div>
                ` : ''}
              </div>

              <p>İsterseniz yeni bir randevu oluşturabilirsiniz.</p>

              <div class="button-center">
                <a href="${this.getMeetingsPageUrl()}" class="button">Toplantılarıma Git</a>
            </div>

              <div class="divider"></div>

              <p>Saygılarımızla,<br><strong>Emlak Konut</strong></p>
          </div>

            <div class="email-footer">
              <p>Bu email Emlak Konut sistemi tarafından otomatik olarak gönderilmiştir.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getMeetingNoteAddedTemplate(meeting, mentor, participant, note) {
    const meetingDate = this.formatDateTR(meeting.startAt);

    return `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Toplantı Notu Eklendi</title>
        ${this.getBaseStyle()}
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="email-header">
              <h1>Emlak Konut</h1>
              <p>Toplantı Notu Eklendi</p>
          </div>

            <div class="email-body">
              <h2>Toplantı Notu Paylaşıldı</h2>

              <p>Toplantınıza yeni bir not eklendi.</p>

              <div class="info-card">
              <div class="info-row">
                  <span class="info-label">Tarih</span>
                  <span class="info-value">${meetingDate}</span>
              </div>
              <div class="info-row">
                  <span class="info-label">Mentor</span>
                  <span class="info-value">${mentor.name}</span>
              </div>
                <div class="info-row">
                  <span class="info-label">Katılımcı</span>
                  <span class="info-value">${participant.name}</span>
                </div>
            </div>

              <div class="alert-info">
                <strong>Not İçeriği</strong>
                <p style="margin: 10px 0 0 0; white-space: pre-wrap;">${note.content || note}</p>
            </div>

              <div class="button-center">
                <a href="${process.env.FRONTEND_URL || 'https://ideathon.anahtarfikirler.com'}/meetings/${meeting._id}" class="button">Toplantı Detayını Görüntüle</a>
            </div>

              <div class="divider"></div>

              <p>Saygılarımızla,<br><strong>Emlak Konut</strong></p>
          </div>

            <div class="email-footer">
              <p>Bu email Emlak Konut sistemi tarafından otomatik olarak gönderilmiştir.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getAvailabilityUpdatedTemplate(mentor, action) {
    const actionText = action === 'added' ? 'yeni müsait zamanlar ekledi' : 'müsait zamanlarını güncelledi';

    return `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mentor Müsaitlik Güncellendi</title>
        ${this.getBaseStyle()}
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="email-header">
              <h1>Emlak Konut</h1>
              <p>Mentor Müsaitlik Güncellendi</p>
          </div>

            <div class="email-body">
              <h2>Müsaitlik Değişikliği</h2>

              <p><strong>${mentor.name}</strong> ${actionText}.</p>

              <div class="info-card">
              <div class="info-row">
                  <span class="info-label">Mentor</span>
                  <span class="info-value">${mentor.name}</span>
              </div>
                ${mentor.title ? `
              <div class="info-row">
                  <span class="info-label">Ünvan</span>
                  <span class="info-value">${mentor.title}</span>
              </div>
                ` : ''}
            </div>

              <div class="alert-success">
                <strong>Yeni Randevu Fırsatı</strong>
                <p style="margin: 5px 0 0 0;">Şimdi bu mentor ile yeni bir toplantı planlayabilirsiniz.</p>
              </div>

              <div class="button-center">
                <a href="${process.env.FRONTEND_URL || 'https://ideathon.anahtarfikirler.com'}/mentors/${mentor._id || mentor.userId}" class="button">Randevu Al</a>
            </div>

              <div class="divider"></div>

              <p>Saygılarımızla,<br><strong>Emlak Konut</strong></p>
          </div>

            <div class="email-footer">
              <p>Bu email Emlak Konut sistemi tarafından otomatik olarak gönderilmiştir.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getNewMessageTemplate(sender, receiver, conversation, message) {
    const messagePreview = message.length > 150 ? message.substring(0, 150) + '...' : message;

    return `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Yeni Mesaj</title>
        ${this.getBaseStyle()}
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="email-header">
              <h1>Emlak Konut</h1>
              <p>Yeni Mesajınız Var</p>
          </div>

            <div class="email-body">
              <h2>Sayın ${receiver.name},</h2>

              <p><strong>${sender.name}</strong> size yeni bir mesaj gönderdi.</p>

              <div class="info-card">
                <div class="info-row">
                  <span class="info-label">Gönderen</span>
                  <span class="info-value">${sender.name}</span>
            </div>
                <div class="info-row">
                  <span class="info-label">Tarih</span>
                  <span class="info-value">${this.formatDateTimeTR(new Date())}</span>
                  </div>
            </div>

              <div class="alert-info">
                <strong>Mesaj Önizleme</strong>
                <p style="margin: 10px 0 0 0; white-space: pre-wrap;">${messagePreview}</p>
            </div>

              <div class="button-center">
                <a href="${process.env.FRONTEND_URL || 'https://ideathon.anahtarfikirler.com'}/messages/${conversation._id || 'inbox'}" class="button">Mesajı Görüntüle</a>
            </div>

              <p>Mesajları okumak ve yanıt vermek için sisteme giriş yapın.</p>

              <div class="divider"></div>

              <p>Saygılarımızla,<br><strong>Emlak Konut</strong></p>
          </div>

            <div class="email-footer">
              <p>Bu email Emlak Konut sistemi tarafından otomatik olarak gönderilmiştir.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getMeetingReminderTemplate(meeting, mentor, participant, timeRemaining) {
    const meetingDate = this.formatDateTR(meeting.startAt);
    const meetingTime = this.formatTimeTR(meeting.startAt);

    return `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Toplantı Hatırlatma</title>
        ${this.getBaseStyle()}
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="email-header">
              <h1>Emlak Konut</h1>
              <p>Toplantı Hatırlatması</p>
          </div>

            <div class="email-body">
              <h2>Toplantınız Yaklaşıyor</h2>

              <div class="alert-warning">
                <strong>Dikkat</strong>
                <p style="margin: 5px 0 0 0;"><strong>${timeRemaining}</strong> sonra toplantınız başlayacak. Lütfen hazır olun.</p>
              </div>

              <div class="info-card">
                <div class="info-row">
                  <span class="info-label">Mentor</span>
                  <span class="info-value">${mentor.name}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Katılımcı</span>
                  <span class="info-value">${participant.name}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Tarih</span>
                  <span class="info-value">${meetingDate}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Saat</span>
                  <span class="info-value">${meetingTime}</span>
              </div>
            </div>

              <div class="alert-info">
                <strong>Toplantı Öncesi Kontrol Listesi</strong>
                <p style="margin: 10px 0 0 0;">
                  • İnternet bağlantınızı kontrol ettiniz mi?<br>
                  • Kamera ve mikrofonunuz çalışıyor mu?<br>
                  • Sessiz bir ortamda mısınız?<br>
                  • Not almaya hazır mısınız?
                </p>
            </div>

              <div class="button-center">
                <a href="${this.getMeetingsPageUrl()}" class="button">Toplantılarıma Git</a>
            </div>

              <p>Toplantıya web sitesindeki <strong>Toplantılarım</strong> sayfasından katılabilirsiniz. 5 dakika önce hazır olmanızı öneririz.</p>

              <div class="divider"></div>

              <p>Saygılarımızla,<br><strong>Emlak Konut</strong></p>
          </div>

            <div class="email-footer">
              <p>Bu email Emlak Konut sistemi tarafından otomatik olarak gönderilmiştir.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // ==================== LEGACY EMAIL TEMPLATES ====================

  getPasswordResetTemplate(userName, resetCode) {
    return `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Şifre Sıfırlama</title>
        ${this.getBaseStyle()}
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="email-header">
              <h1>Emlak Konut</h1>
              <p>Şifre Sıfırlama İsteği</p>
            </div>

            <div class="email-body">
              <h2>Sayın ${userName},</h2>
              
              <p>Şifre sıfırlama isteğinde bulundunuz. Hesabınızın güvenliği için aşağıdaki doğrulama kodunu kullanarak yeni şifrenizi belirleyebilirsiniz.</p>

              <div class="info-card" style="text-align: center;">
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #555;">Şifre Sıfırlama Kodunuz:</p>
                <div style="font-family: monospace; font-size: 32px; font-weight: 700; color: #005DAD; letter-spacing: 8px; background-color: #ffffff; padding: 20px; border: 2px dashed #005DAD; border-radius: 4px; display: inline-block;">
                  ${resetCode}
                </div>
          </div>

              <div class="alert-warning">
                <strong>Önemli</strong>
                <p style="margin: 5px 0 0 0;">Bu kod 15 dakika içinde geçersiz olacaktır. Eğer bu isteği siz yapmadıysanız, bu email'i görmezden gelebilirsiniz.</p>
              </div>

              <p>Kodu kullanarak şifrenizi sıfırlamak için sistemdeki şifre sıfırlama bölümüne gidin ve yukarıdaki kodu girin.</p>

              <div class="divider"></div>

              <p>Saygılarımızla,<br><strong>Emlak Konut</strong></p>
                </div>
                
            <div class="email-footer">
              <p>Bu email Emlak Konut sistemi tarafından otomatik olarak gönderilmiştir.</p>
                </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getContactFormTemplate(contact) {
    return `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Yeni İletişim Formu</title>
        ${this.getBaseStyle()}
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="email-header">
              <h1>Emlak Konut</h1>
              <p>Yeni İletişim Formu</p>
                </div>
                
            <div class="email-body">
              <h2>Yeni İletişim Formu Alındı</h2>
              
              <p>Aşağıdaki kişi iletişim formu aracılığıyla mesaj gönderdi. Lütfen en kısa sürede yanıt verin.</p>

              <div class="info-card">
                <div class="info-row">
                  <span class="info-label">Ad Soyad</span>
                  <span class="info-value">${contact.firstName} ${contact.lastName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Email</span>
                  <span class="info-value">${contact.email}</span>
              </div>
                <div class="info-row">
                  <span class="info-label">Telefon</span>
                  <span class="info-value">${contact.phone}</span>
            </div>
                <div class="info-row">
                  <span class="info-label">Gönderim Tarihi</span>
                  <span class="info-value">${new Date(contact.createdAt).toLocaleString('tr-TR')}</span>
            </div>
            </div>

              <div class="alert-info">
                <strong>Mesaj</strong>
                <p style="margin: 10px 0 0 0; white-space: pre-wrap;">${contact.message}</p>
            </div>

              <p>Bu mesajı yanıtlamak için: <a href="mailto:${contact.email}" style="color: #005DAD;">${contact.email}</a></p>

              <div class="divider"></div>

              <p>Bu bildirim otomatik olarak gönderilmiştir.</p>
          </div>

            <div class="email-footer">
              <p>Bu email Emlak Konut sistemi tarafından otomatik olarak gönderilmiştir.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getNewApplicationAdminTemplate(application) {
    const categories = {
      'residential': 'Konut',
      'commercial': 'Ticari',
      'mixed-use': 'Karma Kullanım',
      'renovation': 'Restorasyon',
      'other': 'Diğer'
    };

    return `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Yeni Başvuru</title>
        ${this.getBaseStyle()}
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="email-header">
              <h1>Emlak Konut</h1>
              <p>Yeni Başvuru Bildirimi</p>
          </div>

            <div class="email-body">
              <h2>Yeni Başvuru Alındı</h2>

              <p>Sisteme yeni bir başvuru kaydedildi.</p>

              <div class="info-card">
                <div class="info-row">
                  <span class="info-label">Başvuru No</span>
                  <span class="info-value" style="font-weight: 700; color: #005DAD;">${application.applicationNumber}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Başvuran</span>
                  <span class="info-value">${application.applicantInfo.firstName} ${application.applicantInfo.lastName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Email</span>
                  <span class="info-value">${application.applicantInfo.email}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Telefon</span>
                  <span class="info-value">${application.applicantInfo.phone}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Tarih</span>
                  <span class="info-value">${new Date(application.submittedAt).toLocaleString('tr-TR')}</span>
                </div>
                </div>
                
              <div class="divider"></div>

              <h2 style="font-size: 18px; color: #005DAD;">Proje Bilgileri</h2>

              <div class="info-card">
                <div class="info-row">
                  <span class="info-label">Proje Adı</span>
                  <span class="info-value">${application.projectInfo.projectName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Kategori</span>
                  <span class="info-value">${categories[application.projectInfo.category] || application.projectInfo.category}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Konum</span>
                  <span class="info-value">
                    ${application.projectInfo.location?.city || 'Belirtilmemiş'}
                    ${application.projectInfo.location?.district ? ', ' + application.projectInfo.location.district : ''}
                  </span>
              </div>
            </div>

              <div class="alert-info">
                <strong>Proje Açıklaması</strong>
                <p style="margin: 10px 0 0 0;">${application.projectInfo.description}</p>
              </div>

              <div class="button-center">
                <a href="${process.env.ADMIN_PANEL_URL}/applications/${application._id}" class="button">Başvuruyu İncele</a>
            </div>

              <div class="divider"></div>

              <p>Bu başvuruyu değerlendirmek için admin paneline giriş yapabilirsiniz.</p>
          </div>

            <div class="email-footer">
              <p>Bu email Emlak Konut sistemi tarafından otomatik olarak gönderilmiştir.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getApplicationConfirmationTemplate(application) {
    const categories = {
      'residential': 'Konut',
      'commercial': 'Ticari',
      'mixed-use': 'Karma Kullanım',
      'renovation': 'Restorasyon',
      'other': 'Diğer'
    };

    return `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Başvuru Alındı</title>
        ${this.getBaseStyle()}
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="email-header">
              <h1>Emlak Konut</h1>
              <p>Başvurunuz Alındı</p>
          </div>

            <div class="email-body">
              <h2>Sayın ${application.applicantInfo.firstName},</h2>

              <p>Başvurunuz başarıyla alınmıştır. Başvurunuzu değerlendirmek için uzman ekibimiz en kısa sürede incelemeye başlayacaktır.</p>

              <div class="alert-success">
                <strong>Başvurunuz Başarıyla Kaydedildi</strong>
                <p style="margin: 5px 0 0 0;">Başvuru numaranızı not alınız: <strong>${application.applicationNumber}</strong></p>
                </div>
                
              <div class="info-card">
                <div class="info-row">
                  <span class="info-label">Proje Adı</span>
                  <span class="info-value">${application.projectInfo.projectName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Kategori</span>
                  <span class="info-value">${categories[application.projectInfo.category] || application.projectInfo.category}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Tarih</span>
                  <span class="info-value">${new Date(application.submittedAt).toLocaleString('tr-TR')}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Durum</span>
                  <span class="info-value">İncelenmeyi Bekliyor</span>
              </div>
            </div>

              <div class="button-center">
                <a href="${process.env.FRONTEND_URL}/application-status?number=${application.applicationNumber}" class="button">Başvuru Durumunu Takip Et</a>
            </div>

              <div class="alert-info">
                <strong>İletişim Bilgileri</strong>
                <p style="margin: 10px 0 0 0;">
                  Başvurunuz hakkında herhangi bir sorunuz olursa, bizimle iletişime geçebilirsiniz.<br>
                  <strong>Email:</strong> info@emlak.com<br>
                  <strong>Telefon:</strong> +90 (216) 555 00 00
                </p>
            </div>

              <p>Değerlendirme süreci genellikle 3-5 iş günü sürer. Başvurunuzun sonucu email ile bildirilecektir.</p>

              <div class="divider"></div>

              <p>İlginiz için teşekkür ederiz.<br><strong>Emlak Konut</strong></p>
          </div>

            <div class="email-footer">
              <p>Bu email Emlak Konut sistemi tarafından otomatik olarak gönderilmiştir.</p>
              <p>Başvuru Numaranız: <strong>${application.applicationNumber}</strong></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getApplicationStatusUpdateTemplate(application, oldStatus, newStatus) {
    const statusMap = {
      'pending': { text: 'Bekliyor', color: '#ff9800' },
      'under_review': { text: 'İnceleniyor', color: '#2196f3' },
      'approved': { text: 'Onaylandı', color: '#4caf50' },
      'rejected': { text: 'Reddedildi', color: '#f44336' },
      'withdrawn': { text: 'İptal Edildi', color: '#9e9e9e' }
    };

    const newStatusInfo = statusMap[newStatus] || statusMap.pending;

    return `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Başvuru Durumu Güncellendi</title>
        ${this.getBaseStyle()}
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="email-header">
              <h1>Emlak Konut</h1>
              <p>Başvuru Durumu Güncellendi</p>
          </div>

            <div class="email-body">
              <h2>Sayın ${application.applicantInfo.firstName},</h2>

              <p>Başvurunuzun durumu güncellenmiştir. Aşağıdaki bilgileri kontrol edebilirsiniz:</p>

              <div class="info-card" style="border-left-color: ${newStatusInfo.color};">
                <div style="text-align: center; margin-bottom: 15px;">
                  <span style="display: inline-block; padding: 8px 20px; background-color: ${newStatusInfo.color}; color: white; border-radius: 2px; font-weight: 600; font-size: 16px;">
                    ${newStatusInfo.text}
                  </span>
                </div>
                <div class="info-row">
                  <span class="info-label">Başvuru No</span>
                  <span class="info-value">${application.applicationNumber}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Proje Adı</span>
                  <span class="info-value">${application.projectInfo.projectName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Güncelleme Tarihi</span>
                  <span class="info-value">${new Date().toLocaleString('tr-TR')}</span>
                </div>
                ${application.finalEvaluation?.averageScore ? `
                <div class="info-row">
                  <span class="info-label">Ortalama Puan</span>
                  <span class="info-value">${application.finalEvaluation.averageScore}/100</span>
                </div>
                ` : ''}
            </div>

              ${newStatus === 'approved' ? `
                <div class="alert-success">
                  <strong>Tebrikler! Başvurunuz Onaylandı</strong>
                  <p style="margin: 5px 0 0 0;">Sırada ne yapmanız gerektiği hakkında kısa süre içinde sizinle iletişime geçeceğiz.</p>
            </div>
              ` : newStatus === 'rejected' ? `
                <div class="alert-danger">
                  <strong>Başvurunuz Reddedildi</strong>
                  <p style="margin: 5px 0 0 0;">Detaylı bilgi için bizimle iletişime geçebilirsiniz.</p>
                </div>
              ` : newStatus === 'under_review' ? `
                <div class="alert-info">
                  <strong>Başvurunuz İnceleniyor</strong>
                  <p style="margin: 5px 0 0 0;">Uzman ekibimiz başvurunuzu detaylı olarak değerlendiriyor. Sonuç en kısa sürede bildirilecektir.</p>
                </div>
              ` : ''}

              <div class="button-center">
                <a href="${process.env.FRONTEND_URL}/application-status?number=${application.applicationNumber}" class="button">Detaylı Bilgi İçin Tıklayın</a>
            </div>

              <p>Herhangi bir sorunuz olursa, çekinmeden bizimle iletişime geçebilirsiniz.</p>

              <div class="divider"></div>

              <p>Saygılarımızla,<br><strong>Emlak Konut</strong></p>
          </div>

            <div class="email-footer">
              <p>Bu email Emlak Konut sistemi tarafından otomatik olarak gönderilmiştir.</p>
              <p>Başvuru Numaranız: <strong>${application.applicationNumber}</strong></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getJuriEvaluationCompleteTemplate(application) {
    return `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Başvuru Değerlendirildi</title>
        ${this.getBaseStyle()}
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="email-header">
              <h1>Emlak Konut</h1>
              <p>Başvurunuz Değerlendirildi</p>
          </div>

            <div class="email-body">
              <h2>Sayın ${application.applicantInfo.firstName},</h2>

              <p>Başvurunuz juri üyelerimiz tarafından değerlendirilmiştir. Aşağıda değerlendirme sonuçlarını görebilirsiniz:</p>

              <div class="info-card">
                <div style="text-align: center; margin-bottom: 20px;">
                  <div style="font-size: 48px; font-weight: 700; color: #005DAD; margin-bottom: 10px;">
                    ${application.finalEvaluation?.averageScore || 0}/100
            </div>
                  <div style="font-size: 14px; color: #777; text-transform: uppercase; letter-spacing: 1px;">
                    Ortalama Puan
            </div>
                </div>
                <div class="info-row">
                  <span class="info-label">Değerlendirme Sayısı</span>
                  <span class="info-value">${application.finalEvaluation?.totalEvaluations || 0}</span>
                </div>
            </div>

              ${application.evaluations && application.evaluations.length > 0 ? `
                <h2 style="font-size: 18px; color: #005DAD; margin-top: 30px;">Değerlendirme Detayları</h2>
                ${application.evaluations.map(evaluation => `
                  <div class="info-card" style="margin: 15px 0;">
                    <div class="info-row">
                      <span class="info-label">Juri</span>
                      <span class="info-value">${evaluation.juriName}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Puan</span>
                      <span class="info-value" style="font-weight: 700; color: #005DAD;">${evaluation.score}/100</span>
                    </div>
                    ${evaluation.comment ? `
                    <div class="info-row">
                      <span class="info-label">Yorum</span>
                      <span class="info-value">${evaluation.comment}</span>
            </div>
                    ` : ''}
                    <div class="info-row">
                      <span class="info-label">Tarih</span>
                      <span class="info-value">${new Date(evaluation.evaluationDate).toLocaleString('tr-TR')}</span>
                    </div>
                  </div>
                `).join('')}
            ` : ''}

              <div class="alert-info">
                <strong>Sonraki Adımlar</strong>
                <p style="margin: 5px 0 0 0;">Değerlendirme sonuçlarına göre başvurunuzun durumu kısa süre içinde güncellenecektir. Final karar size email ile bildirilecektir.</p>
            </div>

              <div class="button-center">
                <a href="${process.env.FRONTEND_URL}/application-status?number=${application.applicationNumber}" class="button">Başvuru Durumunu Kontrol Et</a>
            </div>

              <p>Değerlendirme sürecinde gösterdiğiniz ilgi ve emek için teşekkür ederiz.</p>

              <div class="divider"></div>

              <p>Saygılarımızla,<br><strong>Emlak Konut</strong></p>
          </div>

            <div class="email-footer">
              <p>Bu email Emlak Konut sistemi tarafından otomatik olarak gönderilmiştir.</p>
              <p>Başvuru Numaranız: <strong>${application.applicationNumber}</strong></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();
