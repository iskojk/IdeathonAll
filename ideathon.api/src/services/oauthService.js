const axios = require('axios');
const { google } = require('googleapis');

/**
 * OAuth Service
 * Google Meet, Microsoft Teams, Zoom entegrasyonları için OAuth işlemleri
 */

class OAuthService {
  constructor() {
    // Google OAuth Client
    this.googleClient = null;
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      this.googleClient = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI || `${process.env.BACKEND_URL}/api/auth/google/callback`
      );
    }
  }

  // ==================== GOOGLE ====================

  /**
   * Google OAuth URL oluştur
   */
  getGoogleAuthUrl(state) {
    if (!this.googleClient) {
      throw new Error('Google OAuth yapılandırılmamış');
    }

    const scopes = [
      'https://www.googleapis.com/auth/calendar.events', // Calendar events
      'https://www.googleapis.com/auth/userinfo.email', // Email
      'https://www.googleapis.com/auth/userinfo.profile' // Profile
    ];

    return this.googleClient.generateAuthUrl({
      access_type: 'offline', // Refresh token almak için
      prompt: 'consent', // Her zaman consent screen göster
      scope: scopes,
      state: state // userId'yi state'te taşıyacağız
    });
  }

  /**
   * Google code'u token'a çevir
   */
  async exchangeGoogleCode(code) {
    if (!this.googleClient) {
      throw new Error('Google OAuth yapılandırılmamış');
    }

    const { tokens } = await this.googleClient.getToken(code);
    
    // Email bilgisini al
    this.googleClient.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: this.googleClient });
    const userInfo = await oauth2.userinfo.get();

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600,
      scope: tokens.scope,
      email: userInfo.data.email,
      providerAccountId: userInfo.data.id
    };
  }

  /**
   * Google token'ı refresh et
   * 
   * ⚠️ NOT: Google her zaman yeni refresh token döndürmez
   * - İlk kez "consent" ile alınan refresh token kalıcıdır
   * - Sonraki refresh'lerde genelde yeni refresh token gelmez
   * - Eğer kullanıcı izni geri aldıysa "invalid_grant" hatası döner
   */
  async refreshGoogleToken(refreshToken) {
    if (!this.googleClient) {
      throw new Error('Google OAuth yapılandırılmamış');
    }

    if (!refreshToken) {
      throw new Error('Google refresh token bulunamadı. Kullanıcı tekrar bağlanmalı.');
    }

    try {
      this.googleClient.setCredentials({
        refresh_token: refreshToken
      });

      const { credentials } = await this.googleClient.refreshAccessToken();

      return {
        accessToken: credentials.access_token,
        refreshToken: credentials.refresh_token || refreshToken, // ✅ Yeni gelmezse eski kullan
        expiresIn: credentials.expiry_date ? Math.floor((credentials.expiry_date - Date.now()) / 1000) : 3600
      };
    } catch (error) {
      // ✅ invalid_grant: Kullanıcı izni geri aldı
      if (error.message && error.message.includes('invalid_grant')) {
        const err = new Error('Google refresh token geçersiz. Kullanıcı izni geri almış olabilir.');
        err.code = 'INVALID_GRANT';
        throw err;
      }
      throw error;
    }
  }

  /**
   * Google Meet linki ile Calendar event oluştur
   */
  async createGoogleMeetEvent(accessToken, eventData) {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // ✅ KRİTİK: requestId UNIQUE olmalı (meeting ID bazlı)
    const uniqueRequestId = eventData.meetingId 
      ? `emlak-meet-${eventData.meetingId}` 
      : `emlak-meet-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const event = {
      summary: eventData.title,
      description: eventData.description,
      start: {
        dateTime: eventData.startTime,
        timeZone: 'Europe/Istanbul'
      },
      end: {
        dateTime: eventData.endTime,
        timeZone: 'Europe/Istanbul'
      },
      conferenceData: {
        createRequest: {
          requestId: uniqueRequestId, // ✅ Unique requestId
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      },
      attendees: (eventData.attendees || []).map(a => typeof a === 'string' ? { email: a } : a)
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1, // KRİTİK: Meet linki için zorunlu
      resource: event,
      sendUpdates: 'none' // ✅ Sistem zaten email gönderiyor, duplicate önlemek için 'none'
    });

    // hangoutLink kontrolü
    if (!response.data.hangoutLink) {
      console.error('⚠️ Google Meet linki oluşturulamadı:', response.data);
      throw new Error('Google Meet linki oluşturulamadı. Lütfen Google Calendar ayarlarınızı kontrol edin.');
    }

    return {
      eventId: response.data.id,
      meetingUrl: response.data.hangoutLink,
      htmlLink: response.data.htmlLink
    };
  }

  // ==================== MICROSOFT ====================

  /**
   * Microsoft OAuth URL oluştur
   */
  getMicrosoftAuthUrl(state) {
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const redirectUri = process.env.MICROSOFT_REDIRECT_URI || `${process.env.BACKEND_URL}/api/auth/microsoft/callback`;
    const scopes = 'Calendars.ReadWrite OnlineMeetings.ReadWrite User.Read offline_access';

    if (!clientId) {
      throw new Error('Microsoft OAuth yapılandırılmamış');
    }

    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
      `client_id=${clientId}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_mode=query` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&state=${state}` +
      `&prompt=consent`;

    return authUrl;
  }

  /**
   * Microsoft code'u token'a çevir
   */
  async exchangeMicrosoftCode(code) {
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
    const redirectUri = process.env.MICROSOFT_REDIRECT_URI || `${process.env.BACKEND_URL}/api/auth/microsoft/callback`;

    const tokenResponse = await axios.post(
      'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    const tokens = tokenResponse.data;

    // User bilgisini al
    const userResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
      scope: tokens.scope,
      email: userResponse.data.userPrincipalName || userResponse.data.mail,
      providerAccountId: userResponse.data.id
    };
  }

  /**
   * Microsoft token'ı refresh et
   * 
   * ⚠️ NOT: Microsoft refresh için "offline_access" scope gereklidir
   * - offline_access olmadan refresh token alınamaz
   * - Refresh başarılı olursa yeni refresh token döner
   * - invalid_grant: Kullanıcı izni geri aldı veya token expired
   */
  async refreshMicrosoftToken(refreshToken) {
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;

    if (!refreshToken) {
      throw new Error('Microsoft refresh token bulunamadı. Kullanıcı tekrar bağlanmalı.');
    }

    try {
      const tokenResponse = await axios.post(
        'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      );

      const tokens = tokenResponse.data;

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || refreshToken, // ✅ Genelde yeni döner
        expiresIn: tokens.expires_in
      };
    } catch (error) {
      // ✅ invalid_grant: Kullanıcı izni geri aldı
      if (error.response?.data?.error === 'invalid_grant') {
        const err = new Error('Microsoft refresh token geçersiz. Kullanıcı izni geri almış olabilir.');
        err.code = 'INVALID_GRANT';
        throw err;
      }
      throw error;
    }
  }

  /**
   * Microsoft Teams meeting oluştur
   */
  async createMicrosoftTeamsMeeting(accessToken, eventData) {
    try {
      // Microsoft Graph: dateTime alanı timezone-aware değil, timeZone ile birlikte yorumlanır.
      // UTC'yi Istanbul local time'a çevirmemiz gerekiyor.
      const toIstanbulLocal = (isoString) => {
        const d = new Date(isoString);
        const istanbulStr = d.toLocaleString('sv-SE', { timeZone: 'Europe/Istanbul' });
        return istanbulStr.replace(' ', 'T') + '.000';
      };
      const startDateTime = toIstanbulLocal(eventData.startTime);
      const endDateTime = toIstanbulLocal(eventData.endTime);

      // 1. Calendar event oluştur
      const eventResponse = await axios.post(
        'https://graph.microsoft.com/v1.0/me/events',
        {
          subject: eventData.title,
          body: {
            contentType: 'HTML',
            content: eventData.description
          },
          start: {
            dateTime: startDateTime, // ✅ ISO format (timezone'sız)
            timeZone: 'Europe/Istanbul' // ✅ Timezone ayrı
          },
          end: {
            dateTime: endDateTime, // ✅ ISO format (timezone'sız)
            timeZone: 'Europe/Istanbul' // ✅ Timezone ayrı
          },
          isOnlineMeeting: true,
          onlineMeetingProvider: 'teamsForBusiness',
          attendees: (eventData.attendees || []).map(email => ({
            emailAddress: { address: email },
            type: 'required'
          }))
        },
        {
          headers: { 
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const event = eventResponse.data;

      // KRİTİK: joinUrl kontrolü (tenant/policy'ye bağlı olarak gelmeyebilir)
      if (!event.onlineMeeting || !event.onlineMeeting.joinUrl) {
        console.error('⚠️ Teams joinUrl oluşturulamadı (tenant policy sorunu olabilir):', event);
        throw new Error('Teams meeting linki oluşturulamadı. Bu durum organizasyon politikalarından kaynaklanabilir.');
      }

      return {
        eventId: event.id,
        meetingUrl: event.onlineMeeting.joinUrl,
        htmlLink: event.webLink
      };
    } catch (error) {
      // Policy/tenant hatası detaylı logla
      if (error.response?.data) {
        console.error('❌ Microsoft Teams API hatası:', error.response.data);
      }
      throw error;
    }
  }

  // ==================== ZOOM ====================

  /**
   * Zoom OAuth URL oluştur
   * 
   * ⚠️ NOT: Zoom scope'ları app tipine göre değişir
   * - User-level OAuth: meeting:write, user:read (önerilir)
   * - Account-level OAuth: meeting:write:admin, user:read:admin (admin onayı gerektirir)
   */
  getZoomAuthUrl(state) {
    const clientId = process.env.ZOOM_CLIENT_ID;
    const redirectUri = process.env.ZOOM_REDIRECT_URI || `${process.env.BACKEND_URL}/api/auth/zoom/callback`;

    if (!clientId) {
      throw new Error('Zoom OAuth yapılandırılmamış');
    }

    // ✅ User-level scope'lar (Emlak Konut'un app tipine göre değişebilir)
    // Zoom Marketplace'de açılacak app tipi finalize edilmeli
    const authUrl = `https://zoom.us/oauth/authorize?` +
      `response_type=code` +
      `&client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${state}`;

    return authUrl;
  }

  /**
   * Zoom code'u token'a çevir
   */
  async exchangeZoomCode(code) {
    const clientId = process.env.ZOOM_CLIENT_ID;
    const clientSecret = process.env.ZOOM_CLIENT_SECRET;
    const redirectUri = process.env.ZOOM_REDIRECT_URI || `${process.env.BACKEND_URL}/api/auth/zoom/callback`;

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const tokenResponse = await axios.post(
      'https://zoom.us/oauth/token',
      new URLSearchParams({
        code: code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      }),
      {
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const tokens = tokenResponse.data;

    // User bilgisini al
    const userResponse = await axios.get('https://api.zoom.us/v2/users/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
      scope: tokens.scope,
      email: userResponse.data.email,
      providerAccountId: userResponse.data.id
    };
  }

  /**
   * Zoom token'ı refresh et
   * 
   * ⚠️ NOT: Zoom refresh mekanizması
   * - Zoom her refresh'te yeni refresh token döner
   * - Eski refresh token artık geçersiz olur
   * - invalid_grant: Token expired veya revoked
   */
  async refreshZoomToken(refreshToken) {
    const clientId = process.env.ZOOM_CLIENT_ID;
    const clientSecret = process.env.ZOOM_CLIENT_SECRET;

    if (!refreshToken) {
      throw new Error('Zoom refresh token bulunamadı. Kullanıcı tekrar bağlanmalı.');
    }

    try {
      const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

      const tokenResponse = await axios.post(
        'https://zoom.us/oauth/token',
        new URLSearchParams({
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        }),
        {
          headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const tokens = tokenResponse.data;

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || refreshToken, // ✅ Zoom genelde yeni döner
        expiresIn: tokens.expires_in
      };
    } catch (error) {
      // ✅ invalid_grant: Token geçersiz
      if (error.response?.data?.reason === 'Invalid Token' || 
          error.response?.data?.error === 'invalid_grant') {
        const err = new Error('Zoom refresh token geçersiz. Kullanıcı izni geri almış olabilir.');
        err.code = 'INVALID_GRANT';
        throw err;
      }
      throw error;
    }
  }

  /**
   * Zoom meeting oluştur
   */
  async createZoomMeeting(accessToken, eventData) {
    const meetingResponse = await axios.post(
      'https://api.zoom.us/v2/users/me/meetings',
      {
        topic: eventData.title,
        type: 2, // Scheduled meeting
        start_time: new Date(eventData.startTime).toISOString(),
        duration: Math.ceil((new Date(eventData.endTime) - new Date(eventData.startTime)) / 60000), // dakika cinsinden
        timezone: 'Europe/Istanbul',
        agenda: eventData.description,
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: true,
          waiting_room: false,
          auto_recording: 'none'
        }
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    const meeting = meetingResponse.data;

    return {
      meetingId: meeting.id.toString(),
      meetingUrl: meeting.join_url,
      startUrl: meeting.start_url
    };
  }

  // ==================== GENERIC ====================

  /**
   * Token'ı refresh et (provider'a göre)
   */
  async refreshToken(provider, refreshToken) {
    switch (provider) {
      case 'google':
        return await this.refreshGoogleToken(refreshToken);
      case 'microsoft':
        return await this.refreshMicrosoftToken(refreshToken);
      case 'zoom':
        return await this.refreshZoomToken(refreshToken);
      default:
        throw new Error(`Bilinmeyen provider: ${provider}`);
    }
  }

  /**
   * Meeting oluştur (provider'a göre)
   */
  async createMeeting(provider, accessToken, eventData) {
    switch (provider) {
      case 'google':
        return await this.createGoogleMeetEvent(accessToken, eventData);
      case 'microsoft':
        return await this.createMicrosoftTeamsMeeting(accessToken, eventData);
      case 'zoom':
        return await this.createZoomMeeting(accessToken, eventData);
      default:
        throw new Error(`Bilinmeyen provider: ${provider}`);
    }
  }
}

module.exports = new OAuthService();

