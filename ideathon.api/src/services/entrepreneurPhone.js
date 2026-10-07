function normalizePhone(value) {
  const text = value.trim();
  if (!/^\+?[\d\s().-]+$/.test(text)) return null;
  let number = text.replace(/[\s().-]/g, '');
  if (number.startsWith('00')) number = '+' + number.slice(2);
  if (number.startsWith('+90')) return /^\+90[2-5]\d{9}$/.test(number) ? number : null;
  if (number.startsWith('+')) return /^\+[1-9]\d{7,14}$/.test(number) ? number : null;
  if (/^0?[2-5]\d{9}$/.test(number)) return '+90' + number.replace(/^0/, '');
  return null;
}

module.exports = { normalizePhone };
