import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '@/context/AuthContext'
import { useIdeathonConfig, useIdeathon } from '@/context/IdeathonContext'
import { useSocket } from '@/context/SocketContext'
import { messagingAPI } from '@/lib/api'
import { getInitials } from '@/lib/auth'
import { isEntrepreneurPath, authFlowLinks } from '@/lib/authRoutes'

export default function Header() {
  const router = useRouter();
  const loginHref = authFlowLinks({ entrepreneur: isEntrepreneurPath(router.pathname) || router.query.source === 'girisimciler', redirect: router.query.redirect }).login;
  const { user, isAuthenticated, logout } = useAuth();
  const config = useIdeathonConfig();
  const { hasSlug } = useIdeathon();
  const { socket } = useSocket();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSlugModal, setShowSlugModal] = useState(false);
  const profileMenuRef = useRef(null);

  // Load unread count
  const loadUnreadCount = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await messagingAPI.getUnreadCount();
      setUnreadCount(response.data?.unreadCount || 0);
    } catch (err) {
      console.error('Okunmamış mesaj sayısı yüklenemedi:', err);
    }
  };

  // İlk yükleme ve socket event'leri için unread count
  useEffect(() => {
    if (isAuthenticated) {
      loadUnreadCount();
    }
  }, [isAuthenticated]);

  // Socket event'lerini dinle (yeni mesaj geldiğinde unread count güncelle)
  useEffect(() => {
    if (!socket) return;

    socket.on('message:new', () => {
      loadUnreadCount();
    });

    return () => {
      socket.off('message:new');
    };
  }, [socket]);

  // Click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  // Bootstrap collapse event'lerini dinle ve hamburger animasyonunu senkronize et
  useEffect(() => {
    const navbar = document.getElementById('navbarNav');
    if (!navbar) return;

    const handleCollapseShow = () => {
      document.body.classList.add('navbar-collapse-show');
    };

    const handleCollapseHide = () => {
      document.body.classList.remove('navbar-collapse-show');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.documentElement.classList.remove('overflow-hidden');
    };

    const handleCollapseHidden = () => {
      document.body.classList.remove('navbar-collapse-show');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.documentElement.classList.remove('overflow-hidden');
    };

    navbar.addEventListener('show.bs.collapse', handleCollapseShow);
    navbar.addEventListener('hide.bs.collapse', handleCollapseHide);
    navbar.addEventListener('hidden.bs.collapse', handleCollapseHidden);

    return () => {
      navbar.removeEventListener('show.bs.collapse', handleCollapseShow);
      navbar.removeEventListener('hide.bs.collapse', handleCollapseHide);
      navbar.removeEventListener('hidden.bs.collapse', handleCollapseHidden);
      document.body.classList.remove('navbar-collapse-show');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.documentElement.classList.remove('overflow-hidden');
    };
  }, []);

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const handleLogout = () => {
    setShowProfileMenu(false);
    logout();
  };

  const handleSwitchIdeathon = () => {
    setShowProfileMenu(false);
    closeMobileMenu();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ideathon_slug');
      localStorage.removeItem('ideathon_id');
      window.location.href = '/';
    }
  };

  const closeMobileMenu = useCallback(() => {
    const navbar = document.getElementById('navbarNav');
    if (navbar) {
      document.body.classList.remove('navbar-collapse-show');

      if (navbar.classList.contains('show')) {
        try {
          const bsCollapse = window.bootstrap?.Collapse?.getOrCreateInstance(navbar, { toggle: false });
          if (bsCollapse) {
            bsCollapse.hide();
          } else {
            navbar.classList.remove('show');
          }
        } catch (error) {
          navbar.classList.remove('show');
          navbar.classList.remove('collapsing');
          navbar.style.height = '';
        }
      }

      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.documentElement.classList.remove('overflow-hidden');
    }
  }, []);

  // Sayfa değiştiğinde (Next.js client-side navigation) mobil menüyü kapat
  useEffect(() => {
    const handleRouteChange = () => {
      closeMobileMenu();
      setShowProfileMenu(false);
    };

    router.events.on('routeChangeStart', handleRouteChange);
    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events, closeMobileMenu]);

  const handleNavClick = (e, target) => {
    e.preventDefault();

    // Mevcut sayfada section varsa smooth scroll yap
    const element = document.querySelector(target);
    if (element) {
      closeMobileMenu();
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      return;
    }

    // Section bu sayfada yoksa — aktif ideathon anasayfasına yönlendir
    if (typeof window !== 'undefined') {
      const slug = localStorage.getItem('ideathon_slug');
      if (!slug) {
        closeMobileMenu();
        setShowSlugModal(true);
        return;
      }
      window.location.href = `/${slug}${target}`;
    }
  };

  return (
    <header className="header-with-topbar">
      {/* Navigation */}
      <nav className="navbar navbar-expand-lg header-light bg-transparent disable-fixed">
        <div className="container-fluid">
          <div className="col-auto col-lg-3 me-lg-0 me-auto">
            <Link href="/" className="navbar-brand d-flex align-items-center">
              <img
                src="/img/cevre.png"
                alt="Çevre Şehircilik Bakanlığı Logo"
                className="csb-logo"
                loading="eager"
              />
              <img
                src="/img/dark-logo.svg"
                alt="Emlak Konut Logo"
                className="default-logo"
                loading="eager"
              />
              <img
                src="/img/dark-logo.svg"
                alt="Emlak Konut Logo"
                className="alt-logo"
                loading="lazy"
              />
              <img
                src="/img/dark-logo.svg"
                alt="Emlak Konut Logo"
                className="mobile-logo"
                loading="lazy"
              />

            </Link>
          </div>

          <div className="col-auto ms-auto md-ms-0 menu-order position-static">
            <button
              className="navbar-toggler float-start modern-hamburger"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarNav"
              aria-controls="navbarNav"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <div className="hamburger-box">
                <div className="hamburger-inner">
                  <span className="hamburger-line top-line"></span>
                  <span className="hamburger-line middle-line"></span>
                  <span className="hamburger-line bottom-line"></span>
                </div>
              </div>
            </button>

            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav">
                <li className="nav-item">
                  <a href="https://anahtarfikirler.com/" target="_blank" className="nav-link">
                    Anahtar Fikirler
                  </a>
                </li>
                <li className="nav-item">
                  <a href="#about" className="nav-link" onClick={(e) => handleNavClick(e, '#about')}>Ideathon</a>
                </li>
                <li className="nav-item">
                  <Link
                    href="/girisimciler"
                    className="nav-link"
                    aria-current={router.pathname.startsWith('/girisimciler') ? 'page' : undefined}
                    onClick={closeMobileMenu}
                  >
                    Girişimciler
                  </Link>
                </li>
                <li className="nav-item">
                  <a href="#programs" className="nav-link" onClick={(e) => handleNavClick(e, '#programs')}>Odak Alanlarımız</a>
                </li>
                <li className="nav-item">
                  <a href="#timeline" className="nav-link" onClick={(e) => handleNavClick(e, '#timeline')}>Takvim</a>
                </li>
                <li className="nav-item">
                  <a href="#awards" className="nav-link" onClick={(e) => handleNavClick(e, '#awards')}>Ödüller</a>
                </li>
                <li className="nav-item">
                  <a href="#contact" className="nav-link" onClick={(e) => handleNavClick(e, '#contact')}>Bize Ulaşın</a>
                </li>


                <ul className="navbar-nav">
                  {/* ... mevcut desktop linklerin ... */}

                  {/* Mobile özel alan */}
                  <div className="mobile-menu-container d-lg-none">


                    <div className="mobile-menu-grid">
                      {isAuthenticated ? (
                        <>
                          <Link href="/girisimciler/basvuru" className="mobile-menu-card apply-card" onClick={closeMobileMenu}>
                            <div className="mobile-menu-icon"><i className="bi bi-briefcase"></i></div>
                            <span>Girişimci Başvurum</span>
                          </Link>
                          {/* Ideathon Seç Butonu */}
                          <button
                            onClick={handleSwitchIdeathon}
                            className="mobile-menu-card switch-card"
                          >
                            <div className="mobile-menu-icon">
                              <i className="bi bi-grid-3x3-gap-fill"></i>
                            </div>
                            <div className="mobile-menu-text">
                              <span className="mobile-menu-title">Ideathon Seç</span>
                              <span className="mobile-menu-subtitle">Diğer programları gör</span>
                            </div>
                            <div className="mobile-menu-arrow">
                              <i className="bi bi-chevron-right"></i>
                            </div>
                          </button>

                          {/* Başvuru Yap Butonu */}
                          {hasSlug && !config.loading && config.applicationOpen && (
                            <Link href="/basvuru" className="mobile-menu-card apply-card" onClick={() => closeMobileMenu()}>
                              <div className="mobile-menu-icon">
                                <i className="bi bi-send-fill"></i>
                              </div>
                              <div className="mobile-menu-text">
                                <span className="mobile-menu-title">Başvuru Yap</span>
                                <span className="mobile-menu-subtitle">Hemen başvurunu oluştur</span>
                              </div>
                              <div className="mobile-menu-arrow">
                                <i className="bi bi-chevron-right"></i>
                              </div>
                            </Link>
                          )}

                          {/* Giriş Yapmış Kullanıcı Menüleri */}
                          <Link href="/mentorluk/mentorlar" className="mobile-menu-card" onClick={() => closeMobileMenu()}>
                            <div className="mobile-menu-icon">
                              <i className="bi bi-people-fill"></i>
                            </div>
                            <div className="mobile-menu-text">
                              <span className="mobile-menu-title">Mentörler</span>
                              <span className="mobile-menu-subtitle">Mentörleri keşfet</span>
                            </div>
                            <div className="mobile-menu-arrow">
                              <i className="bi bi-chevron-right"></i>
                            </div>
                          </Link>

                          <Link href="/mentorluk/toplantilar" className="mobile-menu-card" onClick={() => closeMobileMenu()}>
                            <div className="mobile-menu-icon">
                              <i className="bi bi-calendar2-event"></i>
                            </div>
                            <div className="mobile-menu-text">
                              <span className="mobile-menu-title">Toplantılarım</span>
                              <span className="mobile-menu-subtitle">Randevularını yönet</span>
                            </div>
                            <div className="mobile-menu-arrow">
                              <i className="bi bi-chevron-right"></i>
                            </div>
                          </Link>

                          <Link href="/basvurularim" className="mobile-menu-card" onClick={() => closeMobileMenu()}>
                            <div className="mobile-menu-icon">
                              <i className="bi bi-folder-fill"></i>
                            </div>
                            <div className="mobile-menu-text">
                              <span className="mobile-menu-title">Başvurularım</span>
                              <span className="mobile-menu-subtitle">Başvurularını görüntüle</span>
                            </div>
                            <div className="mobile-menu-arrow">
                              <i className="bi bi-chevron-right"></i>
                            </div>
                          </Link>

                          <Link href="/faydali-linkler" className="mobile-menu-card" onClick={() => closeMobileMenu()}>
                            <div className="mobile-menu-icon">
                              <i className="bi bi-link-45deg"></i>
                            </div>
                            <div className="mobile-menu-text">
                              <span className="mobile-menu-title">Faydalı Linkler</span>
                              <span className="mobile-menu-subtitle">Mevzuat ve kurumsal linkler</span>
                            </div>
                            <div className="mobile-menu-arrow">
                              <i className="bi bi-chevron-right"></i>
                            </div>
                          </Link>

                          <Link href="/mentorluk/mesajlar" className="mobile-menu-card" onClick={() => closeMobileMenu()}>
                            <div className="mobile-menu-icon">
                              <i className="bi bi-chat-dots-fill"></i>
                              {unreadCount > 0 && (
                                <span className="menu-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                              )}
                            </div>
                            <div className="mobile-menu-text">
                              <span className="mobile-menu-title">Mesajlar</span>
                              <span className="mobile-menu-subtitle">Mentör mesajlaşma</span>
                            </div>
                            <div className="mobile-menu-arrow">
                              <i className="bi bi-chevron-right"></i>
                            </div>
                          </Link>

                          <Link href="/profilim" className="mobile-menu-card" onClick={() => closeMobileMenu()}>
                            <div className="mobile-menu-icon">
                              <i className="bi bi-person-fill"></i>
                            </div>
                            <div className="mobile-menu-text">
                              <span className="mobile-menu-title">Profilim</span>
                              <span className="mobile-menu-subtitle">Bilgilerini düzenle</span>
                            </div>
                            <div className="mobile-menu-arrow">
                              <i className="bi bi-chevron-right"></i>
                            </div>
                          </Link>

                          <Link href="/ayarlar/bildirimler" className="mobile-menu-card" onClick={() => closeMobileMenu()}>
                            <div className="mobile-menu-icon">
                              <i className="bi bi-bell-fill"></i>
                            </div>
                            <div className="mobile-menu-text">
                              <span className="mobile-menu-title">Bildirim Ayarları</span>
                              <span className="mobile-menu-subtitle">Email tercihlerini yönet</span>
                            </div>
                            <div className="mobile-menu-arrow">
                              <i className="bi bi-chevron-right"></i>
                            </div>
                          </Link>

                          {/* Çıkış Yap Butonu */}
                          <button
                            onClick={(e) => {
                              handleLogout();
                              closeMobileMenu();
                            }}
                            className="mobile-menu-card logout-card"
                          >
                            <div className="mobile-menu-icon">
                              <i className="bi bi-box-arrow-right"></i>
                            </div>
                            <div className="mobile-menu-text">
                              <span className="mobile-menu-title">Çıkış Yap</span>
                              <span className="mobile-menu-subtitle">Oturumu sonlandır</span>
                            </div>
                            <div className="mobile-menu-arrow">
                              <i className="bi bi-chevron-right"></i>
                            </div>
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Ideathon Seç — her zaman en üstte */}
                          <button
                            onClick={() => {
                              closeMobileMenu();
                              if (typeof window !== 'undefined') {
                                localStorage.removeItem('ideathon_slug');
                                localStorage.removeItem('ideathon_id');
                                window.location.href = '/';
                              }
                            }}
                            className="mobile-menu-card switch-card"
                          >
                            <div className="mobile-menu-icon">
                              <i className="bi bi-grid-3x3-gap-fill"></i>
                            </div>
                            <div className="mobile-menu-text">
                              <span className="mobile-menu-title">Ideathon Seç</span>
                              <span className="mobile-menu-subtitle">Diğer programları gör</span>
                            </div>
                            <div className="mobile-menu-arrow">
                              <i className="bi bi-chevron-right"></i>
                            </div>
                          </button>

                          {/* Giriş Yapmamış Kullanıcı Menüleri */}
                          <Link href={loginHref} className="mobile-menu-card login-card" onClick={() => closeMobileMenu()}>
                            <div className="mobile-menu-icon">
                              <i className="bi bi-box-arrow-in-right"></i>
                            </div>
                            <div className="mobile-menu-text">
                              <span className="mobile-menu-title">Giriş Yap</span>
                              <span className="mobile-menu-subtitle">Hesabına eriş</span>
                            </div>
                            <div className="mobile-menu-arrow">
                              <i className="bi bi-chevron-right"></i>
                            </div>
                          </Link>

                          {hasSlug && !config.loading && config.registrationOpen && (
                            <Link href="/register" className="mobile-menu-card register-card" onClick={() => closeMobileMenu()}>
                              <div className="mobile-menu-icon">
                                <i className="bi bi-person-plus-fill"></i>
                              </div>
                              <div className="mobile-menu-text">
                                <span className="mobile-menu-title">Kayıt Ol</span>
                                <span className="mobile-menu-subtitle">Yeni hesap oluştur</span>
                              </div>
                              <div className="mobile-menu-arrow">
                                <i className="bi bi-chevron-right"></i>
                              </div>
                            </Link>
                          )}

                          {hasSlug && !config.loading && config.applicationOpen && (
                            <Link href="/basvuru" className="mobile-menu-card register-card" onClick={() => closeMobileMenu()}>
                              <div className="mobile-menu-icon">
                                <i className="bi bi-file-earmark-plus-fill"></i>
                              </div>
                              <div className="mobile-menu-text">
                                <span className="mobile-menu-title">Başvur</span>
                                <span className="mobile-menu-subtitle">Başvuru yap</span>
                              </div>
                              <div className="mobile-menu-arrow">
                                <i className="bi bi-chevron-right"></i>
                              </div>
                            </Link>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </ul>

              </ul>
            </div>
          </div>

          <div className="col-auto text-end d-none d-sm-flex">
            <div className="header-icon">
              {/* Authenticated User - Profile Menu */}
              {isAuthenticated && user ? (
                <div className="profile-menu-wrapper" ref={profileMenuRef}>
                  <button
                    className="profile-avatar-btn"
                    onClick={toggleProfileMenu}
                    aria-label="Profil Menüsü"
                  >
                    <div className="profile-avatar">
                      <span className="avatar-initials">{getInitials(user.name)}</span>
                    </div>
                    <i className={`bi bi-chevron-${showProfileMenu ? 'up' : 'down'} ms-2`}></i>
                  </button>

                  {/* Profile Dropdown Menu */}
                  {showProfileMenu && (
                    <div className="profile-dropdown-menu">
                      <div className="profile-dropdown-header">
                        <div className="profile-avatar-large">
                          <span className="avatar-initials">{getInitials(user.name)}</span>
                        </div>
                        <div className="profile-info text-start">
                          <p className="profile-name-large">{user.name}</p>
                          <p className="profile-email">{user.email}</p>
                        </div>
                      </div>
                      <div className="profile-dropdown-divider"></div>
                      <ul className="profile-dropdown-list">
                        <li>
                          <button onClick={handleSwitchIdeathon} className="profile-dropdown-item switch-item">
                            <i className="bi bi-grid-3x3-gap-fill"></i>
                            <span>Ideathon Seç</span>
                          </button>
                        </li>
                        {hasSlug && !config.loading && config.applicationOpen && (
                          <li>
                            <Link href="/basvuru" className="profile-dropdown-item apply-item" onClick={() => setShowProfileMenu(false)}>
                              <i className="bi bi-send-fill"></i>
                              <span>Başvuru Yap</span>
                            </Link>
                          </li>
                        )}
                      </ul>
                      <div className="profile-dropdown-divider"></div>
                      <ul className="profile-dropdown-list">
                        <li>
                          <Link href="/mentorluk/mentorlar" className="profile-dropdown-item" onClick={() => setShowProfileMenu(false)}>
                            <i className="bi bi-people-fill"></i>
                            <span>Mentörler</span>
                          </Link>
                        </li>
                        <li>
                          <Link href="/mentorluk/toplantilar" className="profile-dropdown-item" onClick={() => setShowProfileMenu(false)}>
                            <i className="bi bi-calendar2-event"></i>
                            <span>Toplantılarım</span>
                          </Link>
                        </li>
                        <li>
                          <Link href="/girisimciler/basvuru" className="profile-dropdown-item" onClick={() => setShowProfileMenu(false)}>
                            <i className="bi bi-briefcase"></i>
                            <span>Girişimci Başvurum</span>
                          </Link>
                        </li>
                        <li>
                          <Link href="/basvurularim" className="profile-dropdown-item" onClick={() => setShowProfileMenu(false)}>
                            <i className="bi bi-file-earmark-text"></i>
                            <span>Başvurularım</span>
                          </Link>
                        </li>
                        <li>
                          <Link href="/faydali-linkler" className="profile-dropdown-item" onClick={() => setShowProfileMenu(false)}>
                            <i className="bi bi-link-45deg"></i>
                            <span>Faydalı Linkler</span>
                          </Link>
                        </li>
                        <li>
                          <Link href="/mentorluk/mesajlar" className="profile-dropdown-item" onClick={() => setShowProfileMenu(false)}>
                            <i className="bi bi-chat-dots"></i>
                            <span>Mesajlar</span>
                            {unreadCount > 0 && (
                              <span className="dropdown-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                            )}
                          </Link>
                        </li>
                        <li>
                          <Link href="/profilim" className="profile-dropdown-item" onClick={() => setShowProfileMenu(false)}>
                            <i className="bi bi-person"></i>
                            <span>Profilim</span>
                          </Link>
                        </li>
                        <li>
                          <Link href="/ayarlar/bildirimler" className="profile-dropdown-item" onClick={() => setShowProfileMenu(false)}>
                            <i className="bi bi-bell"></i>
                            <span>Bildirim Ayarları</span>
                          </Link>
                        </li>
                      </ul>
                      <div className="profile-dropdown-divider"></div>
                      <ul className="profile-dropdown-list">
                        <li>
                          <button onClick={handleLogout} className="profile-dropdown-item logout-item">
                            <i className="bi bi-box-arrow-right"></i>
                            <span>Çıkış Yap</span>
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                /* Not Authenticated - Sadece Giriş Yap Butonu */
                <div className="header-auth-buttons d-flex align-items-center gap-3">
                  <Link href={loginHref} className="btn-modern-apply">
                    <span className="btn-text">Giriş Yap</span>
                    <div className="btn-icon">
                      <i className="bi bi-box-arrow-in-right"></i>
                    </div>
                    <div className="btn-glow"></div>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      {/* /Navigation */}

      {/* Ideathon Seçimi Modal */}
      {showSlugModal && (
        <div className="slug-modal-overlay" onClick={() => setShowSlugModal(false)}>
          <div className="slug-modal" onClick={(e) => e.stopPropagation()}>
            <div className="slug-modal-icon">
              <i className="bi bi-grid-3x3-gap-fill"></i>
            </div>
            <h3 className="slug-modal-title">Ideathon Seçiniz</h3>
            <p className="slug-modal-desc">
              Devam etmek için lütfen bir Ideathon programı seçiniz.
            </p>
            <button
              className="slug-modal-btn"
              onClick={() => {
                setShowSlugModal(false);
                window.location.href = '/';
              }}
            >
              <i className="bi bi-arrow-right-circle me-2"></i>
              Programları Görüntüle
            </button>
            <button className="slug-modal-close" onClick={() => setShowSlugModal(false)}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .header-with-topbar .nav-link[aria-current="page"] { color: #0079ca; }
        @media (min-width: 992px) {
          .header-with-topbar .navbar > .container-fluid { padding-left: 30px; padding-right: 30px; flex-wrap: nowrap; gap: 12px; }
          .header-with-topbar .navbar > .container-fluid > .col-lg-3 { width: auto; flex-shrink: 0; }
          .header-with-topbar .navbar .navbar-nav .nav-link { padding-left: 12px; padding-right: 12px; white-space: nowrap; font-size: 15px; }
        }
        @media (min-width: 992px) and (max-width: 1199px) {
          .header-with-topbar .navbar > .container-fluid { padding-left: 20px; padding-right: 20px; gap: 6px; }
          .header-with-topbar .navbar-brand img { max-height: 60px; width: auto; }
          .header-with-topbar .navbar .navbar-nav .nav-link { padding-left: 7px; padding-right: 7px; font-size: 13px; }
          .header-with-topbar .header-auth-buttons .btn-modern-apply { padding: 12px 18px; gap: 8px; font-size: 13px; }
        }
      `}</style>
      <style jsx>{`
        .slug-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 100000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: slugFadeIn 0.2s ease-out;
        }

        .slug-modal {
          position: relative;
          background: white;
          border-radius: 20px;
          padding: 48px 40px 40px;
          max-width: 420px;
          width: 100%;
          text-align: center;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.2);
          animation: slugSlideUp 0.3s ease-out;
        }

        .slug-modal-icon {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          background: linear-gradient(135deg, #042070 0%, #2563eb 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-size: 28px;
          color: white;
        }

        .slug-modal-title {
          font-size: 22px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 10px;
        }

        .slug-modal-desc {
          font-size: 15px;
          color: #64748b;
          line-height: 1.6;
          margin-bottom: 28px;
        }

        .slug-modal-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 14px 28px;
          background: linear-gradient(135deg, #042070 0%, #2563eb 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(4, 32, 112, 0.25);
        }

        .slug-modal-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(4, 32, 112, 0.35);
        }

        .slug-modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: #f1f5f9;
          color: #64748b;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .slug-modal-close:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        @keyframes slugFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slugSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 480px) {
          .slug-modal {
            padding: 40px 24px 32px;
          }
          .slug-modal-title {
            font-size: 20px;
          }
        }
      `}</style>
    </header>

  )
}
