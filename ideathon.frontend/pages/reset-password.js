import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { authAPI } from '@/lib/api'
import { toast } from '@/components/Toast'
import Layout from '@/components/Layout'
import AuthButtonLabel from '@/components/AuthButtonLabel'
import ErrorMessage from '@/components/ErrorMessage'
import { authFlowLinks } from '@/lib/authRoutes'
import { normalizeRecoveryEmail, readRecoveryEmail, clearRecoveryEmail } from '@/lib/passwordRecoveryEmail'

export default function ResetPassword() {
  const router = useRouter()
  const authLinks = authFlowLinks({ entrepreneur: router.query.source === 'girisimciler', redirect: router.query.redirect })
  const loginHref = authLinks.login
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const emailEdited = useRef(false)

  useEffect(() => {
    if (!router.isReady || emailEdited.current) return
    // Prefer the address from this request; use the tab's pending request on reload/direct navigation.
    setEmail(normalizeRecoveryEmail(router.query.email) || readRecoveryEmail())
  }, [router.isReady, router.query.email])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading || success) return
    const requestedEmail = normalizeRecoveryEmail(email)
    
    // Validation
    if (!requestedEmail || !code || !newPassword || !confirmPassword) {
      setError('Tüm alanlar zorunludur')
      return
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
    if (!emailRegex.test(requestedEmail)) {
      setError('Geçerli bir email adresi giriniz')
      return
    }

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setError('Kod 6 haneli rakam olmalıdır')
      return
    }

    if (newPassword.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Şifreler eşleşmiyor')
      return
    }

    setError('')
    setLoading(true)

    try {
      const response = await authAPI.resetPassword(requestedEmail, code, newPassword)
      
      if (response.success) {
        clearRecoveryEmail(requestedEmail)
        setSuccess(true)
        toast.success('Şifreniz başarıyla sıfırlandı')
        
        // 2 saniye sonra login sayfasına yönlendir
        setTimeout(() => {
          router.push(loginHref)
        }, 2000)
      }
    } catch (err) {
      console.error('Reset password error:', err)
      setError(err.message || 'Bir hata oluştu. Lütfen tekrar deneyin.')
      toast.error(err.message || 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="auth-container" style={{ marginTop: '140px' }}>
        <div className="auth-box">
          <div className="auth-header">
            <h1>Şifre Sıfırla</h1>
            <p>Email adresinize gönderilen 6 haneli kodu girin</p>
          </div>

          {error && <ErrorMessage message={error} />}

          {success ? (
            <div className="success-message">
              <div className="success-icon">✓</div>
              <h3>Şifre Sıfırlandı!</h3>
              <p>
                Şifreniz başarıyla sıfırlandı. Yeni şifrenizle giriş yapabilirsiniz.
              </p>
              <p className="redirect-info">
                Giriş sayfasına yönlendiriliyorsunuz...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">
                  Email Adresi <span className="required">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => { emailEdited.current = true; setEmail(e.target.value) }}
                  placeholder="ornek@email.com"
                  disabled={loading}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="code">
                  Sıfırlama Kodu <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  disabled={loading}
                  maxLength="6"
                  autoComplete="off"
                  required
                />
                <span className="help-text">Email adresinize gönderilen 6 haneli kod</span>
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">
                  Yeni Şifre <span className="required">*</span>
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="En az 6 karakter"
                  disabled={loading}
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">
                  Yeni Şifre (Tekrar) <span className="required">*</span>
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Şifrenizi tekrar girin"
                  disabled={loading}
                  autoComplete="new-password"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                aria-busy={loading}
              >
                <AuthButtonLabel busy={loading} busyText="Şifre sıfırlanıyor...">Şifreyi Sıfırla</AuthButtonLabel>
              </button>

              <div className="auth-links">
                <Link href={authLinks.forgotPassword} className="auth-link">
                  Kod almadınız mı?
                </Link>
                <span className="divider">•</span>
                <Link href={loginHref} className="auth-link">
                  Giriş Yap
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>

      <style jsx>{`
        .auth-container {
          min-height: calc(100vh - 200px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
        }

        .auth-box {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          padding: 40px;
          width: 100%;
          max-width: 480px;
        }

        .auth-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .auth-header h1 {
          font-size: 28px;
          color: #1a1a1a;
          margin-bottom: 8px;
        }

        .auth-header p {
          font-size: 14px;
          color: #666;
        }

        .success-message {
          text-align: center;
          padding: 32px 0;
        }

        .success-icon {
          width: 60px;
          height: 60px;
          background: #10b981;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          margin: 0 auto 20px;
        }

        .success-message h3 {
          font-size: 22px;
          color: #1a1a1a;
          margin-bottom: 16px;
        }

        .success-message p {
          color: #666;
          line-height: 1.6;
          margin-bottom: 12px;
        }

        .redirect-info {
          color: #10b981;
          font-weight: 500;
          margin-top: 20px;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-size: 14px;
          font-weight: 500;
          color: #333;
        }

        .form-group input {
          padding: 12px 16px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 15px;
          transition: all 0.2s;
        }

        .form-group input:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
        }

        .form-group input:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
        }

        .help-text {
          font-size: 12px;
          color: #666;
        }

        .required {
          color: #dc3545;
        }

        .btn-primary {
          background: #007bff;
          color: white;
          padding: 14px 24px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s, opacity 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
          width: 100%;
          transform: none;
          min-height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-primary:hover:not(:disabled) {
          background: #0056b3;
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .auth-links {
          text-align: center;
          margin-top: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .auth-link {
          color: #007bff;
          text-decoration: none;
          font-size: 14px;
        }

        .auth-link:hover {
          text-decoration: underline;
        }

        .divider {
          color: #ccc;
        }

        @media (max-width: 768px) {
          .auth-box {
            padding: 24px;
          }

          .auth-header h1 {
            font-size: 24px;
          }
        }
      `}</style>
    </Layout>
  )
}
