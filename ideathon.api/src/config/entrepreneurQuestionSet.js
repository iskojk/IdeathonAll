const { createHash } = require('node:crypto');
const provinces = require('./turkeyProvinces');

const acknowledgement = 'KVKK Aydınlatma Metni’ni okudum ve bilgilendirildim.';

function buildForm(privacyText) {
  const questions = [
    { id: 'first_name', section: 'contact', type: 'text', label: 'Ad', maxLength: 100 },
    { id: 'last_name', section: 'contact', type: 'text', label: 'Soyad', maxLength: 100 },
    { id: 'email', section: 'contact', type: 'text', inputType: 'email', label: 'E-posta', maxLength: 254 },
    { id: 'phone', section: 'contact', type: 'text', inputType: 'tel', label: 'Telefon', maxLength: 30 },
    { id: 'city', section: 'contact', type: 'singleChoice', label: 'Şehir', options: provinces },
    { id: 'venture_name', section: 'venture', type: 'text', label: 'Girişim Adı', maxLength: 150 },
    { id: 'focus_areas', section: 'venture', type: 'text', label: 'Odak Alanlar', maxLength: 1000 },
    { id: 'stage', section: 'venture', type: 'text', label: 'Girişim Aşaması', maxLength: 500 },
    { id: 'company_status', section: 'venture', type: 'text', label: 'Şirketleşme Durumu', maxLength: 500 },
    { id: 'company_founded', section: 'venture', type: 'text', inputType: 'date', label: 'Şirketleşme Tarihi', required: false, maxLength: 10, help: 'Şirketleştiyseniz kuruluş tarihini gün, ay ve yıl olarak girin veya takvimden seçin.' },
    { id: 'team_size', section: 'team', type: 'text', label: 'Ekibiniz kaç kişi?', maxLength: 100 },
    { id: 'team_intro', section: 'team', type: 'textarea', label: 'Ekip Tanıtımı', maxLength: 4000, help: 'Ekip üyelerinin rollerini ve ilgili deneyimlerini özetleyin. Gereksiz kişisel bilgi paylaşmayın.' },
    { id: 'solution', section: 'solution', type: 'textarea', label: 'Değer Önerisi ve Sağladığı Çözüm', maxLength: 5000, help: 'Değer önerinizi, çözdüğünüz problemi ve hedef kullanıcıları açıklayın.' },
    { id: 'ip_rights', section: 'solution', type: 'textarea', label: 'Fikri-Sınai Mülkiyet Hakkı', maxLength: 2500, help: 'Varsa patent, marka, tasarım veya faydalı modelinizi ve başvuru/tescil durumunu yazın. Yoksa “Yok” yazabilirsiniz.' },
    { id: 'accelerator', section: 'history', type: 'textarea', label: 'Kuluçka / Hızlandırma Programına Katılım', maxLength: 2500, help: 'Katıldığınız programların adını ve tarihini yazın. Katılmadıysanız “Katılmadık” yazabilirsiniz.' },
    { id: 'awards', section: 'history', type: 'textarea', label: 'Ödül Aldınız mı?', maxLength: 2500, help: 'Varsa ödülün adını, veren kuruluşu ve yılını belirtin; yoksa “Hayır” yazın.' },
    { id: 'pilot', section: 'history', type: 'textarea', label: 'Demo / PoC / Pilot çalışması yürüttünüz mü?', maxLength: 4000, help: 'Varsa çalışmanın kapsamını ve sonuçlarını özetleyin; yoksa “Hayır” yazın.' },
    { id: 'investment', section: 'history', type: 'textarea', label: 'Yatırım aldınız mı?', maxLength: 2500, help: 'Varsa yatırım türü, tutarı ve tarihi hakkında paylaşabileceğiniz bilgileri yazın; yoksa “Hayır” yazın.' },
    { id: 'pitch_deck', section: 'documents', type: 'file', label: 'Sunum ve Dokümanlar', required: false, maxFiles: 1, help: 'PDF, PNG veya JPEG; dosya başına en fazla 10 MB. İsteğe bağlıdır.' },
    { id: 'additional_documents', section: 'documents', type: 'file', label: 'Sunum Ek Doküman', required: false, maxFiles: 1, help: 'PDF, PNG veya JPEG; dosya başına en fazla 10 MB. İsteğe bağlıdır.' },
    { id: 'kvkk_ack', section: 'privacy', type: 'multipleChoice', label: 'KVKK Aydınlatma Metni', options: [acknowledgement], help: privacyText },
  ].map((question, index) => ({ required: true, ...question, sourceNumber: index + 1 }));
  return {
    id: 'entrepreneur-application', title: 'Hızlandırma Programı Başvuru Formu', isMock: false,
    version: createHash('sha256').update(JSON.stringify(questions)).digest('hex').slice(0, 16),
    maxFileSize: 10 * 1024 * 1024, acceptedFileTypes: ['application/pdf', 'image/png', 'image/jpeg'],
    sections: [
      { id: 'contact', title: 'İletişim Bilgileri' }, { id: 'venture', title: 'Girişim Bilgileri' },
      { id: 'team', title: 'Ekip' }, { id: 'solution', title: 'Çözüm ve Fikri Haklar' },
      { id: 'history', title: 'Program, Pilot ve Yatırım Geçmişi' }, { id: 'documents', title: 'Dokümanlar' }, { id: 'privacy', title: 'KVKK' },
    ], questions,
  };
}

module.exports = { buildForm, acknowledgement };
