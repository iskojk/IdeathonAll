// Mounted temporarily by scripts/verify-entrepreneur-form.mjs in an isolated browser.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { authAPI, entrepreneurAPI, messagingAPI } from '@/lib/api';
import EntrepreneurApplicationForm from '@/components/EntrepreneurApplicationForm';
// This fixture is copied into pages/ by the browser runner.
import Entrepreneurs from './girisimciler/index';

export default function EntrepreneurFormTest() {
  const { user, login } = useAuth();
  const router = useRouter();
  const [result, setResult] = useState('RUNNING');
  const [screen, setScreen] = useState('form');
  useEffect(() => {
    const reportUrl = '__QA_REPORT_URL__';
    if (reportUrl.startsWith('http://127.0.0.1:') && /^(PASS|FAIL):/.test(result)) {
      fetch(reportUrl, { method: 'POST', mode: 'no-cors', body: result }).catch(() => {});
    }
  }, [result]);
  useEffect(() => {
    let cancelled = false;
    let server = { _id: 'qa-application', revision: 0, status: 'draft', answers: { venture_name: 'İlk yanıt', phone: '+905321234567' }, documents: [], updatedAt: new Date().toISOString() };
    const form = { version: 2, title: 'QA', description: '', sections: [{ id: 'contact', title: 'İletişim' }, { id: 'documents', title: 'Dokümanlar' }, { id: 'privacy', title: 'KVKK' }], questions: [
      { id: 'venture_name', section: 'contact', type: 'text', label: 'Girişim', required: true, maxLength: 150 },
      { id: 'phone', section: 'contact', type: 'text', inputType: 'tel', label: 'Telefon', required: true, maxLength: 30 },
      { id: 'company_founded', section: 'contact', type: 'text', inputType: 'date', label: 'Şirketleşme Tarihi', required: false, maxLength: 10 },
      { id: 'pitch_deck', section: 'documents', type: 'file', label: 'Sunum', required: false, maxFiles: 1 },
      { id: 'kvkk_ack', section: 'privacy', type: 'consent', label: 'KVKK Aydınlatma Metni', required: true, help: 'Test aydınlatma metni', options: ['Okudum ve bilgilendirildim.'] },
    ], agreements: [
      { id: 'privacy_policy_ack', type: 'consent', required: true, label: 'Gizlilik Politikası', url: 'https://ideathon.anahtarfikirler.com/gizlilik-politikasi' },
      { id: 'terms_ack', type: 'consent', required: true, label: 'Kullanım Şartları', url: 'https://ideathon.anahtarfikirler.com/kullanim-sartlari' },
    ] };
    const testUser = { _id: 'qa-draft-user', name: 'Test', email: 'test@example.com', role: 'user' };
    const originals = { login: authAPI.login, getMe: authAPI.getMe, get: entrepreneurAPI.getMyApplication, save: entrepreneurAPI.saveApplication, unread: messagingAPI.getUnreadCount, confirm: window.confirm };
    authAPI.login = async () => ({ success: true, data: { user: testUser, token: 'local-ui-fixture' } });
    authAPI.getMe = async () => ({ success: true, data: testUser });
    messagingAPI.getUnreadCount = async () => ({ data: { unreadCount: 0 } });
    let holdGet = false;
    let releaseGet;
    let failGet = false;
    entrepreneurAPI.getMyApplication = async () => {
      // Strict Mode can run both the cancelled and active mount requests.
      if (holdGet) await new Promise(resolve => {
        const previous = releaseGet;
        releaseGet = () => { previous?.(); resolve(); };
      });
      if (failGet) throw new Error('Test durum bağlantısı kesildi');
      return { data: { form, application: structuredClone(server) } };
    };
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
      const progress = () => document.querySelector('progress');
      const checkProgress = value => assert(progress().value === value && progress().max === 5, 'İlerleme zorunlu sorular ve üç onaya göre hesaplanmadı');
      const sectionButton = title => [...document.querySelectorAll('nav[aria-label="Başvuru bölümleri"] button')].find(button => button.textContent.includes(title));
      checkProgress(2);
      assert(sectionButton('Dokümanlar').textContent.includes('İsteğe bağlı alanlar'), 'İsteğe bağlı evrak bölümü eksik gösterildi');
      sectionButton('Dokümanlar').click();
      await wait(() => document.getElementById('answer-pitch_deck'), 'İsteğe bağlı evrak alanı gösterilmedi');
      checkProgress(2);
      sectionButton('İletişim').click();
      await wait(() => field(), 'İletişim bölümüne dönülemedi');
      const dateInput = document.getElementById('answer-company_founded');
      assert(dateInput.type === 'date', 'Şirketleşme tarihi takvim alanı değil');
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(dateInput, '2024-02-29');
      dateInput.dispatchEvent(new Event('input', { bubbles: true }));
      await pause(50);
      checkProgress(2);
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
      sectionButton('KVKK').click();
      await wait(() => document.getElementById('answer-kvkk_ack'), 'KVKK bölümü açılmadı');
      const submitButton = () => document.getElementById('answer-kvkk_ack').closest('form').querySelector('button[type="submit"]');
      assert(submitButton().disabled, 'KVKK onayı olmadan gönderim açık');
      const kvkk = document.getElementById('answer-kvkk_ack');
      const privacy = document.getElementById('answer-privacy_policy_ack');
      const terms = document.getElementById('answer-terms_ack');
      assert(!!(kvkk.compareDocumentPosition(privacy) & Node.DOCUMENT_POSITION_FOLLOWING) && !!(privacy.compareDocumentPosition(terms) & Node.DOCUMENT_POSITION_FOLLOWING), 'Onaylar KVKK altında doğru sırada değil');
      for (const agreement of form.agreements) {
        const link = document.getElementById(`question-${agreement.id}`).querySelector('button');
        const locationBefore = window.location.href;
        assert(link.textContent === agreement.label && link.getAttribute('aria-haspopup') === 'dialog', 'Metin açma düğmesi yanlış');
        link.focus();
        link.click();
        await wait(() => document.querySelector('dialog')?.open, 'Metin aynı ekranda açılmadı');
        const dialog = document.querySelector('dialog');
        assert(dialog.matches(':modal') && dialog.contains(document.activeElement), 'Okuma penceresi modal değil veya odak içeride değil');
        assert(dialog.querySelector('h2').textContent === agreement.label, 'Yanlış metin başlığı açıldı');
        assert(dialog.textContent.includes('Son güncelleme: Mart 2026') && dialog.textContent.includes('info@anahtarfikirler.com'), 'Metnin son bölümleri eksik');
        assert(dialog.textContent.includes(agreement.id === 'privacy_policy_ack' ? '2. Veri Sorumlusu' : '4. Yasaklı Kullanımlar'), 'Yanlış metin içeriği açıldı');
        assert(window.location.href === locationBefore && !document.getElementById(`answer-${agreement.id}`).checked, 'Metni okumak yönlendirdi veya otomatik onayladı');
        assert(document.body.style.overflow === 'hidden', 'Okuma sırasında arka plan kaydırması kilitlenmedi');
        privacy.focus();
        assert(dialog.contains(document.activeElement), 'Odak okuma penceresinden çıktı');
        if (agreement.id === 'privacy_policy_ack') dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
        else [...dialog.querySelectorAll('button')].find(button => button.textContent === 'Başvuruya dön').click();
        await wait(() => !document.querySelector('dialog'), 'Okuma penceresi kapanmadı');
        assert(document.activeElement === link && document.body.style.overflow !== 'hidden', 'Pencere kapanınca odak veya kaydırma geri yüklenmedi');
        assert(!document.getElementById(`answer-${agreement.id}`).checked, 'Onay otomatik işaretlenmiş');
      }
      await wait(() => !document.getElementById('answer-kvkk_ack').disabled, 'Onay alanı yüklenmedi');
      kvkk.click();
      await pause(50);
      checkProgress(3);
      assert(submitButton().disabled, 'Sadece KVKK ile gönderim açık');
      privacy.click();
      await pause(50);
      checkProgress(4);
      assert(submitButton().disabled, 'Kullanım şartları olmadan gönderim açık');
      terms.click();
      await wait(() => !submitButton().disabled, 'Üç onayla gönderim açılmadı');
      checkProgress(5);
      assert(sectionButton('KVKK').textContent.includes('3/3 zorunlu alan tamamlandı'), 'KVKK bölümünde diğer zorunlu onaylar sayılmadı');
      privacy.click();
      await pause(50);
      checkProgress(4);
      assert(submitButton().disabled, 'Gizlilik onayı kaldırıldığında gönderim açık');
      privacy.click();
      await wait(() => !submitButton().disabled, 'Yeniden onayla gönderim açılmadı');
      submitButton().click();
      await wait(() => document.querySelector('details'), 'Gönderim özeti açılmadı');
      assert(server.answers.kvkk_ack === true, 'KVKK işareti kaydedilmedi');
      assert(server.answers.company_founded === '2024-02-29', 'Seçilen tarih kayıtta korunmadı');
      assert(server.answers.privacy_policy_ack === true && server.answers.terms_ack === true, 'Gizlilik ve kullanım onayları kaydedilmedi');
      assert(server.status === 'submitted', 'Başvuru gönderilmedi');
      checkProgress(5);
      assert(!server.documents.length, 'Belgesiz başvuru testi evrak içeriyor');
      assert(!document.querySelector('details').open, 'Özet kapalı değil');
      assert(!sessionStorage.getItem('entrepreneur-draft:qa-draft-user'), 'Gönderimden sonra taslak kaldı');
      document.querySelector('summary').click();
      await wait(() => document.querySelector('details').open, 'Başvuru detayları açılmadı');
      sectionButton('İletişim').click();
      await wait(() => field(), 'Gönderilen yanıtlar görüntülenemedi');
      assert(field().disabled && field().value === server.answers.venture_name, 'Gönderilen başvuru salt okunur görüntülenmedi');
      document.querySelector('summary').click();
      assert(!document.querySelector('details').open, 'Başvuru detayları kapatılamadı');

      setResult('RUNNING: entrepreneur entry status');
      const entry = () => document.querySelector('.entrepreneur-card');
      const continueLink = () => entry()?.textContent.includes('Başvuruya Devam Et');
      const viewLink = () => entry()?.querySelector('a.entrepreneur-view-button');
      const remountEntry = async () => {
        setScreen('none');
        await wait(() => !entry() && !document.querySelector('details'), 'Önceki ekran kapatılamadı');
        setScreen('entry');
      };
      setScreen('entry');
      await wait(() => entry()?.textContent.includes('Başvurunuz iletildi'), 'Gönderilmiş başvuru bilgisi girişimci sayfasında gösterilmedi');
      assert(!continueLink(), 'Gönderilmiş başvuruda devam düğmesi kaldı');
      assert(viewLink()?.getAttribute('href') === '/girisimciler/basvuru', 'Başvuruyu görüntüle düğmesi yanlış sayfaya gidiyor');
      await login('test@example.com', 'fixture-only');
      await remountEntry();
      await wait(() => entry()?.textContent.includes('Başvurunuz iletildi'), 'Tekrar girişte gönderilmiş başvuru durumu kayboldu');

      server = { ...server, status: 'draft' };
      holdGet = true;
      releaseGet = null;
      await remountEntry();
      await wait(() => releaseGet, 'Başvuru durumu sorgulanmadı');
      assert(!continueLink() && !entry().textContent.includes('Başvurunuz iletildi'), `Durum sorgulanırken eski veya varsayılan durum gösterildi: ${entry()?.textContent}`);
      holdGet = false;
      releaseGet();
      await wait(() => continueLink(), 'Taslak başvuruda devam düğmesi gösterilmedi');
      server = null;
      await remountEntry();
      await wait(() => continueLink(), 'Başvurusu olmayan hesapta devam düğmesi gösterilmedi');
      failGet = true;
      await remountEntry();
      await wait(() => entry()?.textContent.includes('Başvuru durumunuz şu anda alınamadı'), 'Durum hatası gösterilmedi');
      assert(!continueLink() && viewLink(), 'Durum hatasında yanlış devam düğmesi gösterildi veya görüntüleme engellendi');
      setResult('PASS: form autosave/recovery, required progress/agreements, inline privacy/terms reading without navigation or auto-consent, modal focus/scroll and close recovery, document-free submission, readonly summary expand/collapse, submitted entry and re-login, draft/new entry, pending lookup and failed lookup');
    })().catch(error => { if (!cancelled) setResult(`FAIL: ${error.message}`); });
    return () => {
      cancelled = true;
      authAPI.login = originals.login; authAPI.getMe = originals.getMe;
      entrepreneurAPI.getMyApplication = originals.get; entrepreneurAPI.saveApplication = originals.save; window.confirm = originals.confirm;
      messagingAPI.getUnreadCount = originals.unread;
    };
  }, []);
  return <><pre id="qa-result">{result}</pre><Link id="qa-away" href={`${router.pathname}?away=1`}>Başka sayfa</Link>{router.query.away ? <p>Başka sayfa</p> : user?._id === 'qa-draft-user' && (screen === 'form' ? <EntrepreneurApplicationForm /> : screen === 'entry' ? <Entrepreneurs /> : null)}</>;
}
