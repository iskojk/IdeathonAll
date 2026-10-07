import styles from '@/styles/entrepreneur.module.css';

// Mevcut API "submitted" döndürür. Onay akışı eklendiğinde aynı kart,
// sunucudan gelen pending_approval / approved durumlarını da gösterebilir.
const statuses = {
  submitted: { label: 'İletildi', tone: 'statusSubmitted', icon: 'bi-check2-circle' },
  pending_approval: { label: 'Onay bekliyor', tone: 'statusPending', icon: 'bi-hourglass-split' },
  approved: { label: 'Onaylandı', tone: 'statusApproved', icon: 'bi-check-circle-fill' },
};

const text = value => typeof value === 'string' ? value.trim() : '';

export default function EntrepreneurApplicationSummary({ application, form, user, children }) {
  const status = statuses[application.status] || { label: 'Durum bilgisi bekleniyor', tone: 'statusUnknown', icon: 'bi-info-circle' };
  const applicant = text(application.answers?.full_name) || [text(application.answers?.first_name), text(application.answers?.last_name)].filter(Boolean).join(' ') || text(user?.name) || 'Başvuran';
  const title = text(application.answers?.venture_name) || form.title || 'Girişim başvurusu';
  const date = application.submittedAt ? new Date(application.submittedAt) : null;
  const validDate = date && Number.isFinite(date.getTime());

  return <details className={styles.applicationSummary}>
    <summary className={styles.summaryCard}>
      <span className={styles.summaryRow}>
        <span className={styles.summaryField}><span>Başvuran</span><strong>{applicant}</strong></span>
        <span className={`${styles.summaryField} ${styles.summaryTitle}`}><span>Girişim</span><strong>{title}</strong></span>
        <span className={styles.summaryField}><span>Gönderim tarihi</span>{validDate ? <time dateTime={date.toISOString()}>{date.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</time> : <span>Tarih bilgisi bulunamadı</span>}</span>
        <span className={`${styles.statusBadge} ${styles[status.tone]}`} role="status"><i className={`bi ${status.icon}`} aria-hidden="true" />{status.label}</span>
      </span>
      <span className={styles.summaryToggle}><span className={styles.showDetails}>Detayları görüntüle</span><span className={styles.hideDetails}>Detayları gizle</span><i className="bi bi-chevron-down" aria-hidden="true" /></span>
    </summary>
    <div className={styles.applicationDetails}>{children}</div>
  </details>;
}
