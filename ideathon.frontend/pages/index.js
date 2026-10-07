import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Layout from '@/components/Layout'
import { getIdeathonConfig, getAllIdeathonConfigs } from '@/config/ideathonConfig'

function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false })

  useEffect(() => {
    const target = new Date(targetDate).getTime()
    const tick = () => {
      const now = Date.now()
      const diff = target - now
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true })
        return
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        expired: false,
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetDate])

  return timeLeft
}

const IDEATHONS = [
  {
    slug: 'ideathon-kahramanmaras',
    title: 'Emlak Konut Ideathon Kahramanmaraş',
    subtitle: 'Afetlere Dayanıklı Yapılar ve Akıllı Afet Yönetimi ile Güvenli Şehirler',
    description: 'Afetlere dayanıklı yapı teknolojileri ve akıllı afet yönetimi çözümleri alanında yenilikçi fikirlerin geliştirilmesini destekleyen fikir maratonu.',
    location: 'Kahramanmaraş',
    date: '9 Mayıs 2026',
    status: 'completed',
    icon: 'bi-shield-check',
    color: '#b91c1c',
    href: '/ideathon-kahramanmaras',
  },
  {
    slug: 'ideathon-konya',
    title: 'Emlak Konut Ideathon Konya',
    subtitle: 'Akıllı Dikey Ulaşım Sistemleri ve Robotik Yapı Teknolojileri ile Geleceğin Yapıları',
    description: 'Akıllı dikey ulaşım sistemleri ve robotik yapı teknolojileri alanında yenilikçi çözümlerin geliştirilmesini destekleyen fikir maratonu.',
    location: 'Konya',
    date: '25 Nisan 2026',
    countdownDate: '2026-04-25T09:00:00+03:00',
    status: 'completed',
    icon: 'bi-buildings',
    color: '#7c3aed',
    href: '/ideathon-konya',
  },
  {
    slug: 'ideathon-izmir',
    title: 'Emlak Konut Ideathon İzmir',
    subtitle: 'Enerji Verimli Yapılar ve Akıllı Mobilite Entegrasyonu ile Sürdürülebilir Yaşam',
    description: 'Enerji verimliliği, akıllı ulaşım çözümleri ve sürdürülebilir altyapı odağında yenilikçi fikirlerin şekillendiği fikir maratonu.',
    location: 'İzmir, Konak',
    date: '11 Nisan 2026',
    countdownDate: '2026-04-11T09:00:00+03:00',
    status: 'completed',
    icon: 'bi-sun',
    color: '#059669',
    href: '/ideathon-izmir',
  },
  {
    slug: 'ideathon-ankara',
    title: 'Emlak Konut Ideathon Ankara',
    subtitle: 'Gayrimenkulde Yapay Zekâ Destekli PropTech & İleri Veri Analitiği Çözümleri',
    description: 'Gayrimenkul sektöründe yapay zekâ ve ileri veri analitiği temelli yenilikçi çözümlerin geliştirilmesini destekleyen fikir maratonu.',
    location: 'Ankara',
    date: '4 Nisan 2026',
    countdownDate: '2026-04-04T09:00:00+03:00',
    status: 'completed',
    icon: 'bi-bank',
    color: '#dc2626',
    href: '/ideathon-ankara',
  },



  {
    slug: 'ideathon-2025',
    title: 'Emlak Konut Ideathon İstanbul',
    subtitle: 'Yaşam Kalitesini Artıran Akıllı Site Yönetimi Çözümleri',
    description: 'Toplu yaşam alanlarında günlük hayatı kolaylaştıracak, tesis yönetimi süreçlerini iyileştirecek ve kullanıcı deneyimini güçlendirecek çözüm fikirlerini görünür kılmak ve geliştirmek.',
    location: 'İstanbul, Ataşehir',
    date: '6-7 Aralık 2025',
    status: 'completed',
    icon: 'bi-building',
    color: '#042070',
    href: '/ideathon-2025',
  },
]

const STATUS_MAP = {
  active: { label: 'Başvuruya Açık', badge: 'status-active', icon: 'bi-broadcast' },
  closed: { label: 'Başvuruya Kapalı', badge: 'status-closed', icon: 'bi-x-circle' },
  upcoming: { label: 'Yakında', badge: 'status-upcoming', icon: 'bi-clock' },
  completed: { label: 'Tamamlandı', badge: 'status-completed', icon: 'bi-check-circle' },
}

