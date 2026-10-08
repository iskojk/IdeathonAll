import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import LegalDocumentContent from '@/components/LegalDocumentContent';
import styles from '@/styles/entrepreneur.module.css';

export default function EntrepreneurAgreementDialog({ agreement, onClose }) {
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
  return createPortal(<dialog ref={dialogRef} className={styles.agreementDialog} aria-labelledby="agreement-dialog-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className={styles.agreementDialogHeader}>
      <div><span>BAŞVURU METİNLERİ</span><h2 id="agreement-dialog-title">{agreement.label}</h2></div>
      <button type="button" className={styles.agreementClose} aria-label="Metni kapat" onClick={onClose} autoFocus><i className="bi bi-x-lg" aria-hidden="true" /></button>
    </div>
    <div className={styles.agreementDialogBody} tabIndex={0} aria-label={`${agreement.label} metni`}>
      <LegalDocumentContent documentId={agreement.id} />
    </div>
    <div className={styles.agreementDialogFooter}>
      <p>Onayınızı başvuru ekranındaki kutuyu işaretleyerek verebilirsiniz.</p>
      <button type="button" className={styles.secondaryButton} onClick={onClose}>Başvuruya dön</button>
    </div>
  </dialog>, portalTarget);
}
