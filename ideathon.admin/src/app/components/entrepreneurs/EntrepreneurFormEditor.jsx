'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Accordion, AccordionSummary, AccordionDetails, Alert, Box, Button, Checkbox, Chip, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, FormControlLabel, IconButton, Radio, RadioGroup, Pagination, Paper, Stack, Tab, Tabs, TextField, Typography, alpha } from '@mui/material';
import { IconChevronDown, IconArrowUp, IconArrowDown, IconPlus, IconTrash, IconFolders, IconEye, IconDeviceFloppy, IconSend, IconDownload, IconRefresh, IconArrowLeft, IconPencil, IconHistory, IconFileText } from '@tabler/icons-react';
import { entrepreneurAdminAPI, entrepreneurError } from '@/utils/api/entrepreneurs';
import EntrepreneurQuestionEditor, { answerFormats, questionFormat, withFormat } from './EntrepreneurQuestionEditor';
import EntrepreneurSectionList from './EntrepreneurSectionList';
import EntrepreneurQuestionList from './EntrepreneurQuestionList';
import { formatDate } from './format';

const neutralButton = { color: '#526174', borderColor: '#dbe2ea', bgcolor: 'transparent', '&:hover': { color: '#526174', bgcolor: '#f3f6f9', borderColor: '#a8b4c3' } };
const draftButton = { color: '#7152a3', borderColor: '#ded3ee', bgcolor: '#faf7fe', '&:hover': { bgcolor: '#f0e9fa', borderColor: '#b29acd' } };
const copyButton = { color: '#087c85', borderColor: '#b8dfe1', bgcolor: '#f0fafa', '&:hover': { bgcolor: '#e0f3f4', borderColor: '#70b9bf' } };
const publishButton = { bgcolor: '#168061', color: '#fff', boxShadow: 'none', '&:hover': { bgcolor: '#11684f', boxShadow: 'none' } };
const widgetAccents = { drafts: '#6676ad', sections: '#328f88', questions: '#3c85bd', privacy: '#b28b43' };
const widgetStyle = accent => ({ border: 1, borderColor: 'divider', borderLeft: `4px solid ${accent}`, borderRadius: 2, bgcolor: 'background.paper', boxShadow: '0 3px 14px rgba(30,50,70,.05)' });
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
  const [publishConfirm, setPublishConfirm] = useState(false);
  const [editingHeading, setEditingHeading] = useState(null);
  const [headingBeforeEdit, setHeadingBeforeEdit] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [activeSection, setActiveSection] = useState('');
  const [sectionDialog, setSectionDialog] = useState(null);
  const [sectionName, setSectionName] = useState('');
  const [sectionDescription, setSectionDescription] = useState('');
  const [removeSection, setRemoveSection] = useState(null);
  const [removeId, setRemoveId] = useState(null);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [sourceRevision, setSourceRevision] = useState(null);
  const [draftName, setDraftName] = useState('');
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [library, setLibrary] = useState(null);
  const [libraryError, setLibraryError] = useState('');
  const [libraryView, setLibraryView] = useState('active');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [createError, setCreateError] = useState('');
  const [saveMode, setSaveMode] = useState('version');
  const [publishAfterSave, setPublishAfterSave] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState(null);
  const [historyError, setHistoryError] = useState('');
  const [publicationsOpen, setPublicationsOpen] = useState(false);
  const [publications, setPublications] = useState(null);
  const [publicationsError, setPublicationsError] = useState('');
  const dirty = !!form && JSON.stringify({ name: draftName, form }) !== saved;
  const publication = settings?.publication;
  const publicationLabel = item => item?.draftId ? `${item.draftName} · Sürüm ${item.draftRevision + 1}` : item?.title || settings?.active.title;
  const isPublishedDraft = draft => !!publication?.draftId && String(publication.draftId) === String(draft?._id);

  function adoptDraft(draft, preservePosition = false) {
    setSelectedDraft(draft); setDraftName(draft.name); setForm(copy(draft.form)); setEditingHeading(null);
    setSourceRevision(draft.revision);
    setSaved(JSON.stringify({ name: draft.name, form: draft.form })); setValidationIssue(null);
    if (!preservePosition || !draft.form.questions.some(q => q.id === expanded)) setExpanded(null);
    if (!preservePosition || !draft.form.sections.some(s => s.id === activeSection)) setActiveSection(draft.form.sections.find(s => s.id !== draft.form.questions.find(q => q.id === 'kvkk_ack')?.section)?.id || '');
  }
  useEffect(() => {
    const controller = new AbortController();
    entrepreneurAdminAPI.form(controller.signal)
      .then(data => { if (!controller.signal.aborted) setSettings(data); })
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
  function editHeading(field) {
    setHeadingBeforeEdit(field === 'name' ? draftName : form.title);
    setEditingHeading(field);
  }
  function changeHeading(field, value) {
    if (field === 'name') setDraftName(value);
    else setForm(current => ({ ...current, title: value }));
    setNotice('');
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
    return { ...form, sections, questions: sections.flatMap(section => questions.filter(q => q.section === section.id)) };
  }
  function revealIssue(issue) {
    if (!form.title.trim() || !draftName.trim()) editHeading(!draftName.trim() ? 'name' : 'title');
    if (issue.question) { setActiveSection(issue.question.section); setExpanded(issue.question.id); }
    setValidationIssue(issue); setError(issue.message);
  }
  function reorderQuestion(id, targetId) {
    if (busy) return;
    setForm(current => {
      const source = current.questions.find(q => q.id === id);
      const target = current.questions.find(q => q.id === targetId);
      if (!source || !target || source.type === 'consent' || target.type === 'consent' || source.section !== target.section) return current;
      const siblings = current.questions.filter(q => q.section === source.section && q.type !== 'consent');
      const from = siblings.findIndex(q => q.id === id), to = siblings.findIndex(q => q.id === targetId);
      siblings.splice(to, 0, siblings.splice(from, 1)[0]);
      let index = 0;
      return { ...current, questions: current.questions.map(q => q.section === source.section && q.type !== 'consent' ? siblings[index++] : q) };
    });
    setNotice('');
  }
  function move(id, delta) {
    const source = form.questions.find(q => q.id === id);
    const siblings = form.questions.filter(q => q.section === source.section && q.type !== 'consent');
    const target = siblings[siblings.findIndex(q => q.id === id) + delta];
    if (target) reorderQuestion(id, target.id);
  }
  function startBlank() {
    if (dirty && !window.confirm('Kaydedilmemiş değişiklikler bırakılıp boş bir taslak açılsın mı?')) return;
    const base = copy(settings.active);
    const consent = base.questions.find(q => q.id === 'kvkk_ack');
    const blank = { ...base, title: 'Girişimci Başvurusu', description: '', sections: [{ id: consent.section, title: 'Gizlilik ve Kullanım Onayları', description: '' }], questions: [consent] };
    delete blank.version;
    setSelectedDraft(null); setDraftName(''); setForm(blank); setSaved('');
    setSourceRevision(null);
    setActiveSection(''); setExpanded(null); setEditingHeading('name'); setHeadingBeforeEdit(''); setValidationIssue(null); setError('');
    setNotice('Boş taslağınız hazır. Taslağa ad verin, ilk bölümünüzü ve sorularınızı ekleyin.');
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
        selectedDraft ? entrepreneurAdminAPI.formDraft(selectedDraft._id) : Promise.resolve(null),
      ]);
      setSettings(data);
      if (draft) adoptDraft(draft);
      else { setForm(null); setDraftName(''); setSaved(''); setExpanded(null); setActiveSection(''); }
      setNotice('');
    }
    catch (err) { setError(await entrepreneurError(err, 'Soru seti yüklenemedi.')); }
    finally { setBusy(''); }
  }
  function beginSave(publish = false) {
    try { preparedForm(); } catch (issue) { revealIssue(issue); return; }
    if (publish && selectedDraft && !dirty) { setError(''); setPublishConfirm(true); return; }
    setSaveMode(selectedDraft && dirty ? 'version' : 'copy');
    setNewName(selectedDraft ? `${draftName.slice(0, 140)} — Kopya` : draftName);
    setCreateError(''); setPublishAfterSave(publish); setCreateOpen(true);
  }
  async function publishSaved() {
    setBusy('publish'); setError(''); setNotice('');
    try {
      const result = await entrepreneurAdminAPI.publishFormDraft(selectedDraft._id, selectedDraft.revision, settings.revision);
      setSettings(result.settings); setPublishConfirm(false);
      setNotice('Soru seti yayımlandı. Yeni başvurular bu sürümle açılacak.');
    } catch (err) { setError(await entrepreneurError(err, 'Soru seti yayımlanamadı.')); }
    finally { setBusy(''); }
  }
  async function showHistory(page = 1) {
    setHistoryOpen(true); setBusy('history'); setHistoryError(''); setHistory(null);
    try { setHistory(await entrepreneurAdminAPI.formDraftVersions(selectedDraft._id, page)); }
    catch (err) { setHistoryError(await entrepreneurError(err, 'Sürümler yüklenemedi.')); }
    finally { setBusy(''); }
  }
  async function loadVersion(revision) {
    if (dirty && !window.confirm('Kaydedilmemiş değişiklikler bırakılıp seçilen sürüm düzenlemeye alınsın mı?')) return;
    setBusy('version'); setHistoryError('');
    try {
      const { draft, version } = await entrepreneurAdminAPI.formDraftVersion(selectedDraft._id, revision);
      adoptDraft(draft); setForm(copy(version.form)); setDraftName(version.name);
      setSourceRevision(version.revision);
      setActiveSection(version.form.sections.find(s => s.id !== version.form.questions.find(q => q.id === 'kvkk_ack').section)?.id || '');
      setExpanded(null); setHistoryOpen(false); setError('');
      setNotice(`Sürüm ${version.revision + 1} düzenlemeye alındı. Formu Kaydet ile yeni sürüm veya ayrı taslak olarak saklayabilirsiniz.`);
    } catch (err) { setHistoryError(await entrepreneurError(err, 'Sürüm açılamadı.')); }
    finally { setBusy(''); }
  }
  async function showDrafts(page = 1, view = 'active') {
    setLibraryOpen(true); setLibraryView(view); setLibrary(null); setBusy('list'); setLibraryError('');
    try {
      const [data, drafts] = await Promise.all([entrepreneurAdminAPI.form(), entrepreneurAdminAPI.formDrafts(page, undefined, view)]);
      setSettings(data); setLibrary(drafts);
    }
    catch (err) { setLibraryError(await entrepreneurError(err, 'Taslaklar yüklenemedi.')); }
    finally { setBusy(''); }
  }
  async function showPublications(page = 1) {
    setPublicationsOpen(true); setBusy('publications'); setPublicationsError(''); setPublications(null);
    try {
      const [data, records] = await Promise.all([entrepreneurAdminAPI.form(), entrepreneurAdminAPI.formPublications(page)]);
      setSettings(data); setPublications(records);
    } catch (err) { setPublicationsError(await entrepreneurError(err, 'Yayın geçmişi yüklenemedi.')); }
    finally { setBusy(''); }
  }
  async function restoreDraft(draft) {
    setBusy('restore'); setLibraryError('');
    try {
      await entrepreneurAdminAPI.restoreFormDraft(draft._id, draft.revision, draft.deletedAt);
      await showDrafts(1, 'deleted');
      setNotice('Form geri alındı. Taslaklar sekmesinden seçerek düzenleyebilirsiniz.');
    } catch (err) { setLibraryError(await entrepreneurError(err, 'Form geri alınamadı.')); }
    finally { setBusy(''); }
  }
  async function deleteForm() {
    setBusy('delete'); setDeleteError('');
    try {
      if (selectedDraft) await entrepreneurAdminAPI.deleteFormDraft(selectedDraft._id, selectedDraft.revision);
      setForm(null); setSelectedDraft(null); setDraftName(''); setSaved(''); setEditingHeading(null);
      setSourceRevision(null);
      setActiveSection(''); setExpanded(null); setHistory(null); setValidationIssue(null); setError('');
      setDeleteConfirm(false);
      setNotice(selectedDraft ? 'Form silindi. Taslaklarım → Silinenler bölümünden geri alabilirsiniz.' : 'Kaydedilmemiş form kapatıldı.');
    } catch (err) { setDeleteError(await entrepreneurError(err, 'Form silinemedi.')); }
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
  async function saveForm() {
    let content;
    try { content = preparedForm(); } catch (issue) { setCreateOpen(false); revealIssue(issue); return; }
    if (selectedDraft && saveMode === 'version' && !dirty) {
      setCreateOpen(false); setNotice('Kaydedilecek değişiklik yok.'); return;
    }
    setBusy('save'); setCreateError('');
    try {
      const create = !selectedDraft || saveMode === 'copy';
      const draft = create
        ? await entrepreneurAdminAPI.createFormDraft(newName, content)
        : dirty ? await entrepreneurAdminAPI.saveFormDraft(selectedDraft._id, draftName, content, selectedDraft.revision) : selectedDraft;
      adoptDraft(draft, true); setCreateOpen(false); setError('');
      setNotice(create ? 'Yeni taslak kaydedildi.' : draft.revision === selectedDraft.revision ? 'Kaydedilecek değişiklik yok.' : `Form sürüm ${draft.revision + 1} olarak kaydedildi. Önceki sürümler Sürüm Geçmişi’nde korunur.`);
      if (publishAfterSave) setPublishConfirm(true);
    } catch (err) { setCreateError(await entrepreneurError(err, 'Form kaydedilemedi.')); }
    finally { setBusy(''); }
  }

  if (loading) return <Box p={6} textAlign="center"><CircularProgress aria-label="Soru seti yükleniyor" /></Box>;
  if (!settings) return <Alert severity="error" action={<Button onClick={reload} disabled={!!busy}>Tekrar dene</Button>}>{error}</Alert>;
  const kvkk = form?.questions.find(item => item.id === 'kvkk_ack');
  const privacySection = kvkk?.section;
  const contentQuestions = form?.questions.filter(q => q.type !== 'consent') || [];
  const editableSections = form?.sections.filter(s => s.id !== privacySection || contentQuestions.some(q => q.section === s.id)) || [];
  const currentSection = editableSections.find(s => s.id === activeSection) || editableSections[0];
  const items = contentQuestions.filter(q => q.section === currentSection?.id);
  const movableSections = editableSections.filter(s => s.id !== privacySection);
  const sectionIndex = movableSections.findIndex(s => s.id === currentSection?.id);

  return <Stack spacing={3}>
    <Stack direction={{ xs: 'column', md: 'row' }} gap={2} justifyContent="space-between" alignItems={{ md: 'flex-end' }}><Box><Button component={Link} href="/entrepreneurs/list" startIcon={<IconArrowLeft size={17} />} sx={neutralButton}>Girişimci Havuzuna Dön</Button><Typography variant="h4" component="h1" mt={1} sx={{ fontSize: { xs: 24, sm: 26 }, fontWeight: 700, lineHeight: 1.3 }}>Soru setini düzenleyin</Typography></Box>
      <Stack direction="row" gap={1} flexWrap="wrap" sx={{ flexShrink: 0, alignSelf: { xs: 'flex-end', md: 'auto' } }}>
        <Button variant="outlined" sx={draftButton} startIcon={<IconFolders size={18} />} disabled={!!busy} onClick={() => showDrafts()}>Taslaklarım</Button>
        <Button variant="outlined" sx={copyButton} startIcon={<IconPlus size={18} />} disabled={!!busy} onClick={startBlank}>Yeni Taslak</Button>
      </Stack>
    </Stack>
    <Typography sx={{ fontSize: 13, lineHeight: 1.8 }} color="text.secondary">Taslaklarım’dan bir form seçin veya Yeni Taslak ile başlayın. Düzenlediğiniz formu kaydedip hazır olduğunda yayımlayın.</Typography>
    <Paper variant="outlined" sx={{ px: 2, py: 1.5, borderRadius: 2 }} aria-label="Yayımdaki soru seti">
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} justifyContent="space-between" alignItems={{ sm: 'center' }}>
        <Box sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
          <Typography fontSize={13} fontWeight={600}>Yayında: {publicationLabel(publication)}</Typography>
          <Typography fontSize={12} color="text.secondary">{settings.publishedAt ? `Yayın tarihi: ${formatDate(settings.publishedAt)}` : 'Başlangıç soru seti kullanılıyor.'}{settings.publishedAt && !publication?.draftId ? ' · Kaynak taslak ve sürüm bilgisi kaydedilmemiş.' : ''}</Typography>
        </Box>
        <Button size="small" sx={neutralButton} startIcon={<IconHistory size={15} />} disabled={!!busy} onClick={() => showPublications()}>Yayın Geçmişi</Button>
      </Stack>
    </Paper>
    {error && <Alert severity="error">{error}</Alert>}
    {notice && <Alert severity={notice === 'Kaydedilecek değişiklik yok.' ? 'info' : 'success'}>{notice}</Alert>}
    <Dialog open={publicationsOpen} onClose={() => { if (!busy) setPublicationsOpen(false); }} fullWidth maxWidth="sm" aria-labelledby="publication-history-title">
      <DialogTitle id="publication-history-title">Yayın Geçmişi</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary" fontSize={13} mb={2}>Yayımlama anındaki taslak adı ve sürümü korunur. Eski yayınlar için daha önce tutulmamış kaynak bilgileri gösterilemez.</Typography>
        {publicationsError && <Alert severity="error" action={<Button disabled={!!busy} onClick={() => showPublications()}>Tekrar dene</Button>}>{publicationsError}</Alert>}
        {busy === 'publications' ? <Box py={3} textAlign="center"><CircularProgress /></Box> : <Stack spacing={1.5}>
          {publications?.items.map(item => <Paper key={item._id} variant="outlined" sx={{ p: 2 }}><Stack direction="row" gap={1} alignItems="center" flexWrap="wrap"><Typography fontWeight={600}>{publicationLabel(item)}</Typography>{item.isCurrent && <Chip size="small" color="success" label="Yayında" />}</Stack><Typography fontSize={12} color="text.secondary">{formatDate(item.publishedAt)}{!item.draftId ? ' · Kaynak taslak ve sürüm bilgisi kaydedilmemiş.' : ''}</Typography></Paper>)}
          {publications && !publications.items.length && <Typography>Henüz yayın kaydı yok. Başlangıç soru seti kullanılıyor.</Typography>}
          {publications?.pagination.pages > 1 && <Pagination count={publications.pagination.pages} page={publications.pagination.page} disabled={!!busy} onChange={(_, page) => showPublications(page)} />}
        </Stack>}
      </DialogContent><DialogActions><Button disabled={!!busy} onClick={() => setPublicationsOpen(false)}>Kapat</Button></DialogActions>
    </Dialog>
    <Dialog open={libraryOpen} onClose={() => { if (!busy) setLibraryOpen(false); }} fullWidth maxWidth="md" aria-labelledby="draft-library-title">
      <DialogTitle id="draft-library-title">Taslaklarım</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary" mb={2}>{libraryView === 'deleted' ? 'Silinen formları kayıtlı içerikleri ve sürüm geçmişleriyle geri alabilirsiniz.' : 'Kaydedilen soru setlerinden birini seçerek düzenleyin. Bir taslağı açmak veya kaydetmek başvuru formunu değiştirmez.'}</Typography>
        <Tabs value={libraryView} onChange={(_, view) => showDrafts(1, view)} aria-label="Taslak listesi görünümü" sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Tab value="active" label="Taslaklar" disabled={!!busy} /><Tab value="deleted" label="Silinenler" disabled={!!busy} />
        </Tabs>
        {libraryError && <Alert severity="error" sx={{ mb: 2 }} action={<Button disabled={!!busy} onClick={() => showDrafts(library?.pagination.page || 1, libraryView)}>Tekrar dene</Button>}>{libraryError}</Alert>}
        {busy === 'list' ? <Box py={4} textAlign="center"><CircularProgress aria-label="Taslaklar yükleniyor" /></Box> : <Stack spacing={2}>
          {library?.items.map(draft => <Box key={draft._id} sx={{ border: 1, borderColor: draft._id === selectedDraft?._id ? 'primary.main' : 'divider', borderRadius: 1, p: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ sm: 'center' }}>
              <Box sx={{ minWidth: 0, overflowWrap: 'anywhere' }}><Stack direction="row" gap={1} alignItems="center" flexWrap="wrap"><Typography fontWeight={600}>{draft.name}</Typography>{draft._id === selectedDraft?._id && <Chip size="small" label="Açık taslak" color="primary" variant="outlined" />}{isPublishedDraft(draft) && <Chip size="small" color="success" variant="outlined" label={`Yayında · Sürüm ${publication.draftRevision + 1}`} />}</Stack><Typography variant="body2" color="text.secondary">{draft.title} · {draft.questionCount} soru · Sürüm {draft.revision + 1}</Typography><Typography variant="caption" color="text.secondary">Oluşturulma: {formatDate(draft.createdAt)} · Son kayıt: {formatDate(draft.updatedAt)}</Typography></Box>
              {libraryView === 'deleted'
                ? <Button variant="outlined" disabled={!!busy} onClick={() => restoreDraft(draft)} sx={{ ...copyButton, flexShrink: 0 }} aria-label={`${draft.name} formunu geri al`}>Geri Al</Button>
                : <Button variant="outlined" disabled={!!busy} onClick={() => openDraft(draft._id)} sx={{ ...draftButton, flexShrink: 0 }} aria-label={`${draft.name} taslağını düzenle`}>Düzenle</Button>}
            </Stack>
          </Box>)}
          {library && !library.items.length && <Typography>{libraryView === 'deleted' ? 'Silinen form bulunmuyor.' : 'Bu sayfada kayıtlı taslak yok.'}</Typography>}
          {library?.pagination.pages > 1 && <Pagination count={library.pagination.pages} page={library.pagination.page} disabled={!!busy} onChange={(_, page) => showDrafts(page, libraryView)} />}
        </Stack>}
      </DialogContent>
      <DialogActions><Button disabled={!!busy} onClick={() => setLibraryOpen(false)}>Kapat</Button></DialogActions>
    </Dialog>
    {!form && <Box sx={{ py: { xs: 6, md: 10 }, textAlign: 'center', color: 'text.secondary' }}>
      <IconFolders size={40} stroke={1.4} color="#8c9caf" />
      <Typography component="h2" sx={{ mt: 2, fontSize: 19, fontWeight: 600, color: 'text.primary' }}>Düzenlemek için bir taslak seçin</Typography>
      <Typography sx={{ mt: 1, fontSize: 14 }}>Kayıtlı formlarınız Taslaklarım’da. Sıfırdan hazırlamak için Yeni Taslak’ı kullanın.</Typography>
    </Box>}
    {form && <>
    <Dialog open={deleteConfirm} onClose={() => { if (!busy) setDeleteConfirm(false); }} fullWidth maxWidth="sm" aria-labelledby="delete-form-title">
      <DialogTitle id="delete-form-title">Form silinsin mi?</DialogTitle>
      <DialogContent>
        <Typography fontWeight={600} mb={1}>{draftName.trim() || 'Yeni taslak'}</Typography>
        <Typography color="text.secondary">{selectedDraft ? 'Form taslak listenizden kaldırılacak. Son kaydedilen içeriği ve sürüm geçmişini Taslaklarım → Silinenler bölümünden geri alabilirsiniz.' : 'Bu form henüz kaydedilmedi. Eklediğiniz bölümler ve sorular bırakılacak, taslak seçim ekranına döneceksiniz.'}</Typography>
        {selectedDraft && dirty && <Typography color="text.secondary" mt={1}>Kaydedilmemiş değişiklikler saklanmayacak.</Typography>}
        {selectedDraft && <Typography fontSize={13} color="text.secondary" mt={2}>Yayımdaki soru seti ve mevcut başvurular etkilenmez.</Typography>}
        {deleteError && <Alert severity="error" sx={{ mt: 2 }}>{deleteError}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}><Button disabled={!!busy} sx={neutralButton} onClick={() => setDeleteConfirm(false)}>Düzenlemeye Devam Et</Button><Button variant="contained" color="error" disabled={!!busy} onClick={deleteForm}>{busy === 'delete' ? 'Siliniyor…' : 'Formu Sil'}</Button></DialogActions>
    </Dialog>
    <Dialog open={publishConfirm} onClose={() => { if (!busy) setPublishConfirm(false); }} fullWidth maxWidth="xs" aria-labelledby="publish-confirm-title">
      <DialogTitle id="publish-confirm-title">Soru setini yayımla</DialogTitle>
      <DialogContent><Typography fontWeight={600} mb={1}>{selectedDraft?.name} · Sürüm {(selectedDraft?.revision ?? 0) + 1}</Typography><Typography>Bu sürüm yayımlanacak ve yeni başvurularda kullanılacak.</Typography><Typography color="text.secondary" fontSize={13} mt={2}>Yerine geçeceği yayın: {publicationLabel(publication)}. Başlamış ve gönderilmiş başvurular korunur.</Typography>{error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}</DialogContent>
      <DialogActions><Button disabled={!!busy} onClick={() => setPublishConfirm(false)}>Vazgeç</Button><Button variant="contained" sx={publishButton} disabled={!!busy} onClick={publishSaved}>{busy === 'publish' ? 'Yayımlanıyor…' : 'Onayla ve Yayımla'}</Button></DialogActions>
    </Dialog>
    <Paper component="section" aria-label="Form kayıt ve yayın işlemleri" variant="outlined" sx={{ ...widgetStyle(widgetAccents.drafts), position: { xs: 'static', sm: 'sticky' }, top: 70, zIndex: 5, overflow: 'hidden', borderRadius: 2.5 }}>
      <Stack direction={{ xs: 'column', lg: 'row' }} gap={2} alignItems={{ lg: 'center' }} justifyContent="space-between" sx={{ px: { xs: 2, sm: 2.5 }, py: 2 }}>
        <Stack direction="row" gap={1.5} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
          <Box sx={{ display: 'grid', placeItems: 'center', width: 44, height: 48, flexShrink: 0, borderRadius: 1.5, bgcolor: alpha(widgetAccents.drafts, 0.09), color: widgetAccents.drafts }}><IconFileText size={24} stroke={1.6} aria-hidden="true" /></Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap" sx={{ mb: 0.5 }}>
              <Typography sx={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.7, color: 'text.secondary' }}>DÜZENLENEN TASLAK</Typography>
              {selectedDraft && <Chip size="small" label={`Kaynak: Sürüm ${sourceRevision + 1}`} sx={{ height: 20, fontSize: 10, fontWeight: 500, bgcolor: '#f0f3f8', color: '#526174', '& .MuiChip-label': { px: 0.9 } }} />}
              {selectedDraft && sourceRevision !== selectedDraft.revision && <Chip size="small" label={`Son kayıt: Sürüm ${selectedDraft.revision + 1}`} variant="outlined" />}
              {isPublishedDraft(selectedDraft) && <Chip size="small" color="success" variant="outlined" label={`Yayındaki sürüm: ${publication.draftRevision + 1}`} />}
            </Stack>
            {[{ field: 'name', label: 'Taslak adı', action: 'Taslak adını düzenle', value: draftName, limit: 150 }, { field: 'title', label: 'Form başlığı', action: 'Form başlığını düzenle', value: form.title, limit: 200 }].map(({ field, label, action, value, limit }) => <Box key={field} data-form-heading={field} data-value={value} sx={{ mt: field === 'title' ? 0.25 : 0 }}>
              {editingHeading === field ? <TextField autoFocus fullWidth size="small" label={label} value={value} disabled={!!busy} onChange={event => changeHeading(field, event.target.value)}
                inputProps={{ maxLength: limit }} sx={{ my: 0.75, maxWidth: 580 }}
                error={!value.trim()} helperText={!value.trim() ? `${label} boş bırakılamaz.` : field === 'name' ? 'Yalnızca yönetimde görünür. Enter ile tamamlayın.' : 'Başvuru ekranında görünen başlık. Enter ile tamamlayın.'}
                onBlur={() => { if (value.trim()) setEditingHeading(null); }}
                onKeyDown={event => {
                  if (event.key === 'Enter' && !event.nativeEvent.isComposing) { event.preventDefault(); if (value.trim()) setEditingHeading(null); }
                  if (event.key === 'Escape') { event.preventDefault(); changeHeading(field, headingBeforeEdit); setEditingHeading(null); }
                }} /> : <Stack direction="row" gap={0.75} alignItems="center">
                  <Typography sx={{ fontSize: field === 'name' ? { xs: 15, sm: 17 } : 13, fontWeight: field === 'name' ? 600 : 400, color: field === 'name' ? 'text.primary' : 'text.secondary', lineHeight: 1.6, overflowWrap: 'anywhere', minWidth: 0 }}>{value.trim() || (field === 'name' ? 'Taslak adını yazın' : 'Form başlığını yazın')}</Typography>
                  <IconButton size="small" aria-label={action} title={action} disabled={!!busy} onClick={() => editHeading(field)} sx={{ color: '#8190a3', flexShrink: 0, p: 0.5, '&:hover': { color: '#4266a1', bgcolor: '#edf3fc' } }}><IconPencil size={15} /></IconButton>
                </Stack>}
            </Box>)}
            <Stack direction="row" gap={0.75} alignItems="center" sx={{ mt: 0.5 }}>
              <Box aria-hidden="true" sx={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, bgcolor: dirty ? '#ba8528' : '#328675' }} />
              <Typography sx={{ fontSize: 11, color: dirty ? '#95691e' : '#53796e' }}>{dirty ? 'Kaydedilmemiş değişiklikler' : 'Taslak güncel'}</Typography>
            </Stack>
            {selectedDraft && dirty && <Typography fontSize={11} color="text.secondary" mt={0.5}>Mevcut taslağa kaydederseniz Sürüm {selectedDraft.revision + 2} oluşacak. Ayrı taslak olarak kaydederseniz Sürüm 1 ile başlayacak.</Typography>}
          </Box>
        </Stack>
        <Stack direction="row" gap={1} flexWrap="wrap" sx={{ flexShrink: 0, '& .MuiButton-root': { minHeight: 38, px: 1.75, borderRadius: 1.5, fontSize: 12 } }}>
          <Button variant="outlined" sx={neutralButton} startIcon={<IconEye size={17} />} disabled={!!busy} onClick={() => setPreview(true)}>Önizle</Button>
          <Button variant="contained" startIcon={<IconDeviceFloppy size={17} />} sx={{ boxShadow: 'none', '&:hover': { boxShadow: 'none' } }} disabled={!!busy} onClick={() => beginSave(false)}>{busy === 'save' ? 'Kaydediliyor…' : 'Formu Kaydet'}</Button>
          <Button variant="contained" sx={publishButton} startIcon={<IconSend size={17} />} disabled={!!busy} onClick={() => beginSave(true)}>{busy === 'publish' ? 'Yayımlanıyor…' : 'Yayımla'}</Button>
        </Stack>
      </Stack>
      <Stack direction={{ xs: 'column', md: 'row' }} gap={1} alignItems={{ md: 'center' }} justifyContent="space-between" sx={{ px: { xs: 2, sm: 2.5 }, py: 0.75, bgcolor: '#f8fafd', borderTop: 1, borderColor: '#e9edf4' }}>
        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{selectedDraft ? `Son kayıt: ${formatDate(selectedDraft.updatedAt)}` : 'Hazır olduğunuzda formunuzu kaydedin.'}</Typography>
        <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ '& .MuiButton-root': { fontSize: 11, minHeight: 30, px: 1, borderRadius: 1 } }}>
          <Button size="small" sx={neutralButton} startIcon={<IconHistory size={15} />} disabled={!!busy || !selectedDraft} onClick={() => showHistory()}>Sürüm Geçmişi</Button>
          <Button size="small" sx={neutralButton} startIcon={<IconDownload size={15} />} disabled={!!busy} onClick={download}>Taslağı indir</Button>
          <Button size="small" sx={neutralButton} startIcon={<IconRefresh size={15} />} disabled={!!busy} onClick={reload}>Güncel taslağı yükle</Button>
          <Button size="small" color="error" sx={{ bgcolor: 'transparent', '&:hover': { color: 'error.dark', bgcolor: '#fff0f0' } }} startIcon={<IconTrash size={15} />} disabled={!!busy} onClick={() => { setDeleteError(''); setDeleteConfirm(true); }}>Formu Sil</Button>
        </Stack>
      </Stack>
    </Paper>
    <Box component="fieldset" disabled={!!busy} sx={{ border: 0, m: 0, p: 0, minWidth: 0 }}>
      <Stack spacing={3}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '230px minmax(0, 1fr)' }, gap: 2.5, alignItems: 'start' }}>
          <Paper component="nav" aria-label="Soru seti bölümleri" variant="outlined" sx={{ ...widgetStyle(widgetAccents.sections), p: 1.5 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, px: 1, mb: 0.75, color: widgetAccents.sections }}>BÖLÜMLER</Typography>
            <Typography sx={{ fontSize: 11, px: 1, mb: 1.5, lineHeight: 1.6 }} color="text.secondary">Tutamacı sürükleyerek sıralayın.</Typography>
            <EntrepreneurSectionList sections={editableSections} selectedId={currentSection?.id} fixedId={privacySection} questions={contentQuestions} disabled={!!busy}
              onSelect={id => { setActiveSection(id); setExpanded(null); }} onReorder={reorderSection} />
            <Button fullWidth variant="outlined" startIcon={<IconPlus size={16} />} sx={{ ...copyButton, mt: 2 }} disabled={form.sections.length >= 20} onClick={() => editSection()}>Bölüm ekle</Button>
          </Paper>
          <Paper variant="outlined" sx={{ ...widgetStyle(widgetAccents.questions), p: { xs: 2, sm: 2.5 }, minWidth: 0 }}>
            {currentSection ? <Stack spacing={2.5}>
              <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} justifyContent="space-between" alignItems={{ sm: 'flex-start' }}>
                <Box sx={{ minWidth: 0 }}><Typography component="h2" sx={{ fontSize: 18, fontWeight: 600, overflowWrap: 'anywhere' }}>{currentSection.title}</Typography><Typography sx={{ fontSize: 12, mt: 0.75 }} color="text.secondary">{editableSections.findIndex(s => s.id === currentSection.id) + 1}. bölüm · {items.length} soru · Tutamaçla sıralayın, düzenlemek için soruya tıklayın.</Typography>{currentSection.description && <Typography sx={{ fontSize: 13, mt: 1, lineHeight: 1.7 }} color="text.secondary">{currentSection.description}</Typography>}</Box>
                <Button variant="outlined" size="small" startIcon={<IconPencil size={16} />} sx={{ ...neutralButton, flexShrink: 0 }} onClick={() => editSection(currentSection)}>Bölümü düzenle</Button>
              </Stack>
              <EntrepreneurQuestionList questions={items} disabled={!!busy} onReorder={reorderQuestion}>{(item, index) => <EntrepreneurQuestionEditor key={item.id} question={item} index={index} total={items.length} expanded={expanded === item.id} onExpand={open => setExpanded(open ? item.id : null)} onChange={changes => {
                question(item.id, changes);
                if (changes.section) setActiveSection(changes.section);
              }} onFormat={format => changeType(item, format)} onMove={delta => move(item.id, delta)} onRemove={() => setRemoveId(item.id)} sections={editableSections} disabled={!!busy} errorMessage={validationIssue?.question?.id === item.id ? validationIssue.message : undefined} />}</EntrepreneurQuestionList>
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
        <Paper variant="outlined" sx={{ ...widgetStyle(widgetAccents.privacy), p: { xs: 2, sm: 2.5 } }}>
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
    <Dialog open={createOpen} onClose={() => { if (!busy) setCreateOpen(false); }} fullWidth maxWidth="sm" aria-labelledby="save-form-title">
      <DialogTitle id="save-form-title">Formu Kaydet</DialogTitle>
      <DialogContent>
        {selectedDraft ? <>
          <Typography color="text.secondary" mb={2}>Değişiklikleri nasıl saklamak istersiniz?</Typography>
          {!dirty && <Alert severity="info" sx={{ mb: 2 }}>Kaydedilecek değişiklik yok. İsterseniz aynı içerikten ayrı bir taslak oluşturabilirsiniz.</Alert>}
          <RadioGroup value={saveMode} onChange={event => setSaveMode(event.target.value)} aria-label="Form kayıt seçeneği">
            <FormControlLabel value="version" disabled={!dirty} control={<Radio />} label={<Box py={1}><Typography fontWeight={600}>Mevcut taslağın yeni sürümü</Typography><Typography fontSize={13} color="text.secondary">{dirty ? `${draftName} · Sürüm ${selectedDraft.revision + 2} olarak kaydedilir. Önceki sürümler korunur.` : 'Yeni sürüm oluşturmak için içeriği veya taslak adını değiştirin.'}</Typography></Box>} />
            <FormControlLabel value="copy" control={<Radio />} label={<Box py={1}><Typography fontWeight={600}>Yeni taslak olarak kaydet</Typography><Typography fontSize={13} color="text.secondary">Bu içerik ayrı bir taslağa kaydedilir. Önceki taslak korunur.</Typography></Box>} />
          </RadioGroup>
        </> : <Typography color="text.secondary" mb={2}>Hazırladığınız formu taslaklarınıza kaydedin.</Typography>}
        {(!selectedDraft || saveMode === 'copy') && <TextField autoFocus fullWidth sx={{ mt: 2 }} label="Yeni taslak adı" value={newName} onChange={event => setNewName(event.target.value)} inputProps={{ maxLength: 150 }} />}
        <Typography fontSize={12} color="text.secondary" mt={2}>Başvuru formuna yansıtmak için ayrıca Yayımla adımını kullanın.</Typography>
        {createError && <Alert severity="error" sx={{ mt: 2 }}>{createError}</Alert>}
      </DialogContent>
      <DialogActions><Button disabled={!!busy} onClick={() => setCreateOpen(false)}>Vazgeç</Button><Button variant="contained" disabled={!!busy || ((!selectedDraft || saveMode === 'copy') && !newName.trim())} onClick={saveForm}>{busy === 'save' ? 'Kaydediliyor…' : 'Kaydet'}</Button></DialogActions>
    </Dialog>
    <Dialog open={historyOpen} onClose={() => { if (!busy) setHistoryOpen(false); }} fullWidth maxWidth="sm" aria-labelledby="version-history-title">
      <DialogTitle id="version-history-title">Sürüm Geçmişi</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary" mb={2}>{selectedDraft?.name} · Bir sürümü açıp düzenlemeye alabilirsiniz.</Typography>
        {historyError && <Alert severity="error" sx={{ mb: 2 }} action={<Button disabled={!!busy} onClick={() => showHistory()}>Tekrar dene</Button>}>{historyError}</Alert>}
        {busy === 'history' ? <Box py={3} textAlign="center"><CircularProgress /></Box> : <Stack gap={1.5}>
          {history?.items.map(version => <Paper key={version.revision} variant="outlined" sx={{ p: 2 }}><Stack direction="row" gap={2} alignItems="center" justifyContent="space-between"><Box><Typography fontWeight={600}>Sürüm {version.revision + 1}{version.isCurrent ? ' · Güncel' : ''}{isPublishedDraft(selectedDraft) && publication.draftRevision === version.revision ? ' · Yayında' : ''}</Typography><Typography fontSize={12} color="text.secondary">{formatDate(version.savedAt)} · {version.questionCount} soru</Typography></Box><Button variant="outlined" disabled={!!busy} onClick={() => loadVersion(version.revision)}>Düzenlemeye al</Button></Stack></Paper>)}
          {history?.pagination.pages > 1 && <Pagination count={history.pagination.pages} page={history.pagination.page} disabled={!!busy} onChange={(_, page) => showHistory(page)} />}
        </Stack>}
      </DialogContent><DialogActions><Button disabled={!!busy} onClick={() => setHistoryOpen(false)}>Kapat</Button></DialogActions>
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
    </>}
  </Stack>;
}
