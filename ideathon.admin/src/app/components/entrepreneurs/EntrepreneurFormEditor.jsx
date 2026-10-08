'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Accordion, AccordionSummary, AccordionDetails, Alert, Box, Button, Checkbox, Chip, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, FormControlLabel, Pagination, Paper, Stack, TextField, Typography } from '@mui/material';
import { IconChevronDown, IconArrowUp, IconArrowDown, IconPlus, IconTrash, IconFolders, IconCopy, IconEye, IconDeviceFloppy, IconSend, IconDownload, IconRefresh, IconArrowLeft, IconPencil } from '@tabler/icons-react';
import { entrepreneurAdminAPI, entrepreneurError } from '@/utils/api/entrepreneurs';
import EntrepreneurQuestionEditor, { answerFormats, questionFormat, withFormat } from './EntrepreneurQuestionEditor';
import EntrepreneurSectionList from './EntrepreneurSectionList';
import { formatDate } from './format';

const neutralButton = { color: '#526174', borderColor: '#dbe2ea', bgcolor: 'transparent', '&:hover': { bgcolor: '#f3f6f9', borderColor: '#a8b4c3' } };
const draftButton = { color: '#7152a3', borderColor: '#ded3ee', bgcolor: '#faf7fe', '&:hover': { bgcolor: '#f0e9fa', borderColor: '#b29acd' } };
const copyButton = { color: '#087c85', borderColor: '#b8dfe1', bgcolor: '#f0fafa', '&:hover': { bgcolor: '#e0f3f4', borderColor: '#70b9bf' } };
const publishButton = { bgcolor: '#168061', color: '#fff', boxShadow: 'none', '&:hover': { bgcolor: '#11684f', boxShadow: 'none' } };
const copy = value => JSON.parse(JSON.stringify(value));

