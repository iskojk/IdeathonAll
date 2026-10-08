import api from './axios';

const base = '/entrepreneurs/admin';

export const entrepreneurAdminAPI = {
  form: async signal => (await api.get(`${base}/form`, { signal })).data.data,
  saveForm: async (form, revision) => (await api.put(`${base}/form`, { form, revision })).data.data,
  publishForm: async (form, revision) => (await api.post(`${base}/form/publish`, { form, revision })).data.data,
  formDrafts: async (page = 1, signal, view = 'active') => (await api.get(`${base}/form/drafts`, { params: { page, view }, signal })).data.data,
  formDraft: async (id, signal) => (await api.get(`${base}/form/drafts/${encodeURIComponent(id)}`, { signal })).data.data,
  createFormDraft: async (name, form) => (await api.post(`${base}/form/drafts`, { name, form })).data.data,
  saveFormDraft: async (id, name, form, revision) => (await api.put(`${base}/form/drafts/${encodeURIComponent(id)}`, { name, form, revision })).data.data,
  deleteFormDraft: async (id, revision) => (await api.post(`${base}/form/drafts/${encodeURIComponent(id)}/delete`, { revision })).data.data,
  restoreFormDraft: async (id, revision, deletedAt) => (await api.post(`${base}/form/drafts/${encodeURIComponent(id)}/restore`, { revision, deletedAt })).data.data,
  formDraftVersions: async (id, page = 1) => (await api.get(`${base}/form/drafts/${encodeURIComponent(id)}/versions`, { params: { page } })).data.data,
  formDraftVersion: async (id, revision) => (await api.get(`${base}/form/drafts/${encodeURIComponent(id)}/versions/${revision}`)).data.data,
  publishFormDraft: async (id, revision, settingsRevision) => (await api.post(`${base}/form/drafts/${encodeURIComponent(id)}/publish`, { revision, settingsRevision })).data.data,
  list: async (params, signal) => (await api.get(base, { params, signal })).data,
  entryForm: async signal => (await api.get(`${base}/entry-form`, { signal })).data.data,
  importFormats: async signal => (await api.get(`${base}/import/formats`, { signal })).data.data,
  importTemplate: async signal => (await api.get(`${base}/import/template`, { responseType: 'blob', signal })).data,
  importPreview: async (file, signal) => {
    const body = new FormData(); body.append('file', file);
    return (await api.post(`${base}/import/preview`, body, { signal, headers: { 'Content-Type': undefined } })).data.data;
  },
  accounts: async (search, signal) => (await api.get(`${base}/accounts`, { params: { search }, signal })).data.data,
  create: async body => (await api.post(base, body)).data.data,
  update: async (id, body) => (await api.put(`${base}/${encodeURIComponent(id)}`, body)).data.data,
  archive: async (id, revision) => (await api.post(`${base}/${encodeURIComponent(id)}/archive`, { revision })).data.data,
  restore: async (id, revision) => (await api.post(`${base}/${encodeURIComponent(id)}/restore`, { revision })).data.data,
  detail: async (id, signal) => (await api.get(`${base}/${encodeURIComponent(id)}`, { signal })).data.data,
  markViewed: async (id, submittedAt, signal) => (await api.post(`${base}/${encodeURIComponent(id)}/view`, { submittedAt }, { signal })).data.data,
  review: async (id, reviewStatus, revision, signal) => (await api.post(`${base}/${encodeURIComponent(id)}/review`, { reviewStatus, revision }, { signal })).data.data,
  export: async (id, format, signal) => (await api.get(`${base}/${encodeURIComponent(id)}/export`, { params: { format }, responseType: 'blob', signal })).data,
  document: async (id, documentId, signal) => (await api.get(`${base}/${encodeURIComponent(id)}/documents/${encodeURIComponent(documentId)}`, { responseType: 'blob', signal })).data,
};

export async function entrepreneurError(error, fallback) {
  let data = error.response?.data;
  if (typeof Blob !== 'undefined' && data instanceof Blob) {
    try { data = JSON.parse(await data.text()); } catch { data = null; }
  }
  return data?.message || fallback;
}
