/**
 * Başvuru Sayfası
 * Config'deki applicationOpen değerine göre form veya kapalı mesajı gösterir.
 * Zaten başvurusu varsa uyarı mesajı gösterir.
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import Layout from '@/components/Layout'
import PrivateRoute from '@/components/PrivateRoute'
import ApplicationForm from '@/components/ApplicationForm'
import { useIdeathonConfig, useIdeathon } from '@/context/IdeathonContext'
import { useAuth } from '@/context/AuthContext'
import { applicationsAPI } from '@/lib/api'

export default function Basvuru() {
  const config = useIdeathonConfig()
  const { hasSlug } = useIdeathon()
  const router = useRouter()
  const { user } = useAuth()
  const { edit: editId } = router.query

  const [existingApp, setExistingApp] = useState(null)
  const [checkingApp, setCheckingApp] = useState(true)

  // Mevcut başvuru kontrolü (sadece yeni başvuru modunda, edit modunda değil)
  useEffect(() => {
    const checkExistingApplication = async () => {
      if (!user || editId) {
        setCheckingApp(false)
        return
      }
      try {
        const response = await applicationsAPI.getMyApplications()
        if (response.success && response.data && response.data.length > 0) {
          setExistingApp(response.data[0])
        }
      } catch (err) {
        // silent catch
      } finally {
        setCheckingApp(false)
      }
    }
    if (router.isReady) {
      checkExistingApplication()
    }
  }, [user, router.isReady, editId])

  // Mevcut başvuru varsa (ve edit modunda değilse) uyarı göster
  const hasExistingApplication = !editId && existingApp

  return (
    <PrivateRoute>
      <Head>
        <title>{config.applicationOpen ? 'Başvuru Yap' : 'Başvurular Sona Erdi'} - {config.name}</title>
        <meta name="description" content={config.applicationOpen ? `${config.name} başvuru formu. Hemen başvurunuzu yapın.` : `${config.name} başvuru süreci sona ermiştir.`} />
        <meta name="keywords" content={`Emlak Konut, Ideathon, başvuru${config.applicationOpen ? '' : ', kapalı'}`} />
        <meta name="author" content="EKA Enerji ve Teknoloji A.Ş." />
        <meta name="robots" content={config.applicationOpen ? 'index, follow' : 'noindex, follow'} />
        <meta name="language" content="tr-TR" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://ideathon.anahtarfikirler.com/basvuru" />
        <meta property="og:title" content={`${config.applicationOpen ? 'Başvuru Yap' : 'Başvurular Sona Erdi'} - ${config.name}`} />
        <meta property="og:image" content="https://ideathon.anahtarfikirler.com/img/slider.webp" />
        <meta property="og:site_name" content="Emlak Konut Ideathon" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${config.applicationOpen ? 'Başvuru Yap' : 'Başvurular Sona Erdi'} - ${config.name}`} />
        <meta name="twitter:image" content="https://ideathon.anahtarfikirler.com/img/slider.webp" />

        {/* Canonical URL */}
        <link rel="canonical" href="https://ideathon.anahtarfikirler.com/basvuru" />
      </Head>

      <Layout>
        {!hasSlug && !config.loading ? (
          /* ========== IDEATHON SEÇİLMEMİŞ ========== */
          <section style={{ marginTop: '140px', minHeight: 'calc(100vh - 140px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="container">
              <div className="row justify-content-center">
                <div className="col-lg-8 col-md-10 text-center">
                  <div style={{ fontSize: '80px', color: '#f59e0b', marginBottom: '24px' }}>
                    <i className="bi bi-exclamation-triangle-fill"></i>
                  </div>
                  <h2 className="alt-font text-dark-gray fw-700 mb-15px">Ideathon Seçimi Gerekli</h2>
                  <p className="text-dark-gray lh-28 fs-16 mb-30px">
                    Başvuru yapabilmek için önce bir ideathon seçmelisiniz.
                  </p>
                  <Link href="/" className="btn-modern-apply">
                    <i className="bi bi-grid-3x3-gap-fill"></i>
                    <span>Ideathon Seç</span>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        ) : (config.loading || checkingApp) ? (
          /* ========== YÜKLENIYOR ========== */
          <section style={{ marginTop: '140px', minHeight: 'calc(100vh - 140px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="text-center">
              <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}></div>
              <p className="mt-3 text-muted">Yükleniyor...</p>
            </div>
          </section>
        ) : hasExistingApplication ? (
          /* ========== ZATEN BAŞVURU VAR ========== */
          <section className="existing-app-section py-100px md-py-80px sm-py-60px" style={{ marginTop: '140px', minHeight: 'calc(100vh - 140px)' }}>
            <div className="container">
              <div className="row justify-content-center">
                <div className="col-lg-8 col-md-10 text-center">
                  <div className="existing-app-icon mb-30px">
                    <i className="bi bi-check-circle-fill"></i>
                  </div>

                  <h1 className="alt-font text-dark-gray fw-700 mb-20px lh-52 md-lh-44 sm-lh-40">
                    Zaten Bir Başvurunuz Var
                  </h1>

                  <p className="text-dark-gray lh-32 fs-18 mb-15px">
                    <strong>{config.shortName}</strong> için daha önce bir başvuru yapmışsınız.
                  </p>

                  <div className="existing-app-card mb-40px">
                    <div className="app-card-row">
                      <span className="app-card-label">Başvuru No</span>
                      <span className="app-card-value">{existingApp.applicationNumber || '-'}</span>
                    </div>
                    <div className="app-card-row">
                      <span className="app-card-label">Durum</span>
                      <span className={`app-status-badge status-${existingApp.status}`}>
                        {existingApp.status === 'pending' ? 'Beklemede' :
                         existingApp.status === 'under_review' ? 'İnceleniyor' :
                         existingApp.status === 'approved' ? 'Onaylandı' :
                         existingApp.status === 'rejected' ? 'Reddedildi' :
                         existingApp.status === 'withdrawn' ? 'Geri Çekildi' :
                         existingApp.status}
                      </span>
                    </div>
                    <div className="app-card-row">
                      <span className="app-card-label">Başvuru Tarihi</span>
                      <span className="app-card-value">
                        {existingApp.createdAt ? new Date(existingApp.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                      </span>
                    </div>
                  </div>

                  <div className="info-notification mb-40px">
                    <i className="bi bi-info-circle-fill me-2"></i>
                    <span>Başvurunuzun durumunu &quot;Başvurularım&quot; sayfasından takip edebilirsiniz.</span>
                  </div>

                  <div className="d-flex gap-3 justify-content-center flex-wrap">
                    <Link href="/basvurularim" className="btn-modern-apply btn-primary-action">
                      <i className="bi bi-folder-fill"></i>
                      <span>Başvurularım</span>
                    </Link>
                    <Link href="/" className="btn-modern-apply btn-secondary-action">
                      <i className="bi bi-house-door-fill"></i>
                      <span>Ana Sayfa</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : config.applicationOpen ? (
          /* ========== BAŞVURU FORMU AÇIK ========== */
          <ApplicationForm />
        ) : (
          /* ========== BAŞVURULAR KAPALI ========== */
        <section className="application-closed-section py-100px md-py-80px sm-py-60px" style={{ marginTop: '140px', minHeight: 'calc(100vh - 140px)' }}>
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-8 col-md-10 text-center">
                {/* Icon */}
                <div className="closed-icon mb-40px">
                  <i className="bi bi-lock-fill"></i>
                </div>

                {/* Header */}
                <div className="inline-block mb-30px">
                  <span className="ps-25px pe-25px pt-8px pb-8px text-uppercase alt-font text-red fs-13 lh-28 fw-600 border-radius-100px d-inline-flex align-items-center" style={{ background: '#fee2e2' }}>
                    <i className="bi bi-x-circle fs-16 me-10px"></i>
                    Başvurular Kapatıldı
                  </span>
                </div>
                
                <h1 className="alt-font text-dark-gray fw-700 mb-25px lh-52 md-lh-44 sm-lh-40">
                    {config.shortName} <br />
                  <span className="text-red">Başvurular Sona Ermiştir</span>
                </h1>

                <p className="text-dark-gray lh-32 fs-18 mb-40px">
                    {config.closedMessages?.application || 'Başvuru süreci şu an kapalıdır.'}
                  <br />
                  Diğer programlarımız ve etkinliklerimiz için takipte kalın.
                </p>

                {/* Info Notification */}
                <div className="info-notification mb-40px">
                  <i className="bi bi-bell-fill me-2"></i>
                    <span>Başvurunuz varsa &quot;Başvurularım&quot; sayfasından takip edebilirsiniz</span>
                </div>

                {/* Actions */}
                <div className="d-flex gap-3 justify-content-center flex-wrap">
                  <Link href="/" className="btn-modern-apply">
                    <i className="bi bi-house-door-fill"></i>
                    <span>Ana Sayfa</span>
                  </Link>
                  <Link href="/basvurularim" className="btn-modern-apply">
                    <i className="bi bi-folder-fill"></i>
                    <span>Başvurularım</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
        )}
      </Layout>

      <style jsx>{`
        .application-closed-section,
        .existing-app-section {
          background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
        }

        .closed-icon {
          font-size: 100px;
          color: #ef4444;
          animation: fadeIn 0.6s ease-out;
        }

        .existing-app-icon {
          font-size: 100px;
          color: #10b981;
          animation: fadeIn 0.6s ease-out;
        }

        .existing-app-card {
          display: inline-block;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 16px;
          padding: 24px 36px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
          text-align: left;
          min-width: 340px;
        }

        .app-card-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .app-card-row:last-child {
          border-bottom: none;
        }

        .app-card-label {
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
        }

        .app-card-value {
          font-size: 14px;
          color: #111827;
          font-weight: 600;
        }

        .app-status-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
        }

        .app-status-badge.status-pending {
          background: #fef3c7;
          color: #d97706;
        }

        .app-status-badge.status-under_review {
          background: #dbeafe;
          color: #2563eb;
        }

        .app-status-badge.status-approved {
          background: #dcfce7;
          color: #16a34a;
        }

        .app-status-badge.status-rejected {
          background: #fee2e2;
          color: #dc2626;
        }

        .app-status-badge.status-withdrawn {
          background: #f3f4f6;
          color: #6b7280;
        }

        .info-notification {
          display: inline-flex;
          align-items: center;
          padding: 15px 25px;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border-radius: 50px;
          color: #1e40af;
          font-size: 15px;
          font-weight: 500;
          border: 2px solid #3b82f6;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.2);
        }

        .text-red {
          color: #ef4444;
        }

        .btn-modern-apply {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding: 16px 32px;
          background: linear-gradient(135deg, #042070 0%, #2563eb 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(4, 32, 112, 0.3);
        }

        .btn-modern-apply:hover {
          background: linear-gradient(135deg, #2563eb 0%, #042070 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(4, 32, 112, 0.4);
          color: white;
        }

        .btn-secondary-action {
          background: white;
          color: #374151;
          border: 2px solid #e5e7eb;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .btn-secondary-action:hover {
          background: #f9fafb;
          border-color: #2563eb;
          color: #2563eb;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @media (max-width: 767px) {
          .closed-icon,
          .existing-app-icon {
            font-size: 70px;
          }

          h1 {
            font-size: 26px !important;
          }

          .info-notification {
            font-size: 14px;
            padding: 12px 20px;
          }

          .btn-modern-apply {
            font-size: 14px;
            padding: 14px 24px;
          }

          .existing-app-card {
            min-width: auto;
            width: 100%;
            padding: 20px 24px;
          }
        }
      `}</style>
    </PrivateRoute>
  )
}
