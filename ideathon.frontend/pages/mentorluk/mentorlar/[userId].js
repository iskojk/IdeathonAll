/**
 * Mentor Detay Page
 * Mentor profili ve randevu olusturma
 */

import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import ErrorMessage from '@/components/ErrorMessage';
import { SkeletonMentorDetail } from '@/components/Skeleton';
import { mentorNetAPI, messagingAPI } from '@/lib/api';
import { notify } from '@/components/Notification';
import { getInitials } from '@/lib/auth';

const buildDateRange = () => {
  const start = new Date();
  const end = new Date();
  end.setDate(start.getDate() + 30);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
};

export default function MentorDetay() {
  const router = useRouter();
  const { userId } = router.query;

  const [mentor, setMentor] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [error, setError] = useState('');

  const [dateRange, setDateRange] = useState(buildDateRange());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        weekday: 'long',
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const loadMentorData = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError('');
      const mentorRes = await mentorNetAPI.getMentor(userId);
      if (mentorRes.success) {
        setMentor(mentorRes.data);
        if (mentorRes.message) {
          notify.success(mentorRes.message);
        }
      } else {
        const errorMsg = mentorRes.message || 'Mentor bilgileri yuklenirken hata olustu';
        setError(errorMsg);
        notify.error(errorMsg);
      }
    } catch (err) {
      if (err.status !== 401) {
        const errorMsg = err.message || 'Mentor bilgileri yuklenirken bir hata olustu';
        setError(errorMsg);
        notify.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAvailability = async () => {
    if (!userId) return;

    if (!dateRange.startDate || !dateRange.endDate) {
      notify.warning('Lutfen gecerli tarih araligi secin');
      return;
    }

    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);

    if (end < start) {
      notify.warning('Bitis tarihi baslangic tarihinden once olamaz');
      return;
    }

    try {
      setAvailabilityLoading(true);
      const response = await mentorNetAPI.getAvailability(userId, {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      if (response.success) {
        setAvailability(response.data || []);
        const availableCount = (response.data || []).filter(s => s.isAvailable !== false && s.status !== 'booked').length;
        if (availableCount > 0 && response.message) {
          notify.success(response.message);
        }
      } else {
        notify.error(response.message || 'Musaitlikler yuklenirken hata olustu');
        setAvailability([]);
      }
    } catch (err) {
      if (err.status !== 401) {
        notify.error(err.message || 'Musaitlikler yuklenirken hata olustu');
      }
      setAvailability([]);
    } finally {
      setAvailabilityLoading(false);
    }
  };

  useEffect(() => {
    if (!router.isReady || !userId) return;
    loadMentorData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, userId]);

  useEffect(() => {
    if (!router.isReady || !userId || !mentor) return;
    loadAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, userId, mentor, dateRange.startDate, dateRange.endDate]);

  const handleDateChange = (field, value) => {
    setDateRange((prev) => ({ ...prev, [field]: value }));
  };

  const availableSlots = useMemo(
    () => availability.filter((slot) => slot.isAvailable !== false && slot.status !== 'booked'),
    [availability]
  );

  const openBookingModal = (slot) => {
    setSelectedSlot(slot);
    setBookingNotes('');
    setShowBookingModal(true);
  };

  const closeBookingModal = () => {
    setSelectedSlot(null);
    setBookingNotes('');
    setShowBookingModal(false);
  };

  const handleSendMessage = async () => {
    if (sendingMessage || !userId) return;

    try {
      setSendingMessage(true);
      const response = await messagingAPI.createOrGetConversation(userId);

      if (response.success) {
        // Mesajlar sayfasına yönlendir, query param ile konuşmayı belirt
        router.push(`/mentorluk/mesajlar?conversation=${response.data._id}`);
      } else {
        notify.error(response.message || 'Konuşma başlatılamadı');
      }
    } catch (err) {
      console.error('Mesaj gönderme hatası:', err);
      notify.error(err.message || 'Konuşma başlatılamadı');
    } finally {
      setSendingMessage(false);
    }
  };

  const confirmBooking = async () => {
    if (!selectedSlot) return;
    try {
      setBookingLoading(true);
      const payload = {
        slotId: selectedSlot._id,
        mentorUserId: selectedSlot.mentorUserId || mentor?.userId?._id || userId,
        title: 'Mentorluk Gorusmesi',
        description: bookingNotes.trim() || 'Mentorluk gorusmesi talebi',
      };
      const response = await mentorNetAPI.createMeeting(payload);
      if (response.success) {
        notify.success(response.message || 'Toplanti basariyla olusturuldu');
        closeBookingModal();
        await loadAvailability();
        router.push('/mentorluk/toplantilar');
      } else {
        notify.error(response.message || 'Randevu olusturulurken bir hata olustu');
      }
    } catch (err) {
      if (err.status !== 401) {
        notify.error(err.message || 'Randevu olusturulurken bir hata olustu');
      }
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <PrivateRoute>
        <Head>
          <title>Mentör Detayı - Emlak Konut Ideathon</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <Layout>
          <section className="mentor-detail-section" style={{ marginTop: '140px', paddingTop: '60px', paddingBottom: '60px' }}>
            <div className="container">
              <Link href="/mentorluk/mentorlar" className="btn-back-mentor">
                <i className="bi bi-arrow-left"></i>
                Mentörlere Dön
              </Link>
              <SkeletonMentorDetail />
            </div>
          </section>
        </Layout>
        <style jsx>{`
         
        `}</style>
      </PrivateRoute>
    );
  }

  if (!mentor) {
    return (
      <PrivateRoute>
        <Head>
          <title>Mentör Detayı - Emlak Konut Ideathon</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <Layout>
          <section className="mentor-detail-section" style={{ marginTop: '140px', paddingTop: '60px', paddingBottom: '60px' }}>
            <div className="container">
              <ErrorMessage message={error || 'Mentör bulunamadı'} type="error" />
              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <Link href="/mentorluk/mentorlar" className="btn-back-mentor-center">
                  <i className="bi bi-arrow-left"></i>
                  Mentörlere Dön
                </Link>
              </div>
            </div>
          </section>
        </Layout>
      </PrivateRoute>
    );
  }

  return (
    <PrivateRoute>
      <Head>
        <title>{mentor.userId?.name || 'Mentör'} - Emlak Konut Ideathon</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <Layout>
        <section className="mentor-detail-section" style={{ marginTop: '140px', paddingTop: '60px', paddingBottom: '60px' }}>
          <div className="container">
            <Link href="/mentorluk/mentorlar" className="btn-back-mentor">
              <i className="bi bi-arrow-left"></i>
              Mentörlere Dön
            </Link>

            {error && <ErrorMessage message={error} onClose={() => setError('')} type="error" />}

            <div className="mentor-profile-card">
              <div className="mentor-profile-header">
                {mentor.photoUrl ? (
                  <img src={mentor.photoUrl} alt={mentor.userId?.name || 'Mentör'} className="mentor-avatar-large" />
                ) : (
                  <div className="mentor-avatar-large placeholder">
                    <span>{getInitials(mentor.userId?.name || 'Mentör')}</span>
                  </div>
                  
                )}
                
                <div className="mentor-profile-info">
                  <h1 className="mentor-name">{mentor.userId?.name || 'Mentör'}</h1>
                  <p className="mentor-title">{mentor.title || 'Mentör'}</p>
                  <p className="mentor-email">{mentor.userId?.email}</p>
                </div>
                <div className="mentor-actions">
                  <button
                    onClick={handleSendMessage}
                    disabled={sendingMessage}
                    className="btn-send-message-mentor"
                  >
                    {sendingMessage ? (
                      <>
                        <i className="bi bi-arrow-clockwise spinner"></i>
                        Yükleniyor...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-chat-dots-fill"></i>
                        Mesaj Gönder
                      </>
                    )}
                  </button>
                  
                </div>
              </div>

              <div className="mentor-profile-body">
                <div className="mentor-section">
                  <h3 className="section-title">
                    <i className="bi bi-person-lines-fill"></i>
                    Hakkinda
                  </h3>
                  <p className="mentor-about">{mentor.about || 'Mentör hakkında bilgi bulunmuyor.'}</p>
                  {mentor.linkedin && (
                    <a href={mentor.linkedin} target="_blank" rel="noopener noreferrer" className="btn-linkedin mt-2">
                      <i className="bi bi-linkedin"></i>
                      LinkedIn
                    </a>
                  )}
                </div>

                {mentor.expertiseTags && mentor.expertiseTags.length > 0 && (
                  <div className="mentor-section">
                    <h3 className="section-title">
                      <i className="bi bi-tags-fill"></i>
                      Uzmanlik Alanlari
                    </h3>
                    <div className="mentor-tags">
                      {mentor.expertiseTags.map((tag) => (
                        <span key={tag} className="mentor-tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="availability-section">
              <div className="availability-header">
                <div className="availability-title">
                  <i className="bi bi-calendar-week"></i>
                  <h2>Müsaitlik Takvimi</h2>
                </div>
              </div>

              {availabilityLoading ? (
                <div className="slots-loading">
                  <div className="slot-skeleton"></div>
                  <div className="slot-skeleton"></div>
                  <div className="slot-skeleton"></div>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <i className="bi bi-calendar-x"></i>
                  </div>
                  <h3>Müsait Saat Bulunamadı</h3>
                  <p>Bu tarih araliginda uygun müsaitlik bulunmuyor.</p>
                </div>
              ) : (
                <div className="availability-grid">
                  {availableSlots.map((slot) => (
                    <div key={slot._id} className="slot-card">
                      <div className="slot-date">
                        <i className="bi bi-calendar3"></i>
                        <span>{formatDate(slot.startAt)}</span>
                      </div>
                      <div className="slot-time">
                        <span className="time">{formatTime(slot.startAt)} - {formatTime(slot.endAt)}</span>
                        <span className="duration">{slot.duration} dk</span>
                      </div>
                      <div className="slot-type">
                        <i className="bi bi-camera-video-fill"></i>
                        <span>{slot.meetingType === 'jitsi' ? 'Online (Jitsi)' : slot.meetingType || 'Online'}</span>
                      </div>
                      <button className="btn-book" onClick={() => openBookingModal(slot)}>
                        <i className="bi bi-check-circle"></i>
                        Randevu Al
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </Layout>

      {showBookingModal && selectedSlot && (
        <div className="modal-overlay" onClick={closeBookingModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <button className="modal-close" onClick={closeBookingModal}>
                <i className="bi bi-x-lg"></i>
              </button>
              <div className="modal-icon">
                <i className="bi bi-calendar-plus"></i>
              </div>
              <h3 className="modal-title">Randevu Onayla</h3>
              <div className="modal-info">
                <div className="info-row">
                  <i className="bi bi-person-circle"></i>
                  <span>{mentor.userId?.name}</span>
                </div>
                <div className="info-row">
                  <i className="bi bi-calendar3"></i>
                  <span>{formatDate(selectedSlot.startAt)}</span>
                </div>
                <div className="info-row">
                  <i className="bi bi-clock"></i>
                  <span>{formatTime(selectedSlot.startAt)} - {formatTime(selectedSlot.endAt)}</span>
                </div>
              </div>
              <div className="form-group">
                <label>Not Ekle (Opsiyonel)</label>
                <textarea
                  className="modal-textarea"
                  rows="3"
                  placeholder="Gorusmede konusmak istediginiz konulari yazabilirsiniz..."
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  disabled={bookingLoading}
                />
              </div>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={closeBookingModal} disabled={bookingLoading}>
                  Vazgeç
                </button>
                <button className="btn-confirm" onClick={confirmBooking} disabled={bookingLoading}>
                  {bookingLoading ? (
                    <>
                      <i className="bi bi-arrow-repeat spinning"></i>
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check2-circle"></i>
                      Randevuyu Onayla
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .mentor-profile-card {
          background: white;
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.08);
          border: 1px solid #f3f4f6;
          margin-bottom: 32px;
        }
        .mentor-profile-header {
          display: flex;
          gap: 24px;
          align-items: flex-start;
          flex-wrap: wrap;
          padding-bottom: 24px;
          border-bottom: 1px solid #f3f4f6;
        }
        .mentor-avatar-large {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          object-fit: cover;
          border: 4px solid #e5e7eb;
          background: #f3f4f6;
          flex-shrink: 0;
        }
        .mentor-avatar-large.placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          font-weight: 800;
          color: #1d4ed8;
          background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
        }
        .mentor-profile-info {
          flex: 1;
          min-width: 240px;
        }
        .mentor-name {
          font-size: 28px;
          font-weight: 800;
          color: #111827;
          margin-bottom: 6px;
        }
        .mentor-title {
          font-size: 16px;
          color: #2563eb;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .mentor-email {
          font-size: 14px;
          color: #6b7280;
          margin: 0 0 12px 0;
        }
        .mentor-meta {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }
        .mentor-meta span {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #6b7280;
          font-weight: 600;
        }
        .mentor-meta i {
          color: #2563eb;
        }
        .mentor-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .btn-send-message-mentor {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-send-message-mentor:hover:not(:disabled) {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }
        .btn-send-message-mentor:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn-linkedin {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: #0077b5;
          color: white;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
        }
        .btn-linkedin:hover {
          background: #005885;
          transform: translateY(-2px);
        }

        .mentor-profile-body {
          padding-top: 24px;
        }
        .mentor-section {
          margin-bottom: 24px;
        }
        .mentor-section:last-child {
          margin-bottom: 0;
        }
        .section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 16px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 12px;
        }
        .section-title i {
          color: #2563eb;
        }
        .mentor-about {
          font-size: 15px;
          color: #4b5563;
          line-height: 1.7;
          margin: 0;
        }
        .mentor-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .mentor-tag {
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
          color: #374151;
          padding: 8px 16px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
        }

        .availability-section {
          background: white;
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.08);
          border: 1px solid #f3f4f6;
        }
        .availability-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
          margin-bottom: 28px;
          padding-bottom: 20px;
          border-bottom: 1px solid #f3f4f6;
        }
        .availability-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .availability-title i {
          font-size: 28px;
          color: #2563eb;
        }
        .availability-title h2 {
          font-size: 22px;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }
        .date-filters {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }
        .date-input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .date-input-group label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .date-input-group label i {
          color: #2563eb;
        }
        .date-input-group input {
          padding: 12px 14px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          color: #111827;
          transition: all 0.2s;
          min-width: 160px;
        }
        .date-input-group input:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        }

        .slots-loading {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        }
        .slot-skeleton {
          height: 160px;
          border-radius: 16px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: #f9fafb;
          border-radius: 16px;
          border: 2px dashed #e5e7eb;
        }
        .empty-icon {
          font-size: 56px;
          color: #d1d5db;
          margin-bottom: 16px;
        }
        .empty-state h3 {
          font-size: 18px;
          font-weight: 700;
          color: #374151;
          margin-bottom: 8px;
        }
        .empty-state p {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .availability-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        }
        .slot-card {
          background: #f9fafb;
          border: 2px solid #e5e7eb;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: all 0.2s;
        }
        .slot-card:hover {
          border-color: #2563eb;
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.1);
        }
        .slot-date {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          color: #374151;
          font-weight: 600;
        }
        .slot-date i {
          color: #2563eb;
          font-size: 18px;
        }
        .slot-time {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .slot-time .time {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
        }
        .slot-time .duration {
          background: #dbeafe;
          color: #1d4ed8;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
        }
        .slot-type {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #6b7280;
        }
        .slot-type i {
          color: #10b981;
        }
        .btn-book {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 4px;
        }
        .btn-book:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(37, 99, 235, 0.3);
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
        }
        .modal-container {
          background: white;
          border-radius: 24px;
          max-width: 480px;
          width: 100%;
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.3);
          position: relative;
        }
        .modal-content {
          padding: 32px;
        }
        .modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f4f6;
          border: none;
          border-radius: 50%;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
        }
        .modal-close:hover {
          background: #fee2e2;
          color: #dc2626;
        }
        .modal-icon {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
          color: #1d4ed8;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-size: 32px;
        }
        .modal-title {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          text-align: center;
          margin-bottom: 20px;
        }
        .modal-info {
          background: #f9fafb;
          border-radius: 14px;
          padding: 16px;
          margin-bottom: 20px;
        }
        .info-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 0;
          font-size: 15px;
          color: #374151;
          font-weight: 500;
        }
        .info-row:not(:last-child) {
          border-bottom: 1px solid #e5e7eb;
        }
        .info-row i {
          color: #2563eb;
          font-size: 18px;
        }
        .form-group {
          margin-bottom: 24px;
        }
        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }
        .modal-textarea {
          width: 100%;
          border: 2px solid #e5e7eb;
          border-radius: 14px;
          padding: 14px;
          font-size: 14px;
          resize: none;
          transition: all 0.2s;
        }
        .modal-textarea:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        }
        .modal-actions {
          display: flex;
          gap: 12px;
        }
        .btn-cancel,
        .btn-confirm {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 20px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-cancel {
          background: #f3f4f6;
          color: #6b7280;
        }
        .btn-cancel:hover {
          background: #e5e7eb;
        }
        .btn-confirm {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: white;
        }
        .btn-confirm:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(37, 99, 235, 0.3);
        }
        .btn-confirm:disabled,
        .btn-cancel:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        :global(.spinning) {
          animation: spin 1s linear infinite;
        }
        .spinner {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .mentor-profile-card,
          .availability-section {
            padding: 24px;
            border-radius: 20px;
          }
          .mentor-profile-header {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          .mentor-profile-info {
            text-align: center;
          }
          .mentor-meta {
            justify-content: center;
          }
          .mentor-name {
            font-size: 24px;
          }
          .availability-header {
            flex-direction: column;
            align-items: stretch;
          }
          .date-filters {
            width: 100%;
          }
          .date-input-group {
            flex: 1;
          }
          .date-input-group input {
            width: 100%;
          }
          .modal-content {
            padding: 24px;
          }
          .modal-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </PrivateRoute>
  );
}
