const ExcelJS = require('exceljs');
const { editableQuestions } = require('./entrepreneurPoolManagement');

const MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const FORMAT = 'ideathon-entrepreneur-import-v1';
const fail = message => { throw Object.assign(new Error(message), { status: 422 }); };

// Bound expanded workbook size before ExcelJS reads any compressed worksheet XML.
function checkArchive(buffer) {
  let end = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65557); i--) if (buffer.readUInt32LE(i) === 0x06054b50) { end = i; break; }
  if (end < 0) fail('Geçerli bir Excel (.xlsx) dosyası seçin.');
  const count = buffer.readUInt16LE(end + 10);
  let offset = buffer.readUInt32LE(end + 16);
  let expanded = 0;
  if (!count || count > 200 || buffer.readUInt16LE(end + 4) || buffer.readUInt16LE(end + 6)) fail('Excel dosyasının yapısı desteklenmiyor.');
  for (let i = 0; i < count; i++) {
    if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== 0x02014b50) fail('Excel dosyası bozuk veya okunamıyor.');
    expanded += buffer.readUInt32LE(offset + 24);
    if (expanded > 25 * 1024 * 1024) fail('Excel dosyası çok fazla içerik taşıyor. Tek başvuruluk şablonu kullanın.');
    const length = buffer.readUInt16LE(offset + 28);
    const name = buffer.subarray(offset + 46, offset + 46 + length).toString();
    if (/vbaProject\.bin$/i.test(name) || buffer.readUInt16LE(offset + 8) & 1) fail('Makrolu veya şifreli Excel dosyaları desteklenmiyor.');
    offset += 46 + length + buffer.readUInt16LE(offset + 30) + buffer.readUInt16LE(offset + 32);
  }
}

function cellText(cell, question) {
  const value = cell.value;
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (question?.inputType === 'date' && value >= 1 && value < 2958466 && Math.floor(value) !== 60) return new Date(Date.UTC(1899, 11, 31) + (Math.floor(value) - (value >= 60 ? 1 : 0)) * 86400000).toISOString().slice(0, 10);
    return String(value);
  }
  if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString().slice(0, 10);
  if (value.richText) return value.richText.map(item => item.text).join('').trim();
  if (value.hyperlink && typeof value.text === 'string') return value.text.trim();
  // Cached formula results are not trusted as applicant answers.
  fail(`${question?.label || question || 'Excel hücresi'} alanında formül veya desteklenmeyen içerik var. Yanıtı düz metin olarak yazın.`);
}

async function parse(buffer, form) {
  checkArchive(buffer);
  const book = new ExcelJS.Workbook();
  try { await book.xlsx.load(buffer); } catch { fail('Excel dosyası okunamadı. Dosyayı .xlsx olarak kaydedip tekrar deneyin.'); }
  const meta = book.getWorksheet('__meta');
  if (meta && (cellText(meta.getCell('A1')) !== FORMAT || cellText(meta.getCell('A2')) !== String(form.version))) throw Object.assign(new Error('Excel şablonu güncel soru setiyle eşleşmiyor. Güncel şablonu indirip tekrar doldurun.'), { status: 409 });
  const sheets = book.worksheets.filter(sheet => sheet.state === 'visible');
  if (sheets.length > 10 || sheets.some(sheet => sheet.rowCount > 600 || sheet.columnCount > 30)) fail('Tek başvuruluk soru seti şablonunu kullanın.');
  const fields = [];
  let tables = 0;
  for (const sheet of sheets) {
    let header;
    for (let r = 1; r <= Math.min(15, sheet.rowCount); r++) {
      const columns = {};
      sheet.getRow(r).eachCell((cell, column) => { const label = cellText(cell).toLocaleLowerCase('tr-TR'); if (['soru', 'yanıt', 'cevap', 'bölüm', 'soru kodu'].includes(label)) columns[label] = column; });
      if (columns.soru && (columns.yanıt || columns.cevap)) { header = { row: r, label: columns.soru, value: columns.yanıt || columns.cevap, id: columns['soru kodu'], section: columns.bölüm }; break; }
    }
    if (!header) continue;
    tables++;
    for (let r = header.row + 1; r <= sheet.rowCount; r++) {
      const row = sheet.getRow(r);
      const label = cellText(row.getCell(header.label));
      const questionId = header.id ? cellText(row.getCell(header.id)) : '';
      const section = header.section ? cellText(row.getCell(header.section)) : '';
      const q = form.questions.find(item => questionId ? item.id === questionId : item.label.trim() === label && (!section || form.sections.find(s => s.id === item.section)?.title === section));
      let value = cellText(row.getCell(header.value), q || label);
      if (!value) continue;
      if (!label && !questionId) fail(`${r}. satırdaki yanıtın soru bilgisi eksik.`);
      if (q?.type === 'multipleChoice') value = q.options.includes(value) ? [value] : value.split(/\r?\n|;/).map(item => item.trim()).filter(Boolean);
      fields.push({ questionId, label, section, value });
    }
  }
  if (tables !== 1) fail('Dosyada tek bir Soru ve Yanıt tablosu bulunmalıdır. İndirilebilir Excel şablonunu kullanın.');
  if (!fields.length) fail('Excel dosyasında doldurulmuş yanıt bulunamadı. Yanıt sütununu doldurun.');
  return { fields };
}

