/**
 * Toplanti Detay Page
 * Toplanti bilgileri, feedback ve notlar
 */

import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import ErrorMessage from '@/components/ErrorMessage';
import { mentorNetAPI } from '@/lib/api';
import { notify } from '@/components/Notification';
import { getInitials } from '@/lib/auth';

const statusLabels = {
  scheduled: { text: 'Planlandi', color: '#2563eb', bg: '#dbeafe', icon: 'bi-calendar-check' },
  completed: { text: 'Tamamlandi', color: '#16a34a', bg: '#dcfce7', icon: 'bi-check-circle' },
  cancelled: { text: 'Iptal Edildi', color: '#dc2626', bg: '#fee2e2', icon: 'bi-x-circle' },
};

const noteTypeLabels = {
  summary: { text: 'Ozet', icon: 'bi-file-text', color: '#2563eb' },
  action_item: { text: 'Aksiyon', icon: 'bi-list-check', color: '#16a34a' },
  feedback: { text: 'Geri Bildirim', icon: 'bi-chat-quote', color: '#f59e0b' },
  other: { text: 'Diger', icon: 'bi-sticky', color: '#6b7280' },
};

export default function ToplantıDetay() {
  const router = useRouter();
  const { meetingId } = router.query;

  const [meeting, setMeeting] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackAnonymous, setFeedbackAnonymous] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long',
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const loadMeetingData = async () => {
    if (!meetingId) return;
    try {
      setLoading(true);
      setError('');

      const [meetingRes, myFeedbacksRes, notesRes, attendanceRes] = await Promise.allSettled([
        mentorNetAPI.getMeeting(meetingId),
        mentorNetAPI.getMyGivenFeedbacks(),
        mentorNetAPI.getMeetingNotes(meetingId),
        mentorNetAPI.getAttendance(meetingId),
      ]);

      if (meetingRes.status === 'fulfilled' && meetingRes.value.success) {
        setMeeting(meetingRes.value.data);
        if (meetingRes.value.message) {
          notify.success(meetingRes.value.message);
        }
      } else {
        setError('Toplanti bilgileri yuklenemedi');
        notify.error('Toplanti bilgileri yuklenemedi');
        return;
      }

      // Verdiğim feedback'lerden bu toplantıya ait olanı filtrele
      if (myFeedbacksRes.status === 'fulfilled' && myFeedbacksRes.value.success) {
        const allMyFeedbacks = myFeedbacksRes.value.data || [];
        const meetingFeedbacks = allMyFeedbacks.filter(
          (fb) => fb.meetingId?._id === meetingId || fb.meetingId === meetingId
        );
        setFeedbacks(meetingFeedbacks);
      }

      if (notesRes.status === 'fulfilled' && notesRes.value.success) {
        setNotes(notesRes.value.data || []);
      }

      if (attendanceRes.status === 'fulfilled' && attendanceRes.value.success) {
        setAttendance(attendanceRes.value.data);
      }
    } catch (err) {
      if (err.status !== 401) {
        setError(err.message || 'Veriler yuklenirken bir hata olustu');
        notify.error(err.message || 'Veriler yuklenirken bir hata olustu');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (router.isReady && meetingId) {
      loadMeetingData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, meetingId]);

  const handleJoinMeeting = async () => {
    // Safari popup blocker: pencereyi kullanici tiklamasinda hemen ac
    const newWindow = window.open('about:blank', '_blank');
    try {
      setActionLoading(true);

      const response = await mentorNetAPI.joinMeeting(meetingId);
      const url = response?.data?.meetingUrl || meeting?.meetingUrl || meeting?.meetingLink;
      
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
        notify.info('Toplanti otomatik olarak tamamlandi!');
      }

      await loadMeetingData();
    } catch (err) {
      if (newWindow) newWindow.close();
      console.warn('Join API error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const openFeedbackModal = () => {
    setFeedbackRating(5);
    setFeedbackComment('');
    setFeedbackAnonymous(false);
    setShowFeedbackModal(true);
  };

  const closeFeedbackModal = () => {
    setShowFeedbackModal(false);
  };

  const submitFeedback = async () => {
    if (feedbackComment.trim().length < 10) {
      notify.warning('Yorumunuz en az 10 karakter olmali');
      return;
    }

    try {
      setFeedbackLoading(true);
      const payload = {
        rating: feedbackRating,
        comment: feedbackComment.trim(),
        isAnonymous: feedbackAnonymous,
      };
      const response = await mentorNetAPI.giveFeedback(meetingId, payload);
      if (response.success) {
        notify.success(response.message || 'Feedback basariyla kaydedildi');
        closeFeedbackModal();
        await loadMeetingData();
      } else {
        notify.error(response.message || 'Feedback gonderilemedi');
      }
    } catch (err) {
      if (err.status !== 401) {
        notify.error(err.message || 'Feedback gonderilirken bir hata olustu');
      }
    } finally {
      setFeedbackLoading(false);
    }
  };

  const hasGivenFeedback = feedbacks.some(
    (f) => f.feedbackType === 'participant_to_mentor'
  );

  const canJoin = () => {
    if (!meeting || meeting.status !== 'scheduled') return false;
    const now = Date.now();
    const startAt = meeting.startAt ? new Date(meeting.startAt).getTime() : null;
    const endAt = meeting.endAt ? new Date(meeting.endAt).getTime() : null;
    const bufferMs = 10 * 60 * 1000;
    return startAt && endAt ? now >= startAt - bufferMs && now <= endAt + bufferMs : true;
  };

  const canGiveFeedback = () => {
    return meeting?.status === 'completed' && !hasGivenFeedback;
  };

  if (loading) {
    return (
      <PrivateRoute>
        <Head>
          <title>Toplanti Detayi - Emlak Konut Ideathon</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <Layout>
          <section className="meeting-detail-section" style={{ marginTop: '140px', paddingTop: '60px', paddingBottom: '60px' }}>
            <div className="container">
              <Link href="/mentorluk/toplantilar" className="btn-back-mentor">
                <i className="bi bi-arrow-left"></i>
                Toplantilara Don
              </Link>
              <div className="loading-skeleton">
                <div className="skeleton-main">
                  <div className="skeleton-header"></div>
                  <div className="skeleton-body"></div>
                </div>
                <div className="skeleton-sidebar">
                  <div className="skeleton-card"></div>
                </div>
              </div>
            </div>
          </section>
        </Layout>
        <style jsx>{`
          .loading-skeleton {
            display: grid;
            grid-template-columns: 1fr 340px;
            gap: 30px;
          }
          .skeleton-main {
            display: flex;
            flex-direction: column;
            gap: 24px;
          }
          .skeleton-header {
            height: 300px;
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 24px;
          }
          .skeleton-body {
            height: 200px;
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 24px;
          }
          .skeleton-sidebar {
            display: flex;
            flex-direction: column;
            gap: 24px;
          }
          .skeleton-card {
            height: 280px;
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 20px;
          }
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
          @media (max-width: 1024px) {
            .loading-skeleton { grid-template-columns: 1fr; }
          }
        `}</style>
      </PrivateRoute>
    );
  }

  if (!meeting) {
    return (
      <PrivateRoute>
        <Head>
          <title>Toplanti Detayi - Emlak Konut Ideathon</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <Layout>
          <section className="meeting-detail-section" style={{ marginTop: '140px', paddingTop: '60px', paddingBottom: '60px' }}>
            <div className="container">
              <ErrorMessage message={error || 'Toplanti bulunamadi'} type="error" />
              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <Link href="/mentorluk/toplantilar" className="btn-back-mentor-center">
                  <i className="bi bi-arrow-left"></i>
                  Toplantilara Don
                </Link>
              </div>
            </div>
          </section>
        </Layout>
      </PrivateRoute>
    );
  }

  const status = statusLabels[meeting.status] || statusLabels.scheduled;
  const mentorName = meeting.mentorUserId?.name || 'Mentör';
  const mentorEmail = meeting.mentorUserId?.email || '';

  return (
    <PrivateRoute>
      <Head>
        <title>Toplanti Detayi - Emlak Konut Ideathon</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <Layout>
        <section className="meeting-detail-section" style={{ marginTop: '140px', paddingTop: '60px', paddingBottom: '60px' }}>
          <div className="container">
            <Link href="/mentorluk/toplantilar" className="btn-back-mentor">
              <i className="bi bi-arrow-left"></i>
              Toplantilara Don
            </Link>

            {error && <ErrorMessage message={error} onClose={() => setError('')} type="error" />}

            <div className="meeting-detail-grid">
              <div className="meeting-main">
                <div className="detail-card meeting-header-card">
                  <div className="meeting-status-row">
                    <span className="status-badge-large" style={{ background: status.bg, color: status.color }}>
                      <i className={`bi ${status.icon}`}></i>
                      {status.text}
                    </span>
                    {meeting.duration && (
                      <span className="duration-badge">
                        <i className="bi bi-clock"></i>
                        {meeting.duration} dakika
                      </span>
                    )}
                  </div>

                  <h1 className="meeting-title">{meeting.title || 'Mentörlük Görüşmesi'}</h1>

                  {meeting.description && (
                    <p className="meeting-description">{meeting.description}</p>
                  )}

                  <div className="meeting-datetime">
                    <div className="datetime-item">
                      <i className="bi bi-calendar3"></i>
                      <div>
                        <span className="datetime-label">Tarih</span>
                        <span className="datetime-value">{meeting.formattedDate || formatDate(meeting.startAt)}</span>
                      </div>
                    </div>
                    <div className="datetime-item">
                      <i className="bi bi-clock"></i>
                      <div>
                        <span className="datetime-label">Saat</span>
                        <span className="datetime-value">
                          {meeting.formattedTime || `${formatTime(meeting.startAt)} - ${formatTime(meeting.endAt)}`}
                        </span>
                      </div>
                    </div>
                    <div className="datetime-item">
                      <i className="bi bi-camera-video"></i>
                      <div>
                        <span className="datetime-label">Platform</span>
                        <span className="datetime-value">
                          {(meeting.meetingProvider || meeting.meetingType) === 'jitsi' ? 'Jitsi Meet' : 'Online'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="meeting-actions-row">
                    {meeting.status === 'scheduled' && (
                      <>
                        <button
                          className="btn-action btn-join"
                          onClick={handleJoinMeeting}
                          disabled={actionLoading}
                        >
                          <i className={`bi ${actionLoading ? 'bi-arrow-repeat spinning' : 'bi-camera-video-fill'}`}></i>
                          Toplantiya Katil
                        </button>

                        <p className="join-info-text" style={{ fontSize: '0.85rem', color: '#6c757d', marginTop: '8px' }}>
                          Toplantıya yukarıdaki buton ile katılabilirsiniz.
                        </p>
                      </>
                    )}

                    {canGiveFeedback() && (
                      <button className="btn-action btn-feedback" onClick={openFeedbackModal}>
                        <i className="bi bi-star-fill"></i>
                        Feedback Ver
                      </button>
                    )}
                  </div>
                </div>

                {(attendance || meeting.attendance) && (
                  <div className="detail-card">
                    <h3 className="card-title">
                      <i className="bi bi-people"></i>
                      Katilim Durumu
                    </h3>
                    <div className="attendance-grid">
                      <div className={`attendance-item ${attendance?.mentor?.joined || meeting.attendance?.mentorJoined ? 'joined' : ''}`}>
                        <div className="attendance-avatar mentor">
                          <i className="bi bi-mortarboard-fill"></i>
                        </div>
                        <div className="attendance-info">
                          <span className="attendance-role">Mentör</span>
                          <span className="attendance-name">{attendance?.mentor?.name || mentorName}</span>
                          <span className={`attendance-status ${attendance?.mentor?.joined || meeting.attendance?.mentorJoined ? 'joined' : 'waiting'}`}>
                            {attendance?.mentor?.joined || meeting.attendance?.mentorJoined ? (
                              <>
                                <i className="bi bi-check-circle-fill"></i>
                                Katildi
                              </>
                            ) : (
                              <>
                                <i className="bi bi-hourglass-split"></i>
                                Bekleniyor
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className={`attendance-item ${attendance?.participant?.joined || meeting.attendance?.participantJoined ? 'joined' : ''}`}>
                        <div className="attendance-avatar participant">
                          <i className="bi bi-person-fill"></i>
                        </div>
                        <div className="attendance-info">
                          <span className="attendance-role">Katilimci (Ben)</span>
                          <span className="attendance-name">{attendance?.participant?.name || 'Ben'}</span>
                          <span className={`attendance-status ${attendance?.participant?.joined || meeting.attendance?.participantJoined ? 'joined' : 'waiting'}`}>
                            {attendance?.participant?.joined || meeting.attendance?.participantJoined ? (
                              <>
                                <i className="bi bi-check-circle-fill"></i>
                                Katildim
                              </>
                            ) : (
                              <>
                                <i className="bi bi-hourglass-split"></i>
                                Henuz katilmadim
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="detail-card">
                  <h3 className="card-title">
                    <i className="bi bi-star"></i>
                    Degerlendirmeler
                    {feedbacks.length > 0 && <span className="count-badge">{feedbacks.length}</span>}
                  </h3>

                  {feedbacks.length === 0 ? (
                    <div className="empty-state-small">
                      <i className="bi bi-star"></i>
                      <p>Henuz degerlendirme yapilmamis</p>
                      {canGiveFeedback() && (
                        <button className="btn-feedback-small" onClick={openFeedbackModal}>
                          Ilk Degerlendirmeyi Yap
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="feedbacks-list">
                      {feedbacks.map((feedback) => (
                        <div key={feedback._id} className="feedback-item">
                          <div className="feedback-header">
                            <div className="feedback-type">
                              {feedback.feedbackType === 'mentor_to_participant' ? (
                                <span className="type-badge mentor">
                                  <i className="bi bi-mortarboard-fill"></i>
                                  Mentör - Bana
                                </span>
                              ) : (
                                <span className="type-badge participant">
                                  <i className="bi bi-person-fill"></i>
                                  Ben - Mentör
                                </span>
                              )}
                            </div>
                            <div className="feedback-rating">
                              {[...Array(5)].map((_, i) => (
                                <i
                                  key={i}
                                  className={`bi bi-star-fill ${i < feedback.rating ? 'active' : ''}`}
                                ></i>
                              ))}
                            </div>
                          </div>
                          <p className="feedback-comment">{feedback.comment}</p>
                   
                          <div className="feedback-footer">
                            <span className="feedback-author">
                              {feedback.isAnonymous ? 'Anonim' : feedback.filledByUserId?.name || 'Kullanici'}
                            </span>
                            <span className="feedback-date">{formatDateTime(feedback.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="detail-card">
                  <h3 className="card-title">
                    <i className="bi bi-journal-text"></i>
                    Toplanti Notlari
                    {notes.length > 0 && <span className="count-badge">{notes.length}</span>}
                  </h3>

                  {notes.length === 0 ? (
                    <div className="empty-state-small">
                      <i className="bi bi-journal-text"></i>
                      <p>Henuz not eklenmemis</p>
                    </div>
                  ) : (
                    <div className="notes-list">
                      {notes.map((note) => {
                        const noteType = noteTypeLabels[note.noteType] || noteTypeLabels.other;
                        return (
                          <div key={note._id} className="note-item">
                            <div className="note-header">
                              <span className="note-type-badge" style={{ color: noteType.color }}>
                                <i className={`bi ${noteType.icon}`}></i>
                                {noteType.text}
                              </span>
                              <h4 className="note-title">{note.title}</h4>
                            </div>
                            <p className="note-content">{note.note}</p>
                            {note.tags && note.tags.length > 0 && (
                              <div className="note-tags">
                                {note.tags.map((tag) => (
                                  <span key={tag} className="note-tag">#{tag}</span>
                                ))}
                              </div>
                            )}
                            <div className="note-footer">
                              <span className="note-author">
                                <i className="bi bi-person"></i>
                                {note.authorUserId?.name || 'Mentör'}
                              </span>
                              <span className="note-date">{formatDateTime(note.createdAt)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="meeting-sidebar">
                <div className="detail-card mentor-card">
                  <h3 className="card-title">
                    <i className="bi bi-person-badge"></i>
                    Mentör
                  </h3>
                  <div className="mentor-profile">
                    <div className="mentor-avatar-large">
                      <span>{getInitials(mentorName)}</span>
                    </div>
                    <h4 className="mentor-name">{mentorName}</h4>
                    <p className="mentor-email">{mentorEmail}</p>
                    <Link href={`/mentorluk/mentorlar/${meeting.mentorUserId?._id}`} className="btn-mentor-profile-link">
                      <i className="bi bi-person-lines-fill"></i>
                      Profili Goruntule
                    </Link>
                  </div>
                </div>

                <div className="detail-card quick-info-card">
                  <h3 className="card-title">
                    <i className="bi bi-info-circle"></i>
                    Bilgiler
                  </h3>
                  <ul className="quick-info-list">
                    <li>
                      <span className="info-label">Olusturulma</span>
                      <span className="info-value">{formatDateTime(meeting.createdAt)}</span>
                    </li>
                    {meeting.status === 'cancelled' && (
                      <>
                        {meeting.cancelledBy?.name && (
                          <li>
                            <span className="info-label">Iptal Eden</span>
                            <span className="info-value">
                              {meeting.cancelledBy.name}
                              {meeting.cancelledBy.role === 'mentor' ? ' (Mentör)' : ' (Katılımcı)'}
                            </span>
                          </li>
                        )}
                        {meeting.cancelledAt && (
                          <li>
                            <span className="info-label">Iptal Tarihi</span>
                            <span className="info-value">{formatDateTime(meeting.cancelledAt)}</span>
                          </li>
                        )}
                        {meeting.cancellationReason && (
                          <li>
                            <span className="info-label">Iptal Nedeni</span>
                            <span className="info-value cancellation-reason">{meeting.cancellationReason}</span>
                          </li>
                        )}
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Layout>

      {showFeedbackModal && (
        <div className="modal-overlay" onClick={closeFeedbackModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <button className="modal-close" onClick={closeFeedbackModal}>
                <i className="bi bi-x-lg"></i>
              </button>
              <div className="modal-icon">
                <i className="bi bi-star-fill"></i>
              </div>
              <h3 className="modal-title">Mentör Değerlendirmesi</h3>
              <p className="modal-subtitle">{mentorName} ile gorusmenizi degerlendirin</p>

              <div className="rating-section">
                <label>Puaniniz</label>
                <div className="rating-row">
                  {[1, 2, 3, 4, 5].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      className={`rating-star ${feedbackRating >= rate ? 'active' : ''}`}
                      onClick={() => setFeedbackRating(rate)}
                    >
                      <i className="bi bi-star-fill"></i>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Yorumunuz <span className="required">*</span></label>
                <textarea
                  className="modal-textarea"
                  rows="4"
                  placeholder="Gorusme hakkinda dusuncelerinizi paylasin (en az 10 karakter)"
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  disabled={feedbackLoading}
                />
                <span className="char-count">{feedbackComment.length} karakter</span>
              </div>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={feedbackAnonymous}
                  onChange={(e) => setFeedbackAnonymous(e.target.checked)}
                />
                <span>Anonim olarak gonder</span>
              </label>

              <div className="modal-actions">
                <button className="modal-btn modal-btn-cancel" onClick={closeFeedbackModal} disabled={feedbackLoading}>
                  Vazgec
                </button>
                <button
                  className="modal-btn modal-btn-confirm"
                  onClick={submitFeedback}
                  disabled={feedbackLoading || feedbackComment.trim().length < 10}
                >
                  {feedbackLoading ? 'Gonderiliyor...' : 'Gonder'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .meeting-detail-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 30px;
          align-items: start;
        }

        .detail-card {
          background: white;
          border-radius: 20px;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.08);
          padding: 28px;
          margin-bottom: 24px;
          border: 1px solid #f3f4f6;
        }

        .card-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 20px;
        }
        .card-title i {
          color: #2563eb;
        }
        .count-badge {
          background: #dbeafe;
          color: #1d4ed8;
          font-size: 12px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 999px;
          margin-left: auto;
        }

        .meeting-header-card {
          background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
        }
        .meeting-status-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .status-badge-large {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 700;
        }
        .duration-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
          background: #f3f4f6;
          color: #6b7280;
        }
        .meeting-title {
          font-size: 28px;
          font-weight: 800;
          color: #111827;
          margin-bottom: 8px;
        }
        .meeting-description {
          font-size: 15px;
          color: #6b7280;
          line-height: 1.6;
          margin-bottom: 24px;
        }
        .meeting-datetime {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .datetime-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          background: white;
          border-radius: 14px;
          border: 1px solid #e5e7eb;
        }
        .datetime-item > i {
          font-size: 24px;
          color: #2563eb;
        }
        .datetime-label {
          display: block;
          font-size: 12px;
          color: #9ca3af;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .datetime-value {
          display: block;
          font-size: 15px;
          color: #111827;
          font-weight: 600;
        }
        .meeting-actions-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .btn-action {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px 24px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
        }
        .btn-join {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: white;
        }
        .btn-join:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(37, 99, 235, 0.3);
        }
        .btn-join:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn-feedback {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
        }
        .btn-feedback:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(245, 158, 11, 0.3);
        }
        .btn-link {
          background: white;
          border: 2px solid #e5e7eb;
          color: #374151;
        }
        .btn-link:hover {
          border-color: #2563eb;
          color: #2563eb;
        }

        .join-time-notice {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 22px;
          background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
          border: 2px solid #fbbf24;
          border-radius: 14px;
          width: 100%;
        }

        .join-time-notice > i {
          font-size: 28px;
          color: #d97706;
          flex-shrink: 0;
        }

        .notice-title {
          display: block;
          font-size: 15px;
          font-weight: 700;
          color: #92400e;
          margin-bottom: 2px;
        }

        .notice-desc {
          display: block;
          font-size: 13px;
          color: #a16207;
          line-height: 1.4;
        }

        .attendance-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .attendance-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 18px;
          background: #f9fafb;
          border-radius: 14px;
          border: 2px solid #e5e7eb;
          transition: all 0.2s;
        }
        .attendance-item.joined {
          border-color: #22c55e;
          background: #f0fdf4;
        }
        .attendance-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
        }
        .attendance-avatar.mentor {
          background: #dbeafe;
          color: #1d4ed8;
        }
        .attendance-avatar.participant {
          background: #dcfce7;
          color: #16a34a;
        }
        .attendance-info {
          flex: 1;
        }
        .attendance-role {
          display: block;
          font-size: 11px;
          color: #9ca3af;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .attendance-name {
          display: block;
          font-size: 15px;
          font-weight: 700;
          color: #111827;
          margin: 2px 0;
        }
        .attendance-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
        }
        .attendance-status.joined {
          color: #16a34a;
        }
        .attendance-status.waiting {
          color: #9ca3af;
        }

        .feedbacks-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .feedback-item {
          padding: 20px;
          background: #f9fafb;
          border-radius: 14px;
          border: 1px solid #e5e7eb;
        }
        .feedback-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          flex-wrap: wrap;
          gap: 10px;
        }
        .type-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
        }
        .type-badge.mentor {
          background: #dbeafe;
          color: #1d4ed8;
        }
        .type-badge.participant {
          background: #dcfce7;
          color: #16a34a;
        }
        .feedback-rating {
          display: flex;
          gap: 4px;
        }
        .feedback-rating i {
          font-size: 16px;
          color: #d1d5db;
        }
        .feedback-rating i.active {
          color: #f59e0b;
        }
        .feedback-comment {
          font-size: 14px;
          color: #374151;
          line-height: 1.7;
          margin: 0 0 12px 0;
        }
        .feedback-meta {
          margin-bottom: 12px;
        }
        .meet-again {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
        }
        .meet-again.yes {
          color: #16a34a;
        }
        .meet-again.no {
          color: #dc2626;
        }
        .feedback-footer {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #9ca3af;
        }

        .notes-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .note-item {
          padding: 20px;
          background: #f9fafb;
          border-radius: 14px;
          border: 1px solid #e5e7eb;
        }
        .note-header {
          margin-bottom: 12px;
        }
        .note-type-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 6px;
        }
        .note-title {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }
        .note-content {
          font-size: 14px;
          color: #374151;
          line-height: 1.7;
          margin: 0 0 12px 0;
          white-space: pre-wrap;
        }
        .note-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
        }
        .note-tag {
          font-size: 12px;
          font-weight: 600;
          color: #2563eb;
          background: #eff6ff;
          padding: 4px 10px;
          border-radius: 999px;
        }
        .note-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: #9ca3af;
        }
        .note-author {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .empty-state-small {
          text-align: center;
          padding: 30px;
          color: #9ca3af;
        }
        .empty-state-small i {
          font-size: 40px;
          margin-bottom: 10px;
          display: block;
        }
        .empty-state-small p {
          margin: 0 0 16px 0;
        }
        .btn-feedback-small {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-feedback-small:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(245, 158, 11, 0.3);
        }

        .mentor-card .mentor-profile {
          text-align: center;
        }
        .mentor-avatar-large {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          font-size: 32px;
          font-weight: 800;
          color: #1d4ed8;
        }
        .mentor-card .mentor-name {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 4px;
        }
        .mentor-card .mentor-email {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 16px;
        }
        .quick-info-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .quick-info-list li {
          display: flex;
          flex-direction: column;
          padding: 12px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .quick-info-list li:last-child {
          border-bottom: none;
        }
        .info-label {
          font-size: 11px;
          font-weight: 600;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .info-value {
          font-size: 14px;
          color: #374151;
        }

        .info-value.cancellation-reason {
          font-style: italic;
          color: #dc2626;
          font-weight: 500;
        }

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
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          color: #f59e0b;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          font-size: 32px;
        }
        .modal-title {
          font-size: 22px;
          font-weight: 700;
          color: #111827;
          text-align: center;
          margin-bottom: 6px;
        }
        .modal-subtitle {
          font-size: 14px;
          color: #6b7280;
          text-align: center;
          margin-bottom: 24px;
        }
        .rating-section {
          margin-bottom: 20px;
          text-align: center;
        }
        .rating-section label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 10px;
        }
        .rating-row {
          display: flex;
          justify-content: center;
          gap: 8px;
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
        .form-group {
          margin-bottom: 16px;
        }
        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }
        .required {
          color: #dc2626;
        }
        .modal-textarea {
          width: 100%;
          border: 2px solid #e5e7eb;
          border-radius: 14px;
          padding: 14px;
          font-size: 14px;
          resize: vertical;
          transition: all 0.2s;
        }
        .modal-textarea:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        }
        .char-count {
          display: block;
          font-size: 12px;
          color: #9ca3af;
          text-align: right;
          margin-top: 6px;
        }
        .checkbox-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
          font-size: 14px;
          color: #6b7280;
          cursor: pointer;
        }
        .checkbox-row input {
          width: 18px;
          height: 18px;
        }
        .modal-actions {
          display: flex;
          gap: 12px;
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
        .modal-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .modal-btn-cancel {
          background: #f3f4f6;
          color: #6b7280;
        }
        .modal-btn-confirm {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
        }

        :global(.spinning) {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 1024px) {
          .meeting-detail-grid {
            grid-template-columns: 1fr;
          }
          .meeting-sidebar {
            order: -1;
          }
        }

        @media (max-width: 768px) {
          .meeting-title {
            font-size: 22px;
          }
          .meeting-datetime {
            grid-template-columns: 1fr;
          }
          .attendance-grid {
            grid-template-columns: 1fr;
          }
          .meeting-actions-row {
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
