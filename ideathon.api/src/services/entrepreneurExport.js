const path = require('node:path');
const PDFDocument = require('pdfkit');

const MIME = 'application/pdf';
const date = value => {
  if (!value || Number.isNaN(new Date(value).getTime())) return '—';
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Istanbul' }).format(new Date(value));
};
const text = value => {
  if (typeof value === 'boolean') return value ? 'Onaylandı' : 'Onaylanmadı';
  if (Array.isArray(value)) return value.length ? value.map(String).join('\n') : 'Yanıt verilmedi.';
  return value === undefined || value === null || value === '' ? 'Yanıt verilmedi.' : String(value);
};
const documentText = document => `${document.name} · ${(Number(document.size || 0) / 1024).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} KB · ${document.mimeType || 'Dosya'}`;

// The export uses the application's saved question set, never today's edited form.
function report(application) {
  const blocks = [];
  const add = (kind, value) => blocks.push({ kind, value: String(value) });
  const field = (label, value) => { add('label', label); add('answer', text(value)); };
  add('eyebrow', 'GİRİŞİMCİ BAŞVURUSU');
  add('title', application.contact?.ventureName || application.answers?.venture_name || 'Başvuru dosyası');
  field('Başvuru no', application.applicationNumber || '—');
  field('Başvuru türü', application.source === 'admin' ? 'Manuel' : 'Sistem');
  field('Durum', require('./entrepreneurWorkflow').reviewLabel(application));
  field('Başvuran', application.contact?.name || application.applicant?.name || 'Hesap artık mevcut değil');
  field('E-posta', application.contact?.email || application.applicant?.email || '—');
  field('Telefon', application.contact?.phone ?? application.applicant?.phone ?? '—');
  if (application.source === 'admin') add('note', 'Bu kayıt yönetici tarafından havuza eklenmiştir.');
  field('Başvuru Tarihi', date(application.submittedAt));
  field('Oluşturulma tarihi', date(application.createdAt));
  field('Son güncelleme', date(application.updatedAt));

  function answers(snapshot, headingPrefix = '') {
    const form = snapshot.form || {};
    const questions = (form.questions || []).filter(q => q.id !== 'kvkk_ack');
    const sections = [...(form.sections || [])];
    if (questions.some(q => !sections.some(s => s.id === q.section))) sections.push({ id: null, title: 'Diğer bilgiler' });
    for (const section of sections) {
      const items = questions.filter(q => section.id === null ? !form.sections?.some(s => s.id === q.section) : q.section === section.id);
      if (!items.length) continue;
      add('section', `${headingPrefix}${section.title}`);
      if (section.description) add('note', section.description);
      for (const q of items) {
        if (q.type === 'file') {
          const files = (snapshot.documents || []).filter(d => d.questionId === q.id);
          field(q.label, files.length ? files.map(documentText).join('\n') : 'Evrak eklenmedi.');
        } else field(q.label, snapshot.answers?.[q.id]);
      }
    }
    const orphanFiles = (snapshot.documents || []).filter(d => !questions.some(q => q.id === d.questionId));
    if (orphanFiles.length) { add('section', `${headingPrefix}Diğer evraklar`); field('Eklenen evraklar', orphanFiles.map(documentText).join('\n')); }
    const kvkk = (form.questions || []).find(q => q.id === 'kvkk_ack');
    if (kvkk || form.agreements?.length) {
      add('section', `${headingPrefix}Gizlilik ve Kullanım Onayları`);
      if (kvkk) { field(kvkk.label, snapshot.answers?.[kvkk.id]); if (snapshot.privacy?.acknowledgedAt) add('note', `Onay tarihi: ${date(snapshot.privacy.acknowledgedAt)}`); }
      for (const agreement of form.agreements || []) {
        const proof = snapshot.privacy?.agreements?.find(p => p.id === agreement.id);
        field(agreement.label, snapshot.answers?.[agreement.id]);
        if (proof?.acknowledgement || agreement.acknowledgement) add('note', proof?.acknowledgement || agreement.acknowledgement);
        if (proof?.acceptedAt) add('note', `Onay tarihi: ${date(proof.acceptedAt)}`);
      }
    }
  }
  answers(application);
  (application.previousVersions || []).forEach((snapshot, index) => {
    add('section', `Önceki örnek form yanıtları · ${index + 1}`);
    answers(snapshot);
  });
  return blocks;
}

