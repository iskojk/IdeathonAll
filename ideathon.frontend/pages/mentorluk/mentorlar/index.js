/**
 * Mentorlar Page
 * Mentor listesi, filtreleme ve pagination
 */

import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import ErrorMessage from '@/components/ErrorMessage';
import { SkeletonCard } from '@/components/Skeleton';
import { mentorNetAPI, messagingAPI } from '@/lib/api';
import { notify } from '@/components/Notification';
import { getInitials } from '@/lib/auth';

// Uzmanlik Alanlari Listesi
const EXPERTISE_AREAS = [
  "Satis", "Pazarlama", "SEO (Arama Motoru Optimizasyonu)", "Sosyal Medya Pazarlamasi",
  "Icerik Pazarlamasi", "Dijital Pazarlama", "E-Ticaret", "B2B Pazarlama", "B2C Pazarlama",
  "CRM (Musteri Iliskileri Yonetimi)", "Fiyatlandirma Stratejileri", "Marka Yonetimi",
  "Urun Yonetimi", "Pazar Arastirmasi", "Reklam ve Tanitim", "Halkla Iliskiler",
  "Etkinlik Pazarlamasi", "Is Gelistirme", "Muzakere Teknikleri", "Musteri Deneyimi (CX)",
  "Muhasebe", "Finansal Planlama", "Butceleme ve Maliyet Kontrolu", "Yatirim Yonetimi",
  "Risk Yonetimi", "Vergi Planlamasi", "Finansal Raporlama", "Finansal Analiz",
  "Hibeler ve Fon Yonetimi", "Yatirimci Iliskileri", "Finansal Teknolojiler (FinTech)",
  "Dis Ticaret", "Uluslararasi Is Iliskileri", "Ihracat ve Ithalat Yonetimi",
  "Gumruk ve Ticaret Mevzuati", "Lojistik ve Tedarik Zinciri Yonetimi",
  "Doviz Kuru ve Dis Ticaret Riskleri", "Kuresel Pazarlama Stratejileri", "Ekip Yonetimi",
  "Liderlik ve Motivasyon", "Performans Yonetimi", "Ise Alim ve Yetenek Yonetimi",
  "Kurumsal Kultur ve Is Ahlaki", "Egitim ve Gelisim", "Is Hukuku ve Insan Kaynaklari Yonetimi",
  "Catisma Cozumleme ve Iletisim Becerileri", "Zaman Yonetimi ve Verimlilik", "Proje Yonetimi",
  "Degisim Yonetimi", "Kriz Yonetimi", "Yazilim Gelistirme", "Mobil Uygulamalar",
  "Web Gelistirme", "Kullanici Deneyimi (UX) ve Kullanici Arayuzu (UI)", "Veri Tabani Yonetimi",
  "Bulut Bilisim", "Siber Guvenlik", "Veri Analitigi ve Buyuk Veri",
  "Yapay Zeka (AI) ve Makine Ogrenimi", "Blokzincir ve Kripto Para Teknolojileri",
  "Oyun Gelistirme", "VR/AR (Sanal ve Artirilmis Gerceklik)", "Espor ve Oyun Endustrisi",
  "Saglik Teknolojileri", "Biyoteknoloji", "Tibbi Cihazlar ve Saglik Hizmetleri",
  "Egitim Teknolojileri (EdTech)", "Cevrimici Egitim ve Uzaktan Ogrenme",
  "Ogrenci Basarisi ve Ogretim Yontemleri", "Kurumsal Egitim ve Yetiskin Egitimi",
  "Turizm ve Otel Yonetimi", "Seyahat Teknolojileri", "Konaklama ve Misafirperverlik",
  "Etkinlik ve Eglence Yonetimi", "Kulturel Turizm ve Turizm Pazarlamasi", "Spor Yonetimi",
  "Spor Pazarlamasi ve Sponsorluk", "Spor Teknolojileri", "Spor Tesisleri ve Etkinlik Yonetimi",
  "Kisisel Antrenorluk ve Spor Psikolojisi", "Girisimcilik ve Start-Up Mentorlugu",
  "Inovasyon ve Yaraticilik", "Is Plani Hazirlama ve Stratejik Planlama",
  "Pazar Giris Stratejileri ve Is Modeli Gelistirme", "Fikri Mulkiyet ve Patent Danismanligi",
  "Rekabet Analizi ve Sektorel Arastirma", "Musteri Iliskileri ve Ag Olusturma",
  "Kurumsal Sosyal Sorumluluk", "Cevre ve Yesil Teknolojiler",
  "Sosyal Girisimcilik ve Toplumsal Etki", "Kucuk Isletmeler ve Aile Sirketleri",
  "Franchising ve Bayilik Yonetimi", "Uretim Yonetimi ve Isletme Muhendisligi",
  "Kalite Yonetimi ve Surekli Iyilestirme", "Tedarik Zinciri ve Stok Yonetimi",
  "Urun Gelistirme ve Inovasyon", "Endustriyel Tasarim ve Prototipleme",
  "Enerji Yonetimi ve Yenilenebilir Kaynaklar", "Gayrimenkul Yatirimi ve Emlak Yonetimi",
  "Sanat, Kultur ve Yaratici Endustriler", "IK Teknolojileri", "Diger"
];

