const { normalizePhone } = require('./entrepreneurPhone');

function validateAnswers(form, answers, documents = [], submit = false) {
  const errors = {};
  const normalized = {};
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    return { errors: { form: 'Yanıtlar geçerli bir nesne olmalıdır.' }, answers: normalized };
  }
  const fields = [...form.questions, ...(form.agreements || [])];
  const knownIds = new Set(fields.filter(q => q.type !== 'file').map(q => q.id));
  if (Object.keys(answers).some(id => !knownIds.has(id))) errors.form = 'Soru setinde bulunmayan bir yanıt gönderildi.';

  for (const question of fields) {
    const value = answers[question.id];
    if (question.type === 'consent') {
      if (value !== undefined && typeof value !== 'boolean') errors[question.id] = 'Onay bilgisi geçersiz.';
      if (submit && question.required && value !== true) errors[question.id] = `${question.label} metnini okuyup onaylayın.`;
      normalized[question.id] = value === true;
      continue;
    }
    if (question.type === 'file') {
      const count = documents.filter(doc => doc.questionId === question.id).length;
      if (submit && question.required && !count) errors[question.id] = 'Bu alana bir dosya yükleyin.';
      continue;
    }
    const empty = value === undefined || value === '' || (Array.isArray(value) && value.length === 0);
    if (empty) {
      if (submit && question.required) errors[question.id] = 'Bu soruyu yanıtlayın.';
      continue;
    }
    if (question.type === 'multipleChoice') {
      if (!Array.isArray(value) || value.some(item => typeof item !== 'string' || !question.options.includes(item))) {
        errors[question.id] = 'Listeden geçerli seçenekler işaretleyin.';
      } else normalized[question.id] = [...new Set(value)];
      continue;
    }
    if (typeof value !== 'string') {
      errors[question.id] = 'Geçerli bir metin girin.';
      continue;
    }
    const text = value.trim();
    if (submit && question.required && !text) errors[question.id] = 'Bu soruyu yanıtlayın.';
    if (text.length > (question.maxLength || 5000)) errors[question.id] = `En fazla ${question.maxLength || 5000} karakter girin.`;
    if (question.type === 'singleChoice' && !question.options.includes(text)) errors[question.id] = 'Listeden bir seçenek belirleyin.';
    if (text && question.inputType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) errors[question.id] = 'Geçerli bir e-posta adresi girin.';
    if (text && question.inputType === 'url') {
      try { if (!['http:', 'https:'].includes(new URL(text).protocol)) throw new Error(); }
      catch { errors[question.id] = 'http:// veya https:// ile başlayan bir bağlantı girin.'; }
    }
    if (text && question.inputType === 'number' && !/^-?\d+(\.\d+)?$/.test(text)) errors[question.id] = 'Geçerli bir sayı girin.';
    if (text && question.inputType === 'date' && (!/^\d{4}-\d{2}-\d{2}$/.test(text) || !Number.isFinite(Date.parse(text)) || new Date(text).toISOString().slice(0, 10) !== text)) errors[question.id] = 'Geçerli bir tarih girin.';
    if (text && question.inputType === 'tel') {
      // Keep the same phone normalization as the existing application flow.
      const phone = normalizePhone(text);
      if (!phone) errors[question.id] = 'Geçerli bir telefon numarası girin. Örnek: 0532 123 45 67 veya +90 532 123 45 67.';
      normalized[question.id] = phone || text;
    } else normalized[question.id] = text;
  }
  return { errors, answers: normalized };
}

function validDocument(file) {
  const buffer = file.buffer;
  const name = file.originalname.toLowerCase();
  if (file.mimetype === 'application/pdf') return name.endsWith('.pdf') && buffer.subarray(0, 5).toString() === '%PDF-';
  if (file.mimetype === 'image/png') return name.endsWith('.png') && buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if (file.mimetype === 'image/jpeg') return /\.jpe?g$/.test(name) && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255;
  return false;
}

module.exports = { validateAnswers, validDocument };
