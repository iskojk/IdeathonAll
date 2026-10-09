import { useEffect, useRef, useState } from 'react';
import { authAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import ErrorMessage from '@/components/ErrorMessage';
import AuthButtonLabel from '@/components/AuthButtonLabel';

export default function RegistrationVerification({ pending, onPendingChange, onComplete, onEdit }) {
  const { completeRegistration } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const inFlight = useRef(false);
  const input = useRef(null);
  useEffect(() => {
    input.current?.focus();
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const wait = Math.max(0, Math.ceil((Date.parse(pending.resendAvailableAt) - now) / 1000));
  const expired = Date.parse(pending.expiresAt) <= now;
  const codeExpired = Date.parse(pending.codeExpiresAt) <= now;

  async function verify(event) {
    event.preventDefault();
    if (inFlight.current || expired) return;
    if (!/^\d{6}$/.test(code)) { setError('E-postadaki altı haneli kodu giriniz.'); return; }
    inFlight.current = true;
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await completeRegistration(pending.registrationToken, code);
      if (result?.success) onComplete();
      else setError(result?.error || 'Doğrulama tamamlanamadı.');
    } catch { setError('Bağlantı kurulamadı. Lütfen tekrar deneyin.'); }
    finally { inFlight.current = false; setBusy(false); }
  }

  async function resend() {
    if (inFlight.current || wait > 0 || expired) return;
    inFlight.current = true;
    setBusy(true); setError(''); setNotice('');
    try {
      const response = await authAPI.resendRegistration(pending.registrationToken);
      if (response.success) {
        onPendingChange(response.data);
        setCode(''); setNow(Date.now());
        setNotice('Yeni kod gönderildi. En son gelen e-postadaki kodu kullanın.');
        input.current?.focus();
      } else setError(response.message || 'Kod gönderilemedi.');
    } catch (err) { setError(err.message || 'Kod gönderilemedi.'); }
    finally { inFlight.current = false; setBusy(false); }
  }

  return (
    <div>
      <p className="text-dark-gray lh-28" style={{ overflowWrap: 'anywhere' }}>
        <strong>{pending.email}</strong> adresine gönderdiğimiz altı haneli kodu girin.
        Kod 10 dakika geçerlidir. E-postayı bulamıyorsanız spam klasörünü de kontrol edin.
      </p>
      {error && <ErrorMessage message={error} />}
      {notice && <p role="status" className="text-success">{notice}</p>}
      {expired ? <p role="alert" className="text-danger">Doğrulama oturumunun süresi doldu. Bilgilerimi değiştir düğmesiyle yeniden kayıt başlatın.</p> : (
        <form onSubmit={verify}>
          <label htmlFor="registration-code" className="form-label text-dark-gray fw-500">Doğrulama kodu</label>
          <input ref={input} id="registration-code" type="text" inputMode="numeric" autoComplete="one-time-code"
            pattern="[0-9]{6}" maxLength={6} required value={code} disabled={busy}
            onChange={event => { setCode(event.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
            className="form-control border-radius-10px mb-20px" style={{ fontSize: '24px', letterSpacing: '6px', textAlign: 'center' }} />
          {codeExpired && <p role="status" className="text-danger">Kodun süresi doldu. Yeni bir kod isteyin.</p>}
          <button type="submit" disabled={busy || code.length !== 6 || codeExpired} aria-busy={busy} className="submit-btn-primary w-100">
            <AuthButtonLabel busy={busy}>Doğrula ve Hesabımı Oluştur</AuthButtonLabel>
          </button>
        </form>
      )}
      <div className="auth-verification-actions d-flex flex-wrap justify-content-center gap-3 mt-25px">
        <button type="button" className="btn btn-outline-primary border-radius-10px" onClick={resend} disabled={busy || wait > 0 || expired}>
          <span className="resend-label">
            <span className="resend-reserved" aria-hidden="true">Yeni kod gönder (60 sn)</span>
            <span>{wait > 0 ? `Yeni kod gönder (${wait} sn)` : 'Yeni kod gönder'}</span>
          </span>
        </button>
        <button type="button" className="btn btn-link" onClick={onEdit} disabled={busy}>Bilgilerimi değiştir</button>
      </div>
      <style jsx>{`
        .resend-label { display: grid; font-variant-numeric: tabular-nums; }
        .resend-label > span { grid-area: 1 / 1; }
        .resend-reserved { visibility: hidden; pointer-events: none; }
      `}</style>
    </div>
  );
}
