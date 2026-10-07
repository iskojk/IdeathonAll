/**
 * Toplantilarim Page
 * Kullanicinin mentor gorusmeleri
 */

import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import ErrorMessage from '@/components/ErrorMessage';
import { SkeletonMeetingCard } from '@/components/Skeleton';
import { mentorNetAPI } from '@/lib/api';
import { notify } from '@/components/Notification';

const statusLabels = {
  scheduled: { text: 'Planlandi', color: '#2563eb', icon: 'bi-calendar-check' },
  completed: { text: 'Tamamlandi', color: '#16a34a', icon: 'bi-check-circle' },
  cancelled: { text: 'Iptal', color: '#dc2626', icon: 'bi-x-circle' },
  rescheduled: { text: 'Yeniden Planlandi', color: '#f59e0b', icon: 'bi-arrow-repeat' },
};

export default function Toplantilar() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeStatus, setActiveStatus] = useState('scheduled');

  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [selectedRescheduleSlot, setSelectedRescheduleSlot] = useState(null);
  const [rescheduleReason, setRescheduleReason] = useState('');

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackAnonymous, setFeedbackAnonymous] = useState(false);

  // Feedback verilmiş toplantı ID'leri
  const [givenFeedbackMeetingIds, setGivenFeedbackMeetingIds] = useState([]);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      setError('');
      const params = activeStatus ? { status: activeStatus } : {};
      
      // Toplantıları ve verilen feedback'leri paralel çek
      const [meetingsRes, feedbacksRes] = await Promise.allSettled([
        mentorNetAPI.getMeetings(params),
        mentorNetAPI.getMyGivenFeedbacks(),
      ]);

      if (meetingsRes.status === 'fulfilled' && meetingsRes.value.success) {
        setMeetings(meetingsRes.value.data || []);
        if (meetingsRes.value.message) {
          notify.success(meetingsRes.value.message);
        }
      } else {
        const errorMsg = meetingsRes.value?.message || 'Toplantilar yuklenirken hata olustu';
        setError(errorMsg);
        notify.error(errorMsg);
      }

      // Feedback verilmiş toplantı ID'lerini kaydet
      if (feedbacksRes.status === 'fulfilled' && feedbacksRes.value.success) {
        const feedbacks = feedbacksRes.value.data || [];
        const meetingIds = feedbacks.map((fb) => fb.meetingId?._id || fb.meetingId).filter(Boolean);
        setGivenFeedbackMeetingIds(meetingIds);
      }
    } catch (err) {
      if (err.status !== 401) {
        const errorMsg = err.message || 'Toplantilar yuklenirken bir hata olustu';
        setError(errorMsg);
        notify.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStatus]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openCancelModal = (meeting) => {
    setSelectedMeeting(meeting);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setCancelReason('');
    setSelectedMeeting(null);
  };

  const confirmCancel = async () => {
    if (!selectedMeeting) return;
    try {
      setActionLoadingId(selectedMeeting._id);
      const response = await mentorNetAPI.cancelMeeting(selectedMeeting._id, cancelReason.trim());
      if (response.success) {
        notify.success(response.message || 'Toplanti basariyla iptal edildi');
        closeCancelModal();
        await fetchMeetings();
      } else {
        notify.error(response.message || 'Toplanti iptal edilemedi');
      }
    } catch (err) {
      if (err.status !== 401) {
        notify.error(err.message || 'Toplanti iptal edilirken bir hata olustu');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const openRescheduleModal = async (meeting) => {
    setSelectedMeeting(meeting);
    setSelectedRescheduleSlot(null);
    setRescheduleReason('');
    setShowRescheduleModal(true);
    const mentorId = typeof meeting?.mentorUserId === 'string'
      ? meeting.mentorUserId
      : meeting?.mentorUserId?._id;
    if (!mentorId) return;
    try {
      setRescheduleLoading(true);
      const response = await mentorNetAPI.getAvailability(mentorId);
      if (response.success) {
        setRescheduleSlots(response.data || []);
      } else {
        notify.error(response.message || 'Musaitlikler yuklenirken hata olustu');
        setRescheduleSlots([]);
      }
    } catch (err) {
      if (err.status !== 401) {
        notify.error(err.message || 'Musaitlikler yuklenirken bir hata olustu');
      }
      setRescheduleSlots([]);
    } finally {
      setRescheduleLoading(false);
    }
  };

  const closeRescheduleModal = () => {
    setShowRescheduleModal(false);
    setSelectedMeeting(null);
    setSelectedRescheduleSlot(null);
    setRescheduleReason('');
  };

  const confirmReschedule = async () => {
    if (!selectedMeeting || !selectedRescheduleSlot) return;
    try {
      setActionLoadingId(selectedMeeting._id);
      const payload = {
        newSlotId: selectedRescheduleSlot._id,
      };
      if (rescheduleReason.trim()) payload.reason = rescheduleReason.trim();
      const response = await mentorNetAPI.rescheduleMeeting(selectedMeeting._id, payload);
      if (response.success) {
        notify.success(response.message || 'Toplanti basariyla yeniden planlandi');
        closeRescheduleModal();
        await fetchMeetings();
      } else {
        notify.error(response.message || 'Toplanti yeniden plananamadi');
      }
    } catch (err) {
      if (err.status !== 401) {
        notify.error(err.message || 'Toplanti yeniden planlanirken bir hata olustu');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleJoinMeeting = async (meeting) => {
    // Safari popup blocker: pencereyi kullanici tiklamasinda hemen ac
    const newWindow = window.open('about:blank', '_blank');
    try {
      setActionLoadingId(meeting._id);
      
      const response = await mentorNetAPI.joinMeeting(meeting._id);
      const url = response?.data?.meetingUrl || meeting.meetingUrl || meeting.meetingLink;
      
      if (url) {
        if (newWindow) {
          newWindow.opener = null;
          newWindow.location.href = url;
        } else {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      } else {
        if (newWindow) newWindow.close();
        notify.warning('Toplanti linki henuz hazir degil');
      }
      
      if (response.message) {
        notify.success(response.message);
      }
      
      if (response.data?.autoCompleted) {
        notify.info('Toplanti otomatik olarak tamamlandi. Feedback verebilirsiniz!');
        await fetchMeetings();
      }
    } catch (err) {
      if (newWindow) newWindow.close();
      console.error('handleJoinMeeting error:', err);
      if (err.status !== 401) {
        notify.error(err.message || 'Toplantiya katilirken bir hata olustu');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const openFeedbackModal = (meeting) => {
    setSelectedMeeting(meeting);
    setFeedbackRating(5);
    setFeedbackComment('');
    setFeedbackAnonymous(false);
    setShowFeedbackModal(true);
  };

  const closeFeedbackModal = () => {
    setShowFeedbackModal(false);
    setSelectedMeeting(null);
  };

  const submitFeedback = async () => {
    if (!selectedMeeting) return;
    if (feedbackComment.trim().length < 10) {
      notify.warning('Yorumunuz en az 10 karakter olmali');
      return;
    }
    try {
      setActionLoadingId(selectedMeeting._id);
      const payload = {
        rating: feedbackRating,
        comment: feedbackComment.trim(),
        isAnonymous: feedbackAnonymous,
      };
      const response = await mentorNetAPI.giveFeedback(selectedMeeting._id, payload);
      if (response.success) {
        notify.success(response.message || 'Feedback basariyla kaydedildi');
        closeFeedbackModal();
        await fetchMeetings();
      } else {
        notify.error(response.message || 'Feedback gonderilemedi');
      }
    } catch (err) {
      if (err.status !== 401) {
        notify.error(err.message || 'Feedback gonderilirken bir hata olustu');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const availableRescheduleSlots = useMemo(
    () => rescheduleSlots.filter((slot) => slot.isAvailable !== false && slot.status !== 'booked'),
    [rescheduleSlots]
  );

  const getMeetingActions = (meeting) => {
    const isScheduled = meeting.status === 'scheduled';

    return {
      canJoin: isScheduled,
      canCancel: meeting.canCancel ?? isScheduled,
      canReschedule: meeting.canReschedule ?? isScheduled,
      canProvideFeedback: meeting.canProvideFeedback ?? meeting.status === 'completed',
    };
  };

  return (
    <PrivateRoute>
      <Head>
        <title>Toplantilarim - Emlak Konut Ideathon</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <Layout>
        <section className="meetings-section" style={{ marginTop: '140px', paddingTop: '60px', paddingBottom: '60px' }}>
          <div className="container">
            <div className="page-header">
              <span className="page-badge">
                <i className="bi bi-calendar2-event"></i>
                
              </span>
              <h1 className="page-title">Mentör Görüşmeleriniz</h1>
              <p className="page-subtitle">
                Planlanan, tamamlanan ve iptal edilen toplantilarinizi yonetin.
              </p>
            </div>

            <div className="status-tabs">
              {['scheduled', 'completed', 'cancelled'].map((status) => (
                <button
                  key={status}
                  className={`status-tab ${activeStatus === status ? 'active' : ''}`}
                  onClick={() => setActiveStatus(status)}
                >
                  <i className={`bi ${statusLabels[status]?.icon}`}></i>
                  {statusLabels[status]?.text}
                </button>
              ))}
            </div>

            {error && (
              <div className="error-section">
                <ErrorMessage message={error} onClose={() => setError('')} type="error" />
              </div>
            )}

            {loading ? (
              <div className="meetings-grid">
                {[...Array(3)].map((_, i) => (
                  <SkeletonMeetingCard key={i} />
                ))}
              </div>
            ) : meetings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <i className="bi bi-calendar-x"></i>
                </div>
                <h3>Toplanti bulunamadi</h3>
                <p>Bu filtrede toplantiniz bulunmuyor.</p>
              </div>
            ) : (
              <div className="meetings-grid">
                {meetings.map((meeting) => {
                  const statusInfo = statusLabels[meeting.status] || statusLabels.scheduled;
                  const actions = getMeetingActions(meeting);
                  return (
                    <div key={meeting._id} className="meeting-card">
                      <div className="meeting-header">
                        <div>
                          <h4 className="meeting-title">{meeting.mentorUserId?.name || 'Mentör'}</h4>
                          <p className="meeting-subtitle">{meeting.mentorUserId?.email}</p>
                        </div>
                        <span className="status-badge" style={{ background: `${statusInfo.color}15`, color: statusInfo.color }}>
                          <i className={`bi ${statusInfo.icon}`}></i>
                          {statusInfo.text}
                        </span>
                      </div>

                      <div className="meeting-info">
                        <div className="info-item">
                          <i className="bi bi-calendar3"></i>
                          <span>{meeting.formattedDate || formatDate(meeting.startAt)}</span>
                        </div>
                        <div className="info-item">
                          <i className="bi bi-clock"></i>
                          <span>{meeting.formattedTime || `${formatTime(meeting.startAt)} - ${formatTime(meeting.endAt)}`}</span>
                        </div>
                        <div className="info-item">
                          <i className="bi bi-camera-video"></i>
                          <span>{(meeting.meetingProvider || meeting.meetingType) === 'jitsi' ? 'Online (Jitsi)' : (meeting.meetingProvider || meeting.meetingType || 'Online')}</span>
                        </div>
                      </div>

                      {meeting.notes && (
                        <div className="meeting-notes">
                          <i className="bi bi-chat-left-text"></i>
                          <span>{meeting.notes}</span>
                        </div>
                      )}

                      <div className="meeting-actions">
                        <Link href={`/mentorluk/toplantilar/${meeting._id}`} className="btn-meeting-detail">
                          <i className="bi bi-eye"></i>
                          Detay
                        </Link>

                        {meeting.status === 'scheduled' && (
                          <button
                            type="button"
                            className="btn-action btn-primary"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleJoinMeeting(meeting);
                            }}
                            disabled={!actions.canJoin || actionLoadingId === meeting._id}
                          >
                            <i className={`bi ${actionLoadingId === meeting._id ? 'bi-arrow-repeat spinning' : 'bi-camera-video'}`}></i>
                            {actions.canJoin ? 'Katil' : 'Bekle'}
                          </button>
                        )}

                        {actions.canReschedule && (
                          <button
                            type="button"
                            className="btn-action btn-outline"
                            onClick={(e) => {
                              e.preventDefault();
                              openRescheduleModal(meeting);
                            }}
                            disabled={actionLoadingId === meeting._id}
                          >
                            <i className="bi bi-arrow-repeat"></i>
                            Planla
                          </button>
                        )}

                        {actions.canCancel && (
                          <button
                            type="button"
                            className="btn-action btn-danger"
                            onClick={(e) => {
                              e.preventDefault();
                              openCancelModal(meeting);
                            }}
                            disabled={actionLoadingId === meeting._id}
                          >
                            <i className="bi bi-x-circle"></i>
                            Iptal
                          </button>
                        )}

                        {actions.canProvideFeedback && !givenFeedbackMeetingIds.includes(meeting._id) && (
                          <button
                            type="button"
                            className="btn-action btn-feedback"
                            onClick={(e) => {
                              e.preventDefault();
                              openFeedbackModal(meeting);
                            }}
                            disabled={actionLoadingId === meeting._id}
                          >
                            <i className="bi bi-star-fill"></i>
                            Feedback
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </Layout>

      {showCancelModal && selectedMeeting && (
        <div className="modal-overlay" onClick={closeCancelModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-icon danger">
                <i className="bi bi-exclamation-triangle-fill"></i>
              </div>
              <h3 className="modal-title">Toplantiyi Iptal Et</h3>
              <p className="modal-message">
                {selectedMeeting.mentorUserId?.name} ile olan toplantiyi iptal etmek istediginize emin misiniz?
              </p>
              <textarea
                className="modal-textarea"
                rows="3"
                placeholder="Iptal nedeni (opsiyonel)"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
              <div className="modal-actions">
                <button className="modal-btn modal-btn-cancel" onClick={closeCancelModal}>
                  Vazgec
                </button>
                <button className="modal-btn modal-btn-danger" onClick={confirmCancel}>
                  Iptal Et
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRescheduleModal && selectedMeeting && (
        <div className="modal-overlay" onClick={closeRescheduleModal}>
          <div className="modal-container large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-icon">
                <i className="bi bi-arrow-repeat"></i>
              </div>
              <h3 className="modal-title">Toplantiyi Yeniden Planla</h3>
              {rescheduleLoading ? (
                <div className="loading-slots">Musaitlikler yukleniyor...</div>
              ) : availableRescheduleSlots.length === 0 ? (
                <p className="modal-message">Bu mentor icin uygun slot bulunamadi.</p>
              ) : (
                <>
                  <div className="slot-list">
                    {availableRescheduleSlots.map((slot) => (
                      <button
                        key={slot._id}
                        className={`slot-pill ${selectedRescheduleSlot?._id === slot._id ? 'active' : ''}`}
                        onClick={() => setSelectedRescheduleSlot(slot)}
                      >
                        {slot.formattedDate || formatDate(slot.startAt)} - {slot.formattedTime || `${formatTime(slot.startAt)} - ${formatTime(slot.endAt)}`}
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="modal-textarea"
                    rows="3"
                    placeholder="Yeniden planlama nedeni (opsiyonel)"
                    value={rescheduleReason}
                    onChange={(e) => setRescheduleReason(e.target.value)}
                  />
                  <div className="modal-actions">
                    <button className="modal-btn modal-btn-cancel" onClick={closeRescheduleModal}>
                      Vazgec
                    </button>
                    <button className="modal-btn modal-btn-confirm" onClick={confirmReschedule} disabled={!selectedRescheduleSlot}>
                      Yeniden Planla
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showFeedbackModal && selectedMeeting && (
        <div className="modal-overlay" onClick={closeFeedbackModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-icon feedback">
                <i className="bi bi-star-fill"></i>
              </div>
              <h3 className="modal-title">Feedback Ver</h3>
              <div className="rating-row">
                {[1, 2, 3, 4, 5].map((rate) => (
                  <button
                    key={rate}
                    className={`rating-star ${feedbackRating >= rate ? 'active' : ''}`}
                    onClick={() => setFeedbackRating(rate)}
                  >
                    <i className="bi bi-star-fill"></i>
                  </button>
                ))}
              </div>
              <textarea
                className="modal-textarea"
                rows="4"
                placeholder="Gorusme hakkinda yorumunuzu paylasin (en az 10 karakter)"
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
              />
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={feedbackAnonymous}
                  onChange={(e) => setFeedbackAnonymous(e.target.checked)}
                />
                Anonim paylas
              </label>
              <div className="modal-actions">
                <button className="modal-btn modal-btn-cancel" onClick={closeFeedbackModal}>
                  Vazgec
                </button>
                <button className="modal-btn modal-btn-confirm" onClick={submitFeedback}>
                  Feedback Gonder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .page-header {
          text-align: center;
          margin-bottom: 40px;
        }
        .page-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
          color: #1d4ed8;
          font-size: 13px;
          font-weight: 700;
          border-radius: 999px;
          margin-bottom: 20px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .page-title {
          font-size: 36px;
          font-weight: 800;
          color: #111827;
          margin-bottom: 12px;
          line-height: 1.2;
        }
        .page-subtitle {
          font-size: 17px;
          color: #6b7280;
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .status-tabs {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 32px;
        }
        .status-tab {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border-radius: 12px;
          border: 2px solid #e5e7eb;
          background: white;
          font-weight: 600;
          font-size: 14px;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
        }
        .status-tab:hover {
          border-color: #2563eb;
          color: #2563eb;
        }
        .status-tab.active {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          border-color: #2563eb;
          color: white;
        }

        .error-section {
          margin-bottom: 24px;
        }

        .meetings-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .meeting-card {
          background: white;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.08);
          border: 1px solid #f3f4f6;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .meeting-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .meeting-title {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 4px;
        }
        .meeting-subtitle {
          font-size: 13px;
          color: #6b7280;
          margin: 0;
        }
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
        }
        .meeting-info {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
        }
        .info-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #4b5563;
        }
        .info-item i {
          color: #2563eb;
        }
        .meeting-notes {
          display: flex;
          gap: 10px;
          background: #f9fafb;
          padding: 14px;
          border-radius: 12px;
          font-size: 13px;
          color: #4b5563;
        }
        .meeting-notes i {
          color: #9ca3af;
        }
        .meeting-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .btn-action {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 12px 18px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 14px;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
        }
        .btn-primary {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: white;
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.3);
        }
        .btn-outline {
          background: white;
          border: 2px solid #e5e7eb;
          color: #374151;
        }
        .btn-outline:hover {
          border-color: #2563eb;
          color: #2563eb;
        }
        .btn-danger {
          background: #fee2e2;
          color: #dc2626;
        }
        .btn-danger:hover {
          background: #fecaca;
        }
        .btn-feedback {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
        }
        .btn-feedback:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(245, 158, 11, 0.3);
        }
        .btn-action:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .empty-state {
          background: white;
          border-radius: 20px;
          padding: 60px 40px;
          text-align: center;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.08);
        }
        .empty-icon {
          font-size: 64px;
          color: #d1d5db;
          margin-bottom: 20px;
        }
        .empty-state h3 {
          font-size: 20px;
          font-weight: 700;
          color: #374151;
          margin-bottom: 8px;
        }
        .empty-state p {
          font-size: 15px;
          color: #6b7280;
          margin: 0;
        }

        :global(.spinning) {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
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
          max-width: 520px;
          width: 100%;
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.3);
        }
        .modal-container.large {
          max-width: 700px;
        }
        .modal-content {
          padding: 32px;
          text-align: center;
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
        .modal-icon.danger {
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          color: #dc2626;
        }
        .modal-icon.feedback {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          color: #f59e0b;
        }
        .modal-title {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 12px;
        }
        .modal-message {
          font-size: 15px;
          color: #6b7280;
          margin-bottom: 20px;
          line-height: 1.5;
        }
        .modal-textarea {
          width: 100%;
          border: 2px solid #e5e7eb;
          border-radius: 14px;
          padding: 14px;
          font-size: 14px;
          resize: vertical;
          margin-bottom: 20px;
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
          justify-content: center;
        }
        .modal-btn {
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
        .modal-btn-cancel {
          background: #f3f4f6;
          color: #6b7280;
        }
        .modal-btn-cancel:hover {
          background: #e5e7eb;
        }
        .modal-btn-confirm {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: white;
        }
        .modal-btn-confirm:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(37, 99, 235, 0.3);
        }
        .modal-btn-confirm:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .modal-btn-danger {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
        }
        .modal-btn-danger:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(239, 68, 68, 0.3);
        }

        .loading-slots {
          padding: 40px;
          color: #6b7280;
          font-size: 14px;
        }
        .slot-list {
          display: grid;
          gap: 10px;
          margin-bottom: 20px;
          max-height: 260px;
          overflow: auto;
        }
        .slot-pill {
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }
        .slot-pill:hover {
          border-color: #2563eb;
        }
        .slot-pill.active {
          border-color: #2563eb;
          background: #dbeafe;
          color: #1d4ed8;
        }
        .rating-row {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-bottom: 20px;
        }
        .rating-star {
          background: none;
          border: none;
          font-size: 32px;
          color: #d1d5db;
          cursor: pointer;
          transition: all 0.2s;
        }
        .rating-star.active {
          color: #f59e0b;
          transform: scale(1.1);
        }
        .checkbox-row {
          display: flex;
          align-items: center;
          gap: 10px;
          justify-content: center;
          margin-bottom: 20px;
          font-size: 14px;
          color: #6b7280;
          cursor: pointer;
        }
        .checkbox-row input {
          width: 18px;
          height: 18px;
        }

        @media (max-width: 768px) {
          .page-title { font-size: 28px; }
          .meeting-actions {
            flex-direction: column;
          }
          .btn-action {
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