export default function EntrepreneurFormEditor() {
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [validationIssue, setValidationIssue] = useState(null);
  const [notice, setNotice] = useState('');
  const [preview, setPreview] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [activeSection, setActiveSection] = useState('');
  const [sectionDialog, setSectionDialog] = useState(null);
  const [sectionName, setSectionName] = useState('');
  const [sectionDescription, setSectionDescription] = useState('');
  const [removeSection, setRemoveSection] = useState(null);
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

  function adoptDraft(draft, preservePosition = false) {
    setSelectedDraft(draft); setDraftName(draft.name); setForm(copy(draft.form));
    setSaved(JSON.stringify({ name: draft.name, form: draft.form })); setValidationIssue(null);
    if (!preservePosition || !draft.form.questions.some(q => q.id === expanded)) setExpanded(null);
    if (!preservePosition || !draft.form.sections.some(s => s.id === activeSection)) setActiveSection(draft.form.sections.find(s => draft.form.questions.some(q => q.section === s.id && q.type !== 'consent'))?.id || '');
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
    if (validationIssue?.question?.id === id) { setValidationIssue(null); setError(''); }
    setForm(current => ({ ...current, questions: current.questions.map(item => item.id === id ? { ...item, ...changes } : item) }));
  }
  function changeType(item, format) {
    setNotice('');
    // Replace the old definition so options and constraints from another format cannot leak.
    setForm(current => ({ ...current, questions: current.questions.map(q => q.id === item.id ? withFormat(item, format) : q) }));
  }
  function editSection(section = null) {
    setSectionDialog(section || { id: null });
    setSectionName(section?.title || ''); setSectionDescription(section?.description || '');
  }
  function commitSection() {
    const id = sectionDialog.id || `section_${crypto.randomUUID().replaceAll('-', '')}`;
    const section = { id, title: sectionName.trim(), description: sectionDescription.trim() };
    setForm(current => {
      if (sectionDialog.id) return { ...current, sections: current.sections.map(s => s.id === id ? section : s) };
      const sections = [...current.sections];
      sections.splice(sections.findIndex(s => s.id === current.questions.find(q => q.id === 'kvkk_ack').section), 0, section);
      return { ...current, sections };
    });
    setActiveSection(id); setExpanded(null); setNotice(''); setSectionDialog(null);
  }
  function reorderSection(id, targetId) {
    if (busy) return;
    setForm(current => {
      const privacyId = current.questions.find(q => q.id === 'kvkk_ack').section;
      const movable = current.sections.filter(s => s.id !== privacyId);
      const from = movable.findIndex(s => s.id === id);
      const to = movable.findIndex(s => s.id === targetId);
      if (from < 0 || to < 0 || from === to) return current;
      movable.splice(to, 0, movable.splice(from, 1)[0]);
      let index = 0;
      const sections = current.sections.map(s => s.id === privacyId ? s : movable[index++]);
      const questions = sections.flatMap(s => current.questions.filter(q => q.section === s.id));
      return { ...current, sections, questions };
    });
    setActiveSection(id);
    if (activeSection !== id) setExpanded(null);
    setNotice('');
  }
  function moveSection(id, delta) {
    const privacyId = form.questions.find(q => q.id === 'kvkk_ack').section;
    const movable = form.sections.filter(s => s.id !== privacyId);
    const target = movable[movable.findIndex(s => s.id === id) + delta];
    if (target) reorderSection(id, target.id);
  }
  function preparedForm() {
    const fail = (message, question) => { throw { message, question }; };
    if (!form.title.trim()) fail('Form başlığını yazın.');
    if (!draftName.trim()) fail('Taslak adını yazın.');
    for (const section of form.sections) if (!section.title.trim()) fail('Her bölüm için bir ad yazın.');
    const questions = form.questions.map(q => {
      if (!q.label.trim()) fail('Soru metnini yazın.', q);
      if (['text', 'textarea'].includes(q.type) && (!Number.isInteger(q.maxLength) || q.maxLength < 1 || q.maxLength > 10000)) fail('Karakter sınırı 1–10.000 arasında olmalıdır.', q);
      if (q.type === 'file' && (!Number.isInteger(q.maxFiles) || q.maxFiles < 1 || q.maxFiles > 10)) fail('Dosya sayısı 1–10 arasında olmalıdır.', q);
      if (!['singleChoice', 'multipleChoice'].includes(q.type)) return q;
      const options = q.options.map(option => option.trim()).filter(Boolean);
      const max = q.type === 'singleChoice' ? 100 : 30;
      if (options.length < 2 || options.length > max) fail(`Bu soru için 2–${max} seçenek yazın.`, q);
      if (new Set(options).size !== options.length) fail('Aynı seçeneği birden fazla kez eklemeyin.', q);
      if (options.some(option => option.length > 300)) fail('Her seçenek en fazla 300 karakter olabilir.', q);
      return { ...q, options };
    });
    const privacyId = form.questions.find(q => q.id === 'kvkk_ack').section;
    const sections = [...form.sections.filter(s => s.id !== privacyId), form.sections.find(s => s.id === privacyId)];
    return { ...form, sections, questions };
  }
  function revealIssue(issue) {
    if (issue.question) { setActiveSection(issue.question.section); setExpanded(issue.question.id); }
    setValidationIssue(issue); setError(issue.message);
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
    setActiveSection(section); setExpanded(id); setNotice('');
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
    let content;
    try { content = preparedForm(); } catch (issue) { revealIssue(issue); return; }
    setBusy(publish ? 'publish' : 'save'); setError(''); setNotice('');
    let draftSaved = false;
    try {
      const draft = await entrepreneurAdminAPI.saveFormDraft(selectedDraft._id, draftName, content, selectedDraft.revision);
      adoptDraft(draft, true); draftSaved = true;
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
    let content;
    try { content = preparedForm(); } catch (issue) { setCreateError(issue.message); return; }
    setBusy('create'); setCreateError('');
    try {
      adoptDraft(await entrepreneurAdminAPI.createFormDraft(newName, content));
      setCreateOpen(false); setError(''); setNotice('Yeni taslak kaydedildi. Bu kopyayı düzenlemeye devam edebilirsiniz.');
    } catch (err) { setCreateError(await entrepreneurError(err, 'Yeni taslak kaydedilemedi.')); }
    finally { setBusy(''); }
  }

  if (loading) return <Box p={6} textAlign="center"><CircularProgress aria-label="Soru seti yükleniyor" /></Box>;
  if (!form) return <Alert severity="error" action={<Button onClick={reload} disabled={!!busy}>Tekrar dene</Button>}>{error}</Alert>;
  const kvkk = form.questions.find(item => item.id === 'kvkk_ack');
  const privacySection = kvkk.section;
  const contentQuestions = form.questions.filter(q => q.type !== 'consent');
  const editableSections = form.sections.filter(s => s.id !== privacySection || contentQuestions.some(q => q.section === s.id));
  const currentSection = editableSections.find(s => s.id === activeSection) || editableSections[0];
  const items = contentQuestions.filter(q => q.section === currentSection?.id);
  const movableSections = editableSections.filter(s => s.id !== privacySection);
  const sectionIndex = movableSections.findIndex(s => s.id === currentSection?.id);

  return <Stack spacing={3}>
    <Box><Button component={Link} href="/entrepreneurs/list" startIcon={<IconArrowLeft size={17} />} sx={neutralButton}>Girişimci Havuzuna Dön</Button><Typography variant="h4" component="h1" mt={1}>Girişimci Soru Seti</Typography><Typography color="text.secondary" mt={1}>{contentQuestions.length} başvuru alanı · {editableSections.length} bölüm</Typography></Box>
    <Typography sx={{ fontSize: 13, lineHeight: 1.8 }} color="text.secondary">Bölüm seçin, sorularınızı düzenleyin ve cevap formatını belirleyin. Taslağı kaydedip önizleyin; hazır olduğunda yayımlayın. Değişiklikler yalnızca yeni başvurulara uygulanır.</Typography>
    {error && <Alert severity="error">{error}</Alert>}
    {notice && <Alert severity="success">{notice}</Alert>}
    <Paper variant="outlined" sx={{ position: { xs: 'static', sm: 'sticky' }, top: 70, zIndex: 5, borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 16px rgba(30,50,70,.04)' }}>
      <Stack direction={{ xs: 'column', lg: 'row' }} gap={2} justifyContent="space-between" sx={{ p: 2 }}>
        <Stack gap={1}>
          <Typography sx={{ fontSize: 11, fontWeight: 500, color: 'text.secondary' }}>TASLAK YÖNETİMİ</Typography>
          <Stack direction="row" gap={1} flexWrap="wrap">
            <Button variant="outlined" sx={draftButton} startIcon={<IconFolders size={18} />} disabled={!!busy} onClick={() => showDrafts()}>Taslaklarım</Button>
            <Button variant="outlined" sx={copyButton} startIcon={<IconCopy size={18} />} disabled={!!busy} onClick={() => { setNewName(`${draftName.slice(0, 140)} — Kopya`); setCreateError(''); setCreateOpen(true); }}>Yeni Taslak Olarak Kaydet</Button>
          </Stack>
        </Stack>
        <Stack gap={1}>
          <Typography sx={{ fontSize: 11, fontWeight: 500, color: 'text.secondary' }}>KONTROL VE YAYIN</Typography>
          <Stack direction="row" gap={1} flexWrap="wrap">
            <Button variant="outlined" sx={neutralButton} startIcon={<IconEye size={18} />} disabled={!!busy} onClick={() => setPreview(true)}>Önizle</Button>
            <Button variant="contained" startIcon={<IconDeviceFloppy size={18} />} sx={{ boxShadow: 'none' }} disabled={!!busy} onClick={() => save(false)}>{busy === 'save' ? 'Kaydediliyor…' : 'Taslağı Kaydet'}</Button>
            <Button variant="contained" sx={publishButton} startIcon={<IconSend size={18} />} disabled={!!busy} onClick={() => save(true)}>{busy === 'publish' ? 'Yayımlanıyor…' : 'Yayımla'}</Button>
          </Stack>
        </Stack>
      </Stack>
      <Stack direction="row" gap={1.5} flexWrap="wrap" alignItems="center" sx={{ px: 2, py: 1, bgcolor: 'grey.50', borderTop: 1, borderColor: 'divider', borderRadius: 0 }}>
        <Chip size="small" variant="outlined" color={dirty ? 'warning' : 'default'} label={dirty ? 'Kaydedilmemiş değişiklikler' : 'Taslak güncel'} sx={{ fontSize: 11, mr: 'auto' }} />
        <Button size="small" sx={neutralButton} startIcon={<IconDownload size={16} />} disabled={!!busy} onClick={download}>Taslağı indir</Button>
        <Button size="small" sx={neutralButton} startIcon={<IconRefresh size={16} />} disabled={!!busy} onClick={reload}>Güncel taslağı yükle</Button>
      </Stack>
    </Paper>
    <Box component="fieldset" disabled={!!busy} sx={{ border: 0, m: 0, p: 0, minWidth: 0 }}>
      <Stack spacing={3}>
        <Paper variant="outlined" sx={{ borderRadius: 2, p: { xs: 2, sm: 2.5 } }}>
          <Typography sx={{ fontSize: 16, fontWeight: 600, mb: 2 }}>Form bilgileri</Typography>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField fullWidth label="Taslak adı" value={draftName} onChange={e => setDraftName(e.target.value)} inputProps={{ maxLength: 150 }} helperText={`Yalnızca yönetimde görünür. Son kayıt: ${formatDate(selectedDraft?.updatedAt)}`} />
              <TextField fullWidth label="Form başlığı" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} inputProps={{ maxLength: 200 }} helperText="Başvuru ekranında görünen başlık." />
            </Stack>
            <TextField fullWidth label="Form açıklaması" multiline minRows={2} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} inputProps={{ maxLength: 1500 }} />
          </Stack>
        </Paper>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '230px minmax(0, 1fr)' }, gap: 2.5, alignItems: 'start' }}>
          <Paper component="nav" aria-label="Soru seti bölümleri" variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, px: 1, mb: 0.75 }} color="text.secondary">BÖLÜMLER</Typography>
            <Typography sx={{ fontSize: 11, px: 1, mb: 1.5, lineHeight: 1.6 }} color="text.secondary">Tutamacı sürükleyerek sıralayın.</Typography>
            <EntrepreneurSectionList sections={editableSections} selectedId={currentSection?.id} fixedId={privacySection} questions={contentQuestions} disabled={!!busy}
              onSelect={id => { setActiveSection(id); setExpanded(null); }} onReorder={reorderSection} />
            <Button fullWidth variant="outlined" startIcon={<IconPlus size={16} />} sx={{ ...copyButton, mt: 2 }} disabled={form.sections.length >= 20} onClick={() => editSection()}>Bölüm ekle</Button>
          </Paper>
          <Paper variant="outlined" sx={{ borderRadius: 2, p: { xs: 2, sm: 2.5 }, minWidth: 0 }}>
            {currentSection ? <Stack spacing={2.5}>
              <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} justifyContent="space-between" alignItems={{ sm: 'flex-start' }}>
                <Box sx={{ minWidth: 0 }}><Typography component="h2" sx={{ fontSize: 18, fontWeight: 600, overflowWrap: 'anywhere' }}>{currentSection.title}</Typography><Typography sx={{ fontSize: 12, mt: 0.75 }} color="text.secondary">{editableSections.findIndex(s => s.id === currentSection.id) + 1}. bölüm · {items.length} soru · Düzenlemek için bir soruya tıklayın.</Typography>{currentSection.description && <Typography sx={{ fontSize: 13, mt: 1, lineHeight: 1.7 }} color="text.secondary">{currentSection.description}</Typography>}</Box>
                <Button variant="outlined" size="small" startIcon={<IconPencil size={16} />} sx={{ ...neutralButton, flexShrink: 0 }} onClick={() => editSection(currentSection)}>Bölümü düzenle</Button>
              </Stack>
              <Stack gap={1.5}>{items.map((item, index) => <EntrepreneurQuestionEditor key={item.id} question={item} index={index} total={items.length} expanded={expanded === item.id} onExpand={open => setExpanded(open ? item.id : null)} onChange={changes => {
                question(item.id, changes);
                if (changes.section) setActiveSection(changes.section);
              }} onFormat={format => changeType(item, format)} onMove={delta => move(item.id, delta)} onRemove={() => setRemoveId(item.id)} sections={editableSections} disabled={!!busy} errorMessage={validationIssue?.question?.id === item.id ? validationIssue.message : undefined} />)}</Stack>
              {!items.length && <Box sx={{ py: 3, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 1.5 }}><Typography sx={{ fontSize: 14 }}>Bu bölümde henüz soru yok.</Typography><Typography sx={{ fontSize: 12, mt: 1 }} color="text.secondary">İlk soruyu ekleyerek başlayın.</Typography></Box>}
              <Button variant="outlined" sx={{ ...copyButton, alignSelf: 'flex-start' }} startIcon={<IconPlus size={18} />} disabled={form.questions.length >= 100} onClick={() => add(currentSection.id)}>Soru ekle</Button>
              {form.questions.length >= 100 && <Typography fontSize={12} color="text.secondary">En fazla 100 soru ekleyebilirsiniz.</Typography>}
              {currentSection.id !== privacySection && <Stack direction="row" gap={1} flexWrap="wrap" sx={{ pt: 1.5, borderTop: 1, borderColor: 'divider' }}>
                <Button size="small" sx={neutralButton} startIcon={<IconArrowUp size={15} />} disabled={sectionIndex === 0} onClick={() => moveSection(currentSection.id, -1)}>Bölümü yukarı taşı</Button>
                <Button size="small" sx={neutralButton} startIcon={<IconArrowDown size={15} />} disabled={sectionIndex === movableSections.length - 1} onClick={() => moveSection(currentSection.id, 1)}>Bölümü aşağı taşı</Button>
                <Button size="small" color="error" sx={{ bgcolor: 'transparent', ml: { sm: 'auto' } }} startIcon={<IconTrash size={15} />} disabled={!!items.length} title={items.length ? 'Bölümü silmek için önce soruları başka bir bölüme taşıyın veya silin.' : undefined} onClick={() => setRemoveSection(currentSection)}>Boş bölümü sil</Button>
              </Stack>}
            </Stack> : <Stack alignItems="center" spacing={2} py={3}><Typography color="text.secondary">Sorularınızı gruplamak için bir bölüm ekleyin.</Typography><Button variant="outlined" sx={copyButton} onClick={() => editSection()}>Bölüm ekle</Button></Stack>}
          </Paper>
        </Box>
        <Paper variant="outlined" sx={{ borderRadius: 2, p: { xs: 2, sm: 2.5 } }}>
          <Typography sx={{ fontSize: 16, fontWeight: 600, mb: 1 }}>Gizlilik ve Kullanım Onayları</Typography>
          <Typography sx={{ fontSize: 13, mb: 2 }} color="text.secondary">Başvurunun sonunda gösterilir. KVKK metnini burada düzenleyebilirsiniz.</Typography>
          <Accordion expanded={expanded === kvkk.id} onChange={(_, open) => setExpanded(open ? kvkk.id : null)} disableGutters sx={{ boxShadow: 'none', border: 1, borderColor: 'divider', '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<IconChevronDown size={18} />}><Typography sx={{ fontSize: 14, fontWeight: 500 }}>{kvkk.label}</Typography></AccordionSummary>
            <AccordionDetails><Stack spacing={2}><TextField label="Soru metni" value={kvkk.label} onChange={e => question(kvkk.id, { label: e.target.value })} inputProps={{ maxLength: 500 }} /><TextField label="KVKK aydınlatma metni" multiline minRows={8} maxRows={18} value={kvkk.help || ''} onChange={e => question(kvkk.id, { help: e.target.value })} inputProps={{ maxLength: 20000 }} /><FormControlLabel control={<Checkbox checked={form.privacy?.draft !== false} onChange={e => setForm({ ...form, privacy: { ...form.privacy, draft: e.target.checked } })} />} label="KVKK metni taslak (başvuru ekranında belirtilir)" /></Stack></AccordionDetails>
          </Accordion>
          {(form.agreements || []).map(agreement => <Box key={agreement.id} sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider', borderRadius: 0 }}><Stack direction="row" gap={1} alignItems="center"><Typography sx={{ fontSize: 13, fontWeight: 500 }}>{agreement.label}</Typography><Chip size="small" variant="outlined" label="Zorunlu" sx={{ fontSize: 11 }} /></Stack><Typography sx={{ fontSize: 12, mt: 0.75 }} color="text.secondary">{agreement.acknowledgement}</Typography></Box>)}
        </Paper>
      </Stack>
    </Box>
    <Dialog open={!!sectionDialog} onClose={() => setSectionDialog(null)} fullWidth maxWidth="sm" aria-labelledby="section-editor-title">
      <DialogTitle id="section-editor-title">{sectionDialog?.id ? 'Bölümü düzenle' : 'Yeni bölüm'}</DialogTitle>
      <DialogContent><Stack spacing={2} mt={1}><TextField autoFocus fullWidth label="Bölüm adı" value={sectionName} onChange={e => setSectionName(e.target.value)} inputProps={{ maxLength: 150 }} helperText="Örneğin: Ekip, Ürün veya Yatırım Geçmişi" /><TextField fullWidth label="Bölüm açıklaması" multiline minRows={2} value={sectionDescription} onChange={e => setSectionDescription(e.target.value)} inputProps={{ maxLength: 1000 }} helperText="İsteğe bağlı. Başvuru ekranında bölümün altında görünür." /></Stack></DialogContent>
      <DialogActions><Button sx={neutralButton} onClick={() => setSectionDialog(null)}>Vazgeç</Button><Button variant="contained" disabled={!!busy || !sectionName.trim()} onClick={commitSection}>{sectionDialog?.id ? 'Değişiklikleri uygula' : 'Bölümü oluştur'}</Button></DialogActions>
    </Dialog>
    <Dialog open={!!removeSection} onClose={() => setRemoveSection(null)}><DialogTitle>Boş bölüm silinsin mi?</DialogTitle><DialogContent><Typography>{removeSection?.title}</Typography></DialogContent><DialogActions><Button onClick={() => setRemoveSection(null)}>Vazgeç</Button><Button color="error" onClick={() => { setForm(current => ({ ...current, sections: current.sections.filter(s => s.id !== removeSection.id) })); setRemoveSection(null); setActiveSection(''); setExpanded(null); setNotice(''); }}>Bölümü sil</Button></DialogActions></Dialog>
    <Dialog open={libraryOpen} onClose={() => { if (!busy) setLibraryOpen(false); }} fullWidth maxWidth="md" aria-labelledby="draft-library-title">
      <DialogTitle id="draft-library-title">Taslaklarım</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary" mb={2}>Kaydedilen soru setlerinden birini seçerek düzenleyin. Bir taslağı açmak veya kaydetmek başvuru formunu değiştirmez.</Typography>
        {libraryError && <Alert severity="error" sx={{ mb: 2 }} action={<Button disabled={!!busy} onClick={() => showDrafts(library?.pagination.page || 1)}>Tekrar dene</Button>}>{libraryError}</Alert>}
        {busy === 'list' ? <Box py={4} textAlign="center"><CircularProgress aria-label="Taslaklar yükleniyor" /></Box> : <Stack spacing={2}>
          {library?.items.map(draft => <Box key={draft._id} sx={{ border: 1, borderColor: draft._id === selectedDraft?._id ? 'primary.main' : 'divider', borderRadius: 1, p: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ sm: 'center' }}>
              <Box sx={{ minWidth: 0, overflowWrap: 'anywhere' }}><Stack direction="row" gap={1} alignItems="center" flexWrap="wrap"><Typography fontWeight={600}>{draft.name}</Typography>{draft._id === selectedDraft?._id && <Chip size="small" label="Açık taslak" color="primary" variant="outlined" />}</Stack><Typography variant="body2" color="text.secondary">{draft.title} · {draft.questionCount} soru</Typography><Typography variant="caption" color="text.secondary">Oluşturulma: {formatDate(draft.createdAt)} · Son kayıt: {formatDate(draft.updatedAt)}</Typography></Box>
              <Button variant="outlined" disabled={!!busy} onClick={() => openDraft(draft._id)} sx={{ ...draftButton, flexShrink: 0 }} aria-label={`${draft.name} taslağını düzenle`}>Düzenle</Button>
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
      <DialogActions><Button disabled={!!busy} onClick={() => setCreateOpen(false)}>Vazgeç</Button><Button variant="contained" sx={{ bgcolor: '#087c85', '&:hover': { bgcolor: '#06666e' } }} disabled={!!busy || !newName.trim()} onClick={createDraft}>{busy === 'create' ? 'Kaydediliyor…' : 'Taslağı Oluştur'}</Button></DialogActions>
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
            {q.type !== 'consent' && <Typography fontSize={12} color="text.secondary">{answerFormats[questionFormat(q)]?.label} · {q.required ? 'Zorunlu' : 'İsteğe bağlı'}</Typography>}
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
