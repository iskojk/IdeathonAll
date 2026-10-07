/**
 * Register Page
 * Kullanıcı kayıt sayfası
 * Config'deki registrationOpen değerine göre form veya kapalı mesajı gösterir.
 */

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import Layout from '@/components/Layout';
import ErrorMessage from '@/components/ErrorMessage';
import { useAuth } from '@/context/AuthContext';
import { useIdeathonConfig, useIdeathon } from '@/context/IdeathonContext';
import { validateEmail, validatePassword, validateRequired, validatePhone } from '@/utils/validation';
import { safeRedirect, authFlowLinks } from '@/lib/authRoutes';

export default function RegisterPage({ entrepreneur = false }) {
  const router = useRouter();
  const { register, isAuthenticated, loading: authLoading } = useAuth();
  const config = useIdeathonConfig();
  const { hasSlug } = useIdeathon();
  const nameRef = useRef(null);
  const [landingAnim, setLandingAnim] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const redirectTo = safeRedirect(router.query.redirect, entrepreneur ? '/girisimciler/basvuru' : '/basvuru');
  const loginHref = authFlowLinks({ entrepreneur, redirect: router.query.redirect }).login;

  // Zaten giriş yapmışsa yönlendir
  useEffect(() => {
    if (router.isReady && isAuthenticated && !authLoading) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, authLoading, router.isReady, redirectTo, router]);

  useEffect(() => {
    if (router.query.animate !== '1') return

    setLandingAnim(true)

    const timer = setTimeout(() => {
      if (nameRef.current) {
        nameRef.current.focus()

        const rect = nameRef.current.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2

        const overlay = document.createElement('div')
        overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;pointer-events:none;overflow:hidden;'
        document.body.appendChild(overlay)

        for (let i = 0; i < 14; i++) {
          const b = document.createElement('div')
          const size = 5 + Math.random() * 16
          const angle = (Math.PI * 2 * i) / 14
          const dist = 25 + Math.random() * 50
          const hue = 210 + Math.random() * 30
          b.style.cssText = `
            position:absolute; left:${cx}px; top:${cy}px;
            width:${size}px; height:${size}px; border-radius:50%;
            background:radial-gradient(circle at 30% 30%,
              hsla(${hue},90%,65%,0.6), hsla(${hue},80%,50%,0.2));
            box-shadow: 0 0 ${size * 0.7}px hsla(${hue},90%,60%,0.3);
            pointer-events:none; opacity:0;
            transform:translate(-50%,-50%) scale(0.3);
            transition: all 0.65s cubic-bezier(0.34,1.56,0.64,1) ${i * 25}ms;
          `
          overlay.appendChild(b)
          requestAnimationFrame(() => {
            b.style.opacity = '1'
            b.style.transform = `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist}px)) scale(1)`
          })
          setTimeout(() => {
            b.style.transition = 'all 0.4s ease-out'
            b.style.opacity = '0'
            b.style.transform = `translate(calc(-50% + ${Math.cos(angle) * dist * 1.8}px), calc(-50% + ${Math.sin(angle) * dist * 1.8}px)) scale(0)`
          }, 450 + i * 25)
        }

        setTimeout(() => overlay.remove(), 1200)
      }

      const { animate, ...query } = router.query;
      router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
    }, 400)

    const clearAnim = setTimeout(() => setLandingAnim(false), 2500)

    return () => {
      clearTimeout(timer)
      clearTimeout(clearAnim)
    }
  }, [router.query.animate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (apiError) {
      setApiError('');
    }
  };

  const formatPhoneNumber = (value) => {
    let digits = value.replace(/\D/g, '')
    if (digits.length > 0 && !digits.startsWith('0')) {
      digits = '0' + digits
    }
    if (digits.length > 11) {
      digits = digits.substring(0, 11)
    }
    let formatted = digits
    if (digits.length > 4) {
      formatted = digits.substring(0, 4) + ' ' + digits.substring(4)
    }
    if (digits.length > 7) {
      formatted = digits.substring(0, 4) + ' ' + digits.substring(4, 7) + ' ' + digits.substring(7)
    }
    return formatted
  };

  const handlePhoneChange = (e) => {
    const formattedValue = formatPhoneNumber(e.target.value);
    setFormData(prev => ({ ...prev, phone: formattedValue }));

    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: '' }));
    }
    if (apiError) {
      setApiError('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!validateRequired(formData.name)) {
      newErrors.name = 'Ad Soyad gereklidir';
    } else if (formData.name.trim().split(' ').length < 2) {
      newErrors.name = 'Lütfen adınızı ve soyadınızı giriniz';
    }

    if (!validateRequired(formData.email)) {
      newErrors.email = 'E-posta adresi gereklidir';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi giriniz';
    }

    if (!validateRequired(formData.password)) {
      newErrors.password = 'Şifre gereklidir';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Şifre en az 6 karakter olmalıdır';
    }

    if (!validateRequired(formData.confirmPassword)) {
      newErrors.confirmPassword = 'Şifre tekrarı gereklidir';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Şifreler eşleşmiyor';
    }

    if (formData.phone.trim()) {
      const cleanPhone = formData.phone.replace(/\D/g, '');
      if (cleanPhone.length !== 11) {
        newErrors.phone = 'Geçerli bir telefon numarası giriniz (örn: 0555 123 45 67)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await register(formData.name, formData.email, formData.password, formData.phone, { entrepreneur });

      if (!result?.success) {
        setApiError(result?.error || 'Kayıt yapılırken bir hata oluştu');
      }
    } catch (error) {
      setApiError('Bir hata oluştu. Lütfen tekrar deneyiniz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return null;
  }

  return (
    <>
      <Head>
        <title>{entrepreneur ? 'Girişimci Kaydı' : config.registrationOpen ? 'Kayıt Ol' : 'Kayıtlar Kapalı'} - {config.name || 'Emlak Konut Ideathon'}</title>
        <meta name="description" content={entrepreneur ? 'Girişimci başvurunuz için mevcut sistemde hesabınızı oluşturun.' : config.registrationOpen ? `${config.name} platformuna kayıt olun` : `${config.name} için kayıt süreci sona ermiştir.`} />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <Layout>
        <section className="auth-section py-100px md-py-80px sm-py-60px" style={{ marginTop: '140px' }}>
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-5 col-md-7 col-sm-9">

                {!entrepreneur && !hasSlug && !config.loading ? (
                  /* ========== IDEATHON SEÇİLMEMİŞ ========== */
                  <>
                    <div className="auth-card bg-white border-radius-20px box-shadow-large p-50px md-p-40px sm-p-30px text-center">
                      <div className="closed-icon mb-30px">
                        <i className="bi bi-grid-3x3-gap-fill" style={{ color: '#2563eb' }}></i>
                      </div>
                      <div className="auth-header mb-30px">
                        <div className="inline-block mb-20px">
                          <span className="ps-25px pe-25px pt-8px pb-8px text-uppercase alt-font text-primary-blue fs-13 lh-28 fw-600 border-radius-100px bg-primary-blue-light d-inline-flex align-items-center">
                            <i className="bi bi-info-circle fs-16 me-10px"></i>Ideathon Seçimi Gerekli
                          </span>
                        </div>
                        <h2 className="alt-font text-dark-gray fw-700 mb-15px lh-44">
                          Önce Ideathon Seçmelisiniz
                        </h2>
                        <p className="text-dark-gray lh-28 fs-16 mb-20px">
                          Kayıt olabilmek için önce katılmak istediğiniz Ideathon programını seçmeniz gerekmektedir.
                        </p>
                      </div>
                      <Link href="/" className="submit-btn-primary w-100">
                        <span>Ideathon Seç</span>
                        <i className="bi bi-arrow-right"></i>
                      </Link>
                    </div>
                    <div className="d-flex justify-content-center mt-40px">
                      <Link href={loginHref} className="back-to-home-btn">
                        <i className="bi bi-box-arrow-in-right"></i>
                        Zaten hesabınız varsa giriş yapın
                      </Link>
                    </div>
                  </>
                ) : (entrepreneur || config.loading || config.registrationOpen) ? (
                  /* ========== KAYIT FORMU AÇIK ========== */
                  <>
                    <div className="auth-card bg-white border-radius-20px box-shadow-large p-50px md-p-40px sm-p-30px">
                      {/* Header */}
                      <div className="auth-header text-center mb-40px">
                        <div className="inline-block mb-20px">
                          <span className="ps-25px pe-25px pt-8px pb-8px text-uppercase alt-font text-primary-blue fs-13 lh-28 fw-600 border-radius-100px bg-primary-blue-light d-inline-flex align-items-center">
                            <i className="bi bi-person-plus-fill fs-16 me-10px"></i>Kayıt Ol
                          </span>
                        </div>
                        <h2 className="alt-font text-dark-gray fw-700 mb-10px lh-44">
                          {entrepreneur ? 'Girişimci Hesabı Oluştur' : 'Hesap Oluştur'}
                        </h2>
                        <p className="text-medium-gray lh-28 fs-15 mb-0">
                          {entrepreneur ? 'Girişimci başvurunuza başlamak için hesabınızı oluşturun.' : `${config.name} için kayıt olun`}
                        </p>
                      </div>

                      {/* API Error */}
                      {apiError && <ErrorMessage message={apiError} />}

                      {/* Form */}
                      <form onSubmit={handleSubmit}>
                        {/* Ad Soyad */}
                        <div className="mb-25px">
                          <label htmlFor="name" className="form-label text-dark-gray fw-500 mb-10px fs-15">
                            Ad Soyad <span className="text-danger">*</span>
                          </label>
                          <div className="position-relative">
                            <i className="bi bi-person position-absolute top-50 translate-middle-y ms-15px text-medium-gray fs-18"></i>
                            <input
                              type="text"
                              id="name"
                              name="name"
                              ref={nameRef}
                              className={`form-control border-radius-10px ps-45px ${errors.name ? 'is-invalid' : ''} ${landingAnim ? 'input-landing-glow' : ''}`}
                              placeholder="Adınız Soyadınız"
                              value={formData.name}
                              onChange={handleChange}
                              autoComplete="name"
                            />
                          </div>
                          {errors.name && <div className="text-danger fs-13 mt-5px">{errors.name}</div>}
                        </div>

                        {/* Email */}
                        <div className="mb-25px">
                          <label htmlFor="email" className="form-label text-dark-gray fw-500 mb-10px fs-15">
                            E-posta Adresi <span className="text-danger">*</span>
                          </label>
                          <div className="position-relative">
                            <i className="bi bi-envelope position-absolute top-50 translate-middle-y ms-15px text-medium-gray fs-18"></i>
                            <input
                              type="email"
                              id="email"
                              name="email"
                              className={`form-control border-radius-10px ps-45px ${errors.email ? 'is-invalid' : ''}`}
                              placeholder="ornek@email.com"
                              value={formData.email}
                              onChange={handleChange}
                              autoComplete="email"
                            />
                          </div>
                          {errors.email && <div className="text-danger fs-13 mt-5px">{errors.email}</div>}
                        </div>

                        {/* Telefon */}
                        <div className="mb-25px">
                          <label htmlFor="phone" className="form-label text-dark-gray fw-500 mb-10px fs-15">
                            Telefon Numarası
                          </label>
                          <div className="position-relative">
                            <i className="bi bi-phone position-absolute top-50 translate-middle-y ms-15px text-medium-gray fs-18"></i>
                            <input
                              type="tel"
                              id="phone"
                              name="phone"
                              className={`form-control border-radius-10px ps-45px ${errors.phone ? 'is-invalid' : ''}`}
                              placeholder="0555 123 45 67"
                              value={formData.phone}
                              onChange={handlePhoneChange}
                              autoComplete="tel"
                            />
                          </div>
                          {errors.phone && <div className="text-danger fs-13 mt-5px">{errors.phone}</div>}
                        </div>

                        {/* Şifre */}
                        <div className="mb-25px">
                          <label htmlFor="password" className="form-label text-dark-gray fw-500 mb-10px fs-15">
                            Şifre <span className="text-danger">*</span>
                          </label>
                          <div className="position-relative">
                            <i className="bi bi-lock position-absolute top-50 translate-middle-y ms-15px text-medium-gray fs-18"></i>
                            <input
                              type={showPassword ? 'text' : 'password'}
                              id="password"
                              name="password"
                              className={`form-control border-radius-10px ps-45px pe-45px ${errors.password ? 'is-invalid' : ''}`}
                              placeholder="En az 6 karakter"
                              value={formData.password}
                              onChange={handleChange}
                              autoComplete="new-password"
                            />
                            <button
                              type="button"
                              className="btn position-absolute top-50 translate-middle-y end-0 me-10px p-0 border-0"
                              onClick={() => setShowPassword(!showPassword)}
                              tabIndex={-1}
                            >
                              <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} text-medium-gray fs-18`}></i>
                            </button>
                          </div>
                          {errors.password && <div className="text-danger fs-13 mt-5px">{errors.password}</div>}
                        </div>

                        {/* Şifre Tekrar */}
                        <div className="mb-35px">
                          <label htmlFor="confirmPassword" className="form-label text-dark-gray fw-500 mb-10px fs-15">
                            Şifre Tekrar <span className="text-danger">*</span>
                          </label>
                          <div className="position-relative">
                            <i className="bi bi-lock-fill position-absolute top-50 translate-middle-y ms-15px text-medium-gray fs-18"></i>
                            <input
                              type={showPassword ? 'text' : 'password'}
                              id="confirmPassword"
                              name="confirmPassword"
                              className={`form-control border-radius-10px ps-45px ${errors.confirmPassword ? 'is-invalid' : ''}`}
                              placeholder="Şifrenizi tekrar giriniz"
                              value={formData.confirmPassword}
                              onChange={handleChange}
                              autoComplete="new-password"
                            />
                          </div>
                          {errors.confirmPassword && <div className="text-danger fs-13 mt-5px">{errors.confirmPassword}</div>}
                        </div>

                        {/* Submit */}
                        <button
                          type="submit"
                          className="submit-btn-primary w-100"
                          disabled={isSubmitting}
                        >
                          <span>{isSubmitting ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}</span>
                          <i className={`bi ${isSubmitting ? 'bi-arrow-repeat spinning' : 'bi-arrow-right'}`}></i>
                        </button>
                      </form>

                      {/* Login Link */}
                      <div className="text-center mt-30px">
                        <p className="text-medium-gray fs-15 mb-0">
                          Zaten hesabınız var mı?{' '}
                          <Link href={loginHref} className="text-primary-blue fw-600 text-decoration-none">
                            Giriş Yap
                          </Link>
                        </p>
                      </div>
                    </div>

                    {/* Back to Home */}
                    <div className="d-flex justify-content-center mt-40px">
                      <Link href="/" className="back-to-home-btn">
                        <i className="bi bi-arrow-left"></i>
                        Ana Sayfaya Dön
                      </Link>
                    </div>
                  </>
                ) : (
                  /* ========== KAYITLAR KAPALI ========== */
                  <>
                <div className="auth-card bg-white border-radius-20px box-shadow-large p-50px md-p-40px sm-p-30px text-center">
                  {/* Icon */}
                  <div className="closed-icon mb-30px">
                    <i className="bi bi-lock-fill"></i>
                  </div>

                  {/* Header */}
                  <div className="auth-header mb-30px">
                    <div className="inline-block mb-20px">
                      <span className="ps-25px pe-25px pt-8px pb-8px text-uppercase alt-font text-red fs-13 lh-28 fw-600 border-radius-100px bg-light-red d-inline-flex align-items-center">
                        <i className="bi bi-x-circle fs-16 me-10px"></i>Kayıtlar Kapatıldı
                      </span>
                    </div>
                    <h2 className="alt-font text-dark-gray fw-700 mb-15px lh-44">
                      Yeni Kayıtlar Alınmıyor
                    </h2>
                    <p className="text-dark-gray lh-28 fs-16 mb-20px">
                          {config.closedMessages?.registration || 'Kayıt süreci şu an kapalıdır.'}
                    </p>
                  </div>

                  {/* Info Box */}
                  <div className="info-notification mb-30px">
                    <i className="bi bi-info-circle-fill me-2"></i>
                    <span>Zaten hesabınız varsa giriş yapabilirsiniz</span>
                  </div>

                  {/* Login Button */}
                  <Link href={loginHref} className="submit-btn-primary w-100">
                    <span>Giriş Yap</span>
                    <i className="bi bi-box-arrow-in-right"></i>
                  </Link>
                </div>

                {/* Back to Home */}
                <div className="d-flex justify-content-center mt-40px">
                  <Link href="/" className="back-to-home-btn">
                    <i className="bi bi-arrow-left"></i>
                    Ana Sayfaya Dön
                  </Link>
                </div>
                  </>
                )}

              </div>
            </div>
          </div>
        </section>
      </Layout>

      <style jsx global>{`
        @keyframes input-glow-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(37,99,235,0.4), 0 0 0 0 rgba(37,99,235,0.1); }
          30%  { box-shadow: 0 0 16px 4px rgba(37,99,235,0.35), 0 0 40px 8px rgba(37,99,235,0.1); }
          60%  { box-shadow: 0 0 8px 2px rgba(37,99,235,0.25), 0 0 24px 4px rgba(37,99,235,0.08); }
          100% { box-shadow: 0 0 0 0 rgba(37,99,235,0), 0 0 0 0 rgba(37,99,235,0); }
        }

        .input-landing-glow {
          animation: input-glow-pulse 2s ease-out !important;
          border-color: #2563eb !important;
          transition: border-color 0.3s ease;
        }
      `}</style>

      <style jsx>{`
        .closed-icon {
          font-size: 80px;
          color: #ef4444;
          animation: fadeIn 0.6s ease-out;
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

        .text-red {
          color: #ef4444;
        }

        .bg-light-red {
          background: #fef2f2;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @media (max-width: 767px) {
          .closed-icon {
            font-size: 60px;
          }
        }
      `}</style>
    </>
  );
}