async function template(form) {
  const book = new ExcelJS.Workbook();
  book.creator = 'Anahtar Fikirler';
  const sheet = book.addWorksheet('Başvuru', { views: [{ state: 'frozen', ySplit: 7, showGridLines: false }], properties: { tabColor: { argb: 'FF007AC3' } } });
  sheet.columns = [{ width: 24, hidden: true }, { width: 24 }, { width: 48 }, { width: 52 }, { width: 46 }];
  sheet.mergeCells('B2:E2'); sheet.getCell('B2').value = 'Girişimci Başvuru Soru Seti';
  sheet.getCell('B2').font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF183B65' } }; sheet.getRow(2).height = 28;
  sheet.mergeCells('B3:E3'); sheet.getCell('B3').value = 'Sarı Yanıt hücrelerini doldurun. Soru metinlerini ve bölüm adlarını değiştirmeyin. Her dosyada yalnızca bir girişimci bulunmalıdır.';
  sheet.mergeCells('B4:E4'); sheet.getCell('B4').value = 'Çoklu seçimlerde her seçeneği ayrı satıra yazın (Alt+Enter). Bu dosya gizlilik onayı veya evrak yüklemesi yerine geçmez.';
  for (const row of [3, 4]) { sheet.getRow(row).height = 30; sheet.getCell(`B${row}`).font = { name: 'Arial', size: 10, color: { argb: 'FF54647A' } }; sheet.getCell(`B${row}`).alignment = { wrapText: true, vertical: 'middle' }; }
  const header = sheet.getRow(7); header.values = ['Soru kodu', 'Bölüm', 'Soru', 'Yanıt', 'Nasıl yanıtlanmalı?']; header.height = 26;
  header.eachCell(cell => { cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF183B65' } }; cell.alignment = { horizontal: 'center', vertical: 'middle' }; });
  const options = book.addWorksheet('__secenekler', { state: 'veryHidden' });
  const choices = book.addWorksheet('Seçenekler', { views: [{ state: 'frozen', ySplit: 1, showGridLines: false }] });
  choices.columns = [{ width: 48 }, { width: 75 }];
  const choicesHeader = choices.addRow(['Soru', 'Seçenek']); choicesHeader.height = 26;
  choicesHeader.eachCell(cell => { cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF183B65' } }; cell.alignment = { horizontal: 'center', vertical: 'middle' }; });
  let optionColumn = 0;
  for (const q of editableQuestions(form)) {
    let hint = q.help || '';
    if (q.type === 'multipleChoice') hint = `Seçenekler sayfasındaki yanıtları ayrı satırlara yazın (Alt+Enter).${hint ? `\n${hint}` : ''}`;
    else if (q.type === 'singleChoice') hint = `Yanıt hücresindeki listeden bir seçenek seçin.${hint ? `\n${hint}` : ''}`;
    else if (q.inputType === 'date') hint = `Tarih: YYYY-AA-GG (örnek: 2026-10-08).${hint ? `\n${hint}` : ''}`;
    else if (q.inputType === 'tel') hint = `Telefon: 0532 123 45 67.${hint ? `\n${hint}` : ''}`;
    if (q.required) hint = `Bu soru başvuruda zorunludur.${hint ? `\n${hint}` : ''}`;
    const row = sheet.addRow([q.id, form.sections.find(s => s.id === q.section)?.title || 'Diğer bilgiler', q.label, null, hint]);
    row.height = Math.max(48, Math.ceil(Math.max(q.label.length / 44, hint.length / 42)) * 14 + 12);
    row.eachCell({ includeEmpty: true }, cell => { cell.font = { name: 'Arial', size: 10, color: { argb: 'FF263C53' } }; cell.alignment = { wrapText: true, vertical: 'top' }; cell.border = { bottom: { style: 'hair', color: { argb: 'FFDCE5EF' } } }; });
    row.getCell(2).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF007AC3' } };
    for (const option of q.options || []) {
      const choiceRow = choices.addRow([q.label, option]); choiceRow.height = Math.max(24, Math.ceil(Math.max(q.label.length / 44, option.length / 70)) * 14 + 10);
      choiceRow.eachCell(cell => { cell.font = { name: 'Arial', size: 10, color: { argb: 'FF263C53' } }; cell.alignment = { wrapText: true, vertical: 'top' }; });
    }
    const answer = row.getCell(4); answer.numFmt = q.inputType === 'date' ? 'yyyy-mm-dd' : q.inputType === 'number' ? '0.########' : '@'; answer.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF4CD' } };
    if (q.type === 'singleChoice') {
      optionColumn++;
      q.options.forEach((value, index) => { options.getCell(index + 1, optionColumn).value = value; });
      const letter = options.getColumn(optionColumn).letter;
      const name = `choices_${optionColumn}`;
      book.definedNames.add(`'__secenekler'!$${letter}$1:$${letter}$${q.options.length}`, name);
      answer.dataValidation = { type: 'list', allowBlank: true, formulae: [name], showErrorMessage: true, errorTitle: 'Geçersiz seçenek', error: 'Listeden bir seçenek seçin.' };
    }
  }
  if (choices.rowCount === 1) book.removeWorksheet(choices.id);
  const meta = book.addWorksheet('__meta', { state: 'veryHidden' }); meta.getCell('A1').value = FORMAT; meta.getCell('A2').value = String(form.version);
  sheet.pageSetup = { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: '7:7', printArea: `B2:E${sheet.rowCount}` };
  return { contents: Buffer.from(await book.xlsx.writeBuffer()), mimeType: MIME, name: 'girisimci-soru-seti.xlsx' };
}

module.exports = { id: 'xlsx', label: 'Excel (.xlsx)', extensions: ['.xlsx'], accepts: file => /\.xlsx$/i.test(file.originalname) && file.buffer.subarray(0, 4).equals(Buffer.from([80, 75, 3, 4])), parse, template, MIME };
