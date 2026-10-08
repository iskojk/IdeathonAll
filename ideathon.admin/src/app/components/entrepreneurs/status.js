export const reviewStatuses = {
  submitted: { label: 'İletildi', color: 'info' },
  viewed: { label: 'Görüntülendi', color: 'secondary' },
  under_review: { label: 'İnceleniyor', color: 'warning' },
  reviewed: { label: 'İncelendi', color: 'primary' },
  approved: { label: 'Onaylandı', color: 'success' },
  rejected: { label: 'Reddedildi', color: 'error' },
};
export const reviewStatus = application => reviewStatuses[application.reviewStatus] || reviewStatuses.submitted;
