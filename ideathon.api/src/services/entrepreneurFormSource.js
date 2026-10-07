const { getSettings } = require('./entrepreneurFormSettings');

async function getEntrepreneurForm() {
  return (await getSettings()).active;
}

module.exports = { getEntrepreneurForm };
