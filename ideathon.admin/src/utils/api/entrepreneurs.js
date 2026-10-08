import api from './axios';

const base = '/entrepreneurs/admin';

export const entrepreneurAdminAPI = {
  form: async signal => (await api.get(`${base}/form`, { signal })).data.data,
  saveForm: async (form, revision) => (await api.put(`${base}/form`, { form, revision })).data.data,
  publishForm: async (form, revision) => (await api.post(`${base}/form/publish`, { form, revision })).data.data,
  formDrafts: async (page = 1, signal) => (await api.get(`${base}/form/drafts`, { params: { page }, signal })).data.data,
  formDraft: async (id, signal) => (await api.get(`${base}/form/drafts/${encodeURIComponent(id)}`, { signal })).data.data,
  createFormDraft: async (name, form) => (await api.post(`${base}/form/drafts`, { name, form })).data.data,
  saveFormDraft: async (id, name, form, revision) => (await api.put(`${base}/form/drafts/${encodeURIComponent(id)}`, { name, form, revision })).data.data,
  publishFormDraft: async (id, revision, settingsRevision) => (await api.post(`${base}/form/drafts/${encodeURIComponent(id)}/publish`, { revision, settingsRevision })).data.data,
  list: async (params, signal) => (await api.get(base, { params, signal })).data,
  detail: async (id, signal) => (await api.get(`${base}/${encodeURIComponent(id)}`, { signal })).data.data,
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
