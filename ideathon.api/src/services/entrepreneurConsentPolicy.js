// Retire the separate KVKK question without rewriting stored form snapshots.
function withoutKvkk(form) {
  if (!form?.questions?.some(question => question?.id === 'kvkk_ack')) return form;
  const retiredSections = new Set(form.questions.filter(question => question?.id === 'kvkk_ack').map(question => question.section));
  const questions = form.questions.filter(question => question?.id !== 'kvkk_ack');
  const current = {
    ...form, questions,
    sections: form.sections.filter(section => !retiredSections.has(section.id) || questions.some(question => question?.section === section.id)),
    ...(form.version !== undefined ? { version: `${form.version}-no-kvkk` } : {}),
  };
  delete current.privacy;
  return current;
}

function withoutKvkkAnswer(answers) {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) return answers;
  const current = { ...answers };
  delete current.kvkk_ack;
  return current;
}

// Preserve existing evidence; incoming requests cannot create a retired consent.
function preserveKvkkAnswer(previous, answers) {
  return Object.hasOwn(previous || {}, 'kvkk_ack') ? { ...answers, kvkk_ack: previous.kvkk_ack } : answers;
}

module.exports = { withoutKvkk, withoutKvkkAnswer, preserveKvkkAnswer };
