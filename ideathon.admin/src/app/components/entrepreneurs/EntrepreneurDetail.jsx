'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Alert, Box, Button, CardContent, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Snackbar, Stack, Typography } from '@mui/material';
import { IconArrowLeft, IconDownload, IconEye, IconFileDescription } from '@tabler/icons-react';
import BlankCard from '@/app/components/shared/BlankCard';
import { entrepreneurAdminAPI, entrepreneurError } from '@/utils/api/entrepreneurs';
import { fileSize, formatDate } from './format';

function Answer({ value }) {
  if (typeof value === 'boolean') return <Chip label={value ? 'Onaylandı' : 'Onaylanmadı'} color={value ? 'success' : 'default'} />;
  if (Array.isArray(value)) return value.length ? <Stack direction="row" gap={1} flexWrap="wrap">{value.map((item, index) => <Chip key={index} label={String(item)} sx={{ height: 'auto', '.MuiChip-label': { whiteSpace: 'normal', py: 0.75 } }} />)}</Stack> : <Typography color="text.secondary">Yanıt verilmedi.</Typography>;
  return <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }} color={value ? 'text.primary' : 'text.secondary'}>{value === null || value === undefined || value === '' ? 'Yanıt verilmedi.' : String(value)}</Typography>;
}

export default function EntrepreneurDetail({ id }) {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fileError, setFileError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [busyFile, setBusyFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileRequest = useRef(null);
  const previewUrl = useRef(null);

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
    setFileError('');
    entrepreneurAdminAPI.detail(id, controller.signal)
      .then(data => { if (!controller.signal.aborted) setApplication(data); })
      .catch(async err => {
        const message = await entrepreneurError(err, 'Başvuru yüklenemedi.');
        if (!controller.signal.aborted) setError(message);
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => {
      controller.abort();
      fileRequest.current?.abort();
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    };
  }, [id, refresh]);

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
      if (download) {
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

  const questions = application?.form?.questions || [];
  const sections = application?.form?.sections || [];
  const documents = application?.documents || [];

  return <Stack spacing={3}>
    <Box><Button component={Link} href="/entrepreneurs/list" startIcon={<IconArrowLeft size={18} />}>Girişimci Havuzuna Dön</Button></Box>
    {loading ? <Box py={6} textAlign="center"><CircularProgress aria-label="Başvuru yükleniyor" /></Box> : error ? <Alert severity="error" action={<Button color="inherit" onClick={() => setRefresh(value => value + 1)}>Tekrar dene</Button>}>{error}</Alert> : application && <>
      <BlankCard><CardContent>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'flex-start' }} spacing={2}>
          <Box sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
            <Typography variant="overline" color="text.secondary">Girişimci başvurusu</Typography>
            <Typography variant="h4" component="h1">{application.answers?.venture_name || 'Başvuru detayı'}</Typography>
            <Typography mt={1} color="text.secondary">Gönderim: {formatDate(application.submittedAt)}</Typography>
            <Typography variant="caption" color="text.secondary">Başvuru no: {application._id}</Typography>
          </Box>
          <Chip label="Gönderildi" color="success" sx={{ alignSelf: 'flex-start' }} />
        </Stack>
        <Divider sx={{ my: 2 }} />
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} justifyContent="space-between">
          <Box sx={{ overflowWrap: 'anywhere', minWidth: 0 }}>
            <Typography variant="subtitle2">Başvuran hesap</Typography>
            <Typography>{application.applicant?.name || 'Hesap artık mevcut değil'}</Typography>
            <Typography color="text.secondary">{application.applicant?.email}</Typography>
            {application.applicant?.phone && <Typography color="text.secondary">{application.applicant.phone}</Typography>}
          </Box>
          <Box><Typography variant="subtitle2">Başvuru içeriği</Typography><Typography>{questions.length} soru · {sections.length} bölüm · {documents.length} evrak</Typography><Typography variant="body2" color="text.secondary">Gönderilen soru ve cevaplar aşağıda korunur.</Typography></Box>
        </Stack>
      </CardContent></BlankCard>
      {!!application.previousVersions?.length && <BlankCard><CardContent><Box component="details"><summary>Önceki örnek form yanıtları</summary>{application.previousVersions.map((snapshot, index) => <Stack key={index} spacing={2} mt={2}>{snapshot.form.questions.filter(q => q.type !== 'file' && snapshot.answers?.[q.id] !== undefined).map(q => <Box key={q.id}><Typography fontWeight={600}>{q.label}</Typography><Answer value={snapshot.answers[q.id]} /></Box>)}</Stack>)}</Box></CardContent></BlankCard>}
      {sections.map((section, sectionIndex) => <BlankCard key={section.id}><CardContent>
        <Typography variant="h5" component="h2" mb={1}>{sectionIndex + 1}. {section.title}</Typography>
        {section.description && <Typography color="text.secondary" mb={2}>{section.description}</Typography>}
        <Stack spacing={3} divider={<Divider />}>
          {questions.filter(question => question.section === section.id).map(question => <Box key={question.id}>
            <Typography component="h3" variant="subtitle1" mb={1}>{questions.indexOf(question) + 1}. {question.label}</Typography>
            {question.id === 'kvkk_ack' && application.privacy && <Box mb={2}><Typography variant="caption">Onay tarihi: {formatDate(application.privacy.acknowledgedAt)} · Metin sürümü: {application.privacy.version}</Typography></Box>}
            {question.type === 'file' ? <Stack spacing={1}>
              {documents.filter(document => document.questionId === question.id).map(document => <Stack key={document._id} direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={1} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}><IconFileDescription size={22} style={{ flexShrink: 0 }} /><Box sx={{ overflowWrap: 'anywhere', minWidth: 0 }}><Typography>{document.name}</Typography><Typography variant="caption" color="text.secondary">{fileSize(document.size)}</Typography></Box></Stack>
                <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                  <Button size="small" startIcon={<IconEye size={18} />} disabled={!!busyFile} onClick={() => openFile(document)} aria-label={`${document.name} evrakını görüntüle`}>{busyFile === document._id ? 'Yükleniyor…' : 'Görüntüle'}</Button>
                  <Button size="small" startIcon={<IconDownload size={18} />} disabled={!!busyFile} onClick={() => openFile(document, true)} aria-label={`${document.name} evrakını indir`}>İndir</Button>
                </Stack>
              </Stack>)}
              {!documents.some(document => document.questionId === question.id) && <Typography color="text.secondary">Evrak eklenmedi.</Typography>}
            </Stack> : <Answer value={application.answers?.[question.id]} />}
          </Box>)}
        </Stack>
      </CardContent></BlankCard>)}
      {!!application.form.agreements?.length && <BlankCard><CardContent>
        <Typography variant="h5" component="h2" mb={2}>Gizlilik ve Kullanım Onayları</Typography>
        <Stack spacing={3}>{application.form.agreements.map(agreement => {
          const proof = application.privacy?.agreements?.find(item => item.id === agreement.id);
          return <Box key={agreement.id}>
            <Typography fontWeight={600} mb={1}><a href={agreement.url} target="_blank" rel="noopener noreferrer">{agreement.label}</a></Typography>
            <Answer value={application.answers?.[agreement.id]} />
            <Typography variant="body2" mt={1}>{proof?.acknowledgement || agreement.acknowledgement}</Typography>
            {proof && <Typography variant="caption" color="text.secondary">Onay tarihi: {formatDate(proof.acceptedAt)} · Sürüm: {proof.version}</Typography>}
          </Box>;
        })}</Stack>
      </CardContent></BlankCard>}
    </>}
    <Snackbar open={!!fileError} onClose={() => setFileError('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}><Alert severity="error" onClose={() => setFileError('')}>{fileError}</Alert></Snackbar>
    <Dialog open={!!preview} onClose={closePreview} fullWidth maxWidth="lg" aria-labelledby="entrepreneur-document-title">
      <DialogTitle id="entrepreneur-document-title" sx={{ overflowWrap: 'anywhere' }}>{preview?.name}</DialogTitle>
      <DialogContent>
        {preview?.mimeType === 'application/pdf' ? <Box component="iframe" title={preview.name} src={preview.url} sx={{ width: '100%', height: '65vh', border: 0 }} /> : preview && <Box component="img" src={preview.url} alt={preview.name} sx={{ display: 'block', maxWidth: '100%', maxHeight: '65vh', mx: 'auto', objectFit: 'contain' }} />}
        <Typography variant="body2" color="text.secondary" mt={1}>Önizleme açılmazsa evrakı indirerek inceleyebilirsiniz.</Typography>
      </DialogContent>
      <DialogActions><Button component="a" href={preview?.url} download={preview?.name} startIcon={<IconDownload size={18} />}>İndir</Button><Button onClick={closePreview}>Kapat</Button></DialogActions>
    </Dialog>
  </Stack>;
}