const SLUG_TO_HOME = {
  'ideathon-2025': '/ideathon-2025',
  'ideathon-ankara': '/ideathon-ankara',
  'ideathon-konya': '/ideathon-konya',
  'ideathon-izmir': '/ideathon-izmir',
  'ideathon-kahramanmaras': '/ideathon-kahramanmaras',
}

function CountdownBadge({ targetDate }) {
  const { days, hours, minutes, expired } = useCountdown(targetDate)
  if (expired) return null

  return (
    <div className="hub-cd-bar">
      <div className="hub-cd-icon">
        <i className="bi bi-alarm-fill"></i>
      </div>
      <div className="hub-cd-info">
        <span className="hub-cd-label">Etkinliğe Kalan</span>
        <div className="hub-cd-nums">
          <span className="hub-cd-val">{days} <small>gün</small></span>
          <span className="hub-cd-sep">&middot;</span>
          <span className="hub-cd-val">{String(hours).padStart(2, '0')} <small>saat</small></span>
          <span className="hub-cd-sep">&middot;</span>
          <span className="hub-cd-val">{String(minutes).padStart(2, '0')} <small>dk</small></span>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.removeItem('ideathon_slug')
  }, [])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <>
      <Head>
        <title>Emlak Konut Ideathon - Geleceğin Şehirlerini Birlikte İnşa Ediyoruz</title>
        <meta name="description" content="Emlak Konut Ideathon programları ile akıllı şehir teknolojilerini keşfedin. Farklı şehirlerde düzenlenen ideathon etkinliklerine katılın." />
        <meta name="keywords" content="Emlak Konut, Ideathon, PropTech, ConTech, akıllı şehir, inovasyon, teknoloji, toplu yaşam" />
        <meta name="author" content="EKA Enerji ve Teknoloji A.Ş." />
        <meta name="robots" content="index, follow" />
        <meta name="language" content="tr-TR" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://ideathon.anahtarfikirler.com/" />
        <meta property="og:title" content="Emlak Konut Ideathon - Geleceğin Şehirlerini Birlikte İnşa Ediyoruz" />
        <meta property="og:description" content="Emlak Konut Ideathon programları ile akıllı şehir teknolojilerini keşfedin." />
        <meta property="og:image" content="https://ideathon.anahtarfikirler.com/img/slider.webp" />
        <meta property="og:site_name" content="Emlak Konut Ideathon" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Emlak Konut Ideathon - Geleceğin Şehirlerini Birlikte İnşa Ediyoruz" />
        <meta name="twitter:description" content="Emlak Konut Ideathon programları ile akıllı şehir teknolojilerini keşfedin." />
        <meta name="twitter:image" content="https://ideathon.anahtarfikirler.com/img/slider.webp" />
        <link rel="canonical" href="https://ideathon.anahtarfikirler.com/" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Emlak Konut Ideathon",
              "url": "https://ideathon.anahtarfikirler.com",
              "logo": "https://ideathon.anahtarfikirler.com/img/dark-logo.svg",
              "description": "Emlak Konut Ideathon programları ile akıllı şehir teknolojilerini keşfedin.",
              "address": { "@type": "PostalAddress", "addressCountry": "TR" },
              "sameAs": [
                "https://www.instagram.com/anahtarfikirler",
                "https://x.com/anahtarfikirler",
                "https://www.linkedin.com/company/anahtar-fikirler/"
              ]
            })
          }}
        />
      </Head>

      <Layout>
        {/* Hero Section */}
        <section className="hub-hero">
          <div className="hub-hero-bg"></div>
          <div className="container position-relative">
            <div className="row justify-content-center">
              <div className="col-lg-10 col-md-12 text-center">
                <div className="hub-hero-content mt-5">
                  <div className="hub-badge">
                    <i className="bi bi-lightbulb-fill"></i>
                    <span>Ideathon Programları</span>
                  </div>
                  <h1 className="hub-hero-title">
                    Geleceğin Şehirlerini <br />
                    <span className="hub-hero-gradient">Birlikte İnşa Ediyoruz</span>
                  </h1>
                  <p className="hub-hero-desc">
                    Emlak Konut Ideathon programları ile gayrimenkul ve inşaat teknolojilerini keşfedin, yenilikçi çözümler ile geleceğin yaşam alanlarını tasarlayın.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ideathon Cards */}
        <section className="hub-cards-section">
          <div className="container">
            <div className="hub-cards-grid">
              {IDEATHONS.map((ideathon) => {
                const statusInfo = STATUS_MAP[ideathon.status]
                const cfg = getIdeathonConfig(ideathon.slug)
                const sliderImg = cfg.sliderDesktop

                return (
                  <Link key={ideathon.slug} href={ideathon.href} className="hub-card-link">
                    <div className="hub-card">
                      {/* Card Image */}
                      <div className="hub-card-image-wrapper">
                        <img
                          src={sliderImg}
                          alt={ideathon.title}
                          className="hub-card-image"
                          loading="lazy"
                        />
                        <div className="hub-card-image-overlay"></div>
                        {/* Status Badge on Image */}
                        <div className="hub-card-badge-wrap">
                          <span className={`hub-card-badge ${statusInfo.badge}`}>
                            <i className={`bi ${statusInfo.icon}`}></i>
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="hub-card-body">
                        <h3 className="hub-card-title">{ideathon.title}</h3>
                        <p className="hub-card-subtitle">{ideathon.subtitle}</p>
                        <p className="hub-card-desc">{ideathon.description}</p>

                        {/* Meta */}
                        <div className="hub-card-meta">
                          <div className="hub-card-meta-item">
                            <i className="bi bi-geo-alt-fill"></i>
                            <span>{ideathon.location}</span>
                          </div>
                          <div className="hub-card-meta-item">
                            <i className="bi bi-calendar3"></i>
                            <span>{ideathon.date}</span>
                          </div>
                        </div>

                        {/* Countdown */}
                        {ideathon.countdownDate && <CountdownBadge targetDate={ideathon.countdownDate} />}

                        {/* CTA */}
                        <div className="hub-card-cta">
                          <span>Detayları İncele</span>
                          <i className="bi bi-arrow-right"></i>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      </Layout>

      <style jsx global>{`
        /* ===== HERO ===== */
        .hub-hero {
          position: relative;
          padding: 100px 0 50px;
          overflow: hidden;
        }

        .hub-hero-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(160deg, #f0f5ff 0%, #e0eaff 40%, #f8faff 100%);
          z-index: 0;
        }

        .hub-hero-bg::before {
          content: '';
          position: absolute;
          top: -60%;
          right: -20%;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%);
        }

        .hub-hero-bg::after {
          content: '';
          position: absolute;
          bottom: -40%;
          left: -10%;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(4,32,112,0.06) 0%, transparent 70%);
        }

        .hub-hero-content {
          position: relative;
          z-index: 1;
        }

        .hub-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 20px;
          background: white;
          border: 1px solid #dbeafe;
          border-radius: 999px;
          color: #2563eb;
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 28px;
          box-shadow: 0 2px 12px rgba(37,99,235,0.1);
        }

        .hub-badge i {
          font-size: 16px;
        }

        .hub-hero-title {
          font-family: var(--alt-font);
          font-size: 48px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.15;
          margin-bottom: 20px;
          letter-spacing: -0.5px;
        }

        .hub-hero-gradient {
          background: linear-gradient(135deg, #042070 0%, #2563eb 60%, #3b82f6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hub-hero-desc {
          font-size: 18px;
          line-height: 1.7;
          color: #475569;
          max-width: 640px;
          margin: 0 auto;
        }

        /* ===== CARDS SECTION ===== */
        .hub-cards-section {
          padding: 40px 0 80px;
          background: linear-gradient(180deg, #f8faff 0%, #ffffff 100%);
        }

        .hub-cards-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 32px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .hub-card-link {
          text-decoration: none;
          color: inherit;
          display: block;
        }

        .hub-card {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
          border: 1px solid #e2e8f0;
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .hub-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 60px rgba(4, 32, 112, 0.14);
          border-color: #c7d2fe;
        }

        /* Card Image */
        .hub-card-image-wrapper {
          position: relative;
          width: 100%;
          overflow: hidden;
        }

        .hub-card-image {
          width: 100%;
          height: 230px;
          display: block;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .hub-card:hover .hub-card-image {
          transform: scale(1.05);
        }

        .hub-card-image-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.15) 100%);
          pointer-events: none;
        }

        .hub-card-badge-wrap {
          position: absolute;
          top: 16px;
          left: 16px;
          z-index: 2;
        }

        .hub-card-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          backdrop-filter: blur(8px);
        }

        .hub-card-badge.status-active {
          background: rgba(22, 163, 74, 0.9);
          color: white;
        }

        .hub-card-badge.status-closed {
          background: rgba(220, 38, 38, 0.9);
          color: white;
        }

        .hub-card-badge.status-upcoming {
          background: rgba(245, 158, 11, 0.9);
          color: white;
        }

        .hub-card-badge.status-completed {
          background: rgba(37, 99, 235, 0.9);
          color: white;
        }

        /* Card Body */
        .hub-card-body {
          padding: 28px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .hub-card-title {
          font-family: var(--alt-font);
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 6px;
          line-height: 1.3;
        }

        .hub-card-subtitle {
          font-size: 14px;
          font-weight: 600;
          color: #2563eb;
          margin-bottom: 12px;
          line-height: 1.4;
        }

        .hub-card-desc {
          font-size: 14px;
          line-height: 1.7;
          color: #64748b;
          margin-bottom: 20px;
          flex: 1;
        }

        .hub-card-meta {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-top: 16px;
          border-top: 1px solid #f1f5f9;
          margin-bottom: 16px;
        }

        .hub-card-meta-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #475569;
          font-weight: 500;
        }

        .hub-card-meta-item i {
          font-size: 15px;
          color: #2563eb;
        }

        /* Countdown Bar */
        .hub-cd-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
          border: 1px solid #c7d2fe;
          border-radius: 12px;
          margin-bottom: 16px;
        }

        .hub-cd-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #042070 0%, #2563eb 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 16px;
          flex-shrink: 0;
        }

        .hub-cd-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .hub-cd-label {
          font-size: 11px;
          font-weight: 600;
          color: #6366f1;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .hub-cd-nums {
          display: flex;
          align-items: baseline;
          gap: 6px;
          font-variant-numeric: tabular-nums;
        }

        .hub-cd-val {
          font-size: 15px;
          font-weight: 800;
          color: #042070;
          line-height: 1;
        }

        .hub-cd-val small {
          font-size: 11px;
          font-weight: 600;
          color: #6366f1;
          margin-left: 2px;
        }

        .hub-cd-sep {
          font-size: 14px;
          color: #a5b4fc;
          line-height: 1;
        }

        .hub-card-cta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 15px;
          font-weight: 700;
          color: #2563eb;
          transition: gap 0.3s ease;
        }

        .hub-card:hover .hub-card-cta {
          gap: 14px;
        }

        .hub-card-cta i {
          font-size: 18px;
          transition: transform 0.3s ease;
        }

        .hub-card:hover .hub-card-cta i {
          transform: translateX(4px);
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 991px) {
          .hub-hero {
            padding: 70px 0 40px;
            margin-top: 120px;
          }

          .hub-hero-title {
            font-size: 38px;
          }

          .hub-cards-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 24px;
          }
        }

        @media (max-width: 768px) {
          .hub-hero {
            padding: 50px 0 30px;
          }

          .hub-hero-title {
            font-size: 30px;
          }

          .hub-hero-desc {
            font-size: 16px;
          }

          .hub-cards-section {
            padding: 24px 0 60px;
          }

          .hub-cards-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .hub-card-body {
            padding: 20px;
          }

          .hub-card-title {
            font-size: 18px;
          }

          .hub-card-image {
            height: 163px;
          }
        }

        @media (max-width: 480px) {
          .hub-hero {
            padding: 36px 0 20px;
          }

          .hub-hero-title {
            font-size: 26px;
          }

          .hub-badge {
            font-size: 11px;
            padding: 6px 14px;
          }

          .hub-hero-desc {
            font-size: 15px;
          }


          .hub-card-body {
            padding: 16px;
          }
        }
      `}</style>
    </>
  )
}
