'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, Snackbar, Stack, TextField, Typography } from '@mui/material';
import { IconArrowLeft, IconCheck, IconChevronDown, IconDownload, IconEye, IconFileDescription } from '@tabler/icons-react';
import { entrepreneurAdminAPI, entrepreneurError } from '@/utils/api/entrepreneurs';
import { fileSize, formatDate } from './format';
import { reviewStatuses, reviewStatus } from './status';

const cardSx = { borderRadius: 2.5, borderColor: 'divider', overflow: 'hidden', boxShadow: 'none' };
const answerSx = { fontSize: 14, fontWeight: 400, lineHeight: 1.8, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' };

function Answer({ value }) {
  if (typeof value === 'boolean') return <Chip size="small" icon={value ? <IconCheck size={14} /> : undefined} label={value ? 'Onaylandı' : 'Onaylanmadı'} color={value ? 'success' : 'default'} variant="outlined" sx={{ fontSize: 12, fontWeight: 500 }} />;
  if (Array.isArray(value)) return value.length ? <Stack direction="row" gap={1} flexWrap="wrap">{value.map((item, index) => <Chip key={index} label={String(item)} variant="outlined" sx={{ height: 'auto', fontSize: 13, fontWeight: 400, '.MuiChip-label': { whiteSpace: 'normal', py: 0.75 } }} />)}</Stack> : <Typography sx={answerSx} color="text.secondary">Yanıt verilmedi.</Typography>;
  const empty = value === null || value === undefined || value === '';
  return <Typography sx={answerSx} color={empty ? 'text.secondary' : 'text.primary'}>{empty ? 'Yanıt verilmedi.' : String(value)}</Typography>;
}

function DetailSection({ title, number, description, children }) {
  return <Paper component="details" variant="outlined" sx={{ ...cardSx, '&[open] > summary': { borderBottom: 1, borderColor: 'divider' }, '&[open] > summary .sectionChevron': { transform: 'rotate(180deg)' } }}>
    <Stack component="summary" direction="row" spacing={1.5} alignItems="center" sx={{ px: { xs: 2, sm: 3 }, py: 2, bgcolor: 'grey.50', cursor: 'pointer', listStyle: 'none', '&::-webkit-details-marker': { display: 'none' }, '&:hover': { bgcolor: 'primary.light' }, '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 } }}>
      {number && <Box aria-hidden="true" sx={{ width: 30, height: 30, flexShrink: 0, display: 'grid', placeItems: 'center', borderRadius: 1.5, bgcolor: 'primary.light', color: 'primary.main', fontSize: 13, fontWeight: 600 }}>{number}</Box>}
      <Box sx={{ flex: 1, minWidth: 0 }}><Typography component="h2" sx={{ fontSize: 16, fontWeight: 600, lineHeight: 1.5, overflowWrap: 'anywhere' }}>{title}</Typography></Box>
      <Box className="sectionChevron" aria-hidden="true" sx={{ display: 'flex', flexShrink: 0, color: 'text.secondary', transition: 'transform .2s' }}><IconChevronDown size={20} /></Box>
    </Stack>
    <Box sx={{ px: { xs: 2, sm: 3 } }}>{description && <Typography sx={{ fontSize: 13, lineHeight: 1.7, pt: 2 }} color="text.secondary">{description}</Typography>}{children}</Box>
  </Paper>;
}

function AnswerRow({ label, number, children }) {
  if (number) return <Box component="details" sx={{ borderBottom: 1, borderColor: 'divider', borderRadius: 0, '&:last-child': { borderBottom: 0 }, '&[open] > summary .answerChevron': { transform: 'rotate(180deg)' } }}>
    <Stack component="summary" direction="row" spacing={1.25} alignItems="center" sx={{ py: 2, cursor: 'pointer', listStyle: 'none', '&::-webkit-details-marker': { display: 'none' }, '&:hover h3': { color: 'primary.main' }, '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 } }}>
      <Typography component="span" sx={{ color: 'text.secondary', fontSize: 11, flexShrink: 0, minWidth: 20 }}>{String(number).padStart(2, '0')}</Typography>
      <Typography component="h3" sx={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 500, lineHeight: 1.7, overflowWrap: 'anywhere' }}>{label}</Typography>
      <Box className="answerChevron" aria-hidden="true" sx={{ display: 'flex', flexShrink: 0, color: 'text.secondary', transition: 'transform .2s' }}><IconChevronDown size={17} /></Box>
    </Stack>
    <Box sx={{ minWidth: 0, pl: { xs: 0, sm: 4 }, pb: 2.25 }}>{children}</Box>
  </Box>;
  return <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 2fr)' }, gap: { xs: 1, md: 4 }, py: 2.25, borderBottom: 1, borderColor: 'divider', borderRadius: 0, '&:last-child': { borderBottom: 0 } }}>
    <Stack direction="row" spacing={1} alignItems="baseline" sx={{ minWidth: 0 }}>
      {number && <Typography component="span" sx={{ color: 'text.secondary', fontSize: 11, flexShrink: 0, minWidth: 18 }}>{String(number).padStart(2, '0')}</Typography>}
      <Typography component="h3" sx={{ fontSize: 13, fontWeight: 500, lineHeight: 1.7, overflowWrap: 'anywhere' }}>{label}</Typography>
    </Stack>
    <Box sx={{ minWidth: 0 }}>{children}</Box>
  </Box>;
}

function SummaryField({ label, children }) {
  return <Box sx={{ minWidth: 0, overflowWrap: 'anywhere' }}><Typography sx={{ fontSize: 12, mb: 0.75 }} color="text.secondary">{label}</Typography>{children}</Box>;
}

export default function EntrepreneurDetail({ id }) {
  const isSuperadmin = useSelector(state => state.auth.user?.role === 'superadmin');
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fileError, setFileError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [busyExport, setBusyExport] = useState('');
  const exportRequest = useRef(null);
  const [busyFile, setBusyFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileRequest = useRef(null);
  const previewUrl = useRef(null);
  const [reviewChoice, setReviewChoice] = useState('submitted');
  const [busyReview, setBusyReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewNotice, setReviewNotice] = useState('');
  const reviewRequest = useRef(null);

  function closePreview() {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = null;
    setPreview(null);
  }

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setApplication(null);
    closePreview();
    setFileError('');
    setBusyExport('');
    setReviewError(''); setReviewNotice(''); setBusyReview(false);
    entrepreneurAdminAPI.detail(id, controller.signal)
      .then(async data => {
        if (controller.signal.aborted) return;
        setApplication(data);
        if (isSuperadmin && data.reviewStatus === 'submitted') {
          try {
            const viewed = await entrepreneurAdminAPI.markViewed(id, data.submittedAt, controller.signal);
            if (!controller.signal.aborted) setApplication(viewed);
          } catch (err) {
            if (!controller.signal.aborted) setReviewError(await entrepreneurError(err, 'Görüntüleme bilgisi kaydedilemedi. Sayfayı yenileyin.'));
          }
        }
      })
      .catch(async err => {
        const message = await entrepreneurError(err, 'Başvuru yüklenemedi.');
        if (!controller.signal.aborted) setError(message);
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => {
      controller.abort();
      fileRequest.current?.abort();
      exportRequest.current?.abort();
      reviewRequest.current?.abort();
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    };
  }, [id, refresh, isSuperadmin]);

  useEffect(() => { if (application) setReviewChoice(application.reviewStatus); }, [application]);

  async function saveReview() {
    if (busyReview) return;
    const controller = new AbortController();
    reviewRequest.current = controller;
    setBusyReview(true); setReviewError(''); setReviewNotice('');
    try {
      const updated = await entrepreneurAdminAPI.review(id, reviewChoice, application.revision, controller.signal);
      if (controller.signal.aborted) return;
      setApplication(updated);
      setReviewNotice('Başvuru durumu güncellendi.');
    } catch (err) { if (!controller.signal.aborted) setReviewError(await entrepreneurError(err, 'Durum güncellenemedi.')); }
    finally { if (!controller.signal.aborted) setBusyReview(false); }
  }

  async function openFile(document, download = false) {
    const controller = new AbortController();
    fileRequest.current?.abort();
    fileRequest.current = controller;
    setBusyFile(document._id);
    setFileError('');
    try {
      const blob = await entrepreneurAdminAPI.document(id, document._id, controller.signal);
      if (controller.signal.aborted) return;
      const url = URL.createObjectURL(blob);
      if (download && document.mimeType !== 'application/pdf') {
        const link = window.document.createElement('a');
        link.href = url;
        link.download = document.name;
        window.document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        closePreview();
        previewUrl.current = url;
        setPreview({ ...document, url });
      }
    } catch (err) {
      const message = await entrepreneurError(err, 'Evrak açılamadı. Lütfen tekrar deneyin.');
      if (!controller.signal.aborted) setFileError(message);
    } finally {
      if (!controller.signal.aborted) setBusyFile(null);
    }
  }

  async function exportApplication(format) {
    const controller = new AbortController();
    exportRequest.current?.abort();
    exportRequest.current = controller;
    setBusyExport(format);
    setFileError('');
    try {
      const blob = await entrepreneurAdminAPI.export(id, format, controller.signal);
      if (controller.signal.aborted) return;
      const url = URL.createObjectURL(blob);
      closePreview();
      previewUrl.current = url;
      setPreview({ url, mimeType: 'application/pdf', name: `girisimci-basvurusu-${application.applicationNumber || id}.pdf` });
    } catch (err) {
      const message = await entrepreneurError(err, 'Başvuru dışa aktarılamadı. Lütfen tekrar deneyin.');
      if (!controller.signal.aborted) setFileError(message);
    } finally {
      if (!controller.signal.aborted) setBusyExport('');
    }
  }

  const questions = application?.form?.questions || [];
  const sections = application?.form?.sections || [];
  const documents = application?.documents || [];
  const kvkkQuestion = questions.find(question => question.id === 'kvkk_ack');
  const contentQuestions = questions.filter(question => question.id !== 'kvkk_ack');
  const contentSections = sections.filter(section => contentQuestions.some(question => question.section === section.id));
  const agreements = application?.form?.agreements || [];

  return <Stack spacing={2.5} sx={{ maxWidth: 1120, mx: 'auto', width: '100%' }}>
    <Box><Button component={Link} href="/entrepreneurs/list" startIcon={<IconArrowLeft size={18} />} sx={{ px: 0.5, fontSize: 13 }}>Girişimci Havuzuna Dön</Button></Box>
    {loading ? <Box py={6} textAlign="center"><CircularProgress aria-label="Başvuru yükleniyor" /></Box> : error ? <Alert severity="error" action={<Button color="inherit" onClick={() => setRefresh(value => value + 1)}>Tekrar dene</Button>}>{error}</Alert> : application && <>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" gap={1.5}>
        <Typography sx={{ fontSize: 13 }} color="text.secondary">Başvuru belgesini önizleyin ve PDF olarak indirin.</Typography>
        <Stack direction="row" gap={1} flexWrap="wrap">
          <Button variant="outlined" startIcon={<IconDownload size={17} />} disabled={!!busyExport} onClick={() => exportApplication('pdf')} sx={{ color: '#2460a3', borderColor: '#c4d7ed', bgcolor: '#f6faff', '&:hover': { bgcolor: '#e9f2fd', borderColor: '#2460a3' } }}>{busyExport === 'pdf' ? 'Hazırlanıyor…' : 'PDF Önizle'}</Button>
        </Stack>
      </Stack>
      <Paper variant="outlined" sx={cardSx}>
        <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'flex-start' }} spacing={2}>
            <Box sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
              <Typography sx={{ fontSize: 11, fontWeight: 500, letterSpacing: 1, mb: 1 }} color="text.secondary">GİRİŞİMCİ BAŞVURUSU</Typography>
              <Typography component="h1" sx={{ fontSize: { xs: 22, sm: 26 }, fontWeight: 600, lineHeight: 1.4 }}>{application.contact?.ventureName || application.answers?.venture_name || 'Başvuru detayı'}</Typography>
              <Typography sx={{ fontSize: 13, mt: 1 }} color="text.secondary">{contentSections.length} bölüm · {contentQuestions.length} soru · {documents.length} evrak</Typography>
            </Box>
            <Stack direction="row" gap={1} flexWrap="wrap"><Chip label={application.source === 'admin' ? 'Manuel' : 'Sistem'} size="small" color="info" variant="outlined" /><Chip label={reviewStatus(application).label} size="small" color={reviewStatus(application).color} />{application.archivedAt && <Chip label="Havuzdan kaldırıldı" size="small" variant="outlined" />}</Stack>
          </Stack>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2.5, pt: 2.5, mt: 2.5, borderTop: 1, borderColor: 'divider', borderRadius: 0 }}>
            <SummaryField label="Başvuran"><Typography sx={{ fontSize: 14, fontWeight: 500, lineHeight: 1.7 }}>{application.contact?.name || application.applicant?.name || 'Hesap artık mevcut değil'}</Typography></SummaryField>
            <SummaryField label="İletişim"><Typography sx={{ fontSize: 14, lineHeight: 1.7 }}>{application.contact?.email || application.applicant?.email || '—'}</Typography>{(application.contact?.phone ?? application.applicant?.phone) && <Typography sx={{ fontSize: 13, mt: 0.25 }} color="text.secondary">{application.contact?.phone ?? application.applicant?.phone}</Typography>}</SummaryField>
            <SummaryField label="Başvuru Tarihi"><Typography sx={{ fontSize: 14, lineHeight: 1.7 }}>{formatDate(application.submittedAt)}</Typography></SummaryField>
          </Box>
        </Box>
        <Box sx={{ px: { xs: 2.5, sm: 3 }, py: 1.25, bgcolor: 'grey.50', borderTop: 1, borderColor: 'divider', borderRadius: 0 }}><Typography sx={{ fontSize: 11, overflowWrap: 'anywhere' }} color="text.secondary">Başvuru no: {application.applicationNumber || '—'}</Typography></Box>
      </Paper>
      {reviewError && <Alert severity="error" action={<Button color="inherit" onClick={() => setRefresh(value => value + 1)}>Yenile</Button>}>{reviewError}</Alert>}
      {reviewNotice && <Alert severity="success" onClose={() => setReviewNotice('')}>{reviewNotice}</Alert>}
      {isSuperadmin && !application.archivedAt && <Paper variant="outlined" sx={{ ...cardSx, p: 2.5 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={2} alignItems={{ sm: 'center' }}>
          <Box sx={{ flex: 1 }}><Typography fontWeight={600}>Başvuru değerlendirmesi</Typography><Typography variant="body2" color="text.secondary" mt={0.5}>Seçtiğiniz durum girişimcinin başvuru ekranında da görünür.</Typography></Box>
          <TextField select size="small" label="Durum" value={reviewChoice} onChange={event => setReviewChoice(event.target.value)} disabled={busyReview} sx={{ minWidth: 180 }}>
            {Object.entries(reviewStatuses).map(([value, status]) => <MenuItem key={value} value={value} disabled={['submitted', 'viewed'].includes(value)}>{status.label}</MenuItem>)}
          </TextField>
          <Button variant="contained" disabled={busyReview || reviewChoice === application.reviewStatus || ['submitted', 'viewed'].includes(reviewChoice)} onClick={saveReview}>{busyReview ? 'Kaydediliyor…' : 'Durumu Kaydet'}</Button>
        </Stack>
      </Paper>}
      {!!application.previousVersions?.length && <Paper variant="outlined" sx={{ ...cardSx, px: { xs: 2, sm: 3 }, py: 2 }}><Box component="details" sx={{ '& summary': { fontSize: 13, fontWeight: 500, cursor: 'pointer' } }}><summary>Önceki örnek form yanıtları</summary>{application.previousVersions.map((snapshot, index) => <Box key={index} mt={2}>{snapshot.form.questions.filter(q => q.type !== 'file' && snapshot.answers?.[q.id] !== undefined).map(q => <AnswerRow key={q.id} label={q.label}><Answer value={snapshot.answers[q.id]} /></AnswerRow>)}</Box>)}</Box></Paper>}
      {contentSections.map((section, sectionIndex) => <DetailSection key={`${application._id}:${section.id}`} title={section.title} number={sectionIndex + 1} description={section.description}>
          {contentQuestions.filter(question => question.section === section.id).map(question => <AnswerRow key={question.id} label={question.label} number={contentQuestions.indexOf(question) + 1}>
            {question.type === 'file' ? <Stack spacing={1}>
              {documents.filter(document => document.questionId === question.id).map(document => <Stack key={document._id} direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={1} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1.5 }}>
                <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}><Box sx={{ color: 'text.secondary', display: 'flex', flexShrink: 0 }}><IconFileDescription size={22} /></Box><Box sx={{ overflowWrap: 'anywhere', minWidth: 0 }}><Typography sx={{ fontSize: 13, lineHeight: 1.6 }}>{document.name}</Typography><Typography sx={{ fontSize: 11, mt: 0.25 }} color="text.secondary">{fileSize(document.size)}</Typography></Box></Stack>
                <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                  <Button size="small" startIcon={<IconEye size={18} />} disabled={!!busyFile} onClick={() => openFile(document)} aria-label={`${document.name} evrakını görüntüle`}>{busyFile === document._id ? 'Yükleniyor…' : 'Görüntüle'}</Button>
                  <Button size="small" startIcon={<IconDownload size={18} />} disabled={!!busyFile} onClick={() => openFile(document, true)} aria-label={`${document.name} evrakını indir`}>İndir</Button>
                </Stack>
              </Stack>)}
              {!documents.some(document => document.questionId === question.id) && <Typography sx={answerSx} color="text.secondary">Evrak eklenmedi.</Typography>}
            </Stack> : <Answer value={application.answers?.[question.id]} />}
          </AnswerRow>)}
      </DetailSection>)}
      {(kvkkQuestion || agreements.length > 0) && <DetailSection key={`${application._id}:privacy`} title="Gizlilik ve Kullanım Onayları">
        {kvkkQuestion && <AnswerRow label={kvkkQuestion.label}>
          <Answer value={application.answers?.[kvkkQuestion.id]} />
          {application.privacy && <Typography sx={{ fontSize: 11, mt: 1, lineHeight: 1.7 }} color="text.secondary">Onay tarihi: {formatDate(application.privacy.acknowledgedAt)}</Typography>}
        </AnswerRow>}
        {agreements.map(agreement => {
          const proof = application.privacy?.agreements?.find(item => item.id === agreement.id);
          return <AnswerRow key={agreement.id} label={<Box component="a" href={agreement.url} target="_blank" rel="noopener noreferrer" sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>{agreement.label}</Box>}>
            <Answer value={application.answers?.[agreement.id]} />
            <Typography sx={{ fontSize: 13, mt: 1, lineHeight: 1.7 }} color="text.secondary">{proof?.acknowledgement || agreement.acknowledgement}</Typography>
            {proof && <Typography sx={{ fontSize: 11, mt: 0.75, lineHeight: 1.7 }} color="text.secondary">Onay tarihi: {formatDate(proof.acceptedAt)}</Typography>}
          </AnswerRow>;
        })}
      </DetailSection>}
    </>}
    <Snackbar open={!!fileError} onClose={() => setFileError('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}><Alert severity="error" onClose={() => setFileError('')}>{fileError}</Alert></Snackbar>
    <Dialog open={!!preview} onClose={closePreview} fullWidth maxWidth="lg" aria-labelledby="entrepreneur-document-title">
      <DialogTitle id="entrepreneur-document-title" sx={{ overflowWrap: 'anywhere' }}>{preview?.name}</DialogTitle>
      <DialogContent>
        {preview?.mimeType === 'application/pdf' ? <Box component="iframe" title={preview.name} src={preview.url} sx={{ width: '100%', height: '65vh', border: 0 }} /> : preview && <Box component="img" src={preview.url} alt={preview.name} sx={{ display: 'block', maxWidth: '100%', maxHeight: '65vh', mx: 'auto', objectFit: 'contain' }} />}
        <Typography variant="body2" color="text.secondary" mt={1}>Önizleme açılmazsa evrakı indirerek inceleyebilirsiniz.</Typography>
      </DialogContent>
      <DialogActions><Button variant="contained" component="a" href={preview?.url} download={preview?.name} startIcon={<IconDownload size={18} />}>İndir</Button><Button onClick={closePreview}>Kapat</Button></DialogActions>
    </Dialog>
  </Stack>;
}
