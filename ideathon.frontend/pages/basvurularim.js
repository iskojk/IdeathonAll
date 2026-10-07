/**
 * Başvurularım (My Applications) Page
 * Kullanıcının başvurularını listeleme ve yönetme
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import Loading from '@/components/Loading';
import ErrorMessage from '@/components/ErrorMessage';
import { applicationsAPI } from '@/lib/api';
import { toast } from '@/components/Toast';
import { useIdeathonConfig, useIdeathon } from '@/context/IdeathonContext';
import { getIdeathonConfig } from '@/config/ideathonConfig';

export default function Basvurularim() {
  const router = useRouter();
  const config = useIdeathonConfig();
  const { hasSlug, slug } = useIdeathon();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [withdrawingId, setWithdrawingId] = useState(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);
  const [selectedApplicationNumber, setSelectedApplicationNumber] = useState('');
  
  // Presentation V2 states
  const [expandedPresentations, setExpandedPresentations] = useState({});
  const [presentationData, setPresentationData] = useState({});
  const [loadingPresentation, setLoadingPresentation] = useState({});
  const [uploadingFile, setUploadingFile] = useState(null);
  const [savingDescription, setSavingDescription] = useState(null);
  const [projectDescriptions, setProjectDescriptions] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState({ applicationId: null, fileName: '' });
  
  // Success/Error Modal
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultModal, setResultModal] = useState({ type: 'success', message: '' });

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await applicationsAPI.getMyApplications();
      
      if (response.success) {
        setApplications(response.data || []);
      } else {
        setError('Başvurular yüklenirken bir hata oluştu');
      }
    } catch (err) {
      // 401 hatası durumunda otomatik olarak login'e yönlendirilecek (api.js'de handle ediliyor)
      // Diğer hataları göster
      if (err.status !== 401) {
        setError(err.message || 'Başvurular yüklenirken bir hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  };

  const openWithdrawModal = (applicationId, applicationNumber) => {
    setSelectedApplicationId(applicationId);
    setSelectedApplicationNumber(applicationNumber);
    setShowWithdrawModal(true);
  };

  const closeWithdrawModal = () => {
    setShowWithdrawModal(false);
    setSelectedApplicationId(null);
    setSelectedApplicationNumber('');
  };

  const confirmWithdraw = async () => {
    if (!selectedApplicationId) return;

    try {
      setWithdrawingId(selectedApplicationId);
      setError('');
      closeWithdrawModal();
      
      const response = await applicationsAPI.withdrawMyApplication(
        selectedApplicationId,
        '' // reason is optional
      );

      if (response.success) {
        // Refresh applications list
        await fetchApplications();
        toast.success('Başvurunuz başarıyla iptal edildi');
      } else {
        const errorMsg = 'Başvuru iptal edilirken bir hata oluştu';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      // 401 hatası durumunda otomatik olarak login'e yönlendirilecek (api.js'de handle ediliyor)
      // Diğer hataları göster
      if (err.status !== 401) {
        const errorMsg = err.message || 'Başvuru iptal edilirken bir hata oluştu';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } finally {
      setWithdrawingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { text: 'Beklemede', class: 'badge-pending', icon: 'bi-clock' },
      under_review: { text: 'İnceleniyor', class: 'badge-review', icon: 'bi-eye' },
      approved: { text: 'Onaylandı', class: 'badge-approved', icon: 'bi-check-circle' },
      rejected: { text: 'Reddedildi', class: 'badge-rejected', icon: 'bi-x-circle' },
      withdrawn: { text: 'İptal Edildi', class: 'badge-withdrawn', icon: 'bi-slash-circle' },
    };

    const statusInfo = statusMap[status] || statusMap.pending;

    return (
                        <div className={`status-badge ${statusInfo.class}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '50px', fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap', border: '1px solid #f3f4f6' }}>
                          <i className={`bi ${statusInfo.icon} me-2`}></i>
                          {statusInfo.text}
                        </div>
    );
  };

  const getParticipantStatusBadge = (participantStatus) => {
    const statusMap = {
      not_participant: { text: 'Katılımcı Değil', class: 'badge-not-participant' },
      participant: { text: 'Katılımcı', class: 'badge-participant' },
      grouped: { text: 'Gruplandırıldı', class: 'badge-grouped' },
    };

    const statusInfo = statusMap[participantStatus] || statusMap.not_participant;

    return (
      <span className={`participant-badge ${statusInfo.class}`}>
        {statusInfo.text}
      </span>
    );
  };

  const canEdit = (application) => {
    // Config yüklenirken engelleme, yüklendikten sonra flag'e bak
    if (!config.loading && !config.applicationEditOpen) return false;
    return application.status === 'pending' || application.status === 'under_review';
  };

  const canWithdraw = (application) => {
    if (application.status === 'pending') return true;
    if (!config.loading && !config.applicationWithdrawOpen) return false;
    return application.status === 'under_review';
  };

  const canShowPresentation = (application) => {
    // Config yüklenirken engelleme, yüklendikten sonra flag'e bak
    if (!config.loading && !config.presentationUploadOpen) return false;
    // Statü önemli değil — presentationUploadOpen açıksa herkes yükleyebilir
    return true;
  };

  // Presentation V2 Functions
  const togglePresentation = async (applicationId) => {
    const isExpanded = expandedPresentations[applicationId];
    
    setExpandedPresentations(prev => ({
      ...prev,
      [applicationId]: !isExpanded
    }));

    // İlk açılışta veriyi çek
    if (!isExpanded && presentationData[applicationId] === undefined) {
      try {
        setLoadingPresentation(prev => ({ ...prev, [applicationId]: true }));
        const response = await applicationsAPI.getPresentationInfo(applicationId);
        
        
        if (response && (response.success || response.data)) {
          const data = response.data || {};
          
          // presentationFile geçerli mi kontrol et (boş obje {} olabilir)
          const hasValidFile = data.presentationFile 
            && typeof data.presentationFile === 'object'
            && data.presentationFile.originalName;
          
          setPresentationData(prev => ({
            ...prev,
            [applicationId]: {
              presentationFile: hasValidFile ? data.presentationFile : null,
              projectDescription: data.projectDescription || null,
              lastUpdatedAt: data.lastUpdatedAt || null
            }
          }));
          
          // Description varsa state'e ekle
          if (data.projectDescription) {
            setProjectDescriptions(prev => ({
              ...prev,
              [applicationId]: data.projectDescription
            }));
          }
        } else {
          // Response yoksa veya başarısızsa boş veri set et
          setPresentationData(prev => ({
            ...prev,
            [applicationId]: { 
              presentationFile: null, 
              projectDescription: null,
              lastUpdatedAt: null
            }
          }));
        }
      } catch (err) {
        console.error('❌ Get presentation error:', err);
        if (err.status !== 401) {
          showErrorModal('Sunum bilgileri yüklenirken hata oluştu');
        }
        // Hata durumunda da boş veri set et
        setPresentationData(prev => ({
          ...prev,
          [applicationId]: { 
            presentationFile: null, 
            projectDescription: null,
            lastUpdatedAt: null
          }
        }));
      } finally {
        setLoadingPresentation(prev => ({ ...prev, [applicationId]: false }));
      }
    }
  };

  const handleFileUpload = async (applicationId, file) => {
    if (!file) return;

    // Dosya boyutu kontrolü (70MB)
    if (file.size > 70 * 1024 * 1024) {
      showErrorModal('Dosya boyutu 70MB\'dan küçük olmalıdır');
      return;
    }

    try {
      setUploadingFile(applicationId);
      const response = await applicationsAPI.uploadPresentation(applicationId, file);
      
      
      // Response kontrolü - success olabilir veya data direkt gelebilir
      const isSuccess = response?.success === true || response?.data;
      
      if (isSuccess) {
        showSuccessModal('Sunum dosyası başarıyla yüklendi!');
        
        // Response data'yı kontrol et ve güncelle
        const presentationInfo = response.data?.presentationInfo || response.data || response;
        
        
        setPresentationData(prev => ({
          ...prev,
          [applicationId]: presentationInfo
        }));
      } else {
        const errorMsg = response?.message || 'Dosya yüklenirken hata oluştu';
        console.error('❌ Upload Error:', errorMsg);
        showErrorModal(errorMsg);
      }
    } catch (err) {
      console.error('❌ File upload error:', err);
      if (err.status !== 401) {
        showErrorModal(err.message || 'Dosya yüklenirken hata oluştu');
      }
    } finally {
      setUploadingFile(null);
      // Input'u temizle
      const fileInput = document.getElementById(`file-input-${applicationId}`);
      if (fileInput) fileInput.value = '';
    }
  };

  const handleDescriptionSave = async (applicationId) => {
    const description = projectDescriptions[applicationId] || '';
    const trimmedDescription = description.trim();
    
    // Boş açıklama için backend'e gitme (isteğe bağlı)
    if (!trimmedDescription) {
      showSuccessModal('Proje açıklaması isteğe bağlıdır. Dilediğiniz zaman ekleyebilirsiniz.');
      return;
    }
    
    if (trimmedDescription.length > 5000) {
      showErrorModal('Proje açıklaması en fazla 5000 karakter olabilir');
      return;
    }

    try {
      setSavingDescription(applicationId);
      const response = await applicationsAPI.updateProjectDescription(applicationId, trimmedDescription);
      
      
      // Response kontrolü - success olabilir veya data direkt gelebilir
      const isSuccess = response?.success === true || response?.data;
      
      if (isSuccess) {
        showSuccessModal('Proje açıklaması başarıyla kaydedildi!');
        
        // Response data'yı kontrol et ve güncelle
        const presentationInfo = response.data?.presentationInfo || response.data || response;
        
        
        setPresentationData(prev => ({
          ...prev,
          [applicationId]: presentationInfo
        }));
      } else {
        const errorMsg = response?.message || 'Açıklama kaydedilirken hata oluştu';
        console.error('❌ Description Error:', errorMsg);
        showErrorModal(errorMsg);
      }
    } catch (err) {
      console.error('❌ Description save error:', err);
      if (err.status !== 401) {
        showErrorModal(err.message || 'Açıklama kaydedilirken hata oluştu');
      }
    } finally {
      setSavingDescription(null);
    }
  };

  const openDeleteModal = (applicationId, fileName) => {
    setFileToDelete({ applicationId, fileName });
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setFileToDelete({ applicationId: null, fileName: '' });
  };

  // Result Modal Functions
  const showSuccessModal = (message) => {
    setResultModal({ type: 'success', message });
    setShowResultModal(true);
    setTimeout(() => setShowResultModal(false), 3000);
  };

  const showErrorModal = (message) => {
    setResultModal({ type: 'error', message });
    setShowResultModal(true);
    setTimeout(() => setShowResultModal(false), 4000);
  };

  const closeResultModal = () => {
    setShowResultModal(false);
  };

  const confirmFileDelete = async () => {
    const { applicationId } = fileToDelete;
    if (!applicationId) return;

    closeDeleteModal();

    try {
      const response = await applicationsAPI.deletePresentationFile(applicationId);
      
      
      // Response kontrolü - success olabilir veya data direkt gelebilir
      const isSuccess = response?.success === true || response?.data;
      
      if (isSuccess) {
        showSuccessModal('Sunum dosyası başarıyla silindi!');
        
        // Response data'yı kontrol et ve güncelle
        const presentationInfo = response.data?.presentationInfo || response.data || response;
        
        
        setPresentationData(prev => ({
          ...prev,
          [applicationId]: presentationInfo
        }));
      } else {
        const errorMsg = response?.message || 'Dosya silinirken hata oluştu';
        console.error('❌ Delete Error:', errorMsg);
        showErrorModal(errorMsg);
      }
    } catch (err) {
      console.error('❌ File delete error:', err);
      if (err.status !== 401) {
        showErrorModal(err.message || 'Dosya silinirken hata oluştu');
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (mimetype) => {
    if (!mimetype) return 'bi-file-earmark';
    if (mimetype.includes('pdf')) return 'bi-file-pdf';
    if (mimetype.includes('word') || mimetype.includes('document')) return 'bi-file-word';
    if (mimetype.includes('powerpoint') || mimetype.includes('presentation')) return 'bi-file-ppt';
    if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return 'bi-file-excel';
    if (mimetype.includes('image')) return 'bi-file-image';
    if (mimetype.includes('video')) return 'bi-file-play';
    if (mimetype.includes('zip') || mimetype.includes('rar') || mimetype.includes('7z')) return 'bi-file-zip';
    return 'bi-file-earmark';
  };

  const getIdeathonLabel = (application) => {
    const slug = application?.ideathonSlug || application?.event || ''
    if (!slug) return null
    const cfg = getIdeathonConfig(slug)
    return cfg?.shortName || slug
  }

  if (!hasSlug && !config.loading) {
    return (
      <PrivateRoute>
        <Head>
          <title>Başvurularım - Emlak Konut Ideathon</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <Layout>
          <section style={{ marginTop: '140px', minHeight: 'calc(100vh - 140px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="container">
              <div className="row justify-content-center">
                <div className="col-lg-8 col-md-10 text-center">
                  <div style={{ fontSize: '80px', color: '#f59e0b', marginBottom: '24px' }}>
                    <i className="bi bi-exclamation-triangle-fill"></i>
                  </div>
                  <h2 className="alt-font text-dark-gray fw-700 mb-20px">
                    Ideathon Seçimi Gerekli
                  </h2>
                  <p className="text-dark-gray lh-28 fs-18 mb-30px">
                    Başvurularınızı görüntülemek için önce bir Ideathon programı seçmelisiniz.
                  </p>
                  <Link href="/" className="btn-modern-apply" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '12px',
                    padding: '16px 32px', background: 'linear-gradient(135deg, #042070 0%, #2563eb 100%)',
                    color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px',
                    fontWeight: '600', textDecoration: 'none', boxShadow: '0 4px 15px rgba(4, 32, 112, 0.3)'
                  }}>
                    <i className="bi bi-grid-3x3-gap-fill"></i>
                    <span>Ideathon Seç</span>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </Layout>
      </PrivateRoute>
    );
  }

  if (loading) {
    return (
      <PrivateRoute>
        <Head>
          <title>Başvurularım - Emlak Konut Ideathon</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>

        <Layout>
          <section className="applications-section py-100px md-py-80px sm-py-60px" style={{ marginTop: '140px' }}>
            <div className="container">
              {/* Page Header */}
              <div className="row justify-content-center mb-60px">
                <div className="col-lg-10 col-md-12 text-center">
                  <div className="inline-block mb-30px">
                    <span className="ps-25px pe-25px pt-8px pb-8px text-uppercase alt-font text-primary-blue fs-13 lh-28 fw-600 border-radius-100px bg-primary-blue-light d-inline-flex align-items-center">
                      <i className="bi bi-file-earmark-text fs-16 me-10px"></i>
                    </span>
                  </div>
                  <h2 className="alt-font text-dark-gray fw-700 mb-25px lh-52 md-lh-44 sm-lh-60">
                    Başvurularım
                  </h2>
                  <p className="w-70 md-w-90 mx-auto text-dark-gray lh-28">
                    Başvuru geçmişinizi görüntüleyin ve yönetin.
                  </p>
                </div>
              </div>

              {/* Loading Preloader */}
              <div className="applications-preloader">
                <div className="preloader-container">
                  <div className="preloader-spinner"></div>
                  <h3 className="preloader-title">Başvurularınız yükleniyor...</h3>
                  <p className="preloader-subtitle">Lütfen bekleyin</p>
                </div>
              </div>
            </div>
          </section>

          <style jsx>{`
            .applications-preloader {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 400px;
              padding: 40px 20px;
            }

            .preloader-container {
              text-align: center;
              max-width: 400px;
            }

            .preloader-spinner {
              width: 60px;
              height: 60px;
              border: 4px solid rgba(37, 99, 235, 0.1);
              border-left: 4px solid #2563eb;
              border-radius: 50%;
              animation: preloader-spin 1s linear infinite;
              margin: 0 auto 30px;
            }

            .preloader-title {
              color: #042070;
              font-size: 24px;
              font-weight: 600;
              margin-bottom: 10px;
              font-family: 'Inter', sans-serif;
            }

            .preloader-subtitle {
              color: #6b7280;
              font-size: 16px;
              margin: 0;
            }

            @keyframes preloader-spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }

            @media (max-width: 576px) {
              .preloader-spinner {
                width: 50px;
                height: 50px;
                border-width: 3px;
              }

              .preloader-title {
                font-size: 20px;
              }

              .preloader-subtitle {
                font-size: 14px;
              }
            }
          `}</style>
        </Layout>
      </PrivateRoute>
    );
  }

  return (
    <PrivateRoute>
      <Head>
        <title>Başvurularım - Emlak Konut Ideathon</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <Layout>
        <section className="applications-section py-100px md-py-80px sm-py-60px" style={{ marginTop: '140px' }}>
          <div className="container">
            {/* Page Header */}
            <div className="row justify-content-center mb-60px">
              <div className="col-lg-10 col-md-12 text-center">
                <div className="inline-block mb-30px">
                  <span className="ps-25px pe-25px pt-8px pb-8px text-uppercase alt-font text-primary-blue fs-13 lh-28 fw-600 border-radius-100px bg-primary-blue-light d-inline-flex align-items-center">
                    <i className="bi bi-file-earmark-text fs-20 me-10px"></i>
                  </span>
                </div>
                <h1 className="alt-font text-dark-gray fw-700 mb-20px lh-52 md-lh-44 sm-lh-40">
                  Başvurularım
                </h1>
                <p className="text-dark-gray lh-28 fs-18 mb-0">Başvurularınızı görüntüleyin ve yönetin</p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="row justify-content-center mb-40px">
                <div className="col-lg-10">
                  <ErrorMessage 
                    message={error} 
                    onClose={() => setError('')}
                    type="error"
                  />
                </div>
              </div>
            )}

            {/* Applications List */}
            <div className="row justify-content-center">
              <div className="col-lg-10 col-md-12">
                {applications.length === 0 ? (
                  /* No Applications */
                  <div className="empty-state bg-white border-radius-20px box-shadow-large p-60px text-center">
                    {(!config.loading && !config.applicationOpen) ? (
                      <>
                        <div className="empty-icon mb-30px">
                          <i className="bi bi-lock-fill"></i>
                        </div>
                        <h3 className="alt-font text-dark-gray fw-600 mb-15px">Başvuru Süreci Kapalı</h3>
                        <p className="text-dark-gray lh-28 fs-16 mb-20px">
                          {config.closedMessages?.application || 'Başvuru süreci şu an kapalıdır.'}
                        </p>
                        <div className="info-notification" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#f0f4ff', padding: '12px 20px', borderRadius: '10px', color: '#2563eb' }}>
                          <i className="bi bi-bell-fill"></i>
                          <span>Yeni programlarımız ve etkinliklerimiz için takipte kalın!</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="empty-icon mb-30px">
                          <i className="bi bi-file-earmark-plus"></i>
                        </div>
                        <h3 className="alt-font text-dark-gray fw-600 mb-15px">Henüz Başvurunuz Yok</h3>
                        <p className="text-dark-gray lh-28 fs-16 mb-20px">
                          Henüz bir başvuru yapmadınız. Hemen başvurunuzu oluşturun!
                        </p>
                        {!config.loading && (
                          <button
                            onClick={() => router.push('/basvuru')}
                            className="btn-action btn-edit"
                          >
                            <i className="bi bi-plus-circle"></i>
                            <span>Başvuru Yap</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  /* Applications Grid */
                  <div className="applications-grid">
                    {applications.map((application) => (
                      <div key={application._id} className="application-card bg-white border-radius-20px box-shadow-large p-40px md-p-30px">
                        {/* Ideathon Etiketi */}
                        {getIdeathonLabel(application) && (
                          <div className="ideathon-label-badge">
                            <i className="bi bi-geo-alt-fill me-1"></i>
                            {getIdeathonLabel(application)}
                          </div>
                        )}

                        {/* Card Header */}
                        <div className="application-header mb-25px">
                          <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                            <div>
                              <h3 className="alt-font text-dark-gray fw-600 fs-22 mb-10px">
                                {application.personalInfo?.firstName} {application.personalInfo?.lastName}
                              </h3>
                              <p className="text-dark-gray fs-14 mb-0">
                                <i className="bi bi-calendar3 me-2"></i>
                                Başvuru Tarihi: {new Date(application.createdAt).toLocaleDateString('tr-TR')}
                              </p>
                            </div>
                            {getStatusBadge(application.status)}
                          </div>
                        </div>

                        {/* Bilgilendirme Notu - Duruma Göre */}
                        {(application.status === 'pending' || application.status === 'under_review') && (
                          <div className="review-notification">
                            <div className="review-icon">
                              <i className="bi bi-clock-history"></i>
                            </div>
                            <div className="review-content">
                              <p className="review-text">
                                Başvurunuz incelemeye alınmıştır. Sonuçlar değerlendirme süreci tamamlandığında açıklanacaktır.
                              </p>
                            </div>
                          </div>
                        )}

                        {application.status === 'approved' && (
                          <div className="approved-notification">
                            <div className="approved-icon">
                              <i className="bi bi-check-circle-fill"></i>
                            </div>
                            <div className="approved-content">
                              <p className="approved-text">
                                <strong>Tebrikler!</strong> Başvurunuz onaylanmıştır. Ideathon programına katılım hakkı kazandınız! 🎉
                                <br /><br />
                                Etkinlik detayları, lokasyon ve program akışı ile ilgili bilgilendirme e-posta ve SMS yoluyla 
                                tarafınıza iletilecektir. Lütfen iletişim bilgilerinizi kontrol ediniz.
                              </p>
                            </div>
                          </div>
                        )}

                        {application.status === 'rejected' && (
                          <div className="rejected-notification">
                            <div className="rejected-icon">
                              <i className="bi bi-info-circle-fill"></i>
                            </div>
                            <div className="rejected-content">
                              <p className="rejected-text">
                                Başvurunuz değerlendirilmiş olup, maalesef bu dönem için programa dahil edilememiştir. 
                                <br /><br />
                                Gösterdiğiniz ilgi ve ayırdığınız zaman için teşekkür ederiz. Gelecek dönemlerde düzenlenecek 
                                programlarımızda sizleri aramızda görmekten mutluluk duyacağız. 🙏
                              </p>
                            </div>
                          </div>
                        )}

                        {application.status === 'withdrawn' && (
                          <div className="withdrawn-notification">
                            <div className="withdrawn-icon">
                              <i className="bi bi-x-circle-fill"></i>
                            </div>
                            <div className="withdrawn-content">
                              <p className="withdrawn-text">
                                Başvurunuz tarafınızca geri çekilmiştir. Gelecek programlarımızda tekrar başvurabilirsiniz.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Card Body */}
                        <div className="application-body mb-25px">
                          <div className="info-row">
                            <span className="info-label">Başvuru No:</span>
                            <span className="info-value fw-600">{application.applicationNumber}</span>
                          </div>
                          <div className="info-row">
                            <span className="info-label">E-posta:</span>
                            <span className="info-value">{application.personalInfo?.email}</span>
                          </div>
                          <div className="info-row">
                            <span className="info-label">Katılımcı Tipi:</span>
                            <span className="info-value text-capitalize">
                              {application.profileInfo?.participantType === 'student' ? 'Öğrenci' :
                               application.profileInfo?.participantType === 'entrepreneur' ? 'Girişimci' :
                               application.profileInfo?.participantType === 'employee' ? 'Çalışan' :
                               application.profileInfo?.participantType === 'recent_graduate' ? 'Yeni Mezun' :
                               'Diğer'}
                            </span>
                          </div>
                        </div>

                        {/* Sunum Yükleme Alanı */}
                        {canShowPresentation(application) && (
                          <div className="presentation-section">
                            <button
                              className="presentation-toggle-btn"
                              onClick={() => togglePresentation(application._id)}
                            >
                              <div className="toggle-btn-content">
                                <div className="toggle-btn-icon">
                                  <i className="bi bi-file-earmark-slides"></i>
                                </div>
                                <div className="toggle-btn-text">
                                  <span className="toggle-btn-title">Sunum & Proje Açıklaması</span>
                                  <span className="toggle-btn-subtitle">
                                    {presentationData[application._id]?.presentationFile
                                      ? 'Dosya yüklendi ✓'
                                      : 'Sunum dosyası yükleyin'}
                                  </span>
                                </div>
                              </div>
                              <i className={`bi toggle-arrow ${expandedPresentations[application._id] ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
                            </button>

                            {expandedPresentations[application._id] && (
                              <div className="presentation-content">
                                {loadingPresentation[application._id] ? (
                                  <div className="presentation-loading">
                                    <i className="bi bi-arrow-repeat spinning"></i>
                                    <span>Yükleniyor...</span>
                                  </div>
                                ) : (
                                  <>
                                    {/* Son Tarih Uyarısı */}
                                    <div className="presentation-deadline-alert">
                                      <div className="deadline-alert-icon">
                                        <i className="bi bi-alarm-fill"></i>
                                      </div>
                                      <div className="deadline-alert-content">
                                        <strong>Uyarı:</strong> 18 Nisan Cumartesi günü 23:59&apos;a kadar sunumlarınızı yüklemeniz gerekmektedir.
                                      </div>
                                    </div>

                                    {/* Dosya Yükleme */}
                                    <div className="presentation-upload-section">
                                      <h5 className="presentation-section-title">
                                        <i className="bi bi-cloud-upload me-2"></i>
                                        Sunum Dosyası
                                      </h5>
                                      <p className="presentation-section-desc">
                                        PDF, PPT, PPTX, DOC, DOCX formatlarında dosya yükleyebilirsiniz. (Maks. 70MB)
                                      </p>

                                      {presentationData[application._id]?.presentationFile?.originalName ? (
                                        <div className="uploaded-file-card">
                                          <div className="file-card-icon">
                                            <i className={`bi ${getFileIcon(presentationData[application._id].presentationFile.mimetype)}`}></i>
                                          </div>
                                          <div className="file-card-info">
                                            <p className="file-name">{presentationData[application._id].presentationFile.originalName}</p>
                                            <p className="file-meta">
                                              {presentationData[application._id].presentationFile.size ? formatFileSize(presentationData[application._id].presentationFile.size) : ''}{presentationData[application._id].presentationFile.size && (presentationData[application._id].presentationFile.uploadedAt || presentationData[application._id].lastUpdatedAt) ? ' • ' : ''}{(presentationData[application._id].presentationFile.uploadedAt || presentationData[application._id].lastUpdatedAt) ? new Date(presentationData[application._id].presentationFile.uploadedAt || presentationData[application._id].lastUpdatedAt).toLocaleDateString('tr-TR') : ''}
                                            </p>
                                          </div>
                                          <div className="file-card-actions">
                                            {presentationData[application._id].presentationFile.url && (
                                              <a
                                                href={presentationData[application._id].presentationFile.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="file-download-btn"
                                                title="Dosyayı İndir"
                                                download
                                              >
                                                <i className="bi bi-download"></i>
                                              </a>
                                            )}
                                            <button
                                              className="file-delete-btn"
                                              onClick={() => openDeleteModal(application._id, presentationData[application._id].presentationFile.originalName)}
                                              title="Dosyayı Sil"
                                            >
                                              <i className="bi bi-trash"></i>
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="file-upload-area">
                                          <input
                                            type="file"
                                            id={`file-input-${application._id}`}
                                            className="file-input-hidden"
                                            accept=".pdf,.ppt,.pptx,.doc,.docx,.zip,.rar"
                                            onChange={(e) => handleFileUpload(application._id, e.target.files[0])}
                                          />
                                          <label
                                            htmlFor={`file-input-${application._id}`}
                                            className={`file-upload-label ${uploadingFile === application._id ? 'uploading' : ''}`}
                                          >
                                            {uploadingFile === application._id ? (
                                              <>
                                                <i className="bi bi-arrow-repeat spinning"></i>
                                                <span>Yükleniyor...</span>
                                              </>
                                            ) : (
                                              <>
                                                <i className="bi bi-cloud-arrow-up"></i>
                                                <span>Dosya seçmek için tıklayın</span>
                                              </>
                                            )}
                                          </label>
                                        </div>
                                      )}
                                    </div>

                                    {/* Sunum Şablonu */}
                                    {config.presentationTemplateUrl && (
                                      <div className="presentation-template-section">
                                        <h5 className="presentation-section-title">
                                          <i className="bi bi-file-earmark-ruled me-2"></i>
                                          Sunum Şablonu
                                        </h5>
                                        <p className="presentation-section-desc">
                                          Sunumunuzu hazırlarken aşağıdaki şablonu kullanabilirsiniz. Şablonu indirip düzenledikten sonra yukarıdan yükleyebilirsiniz.
                                        </p>
                                        <a
                                          href={config.presentationTemplateUrl}
                                          download
                                          className="template-download-card"
                                        >
                                          <div className="template-card-icon">
                                            <i className="bi bi-file-earmark-slides-fill"></i>
                                          </div>
                                          <div className="template-card-info">
                                            <p className="template-card-title">Sunum Şablonunu İndir</p>
                                            <p className="template-card-subtitle">
                                              {config.shortName || config.name || 'İdeathon'} sunum şablonu
                                            </p>
                                          </div>
                                          <div className="template-card-action">
                                            <i className="bi bi-download"></i>
                                          </div>
                                        </a>
                                      </div>
                                    )}

                                    {/* Proje Açıklaması */}
                                    {(!config.loading && config.projectDescriptionOpen) && (
                                      <div className="presentation-description-section">
                                        <h5 className="presentation-section-title">
                                          <i className="bi bi-card-text me-2"></i>
                                          Proje Açıklaması
                                        </h5>
                                        <p className="presentation-section-desc">
                                          Projenizi kısaca açıklayın (isteğe bağlı, maks. 5000 karakter)
                                        </p>
                                        <textarea
                                          className="project-description-textarea"
                                          rows="5"
                                          maxLength={5000}
                                          placeholder="Proje açıklamanızı buraya yazın..."
                                          value={projectDescriptions[application._id] || ''}
                                          onChange={(e) => setProjectDescriptions(prev => ({ ...prev, [application._id]: e.target.value }))}
                                          disabled={savingDescription === application._id}
                                        />
                                        <div className="description-footer">
                                          <span className="char-count">
                                            {(projectDescriptions[application._id] || '').length}/5000
                                          </span>
                                          <button
                                            className="save-description-btn"
                                            onClick={() => handleDescriptionSave(application._id)}
                                            disabled={savingDescription === application._id}
                                          >
                                            {savingDescription === application._id ? (
                                              <>
                                                <i className="bi bi-arrow-repeat spinning"></i>
                                                Kaydediliyor...
                                              </>
                                            ) : (
                                              <>
                                                <i className="bi bi-check-lg"></i>
                                                Kaydet
                                              </>
                                            )}
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Card Actions */}
                        <div className="application-actions">
                        {canWithdraw(application) && (
                            <button
                              onClick={() => openWithdrawModal(application._id, application.applicationNumber)}
                              className="btn-action btn-cancel-app"
                              disabled={withdrawingId === application._id}
                            >
                              <i className={`bi ${withdrawingId === application._id ? 'bi-arrow-repeat spinning' : 'bi-x-circle'}`}></i>
                              <span>{withdrawingId === application._id ? 'İptal Ediliyor...' : 'Başvurumu İptal Et'}</span>
                            </button>
                          )}
                          {canEdit(application) && (
                            <button
                              onClick={() => router.push(`/basvuru?edit=${application._id}`)}
                              className="btn-action btn-edit"
                            >
                              <i className="bi bi-pencil-square"></i>
                              <span>Başvuru Düzenle</span>
                            </button>
                          )}
                          
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </Layout>

      {/* Withdraw Confirmation Modal */}
      {showWithdrawModal && (
        <div className="modal-overlay" onClick={closeWithdrawModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              {/* Icon */}
              <div className="modal-icon">
                <i className="bi bi-exclamation-triangle-fill"></i>
              </div>

              {/* Title */}
              <h3 className="modal-title">Başvuruyu İptal Et</h3>

              {/* Message */}
              <p className="modal-message">
                <strong>{selectedApplicationNumber}</strong> numaralı başvurunuzu iptal etmek istediğinizden emin misiniz?
              </p>

              <div className="modal-warning">
                <i className="bi bi-info-circle me-2"></i>
                Bu işlem geri alınamaz. İptal edilen başvurular tekrar aktif edilemez.
              </div>

              {/* Actions */}
              <div className="modal-actions">
                <button 
                  onClick={closeWithdrawModal} 
                  className="modal-btn modal-btn-cancel"
                >
                  <i className="bi bi-x-lg"></i>
                  <span>Vazgeç</span>
                </button>
                <button 
                  onClick={confirmWithdraw} 
                  className="modal-btn modal-btn-confirm"
                >
                  <i className="bi bi-check-lg"></i>
                  <span>Evet, İptal Et</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete File Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              {/* Icon */}
              <div className="modal-icon modal-icon-delete">
                <i className="bi bi-trash-fill"></i>
              </div>

              {/* Title */}
              <h3 className="modal-title">Dosyayı Sil</h3>

              {/* Message */}
              <p className="modal-message">
                <strong>{fileToDelete.fileName}</strong> dosyasını silmek istediğinizden emin misiniz?
              </p>

              <div className="modal-warning">
                <i className="bi bi-info-circle me-2"></i>
                Bu işlem geri alınamaz.
              </div>

              {/* Actions */}
              <div className="modal-actions">
                <button 
                  onClick={closeDeleteModal} 
                  className="modal-btn modal-btn-cancel"
                >
                  <i className="bi bi-x-lg"></i>
                  <span>Vazgeç</span>
                </button>
                <button 
                  onClick={confirmFileDelete} 
                  className="modal-btn modal-btn-confirm"
                >
                  <i className="bi bi-trash"></i>
                  <span>Evet, Sil</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal (Success/Error) */}
      {showResultModal && (
        <div className="modal-overlay result-modal-overlay" onClick={closeResultModal}>
          <div className="modal-container result-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content result-modal-content">
              {/* Icon */}
              <div className={`modal-icon ${resultModal.type === 'success' ? 'modal-icon-success' : 'modal-icon-error'}`}>
                {resultModal.type === 'success' ? (
                  <i className="bi bi-check-circle-fill"></i>
                ) : (
                  <i className="bi bi-x-circle-fill"></i>
                )}
              </div>

              {/* Title */}
              <h3 className="modal-title">
                {resultModal.type === 'success' ? 'Başarılı!' : 'Hata!'}
              </h3>

              {/* Message */}
              <p className="modal-message">
                {resultModal.message}
              </p>

              {/* Close Button */}
              <button 
                onClick={closeResultModal} 
                className={`modal-btn-single ${resultModal.type === 'success' ? 'modal-btn-success' : 'modal-btn-error'}`}
              >
                <span>Tamam</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .empty-state {
          animation: fadeInUp 0.5s ease-out;
        }
        .empty-icon {
          font-size: 80px;
          color: #ef4444;
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
        .applications-grid {
          display: grid;
          gap: 30px;
        }
        .ideathon-label-badge {
          display: inline-flex;
          align-items: center;
          padding: 5px 14px;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          color: #1e40af;
          font-size: 12px;
          font-weight: 600;
          border-radius: 20px;
          border: 1px solid #bfdbfe;
          margin-bottom: 16px;
          letter-spacing: 0.2px;
        }
        .ideathon-label-badge i {
          font-size: 11px;
        }
        .application-card {
          animation: fadeInUp 0.5s ease-out;
          transition: transform 0.3s, box-shadow 0.3s;
          border: 1px solid #f3f4f6;
        }
        .application-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15) !important;
          border-color: #e5e7eb;
        }
        .application-header {
          padding-bottom: 20px;
          border-bottom: 2px solid #f3f4f6;
        }
        .application-body {
          padding: 20px 0;
        }
        .application-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          padding-top: 20px;
          border-top: 2px solid #f3f4f6;
        }
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 50px;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
        }
        .badge-pending {
          background: #fef3c7;
          color: #92400e;
        }
        .badge-review {
          background: #dbeafe;
          color: #1e3a8a;
        }
        .badge-approved {
          background: #d1fae5;
          color: #065f46;
        }
        .badge-rejected {
          background: #fee2e2;
          color: #991b1b;
        }
        .badge-withdrawn {
          background: #f3f4f6;
          color: #4b5563;
        }
        .participant-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 50px;
          font-size: 12px;
          font-weight: 600;
        }
        .badge-not-participant {
          background: #f3f4f6;
          color: #6b7280;
        }
        .badge-participant {
          background: #d1fae5;
          color: #065f46;
        }
        .badge-grouped {
          background: #e0e7ff;
          color: #3730a3;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .info-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .info-label {
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
          flex-shrink: 0;
          margin-right: 15px;
        }
        .info-value {
          font-size: 14px;
          color: #1f2937;
          font-weight: 500;
          text-align: right;
        }
        .btn-action {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 28px;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s ease;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          flex: 1;
          min-width: 150px;
        }
        .btn-action::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transition: left 0.5s;
        }
        .btn-action:hover::before {
          left: 100%;
        }
        .btn-edit {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: white;
        }
        .btn-edit:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
        }
        .btn-cancel-app {
          background: white;
          color: #dc2626;
          border: 2px solid #fecaca;
        }
        .btn-cancel-app:hover:not(:disabled) {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          color: white;
          border-color: transparent;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(220, 38, 38, 0.3);
        }
        .btn-cancel-app:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes spinning {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        :global(.spinning) {
          animation: spinning 1s linear infinite;
        }
        @media (max-width: 768px) {
          .info-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 5px;
          }
          .application-actions {
            flex-direction: column;
          }
          .btn-action {
            width: 100%;
            min-width: auto;
          }
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: fadeIn 0.3s ease-out;
          padding: 20px;
        }

        .modal-container {
          background: white;
          border-radius: 24px;
          max-width: 500px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease-out;
        }

        .modal-content {
          padding: 40px;
          text-align: center;
        }

        .modal-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          color: #dc2626;
          font-size: 40px;
          animation: bounce 0.6s ease-out;
        }

        .modal-icon-delete {
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          color: #dc2626;
        }

        .modal-icon-success {
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
          color: #10b981;
        }

        .modal-icon-error {
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          color: #ef4444;
        }

        .modal-title {
          font-size: 24px;
          font-weight: 700;
          color: #042070;
          margin-bottom: 16px;
          font-family: var(--primary-font);
        }

        .modal-message {
          font-size: 16px;
          color: #6b7280;
          line-height: 1.6;
          margin-bottom: 20px;
        }

        .modal-message strong {
          color: #042070;
          font-weight: 600;
        }

        .modal-warning {
          display: inline-flex;
          align-items: center;
          padding: 12px 20px;
          background: #fef3c7;
          border: 2px solid #fbbf24;
          border-radius: 12px;
          color: #92400e;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 30px;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .modal-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          flex: 1;
          justify-content: center;
          min-width: 140px;
        }

        .modal-btn-cancel {
          background: white;
          color: #6b7280;
          border: 2px solid #e5e7eb;
        }

        .modal-btn-cancel:hover {
          background: #f9fafb;
          border-color: #d1d5db;
          color: #374151;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .modal-btn-confirm {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
        }

        .modal-btn-confirm:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(220, 38, 38, 0.4);
        }

        /* Result Modal Specific Styles */
        .result-modal-overlay {
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(6px);
        }

        .result-modal-container {
          animation: zoomIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .result-modal-content {
          text-align: center;
          padding: 48px 40px;
        }

        .modal-btn-single {
          width: 100%;
          padding: 16px 32px;
          font-size: 17px;
          font-weight: 700;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 24px;
        }

        .modal-btn-success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
        }

        .modal-btn-success:hover {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(16, 185, 129, 0.5);
        }

        .modal-btn-error {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
        }

        .modal-btn-error:hover {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(239, 68, 68, 0.5);
        }

        @keyframes zoomIn {
          from {
            opacity: 0;
            transform: scale(0.7);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }

        @media (max-width: 576px) {
          .modal-content {
            padding: 30px 20px;
          }

          .result-modal-content {
            padding: 40px 25px;
          }

          .modal-icon {
            width: 70px;
            height: 70px;
            font-size: 35px;
          }

          .modal-btn-single {
            padding: 14px 24px;
            font-size: 15px;
          }

          .modal-title {
            font-size: 20px;
          }

          .modal-message {
            font-size: 15px;
          }

          .modal-actions {
            flex-direction: column;
          }

          .modal-btn {
            width: 100%;
          }
        }

        /* Review Notification (Pending/Under Review) */
        .review-notification {
          margin-bottom: 20px;
          padding: 20px 24px;
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          border-left: 5px solid #3b82f6;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.2);
          animation: slideInRight 0.5s ease-out;
        }

        .review-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #3b82f6;
          font-size: 28px;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
        }

        .review-content {
          flex: 1;
        }

        .review-text {
          font-size: 15px;
          color: #1e3a8a;
          line-height: 1.6;
          margin: 0;
          font-weight: 500;
        }

        .review-text strong {
          font-weight: 700;
          color: #1e40af;
        }

        /* Approved Notification */
        .approved-notification {
          margin-bottom: 20px;
          padding: 24px 28px;
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
          border-left: 5px solid #10b981;
          border-radius: 12px;
          display: flex;
          align-items: flex-start;
          gap: 18px;
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.25);
          animation: slideInRight 0.5s ease-out;
        }

        .approved-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #10b981;
          font-size: 32px;
          flex-shrink: 0;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
          animation: bounce 0.6s ease-out;
        }

        .approved-content {
          flex: 1;
        }

        .approved-text {
          font-size: 15px;
          color: #065f46;
          line-height: 1.7;
          margin: 0;
          font-weight: 500;
        }

        .approved-text strong {
          font-weight: 700;
          color: #047857;
        }

        /* Rejected Notification */
        .rejected-notification {
          margin-bottom: 20px;
          padding: 24px 28px;
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          border-left: 5px solid #ef4444;
          border-radius: 12px;
          display: flex;
          align-items: flex-start;
          gap: 18px;
          box-shadow: 0 4px 15px rgba(239, 68, 68, 0.2);
          animation: slideInRight 0.5s ease-out;
        }

        .rejected-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ef4444;
          font-size: 32px;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
        }

        .rejected-content {
          flex: 1;
        }

        .rejected-text {
          font-size: 15px;
          color: #991b1b;
          line-height: 1.7;
          margin: 0;
          font-weight: 500;
        }

        .rejected-text strong {
          font-weight: 700;
          color: #7f1d1d;
        }

        /* Withdrawn Notification */
        .withdrawn-notification {
          margin-bottom: 20px;
          padding: 20px 24px;
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
          border-left: 5px solid #6b7280;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 4px 15px rgba(107, 114, 128, 0.15);
          animation: slideInRight 0.5s ease-out;
        }

        .withdrawn-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
          font-size: 28px;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(107, 114, 128, 0.2);
        }

        .withdrawn-content {
          flex: 1;
        }

        .withdrawn-text {
          font-size: 15px;
          color: #374151;
          line-height: 1.6;
          margin: 0;
          font-weight: 500;
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* V2 Ideathon Note */
        .ideathon-note {
          margin-top: 20px;
          padding: 20px 24px;
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-left: 4px solid #f59e0b;
          border-radius: 12px;
          display: flex;
          align-items: flex-start;
          gap: 16px;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
        }

        .note-icon {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #f59e0b;
          font-size: 22px;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
        }

        .note-content {
          flex: 1;
        }

        .note-text {
          font-size: 14px;
          color: #78350f;
          line-height: 1.6;
          margin: 0;
        }

        .note-text strong {
          font-weight: 700;
          color: #92400e;
        }

        /* V2 Template Download Section */
        .template-download-section {
          margin-top: 16px;
          padding: 0;
        }

        .template-card {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 20px 24px;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border: 2px solid #0ea5e9;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(14, 165, 233, 0.15);
          transition: all 0.3s ease;
        }

        .template-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(14, 165, 233, 0.25);
        }

        .template-icon {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 28px;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
        }

        .template-info {
          flex: 1;
        }

        .template-title {
          font-size: 16px;
          font-weight: 700;
          color: #0c4a6e;
          margin: 0 0 6px 0;
        }

        .template-description {
          font-size: 13px;
          color: #475569;
          margin: 0;
          line-height: 1.4;
        }

        .template-download-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px 24px;
          background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
          color: white;
          font-size: 14px;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(14, 165, 233, 0.2);
        }

        .template-download-btn:hover {
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4);
          transform: translateY(-1px);
          color: white;
        }

        .template-download-btn:active {
          transform: translateY(0);
        }

        /* V2 Presentation Styles */
        .presentation-section {
          margin-top: 16px;
          padding-top: 20px;
          border-top: 2px solid #f3f4f6;
        }

        .presentation-toggle-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .presentation-toggle-btn:hover {
          border-color: #042070;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(4, 32, 112, 0.1);
        }

        .toggle-btn-content {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
        }

        .toggle-btn-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, #042070 0%, #2563eb 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
          flex-shrink: 0;
        }

        .toggle-btn-text {
          display: flex;
          flex-direction: column;
          text-align: left;
        }

        .toggle-btn-title {
          font-size: 16px;
          font-weight: 600;
          color: #042070;
        }

        .toggle-btn-subtitle {
          font-size: 13px;
          color: #6b7280;
        }

        .toggle-arrow {
          font-size: 20px;
          color: #042070;
          transition: transform 0.3s ease;
        }

        .presentation-content {
          margin-top: 20px;
          padding: 24px;
          background: #f9fafb;
          border-radius: 16px;
          border: 1px solid #e5e7eb;
          animation: slideDown 0.3s ease-out;
        }

        .presentation-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          gap: 16px;
        }

        .presentation-loading i {
          font-size: 40px;
          color: #042070;
        }

        .presentation-loading span {
          font-size: 16px;
          color: #6b7280;
          font-weight: 500;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .presentation-deadline-alert {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 20px;
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 2px solid #f59e0b;
          border-radius: 12px;
          margin-bottom: 20px;
          animation: pulse-border 2s ease-in-out infinite;
        }

        @keyframes pulse-border {
          0%, 100% { border-color: #f59e0b; }
          50% { border-color: #dc2626; }
        }

        .deadline-alert-icon {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 20px;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        }

        .deadline-alert-content {
          font-size: 14px;
          color: #78350f;
          line-height: 1.5;
          font-weight: 500;
        }

        .deadline-alert-content strong {
          color: #dc2626;
          font-weight: 700;
        }

        .presentation-upload-section,
        .presentation-description-section {
          margin-bottom: 24px;
        }

        .presentation-description-section:last-child {
          margin-bottom: 0;
        }

        .presentation-section-title {
          font-size: 16px;
          font-weight: 600;
          color: #042070;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
        }

        .presentation-section-desc {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 16px;
        }

        /* File Upload Styles */
        .file-upload-area {
          position: relative;
        }

        .file-input-hidden {
          display: none;
        }

        .file-upload-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 40px 20px;
          background: white;
          border: 2px dashed #cbd5e1;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .file-upload-label:hover {
          border-color: #042070;
          background: #f8fafc;
        }

        .file-upload-label.uploading {
          pointer-events: none;
          opacity: 0.7;
        }

        .file-upload-label i {
          font-size: 36px;
          color: #042070;
        }

        .file-upload-label span {
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
        }

        .uploaded-file-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .uploaded-file-card:hover {
          border-color: #042070;
          box-shadow: 0 4px 12px rgba(4, 32, 112, 0.1);
        }

        .file-card-icon {
          width: 50px;
          height: 50px;
          border-radius: 10px;
          background: linear-gradient(135deg, #042070 0%, #2563eb 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
          flex-shrink: 0;
        }

        .file-card-info {
          flex: 1;
          min-width: 0;
        }

        .file-name {
          font-size: 15px;
          font-weight: 600;
          color: #042070;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .file-meta {
          font-size: 13px;
          color: #6b7280;
          margin: 0;
        }

        .file-card-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .file-download-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #dbeafe;
          border: none;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          flex-shrink: 0;
          text-decoration: none;
        }

        .file-download-btn:hover {
          background: #2563eb;
          color: white;
          transform: scale(1.1);
        }

        .file-delete-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #fee2e2;
          border: none;
          color: #dc2626;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }

        .file-delete-btn:hover {
          background: #dc2626;
          color: white;
          transform: scale(1.1);
        }

        /* Sunum Şablonu */
        .presentation-template-section {
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-bottom: 1px solid #e2e8f0;
        }

        .template-download-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border: 2px solid #bfdbfe;
          border-radius: 12px;
          text-decoration: none;
          color: inherit;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .template-download-card:hover {
          border-color: #2563eb;
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
        }

        .template-card-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: #2563eb;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
        }

        .template-card-info {
          flex: 1;
          min-width: 0;
        }

        .template-card-title {
          font-size: 15px;
          font-weight: 600;
          color: #1e3a8a;
          margin: 0 0 2px 0;
        }

        .template-card-subtitle {
          font-size: 13px;
          color: #3b82f6;
          margin: 0;
        }

        .template-card-action {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: white;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.1);
        }

        .template-download-card:hover .template-card-action {
          background: #2563eb;
          color: white;
          transform: scale(1.1);
        }

        /* Description Textarea */
        .project-description-textarea {
          width: 100%;
          padding: 16px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 14px;
          color: #042070;
          resize: vertical;
          transition: all 0.3s ease;
          font-family: inherit;
          line-height: 1.6;
        }

        .project-description-textarea:focus {
          outline: none;
          border-color: #042070;
          box-shadow: 0 0 0 4px rgba(4, 32, 112, 0.1);
        }

        .project-description-textarea:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .description-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 12px;
        }

        .char-count {
          font-size: 13px;
          color: #6b7280;
        }

        .save-description-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 24px;
          background: linear-gradient(135deg, #042070 0%, #2563eb 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .save-description-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(4, 32, 112, 0.3);
        }

        .save-description-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        /* Responsive for Presentation */
        @media (max-width: 768px) {
          .review-notification,
          .approved-notification,
          .rejected-notification,
          .withdrawn-notification {
            padding: 16px 18px;
            gap: 12px;
          }

          .review-icon,
          .withdrawn-icon {
            width: 44px;
            height: 44px;
            font-size: 24px;
          }

          .approved-icon,
          .rejected-icon {
            width: 48px;
            height: 48px;
            font-size: 28px;
          }

          .review-text,
          .approved-text,
          .rejected-text,
          .withdrawn-text {
            font-size: 14px;
          }

          .ideathon-note {
            padding: 16px 18px;
            gap: 12px;
          }

          .note-icon {
            width: 38px;
            height: 38px;
            font-size: 18px;
          }

          .note-text {
            font-size: 13px;
          }

          .template-card {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
            padding: 18px 20px;
          }

          .template-icon {
            width: 48px;
            height: 48px;
            font-size: 24px;
            align-self: center;
          }

          .template-info {
            text-align: center;
          }

          .template-title {
            font-size: 15px;
          }

          .template-description {
            font-size: 12px;
          }

          .template-download-btn {
            width: 100%;
            padding: 12px 20px;
            font-size: 13px;
          }

          .toggle-btn-icon {
            width: 40px;
            height: 40px;
            font-size: 20px;
          }

          .toggle-btn-title {
            font-size: 14px;
          }

          .toggle-btn-subtitle {
            font-size: 12px;
          }

          .presentation-content {
            padding: 16px;
          }

          .uploaded-file-card {
            padding: 16px;
          }

          .file-card-icon {
            width: 44px;
            height: 44px;
            font-size: 22px;
          }

          .description-footer {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }

          .save-description-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </PrivateRoute>
  );
}

