const template = require('../config/entrepreneurForm');
const agreements = require('../config/entrepreneurAgreements');
const { createHash } = require('node:crypto');
const cityKey = value => value.trim().toLocaleLowerCase('tr-TR').normalize('NFD').replace(/\p{M}/gu, '').replace(/ı/g, 'i');

// Only the original mock drafts move to the Word form. Submitted applications
// and published form snapshots retain their questions and all answers.
function legacyDraftFormUpgrade(application) {
  const form = application?.form;
  if (application?.status !== 'draft' || form?.id !== template.id || !form.isMock || ![1, 2].includes(form.version)) return null;
  const old = application.answers || {};
  const answers = {};
  for (const question of template.questions) {
    if (question.type !== 'file' && old[question.id] !== undefined) {
      answers[question.id] = question.type === 'text' && Array.isArray(old[question.id]) ? old[question.id].join(', ') : old[question.id];
    }
  }
  if (typeof old.full_name === 'string') {
    const names = old.full_name.trim().split(/\s+/);
    answers.last_name = names.length > 1 ? names.pop() : '';
    answers.first_name = names.join(' ');
  }
  if (old.founded) answers.company_founded = old.founded;
  const solutionParts = ['venture_summary', 'problem', 'customers', 'difference'].filter(id => old[id]).map(id => `${form.questions.find(q => q.id === id)?.label || id}: ${old[id]}`);
  if (solutionParts.length) answers.solution = solutionParts.join('\n\n');
  if (typeof answers.city === 'string') answers.city = template.questions.find(q => q.id === 'city').options.find(city => cityKey(city) === cityKey(answers.city)) || answers.city;
  delete answers.kvkk_ack;
  const documents = (application.documents || []).map(doc => ({ ...(doc.toObject ? doc.toObject() : doc), questionId: doc.questionId === 'company_documents' ? 'additional_documents' : doc.questionId }));
  return { form: structuredClone(template), answers, documents,
    previousVersions: [...(application.previousVersions || []), { form, answers: old, documents: (application.documents || []).map(doc => doc.toObject ? doc.toObject() : doc), migratedAt: new Date() }],
  };
}

function draftFormUpgrade(application) {
  if (application?.status !== 'draft' || application.form?.id !== template.id) return null;
  const legacy = legacyDraftFormUpgrade(application);
  const form = legacy?.form || application.form;
  if (JSON.stringify(form.agreements) === JSON.stringify(agreements)) return legacy;
  // Only attach the newly required acknowledgements to an existing draft;
  // its questions, files, KVKK text and other answers keep their own snapshot.
  const answers = { ...(legacy?.answers || application.answers) };
  const fingerprint = createHash('sha256').update(JSON.stringify(agreements)).digest('hex').slice(0, 12);
  for (const agreement of agreements) {
    if (JSON.stringify(form.agreements?.find(item => item.id === agreement.id)) !== JSON.stringify(agreement)) delete answers[agreement.id];
  }
  return { ...legacy, answers, form: { ...form, agreements: structuredClone(agreements), version: `${form.version}-agreements-${fingerprint}` } };
}
module.exports = { draftFormUpgrade };
