import { useState } from 'react';
import { entrepreneurAPI } from '@/lib/api';
import EntrepreneurPdfPreview from './EntrepreneurPdfPreview';
import styles from '@/styles/entrepreneur.module.css';

export default function EntrepreneurApplicationDownload({ label = 'Başvurumu PDF Önizle' }) {
  const [open, setOpen] = useState(false);
  return <div className={styles.applicationDownload}>
    <button type="button" className={styles.downloadApplicationButton} onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label="Başvuru PDF önizle">
      <i className="bi bi-file-earmark-text" aria-hidden="true" /><span>{label}</span>
    </button>
    {open && <EntrepreneurPdfPreview load={signal => entrepreneurAPI.downloadApplication(signal)} filename="girisimci-basvurum.pdf" onClose={() => setOpen(false)} />}
  </div>;
}
