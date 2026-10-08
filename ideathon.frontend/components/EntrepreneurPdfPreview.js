import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from '@/styles/entrepreneur.module.css';

export default function EntrepreneurPdfPreview({ load, filename, title = 'Başvuru PDF Önizlemesi', onClose }) {
  const dialog = useRef(null);
  const request = useRef(null);
  const fileUrl = useRef(null);
  const loadRef = useRef(load);
  const [target, setTarget] = useState(null);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);

  async function prepare() {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setBusy(true); setError('');
    try {
      const blob = await loadRef.current(controller.signal);
      if (controller.signal.aborted) return;
      if (!blob.size || blob.type !== 'application/pdf') throw new Error('PDF hazırlanamadı. Lütfen tekrar deneyin.');
      if (fileUrl.current) URL.revokeObjectURL(fileUrl.current);
      fileUrl.current = URL.createObjectURL(blob);
      setUrl(fileUrl.current);
    } catch (err) {
      if (!controller.signal.aborted) setError(err.message || 'PDF açılamadı. Lütfen tekrar deneyin.');
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  useEffect(() => { setTarget(document.body); }, []);
  useEffect(() => {
    if (!target) return;
    const element = dialog.current;
    const focus = document.activeElement;
    const overflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';
    prepare();
    return () => {
      request.current?.abort();
      if (fileUrl.current) URL.revokeObjectURL(fileUrl.current);
      fileUrl.current = null;
      element.close();
      document.body.style.overflow = overflow;
      if (focus?.isConnected) focus.focus({ preventScroll: true });
    };
  }, [target]);

  if (!target) return null;
  return createPortal(<dialog ref={dialog} className={`${styles.agreementDialog} ${styles.pdfDialog}`} aria-labelledby="pdf-preview-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className={styles.agreementDialogHeader}>
      <div><span>PDF BELGESİ</span><h2 id="pdf-preview-title">{title}</h2></div>
      <button type="button" className={styles.agreementClose} onClick={onClose} aria-label="PDF önizlemesini kapat" autoFocus><i className="bi bi-x-lg" aria-hidden="true" /></button>
    </div>
    <div className={styles.pdfPreviewBody} aria-busy={busy}>
      {busy ? <p role="status">PDF hazırlanıyor…</p> : error ? <div role="alert"><p>{error}</p><button type="button" className={styles.secondaryButton} onClick={prepare}>Tekrar Dene</button></div> : <iframe title={title} src={url} />}
    </div>
    <div className={styles.agreementDialogFooter}>
      <p>Belgeyi kontrol edip İndir düğmesiyle kaydedebilirsiniz.</p>
      <div className={styles.pdfPreviewActions}><button type="button" className={styles.secondaryButton} onClick={onClose}>Kapat</button>{url && !busy && !error && <a className={styles.primaryButton} href={url} download={filename}><i className="bi bi-download" aria-hidden="true" /> İndir</a>}</div>
    </div>
  </dialog>, target);
}
