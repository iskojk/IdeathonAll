/**
 * Faydalı Linkler (Useful Links) Page
 * Yönetmelikler, bakanlıklar ve kurumsal linkler
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '@/components/Layout';

const usefulLinks = [
  {
    id: 300,
    title: 'Girişimcilik ve İnovasyon Yaklaşımları',
    description: 'Dr. Hakan Aslan — Girişimcilik ve inovasyon süreçleri hakkında kapsamlı eğitim sunumu.',
    url: '/img/maras/girisimcilik-ve-inovasyon-yaklasimlari.pptx',
    icon: 'bi-lightbulb-fill',
    category: 'Ideathon Kahramanmaraş — Eğitim Sunum Dosyaları',
    color: '#b91c1c',
    isDownload: true,
    slug: 'ideathon-kahramanmaras'
  },
  {
    id: 301,
    title: 'Problemden Çözüme Fikir Nasıl Geliştirilir',
    description: 'Serhat DUYAR — Problem çözme metodolojileri ve fikir geliştirme teknikleri.',
    url: '/img/maras/problemden-cozume-fikir-nasil-gelistirilir.pptx',
    icon: 'bi-puzzle-fill',
    category: 'Ideathon Kahramanmaraş — Eğitim Sunum Dosyaları',
    color: '#b91c1c',
    isDownload: true,
    slug: 'ideathon-kahramanmaras'
  },
  {
    id: 302,
    title: 'Fikirden Etkili Sunuma Doğru — Hikâye ile Anlatmak',
    description: 'Serhat DUYAR — Etkili sunum hazırlama teknikleri ve hikaye anlatımı ile sunum.',
    url: '/img/maras/Fikirden-Etkili-Sunuma-Dogru-Hikaye-ile-Anlatmak.pptx',
    icon: 'bi-file-earmark-ppt-fill',
    category: 'Ideathon Kahramanmaraş — Eğitim Sunum Dosyaları',
    color: '#b91c1c',
    isDownload: true,
    slug: 'ideathon-kahramanmaras'
  },
  {
    id: 303,
    title: 'Ideathon Kahramanmaraş Sunum Şablonu',
    description: 'Ideathon Kahramanmaraş için sunum şablonu. Final sunumlarınızı bu şablon üzerinden hazırlayabilirsiniz.',
    url: '/img/maras/ideathon-maras-sunum-sablonu.pptx',
    icon: 'bi-file-earmark-ppt-fill',
    category: 'Ideathon Kahramanmaraş — Eğitim Sunum Dosyaları',
    color: '#b91c1c',
    isDownload: true,
    slug: 'ideathon-kahramanmaras'
  },
  {
    id: 201,
    title: 'Üçüncü Gün — 18:30 - 19:15 | Sunum Hazırlama Eğitimi',
    description: 'Sunum hazırlama eğitimi. Etkili sunum hazırlama teknikleri ve ipuçları. Microsoft Teams üzerinden canlı katılım.',
    url: 'https://teams.microsoft.com/meet/386834332568161?p=2GG09pvFW6179fb7nA',
    icon: 'bi-camera-video-fill',
    category: 'Ideathon Konya — Eğitim & Webinar',
    color: '#7c3aed',
    slug: 'ideathon-konya'
  },
  {
    id: 1,
    title: 'T.C. CUMHURBAŞKANLIĞI MEVZUAT BİLGİ SİSTEMİ',
    description: 'Türkiye Cumhuriyeti mevzuatına ilişkin kanun, tüzük, yönetmelik ve diğer düzenlemelere ulaşabileceğiniz resmi platform.',
    url: 'https://mevzuat.gov.tr/',
    icon: 'bi-journal-text',
    category: 'Resmi Kurumlar',
    color: '#042070'
  },
  {
    id: 2,
    title: 'T.C. CUMHURBAŞKANLIĞI RESMİ GAZETE',
    description: 'Kanun, tüzük, yönetmelik ve diğer resmi düzenlemelerin yayımlandığı Türkiye Cumhuriyeti Resmi Gazetesi.',
    url: 'https://www.resmigazete.gov.tr/',
    icon: 'bi-newspaper',
    category: 'Resmi Kurumlar',
    color: '#042070'
  },
  {
    id: 3,
    title: 'ÇEVRE ŞEHİRCİLİK VE İKLİM DEĞİŞİKLİĞİ BAKANLIĞI',
    description: 'Çevre, şehircilik ve iklim değişikliği konularında politika oluşturan ve uygulayan T.C. Bakanlığı.',
    url: 'https://csb.gov.tr/',
    icon: 'bi-globe-americas',
    category: 'Resmi Kurumlar',
    color: '#16a34a'
  },
  {
    id: 4,
    title: 'EMLAK KONUT GYO A.Ş.',
    description: 'Türkiye\'nin en büyük gayrimenkul yatırım ortaklığı. Konut, altyapı ve kentsel dönüşüm projeleri.',
    url: 'https://www.emlakkonut.com.tr/',
    icon: 'bi-building',
    category: 'Kurumsal',
    color: '#d97706'
  },
  {
    id: 5,
    title: 'EMLAK KONUT ASANSÖR SİSTEMLERİ VE TİCARET A.Ş.',
    description: 'Asansör sistemleri ve bakım hizmetleri konusunda uzman şirket. Modern ve güvenli taşıma çözümleri.',
    url: 'https://emlakkonutasansor.com/',
    icon: 'bi-box-arrow-in-up',
    category: 'Kurumsal',
    color: '#7c3aed'
  },
  {
    id: 6,
    title: 'EKA ENERJİ VE TEKNOLOJİ A.Ş.',
    description: 'Enerji ve teknoloji alanında yenilikçi çözümler sunan şirket. Sürdürülebilir enerji projeleri.',
    url: 'https://ekaenerjiteknoloji.com.tr/',
    icon: 'bi-lightning-charge-fill',
    category: 'Kurumsal',
    color: '#0891b2'
  },
  {
    id: 7,
    title: 'KAT MÜLKİYETİ KANUNU',
    description: 'Kat mülkiyeti, kat irtifakı ve site yönetimi konularında temel yasal düzenlemeler.',
    url: 'https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=634&MevzuatTur=1&MevzuatTertip=5',
    icon: 'bi-file-earmark-ruled',
    category: 'Mevzuat',
    color: '#dc2626'
  },
  {
    id: 8,
    title: 'SIFIR ATIK YÖNETMELİĞİ',
    description: 'Atıkların kaynağında ayrı toplanması, geri kazanımı ve çevresel sürdürülebilirlik ile ilgili düzenlemeler.',
    url: 'https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=32659&MevzuatTur=7&MevzuatTertip=5',
    icon: 'bi-recycle',
    category: 'Mevzuat',
    color: '#059669'
  },
  {
    id: 9,
    title: 'ATIK YÖNETİMİ YÖNETMELİĞİ',
    description: 'Atıkların çevreye ve insan sağlığına zarar vermeden toplanması, taşınması ve bertaraf edilmesi ile ilgili kurallar.',
    url: 'https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=20644&MevzuatTur=7&MevzuatTertip=5',
    icon: 'bi-trash3',
    category: 'Mevzuat',
    color: '#ea580c'
  },
  {
    id: 10,
    title: 'AFET VE ACİL DURUM MÜDAHALE HİZMETLERİ YÖNETMELİĞİ',
    description: 'Afet ve acil durumlarda müdahale, koordinasyon ve hizmetlerin yürütülmesi ile ilgili düzenlemeler.',
    url: 'https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=5211&MevzuatTur=21&MevzuatTertip=5',
    icon: 'bi-exclamation-triangle-fill',
    category: 'Mevzuat',
    color: '#b91c1c'
  },
  {
    id: 110,
    title: 'Akıllı Şehir Yönetimi',
    description: 'Akıllı şehir yönetimi konseptleri, uygulamaları ve gayrimenkul sektöründeki dijital dönüşüm süreçlerine etkisi.',
    url: '/img/ankara/akilli-sehir-yonetimi-ankara.pdf',
    icon: 'bi-building-gear',
    category: 'Eğitim Sunum Dosyaları',
    color: '#dc2626',
    isDownload: true,
    slug: 'ideathon-ankara'
  },
  {
    id: 111,
    title: 'Dijital Dönüşüm',
    description: 'Gayrimenkul sektöründe dijital dönüşüm stratejileri, teknoloji entegrasyonu ve geleceğe yönelik vizyon.',
    url: '/img/ankara/dijital-donusum-final-ankara.pdf',
    icon: 'bi-arrow-repeat',
    category: 'Eğitim Sunum Dosyaları',
    color: '#dc2626',
    isDownload: true,
    slug: 'ideathon-ankara'
  },
  {
    id: 11,
    title: 'Girişimcilik ve İnovasyon Yaklaşımları',
    description: 'Girişimcilik ve inovasyon süreçleri hakkında kapsamlı eğitim sunumu. Fikir geliştirmeden uygulamaya kadar tüm aşamaları kapsayan içerik.',
    url: '/img/girisimcilik-inovasyon-yaklasimlari.pptx',
    icon: 'bi-lightbulb-fill',
    category: 'Eğitim Sunum Dosyaları',
    color: '#8b5cf6',
    isDownload: true,
    excludeSlugs: ['ideathon-konya']
  },
  {
    id: 12,
    title: 'Problemden Çözüme Fikir Geliştirme',
    description: 'Problem çözme metodolojileri ve fikir geliştirme teknikleri. Yaratıcı düşünme ve çözüm odaklı yaklaşımlar.',
    url: '/img/problemden-cozume-fikir-gelistirme.pptx',
    icon: 'bi-puzzle-fill',
    category: 'Eğitim Sunum Dosyaları',
    color: '#ec4899',
    isDownload: true,
    excludeSlugs: ['ideathon-konya']
  },
  {
    id: 13,
    title: 'Sunum Hazırlama Eğitimi',
    description: 'Etkili sunum hazırlama teknikleri ve ipuçları. Profesyonel sunum hazırlama rehberi ve en iyi uygulamalar.',
    url: '/img/sunum-hazirlama-egitimi.pdf',
    icon: 'bi-file-earmark-pdf-fill',
    category: 'Eğitim Sunum Dosyaları',
    color: '#f97316',
    isDownload: true
  },
  {
    id: 120,
    title: 'Yarının Binaları İçin Dikey Ulaşım Teknolojileri',
    description: 'Dağhan ATAKAY — Dikey ulaşım teknolojilerinin geleceği, yeni nesil asansör sistemleri ve akıllı bina entegrasyonu.',
    url: '/img/konya/yarinin_binalari_icin_dikey_ulasim_teknolojileri.pdf',
    icon: 'bi-arrow-up-square',
    category: 'Eğitim Sunum Dosyaları',
    color: '#7c3aed',
    isDownload: true,
    slug: 'ideathon-konya'
  },
  {
    id: 121,
    title: 'Girişimcilik ve İnovasyon Yaklaşımları',
    description: 'Girişimcilik ve inovasyon süreçleri hakkında kapsamlı eğitim sunumu. Fikir geliştirmeden uygulamaya kadar tüm aşamaları kapsayan içerik.',
    url: '/img/konya/girisimcilik_ve_inovasyon_yaklasimlari.pptx',
    icon: 'bi-lightbulb-fill',
    category: 'Eğitim Sunum Dosyaları',
    color: '#8b5cf6',
    isDownload: true,
    slug: 'ideathon-konya'
  },
  {
    id: 122,
    title: 'Ideathon Konya Sunum Şablonu',
    description: 'Ideathon Konya için sunum şablonu. Final sunumlarınızı bu şablon üzerinden hazırlayabilirsiniz.',
    url: '/img/konya/ideathon-konya-sunum-sablonu.pptx',
    icon: 'bi-file-earmark-ppt-fill',
    category: 'Eğitim Sunum Dosyaları',
    color: '#dc2626',
    isDownload: true,
    slug: 'ideathon-konya'
  }
];

export default function FaydaliLinkler() {
  const [currentSlug, setCurrentSlug] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentSlug(localStorage.getItem('ideathon_slug') || '');
    }
  }, []);

  const filteredLinks = usefulLinks.filter(link => {
    if (link.excludeSlugs && link.excludeSlugs.includes(currentSlug)) return false;
    if (link.slug && link.slug !== currentSlug) return false;
    return true;
  });

  const categoryOrder = ['Ideathon Kahramanmaraş — Eğitim Sunum Dosyaları', 'Ideathon Konya — Eğitim & Webinar', 'Eğitim Sunum Dosyaları', 'Resmi Kurumlar', 'Kurumsal', 'Mevzuat'];
  const categories = categoryOrder.filter(cat => 
    filteredLinks.some(link => link.category === cat)
  );

  return (
    <>
      <Head>
        <title>Faydalı Linkler - Emlak Konut Ideathon</title>
        <meta name="description" content="Yönetmelikler, bakanlıklar ve kurumsal linkler. Emlak Konut ve ilgili kurumların resmi web siteleri." />
        <meta name="keywords" content="mevzuat, yönetmelik, emlak konut, bakanlık, resmi gazete" />
      </Head>

      <Layout>
        <section className="useful-links-section py-100px md-py-80px sm-py-60px" style={{ marginTop: '140px' }}>
          <div className="container">
            {/* Page Header */}
            <div className="row justify-content-center mb-60px">
              <div className="col-lg-10 col-md-12 text-center">
                <div className="inline-block mb-30px animate-fade-in">
                  <span className="ps-25px pe-25px pt-8px pb-8px text-uppercase alt-font text-primary-blue fs-13 lh-28 fw-600 border-radius-100px bg-primary-blue-light d-inline-flex align-items-center">
                    <i className="bi bi-link-45deg fs-26 me-10px"></i>
                  </span>
                </div>
                <h1 className="alt-font text-dark-gray fw-700 mb-25px lh-52 md-lh-44 sm-lh-40 animate-fade-in-up">
                  Faydalı Linkler
                </h1>
                <p className="w-80 md-w-90 mx-auto text-dark-gray lh-32 fs-18 mb-0 animate-fade-in-up-delay">
                  Resmi kurumlar, mevzuat ve kurumsal kaynaklara hızlı erişim
                </p>
              </div>
            </div>

            {/* Links Grid by Category */}
            {categories.map((category, categoryIndex) => (
              <div key={category} className="mb-60px">
                <div className="row justify-content-center mb-40px">
                  <div className="col-12">
                    <h2 className="alt-font text-dark-gray fw-600 fs-28 mb-0 category-title">
                      <i className="bi bi-folder-fill me-2"></i>
                      {category}
                    </h2>
                  </div>
                </div>

                <div className="row gy-4">
                  {filteredLinks
                    .filter(link => link.category === category)
                    .map((link, index) => (
                      <div 
                        key={link.id} 
                        className="col-lg-6 col-md-12"
                        style={{
                          animation: `fadeInUp 0.6s ease-out ${(index * 0.1)}s both`
                        }}
                      >
                        <a 
                          href={link.url} 
                          target={link.isDownload ? undefined : "_blank"}
                          rel={link.isDownload ? undefined : "noopener noreferrer"}
                          download={link.isDownload ? link.title : undefined}
                          className="link-card"
                        >
                          <div className="link-card-inner">
                        
                            <div className="link-icon" style={{ background: `${link.color}15`, color: link.color }}>
                              <i className={link.icon}></i>
                            </div>
                            <div className="link-content">
                              <h3 className="link-title">{link.title}</h3>
                              <p className="link-description">{link.description}</p>
                            </div>
                            <div className="link-arrow">
                              <i className={link.isDownload ? "bi bi-download" : "bi bi-arrow-right"}></i>
                            </div>
                          </div>
                        </a>
                      </div>
                    ))}
                </div>
              </div>
            ))}

            {/* Info Box */}
            <div className="row justify-content-center mt-60px">
              <div className="col-lg-10 col-md-12">
                <div className="info-box">
                  <div className="info-box-icon">
                    <i className="bi bi-info-circle-fill"></i>
                  </div>
                  <div className="info-box-content">
                    <h4 className="info-box-title">Bilgilendirme</h4>
                    <p className="info-box-text mb-0">
                      Bu sayfada yer alan linkler bilgilendirme amaçlıdır. Linklerin içerikleri ilgili kurumların sorumluluğundadır.
                      Güncel bilgiler için lütfen ilgili web sitelerini ziyaret ediniz.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Layout>

      <style jsx>{`
        .useful-links-section {
          background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
          min-height: calc(100vh - 140px);
        }

        .animate-fade-in {
          animation: fadeIn 0.6s ease-out;
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out 0.1s both;
        }

        .animate-fade-in-up-delay {
          animation: fadeInUp 0.6s ease-out 0.2s both;
        }

        .category-title {
          position: relative;
          padding-bottom: 15px;
        }

        .category-title::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 60px;
          height: 4px;
          background: linear-gradient(90deg, #042070 0%, #2563eb 100%);
          border-radius: 2px;
        }

        .link-card {
          display: block;
          text-decoration: none;
          height: 100%;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .link-card-inner {
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 20px;
          background: white;
          padding: 30px;
          border-radius: 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          height: 100%;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 2px solid transparent;
        }

        .link-card:hover .link-card-inner {
          transform: translateY(-5px);
          box-shadow: 0 12px 40px rgba(4, 32, 112, 0.15);
          border-color: #042070;
        }

        .link-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          transition: left 0.6s;
          pointer-events: none;
          z-index: 1;
        }

        .link-card:hover::before {
          left: 100%;
        }

        .link-icon {
          flex-shrink: 0;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 15px;
          font-size: 28px;
          transition: all 0.3s ease;
        }

        .link-card:hover .link-icon {
          transform: scale(1.1) rotate(5deg);
        }

        .link-content {
          flex: 1;
          min-width: 0;
        }

        .link-title {
          font-size: 18px;
          font-weight: 600;
          color: #042070;
          margin-bottom: 12px;
          line-height: 1.4;
          transition: color 0.3s ease;
        }

        .link-card:hover .link-title {
          color: #2563eb;
        }

        .link-description {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.6;
          margin-bottom: 0;
        }

        .download-badge-corner {
          position: absolute;
          top: 15px;
          right: 60px;
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 16px;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
          transition: all 0.3s ease;
          z-index: 2;
        }

        .link-card:hover .download-badge-corner {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(139, 92, 246, 0.5);
        }

        .link-url {
          display: inline-flex;
          align-items: center;
          font-size: 13px;
          font-weight: 600;
          color: #042070;
          opacity: 0.7;
          transition: all 0.3s ease;
        }

        .link-card:hover .link-url {
          opacity: 1;
          color: #2563eb;
        }

        .link-arrow {
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f4f6;
          border-radius: 50%;
          font-size: 18px;
          color: #042070;
          transition: all 0.3s ease;
        }

        .link-card:hover .link-arrow {
          background: #042070;
          color: white;
          transform: translateX(5px);
        }

        .info-box {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          padding: 30px;
          border-radius: 20px;
          border-left: 4px solid #2563eb;
          animation: fadeInUp 0.6s ease-out 0.3s both;
        }

        .info-box-icon {
          flex-shrink: 0;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border-radius: 50%;
          color: #2563eb;
          font-size: 24px;
        }

        .info-box-content {
          flex: 1;
        }

        .info-box-title {
          font-size: 18px;
          font-weight: 600;
          color: #042070;
          margin-bottom: 8px;
        }

        .info-box-text {
          font-size: 14px;
          color: #1e40af;
          line-height: 1.6;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
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

        /* Responsive */
        @media (max-width: 991px) {
          .link-card-inner {
            padding: 25px;
          }

          .link-icon {
            width: 50px;
            height: 50px;
            font-size: 24px;
          }

          .link-title {
            font-size: 16px;
          }

          .link-description {
            font-size: 13px;
          }

          .download-badge-corner {
            width: 32px;
            height: 32px;
            font-size: 14px;
            right: 52px;
          }
        }

        @media (max-width: 767px) {
          .category-title {
            font-size: 24px !important;
          }

          .link-card-inner {
            flex-direction: column;
            padding: 20px;
          }

          .link-icon {
            width: 55px;
            height: 55px;
          }

          .link-arrow {
            position: absolute;
            top: 20px;
            right: 20px;
            width: 35px;
            height: 35px;
            font-size: 16px;
          }

          .download-badge-corner {
            top: 20px;
            right: 65px;
            width: 32px;
            height: 32px;
            font-size: 14px;
          }

          .info-box {
            flex-direction: column;
            padding: 20px;
          }

          .info-box-title {
            font-size: 16px;
          }

          .info-box-text {
            font-size: 13px;
          }

          .download-badge-corner {
            top: 12px;
            right: 12px;
            width: 30px;
            height: 30px;
            font-size: 13px;
          }
        }

        @media (max-width: 575px) {
          .useful-links-section {
            padding-top: 60px !important;
            padding-bottom: 60px !important;
            margin-top: 100px !important;
          }

          .link-title {
            font-size: 15px;
            margin-bottom: 10px;
          }
        }
      `}</style>
    </>
  );
}

