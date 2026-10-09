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
    const form = { version: 2, title: 'QA', description: '', sections: [{ id: 'contact', title: 'İletişim' }, { id: 'documents', title: 'Dokümanlar' }], questions: [
      { id: 'venture_name', section: 'contact', type: 'text', label: 'Girişim', required: true, maxLength: 150 },
      { id: 'phone', section: 'contact', type: 'text', inputType: 'tel', label: 'Telefon', required: true, maxLength: 30 },
      { id: 'company_founded', section: 'contact', type: 'text', inputType: 'date', label: 'Şirketleşme Tarihi', required: false, maxLength: 10 },
      { id: 'pitch_deck', section: 'documents', type: 'file', label: 'Sunum', required: false, maxFiles: 1 },
    ], agreements: [
      { id: 'privacy_policy_ack', type: 'consent', required: true, label: 'Gizlilik Politikası', url: 'https://ideathon.anahtarfikirler.com/gizlilik-politikasi' },
      { id: 'terms_ack', type: 'consent', required: true, label: 'Kullanım Şartları', url: 'https://ideathon.anahtarfikirler.com/kullanim-sartlari' },
    ] };
    const testUser = { _id: 'qa-draft-user', name: 'Test', email: 'test@example.com', role: 'user' };
    const originals = { login: authAPI.login, getMe: authAPI.getMe, get: entrepreneurAPI.getMyApplication, save: entrepreneurAPI.saveApplication, download: entrepreneurAPI.downloadApplication, linkClick: HTMLAnchorElement.prototype.click, revoke: URL.revokeObjectURL, unread: messagingAPI.getUnreadCount, confirm: window.confirm, replace: router.replace, push: router.push, pathname: router.pathname, asPath: router.asPath };
    const downloads = [];
    const revoked = new Set();
    let holdDownload = false;
    let failDownload = false;
    let releaseDownload;
    let cancelledDownloads = 0;
    entrepreneurAPI.downloadApplication = async signal => {
      if (holdDownload) {
        holdDownload = false;
        await new Promise((resolve, reject) => {
          releaseDownload = resolve;
          signal.addEventListener('abort', () => { cancelledDownloads++; reject(new DOMException('Aborted', 'AbortError')); }, { once: true });
        });
      }
      if (failDownload) throw new Error('Test PDF bağlantısı kesildi');
      return new Blob(['%PDF-1.4\nfixture'], { type: 'application/pdf' });
    };
    HTMLAnchorElement.prototype.click = function () {
      if (this.download === 'girisimci-basvurum.pdf') downloads.push({ name: this.download, href: this.href });
      else originals.linkClick.call(this);
    };
    URL.revokeObjectURL = url => { revoked.add(url); originals.revoke.call(URL, url); };
    authAPI.login = async () => ({ success: true, data: { user: testUser, token: 'local-ui-fixture' } });
    authAPI.getMe = async () => ({ success: true, data: testUser });
    messagingAPI.getUnreadCount = async () => ({ data: { unreadCount: 0 } });
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
      const summaryToggle = () => document.querySelector('button[aria-controls^="entrepreneur-details-"]');
      const summaryOpen = () => summaryToggle()?.getAttribute('aria-expanded') === 'true';
      const pdfButton = () => document.querySelector('button[aria-label="Başvuru PDF önizle"]');
      assert(!pdfButton(), 'Taslakta PDF indirme düğmesi gösterildi');
      const progress = () => document.querySelector('progress');
      const checkProgress = value => assert(progress().value === value && progress().max === 4, 'İlerleme zorunlu sorular ve iki onaya göre hesaplanmadı');
      const sectionButton = title => [...document.querySelectorAll('nav[aria-label="Başvuru bölümleri"] button')].find(button => button.textContent.includes(title));
      checkProgress(2);
      assert(sectionButton('Dokümanlar').textContent.includes('0/2'), 'Son bölümdeki iki onay sayılmadı');
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
      sectionButton('Dokümanlar').click();
      await wait(() => document.getElementById('answer-privacy_policy_ack'), 'Onay alanları açılmadı');
      const submitButton = () => document.getElementById('answer-privacy_policy_ack').closest('form').querySelector('button[type="submit"]');
      assert(submitButton().disabled, 'Onaylar olmadan gönderim açık');
      assert(!document.getElementById('answer-kvkk_ack'), 'Kaldırılan KVKK alanı gösteriliyor');
      const privacy = document.getElementById('answer-privacy_policy_ack');
      const terms = document.getElementById('answer-terms_ack');
      assert(!!(privacy.compareDocumentPosition(terms) & Node.DOCUMENT_POSITION_FOLLOWING), 'İki onay doğru sırada değil');
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
        await wait(() => document.activeElement === link && document.body.style.overflow !== 'hidden', 'Pencere kapanınca odak veya kaydırma geri yüklenmedi');
        assert(!document.getElementById(`answer-${agreement.id}`).checked, 'Onay otomatik işaretlenmiş');
      }
      await wait(() => !privacy.disabled, 'Onay alanı yüklenmedi');
      privacy.click();
      await pause(50);
      checkProgress(3);
      assert(submitButton().disabled, 'Kullanım şartları olmadan gönderim açık');
      terms.click();
      await wait(() => !submitButton().disabled, 'İki onayla gönderim açılmadı');
      checkProgress(4);
      assert(sectionButton('Dokümanlar').textContent.includes('2/2 zorunlu alan tamamlandı'), 'Son bölümde iki onay sayılmadı');
      privacy.click();
      await pause(50);
      checkProgress(3);
      assert(submitButton().disabled, 'Gizlilik onayı kaldırıldığında gönderim açık');
      privacy.click();
      await wait(() => !submitButton().disabled, 'Yeniden onayla gönderim açılmadı');
      submitButton().click();
      await wait(() => summaryToggle(), 'Gönderim özeti açılmadı');
      assert(server.answers.kvkk_ack === undefined, 'Kaldırılan KVKK için onay üretildi');
      assert(server.answers.company_founded === '2024-02-29', 'Seçilen tarih kayıtta korunmadı');
      assert(server.answers.privacy_policy_ack === true && server.answers.terms_ack === true, 'Gizlilik ve kullanım onayları kaydedilmedi');
      assert(server.status === 'submitted', 'Başvuru gönderilmedi');
      assert(!server.documents.length, 'Belgesiz başvuru testi evrak içeriyor');
      assert(!summaryOpen(), 'Özet kapalı değil');
      assert(!sessionStorage.getItem('entrepreneur-draft:qa-draft-user'), 'Gönderimden sonra taslak kaldı');
      assert(pdfButton(), 'Kapalı başvuru özetinde PDF düğmesi yok');
      const pdfDialog = () => document.querySelector('dialog');
      const pdfLink = () => pdfDialog()?.querySelector('a[download="girisimci-basvurum.pdf"]');
      const closePdf = async () => {
        [...pdfDialog().querySelectorAll('button')].find(button => button.textContent === 'Kapat').click();
        await wait(() => !pdfDialog(), 'PDF önizlemesi kapanmadı');
      };
      holdDownload = true; pdfButton().focus(); pdfButton().click();
      await wait(() => releaseDownload && pdfDialog()?.open, 'PDF önizleme penceresi açılmadı');
      assert(pdfDialog().textContent.includes('PDF hazırlanıyor') && !pdfLink(), 'PDF yüklenirken indirme açık');
      assert(downloads.length === 0 && pdfDialog().matches(':modal'), 'Önizlemeden önce dosya indirildi veya pencere modal değil');
      releaseDownload();
      await wait(() => pdfLink() && pdfDialog().querySelector('iframe'), 'PDF önizleme içeriği açılmadı');
      assert(downloads.length === 0, 'Önizleme dosyayı otomatik indirdi');
      pdfLink().click();
      assert(downloads.length === 1 && downloads[0].href.startsWith('blob:') && !summaryOpen(), 'İndir düğmesi doğru dosyayı indirmedi');
      await closePdf();
      assert(revoked.has(downloads[0].href) && document.activeElement === pdfButton(), 'PDF adresi temizlenmedi veya odak düğmeye dönmedi');
      failDownload = true; pdfButton().click();
      await wait(() => pdfDialog()?.textContent.includes('Test PDF bağlantısı kesildi'), 'PDF hata mesajı gösterilmedi');
      assert(!pdfLink(), 'Hatalı PDF için indirme açık');
      failDownload = false;
      [...pdfDialog().querySelectorAll('button')].find(button => button.textContent === 'Tekrar Dene').click();
      await wait(() => pdfLink(), 'PDF tekrar denemesi çalışmadı');
      assert(!pdfDialog().textContent.includes('Test PDF bağlantısı kesildi'), 'Eski PDF hatası kaldı');
      pdfLink().click();
      await closePdf();
      summaryToggle().click();
      await wait(() => summaryOpen(), 'Başvuru detayları açılmadı');
      const details = document.getElementById(summaryToggle().getAttribute('aria-controls'));
      assert(details.textContent.includes(server.answers.venture_name) && !details.querySelector('input'), 'Gönderilen başvuru salt okunur görüntülenmedi');
      summaryToggle().click();
      assert(!summaryOpen(), 'Başvuru detayları kapatılamadı');

      setResult('RUNNING: entrepreneur navigation');
      holdDownload = true; releaseDownload = null; pdfButton().click();
      await wait(() => releaseDownload && pdfDialog()?.open, 'İptal testi için PDF isteği başlamadı');
      const redirects = [];
      router.replace = async target => { redirects.push(target); return true; };
      for (const next of [server, { ...server, status: 'draft' }, null]) {
        server = next;
        setScreen('none');
        await wait(() => !document.querySelector('.entrepreneur-section') && !summaryToggle(), 'Önceki ekran kapatılamadı');
        const count = redirects.length;
        setScreen('entry');
        await wait(() => redirects.length > count, 'Oturum açıkken başvuruya yönlenmedi');
        assert(redirects.at(-1) === '/girisimciler/basvuru', 'Başvuru yönlendirmesi yanlış');
        assert(!document.body.textContent.includes('ilk adımı attınız') && !document.body.textContent.includes('Başvuru dosyanız'), 'Kaldırılan karşılama ekranı hâlâ gösteriliyor');
      }
      assert(cancelledDownloads === 1, 'Ayrılırken bekleyen PDF isteği iptal edilmedi');
      let pushes = 0;
      router.push = async () => { pushes++; return true; };
      router.pathname = '/girisimciler/basvuru'; router.asPath = '/girisimciler/basvuru?test=preserve';
      setScreen('none');
      await wait(() => !document.querySelector('.entrepreneur-section'), 'Menü kontrolü için ekran kapanmadı');
      setScreen('entry');
      const menu = () => [...document.querySelectorAll('a.nav-link')].find(link => link.textContent.trim() === 'Girişimciler');
      await wait(() => menu(), 'Girişimciler menüsü açılmadı');
      const beforeUrl = window.location.href;
      assert(menu().getAttribute('href') === router.asPath, 'Açık sayfanın sorgusu korunmadı');
      menu().click(); await pause(50);
      assert(pushes === 0 && window.location.href === beforeUrl, 'Üst menü mevcut sayfayı yeniden açtı');
      setResult('PASS: form autosave/recovery, exactly two required agreements, inline reading, document-free submission, readonly summary, PDF preview/error/retry/cleanup, signed-in entry redirects and current-page menu preservation');
    })().catch(error => { if (!cancelled) setResult(`FAIL: ${error.message}`); });
    return () => {
      cancelled = true;
      authAPI.login = originals.login; authAPI.getMe = originals.getMe;
      entrepreneurAPI.getMyApplication = originals.get; entrepreneurAPI.saveApplication = originals.save; window.confirm = originals.confirm;
      entrepreneurAPI.downloadApplication = originals.download; HTMLAnchorElement.prototype.click = originals.linkClick; URL.revokeObjectURL = originals.revoke;
      messagingAPI.getUnreadCount = originals.unread;
      router.replace = originals.replace; router.push = originals.push; router.pathname = originals.pathname; router.asPath = originals.asPath;
    };
  }, []);
  return <><pre id="qa-result">{result}</pre><Link id="qa-away" href={`${router.pathname}?away=1`}>Başka sayfa</Link>{router.query.away ? <p>Başka sayfa</p> : user?._id === 'qa-draft-user' && (screen === 'form' ? <EntrepreneurApplicationForm /> : screen === 'entry' ? <Entrepreneurs /> : null)}</>;
}
