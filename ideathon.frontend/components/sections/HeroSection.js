import Link from 'next/link'

export default function HeroSection() {
  return (
    <section id="home" className="hero-section-modern" style={{ marginTop: '140px' }}>
      {/* Background Elements */}
      <div className="hero-bg-pattern"></div>

      <div className="container">
        <div className="row align-items-center">
          {/* Left Content */}
          <div className="col-lg-6 col-md-12 hero-content-simple">
            {/* Main Heading */}
            <h1 
              className="hero-title-simple" 
            >
              Emlak Konut Ideathon<br />
              <span className="text-red-gradient">Başvurular Sona Erdi</span>
            </h1>

            {/* Simple Description */}
            <p 
              className="hero-description-simple" 
            >
              Yaşam Kalitesini Artıran Akıllı Site Yönetimi Çözümleri
              
            </p>

            {/* Status Badge */}
            <div className="application-closed-badge">
              <i className="bi bi-lock-fill"></i>
              <span>Başvuru Süreci Tamamlandı</span>
            </div>
          </div>

          {/* Right Content - Image with Achievement Buttons */}
          <div 
            className="col-lg-6 col-md-12 hero-visual-simple" 
          >
            <div className="hero-image-container-simple">
              <img 
                src="/img/sli.webp" 
                alt="Emlak Konut Ideathon - Akıllı Şehir Teknolojileri" 
                className="hero-image-simple" 
          
              />
            </div>

            {/* Achievement Buttons */}
            <div 
              className="achievement-buttons" 
            >
              <div 
                className="achievement-btn" 
              >
                <div className="achievement-number">500+</div>
                <div className="achievement-label">İnovatif Çözüm</div>
              </div>
              <div 
                className="achievement-btn" 
              >
                <div className="achievement-number">25+</div>
                <div className="achievement-label">Pilot Uygulama</div>
              </div>
              <div 
                className="achievement-btn" 
              >
                <div className="achievement-number">1000+</div>
                <div className="achievement-label">Katılımcı</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .text-red-gradient {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .application-closed-badge {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding: 16px 32px;
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          border: 2px solid #ef4444;
          border-radius: 50px;
          color: #991b1b;
          font-size: 16px;
          font-weight: 600;
          box-shadow: 0 4px 15px rgba(239, 68, 68, 0.2);
          animation: pulse 2s infinite;
        }

        .application-closed-badge i {
          font-size: 20px;
          color: #ef4444;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 4px 15px rgba(239, 68, 68, 0.2);
          }
          50% {
            transform: scale(1.02);
            box-shadow: 0 6px 20px rgba(239, 68, 68, 0.3);
          }
        }

        @media (max-width: 767px) {
          .application-closed-badge {
            font-size: 14px;
            padding: 12px 24px;
          }

          .application-closed-badge i {
            font-size: 18px;
          }
        }
      `}</style>
    </section>
  )
}

