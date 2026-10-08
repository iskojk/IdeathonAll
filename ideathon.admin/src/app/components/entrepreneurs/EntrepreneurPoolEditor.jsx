'use client';

import { useEffect, useState } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Alert, Autocomplete, Box, Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, MenuItem, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import { IconChevronDown, IconDeviceFloppy } from '@tabler/icons-react';
import { entrepreneurAdminAPI, entrepreneurError } from '@/utils/api/entrepreneurs';
import EntrepreneurFileImport from './EntrepreneurFileImport';

const identityIds = new Set(['full_name', 'first_name', 'last_name', 'email', 'phone', 'venture_name']);
const contactFrom = application => ({
  name: application.contact?.name || application.answers?.full_name || [application.answers?.first_name, application.answers?.last_name].filter(Boolean).join(' ') || application.applicant?.name || '',
  email: application.contact?.email || application.answers?.email || application.applicant?.email || '',
  phone: application.contact?.phone ?? application.answers?.phone ?? application.applicant?.phone ?? '',
  ventureName: application.contact?.ventureName || application.answers?.venture_name || '',
});

export default function EntrepreneurPoolEditor({ id, onClose, onSaved }) {
  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [contact, setContact] = useState({ name: '', email: '', phone: '', ventureName: '' });
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [linkAccount, setLinkAccount] = useState(false);
  const [account, setAccount] = useState(null);
  const [accountQuery, setAccountQuery] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [accountLoading, setAccountLoading] = useState(false);
  const [mode, setMode] = useState('manual');
  const [importReview, setImportReview] = useState(null);
  const [reviewed, setReviewed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    (id ? entrepreneurAdminAPI.detail(id, controller.signal) : entrepreneurAdminAPI.entryForm(controller.signal))
      .then(data => {
        if (controller.signal.aborted) return;
        setForm(id ? data.form : data);
        if (id) { setContact(contactFrom(data)); setAnswers(data.answers || {}); setRevision(data.revision); }
      })
      .catch(async err => { const message = await entrepreneurError(err, 'Kayıt yüklenemedi.'); if (!controller.signal.aborted) setError(message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    if (!linkAccount) return;
    const controller = new AbortController();
    setAccountLoading(true);
    const timer = setTimeout(() => {
      entrepreneurAdminAPI.accounts(accountQuery, controller.signal)
        .then(data => { if (!controller.signal.aborted) setAccounts(data); })
        .catch(async err => { const message = await entrepreneurError(err, 'Kullanıcılar yüklenemedi.'); if (!controller.signal.aborted) setError(message); })
        .finally(() => { if (!controller.signal.aborted) setAccountLoading(false); });
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [linkAccount, accountQuery]);

  const fields = (form?.questions || []).filter(q => !['file', 'consent'].includes(q.type) && q.id !== 'kvkk_ack' && !(identityIds.has(q.id) && ['text', 'textarea'].includes(q.type)));
  function changeContact(key, value) { setContact(current => ({ ...current, [key]: value })); setErrors(current => ({ ...current, [key]: '' })); }
  function changeAnswer(key, value) { setAnswers(current => ({ ...current, [key]: value })); setErrors(current => ({ ...current, [key]: '' })); }

  async function save(event) {
    event.preventDefault();
    if (busy || !form) return;
    if (mode === 'import' && (!importReview || !reviewed)) { setError('Önce dosyayı aktarın ve bilgileri kontrol ettiğinizi işaretleyin.'); return; }
    if (linkAccount && !account) { setError('Bağlanacak kullanıcı hesabını seçin veya hesap bağlama seçeneğini kapatın.'); return; }
    setBusy(true); setError(''); setErrors({});
    const editable = (form.questions || []).filter(q => !['file', 'consent'].includes(q.type) && q.id !== 'kvkk_ack');
    const patch = Object.fromEntries(editable.filter(q => Object.hasOwn(answers, q.id)).map(q => [q.id, answers[q.id]]));
    try {
      const body = { contact, answers: patch, ...(mode === 'import' ? { entryFormVersion: importReview.form.version } : {}), ...(id ? { revision } : linkAccount && account ? { userId: account._id } : {}) };
      await (id ? entrepreneurAdminAPI.update(id, body) : entrepreneurAdminAPI.create(body));
      onSaved(id ? 'Girişimci bilgileri güncellendi.' : 'Girişimci havuza eklendi.');
    } catch (err) {
      setError(await entrepreneurError(err, 'Kayıt tamamlanamadı.'));
      const fieldErrors = err.response?.data?.errors || {};
      setErrors({ ...fieldErrors, name: fieldErrors.name || fieldErrors.full_name || fieldErrors.first_name || fieldErrors.last_name, ventureName: fieldErrors.ventureName || fieldErrors.venture_name });
    } finally { setBusy(false); }
  }

  return <Dialog open onClose={() => { if (!busy) onClose(); }} fullWidth maxWidth="md" aria-labelledby="pool-editor-title">
    <Box component="form" onSubmit={save} noValidate autoComplete="off">
      <DialogTitle id="pool-editor-title">{id ? 'Girişimciyi düzenle' : 'Girişimci ekle'}</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading ? <Box py={5} textAlign="center"><CircularProgress aria-label="Girişimci bilgileri yükleniyor" /></Box> : form && <Stack spacing={2.5}>
          {!id && <Tabs value={mode} onChange={(_, next) => { setMode(next); setImportReview(null); setReviewed(false); setError(''); setErrors({}); }} aria-label="Girişimci ekleme yöntemi" sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab value="manual" label="Manuel ekle" disabled={busy} /><Tab value="import" label="Dosya aktararak ekle" disabled={busy} />
          </Tabs>}
          {!id && mode === 'import' && <EntrepreneurFileImport busy={busy} reviewed={reviewed} onReset={() => { setImportReview(null); setReviewed(false); }} onReview={data => { setImportReview(data); setReviewed(false); setForm(data.form); setContact(data.contact); setAnswers(data.answers); setErrors({}); setLinkAccount(false); setAccount(null); }} />}
          {(mode === 'manual' || importReview) && <>
          {!id && <Box>
            <Typography color="text.secondary" variant="body2">Hesabı olmayan bir kişiyi de havuza ekleyebilirsiniz. Bu işlem kullanıcı hesabı oluşturmaz ve e-posta göndermez.</Typography>
            <FormControlLabel control={<Checkbox checked={linkAccount} disabled={busy} onChange={e => { setLinkAccount(e.target.checked); setAccount(null); }} />} label="Mevcut kullanıcı hesabına bağla" />
            {linkAccount && <Autocomplete options={accounts} value={account} loading={accountLoading} disabled={busy} filterOptions={options => options} isOptionEqualToValue={(a, b) => a._id === b._id} getOptionLabel={option => `${option.name} · ${option.email}`} noOptionsText="Uygun kullanıcı bulunamadı" loadingText="Kullanıcılar yükleniyor…" onInputChange={(_, value) => setAccountQuery(value)} onChange={(_, value) => { setAccount(value); if (value) setContact(current => ({ ...current, name: value.name, email: value.email, phone: value.phone || '' })); }} renderInput={params => <TextField {...params} label="Kullanıcı hesabı ara" helperText="Yalnızca henüz girişimci başvurusu olmayan aktif kullanıcılar listelenir." />} />}
          </Box>}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            {[['ventureName', 'Girişim adı', 200], ['name', 'Ad soyad', 150], ['email', 'E-posta', 254], ['phone', mode === 'import' && form.questions.some(q => q.id === 'phone' && q.required) ? 'Telefon' : 'Telefon (isteğe bağlı)', 30]].map(([key, label, max]) => <TextField key={key} fullWidth autoFocus={mode === 'manual' && key === 'ventureName'} label={label} required={key !== 'phone' || (mode === 'import' && form.questions.some(q => q.id === 'phone' && q.required))} value={contact[key]} disabled={busy} type={key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'} onChange={e => changeContact(key, e.target.value)} error={!!errors[key]} helperText={errors[key]} inputProps={{ maxLength: max }} />)}
          </Box>
          {!!fields.length && <Accordion defaultExpanded={mode === 'import'} disableGutters variant="outlined" sx={{ borderRadius: 2, '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<IconChevronDown size={18} />}><Box><Typography fontWeight={600}>Başvuru yanıtları</Typography><Typography variant="body2" color="text.secondary">Ek bilgileri mevcut soru setine göre düzenleyin.</Typography></Box></AccordionSummary>
            <AccordionDetails><Stack spacing={3}>
              {(form.sections || []).map(section => {
                const questions = fields.filter(q => q.section === section.id);
                if (!questions.length) return null;
                return <Stack spacing={2} key={section.id}>
                  <Typography fontWeight={600} color="primary.main">{section.title}</Typography>
                  {questions.map(q => <TextField key={q.id} fullWidth label={q.label} required={mode === 'import' && q.required} disabled={busy} select={['singleChoice', 'multipleChoice'].includes(q.type)} multiline={q.type === 'textarea'} minRows={q.type === 'textarea' ? 3 : undefined} type={q.type === 'text' && ['email', 'tel', 'url', 'date', 'number'].includes(q.inputType) ? q.inputType : 'text'} value={answers[q.id] ?? (q.type === 'multipleChoice' ? [] : '')} onChange={e => changeAnswer(q.id, e.target.value)} error={!!errors[q.id]} helperText={errors[q.id] || (q.inputType === 'date' ? 'İsteğe bağlı tarih' : q.help || ' ')} inputProps={{ maxLength: q.maxLength || 5000 }} InputLabelProps={q.inputType === 'date' ? { shrink: true } : undefined} SelectProps={q.type === 'multipleChoice' ? { multiple: true } : undefined}>
                    {['singleChoice', 'multipleChoice'].includes(q.type) && [...(q.type === 'singleChoice' ? [<MenuItem key="empty" value="">Yanıt yok</MenuItem>] : []), ...(q.options || []).map(option => <MenuItem key={option} value={option}>{option}</MenuItem>)]}
                  </TextField>)}
                </Stack>;
              })}
            </Stack></AccordionDetails>
          </Accordion>}
          <Typography variant="body2" color="text.secondary">Kullanıcı hesabı, evraklar ve mevcut gizlilik onayları bu ekrandan değiştirilmez.</Typography>
          {mode === 'import' && <FormControlLabel control={<Checkbox checked={reviewed} disabled={busy} onChange={event => setReviewed(event.target.checked)} />} label="Kişi bilgilerini ve aktarılan yanıtları kontrol ettim." />}
          </>}
        </Stack>}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}><Button onClick={onClose} disabled={busy}>Vazgeç</Button><Button type="submit" variant="contained" disabled={busy || loading || !form || (mode === 'import' && (!importReview || !reviewed))} startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <IconDeviceFloppy size={18} />}>{busy ? 'Kaydediliyor…' : id ? 'Değişiklikleri kaydet' : 'Havuza ekle'}</Button></DialogActions>
    </Box>
  </Dialog>;
}
