// Temporary Pages Router fixture: real editor, isolated Redux/theme, in-memory API.
import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import EntrepreneurFormEditor from '@/app/components/entrepreneurs/EntrepreneurFormEditor';
import { entrepreneurAdminAPI } from '@/utils/api/entrepreneurs';

const store = configureStore({ reducer: { customizer: (state = { isCardShadow: true }) => state } });
const theme = createTheme();
const copy = value => structuredClone(value);

export default function DraftLibraryTest() {
  const [ready, setReady] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [result, setResult] = useState('RUNNING');
  useEffect(() => {
    const reportUrl = '__QA_REPORT_URL__';
    if (reportUrl.startsWith('http://127.0.0.1:') && /^(PASS|FAIL):/.test(result)) fetch(reportUrl, { method: 'POST', mode: 'no-cors', body: result }).catch(() => {});
  }, [result]);
  useEffect(() => {
    let cancelled = false;
    const form = { id: 'entrepreneur-application', title: 'İlk form', description: '', privacy: { draft: false }, sections: [{ id: 'contact', title: 'İletişim' }, { id: 'privacy', title: 'KVKK' }], questions: [
      { id: 'name', section: 'contact', label: 'Ad', type: 'text', required: true, maxLength: 100 },
      { id: 'kvkk_ack', section: 'privacy', label: 'KVKK', type: 'consent', required: true, help: 'Test aydınlatma metni.' },
    ] };
    const drafts = [
      { _id: 'a', name: 'Birinci taslak', form: copy(form), revision: 0, createdAt: '2026-10-07T09:00:00Z', updatedAt: '2026-10-07T10:00:00Z' },
      { _id: 'b', name: 'İkinci taslak', form: { ...copy(form), title: 'İkinci form' }, revision: 0, createdAt: '2026-10-06T09:00:00Z', updatedAt: '2026-10-06T10:00:00Z' },
    ];
    const versions = new Map();
    let settings = { active: copy(form), draft: copy(form), revision: 10 };
    const originals = { ...entrepreneurAdminAPI };
    const oldConfirm = window.confirm;
    let confirmLeave = false;
    let confirms = 0;
    let saveConflict = false;
    let stage = 'taslak akışı';
    const conflict = () => { throw { response: { data: { message: 'Taslak başka bir oturumda değişti.' }, status: 409 } }; };
    window.confirm = () => { confirms++; return confirmLeave; };
    entrepreneurAdminAPI.form = async () => copy(settings);
    entrepreneurAdminAPI.formDrafts = async () => ({ items: copy([...drafts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(({ form: draftForm, ...draft }) => ({ ...draft, title: draftForm.title, questionCount: draftForm.questions.length }))), pagination: { page: 1, pages: 1, total: drafts.length } });
    entrepreneurAdminAPI.formDraft = async id => copy(drafts.find(draft => draft._id === id));
    entrepreneurAdminAPI.createFormDraft = async (name, draftForm) => {
      const draft = { _id: String.fromCharCode(97 + drafts.length), name, form: copy(draftForm), revision: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      drafts.push(draft); return copy(draft);
    };
    entrepreneurAdminAPI.saveFormDraft = async (id, name, draftForm, revision) => {
      const draft = drafts.find(item => item._id === id);
      if (saveConflict || draft.revision !== revision) conflict();
      versions.set(`${id}:${revision}`, copy(draft));
      Object.assign(draft, { name, form: copy(draftForm), revision: revision + 1, updatedAt: new Date().toISOString() }); return copy(draft);
    };
    entrepreneurAdminAPI.formDraftVersions = async id => {
      const current = drafts.find(d => d._id === id);
      const items = [current, ...[...versions.values()].filter(d => d._id === id).sort((a, b) => b.revision - a.revision)].map(d => ({ revision: d.revision, name: d.name, savedAt: d.updatedAt, questionCount: d.form.questions.filter(q => q.type !== 'consent').length, isCurrent: d.revision === current.revision }));
      return { items, pagination: { page: 1, pages: 1, total: items.length } };
    };
    entrepreneurAdminAPI.formDraftVersion = async (id, revision) => {
      const draft = drafts.find(d => d._id === id);
      return { draft: copy(draft), version: copy(revision === draft.revision ? draft : versions.get(`${id}:${revision}`)) };
    };
    entrepreneurAdminAPI.publishFormDraft = async (id, revision, settingsRevision) => {
      const draft = drafts.find(item => item._id === id);
      if (draft.revision !== revision || settingsRevision !== settings.revision) conflict();
      settings = { ...settings, active: copy(draft.form), revision: settings.revision + 1 };
      return { settings: copy(settings), draft: copy(draft) };
    };
    const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
    const assert = (condition, message) => { if (!condition) throw new Error(message); };
    const wait = async (condition, message) => {
      for (let i = 0; i < 140; i++) { if (cancelled) return; if (condition()) return; await pause(50); }
      throw new Error(message);
    };
    const button = label => [...document.querySelectorAll('button')].find(node => !node.closest('.MuiCollapse-hidden') && (node.textContent.trim() === label || (node.hasAttribute('aria-pressed') && node.textContent.startsWith(label))));
    const input = label => {
      const node = [...document.querySelectorAll('label')].find(node => node.textContent.trim() === label && !node.closest('.MuiCollapse-hidden'));
      return node && document.getElementById(node.htmlFor);
    };
    const headingField = label => ({ 'Taslak adı': 'name', 'Form başlığı': 'title' })[label];
    const fieldValue = label => input(label)?.value ?? document.querySelector(`[data-form-heading="${headingField(label)}"]`)?.dataset.value;
    const type = async (label, value) => {
      if (headingField(label) && !input(label)) {
        const action = label === 'Taslak adı' ? 'Taslak adını düzenle' : 'Form başlığını düzenle';
        document.querySelector(`button[aria-label="${action}"]`)?.click();
      }
      await wait(() => input(label), `Alan açılmadı: ${label}`);
      const node = input(label); assert(!!node, `Alan bulunamadı: ${label}`);
      Object.getOwnPropertyDescriptor(node.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value').set.call(node, value);
      node.dispatchEvent(new Event('input', { bubbles: true })); await pause(50);
    };
    const select = async (label, value) => {
      await wait(() => input(label), `Seçim açılmadı: ${label}`);
      const node = input(label); assert(node?.tagName === 'SELECT', `Seçim alanı bulunamadı: ${label}`);
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(node, value);
      node.dispatchEvent(new Event('change', { bubbles: true })); await pause(50);
    };
    const checkHeadings = async () => {
      await wait(() => document.querySelector('[data-form-heading="name"]'), 'Üst kart başlıkları açılmadı');
      assert(!button('Form bilgileri') && !input('Form açıklaması'), 'Eski form bilgileri alanı hâlâ görünüyor');
    };
    const saveCurrent = async () => {
      button('Formu Kaydet').click();
      await wait(() => button('Kaydet'), 'Kayıt seçimi açılmadı');
      button('Kaydet').click();
    };
    const open = name => document.querySelector(`button[aria-label="${name} taslağını düzenle"]`);
    setReady(true);
    (async () => {
      await wait(() => button('Taslaklarım'), 'Taslak seçim ekranı açılmadı');
      assert(!button('Form bilgileri') && !button('Formu Kaydet'), 'Sayfa açılınca taslak otomatik yüklendi');
      button('Taslaklarım').click();
      await wait(() => open('Birinci taslak'), 'Taslak listesi açılmadı');
      open('Birinci taslak').click();
      await wait(() => !document.querySelector('[role=dialog]'), 'Taslak seçimi kapanmadı');
      await checkHeadings();
      await wait(() => fieldValue('Taslak adı') === 'Birinci taslak', 'Seçilen taslak açılmadı');
      button('Taslaklarım').click();
      await wait(() => open('İkinci taslak'), 'Taslaklar listelenmedi');
      open('İkinci taslak').click();
      await wait(() => fieldValue('Form başlığı') === 'İkinci form' && !document.querySelector('[role="dialog"]'), 'Geçmiş taslak yüklenmedi');
      await type('Form başlığı', 'Kopyaya ait form');
      button('Formu Kaydet').click();
      await wait(() => document.querySelector('input[value=copy]'), 'Kayıt seçenekleri açılmadı');
      document.querySelector('input[value=copy]').click();
      await wait(() => input('Yeni taslak adı'), 'Yeni taslak penceresi açılmadı');
      await type('Yeni taslak adı', 'Üçüncü taslak');
      button('Kaydet').click();
      await wait(() => fieldValue('Taslak adı') === 'Üçüncü taslak' && !document.querySelector('[role="dialog"]'), 'Yeni taslak seçilmedi');
      assert(drafts.length === 3 && drafts[1].form.title === 'İkinci form', 'Kopyalama eski taslağı değiştirdi');
      assert(settings.active.title === 'İlk form', 'Taslak kaydı yayımdaki formu değiştirdi');
      await type('Taslak adı', 'Üçüncü taslak güncel');
      await type('Form başlığı', 'Kaydedilecek başlık');
      await saveCurrent();
      await wait(() => drafts[2].form.title === 'Kaydedilecek başlık' && !button('Formu Kaydet').disabled, 'Seçili taslak kaydedilmedi');
      await type('Form başlığı', 'Kaydedilmemiş başlık');
      button('Taslaklarım').click();
      await wait(() => open('Birinci taslak'), 'Taslak listesi tekrar açılmadı');
      open('Birinci taslak').click(); await pause(50);
      assert(confirms === 1 && fieldValue('Form başlığı') === 'Kaydedilmemiş başlık', 'İptal edilen geçiş yanıtı korumadı');
      confirmLeave = true; open('Birinci taslak').click();
      await wait(() => fieldValue('Form başlığı') === 'İlk form' && !document.querySelector('[role="dialog"]'), 'Seçilen eski taslak yüklenmedi');
      setEpoch(value => value + 1);
      await pause(100);
      await wait(() => button('Taslaklarım') && !button('Formu Kaydet'), 'Yeniden açılış boş başlamadı');
      button('Taslaklarım').click();
      await wait(() => open('Üçüncü taslak güncel'), 'Kayıtlı taslak listelenmedi');
      open('Üçüncü taslak güncel').click();
      await wait(() => !document.querySelector('[role=dialog]'), 'Taslak seçimi kapanmadı');
      await checkHeadings();
      await wait(() => fieldValue('Taslak adı') === 'Üçüncü taslak güncel', 'Seçilen kayıtlı taslak yüklenmedi');
      assert(fieldValue('Form başlığı') === 'Kaydedilecek başlık', 'Kaydedilmemiş değişiklik taslağı ezdi');
      saveConflict = true; await type('Form başlığı', 'Çakışma sırasında korunan başlık');
      await saveCurrent();
      await wait(() => document.body.textContent.includes('Taslak başka bir oturumda değişti.'), 'Çakışma gösterilmedi');
      assert(fieldValue('Form başlığı') === 'Çakışma sırasında korunan başlık' && drafts[2].form.title === 'Kaydedilecek başlık', 'Çakışma yanıtı sildi veya kayıt ezildi');
      button('Vazgeç').click(); await wait(() => !document.querySelector('[role=dialog]'), 'Çakışma penceresi kapanmadı');
      saveConflict = false;
      stage = 'yeni bölüm';
      // Exercise the real, simplified builder without changing any stored application.
      button('Bölüm ekle').click();
      await wait(() => input('Bölüm adı'), 'Bölüm ekleme penceresi açılmadı');
      await type('Bölüm adı', 'Ürün'); await type('Bölüm açıklaması', 'Ürününüzü tanıyalım.');
      button('Bölümü oluştur').click();
      await wait(() => !document.querySelector('[role="dialog"]') && button('Soru ekle'), 'Yeni bölüm açılmadı');
      button('Soru ekle').click();
      await wait(() => input('Cevap formatı'), 'Yeni soru düzenleyicisi açılmadı');
      await type('Soru metni', 'Uyarlanabilir alan');
      input('Soru metni').closest('.MuiAccordion-root').querySelector('input[type="checkbox"]').click(); await pause(50);
      for (const format of ['email', 'tel', 'url', 'number', 'date', 'textarea', 'multipleChoice', 'file', 'text']) {
        await select('Cevap formatı', format);
        button('Önizle').click();
        await wait(() => document.querySelector('[role="dialog"]'), 'Önizleme açılmadı');
        const dialog = document.querySelector('[role="dialog"]');
        if (['email', 'tel', 'url', 'number', 'date'].includes(format)) assert(dialog.querySelector(`input[type="${format}"]`), `${format} önizleme biçimi yanlış`);
        if (format === 'textarea') assert(dialog.querySelector('textarea'), 'Uzun metin önizlemesi yok');
        if (format === 'file') assert(dialog.textContent.includes('En fazla 1 dosya'), 'Dosya sınırı önizlemede yok');
        if (format === 'multipleChoice') assert(dialog.textContent.includes('Evet') && dialog.textContent.includes('Hayır'), 'Seçenek önizlemesi yok');
        [...dialog.querySelectorAll('button')].find(node => node.textContent === 'Kapat').click();
        await wait(() => !document.querySelector('[role="dialog"]'), 'Önizleme kapanmadı');
      }
      await select('Cevap formatı', 'singleChoice');
      await type('Seçenekler', 'Aynı\nAynı');
      const previousRevision = drafts[2].revision;
      button('Formu Kaydet').click();
      await wait(() => document.body.textContent.includes('Aynı seçeneği birden fazla kez eklemeyin.'), 'Seçenek doğrulaması yok');
      assert(drafts[2].revision === previousRevision, 'Hatalı seçenekler sunucuya kaydedildi');
      await type('Seçenekler', '  Ürün  \nHizmet\n');
      await saveCurrent();
      await wait(() => drafts[2].revision > previousRevision && !button('Formu Kaydet').disabled && !button('Bölümü düzenle')?.matches(':disabled'), 'Yeni alan kaydedilmedi');
      const custom = drafts[2].form.questions.find(q => q.label === 'Uyarlanabilir alan');
      assert(custom.type === 'singleChoice' && !Object.hasOwn(custom, 'inputType') && !Object.hasOwn(custom, 'maxFiles'), 'Biçim değişiminde eski ayarlar kaldı');
      assert(custom.required === true, 'Zorunluluk ayarı kayboldu');
      assert(custom.options.join(',') === 'Ürün,Hizmet', 'Seçenekler temizlenmedi');
      assert(drafts[2].form.sections.at(-1).id === 'privacy', 'KVKK bölümü sonda kalmadı');
      stage = 'bölüm adını değiştirme';
      button('Ürün').click();
      await wait(() => document.querySelector('button[aria-pressed="true"]')?.textContent.startsWith('Ürün'), 'Ürün bölümü seçilmedi');
      await wait(() => !button('Bölümü düzenle')?.matches(':disabled'), 'Bölüm düzenleme düğmesi kilitli kaldı');
      button('Bölümü düzenle').click();
      await wait(() => document.querySelector('[role="dialog"]')?.textContent.includes('Bölümü düzenle'), 'Düzenleme penceresi açılmadı');
      await type('Bölüm adı', 'Ürün ve Çözüm');
      button('Değişiklikleri uygula').click();
      await wait(() => button('Ürün ve Çözüm'), 'Bölüm adı güncellenmedi');
      stage = 'bölüm sürükleme';
      const sectionRows = () => [...document.querySelectorAll('[data-section-id]')];
      const sectionTitles = () => sectionRows().map(row => row.querySelector('button[aria-pressed]').textContent.replace(/\d+$/, ''));
      const handle = title => document.querySelector(`button[aria-label="${title} bölümünü sırala"]`);
      const keyboard = async key => {
        document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key, code: key === ' ' ? 'Space' : key, bubbles: true }));
        await pause(80);
      };
      button('İletişim').click(); await pause(50);
      handle('Ürün ve Çözüm').focus(); await keyboard(' '); await keyboard('ArrowUp'); await keyboard('Escape');
      assert(sectionTitles().join('|') === 'İletişim|Ürün ve Çözüm', 'İptal edilen taşıma sırayı değiştirdi');
      assert(document.querySelector('h2')?.textContent === 'İletişim', 'İptal edilen taşıma sağdaki bölümü değiştirdi');
      const dragHandle = handle('Ürün ve Çözüm');
      const from = dragHandle.getBoundingClientRect();
      const target = sectionRows()[0].getBoundingClientRect();
      const x = from.left + from.width / 2;
      const y = from.top + from.height / 2;
      dragHandle.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0, buttons: 1, clientX: x, clientY: y }));
      document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, buttons: 1, clientX: x, clientY: y - 8 })); await pause(80);
      document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, buttons: 1, clientX: x, clientY: target.top + target.height / 2 })); await pause(80);
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0, clientX: x, clientY: target.top + target.height / 2 }));
      await wait(() => sectionTitles()[0] === 'Ürün ve Çözüm', 'Fareyle sürükleme sıralamadı');
      assert(document.querySelector('h2')?.textContent === 'Ürün ve Çözüm' && document.querySelector('button[aria-label="Uyarlanabilir alan sorusunu düzenle"]'), 'Taşınan bölümün soruları sağda açılmadı');
      handle('Ürün ve Çözüm').focus(); await keyboard(' '); await keyboard('ArrowDown'); await keyboard(' ');
      await wait(() => sectionTitles()[0] === 'İletişim', 'Klavyeyle aşağı taşıma çalışmadı');
      handle('Ürün ve Çözüm').focus(); await keyboard(' '); await keyboard('ArrowUp'); await keyboard(' ');
      await wait(() => sectionTitles()[0] === 'Ürün ve Çözüm', 'Klavyeyle yukarı taşıma çalışmadı');
      button('Önizle').click(); await wait(() => document.querySelector('[role="dialog"]'), 'Sıralı önizleme açılmadı');
      const orderedPreview = document.querySelector('[role="dialog"]');
      assert(orderedPreview.textContent.indexOf('Ürün ve Çözüm') < orderedPreview.textContent.indexOf('İletişim'), 'Önizleme bölüm sırasına uymadı');
      [...orderedPreview.querySelectorAll('button')].find(node => node.textContent === 'Kapat').click();
      await wait(() => !document.querySelector('[role="dialog"]'), 'Sıralı önizleme kapanmadı');
      const reorderRevision = drafts[2].revision;
      await saveCurrent();
      await wait(() => drafts[2].revision > reorderRevision && !button('Bölümü düzenle')?.matches(':disabled'), 'Bölüm sırası kaydedilmedi');
      assert(drafts[2].form.sections[0].title === 'Ürün ve Çözüm' && drafts[2].form.sections.at(-1).id === 'privacy', 'Sıralama kayboldu veya KVKK taşındı');
      assert(drafts[2].form.questions[0].label === 'Uyarlanabilir alan', 'Bölüm içeriği sıralanmadı');
      setEpoch(value => value + 1);
      await pause(100);
      await wait(() => button('Taslaklarım') && !button('Formu Kaydet'), 'Sıralama kontrolünde yeniden açılış boş başlamadı');
      button('Taslaklarım').click();
      await wait(() => open('Üçüncü taslak güncel'), 'Sıralanmış taslak listelenmedi');
      open('Üçüncü taslak güncel').click();
      await wait(() => !document.querySelector('[role=dialog]'), 'Taslak seçimi kapanmadı');
      await checkHeadings();
      await wait(() => sectionTitles()[0] === 'Ürün ve Çözüm' && document.querySelector('h2')?.textContent === 'Ürün ve Çözüm' && !button('Soru ekle')?.matches(':disabled'), 'Yeniden açılışta bölüm sırası ve içerik korunmadı');
      button('Soru ekle').click(); await wait(() => input('Soru metni')?.value === 'Yeni soru', 'İkinci soru açılmadı');
      await type('Soru metni', 'Ekip sayısı'); await select('Cevap formatı', 'number');
      input('Karakter sınırı').closest('details').open = true;
      await type('Karakter sınırı', '30'); await type('Örnek yanıt / yer tutucu', 'Örn: 12');
      button('Yukarı').click();
      document.querySelector('button[aria-label="Uyarlanabilir alan sorusunu düzenle"]').click();
      await wait(() => input('Cevap formatı')?.value === 'singleChoice', 'İlk soru açılamadı');
      await select('Sorunun bulunduğu bölüm', 'contact');
      await wait(() => document.querySelector('button[aria-pressed="true"]')?.textContent.startsWith('İletişim'), 'Soru bölümü taşınmadı');
      button('Soruyu sil').click(); await wait(() => button('Sil'), 'Silme onayı açılmadı');
      button('Sil').click(); await wait(() => !document.querySelector('[role="dialog"]'), 'Soru silme tamamlanmadı');
      stage = 'boş bölüm';
      button('Bölüm ekle').click(); await type('Bölüm adı', 'Boş bölüm'); button('Bölümü oluştur').click();
      await wait(() => button('Boş bölümü sil') && !button('Boş bölümü sil').disabled, 'Boş bölüm silinemiyor');
      button('Boş bölümü sil').click(); await wait(() => button('Bölümü sil'), 'Bölüm silme onayı yok');
      button('Bölümü sil').click(); await wait(() => !document.querySelector('[role="dialog"]'), 'Boş bölüm silinmedi');
      const activeBeforeConfirmation = JSON.stringify(settings.active);
      button('Yayımla').click();
      await wait(() => button('Kaydet'), 'Yayım öncesi kayıt seçimi açılmadı'); button('Kaydet').click();
      await wait(() => document.querySelector('[role="dialog"]')?.textContent.includes('Bu işlemi onaylarsanız mevcut soru seti girişimcilerle yayımlanacak.'), 'Yayımlama son onayı açılmadı');
      assert(JSON.stringify(settings.active) === activeBeforeConfirmation, 'Onay verilmeden soru seti yayımlandı');
      button('Vazgeç').click();
      await wait(() => !document.querySelector('[role="dialog"]'), 'Yayımlama onayı kapanmadı');
      assert(JSON.stringify(settings.active) === activeBeforeConfirmation, 'Vazgeçince soru seti değişti');
      button('Yayımla').click();
      await wait(() => button('Onayla ve Yayımla'), 'Yayımlama onayı yeniden açılmadı');
      button('Onayla ve Yayımla').click();
      await wait(() => settings.active.title === 'Çakışma sırasında korunan başlık', 'Seçili taslak yayımlanmadı');
      assert(settings.active.sections[0].title === 'Ürün ve Çözüm', 'Bölüm sırası kayboldu');
      assert(settings.active.questions.find(q => q.label === 'Ekip sayısı')?.inputType === 'number', 'Sayı formatı yayıma ulaşmadı');
      assert(settings.active.questions.find(q => q.label === 'Ekip sayısı')?.maxLength === 30, 'Karakter sınırı kayboldu');
      assert(!settings.active.questions.some(q => q.label === 'Uyarlanabilir alan'), 'Silinen soru yayıma ulaştı');
      assert(!settings.active.sections.some(s => s.title === 'Boş bölüm'), 'Silinen bölüm yayıma ulaştı');
      assert(drafts[0].form.title === 'İlk form' && drafts[1].form.title === 'İkinci form', 'Diğer taslaklar değişti');
      await wait(() => !document.querySelector('[role="dialog"]'), 'Yayım penceresi kapanmadı');
      button('Yeni Taslak').click(); await wait(() => fieldValue('Taslak adı') === '', 'Boş taslak başlamadı');
      assert(!document.querySelector('[data-question-id]'), 'Yeni taslak eski soruları içeriyor');
      await type('Taslak adı', 'Sıfırdan test'); await type('Form başlığı', 'Boş formdan kurulan');
      button('Bölüm ekle').click(); await type('Bölüm adı', 'Yeni bölüm'); button('Bölümü oluştur').click();
      await wait(() => !document.querySelector('[role="dialog"]') && button('Soru ekle'), 'Yeni bölüm açılamadı');
      button('Soru ekle').click(); await type('Soru metni', 'Yeni ilk soru');
      await saveCurrent(); await wait(() => drafts.length === 4 && !document.querySelector('[role="dialog"]'), 'Sıfırdan taslak kaydedilmedi');
      assert(drafts[3].revision === 0 && drafts[3].form.questions.filter(q => q.type !== 'consent').length === 1, 'Yeni taslak içeriği yanlış');
      button('Soru ekle').click(); await type('Soru metni', 'Yeni ikinci soru');
      await saveCurrent(); await wait(() => drafts[3].revision === 1 && !document.querySelector('[role="dialog"]'), 'Yeni sürüm saklanmadı');
      button('Sürüm Geçmişi').click(); await wait(() => document.querySelector('[role="dialog"]')?.textContent.includes('Sürüm 1'), 'Sürüm geçmişi yok');
      const versionButtons = [...document.querySelectorAll('[role="dialog"] button')].filter(node => node.textContent === 'Düzenlemeye al');
      versionButtons.at(-1).click(); await wait(() => !document.querySelector('[role="dialog"]') && document.querySelectorAll('[data-question-id]').length === 1, 'Eski sürüm düzenlemeye alınmadı');
      await saveCurrent(); await wait(() => drafts[3].revision === 2 && !document.querySelector('[role="dialog"]'), 'Eski sürüm yeni kayıt olarak saklanmadı');
      assert(versions.get('d:1').form.questions.filter(q => q.type !== 'consent').length === 2, 'Eski sürümü açma yeni içeriği kaybettirdi');
      setResult('PASS: draft library, opening old drafts, named copy, independent save, rename, unsaved-change cancellation, reload, conflict recovery, selected-draft publication, dynamic sections/questions, all answer formats, preview, validation, pointer/keyboard section sorting, cancelled drag, synchronized content, saved order after reopening, ordering and deletion');
    })().catch(error => { if (!cancelled) setResult(`FAIL: ${stage}: ${error.message}\n${error.stack}`); });
    return () => { cancelled = true; Object.assign(entrepreneurAdminAPI, originals); window.confirm = oldConfirm; };
  }, []);
  return <Provider store={store}><ThemeProvider theme={theme}><pre>{result}</pre>{ready && <EntrepreneurFormEditor key={epoch} />}</ThemeProvider></Provider>;
}