function pdf(blocks) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 76, bottom: 54, left: 44, right: 44 }, bufferPages: true, info: { Title: 'Girişimci Başvuru Dosyası', Author: 'Anahtar Fikirler' } });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('error', reject);
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.registerFont('regular', path.join(__dirname, '../assets/fonts/NotoSans-Regular.ttf'));
    doc.registerFont('semibold', path.join(__dirname, '../assets/fonts/NotoSans-SemiBold.ttf'));
    const left = 44;
    const width = doc.page.width - left * 2;
    const colors = { blue: '#0065AE', ink: '#243549', muted: '#69798B', line: '#DDE6EE', pale: '#F3F7FB' };
    let style = ['regular', 10, colors.ink];
    let continuation = '';
    const apply = ([font, size, color]) => { doc.font(font).fontSize(size).fillColor(color); };
    const use = (font, size, color) => { style = [font, size, color]; apply(style); };
    const measure = (value, font, size, availableWidth) => {
      doc.font(font).fontSize(size);
      const height = doc.heightOfString(value, { width: availableWidth, lineGap: 3 });
      apply(style);
      return height;
    };
    const fitLine = (value, availableWidth) => {
      const letters = Array.from(value.replace(/\s+/g, ' '));
      if (doc.widthOfString(letters.join('')) <= availableWidth) return letters.join('');
      while (letters.length && doc.widthOfString(`${letters.join('')}...`) > availableWidth) letters.pop();
      return `${letters.join('')}...`;
    };
    const header = () => {
      doc.save();
      doc.font('semibold').fontSize(9).fillColor(colors.blue).text('ANAHTAR FİKİRLER', left, 30, { lineBreak: false });
      doc.font('regular').fontSize(8).fillColor(colors.muted).text('Girişimci Başvuru Dosyası', left, 31, { width, align: 'right', lineBreak: false });
      doc.moveTo(left, 53).lineTo(left + width, 53).lineWidth(0.75).strokeColor(colors.line).stroke();
      let top = 76;
      if (continuation) {
        doc.font('regular').fontSize(8).fillColor(colors.muted)
          .text(fitLine(`Yanıt devamı: ${continuation}`, width), left, 69, { lineBreak: false });
        top = 93;
      }
      doc.restore(); apply(style); doc.x = left; doc.y = top;
    };
    doc.on('pageAdded', header);
    header();
    const ensure = height => { if (doc.y + height > doc.page.height - doc.page.margins.bottom) doc.addPage(); };
    const write = (value, { font = 'regular', size = 10, color = colors.ink, inset = 0, after = 0 } = {}) => {
      use(font, size, color);
      doc.text(value, left + inset, doc.y, { width: width - inset, lineGap: 3 });
      doc.y += after;
    };
    const fieldRoom = (index, number) => {
      const labelHeight = measure(`${number}. ${blocks[index].value}`, 'semibold', 9.5, width);
      const answerHeight = measure(blocks[index + 1].value, 'regular', 10, width - 12);
      let height = labelHeight + 4 + answerHeight + 9;
      for (let next = index + 2; blocks[next]?.kind === 'note'; next++) height += measure(blocks[next].value, 'regular', 8.5, width - 12) + 4;
      return height <= doc.page.height - 76 - 54 ? height : labelHeight + 25;
    };

    // Compact, two-column summary. All metadata remains available in the report.
    write('GİRİŞİMCİ BAŞVURUSU', { font: 'semibold', size: 8, color: colors.blue, after: 6 });
    write(blocks.find(block => block.kind === 'title').value, { font: 'semibold', size: 22, after: 18 });
    const sectionStart = blocks.findIndex(block => block.kind === 'section');
    const metadataEnd = sectionStart === -1 ? blocks.length : sectionStart;
    const metadata = [];
    for (let i = 2; i < metadataEnd; i++) {
      if (blocks[i].kind === 'label' && blocks[i + 1]?.kind === 'answer') metadata.push({ label: blocks[i].value, value: blocks[++i].value });
    }
    ensure(60);
    use('semibold', 9, colors.blue);
    doc.text('BAŞVURU ÖZETİ', left, doc.y, { lineBreak: false });
    doc.y += 22;
    const columnWidth = (width - 48) / 2;
    for (let i = 0; i < metadata.length; i += 2) {
      const row = metadata.slice(i, i + 2);
      const height = Math.max(...row.map(field => measure(field.value, 'regular', 9, columnWidth))) + 36;
      if (height > doc.page.height - 76 - 54) {
        // Unusually long account values still flow without clipping.
        for (const field of row) {
          write(field.label, { font: 'semibold', size: 8, color: colors.muted, after: 4 });
          write(field.value, { size: 9, after: 12 });
        }
        continue;
      }
      ensure(height);
      const top = doc.y;
      doc.save().rect(left, top, width, height).fill(colors.pale).restore();
      if (i) doc.save().moveTo(left + 16, top).lineTo(left + width - 16, top).strokeColor(colors.line).lineWidth(0.5).stroke().restore();
      row.forEach((field, column) => {
        const x = left + 16 + column * (columnWidth + 16);
        use('semibold', 7.5, colors.muted);
        doc.text(field.label.toLocaleUpperCase('tr-TR'), x, top + 10, { width: columnWidth, lineGap: 2 });
        use('regular', 9, colors.ink);
        doc.text(field.value, x, top + 25, { width: columnWidth, lineGap: 3 });
      });
      doc.y = top + height; doc.x = left;
    }
    doc.y += 12;

    let sectionNumber = 0;
    let questionNumber = 0;
    for (let i = metadataEnd; i < blocks.length; i++) {
      const block = blocks[i];
      if (block.kind === 'section') {
        sectionNumber++; questionNumber = 0;
        const height = Math.max(34, measure(block.value, 'semibold', 12, width - 60) + 18);
        let firstField = i + 1;
        let notesHeight = 0;
        while (blocks[firstField]?.kind === 'note') {
          notesHeight += measure(blocks[firstField].value, 'regular', 8.5, width - 12) + 4;
          firstField++;
        }
        const firstRoom = blocks[firstField]?.kind === 'label' && blocks[firstField + 1]?.kind === 'answer' ? fieldRoom(firstField, 1) : 24;
        ensure(height + 18 + notesHeight + firstRoom);
        doc.y += 8;
        const top = doc.y;
        doc.save().roundedRect(left, top, width, height, 5).fill('#EAF3FB').restore();
        doc.save().roundedRect(left + 10, top + (height - 23) / 2, 25, 23, 4).fill(colors.blue).restore();
        use('semibold', 9, '#FFFFFF');
        doc.text(String(sectionNumber).padStart(2, '0'), left + 10, top + (height - 23) / 2 + 5, { width: 25, align: 'center', lineBreak: false });
        use('semibold', 12, colors.blue);
        doc.text(block.value, left + 46, top + 10, { width: width - 60, lineGap: 3 });
        doc.y = top + height + 10; doc.x = left;
      } else if (block.kind === 'label' && blocks[i + 1]?.kind === 'answer') {
        questionNumber++;
        const label = `${questionNumber}. ${block.value}`;
        ensure(fieldRoom(i, questionNumber));
        write(label, { font: 'semibold', size: 9.5, color: '#41546A', after: 4 });
        continuation = block.value;
        write(blocks[++i].value, { size: 10, inset: 12, after: 9 });
        continuation = '';
      } else if (block.kind === 'note') {
        ensure(22);
        write(block.value, { size: 8.5, color: colors.muted, inset: 12, after: 4 });
      }
    }
    const { count } = doc.bufferedPageRange();
    for (let i = 0; i < count; i++) {
      doc.switchToPage(i);
      // Footer lives outside the text area; disabling the bottom margin avoids adding a page.
      doc.page.margins.bottom = 0;
      doc.save().moveTo(left, doc.page.height - 43).lineTo(left + width, doc.page.height - 43).strokeColor(colors.line).lineWidth(0.75).stroke().restore();
      doc.font('regular').fontSize(7.5).fillColor(colors.muted).text('Anahtar Fikirler | Girişimci başvurusu', left, doc.page.height - 32, { lineBreak: false });
      doc.text(`${i + 1} / ${count}`, left, doc.page.height - 32, { width, align: 'right', lineBreak: false });
    }
    doc.end();
  });
}

exports.report = report;
exports.generate = async (application, format) => {
  if (format !== 'pdf') throw Object.assign(new Error('Yalnızca PDF biçiminde dışa aktarılabilir.'), { status: 400 });
  const blocks = report(application);
  return { contents: await pdf(blocks), mimeType: MIME, name: `girisimci-basvurusu-${application.applicationNumber || application._id}.${format}` };
};
