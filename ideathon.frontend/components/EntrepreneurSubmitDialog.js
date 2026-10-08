import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from '@/styles/entrepreneur.module.css';

export default function EntrepreneurSubmitDialog({ busy, error, onContinue, onSubmit }) {
  const dialogRef = useRef(null);
  const [portalTarget, setPortalTarget] = useState(null);
  useEffect(() => { setPortalTarget(document.body); }, []);
  useEffect(() => {
    if (!portalTarget) return;
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [portalTarget]);

  if (!portalTarget) return null;
  return createPortal(<dialog ref={dialogRef} className={`${styles.agreementDialog} ${styles.submitDialog}`} aria-labelledby="submit-confirm-title" aria-describedby="submit-confirm-description" aria-busy={busy} onCancel={event => { event.preventDefault(); if (!busy) onContinue(); }}>
    <div className={styles.agreementDialogHeader}>
      <div><span>BAŞVURU GÜNCELLEME</span><h2 id="submit-confirm-title">Değişiklikleri kaydetmek ister misiniz?</h2></div>
    </div>
    <div className={styles.agreementDialogBody}>
      <p id="submit-confirm-description">Güncel başvurunuz yeniden iletilecek ve başvuru bilgilerinizin bulunduğu ekrana döneceksiniz.</p>
      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>
    <div className={styles.submitDialogActions}>
      <button type="button" className={styles.secondaryButton} disabled={busy} onClick={onContinue} autoFocus>Düzenlemeye Devam Et</button>
      <button type="button" className={styles.primaryButton} disabled={busy} onClick={onSubmit}>{busy ? 'Gönderiliyor…' : 'Güncelle ve Gönder'}</button>
    </div>
  </dialog>, portalTarget);
}
