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
  add('title', application.answers?.venture_name || 'Başvuru dosyası');
  field('Başvuru no', application._id);
  field('Durum', application.status === 'submitted' ? 'Gönderildi' : application.status);
  field('Başvuran hesap', application.applicant?.name || 'Hesap artık mevcut değil');
  field('E-posta', application.applicant?.email || '—');
  field('Telefon', application.applicant?.phone || '—');
  field('Gönderim tarihi', date(application.submittedAt));
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
    const doc = new PDFDocument({ size: 'A4', margins: { top: 48, bottom: 56, left: 48, right: 48 }, bufferPages: true, info: { Title: 'Girişimci Başvuru Dosyası', Author: 'Anahtar Fikirler' } });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('error', reject);
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.registerFont('regular', path.join(__dirname, '../assets/fonts/NotoSans-Regular.ttf'));
    doc.registerFont('semibold', path.join(__dirname, '../assets/fonts/NotoSans-SemiBold.ttf'));
    const styles = {
      eyebrow: ['semibold', 9, '#168061', 8], title: ['semibold', 23, '#20374c', 16],
      section: ['semibold', 14, '#006fad', 10], label: ['semibold', 10, '#35465a', 4],
      answer: ['regular', 10, '#243549', 12], note: ['regular', 9, '#617083', 10],
    };
    for (const block of blocks) {
      const [font, size, color, after] = styles[block.kind];
      doc.font(font).fontSize(size);
      const height = doc.heightOfString(block.value, { width: doc.page.width - 96, lineGap: 3 });
      const room = block.kind === 'section' ? 70 : block.kind === 'label' ? Math.min(height, 90) + 24 : 20;
      if (doc.y + room > doc.page.height - 56) doc.addPage();
      if (block.kind === 'section') { doc.moveDown(0.6); }
      doc.fillColor(color).text(block.value, 48, doc.y, { width: doc.page.width - 96, lineGap: 3 });
      doc.y += after;
    }
    const { count } = doc.bufferedPageRange();
    for (let i = 0; i < count; i++) {
      doc.switchToPage(i);
      // Footer lives outside the text area; disabling the bottom margin avoids adding a page.
      doc.page.margins.bottom = 0;
      doc.font('regular').fontSize(8).fillColor('#718095').text(`Girişimci başvuru dosyası  ·  ${i + 1} / ${count}`, 48, doc.page.height - 32, { width: doc.page.width - 96, align: 'right', lineBreak: false });
    }
    doc.end();
  });
}

exports.report = report;
exports.generate = async (application, format) => {
  if (format !== 'pdf') throw Object.assign(new Error('Yalnızca PDF biçiminde dışa aktarılabilir.'), { status: 400 });
  const blocks = report(application);
  return { contents: await pdf(blocks), mimeType: MIME, name: `girisimci-basvurusu-${application._id}.${format}` };
};
