export const entrepreneurStatuses = {
  submitted: { label: 'İletildi', tone: 'statusSubmitted', icon: 'bi-check2-circle' },
  viewed: { label: 'Görüntülendi', tone: 'statusPending', icon: 'bi-eye' },
  under_review: { label: 'İnceleniyor', tone: 'statusPending', icon: 'bi-hourglass-split' },
  reviewed: { label: 'İncelendi', tone: 'statusPending', icon: 'bi-clipboard-check' },
  approved: { label: 'Onaylandı', tone: 'statusApproved', icon: 'bi-check-circle-fill' },
  rejected: { label: 'Reddedildi', tone: 'statusRejected', icon: 'bi-x-circle' },
};
export const entrepreneurStatus = application => entrepreneurStatuses[application?.reviewStatus || application?.status] || entrepreneurStatuses.submitted;
