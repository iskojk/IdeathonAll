const test = require('node:test');
const assert = require('node:assert/strict');
const template = require('../src/config/entrepreneurForm');
const { validateAnswers, validDocument } = require('../src/services/entrepreneurValidation');

test('Word set contains 21 unique questions and its configured question types', () => {
  assert.equal(template.questions.length, 21);
  assert.equal(new Set(template.questions.map(q => q.id)).size, 21);
  assert.deepEqual([...new Set(template.questions.map(q => q.type))].sort(), ['consent', 'file', 'singleChoice', 'text', 'textarea']);
  for (const question of template.questions) assert.ok(template.sections.some(section => section.id === question.section));
});

test('drafts accept missing fields; mock submissions require answers but documents are optional', () => {
  assert.deepEqual(validateAnswers(template, {}, [], false).errors, {});
  const result = validateAnswers(template, {}, [], true);
  assert.ok(result.errors.first_name);
  assert.ok(result.errors.city);
  for (const question of template.questions.filter(q => q.type === 'file')) {
    assert.equal(question.required, false);
    assert.equal(result.errors[question.id], undefined);
  }
  assert.equal(result.errors.notes, undefined);
  assert.ok(validateAnswers(template, { pitch_deck: 'fake-file.pdf' }, [], true).errors.form);
});

test('all 81 provinces are selectable; a valid submission needs no documents', () => {
  const city = template.questions.find(q => q.id === 'city');
  assert.equal(city.options.length, 81);
  assert.equal(new Set(city.options).size, 81);
  for (const option of city.options) assert.deepEqual(validateAnswers(template, { city: option }).errors, {});
  assert.ok(validateAnswers(template, { city: 'Hayali şehir' }).errors.city);
  const answers = Object.fromEntries([...template.questions, ...template.agreements].filter(q => q.required && q.type !== 'file').map(q => [q.id,
    q.type === 'consent' ? true : q.type === 'multipleChoice' ? [q.options[0]] : q.type === 'singleChoice' ? q.options[0] : q.inputType === 'email' ? 'test@example.com' : q.inputType === 'tel' ? '0532 123 45 67' : 'Örnek yanıt',
  ]));
  assert.deepEqual(validateAnswers(template, answers, [], true).errors, {});
});

test('phone fields reject invalid input and normalize domestic and international numbers', () => {
  for (const phone of ['abc', '123', '0532123456', '053212345678', '+90 111 123 45 67', '0532abc1234567', '++905321234567']) {
    assert.ok(validateAnswers(template, { phone }, [], false).errors.phone, phone);
    assert.ok(validateAnswers(template, { phone }, [], true).errors.phone, phone);
  }
  for (const [phone, expected] of [
    ['0532 123 45 67', '+905321234567'], ['5321234567', '+905321234567'],
    ['+90 (532) 123-45-67', '+905321234567'], ['0090 532 123 45 67', '+905321234567'],
    ['0212 123 45 67', '+902121234567'], ['+44 20 7946 0958', '+442079460958'],
  ]) {
    const result = validateAnswers(template, { phone });
    assert.deepEqual(result.errors, {}, phone);
    assert.equal(result.answers.phone, expected);
  }
  assert.deepEqual(validateAnswers(template, { phone: '' }, [], false).errors, {});
  assert.ok(validateAnswers(template, { phone: '' }, [], true).errors.phone);
});

test('other question sets can still require real uploaded documents', () => {
  const form = { questions: [{ id: 'required_file', type: 'file', required: true }] };
  assert.ok(validateAnswers(form, {}, [], true).errors.required_file);
  assert.deepEqual(validateAnswers(form, {}, [{ questionId: 'required_file' }], true).errors, {});
});

test('invalid answer types, unknown questions, options and URLs are rejected', () => {
  assert.ok(validateAnswers(template, { first_name: ['wrong type'] }).errors.first_name);
  assert.ok(validateAnswers(template, { unknown: 'value' }).errors.form);
  assert.ok(validateAnswers(template, { city: 'invented' }).errors.city);
  assert.ok(validateAnswers(template, { focus_areas: ['invented'] }).errors.focus_areas);
  assert.ok(validateAnswers({ questions: [{ id: 'website', type: 'text', inputType: 'url' }] }, { website: 'javascript:alert(1)' }).errors.website);
  assert.ok(validateAnswers(template, { email: 'invalid' }).errors.email);
  assert.ok(validateAnswers(template, { first_name: 'x'.repeat(121) }).errors.first_name);
});

test('question count is dynamic, and single/multiple choice answers retain their types', () => {
  const form = { ...template, questions: [...template.questions, { id: 'new_question', type: 'text', required: true }, { id: 'choices', type: 'multipleChoice', options: ['Akıllı şehirler', 'Diğer'] }] };
  assert.ok(validateAnswers(form, {}, [], true).errors.new_question);
  const result = validateAnswers(form, { new_question: ' Yeni yanıt ', stage: 'Fikir', choices: ['Akıllı şehirler', 'Akıllı şehirler', 'Diğer'] });
  assert.deepEqual(result.errors, {});
  assert.equal(result.answers.new_question, 'Yeni yanıt');
  assert.deepEqual(result.answers.choices, ['Akıllı şehirler', 'Diğer']);
});

test('upload validation checks file contents, extension and MIME type together', () => {
  assert.equal(validDocument({ originalname: 'sunum.pdf', mimetype: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n') }), true);
  assert.equal(validDocument({ originalname: 'sunum.pdf', mimetype: 'application/pdf', buffer: Buffer.from('<script>') }), false);
  assert.equal(validDocument({ originalname: 'sunum.html', mimetype: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n') }), false);
  assert.equal(validDocument({ originalname: 'sunum.svg', mimetype: 'image/svg+xml', buffer: Buffer.from('<svg/>') }), false);
});

test('each required agreement rejects missing, false and truthy nonboolean answers independently', () => {
  const ids = ['kvkk_ack', 'privacy_policy_ack', 'terms_ack'];
  const accepted = Object.fromEntries(ids.map(id => [id, true]));
  for (const id of ids) {
    for (const value of [undefined, false, 'true', ['accepted'], 1]) {
      const { errors } = validateAnswers(template, { ...accepted, [id]: value }, [], true);
      assert.ok(errors[id], `${id}: ${JSON.stringify(value)}`);
      for (const other of ids.filter(other => other !== id)) assert.equal(errors[other], undefined);
    }
    assert.equal(validateAnswers(template, accepted, [], true).errors[id], undefined);
    assert.deepEqual(validateAnswers(template, { [id]: false }).errors, {});
  }
});
