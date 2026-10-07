/**
 * Bildirim Ayarları Sayfası
 * Kullanıcı email tercihlerini yönetir
 */

import { useEffect, useState } from 'react';
import Head from 'next/head';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import ErrorMessage from '@/components/ErrorMessage';
import { authAPI } from '@/lib/api';
import { notify } from '@/components/Notification';

const EMAIL_PREFERENCES = [
  {
    key: 'meetingCreated',
    title: 'Toplantı Oluşturuldu',
    description: 'Yeni bir toplantı oluşturulduğunda bildirim al',
    icon: 'bi-calendar-check',
    color: '#2563eb',
  },
  {
    key: 'meetingCancelled',
    title: 'Toplantı İptal Edildi',
    description: 'Bir toplantı iptal edildiğinde bildirim al',
    icon: 'bi-calendar-x',
    color: '#dc2626',
  },
  {
    key: 'meetingNoteAdded',
    title: 'Toplantı Notu Eklendi',
    description: 'Toplantıya yeni bir not eklendiğinde bildirim al',
    icon: 'bi-journal-text',
    color: '#16a34a',
  },
  {
    key: 'availabilityUpdated',
    title: 'Mentor Müsaitlik Güncellendi',
    description: 'Mentorların müsaitlik durumu güncellendiğinde bildirim al',
    icon: 'bi-clock-history',
    color: '#f59e0b',
  },
  {
    key: 'newMessage',
    title: 'Yeni Mesaj',
    description: 'Yeni bir mesaj aldığında bildirim al',
    icon: 'bi-chat-dots',
    color: '#8b5cf6',
  },
  {
    key: 'meetingReminder',
    title: 'Toplantı Hatırlatması',
    description: 'Toplantıdan önce hatırlatma bildirimi al (1 gün ve 1 saat önce)',
    icon: 'bi-bell',
    color: '#ec4899',
  },
];

