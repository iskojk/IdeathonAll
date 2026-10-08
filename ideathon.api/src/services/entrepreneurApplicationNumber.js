const Counter = require('../models/EntrepreneurApplicationCounter');

function applicationYear(date) {
  const value = new Date(date);
  if (!Number.isFinite(value.getTime())) throw new Error('Başvuru tarihi geçersiz.');
  return Number(new Intl.DateTimeFormat('en', { timeZone: 'Europe/Istanbul', year: 'numeric' }).format(value));
}
function formatApplicationNumber(year, sequence) {
  if (!Number.isInteger(year) || year < 2000 || year > 2099 || !Number.isSafeInteger(sequence) || sequence < 1) throw new Error('Başvuru sıra bilgisi geçersiz.');
  return `AFZ${String(year).slice(-2)}${String(sequence).padStart(3, '0')}`;
}
async function nextApplicationNumber(date) {
  const year = applicationYear(date);
  let counter;
  try {
    counter = await Counter.findOneAndUpdate({ _id: String(year) }, { $inc: { sequence: 1 } }, { upsert: true, new: true, setDefaultsOnInsert: false });
  } catch (error) {
    if (error.code !== 11000) throw error;
    counter = await Counter.findOneAndUpdate({ _id: String(year) }, { $inc: { sequence: 1 } }, { new: true });
  }
  return formatApplicationNumber(year, counter.sequence);
}
module.exports = { applicationYear, formatApplicationNumber, nextApplicationNumber };
