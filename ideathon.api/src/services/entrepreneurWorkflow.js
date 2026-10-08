const reviewStatuses = {
  submitted: 'İletildi', viewed: 'Görüntülendi', under_review: 'İnceleniyor',
  reviewed: 'İncelendi', approved: 'Onaylandı', rejected: 'Reddedildi',
};

function workingApplication(application) {
  if (!application) return null;
  const data = application.toObject ? application.toObject() : application;
  return data.editDraft ? { ...data, answers: data.editDraft.answers, documents: data.editDraft.documents, status: 'draft', isResubmission: true } : data;
}

function reviewLabel(application) {
  return reviewStatuses[application.reviewStatus || 'submitted'] || reviewStatuses.submitted;
}

module.exports = { reviewStatuses, workingApplication, reviewLabel };
