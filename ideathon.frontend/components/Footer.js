import Link from 'next/link'
import { useIdeathonConfig, useIdeathon } from '@/context/IdeathonContext'

export default function Footer() {
  const config = useIdeathonConfig()
  const { hasSlug } = useIdeathon()
  const showApply = hasSlug && !config.loading && config.applicationOpen
  const handleNavClick = (e, target) => {
    e.preventDefault();

    // Mevcut sayfada section varsa smooth scroll yap
    const element = document.querySelector(target);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      return;
    }

    // Section bu sayfada yoksa — aktif ideathon anasayfasına yönlendir
    if (typeof window !== 'undefined') {
      const slug = typeof localStorage !== 'undefined' ? localStorage.getItem('ideathon_slug') : null;
      const basePath = slug ? `/${slug}` : '/';
      window.location.href = `${basePath}${target}`;
    }
  };

  const handleSwitchIdeathon = (e) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ideathon_slug');
      localStorage.removeItem('ideathon_id');
      window.location.href = '/';
    }
  };

  return (
    <footer className="emlak-footer">
      <div className="footer-container">
        <div className="footer-content">
          {/* Logo Section */}
          <div className="footer-logo-section">
            <Link href="/">
              <img loading="lazy"
                src="/img/dark-logo.svg"
                alt="Emlak Konut Logo"
                className="footer-logo"
              />
            </Link>
            <p className="footer-tagline">Güçlü yarınlar için, yenilikçi adımlar atıyoruz.</p>
            {/* Ideathon Seç Butonu */}
            <button onClick={handleSwitchIdeathon} className="footer-switch-btn">
              <i className="bi bi-grid-3x3-gap-fill"></i>
              <span>Ideathon Seç</span>
            </button>
          </div>

          {/* Navigation Menus */}
          <div className="footer-menu-section">
            {/* Programlar */}
            <div className="footer-menu">
              <h4 className="footer-menu-title"></h4>
              <ul className="footer-menu-list">
                <li><a href="#about" onClick={(e) => handleNavClick(e, '#about')}>Ideathon</a></li>
                <li><Link href="/girisimciler">Girişimciler</Link></li>
                <li><a href="#programs" onClick={(e) => handleNavClick(e, '#programs')}>Odak Alanlarımız</a></li>
                <li><a href="#timeline" onClick={(e) => handleNavClick(e, '#timeline')}>Takvim</a></li>
                <li><a href="#awards" onClick={(e) => handleNavClick(e, '#awards')}>Ödüller</a></li>
              </ul>
            </div>

            {/* Şirket */}
            <div className="footer-menu">
              <h4 className="footer-menu-title"></h4>
              <ul className="footer-menu-list">
                <li><a href="#support" onClick={(e) => handleNavClick(e, '#support')}>Ideathon Kapsamı</a></li>
                <li><a href="#faq" onClick={(e) => handleNavClick(e, '#faq')}>Sıkça Sorulan Sorular</a></li>
                <li><Link href="/faydali-linkler">Faydalı Linkler</Link></li>
                <li><a href="#contact" onClick={(e) => handleNavClick(e, '#contact')}>Bize Ulaşın</a></li>
                <li><Link href="/gizlilik-politikasi">Gizlilik Politikası</Link></li>
                <li><Link href="/kullanim-sartlari">Kullanım Şartları</Link></li>
              </ul>
            </div>

            {/* Sosyal Medya */}
            <div className="footer-menu">
              <h4 className="footer-menu-title"></h4>
              <div className="footer-social-icons">
                <a
                  href="https://www.linkedin.com/company/anahtar-fikirler/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-icon"
                  aria-label="LinkedIn"
                >
                  <i className="bi bi-linkedin" aria-hidden="true"></i>
                </a>
                <a
                  href="https://x.com/anahtarfikirler"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-icon"
                  aria-label="X (Twitter)"
                >
                  <i className="bi bi-twitter-x" aria-hidden="true"></i>
                </a>
                <a
                  href="https://www.instagram.com/anahtarfikirler"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-icon"
                  aria-label="Instagram"
                >
                  <i className="bi bi-instagram" aria-hidden="true"></i>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Başvuru CTA */}
        {showApply && (
          <div className="footer-apply-cta mb-2">
            <div className="footer-apply-inner">
              <div className="footer-apply-text">
                <i className="bi bi-rocket-takeoff-fill"></i>
                <span>Başvurular devam ediyor — hemen katıl!</span>
              </div>
              <Link href="/basvuru" className="footer-apply-btn">
                <span>Başvuru Yap</span>
                <i className="bi bi-arrow-right"></i>
              </Link>
            </div>
          </div>
        )}

        {/* Copyright */}
        <div className="footer-copyright">
          <div className="footer-copyright-content">
            <div className="footer-copyright-left">
              <p>
                © 2026 Emlak Konut. Tüm hakları saklıdır. | {' '}
                <a
                  href="https://ekaenerjiteknoloji.com.tr/"
                  target="_blank"
                  className="text-white"
                  rel="noopener noreferrer"
                >
                  EKA Enerji ve Teknoloji A.Ş.
                </a>
              </p>
            </div>
            <div className="footer-copyright-right">
              <img loading="lazy"
                src="/img/footer-logo-3.svg"
                alt="Emlak Konut Logo"
                className="footer-copyright-logo"
              />
              <img loading="lazy"
                src="/img/anahtarfikirler.png"
                alt="Anahtar Fikirler Logo"
                className="footer-copyright-logo footer-second-logo"
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
