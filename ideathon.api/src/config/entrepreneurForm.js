const { buildForm } = require('./entrepreneurQuestionSet');
const privacy = require('./entrepreneurPrivacy');
const agreements = require('./entrepreneurAgreements');
const form = buildForm(privacy.text);

module.exports = {
  ...form, id: 'entrepreneur-application', version: 8, isMock: false, sourceUrl: null, agreements,
  description: 'Girişiminizi, ekibinizi ve çözümünüzü tanıyalım.',
  sourceDocument: 'ideathon_başvuru_soru_seti.docx',
  sections: form.sections.filter(section => section.id !== 'privacy'),
  questions: form.questions.filter(question => question.id !== 'kvkk_ack').map(question => {
    const field = { ...question };
    if (field.id === 'email' || field.id === 'phone') field.prefill = field.id;
    if (field.id === 'city') Object.assign(field, { placeholder: 'Şehir seçin', searchPlaceholder: 'Şehir ara...', help: 'Türkiye’nin 81 ili arasından arayarak seçim yapabilirsiniz.' });
    if (field.id === 'solution') field.maxLength = 10000;
    if (field.id === 'additional_documents') field.maxFiles = 6;
    return field;
  }),
};
