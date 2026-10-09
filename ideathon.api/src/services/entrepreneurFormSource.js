const { getSettings } = require('./entrepreneurFormSettings');
const { withoutKvkk } = require('./entrepreneurConsentPolicy');

async function getEntrepreneurForm() {
  return withoutKvkk((await getSettings()).active);
}

module.exports = { getEntrepreneurForm };
