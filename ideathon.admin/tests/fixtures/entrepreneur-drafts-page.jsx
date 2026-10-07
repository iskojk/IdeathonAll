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
    let settings = { active: copy(form), draft: copy(form), revision: 10 };
    const originals = { ...entrepreneurAdminAPI };
    const oldConfirm = window.confirm;
    let confirmLeave = false;
    let confirms = 0;
    let saveConflict = false;
    const conflict = () => { throw { response: { data: { message: 'Taslak başka bir oturumda değişti.' }, status: 409 } }; };
    window.confirm = () => { confirms++; return confirmLeave; };
    entrepreneurAdminAPI.form = async () => copy(settings);
    entrepreneurAdminAPI.formDrafts = async () => ({ items: copy([...drafts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(({ form: draftForm, ...draft }) => ({ ...draft, title: draftForm.title, questionCount: draftForm.questions.length }))), pagination: { page: 1, pages: 1, total: drafts.length } });
    entrepreneurAdminAPI.formDraft = async id => copy(drafts.find(draft => draft._id === id));
    entrepreneurAdminAPI.createFormDraft = async (name, draftForm) => {
      const draft = { _id: 'c', name, form: copy(draftForm), revision: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      drafts.push(draft); return copy(draft);
    };
    entrepreneurAdminAPI.saveFormDraft = async (id, name, draftForm, revision) => {
      const draft = drafts.find(item => item._id === id);
      if (saveConflict || draft.revision !== revision) conflict();
      Object.assign(draft, { name, form: copy(draftForm), revision: revision + 1, updatedAt: new Date().toISOString() }); return copy(draft);
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
    const button = label => [...document.querySelectorAll('button')].find(node => node.textContent.trim() === label);
    const input = label => {
      const node = [...document.querySelectorAll('label')].find(node => node.textContent.trim() === label);
      return node && document.getElementById(node.htmlFor);
    };
    const type = async (label, value) => {
      const node = input(label); assert(!!node, `Alan bulunamadı: ${label}`);
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(node, value);
      node.dispatchEvent(new Event('input', { bubbles: true })); await pause(50);
    };
    const open = name => document.querySelector(`button[aria-label="${name} taslağını düzenle"]`);
    setReady(true);
    (async () => {
      await wait(() => input('Taslak adı')?.value === 'Birinci taslak', 'İlk taslak açılmadı');
      button('Taslaklarım').click();
      await wait(() => open('İkinci taslak'), 'Taslaklar listelenmedi');
      open('İkinci taslak').click();
      await wait(() => input('Form başlığı')?.value === 'İkinci form' && !document.querySelector('[role="dialog"]'), 'Geçmiş taslak yüklenmedi');
      await type('Form başlığı', 'Kopyaya ait form');
      button('Yeni Taslak Olarak Kaydet').click();
      await wait(() => input('Yeni taslak adı'), 'Yeni taslak penceresi açılmadı');
      await type('Yeni taslak adı', 'Üçüncü taslak');
      button('Taslağı Oluştur').click();
      await wait(() => input('Taslak adı')?.value === 'Üçüncü taslak' && !document.querySelector('[role="dialog"]'), 'Yeni taslak seçilmedi');
      assert(drafts.length === 3 && drafts[1].form.title === 'İkinci form', 'Kopyalama eski taslağı değiştirdi');
      assert(settings.active.title === 'İlk form', 'Taslak kaydı yayımdaki formu değiştirdi');
      await type('Taslak adı', 'Üçüncü taslak güncel');
      await type('Form başlığı', 'Kaydedilecek başlık');
      button('Taslağı Kaydet').click();
      await wait(() => drafts[2].form.title === 'Kaydedilecek başlık' && !button('Taslağı Kaydet').disabled, 'Seçili taslak kaydedilmedi');
      await type('Form başlığı', 'Kaydedilmemiş başlık');
      button('Taslaklarım').click();
      await wait(() => open('Birinci taslak'), 'Taslak listesi tekrar açılmadı');
      open('Birinci taslak').click(); await pause(50);
      assert(confirms === 1 && input('Form başlığı').value === 'Kaydedilmemiş başlık', 'İptal edilen geçiş yanıtı korumadı');
      confirmLeave = true; open('Birinci taslak').click();
      await wait(() => input('Form başlığı')?.value === 'İlk form' && !document.querySelector('[role="dialog"]'), 'Seçilen eski taslak yüklenmedi');
      setEpoch(value => value + 1);
      await wait(() => input('Taslak adı')?.value === 'Üçüncü taslak güncel', 'Yeniden açılışta kayıtlı taslak yüklenmedi');
      assert(input('Form başlığı').value === 'Kaydedilecek başlık', 'Kaydedilmemiş değişiklik taslağı ezdi');
      saveConflict = true; await type('Form başlığı', 'Çakışma sırasında korunan başlık');
      button('Taslağı Kaydet').click();
      await wait(() => document.body.textContent.includes('Taslak başka bir oturumda değişti.'), 'Çakışma gösterilmedi');
      assert(input('Form başlığı').value === 'Çakışma sırasında korunan başlık' && drafts[2].form.title === 'Kaydedilecek başlık', 'Çakışma yanıtı sildi veya kayıt ezildi');
      saveConflict = false;
      button('Yayımla').click();
      await wait(() => settings.active.title === 'Çakışma sırasında korunan başlık', 'Seçili taslak yayımlanmadı');
      assert(drafts[0].form.title === 'İlk form' && drafts[1].form.title === 'İkinci form', 'Diğer taslaklar değişti');
      setResult('PASS: draft library, opening old drafts, named copy, independent save, rename, unsaved-change cancellation, reload, conflict recovery, selected-draft publication');
    })().catch(error => { if (!cancelled) setResult(`FAIL: ${error.message}`); });
    return () => { cancelled = true; Object.assign(entrepreneurAdminAPI, originals); window.confirm = oldConfirm; };
  }, []);
  return <Provider store={store}><ThemeProvider theme={theme}><pre>{result}</pre>{ready && <EntrepreneurFormEditor key={epoch} />}</ThemeProvider></Provider>;
}
