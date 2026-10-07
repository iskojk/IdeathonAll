/**
 * 404 - Sayfa Bulunamadı
 * Custom 404 Error Page
 */

import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';

export default function Custom404() {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  return (
    <>
      <Head>
        <title>404 - Sayfa Bulunamadı | Emlak Konut Ideathon</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <Layout>
        <section className="error-section py-100px md-py-80px sm-py-60px" style={{ marginTop: '140px', minHeight: 'calc(100vh - 140px)' }}>
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-8 col-md-10 text-center">
                {/* Error Animation */}
                <div className="error-animation mb-40px">
                  <div className="error-number">404</div>
                  <div className="error-icon-wrapper">
                    <div className="error-icon">
                      <i className="bi bi-exclamation-triangle-fill"></i>
                    </div>
                    <div className="error-waves">
                      <div className="wave wave-1"></div>
                      <div className="wave wave-2"></div>
                      <div className="wave wave-3"></div>
                    </div>
                  </div>
                </div>

                {/* Error Content */}
                <div className="error-content">
                  <div className="inline-block mb-30px animate-fade-in">
                    <span className="ps-25px pe-25px pt-8px pb-8px text-uppercase alt-font text-red fs-13 lh-28 fw-600 border-radius-100px bg-light-red d-inline-flex align-items-center">
                      <i className="bi bi-x-circle fs-16 me-10px"></i>Sayfa Bulunamadı
                    </span>
                  </div>

                  <h1 className="alt-font text-dark-gray fw-700 mb-20px lh-52 md-lh-44 sm-lh-40 animate-fade-in-up">
                    Aradığınız Sayfa <br />
                    <span className="text-primary-blue">Bulunamadı</span>
                  </h1>

                  <p className="text-dark-gray lh-32 fs-18 mb-40px animate-fade-in-up-delay">
                    Üzgünüz, aradığınız sayfa mevcut değil veya taşınmış olabilir.
                    <br />
                    Ana sayfaya dönebilir veya aşağıdaki bağlantıları kullanabilirsiniz.
                  </p>

                  {/* Action Buttons */}
                  <div className="error-actions d-flex flex-wrap gap-3 justify-content-center mb-50px animate-fade-in-up-delay">
                    <Link href="/" className="btn-modern-apply">
                      <i className="bi bi-house-door-fill"></i>
                      <span>Ana Sayfa</span>
                    </Link>
                    <button onClick={handleGoBack} className="btn-error btn-secondary">
                      <i className="bi bi-arrow-left-circle"></i>
                      <span>Geri Dön</span>
                    </button>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </section>
      </Layout>

      <style jsx>{`
        .error-section {
          background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
        }

        /* Error Animation */
        .error-animation {
          position: relative;
          padding: 40px 0;
        }

        .error-number {
          font-size: 180px;
          font-weight: 900;
          background: linear-gradient(135deg, #042070 0%, #2563eb 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1;
          opacity: 0.1;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: pulse-slow 3s ease-in-out infinite;
        }

        .error-icon-wrapper {
          position: relative;
          display: inline-block;
          z-index: 1;
        }

        .error-icon {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 60px;
          box-shadow: 0 10px 40px rgba(239, 68, 68, 0.3);
          animation: bounce 2s ease-in-out infinite;
          position: relative;
          z-index: 2;
        }

        .error-waves {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 120px;
          height: 120px;
        }

        .wave {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: 3px solid #ef4444;
          border-radius: 50%;
          opacity: 0;
          animation: wave-animation 3s ease-out infinite;
        }

        .wave-1 {
          animation-delay: 0s;
        }

        .wave-2 {
          animation-delay: 1s;
        }

        .wave-3 {
          animation-delay: 2s;
        }

        /* Action Buttons */
        .btn-error {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding: 16px 32px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .btn-error i {
          font-size: 20px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #042070 0%, #2563eb 100%);
          color: white;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(4, 32, 112, 0.3);
        }

        .btn-secondary {
          background: white;
          color: #042070;
          border: 2px solid #e5e7eb;
        }

        .btn-secondary:hover {
          background: #f8fafc;
          border-color: #042070;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
        }

        /* Quick Links */
        .quick-links-section {
          background: white;
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
          border: 1px solid #f3f4f6;
        }

        .quick-links-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 20px;
        }

        .quick-link-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 24px 16px;
          background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
          border: 2px solid #e5e7eb;
          border-radius: 16px;
          text-decoration: none;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .quick-link-card:hover {
          transform: translateY(-5px);
          border-color: #042070;
          box-shadow: 0 8px 25px rgba(4, 32, 112, 0.15);
        }

        .quick-link-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, #042070 0%, #2563eb 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
          transition: all 0.3s ease;
        }

        .quick-link-card:hover .quick-link-icon {
          transform: scale(1.1) rotate(5deg);
        }

        .quick-link-text {
          font-size: 14px;
          font-weight: 600;
          color: #042070;
          text-align: center;
        }

        /* Animations */
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.1;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 0.15;
            transform: translate(-50%, -50%) scale(1.05);
          }
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes wave-animation {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(2.5);
            opacity: 0;
          }
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

        .animate-fade-in-up-delay-2 {
          animation: fadeInUp 0.6s ease-out 0.3s both;
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

        /* Custom Colors */
        .text-red {
          color: #ef4444;
        }

        .bg-light-red {
          background: #fef2f2;
        }

        /* Responsive */
        @media (max-width: 991px) {
          .error-number {
            font-size: 140px;
          }

          .error-icon {
            width: 100px;
            height: 100px;
            font-size: 50px;
          }

          .error-waves {
            width: 100px;
            height: 100px;
          }
        }

        @media (max-width: 767px) {
          .error-number {
            font-size: 100px;
          }

          .error-icon {
            width: 80px;
            height: 80px;
            font-size: 40px;
          }

          .error-waves {
            width: 80px;
            height: 80px;
          }

          .error-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .btn-error {
            width: 100%;
            justify-content: center;
          }

          .quick-links-section {
            padding: 30px 20px;
          }

          .quick-links-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }

          .quick-link-card {
            padding: 20px 12px;
          }

          .quick-link-icon {
            width: 45px;
            height: 45px;
            font-size: 22px;
          }

          .quick-link-text {
            font-size: 13px;
          }
        }

        @media (max-width: 575px) {
          .error-section {
            padding-top: 60px !important;
            padding-bottom: 60px !important;
          }

          .error-animation {
            padding: 30px 0;
          }

          h1 {
            font-size: 28px !important;
          }

          p {
            font-size: 16px !important;
          }
        }
      `}</style>
    </>
  );
}

