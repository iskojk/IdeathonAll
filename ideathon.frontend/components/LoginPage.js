/**
 * Login Page
 * Kullanıcı giriş sayfası
 */

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import Layout from '@/components/Layout';
import ErrorMessage from '@/components/ErrorMessage';
import { useAuth } from '@/context/AuthContext';
import { useIdeathonConfig, useIdeathon } from '@/context/IdeathonContext';
import { validateEmail, validateRequired } from '@/utils/validation';
import { safeRedirect, authFlowLinks } from '@/lib/authRoutes';

export default function LoginPage({ entrepreneur = false }) {
  const router = useRouter();
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const config = useIdeathonConfig();
  const { hasSlug } = useIdeathon();
  const emailRef = useRef(null);
  const [landingAnim, setLandingAnim] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const redirect = safeRedirect(router.query.redirect, entrepreneur ? '/girisimciler/basvuru' : '/');
  const authLinks = authFlowLinks({ entrepreneur, redirect: router.query.redirect });
  const registerHref = authLinks.register;
  const forgotPasswordHref = authLinks.forgotPassword;

  // Zaten giriş yapmışsa yönlendir
  useEffect(() => {
    if (router.isReady && isAuthenticated && !authLoading) {
      router.replace(redirect);
    }
  }, [isAuthenticated, authLoading, router.isReady, redirect, router]);

  useEffect(() => {
    if (router.query.animate !== '1') return

    setLandingAnim(true)

    const timer = setTimeout(() => {
      if (emailRef.current) {
        emailRef.current.focus()

        const rect = emailRef.current.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2

        const overlay = document.createElement('div')
        overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;pointer-events:none;overflow:hidden;'
        document.body.appendChild(overlay)

        const icon = document.createElement('div')
        icon.innerHTML = '<i class="bi bi-send-fill"></i>'
        icon.style.cssText = `
          position:absolute; left:${cx}px; top:${cy - 60}px;
          font-size:22px; color:#2563eb; opacity:0;
          transform:translate(-50%,-50%) scale(0.5);
          transition: all 0.5s cubic-bezier(0.34,1.56,0.64,1);
          filter: drop-shadow(0 0 12px rgba(37,99,235,0.6));
          pointer-events:none;
        `
        overlay.appendChild(icon)

        requestAnimationFrame(() => {
          icon.style.opacity = '1'
          icon.style.transform = 'translate(-50%,-50%) scale(1.2)'
        })

        for (let i = 0; i < 10; i++) {
          const b = document.createElement('div')
          const size = 6 + Math.random() * 14
          const angle = (Math.PI * 2 * i) / 10
          const dist = 30 + Math.random() * 40
          b.style.cssText = `
            position:absolute; left:${cx}px; top:${cy}px;
            width:${size}px; height:${size}px; border-radius:50%;
            background:radial-gradient(circle, rgba(37,99,235,0.5), rgba(96,165,250,0.2));
            box-shadow: 0 0 8px rgba(37,99,235,0.3);
            pointer-events:none; opacity:0;
            transform:translate(-50%,-50%) scale(0.5);
            transition: all 0.6s cubic-bezier(0.34,1.56,0.64,1) ${i * 30}ms;
          `
          overlay.appendChild(b)
          requestAnimationFrame(() => {
            b.style.opacity = '1'
            b.style.transform = `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist}px)) scale(1)`
          })
          setTimeout(() => {
            b.style.opacity = '0'
            b.style.transform = `translate(calc(-50% + ${Math.cos(angle) * dist * 1.5}px), calc(-50% + ${Math.sin(angle) * dist * 1.5}px)) scale(0)`
          }, 400 + i * 30)
        }

        setTimeout(() => {
          icon.style.opacity = '0'
          icon.style.transform = 'translate(-50%,-50%) scale(0)'
        }, 600)

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
    
    // Clear errors on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (apiError) {
      setApiError('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!validateRequired(formData.email)) {
      newErrors.email = 'E-posta adresi gereklidir';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi giriniz';
    }

    if (!validateRequired(formData.password)) {
      newErrors.password = 'Şifre gereklidir';
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
      const result = await login(formData.email, formData.password);

      if (!result?.success) {
        setApiError(result?.error || 'Giriş yapılırken bir hata oluştu');
      }
    } catch (error) {
      setApiError('Bir hata oluştu. Lütfen tekrar deneyiniz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return null; // veya loading component
  }

  return (
    <>
      <Head>
        <title>{entrepreneur ? 'Girişimci Girişi' : 'Giriş Yap'} - Emlak Konut Ideathon</title>
        <meta name="description" content={entrepreneur ? 'Girişimci başvurunuza devam etmek için hesabınıza giriş yapın.' : 'Emlak Konut Ideathon platformuna giriş yapın'} />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <Layout>
        <section className="auth-section py-100px md-py-80px sm-py-60px" style={{ marginTop: '140px' }}>
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-5 col-md-7 col-sm-9">
                {/* Auth Card */}
                <div className="auth-card bg-white border-radius-20px box-shadow-large p-50px md-p-40px sm-p-30px">
                  {/* Header */}
                  <div className="auth-header text-center mb-40px">
                    <div className="inline-block mb-20px">
                      <span className="ps-25px pe-25px pt-8px pb-8px text-uppercase alt-font text-primary-blue fs-13 lh-28 fw-600 border-radius-100px bg-primary-blue-light d-inline-flex align-items-center">
                        <i className="bi bi-person-circle fs-16 me-10px"></i>{entrepreneur ? 'Girişimci Girişi' : 'Giriş Yap'}
                      </span>
                    </div>
                    <h1 className="alt-font text-dark-gray fw-700 mb-10px lh-44" style={{ fontSize: '2rem' }}>
                      {entrepreneur ? 'Girişimci Girişi' : 'Hoş Geldiniz'}
                    </h1>
                    <p className="text-dark-gray lh-28 fs-16 mb-0">
                      {entrepreneur ? 'Girişimci başvurunuza devam etmek için mevcut hesabınızla giriş yapın.' : 'Başvurunuza devam etmek için giriş yapın'}
                    </p>
                  </div>

                  {/* Error Message */}
                  {apiError && (
                    <ErrorMessage 
                      message={apiError} 
                      onClose={() => setApiError('')}
                      type="error"
                    />
                  )}

                  {/* Login Form */}
                  <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group mb-25px">
                      <label htmlFor="email" className="form-label text-dark-gray fw-500 mb-10px">
                        E-posta Adresi <span className="text-red">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        ref={emailRef}
                        autoComplete="email"
                        className={`form-control border-radius-8px ${errors.email ? 'error-field' : ''} ${landingAnim ? 'input-landing-glow' : ''}`}
                        placeholder="ornek@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      />
                      {errors.email && (
                        <div className="field-error mt-2">{errors.email}</div>
                      )}
                    </div>

                    <div className="form-group mb-25px">
                      <label htmlFor="password" className="form-label text-dark-gray fw-500 mb-10px">
                        Şifre <span className="text-red">*</span>
                      </label>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        autoComplete="current-password"
                        className={`form-control border-radius-8px ${errors.password ? 'error-field' : ''}`}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      />
                      {errors.password && (
                        <div className="field-error mt-2">{errors.password}</div>
                      )}
                    </div>

                    {/* Forgot Password Link */}
                    <div className="text-end mb-30px">
                      <Link href={forgotPasswordHref} className="text-primary-blue fs-14 fw-500 text-decoration-none hover-opacity">
                        Şifremi Unuttum?
                      </Link>
                    </div>

                    {/* Submit Button */}
                    <button 
                      type="submit" 
                      className="submit-btn-primary w-100 mb-25px" 
                      disabled={isSubmitting}
                    >
                      <span>{isSubmitting ? 'Giriş Yapılıyor...' : 'Giriş Yap'}</span>
                      <i className={`bi ${isSubmitting ? 'bi-arrow-repeat spinning' : 'bi-box-arrow-in-right'}`}></i>
                    </button>

                    {/* Register Link — sadece kayıtlar açıksa göster */}
                    {(entrepreneur || config.loading || config.registrationOpen) && (
                      <div className="text-center">
                        <p className="text-medium-gray fs-15 mb-0">
                          Hesabınız yok mu?{' '}
                          <Link href={registerHref} className="text-primary-blue fw-600 text-decoration-none">
                            Kayıt Ol
                          </Link>
                        </p>
                      </div>
                    )}

                    {/* Ideathon seçilmemişse uyarı */}
                    {!entrepreneur && !hasSlug && !config.loading && (
                      <div className="text-center mt-20px">
                        <Link href="/" className="d-inline-flex align-items-center gap-2 text-primary-blue fw-600 fs-14 text-decoration-none">
                          <i className="bi bi-grid-3x3-gap-fill"></i>
                          <span>Önce bir Ideathon programı seçmelisiniz</span>
                        </Link>
                      </div>
                    )}
                   
                  </form>
                </div>

                {/* Back to Home */}
                <div className="d-flex justify-content-center mt-40px">
                  <Link href={entrepreneur ? '/girisimciler' : '/'} className="back-to-home-btn">
                    <i className="bi bi-arrow-left"></i>
                    {entrepreneur ? 'Girişimciler Sayfasına Dön' : 'Ana Sayfaya Dön'}
                  </Link>
                </div>
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
    </>
  );
}
