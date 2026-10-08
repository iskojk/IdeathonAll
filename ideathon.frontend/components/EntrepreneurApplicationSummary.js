import { useId, useState } from 'react';
import styles from '@/styles/entrepreneur.module.css';
import EntrepreneurApplicationDownload from './EntrepreneurApplicationDownload';
import { entrepreneurStatus } from '@/lib/entrepreneurStatus';

const text = value => typeof value === 'string' ? value.trim() : '';

export default function EntrepreneurApplicationSummary({ application, form, user, children, onEdit, busy }) {
  const [expanded, setExpanded] = useState(false);
  const disclosureId = useId();
  const detailsId = `entrepreneur-details-${disclosureId}`;
  const toggleId = `entrepreneur-details-toggle-${disclosureId}`;
  const status = entrepreneurStatus(application);
  const applicant = text(application.answers?.full_name) || [text(application.answers?.first_name), text(application.answers?.last_name)].filter(Boolean).join(' ') || text(user?.name) || 'Başvuran';
  const title = text(application.answers?.venture_name) || form.title || 'Girişim başvurusu';
  const date = application.submittedAt ? new Date(application.submittedAt) : null;
  const validDate = date && Number.isFinite(date.getTime());

  return <section className={styles.applicationSummary} aria-label="Gönderilmiş başvuru">
    <div className={styles.summaryActions}>
      <div><h2 className={styles.summaryTitle}><i className="bi bi-file-earmark-text" aria-hidden="true" />Başvuru bilgileri</h2>{application.applicationNumber && <p className={styles.summaryNumber}>Başvuru no: {application.applicationNumber}</p>}</div>
      <div className={styles.summaryButtons}><EntrepreneurApplicationDownload /></div>
    </div>
    <div className={styles.summaryDisclosure} data-open={expanded}>
      <div className={styles.summaryCard}>
        <div className={styles.summaryRow}>
          <div className={styles.summaryInfo}>
            <span className={styles.summaryField}><span>BAŞVURAN</span><strong>{applicant}</strong></span>
            <span className={styles.summaryField}><span>GİRİŞİM ADI</span><strong>{title}</strong></span>
            <span className={styles.summaryField}><span>BAŞVURU TARİHİ</span>{validDate ? <time dateTime={date.toISOString()}>{date.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</time> : <span>Tarih bilgisi bulunamadı</span>}</span>
          </div>
          <div className={styles.summaryRowActions}>
            <button id={toggleId} type="button" className={styles.summaryToggle} aria-expanded={expanded} aria-controls={detailsId} onClick={() => setExpanded(current => !current)}><span>{expanded ? 'Detayları Gizle' : 'Detayları Görüntüle'}</span><i className="bi bi-chevron-down" aria-hidden="true" /></button>
            {onEdit && <button type="button" className={styles.summaryEdit} onClick={onEdit} disabled={busy}><i className="bi bi-pencil-square" aria-hidden="true" />{busy ? 'Açılıyor…' : 'Başvurumu Düzenle'}</button>}
            <span className={`${styles.statusBadge} ${styles[status.tone]}`} role="status"><i className={`bi ${status.icon}`} aria-hidden="true" />{status.label}</span>
          </div>
        </div>
      </div>
      <div id={detailsId} className={styles.applicationDetails} hidden={!expanded} role="region" aria-labelledby={toggleId}>{expanded && children}</div>
    </div>
  </section>;
}
