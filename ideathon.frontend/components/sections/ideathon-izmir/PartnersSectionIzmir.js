const FEATURED_PARTNER = { src: '/img/izmir/1.png', alt: 'Ana Paydaş' }

const PARTNERS = [
  { src: '/img/izmir/2.png', alt: 'Paydaş 2' },
  { src: '/img/izmir/3.png', alt: 'Paydaş 3' },
  { src: '/img/izmir/4.png', alt: 'Paydaş 4' },
  { src: '/img/izmir/5.png', alt: 'Paydaş 5' },
  { src: '/img/izmir/6.png', alt: 'Paydaş 6' },
]

function repeatToFill(arr) {
  const count = Math.ceil(12 / arr.length)
  const base = Array(count).fill(arr).flat()
  return [...base, ...base]
}

export default function PartnersSectionIzmir() {
  const slides = repeatToFill(PARTNERS)

  return (
    <section className="partners-section-izmir">
      <div className="container">
        <div className="row">
          <div className="col-12 text-center mb-30px">
            <span
              className="ps-20px pe-20px pt-5px pb-5px mb-20px text-uppercase alt-font text-primary-blue fs-12 lh-26 fw-600 border-radius-100px bg-primary-blue-light d-inline-flex"
            >
              <i className="bi bi-people-fill fs-30 me-5px"></i>
            </span>
            <h2 className="alt-font text-dark-gray fw-700 mb-25px">
              Paydaşlarımız
            </h2>
            <div className="psi-featured">
              <img src={FEATURED_PARTNER.src} alt={FEATURED_PARTNER.alt} />
            </div>
          </div>
        </div>
      </div>

      <div className="psi-track-wrapper">
        <div className="psi-fade psi-fade-left"></div>
        <div className="psi-track">
          {slides.map((partner, i) => (
            <div key={i} className="psi-slide">
              <img src={partner.src} alt={partner.alt} loading="lazy" />
            </div>
          ))}
        </div>
        <div className="psi-fade psi-fade-right"></div>
      </div>

      <style jsx global>{`
        .partners-section-izmir {
          padding: 60px 0 40px;
          background: transparent;
          overflow: hidden;
        }

        .psi-featured {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 32px;
        }

        .psi-featured img {
          max-height: 80px;
          width: auto;
          object-fit: contain;
        }

        .psi-track-wrapper {
          position: relative;
          width: 100%;
          overflow: hidden;
        }

        .psi-fade {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 120px;
          z-index: 2;
          pointer-events: none;
        }

        .psi-fade-left {
          left: 0;
          background: linear-gradient(90deg, #fff 0%, transparent 100%);
        }

        .psi-fade-right {
          right: 0;
          background: linear-gradient(270deg, #fff 0%, transparent 100%);
        }

        .psi-track {
          display: flex;
          align-items: center;
          gap: 48px;
          animation: psi-scroll 30s linear infinite;
          width: max-content;
        }

        .psi-track:hover {
          animation-play-state: paused;
        }

        .psi-slide {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 64px;
          padding: 0 12px;
        }

        .psi-slide img {
          max-height: 56px;
          max-width: 160px;
          width: auto;
          object-fit: contain;
          opacity: 0.7;
          transition: all 0.4s ease;
        }

        .psi-slide img:hover {
          opacity: 1;
          transform: scale(1.08);
        }

        @keyframes psi-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @media (max-width: 768px) {
          .partners-section-izmir {
            padding: 40px 0 30px;
          }

          .psi-featured img {
            max-height: 64px;
          }

          .psi-track {
            gap: 32px;
          }

          .psi-slide {
            height: 52px;
          }

          .psi-slide img {
            max-height: 44px;
            max-width: 120px;
          }

          .psi-fade {
            width: 60px;
          }
        }
      `}</style>
    </section>
  )
}
