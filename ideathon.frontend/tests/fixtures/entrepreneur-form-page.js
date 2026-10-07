// Mounted temporarily by scripts/verify-entrepreneur-form.mjs in an isolated browser.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { authAPI, entrepreneurAPI } from '@/lib/api';
import EntrepreneurApplicationForm from '@/components/EntrepreneurApplicationForm';

export default function EntrepreneurFormTest() {
  const { user, login } = useAuth();
  const router = useRouter();
  const [result, setResult] = useState('RUNNING');
  useEffect(() => {
    const reportUrl = '__QA_REPORT_URL__';
    if (reportUrl.startsWith('http://127.0.0.1:') && /^(PASS|FAIL):/.test(result)) {
      fetch(reportUrl, { method: 'POST', mode: 'no-cors', body: result }).catch(() => {});
    }
  }, [result]);
  useEffect(() => {
    let cancelled = false;
    let server = { _id: 'qa-application', revision: 0, status: 'draft', answers: { venture_name: 'İlk yanıt', phone: '+905321234567' }, documents: [], updatedAt: new Date().toISOString() };
    const form = { version: 2, title: 'QA', description: '', sections: [{ id: 'contact', title: 'İletişim' }], questions: [
      { id: 'venture_name', section: 'contact', type: 'text', label: 'Girişim', required: true, maxLength: 150 },
      { id: 'phone', section: 'contact', type: 'text', inputType: 'tel', label: 'Telefon', required: true, maxLength: 30 },
      { id: 'company_founded', section: 'contact', type: 'text', inputType: 'date', label: 'Şirketleşme Tarihi', required: false, maxLength: 10 },
      { id: 'kvkk_ack', section: 'contact', type: 'consent', label: 'KVKK Aydınlatma Metni', required: true, help: 'Test aydınlatma metni', options: ['Okudum ve bilgilendirildim.'] },
    ], agreements: [
      { id: 'privacy_policy_ack', type: 'consent', required: true, label: 'Gizlilik Politikası', url: 'https://ideathon.anahtarfikirler.com/gizlilik-politikasi' },
      { id: 'terms_ack', type: 'consent', required: true, label: 'Kullanım Şartları', url: 'https://ideathon.anahtarfikirler.com/kullanim-sartlari' },
    ] };
    const testUser = { _id: 'qa-draft-user', name: 'Test', email: 'test@example.com', role: 'user' };
    const originals = { login: authAPI.login, getMe: authAPI.getMe, get: entrepreneurAPI.getMyApplication, save: entrepreneurAPI.saveApplication, confirm: window.confirm };
    authAPI.login = async () => ({ success: true, data: { user: testUser, token: 'local-ui-fixture' } });
    authAPI.getMe = async () => ({ success: true, data: testUser });
    entrepreneurAPI.getMyApplication = async () => ({ data: { form, application: structuredClone(server) } });
    let saves = 0;
    let release;
    let holdNextSave = false;
    let offline = false;
    let confirms = 0;
    let leave = false;
    window.confirm = () => { confirms++; return leave; };
    entrepreneurAPI.saveApplication = async payload => {
      saves++;
      if (offline) throw new Error('Test bağlantı kesintisi');
      if (saves === 1 || holdNextSave) { holdNextSave = false; await new Promise(resolve => { release = resolve; }); }
      if (payload.revision !== server.revision) throw Object.assign(new Error('Sürüm çakışması'), { status: 409 });
      server = { ...server, answers: payload.answers, status: payload.submit ? 'submitted' : 'draft', submittedAt: payload.submit ? new Date().toISOString() : undefined, revision: server.revision + 1, updatedAt: new Date().toISOString() };
      return { data: { application: structuredClone(server) } };
    };
    const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
    const assert = (condition, message) => { if (!condition) throw new Error(message); };
    const wait = async (condition, message) => {
      for (let i = 0; i < 140; i++) { if (cancelled) throw new Error('Fixture unmounted'); if (condition()) return; await pause(50); }
      throw new Error(message);
    };
    const field = () => document.getElementById('answer-venture_name');
    const type = value => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(field(), value);
      field().dispatchEvent(new Event('input', { bubbles: true }));
    };
    (async () => {
      setResult('RUNNING: login');
      await login('test@example.com', 'fixture-only');
      await wait(() => field(), 'Form yüklenmedi');
      const dateInput = document.getElementById('answer-company_founded');
      assert(dateInput.type === 'date', 'Şirketleşme tarihi takvim alanı değil');
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(dateInput, '2024-02-29');
      dateInput.dispatchEvent(new Event('input', { bubbles: true }));
      setResult('RUNNING: autosave');
      type('Yanıt A');
      await pause(30);
      document.getElementById('qa-away').click();
      await pause(30);
      assert(confirms === 1 && field()?.value === 'Yanıt A', 'İptal edilen geçiş yanıtı korumadı');
      await wait(() => release, 'Otomatik kayıt başlamadı');
      assert(!field().disabled, 'Otomatik kayıt yazmayı engelliyor');
      type('Yanıt B');
      release();
      await pause(100);
      assert(field().value === 'Yanıt B', 'Geciken yanıt yeni yazılan metni sildi');
      await wait(() => server.answers.venture_name === 'Yanıt B', 'Yeni yanıt otomatik kaydedilmedi');
      await wait(() => !sessionStorage.getItem('entrepreneur-draft:qa-draft-user'), 'Kaydedilen sekme taslağı temizlenmedi');
      setResult('RUNNING: pending navigation');
      holdNextSave = true;
      release = null;
      type('Ayrılmadan önceki kayıt');
      await wait(() => release, 'Bekletilen ikinci kayıt başlamadı');
      leave = true;
      document.getElementById('qa-away').click();
      await wait(() => !field(), 'Bekleyen kayıt sırasında ayrılamadı');
      window.history.back();
      await wait(() => field(), 'Bekleyen kayıt sırasında geri dönülemedi');
      type('Geri dönünce yazılan daha yeni yanıt');
      offline = true;
      release();
      await pause(100);
      assert(JSON.parse(sessionStorage.getItem('entrepreneur-draft:qa-draft-user'))?.answers.venture_name === 'Geri dönünce yazılan daha yeni yanıt', 'Eski sayfanın yanıtı yeni sayfanın kurtarma kopyasını sildi');
      document.getElementById('qa-away').click();
      await wait(() => !field(), 'Çakışma kontrolü için ayrılamadı');
      window.history.back();
      await wait(() => [...document.querySelectorAll('button')].some(button => button.textContent === 'Güncel başvuruyla devam et'), 'Sürüm çakışması kurtarma seçenekleri gösterilmedi');
      assert(server.answers.venture_name === 'Ayrılmadan önceki kayıt', 'Çakışan taslak sunucuyu ezdi');
      [...document.querySelectorAll('button')].find(button => button.textContent === 'Güncel başvuruyla devam et').click();
      await pause(100);
      setResult('RUNNING: offline recovery');
      offline = true;
      type('Bağlantı kesilse de korunan yanıt');
      await wait(() => document.body.textContent.includes('Otomatik kayıt tamamlanamadı'), 'Kayıt hatası gösterilmedi');
      const failures = saves;
      await pause(1700);
      assert(saves === failures, 'Hatalı kayıt sürekli tekrarlanıyor');
      leave = true;
      document.getElementById('qa-away').click();
      await wait(() => !field(), 'Site içi geçiş gerçekleşmedi');
      window.history.back();
      await wait(() => field(), 'Geri tuşuyla form açılmadı');
      assert(field().value === 'Bağlantı kesilse de korunan yanıt', 'Geri dönüşte kaydedilmemiş yanıt kayboldu');
      offline = false;
      await wait(() => server.answers.venture_name === 'Bağlantı kesilse de korunan yanıt', 'Geri yüklenen yanıt kaydedilmedi');
      setResult('RUNNING: required agreements');
      const submitButton = () => document.getElementById('question-venture_name').closest('form').querySelector('button[type="submit"]');
      assert(submitButton().disabled, 'KVKK onayı olmadan gönderim açık');
      const kvkk = document.getElementById('answer-kvkk_ack');
      const privacy = document.getElementById('answer-privacy_policy_ack');
      const terms = document.getElementById('answer-terms_ack');
      assert(!!(kvkk.compareDocumentPosition(privacy) & Node.DOCUMENT_POSITION_FOLLOWING) && !!(privacy.compareDocumentPosition(terms) & Node.DOCUMENT_POSITION_FOLLOWING), 'Onaylar KVKK altında doğru sırada değil');
      for (const agreement of form.agreements) {
        const link = document.getElementById(`question-${agreement.id}`).querySelector('a');
        assert(link.href === agreement.url && link.target === '_blank', 'Resmi metin bağlantısı yanlış');
        assert(!document.getElementById(`answer-${agreement.id}`).checked, 'Onay otomatik işaretlenmiş');
      }
      await wait(() => !document.getElementById('answer-kvkk_ack').disabled, 'Onay alanı yüklenmedi');
      kvkk.click();
      await pause(50);
      assert(submitButton().disabled, 'Sadece KVKK ile gönderim açık');
      privacy.click();
      await pause(50);
      assert(submitButton().disabled, 'Kullanım şartları olmadan gönderim açık');
      terms.click();
      await wait(() => !submitButton().disabled, 'Üç onayla gönderim açılmadı');
      privacy.click();
      await pause(50);
      assert(submitButton().disabled, 'Gizlilik onayı kaldırıldığında gönderim açık');
      privacy.click();
      await wait(() => !submitButton().disabled, 'Yeniden onayla gönderim açılmadı');
      submitButton().click();
      await wait(() => document.querySelector('details'), 'Gönderim özeti açılmadı');
      assert(server.answers.kvkk_ack === true, 'KVKK işareti kaydedilmedi');
      assert(server.answers.company_founded === '2024-02-29', 'Seçilen tarih kayıtta korunmadı');
      assert(server.answers.privacy_policy_ack === true && server.answers.terms_ack === true, 'Gizlilik ve kullanım onayları kaydedilmedi');
      assert(server.status === 'submitted', 'Başvuru gönderilmedi');
      assert(!document.querySelector('details').open, 'Özet kapalı değil');
      assert(!sessionStorage.getItem('entrepreneur-draft:qa-draft-user'), 'Gönderimden sonra taslak kaldı');
      setResult('PASS: date input and saved date, navigation cancellation, autosave, pending-save typing/navigation, revision conflicts, failed-save recovery, browser back, ordered official policy links, three independently required consent checkboxes, submission');
    })().catch(error => { if (!cancelled) setResult(`FAIL: ${error.message}`); });
    return () => {
      cancelled = true;
      authAPI.login = originals.login; authAPI.getMe = originals.getMe;
      entrepreneurAPI.getMyApplication = originals.get; entrepreneurAPI.saveApplication = originals.save; window.confirm = originals.confirm;
    };
  }, []);
  return <><pre id="qa-result">{result}</pre><Link id="qa-away" href={`${router.pathname}?away=1`}>Başka sayfa</Link>{router.query.away ? <p>Başka sayfa</p> : user?._id === 'qa-draft-user' && <EntrepreneurApplicationForm />}</>;
}
