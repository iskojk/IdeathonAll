// Official pages checked on 2026-10-07; both display "Son güncelleme: Mart 2026".
// These are the two mandatory acknowledgements at the end of the application.
module.exports = [
  {
    id: 'privacy_policy_ack', type: 'consent', required: true,
    label: 'Gizlilik Politikası',
    url: 'https://ideathon.anahtarfikirler.com/gizlilik-politikasi',
    version: '2026-03',
    acknowledgement: 'Gizlilik Politikası metnini okudum ve kabul ediyorum.',
  },
  {
    id: 'terms_ack', type: 'consent', required: true,
    label: 'Kullanım Şartları',
    url: 'https://ideathon.anahtarfikirler.com/kullanim-sartlari',
    version: '2026-03',
    acknowledgement: 'Kullanım Şartları metnini okudum ve kabul ediyorum.',
  },
];
