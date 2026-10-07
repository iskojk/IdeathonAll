import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useIdeathonConfig } from '@/context/IdeathonContext'

export default function HeroSectionKonya() {
  const [isMobile, setIsMobile] = useState(false)
  const config = useIdeathonConfig()

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 500)
    }

    checkIsMobile()

    window.addEventListener('resize', checkIsMobile)

    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  const imageSrc = isMobile ? '/img/konya/ideathon-konya-mobil.jpg' : '/img/konya/ideathon-konya.jpg'
  const showCta = !config.loading && config.applicationOpen

  return (
    <>
      <section id="home" className="pb-0px home-pd" style={{ marginTop: '70px', paddingBottom: '0px !important' }}>
        <img
          src={imageSrc}
          alt="Emlak Konut Ideathon Konya - Akıllı Dikey Ulaşım ve Robotik Yapı Teknolojileri"
          style={{
            width: '100%',
            height: 'auto',
            borderRadius: isMobile ? '10px' : '15px',
            display: 'block',
            cursor: 'default'
          }}
        />
      </section>

      {showCta && (
        <div className="hero-cta-bar">
          <div className="container">
            <div className="hero-cta-inner">
              <div className="hero-cta-text">
                <i className="bi bi-lightning-charge-fill"></i>
                <div>
                  <strong>Ideathon Konya İçin Başvurular Devam Ediyor!</strong>
                  <span>Hemen başvurunu yap, geleceği birlikte şekillendirelim.</span>
                </div>
              </div>
              <Link href="/basvuru" className="hero-cta-btn">
                <span>Başvuru Yap</span>
                <i className="bi bi-arrow-right"></i>
              </Link>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .hero-cta-bar {
          padding: 14px 0;
        }
        .home-pd {
          padding-bottom: 14px !important;
        }

        .hero-cta-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 14px 28px;
          background: linear-gradient(135deg, #042070 0%, #0a3cba 50%, #0092f3 100%);
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(4, 32, 112, 0.25);
        }

        .hero-cta-text {
          display: flex;
          align-items: center;
          gap: 14px;
          color: white;
        }

        .hero-cta-text > i {
          font-size: 28px;
          color: #fbbf24;
          flex-shrink: 0;
        }

        .hero-cta-text strong {
          display: block;
          font-size: 17px;
          font-weight: 700;
          letter-spacing: 0.2px;
        }

        .hero-cta-text span {
          font-size: 14px;
          opacity: 0.85;
        }

        .hero-cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 28px;
          background: white;
          color: #042070;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          text-decoration: none;
          white-space: nowrap;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }

        .hero-cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.15);
          color: #042070;
          gap: 14px;
        }

        .hero-cta-btn i {
          font-size: 18px;
          transition: transform 0.3s ease;
        }

        .hero-cta-btn:hover i {
          transform: translateX(3px);
        }

        @media (max-width: 768px) {
          .hero-cta-inner {
            flex-direction: column;
            text-align: center;
            padding: 20px 24px;
            gap: 16px;
          }

          .hero-cta-text {
            flex-direction: column;
            gap: 8px;
          }

          .hero-cta-text > i {
            font-size: 24px;
          }

          .hero-cta-btn {
            width: 100%;
            justify-content: center;
            padding: 14px 24px;
          }
        }
      `}</style>
    </>
  )
}
