const { validateAnswers } = require('./entrepreneurValidation');
const { normalizePhone } = require('./entrepreneurPhone');

function fail(message, errors = {}) { throw Object.assign(new Error(message), { status: 422, errors }); }

function validateContact(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('Girişimci bilgilerini girin.');
  const result = {};
  const errors = {};
  for (const [key, label, max, required] of [
    ['name', 'Ad soyad', 150, true], ['email', 'E-posta', 254, true],
    ['ventureName', 'Girişim adı', 200, true], ['phone', 'Telefon', 30, false],
  ]) {
    const value = input[key] ?? '';
    if (typeof value !== 'string' || value.length > max || (required && !value.trim())) errors[key] = `${label} alanını geçerli şekilde doldurun.`;
    else result[key] = value.trim();
  }
  if (result.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email)) errors.email = 'Geçerli bir e-posta adresi girin.';
  if (result.phone) {
    const phone = normalizePhone(result.phone);
    if (!phone) errors.phone = 'Geçerli bir telefon numarası girin.';
    else result.phone = phone;
  }
  if (Object.keys(errors).length) fail('Lütfen işaretli alanları kontrol edin.', errors);
  return result;
}

function editableQuestions(form) {
  return (form.questions || []).filter(q => q.type !== 'file' && q.type !== 'consent' && q.id !== 'kvkk_ack');
}

function updateAnswers(form, previous, patch, contact) {
  const fields = editableQuestions(form);
  const supplied = patch === undefined ? {} : patch;
  if (!supplied || typeof supplied !== 'object' || Array.isArray(supplied)) fail('Başvuru yanıtları geçersiz.');
  const names = contact.name.split(/\s+/);
  const identity = { full_name: contact.name, first_name: names.length > 1 ? names.slice(0, -1).join(' ') : contact.name, last_name: names.length > 1 ? names.at(-1) : '', email: contact.email, phone: contact.phone, venture_name: contact.ventureName };
  // Preserve an explicitly supplied multi-part surname when the full name agrees.
  const original = { ...(previous || {}), ...supplied };
  if (typeof original.first_name === 'string' && typeof original.last_name === 'string' && [original.first_name, original.last_name].join(' ').trim().replace(/\s+/g, ' ') === contact.name.replace(/\s+/g, ' ')) {
    identity.first_name = original.first_name.trim(); identity.last_name = original.last_name.trim();
  }
  const incoming = { ...supplied };
  // Keep existing question IDs and their formats; consent evidence is never edited by an admin.
  for (const q of fields) if (['text', 'textarea'].includes(q.type) && Object.hasOwn(identity, q.id)) incoming[q.id] = identity[q.id];
  const validation = validateAnswers({ questions: fields }, incoming);
  if (Object.keys(validation.errors).length) fail('Başvuru yanıtlarını kontrol edin.', validation.errors);
  const answers = { ...(previous || {}) };
  for (const key of Object.keys(incoming)) {
    if (Object.hasOwn(validation.answers, key)) answers[key] = validation.answers[key];
    else delete answers[key];
  }
  return answers;
}

module.exports = { validateContact, editableQuestions, updateAnswers };
