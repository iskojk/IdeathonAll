'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Accordion, AccordionSummary, AccordionDetails, Alert, Box, Button, CardContent, Checkbox, Chip, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, FormControlLabel, MenuItem, Pagination, Stack, TextField, Typography } from '@mui/material';
import { IconChevronDown, IconArrowUp, IconArrowDown, IconPlus, IconTrash } from '@tabler/icons-react';
import BlankCard from '@/app/components/shared/BlankCard';
import { entrepreneurAdminAPI, entrepreneurError } from '@/utils/api/entrepreneurs';
import { formatDate } from './format';

const types = { text: 'Kısa metin', textarea: 'Uzun metin', singleChoice: 'Tek seçim', multipleChoice: 'Çoklu seçim', file: 'Dosya yükleme', consent: 'KVKK onayı' };
const copy = value => JSON.parse(JSON.stringify(value));

export default function EntrepreneurFormEditor() {
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [preview, setPreview] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [removeId, setRemoveId] = useState(null);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [draftName, setDraftName] = useState('');
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [library, setLibrary] = useState(null);
  const [libraryError, setLibraryError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [createError, setCreateError] = useState('');
  const dirty = !!form && JSON.stringify({ name: draftName, form }) !== saved;

  function adoptDraft(draft) {
    setSelectedDraft(draft); setDraftName(draft.name); setForm(copy(draft.form));
    setSaved(JSON.stringify({ name: draft.name, form: draft.form })); setExpanded(null);
  }
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      entrepreneurAdminAPI.form(controller.signal),
      entrepreneurAdminAPI.formDrafts(1, controller.signal).then(list => entrepreneurAdminAPI.formDraft(list.items[0]._id, controller.signal)),
    ]).then(([data, draft]) => { if (!controller.signal.aborted) { setSettings(data); adoptDraft(draft); } })
      .catch(async err => { const message = await entrepreneurError(err, 'Soru seti yüklenemedi.'); if (!controller.signal.aborted) setError(message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const unload = event => { event.preventDefault(); event.returnValue = ''; };
    const navigate = event => {
      const link = event.target.closest?.('a[href]');
      if (!link || link.hasAttribute('download') || link.target === '_blank' || event.defaultPrevented) return;
      if (!window.confirm('Kaydedilmemiş soru değişiklikleriniz var. Sayfadan ayrılmak istiyor musunuz?')) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener('beforeunload', unload); document.addEventListener('click', navigate, true);
    return () => { window.removeEventListener('beforeunload', unload); document.removeEventListener('click', navigate, true); };
  }, [dirty]);

  function question(id, changes) {
    setNotice('');
    setForm(current => ({ ...current, questions: current.questions.map(item => item.id === id ? { ...item, ...changes } : item) }));
  }
  function changeType(item, type) {
    const field = { id: item.id, section: item.section, label: item.label, help: item.help || '', required: item.required, type };
    if (['text', 'textarea'].includes(type)) field.maxLength = type === 'text' ? 500 : 2500;
    if (['singleChoice', 'multipleChoice'].includes(type)) field.options = item.options || ['Evet', 'Hayır'];
    if (type === 'file') { field.maxFiles = 1; field.required = false; }
    setForm(current => ({ ...current, questions: current.questions.map(q => q.id === item.id ? field : q) }));
  }
  function move(id, delta) {
    setForm(current => {
      const questions = [...current.questions];
      const index = questions.findIndex(item => item.id === id);
      const siblings = questions.filter(item => item.section === questions[index].section && item.type !== 'consent');
      const target = siblings[siblings.findIndex(item => item.id === id) + delta];
      if (!target) return current;
      const targetIndex = questions.indexOf(target);
      [questions[index], questions[targetIndex]] = [questions[targetIndex], questions[index]];
      return { ...current, questions };
    });
  }
  function add(section) {
    const id = `question_${crypto.randomUUID().replaceAll('-', '')}`;
    setForm(current => ({ ...current, questions: [...current.questions.slice(0, -1), { id, section, label: 'Yeni soru', type: 'text', required: false, maxLength: 500 }, current.questions.at(-1)] }));
    setExpanded(id);
  }
  function download() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(form, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'girisimci-soru-taslagi.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function reload() {
    if (dirty && !window.confirm('Kaydedilmemiş değişiklikler bırakılıp sunucudaki taslak yüklensin mi?')) return;
    setBusy('reload'); setError('');
    try {
      const [data, draft] = await Promise.all([
        entrepreneurAdminAPI.form(),
        selectedDraft ? entrepreneurAdminAPI.formDraft(selectedDraft._id) : entrepreneurAdminAPI.formDrafts().then(list => entrepreneurAdminAPI.formDraft(list.items[0]._id)),
      ]);
      setSettings(data); adoptDraft(draft); setNotice('');
    }
    catch (err) { setError(await entrepreneurError(err, 'Soru seti yüklenemedi.')); }
    finally { setBusy(''); }
  }
  async function save(publish) {
    setBusy(publish ? 'publish' : 'save'); setError(''); setNotice('');
    let draftSaved = false;
    try {
      const draft = await entrepreneurAdminAPI.saveFormDraft(selectedDraft._id, draftName, form, selectedDraft.revision);
      adoptDraft(draft); draftSaved = true;
      if (publish) {
        const result = await entrepreneurAdminAPI.publishFormDraft(draft._id, draft.revision, settings.revision);
        setSettings(result.settings);
      }
      setNotice(publish ? 'Soru seti yayımlandı. Yeni başvurular bu sürümle açılacak.' : 'Taslak kaydedildi. Başvuru formuna yansıtmak için Yayımla düğmesini kullanın.');
    } catch (err) { setError(`${publish && draftSaved ? 'Taslak kaydedildi ancak yayımlanamadı. ' : ''}${await entrepreneurError(err, 'Soru seti kaydedilemedi.')}`); }
    finally { setBusy(''); }
  }
  async function showDrafts(page = 1) {
    setLibraryOpen(true); setBusy('list'); setLibraryError('');
    try { setLibrary(await entrepreneurAdminAPI.formDrafts(page)); }
    catch (err) { setLibraryError(await entrepreneurError(err, 'Taslaklar yüklenemedi.')); }
    finally { setBusy(''); }
  }
  async function openDraft(id) {
    if (dirty && !window.confirm('Kaydedilmemiş değişiklikler bırakılıp seçtiğiniz taslak açılsın mı?')) return;
    setBusy('open'); setLibraryError('');
    try {
      const [data, draft] = await Promise.all([entrepreneurAdminAPI.form(), entrepreneurAdminAPI.formDraft(id)]);
      setSettings(data); adoptDraft(draft); setLibraryOpen(false); setError(''); setNotice('');
    } catch (err) { setLibraryError(await entrepreneurError(err, 'Taslak açılamadı.')); }
    finally { setBusy(''); }
  }
  async function createDraft() {
    setBusy('create'); setCreateError('');
    try {
      adoptDraft(await entrepreneurAdminAPI.createFormDraft(newName, form));
      setCreateOpen(false); setError(''); setNotice('Yeni taslak kaydedildi. Bu kopyayı düzenlemeye devam edebilirsiniz.');
    } catch (err) { setCreateError(await entrepreneurError(err, 'Yeni taslak kaydedilemedi.')); }
    finally { setBusy(''); }
  }

  if (loading) return <Box p={6} textAlign="center"><CircularProgress aria-label="Soru seti yükleniyor" /></Box>;
  if (!form) return <Alert severity="error" action={<Button onClick={reload} disabled={!!busy}>Tekrar dene</Button>}>{error}</Alert>;
  const privacySection = form.questions.find(item => item.id === 'kvkk_ack').section;

  return <Stack spacing={3}>
    <Box><Button component={Link} href="/entrepreneurs/list">Girişimci Havuzuna Dön</Button><Typography variant="h4" component="h1" mt={1}>Girişimci Soru Seti</Typography><Typography color="text.secondary" mt={1}>{form.questions.length} soru · {form.sections.length} bölüm · {dirty ? 'Kaydedilmemiş değişiklikler' : 'Taslak güncel'}</Typography></Box>
    <Alert severity="info">Yayımlanan soru değişiklikleri yeni başvurulara uygulanır. Başlamış taslaklar ve gönderilmiş başvurular kendi soru setini korur. KVKK sorusu son sırada kalır; altında gizlilik politikası ve kullanım şartları için ayrı zorunlu onaylar bulunur.</Alert>
    {form.privacy?.draft && <Alert severity="warning">KVKK metni taslaktır. Kurum bilgilerini ve kurumunuzca uygun bulunan metni son soruda tamamlayın.</Alert>}
    {error && <Alert severity="error">{error} Değişikliklerinizi indirdikten sonra güncel taslağı yükleyebilirsiniz.</Alert>}
    {notice && <Alert severity="success">{notice}</Alert>}
    <Stack direction="row" gap={1} flexWrap="wrap" sx={{ position: 'sticky', top: 70, zIndex: 5, bgcolor: 'background.paper', py: 2, borderBottom: 1, borderColor: 'divider' }}>
      <Button variant="outlined" disabled={!!busy} onClick={() => showDrafts()}>Taslaklarım</Button>
      <Button variant="outlined" startIcon={<IconPlus size={18} />} disabled={!!busy} onClick={() => { setNewName(`${draftName.slice(0, 140)} — Kopya`); setCreateError(''); setCreateOpen(true); }}>Yeni Taslak Olarak Kaydet</Button>
      <Button variant="outlined" disabled={!!busy} onClick={() => setPreview(true)}>Önizle</Button>
      <Button variant="outlined" disabled={!!busy} onClick={() => save(false)}>{busy === 'save' ? 'Kaydediliyor…' : 'Taslağı Kaydet'}</Button>
      <Button variant="contained" disabled={!!busy} onClick={() => save(true)}>{busy === 'publish' ? 'Yayımlanıyor…' : 'Yayımla'}</Button>
      <Button disabled={!!busy} onClick={download}>Taslağı indir</Button><Button disabled={!!busy} onClick={reload}>Güncel taslağı yükle</Button>
    </Stack>
    <Box component="fieldset" disabled={!!busy} sx={{ border: 0, m: 0, p: 0, minWidth: 0 }}>
      <Stack spacing={3}>
        <BlankCard><CardContent><TextField fullWidth label="Taslak adı" value={draftName} onChange={e => setDraftName(e.target.value)} inputProps={{ maxLength: 150 }} helperText={`Yalnızca yönetim panelinde görünür. Son kayıt: ${formatDate(selectedDraft?.updatedAt)}`} /></CardContent></BlankCard>
        <BlankCard><CardContent><Stack spacing={2}><TextField label="Form başlığı" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} inputProps={{ maxLength: 200 }} /><TextField label="Form açıklaması" multiline minRows={2} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} inputProps={{ maxLength: 1500 }} /></Stack></CardContent></BlankCard>
        {form.sections.map(section => {
          const items = form.questions.filter(item => item.section === section.id);
          return <BlankCard key={section.id}><CardContent>
            <Stack spacing={2}>
              <TextField label="Bölüm adı" value={section.title} onChange={e => setForm({ ...form, sections: form.sections.map(s => s.id === section.id ? { ...s, title: e.target.value } : s) })} inputProps={{ maxLength: 150 }} />
              <Typography variant="body2" color="text.secondary">{items.length} soru</Typography>
              {items.map((item, index) => <Accordion key={item.id} expanded={expanded === item.id} onChange={(_, open) => setExpanded(open ? item.id : null)} disableGutters>
                <AccordionSummary expandIcon={<IconChevronDown size={20} />}><Stack direction="row" alignItems="center" gap={1} flexWrap="wrap"><Typography fontWeight={600}>{item.label || 'Başlıksız soru'}</Typography><Chip size="small" label={types[item.type]} />{item.required && <Chip size="small" label="Zorunlu" variant="outlined" />}</Stack></AccordionSummary>
                <AccordionDetails><Stack spacing={2}>
                  <TextField label="Soru metni" value={item.label} onChange={e => question(item.id, { label: e.target.value })} inputProps={{ maxLength: 500 }} />
                  {item.type !== 'consent' && <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField select fullWidth label="Cevap türü" value={item.type} onChange={e => changeType(item, e.target.value)}>{Object.entries(types).filter(([key]) => key !== 'consent').map(([key, label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}</TextField>
                    <TextField select fullWidth label="Bölüm" value={item.section} onChange={e => question(item.id, { section: e.target.value })}>{form.sections.filter(s => s.id !== privacySection).map(s => <MenuItem key={s.id} value={s.id}>{s.title}</MenuItem>)}</TextField>
                    <FormControlLabel control={<Checkbox checked={item.required} onChange={e => question(item.id, { required: e.target.checked })} />} label="Zorunlu" />
                  </Stack>}
                  <TextField label={item.type === 'consent' ? 'KVKK aydınlatma metni' : 'Açıklama / yardım metni'} multiline minRows={item.type === 'consent' ? 12 : 2} value={item.help || ''} onChange={e => question(item.id, { help: e.target.value })} inputProps={{ maxLength: item.type === 'consent' ? 20000 : 2000 }} />
                  {['singleChoice', 'multipleChoice'].includes(item.type) && <TextField label="Seçenekler (her satıra bir seçenek)" multiline minRows={3} maxRows={10} value={item.options.join('\n')} onChange={e => question(item.id, { options: e.target.value.split('\n') })} helperText={item.type === 'singleChoice' ? '2–100 seçenek. 12’den fazla seçenek varsa başvuru ekranında arama gösterilir.' : '2–30 seçenek.'} />}
                  {['text', 'textarea'].includes(item.type) && <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField type="number" label="Karakter sınırı" value={item.maxLength} onChange={e => question(item.id, { maxLength: Number(e.target.value) })} inputProps={{ min: 1, max: 10000 }} />
                    {item.type === 'text' && <TextField select label="Metin formatı" value={item.inputType || 'text'} onChange={e => question(item.id, { inputType: e.target.value })} sx={{ minWidth: 180 }}>{Object.entries({ text: 'Serbest metin', email: 'E-posta', tel: 'Telefon', url: 'Web adresi', date: 'Tarih', number: 'Sayı' }).map(([key, label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}</TextField>}
                    <TextField fullWidth label="Yer tutucu" value={item.placeholder || ''} onChange={e => question(item.id, { placeholder: e.target.value })} inputProps={{ maxLength: 500 }} />
                  </Stack>}
                  {item.type === 'file' && <TextField type="number" label="En fazla dosya sayısı" value={item.maxFiles} onChange={e => question(item.id, { maxFiles: Number(e.target.value) })} inputProps={{ min: 1, max: 10 }} helperText="PDF, PNG veya JPEG; dosya başına en fazla 10 MB." />}
                  {item.type === 'consent' ? <FormControlLabel control={<Checkbox checked={form.privacy?.draft !== false} onChange={e => setForm({ ...form, privacy: { ...form.privacy, draft: e.target.checked } })} />} label="KVKK metni taslak (başvuru ekranında belirtilir)" /> : <Stack direction="row" gap={1} flexWrap="wrap">
                    <Button startIcon={<IconArrowUp size={18} />} disabled={index === 0} onClick={() => move(item.id, -1)}>Yukarı</Button>
                    <Button startIcon={<IconArrowDown size={18} />} disabled={index === items.length - 1} onClick={() => move(item.id, 1)}>Aşağı</Button>
                    <Button color="error" startIcon={<IconTrash size={18} />} onClick={() => setRemoveId(item.id)}>Soruyu sil</Button>
                  </Stack>}
                </Stack></AccordionDetails>
              </Accordion>)}
              {section.id !== privacySection && <Button startIcon={<IconPlus size={18} />} disabled={form.questions.length >= 100} onClick={() => add(section.id)}>Bu bölüme soru ekle</Button>}
            </Stack>
          </CardContent></BlankCard>;
        })}
        {!!form.agreements?.length && <BlankCard><CardContent><Typography variant="h6" mb={2}>KVKK altındaki zorunlu onaylar</Typography><Stack spacing={2}>{form.agreements.map(agreement => <Box key={agreement.id}><Typography><a href={agreement.url} target="_blank" rel="noopener noreferrer">{agreement.label}</a> · Zorunlu</Typography><Typography variant="body2" color="text.secondary">{agreement.acknowledgement}</Typography></Box>)}</Stack><Typography variant="body2" mt={2} color="text.secondary">Bu iki onay başvurunun gönderimi için gereklidir; isteğe bağlı hale getirilemez.</Typography></CardContent></BlankCard>}
      </Stack>
    </Box>
    <Dialog open={libraryOpen} onClose={() => { if (!busy) setLibraryOpen(false); }} fullWidth maxWidth="md" aria-labelledby="draft-library-title">
      <DialogTitle id="draft-library-title">Taslaklarım</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary" mb={2}>Kaydedilen soru setlerinden birini seçerek düzenleyin. Bir taslağı açmak veya kaydetmek başvuru formunu değiştirmez.</Typography>
        {libraryError && <Alert severity="error" sx={{ mb: 2 }} action={<Button disabled={!!busy} onClick={() => showDrafts(library?.pagination.page || 1)}>Tekrar dene</Button>}>{libraryError}</Alert>}
        {busy === 'list' ? <Box py={4} textAlign="center"><CircularProgress aria-label="Taslaklar yükleniyor" /></Box> : <Stack spacing={2}>
          {library?.items.map(draft => <Box key={draft._id} sx={{ border: 1, borderColor: draft._id === selectedDraft?._id ? 'primary.main' : 'divider', borderRadius: 1, p: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ sm: 'center' }}>
              <Box sx={{ minWidth: 0, overflowWrap: 'anywhere' }}><Stack direction="row" gap={1} alignItems="center" flexWrap="wrap"><Typography fontWeight={600}>{draft.name}</Typography>{draft._id === selectedDraft?._id && <Chip size="small" label="Açık taslak" color="primary" variant="outlined" />}</Stack><Typography variant="body2" color="text.secondary">{draft.title} · {draft.questionCount} soru</Typography><Typography variant="caption" color="text.secondary">Oluşturulma: {formatDate(draft.createdAt)} · Son kayıt: {formatDate(draft.updatedAt)}</Typography></Box>
              <Button variant="outlined" disabled={!!busy} onClick={() => openDraft(draft._id)} sx={{ flexShrink: 0 }} aria-label={`${draft.name} taslağını düzenle`}>Düzenle</Button>
            </Stack>
          </Box>)}
          {library && !library.items.length && <Typography>Bu sayfada kayıtlı taslak yok.</Typography>}
          {library?.pagination.pages > 1 && <Pagination count={library.pagination.pages} page={library.pagination.page} disabled={!!busy} onChange={(_, page) => showDrafts(page)} />}
        </Stack>}
      </DialogContent>
      <DialogActions><Button disabled={!!busy} onClick={() => setLibraryOpen(false)}>Kapat</Button></DialogActions>
    </Dialog>
    <Dialog open={createOpen} onClose={() => { if (!busy) setCreateOpen(false); }} fullWidth maxWidth="sm" aria-labelledby="new-draft-title">
      <DialogTitle id="new-draft-title">Yeni Taslak Olarak Kaydet</DialogTitle>
      <DialogContent><Typography mb={2}>Ekrandaki soru seti ayrı bir taslak olarak kaydedilecek. Mevcut taslağınız korunur.</Typography>{createError && <Alert severity="error" sx={{ mb: 2 }}>{createError}</Alert>}<TextField autoFocus fullWidth margin="dense" label="Yeni taslak adı" value={newName} disabled={!!busy} onChange={e => setNewName(e.target.value)} inputProps={{ maxLength: 150 }} /></DialogContent>
      <DialogActions><Button disabled={!!busy} onClick={() => setCreateOpen(false)}>Vazgeç</Button><Button variant="contained" disabled={!!busy || !newName.trim()} onClick={createDraft}>{busy === 'create' ? 'Kaydediliyor…' : 'Taslağı Oluştur'}</Button></DialogActions>
    </Dialog>
    <Dialog open={!!removeId} onClose={() => setRemoveId(null)}><DialogTitle>Soru taslaktan silinsin mi?</DialogTitle><DialogContent><Typography>{form.questions.find(q => q.id === removeId)?.label}</Typography><Typography mt={1}>Mevcut başvurulardaki soru ve yanıtlar korunur.</Typography></DialogContent><DialogActions><Button onClick={() => setRemoveId(null)}>Vazgeç</Button><Button color="error" onClick={() => { setForm({ ...form, questions: form.questions.filter(q => q.id !== removeId) }); setRemoveId(null); }}>Sil</Button></DialogActions></Dialog>
    <Dialog open={preview} onClose={() => setPreview(false)} fullWidth maxWidth="md">
      <DialogTitle>{form.title} · Önizleme</DialogTitle>
      <DialogContent>
        <Typography mb={3}>{form.description}</Typography>
        {form.sections.map(section => <Box key={section.id} mb={4}>
          <Typography variant="h5" mb={2}>{section.title}</Typography>
          <Stack spacing={3}>{form.questions.filter(q => q.section === section.id).map(q => <Box key={q.id}>
            <Typography fontWeight={600}>{q.label}{q.required ? ' *' : ''}</Typography>
            {q.help && <Typography color="text.secondary" sx={{ whiteSpace: 'pre-wrap', maxHeight: 240, overflow: 'auto', my: 1 }}>{q.help}</Typography>}
            {q.type === 'file' ? <Typography>Evrak yükleme · En fazla {q.maxFiles} dosya</Typography>
              : q.type === 'consent' ? <FormControlLabel disabled control={<Checkbox />} label="KVKK Aydınlatma Metni’ni okudum ve bilgilendirildim." />
              : q.options ? <Stack direction="row" flexWrap="wrap" gap={1}>{q.options.map(option => <Chip key={option} label={option} variant="outlined" />)}</Stack>
              : <TextField fullWidth disabled type={q.type === 'text' ? q.inputType || 'text' : 'text'} multiline={q.type === 'textarea'} minRows={q.type === 'textarea' ? 3 : 1} placeholder={q.placeholder || 'Yanıt alanı'} />}
          </Box>)}</Stack>
        </Box>)}
        {!!form.agreements?.length && <Stack spacing={2}>{form.agreements.map(agreement => <FormControlLabel key={agreement.id} disabled control={<Checkbox />} label={agreement.acknowledgement} />)}</Stack>}
      </DialogContent>
      <DialogActions><Button onClick={() => setPreview(false)}>Kapat</Button></DialogActions>
    </Dialog>
  </Stack>;
}