export default function BildirimAyarlari() {
  const [preferences, setPreferences] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await authAPI.getEmailPreferences();
      if (response.success) {
        setPreferences(response.data || {});
        if (response.message) {
          notify.success(response.message);
        }
      } else {
        setError(response.message || 'Tercihler yüklenirken bir hata oluştu');
        notify.error(response.message || 'Tercihler yüklenirken bir hata oluştu');
      }
    } catch (err) {
      if (err.status !== 401) {
        setError(err.message || 'Tercihler yüklenirken bir hata oluştu');
        notify.error(err.message || 'Tercihler yüklenirken bir hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      const response = await authAPI.updateEmailPreferences(preferences);
      if (response.success) {
        notify.success(response.message || 'Tercihleriniz başarıyla kaydedildi');
        setHasChanges(false);
      } else {
        notify.error(response.message || 'Tercihler kaydedilemedi');
      }
    } catch (err) {
      if (err.status !== 401) {
        notify.error(err.message || 'Tercihler kaydedilirken bir hata oluştu');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    fetchPreferences();
    setHasChanges(false);
  };

  const toggleAll = (enable) => {
    const newPreferences = {};
    EMAIL_PREFERENCES.forEach((pref) => {
      newPreferences[pref.key] = enable;
    });
    setPreferences(newPreferences);
    setHasChanges(true);
  };

  return (
    <PrivateRoute>
      <Head>
        <title>Bildirim Ayarları - Emlak Konut Ideathon</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <Layout>
        <section className="notification-settings-section" style={{ marginTop: '140px', paddingTop: '60px', paddingBottom: '60px' }}>
          <div className="container">
            {/* Header */}
            <div className="settings-header">
              <span className="page-badge">
                <i className="bi bi-bell-fill"></i>
                Bildirimler
              </span>
              <h1 className="page-title">Bildirim Ayarları</h1>
              <p className="page-subtitle">
                Email bildirim tercihlerinizi yönetin.
              </p>
            </div>

            {error && (
              <div className="error-section">
                <ErrorMessage message={error} onClose={() => setError('')} type="error" />
              </div>
            )}

            {loading ? (
              <div className="loading-skeleton">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="skeleton-item">
                    <div className="skeleton-icon"></div>
                    <div className="skeleton-content">
                      <div className="skeleton-title"></div>
                      <div className="skeleton-desc"></div>
                    </div>
                    <div className="skeleton-toggle"></div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Quick Actions */}
                <div className="quick-actions">
                  <button
                    type="button"
                    className="quick-action-btn"
                    onClick={() => toggleAll(true)}
                    disabled={saving}
                  >
                    <i className="bi bi-check-all"></i>
                    Tümünü Aç
                  </button>
                  <button
                    type="button"
                    className="quick-action-btn secondary"
                    onClick={() => toggleAll(false)}
                    disabled={saving}
                  >
                    <i className="bi bi-x-lg"></i>
                    Tümünü Kapat
                  </button>
                </div>

                {/* Preferences List */}
                <div className="preferences-container">
                  <div className="preferences-list">
                    {EMAIL_PREFERENCES.map((pref) => (
                      <div key={pref.key} className="preference-item">
                        <div className="preference-icon" style={{ background: `${pref.color}15`, color: pref.color }}>
                          <i className={`bi ${pref.icon}`}></i>
                        </div>
                        <div className="preference-content">
                          <h3 className="preference-title">{pref.title}</h3>
                          <p className="preference-description">{pref.description}</p>
                        </div>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={preferences[pref.key] || false}
                            onChange={() => handleToggle(pref.key)}
                            disabled={saving}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save Actions */}
                {hasChanges && (
                  <div className="save-actions">
                    <div className="save-info">
                      <i className="bi bi-info-circle"></i>
                      <span>Değişikliklerinizi kaydetmeyi unutmayın</span>
                    </div>
                    <div className="save-buttons">
                      <button
                        type="button"
                        className="btn-reset"
                        onClick={handleReset}
                        disabled={saving}
                      >
                        <i className="bi bi-arrow-counterclockwise"></i>
                        İptal
                      </button>
                      <button
                        type="button"
                        className="btn-save"
                        onClick={handleSave}
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <i className="bi bi-arrow-repeat spinning"></i>
                            Kaydediliyor...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-check-lg"></i>
                            Değişiklikleri Kaydet
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </Layout>

      <style jsx>{`
        .container {
          max-width: 900px;
          margin: 0 auto;
        }

        .settings-header {
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
          margin: 0 auto 16px auto;
          line-height: 1.6;
        }

        .error-section {
          margin-bottom: 24px;
        }

        .loading-skeleton {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .skeleton-item {
          display: flex;
          align-items: center;
          gap: 18px;
          background: white;
          padding: 24px;
          border-radius: 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        .skeleton-icon {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        .skeleton-content {
          flex: 1;
        }
        .skeleton-title {
          width: 180px;
          height: 20px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 8px;
          margin-bottom: 8px;
        }
        .skeleton-desc {
          width: 100%;
          max-width: 400px;
          height: 16px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 8px;
        }
        .skeleton-toggle {
          width: 56px;
          height: 32px;
          border-radius: 999px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .quick-actions {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-bottom: 28px;
        }
        .quick-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          border: 2px solid #e5e7eb;
          background: white;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
        }
        .quick-action-btn:hover:not(:disabled) {
          border-color: #2563eb;
          color: #2563eb;
          background: #f0f9ff;
        }
        .quick-action-btn.secondary:hover:not(:disabled) {
          border-color: #dc2626;
          color: #dc2626;
          background: #fef2f2;
        }
        .quick-action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .preferences-container {
          margin-bottom: 24px;
        }
        .preferences-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .preference-item {
          display: flex;
          align-items: center;
          gap: 18px;
          background: white;
          padding: 24px;
          border-radius: 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border: 1px solid #f3f4f6;
          transition: all 0.2s;
        }
        .preference-item:hover {
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
          border-color: #e5e7eb;
        }
        .preference-icon {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          flex-shrink: 0;
        }
        .preference-content {
          flex: 1;
          min-width: 0;
        }
        .preference-title {
          font-size: 17px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 4px;
        }
        .preference-description {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.5;
          margin: 0;
        }

        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 56px;
          height: 32px;
          flex-shrink: 0;
        }
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #e5e7eb;
          transition: 0.3s;
          border-radius: 999px;
        }
        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 24px;
          width: 24px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        input:checked + .toggle-slider {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        }
        input:checked + .toggle-slider:before {
          transform: translateX(24px);
        }
        input:disabled + .toggle-slider {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .save-actions {
          background: white;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
          border: 2px solid #2563eb;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .save-info {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #2563eb;
          font-size: 15px;
          font-weight: 600;
        }
        .save-info i {
          font-size: 20px;
        }
        .save-buttons {
          display: flex;
          gap: 12px;
        }
        .btn-reset,
        .btn-save {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .btn-reset {
          background: #f3f4f6;
          color: #6b7280;
        }
        .btn-reset:hover:not(:disabled) {
          background: #e5e7eb;
          color: #374151;
        }
        .btn-save {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: white;
        }
        .btn-save:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(37, 99, 235, 0.3);
        }
        .btn-reset:disabled,
        .btn-save:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        :global(.spinning) {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .page-title {
            font-size: 28px;
          }
          .quick-actions {
            flex-direction: column;
          }
          .quick-action-btn {
            width: 100%;
            justify-content: center;
          }
          .preference-item {
            flex-wrap: wrap;
          }
          .preference-content {
            flex: 1 1 100%;
            order: 2;
          }
          .toggle-switch {
            order: 3;
            margin-left: auto;
          }
          .save-actions {
            flex-direction: column;
            align-items: stretch;
          }
          .save-buttons {
            flex-direction: column;
          }
          .btn-reset,
          .btn-save {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </PrivateRoute>
  );
}

