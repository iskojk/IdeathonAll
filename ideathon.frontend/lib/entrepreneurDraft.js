const key = userId => `entrepreneur-draft:${userId}`;

// Per-user, per-tab recovery. Server revisions prevent overwriting another tab.
export function readDraft(userId) {
  try { return JSON.parse(sessionStorage.getItem(key(userId)) || 'null'); }
  catch { return null; }
}

export function storeDraft(userId, form, application, answers) {
  if (!userId || !form) return;
  try {
    sessionStorage.setItem(key(userId), JSON.stringify({
      formVersion: form.version, applicationId: application?._id || null,
      revision: application?.revision ?? null, answers,
    }));
  } catch { /* Navigation warnings still protect unsaved changes if storage is unavailable. */ }
}

export function clearDraft(userId) {
  try { sessionStorage.removeItem(key(userId)); } catch { /* Storage may be unavailable. */ }
}

export function canRestoreDraft(draft, form, application) {
  return !!draft && !!draft.answers && typeof draft.answers === 'object' && !Array.isArray(draft.answers)
    && (!application || application.status === 'draft')
    && draft.formVersion === form.version
    && draft.applicationId === (application?._id || null)
    && draft.revision === (application?.revision ?? null);
}