const ITEMS_PER_PAGE = 9;

export default function Mentorlar() {
  const router = useRouter();
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showAllTags, setShowAllTags] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sendingMessage, setSendingMessage] = useState(null);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search.trim()), 450);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchMentors = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (selectedTags.length > 0) params.expertiseTags = selectedTags.join(',');
      const response = await mentorNetAPI.getMentors(params);
      if (response.success) {
        setMentors(response.data || []);
        if (response.message) {
          notify.success(response.message);
        }
      } else {
        setError(response.message || 'Mentorlar yuklenirken bir hata olustu');
        notify.error(response.message || 'Mentorlar yuklenirken bir hata olustu');
      }
    } catch (err) {
      if (err.status !== 401) {
        setError(err.message || 'Mentorlar yuklenirken bir hata olustu');
        notify.error(err.message || 'Mentorlar yuklenirken bir hata olustu');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentors();
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedTags.join(',')]);

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedTags([]);
    setCurrentPage(1);
  };

  // Pagination
  const totalPages = Math.ceil(mentors.length / ITEMS_PER_PAGE);
  const paginatedMentors = mentors.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Mesaj gönder
  const handleSendMessage = async (e, mentorUserId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (sendingMessage === mentorUserId) return;
    
    try {
      setSendingMessage(mentorUserId);
      const response = await messagingAPI.createOrGetConversation(mentorUserId);
      
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
      setSendingMessage(null);
    }
  };

  // Visible tags (show 10 by default)
  const visibleTags = showAllTags ? EXPERTISE_AREAS : EXPERTISE_AREAS.slice(0, 12);

  return (
    <PrivateRoute>
      <Head>
        <title>Mentorlar - Emlak Konut Ideathon</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <Layout>
        <section className="mentor-list-section" style={{ marginTop: '140px', paddingTop: '60px', paddingBottom: '60px' }}>
          <div className="container">
            {/* Header */}
            <div className="page-header">
              <span className="page-badge">
                <i className="bi bi-people-fill"></i>
                
              </span>
              <h1 className="page-title">Mentorlarla Görüşme Planla</h1>
              <p className="page-subtitle">
                İlgi alanınıza uygun mentorları keşfedin, müsaitliklerine göre randevu alin.
              </p>
            </div>

            {/* Filters */}
            <div className="filter-section">
              <div className="filter-card">
                <div className="filter-header">
                  <div className="filter-input">
                    <i className="bi bi-search"></i>
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Mentor adi veya e-posta ara..."
                    />
                    {search && (
                      <button className="clear-btn" onClick={() => setSearch('')} aria-label="Aramayi temizle">
                        <i className="bi bi-x-circle-fill"></i>
                      </button>
                    )}
                  </div>
                  <button className="btn-reset" onClick={clearFilters}>
                    <i className="bi bi-arrow-counterclockwise"></i>
                    Temizle
                  </button>
                </div>

                <div className="filter-tags-section">
                  <div className="filter-tags-header">
                    <span className="filter-tags-title">
                      <i className="bi bi-tags"></i>
                      Uzmanlık Alanları
                    </span>
                    {selectedTags.length > 0 && (
                      <span className="selected-count">{selectedTags.length} secili</span>
                    )}
                  </div>
                  <div className="tag-list">
                    {visibleTags.map((tag) => (
                      <button
                        key={tag}
                        className={`tag-chip ${selectedTags.includes(tag) ? 'active' : ''}`}
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                        {selectedTags.includes(tag) && <i className="bi bi-check2"></i>}
                      </button>
                    ))}
                  </div>
                  {EXPERTISE_AREAS.length > 12 && (
                    <button className="btn-show-more" onClick={() => setShowAllTags(!showAllTags)}>
                      <i className={`bi ${showAllTags ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
                      {showAllTags ? 'Daha Az Goster' : `Tumunu Goster (${EXPERTISE_AREAS.length})`}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="error-section">
                <ErrorMessage message={error} onClose={() => setError('')} type="error" />
              </div>
            )}

            {/* Results Info */}
            {!loading && (
              <div className="results-info">
                <span>{mentors.length} mentor bulundu</span>
                {totalPages > 1 && (
                  <span>Sayfa {currentPage} / {totalPages}</span>
                )}
              </div>
            )}

            {/* Loading Skeleton */}
            {loading ? (
              <div className="mentor-grid">
                {[...Array(6)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : mentors.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <i className="bi bi-emoji-frown"></i>
                </div>
                <h3>Mentor bulunamadi</h3>
                <p>Filtreleri degistirerek tekrar deneyebilirsiniz.</p>
                <button className="btn-primary-action" onClick={clearFilters}>
                  Filtreleri Temizle
                </button>
              </div>
            ) : (
              <>
                <div className="mentor-grid">
                  {paginatedMentors.map((mentor) => (
                    <Link
                      key={mentor._id}
                      href={`/mentorluk/mentorlar/${mentor.userId?._id}`}
                      className="mentor-card-link"
                    >
                      <div className="mentor-card">
                        <div className="mentor-card-header">
                          {mentor.photoUrl ? (
                            <img src={mentor.photoUrl} alt={mentor.userId?.name || 'Mentor'} className="mentor-avatar" />
                          ) : (
                            <div className="mentor-avatar placeholder">
                              <span>{getInitials(mentor.userId?.name || 'Mentor')}</span>
                            </div>
                          )}
                          <div className="mentor-info">
                            <h3 className="mentor-name">{mentor.userId?.name || 'Mentor'}</h3>
                            <p className="mentor-title">{mentor.title || 'Mentor'}</p>
                          </div>
                        </div>

                        <div className="mentor-card-body">
                          <p className="mentor-about">
                            {mentor.about ? `${mentor.about.slice(0, 120)}${mentor.about.length > 120 ? '...' : ''}` : 'Mentor hakkinda bilgi bulunmuyor.'}
                          </p>

                          <div className="mentor-tags">
                            {(mentor.expertiseTags || []).slice(0, 3).map((tag) => (
                              <span key={tag} className="mentor-tag">{tag}</span>
                            ))}
                            {(mentor.expertiseTags || []).length > 3 && (
                              <span className="mentor-tag more">+{(mentor.expertiseTags || []).length - 3}</span>
                            )}
                          </div>
                        </div>

                        <div className="mentor-card-footer">
                          <span className="btn-view-profile">
                            <i className="bi bi-calendar-check"></i>
                            Detay & Randevu
                          </span>
                          <button
                            onClick={(e) => handleSendMessage(e, mentor.userId?._id)}
                            className="btn-send-message"
                            disabled={sendingMessage === mentor.userId?._id}
                          >
                            {sendingMessage === mentor.userId?._id ? (
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
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="pagination-btn"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <i className="bi bi-chevron-left"></i>
                      Onceki
                    </button>

                    <div className="pagination-pages">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              className={`pagination-page ${currentPage === page ? 'active' : ''}`}
                              onClick={() => goToPage(page)}
                            >
                              {page}
                            </button>
                          );
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return <span key={page} className="pagination-dots">...</span>;
                        }
                        return null;
                      })}
                    </div>

                    <button
                      className="pagination-btn"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Sonraki
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </Layout>

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

        .filter-section {
          margin-bottom: 30px;
        }
        .filter-card {
          background: white;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.08);
          border: 1px solid #f3f4f6;
        }
        .filter-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
        }
        .filter-input {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
          background: #f9fafb;
          border: 2px solid #e5e7eb;
          border-radius: 14px;
          padding: 14px 18px;
          transition: all 0.2s;
        }
        .filter-input:focus-within {
          border-color: #2563eb;
          background: white;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        }
        .filter-input input {
          border: none;
          background: transparent;
          flex: 1;
          outline: none;
          font-size: 15px;
          color: #111827;
        }
        .filter-input input::placeholder {
          color: #9ca3af;
        }
        .filter-input i {
          color: #9ca3af;
          font-size: 18px;
        }
        .clear-btn {
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 4px;
          transition: color 0.2s;
        }
        .clear-btn:hover {
          color: #ef4444;
        }
        .btn-reset {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 12px 18px;
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .btn-reset:hover {
          border-color: #ef4444;
          color: #ef4444;
        }

        .filter-tags-section {
          border-top: 1px solid #f3f4f6;
          padding-top: 20px;
        }
        .filter-tags-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }
        .filter-tags-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 700;
          color: #374151;
        }
        .selected-count {
          background: #dbeafe;
          color: #1d4ed8;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
        }
        .tag-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .tag-chip {
          border: 2px solid #e5e7eb;
          background: white;
          padding: 8px 16px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
          color: #4b5563;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .tag-chip:hover {
          border-color: #2563eb;
          color: #2563eb;
        }
        .tag-chip.active {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          border-color: #2563eb;
          color: white;
        }
        .btn-show-more {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 14px;
          padding: 8px 16px;
          background: #f3f4f6;
          border: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-show-more:hover {
          background: #e5e7eb;
          color: #374151;
        }

        .error-section {
          margin-bottom: 24px;
        }

        .results-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          font-size: 14px;
          color: #6b7280;
          font-weight: 600;
        }

        .mentor-grid {
          display: grid;
          gap: 24px;
          grid-template-columns: repeat(3, 1fr);
        }

        .mentor-card-link {
          text-decoration: none;
          display: block;
        }
        .mentor-card {
          background: white;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.08);
          border: 1px solid #f3f4f6;
          display: flex;
          flex-direction: column;
          gap: 18px;
          transition: all 0.3s;
          height: 100%;
          cursor: pointer;
        }
        .mentor-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.12);
          border-color: #2563eb;
        }
        .mentor-card-header {
          display: flex;
          gap: 16px;
          align-items: center;
        }
        .mentor-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #e5e7eb;
          background: #f3f4f6;
          flex-shrink: 0;
        }
        .mentor-avatar.placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 20px;
          color: #1d4ed8;
          background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
        }
        .mentor-info {
          flex: 1;
          min-width: 0;
        }
        .mentor-name {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .mentor-title {
          font-size: 14px;
          color: #2563eb;
          font-weight: 600;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .mentor-card-body {
          flex: 1;
        }
        .mentor-about {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.6;
          margin: 0 0 14px 0;
        }
        .mentor-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .mentor-tag {
          background: #f3f4f6;
          color: #374151;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
        }
        .mentor-tag.more {
          background: #dbeafe;
          color: #1d4ed8;
        }
        .mentor-card-footer {
          padding-top: 4px;
        }
        .btn-view-profile {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: white;
          border-radius: 12px;
          padding: 14px 20px;
          font-size: 14px;
          font-weight: 700;
          transition: all 0.2s;
        }
        .mentor-card:hover .btn-view-profile {
          box-shadow: 0 10px 30px rgba(37, 99, 235, 0.3);
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
          margin-bottom: 24px;
        }
        .btn-primary-action {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: white;
          border-radius: 12px;
          padding: 14px 28px;
          font-size: 14px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-primary-action:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(37, 99, 235, 0.3);
        }

        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 40px;
          padding-top: 30px;
          border-top: 1px solid #f3f4f6;
        }
        .pagination-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
        }
        .pagination-btn:hover:not(:disabled) {
          border-color: #2563eb;
          color: #2563eb;
        }
        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .pagination-pages {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .pagination-page {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
        }
        .pagination-page:hover {
          border-color: #2563eb;
          color: #2563eb;
        }
        .pagination-page.active {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          border-color: #2563eb;
          color: white;
        }
        .pagination-dots {
          color: #9ca3af;
          padding: 0 6px;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          100% {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1200px) {
          .mentor-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .page-title { font-size: 28px; }
          .filter-header { flex-direction: column; }
          .btn-reset { width: 100%; justify-content: center; }
          .mentor-grid { grid-template-columns: 1fr; }
          .pagination { flex-wrap: wrap; }
          .pagination-btn { padding: 10px 14px; font-size: 13px; }
        }
        @media (max-width: 480px) {
          .page-title { font-size: 24px; }
          .mentor-card { padding: 20px; }
        }
      `}</style>
    </PrivateRoute>
  );
}
