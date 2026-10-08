'use client';

import { useEffect, useRef, useState } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Chip, CircularProgress, Stack, Step, StepLabel, Stepper, Typography } from '@mui/material';
import { IconChevronDown, IconDownload, IconFileSpreadsheet, IconUpload, IconX } from '@tabler/icons-react';
import { entrepreneurAdminAPI, entrepreneurError } from '@/utils/api/entrepreneurs';

export default function EntrepreneurFileImport({ busy, reviewed, onReview, onReset }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [working, setWorking] = useState('');
  const [error, setError] = useState('');
  const controller = useRef(null);
  useEffect(() => () => controller.current?.abort(), []);

  function selectFile(next) {
    if (busy || working) return;
    setPreview(null); setError(''); onReset();
    if (next && (!/\.xlsx$/i.test(next.name) || !next.size || next.size > 10 * 1024 * 1024)) { setFile(null); setError('Doldurulmuş bir Excel (.xlsx) dosyası seçin. Dosya boyutu en fazla 10 MB olabilir.'); return; }
    setFile(next);
  }

  async function downloadTemplate() {
    setWorking('template'); setError('');
    const request = new AbortController(); controller.current = request;
    try {
      const blob = await entrepreneurAdminAPI.importTemplate(request.signal);
      if (request.signal.aborted) return;
      const url = URL.createObjectURL(blob); const link = document.createElement('a');
      link.href = url; link.download = 'girisimci-soru-seti.xlsx'; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) { if (!request.signal.aborted) setError(await entrepreneurError(err, 'Excel şablonu indirilemedi.')); }
    finally { if (!request.signal.aborted) setWorking(''); }
  }

  async function readFile() {
    setWorking('preview'); setError('');
    const request = new AbortController(); controller.current = request;
    try {
      const data = await entrepreneurAdminAPI.importPreview(file, request.signal);
      if (request.signal.aborted) return;
      setPreview(data);
      if (data.status === 'review') onReview(data);
    } catch (err) { if (!request.signal.aborted) setError(await entrepreneurError(err, 'Excel dosyası aktarılamadı.')); }
    finally { if (!request.signal.aborted) setWorking(''); }
  }

  const locked = busy || !!working;
  return <Stack spacing={2}>
    <Stepper activeStep={preview?.status === 'review' ? reviewed ? 2 : 1 : 0} alternativeLabel sx={{ mb: 1 }}>
      {['Dosya seç', 'Bilgileri kontrol et', 'Havuza ekle'].map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
    </Stepper>
    <Box sx={{ p: 2.5, border: '1px dashed', borderColor: 'primary.light', bgcolor: 'primary.light', borderRadius: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between">
        <Box><Typography fontWeight={600}>Doldurulmuş soru setini aktarın</Typography><Typography variant="body2" color="text.secondary" mt={0.5}>Güncel Excel şablonunun Yanıt sütununu doldurun. Soru ve bölüm adlarını koruyun.</Typography></Box>
        <Button variant="outlined" onClick={downloadTemplate} disabled={locked} startIcon={working === 'template' ? <CircularProgress size={16} /> : <IconDownload size={18} />} sx={{ whiteSpace: 'nowrap' }}>Excel şablonunu indir</Button>
      </Stack>
      <Stack direction="row" spacing={1} mt={2} alignItems="center" flexWrap="wrap" useFlexGap>
        <Button component="label" variant="contained" disabled={locked} startIcon={<IconFileSpreadsheet size={18} />}>Dosya seç<input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden onChange={event => { selectFile(event.target.files?.[0] || null); event.target.value = ''; }} /></Button>
        <Typography variant="caption" color="text.secondary">Excel (.xlsx) · En fazla 10 MB · Tek girişimci</Typography>
      </Stack>
    </Box>
    {file && <Stack direction="row" alignItems="center" spacing={1} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2 }}><IconFileSpreadsheet size={24} /><Box flex={1} minWidth={0}><Typography fontWeight={600} sx={{ overflowWrap: 'anywhere' }}>{file.name}</Typography><Typography variant="caption" color="text.secondary">{(file.size / 1024).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} KB</Typography></Box><Button onClick={() => selectFile(null)} disabled={locked} startIcon={<IconX size={16} />}>Kaldır</Button></Stack>}
    {error && <Alert severity="error">{error}</Alert>}
    {file && !preview && <Button variant="outlined" onClick={readFile} disabled={locked} startIcon={working === 'preview' ? <CircularProgress size={16} /> : <IconUpload size={18} />} sx={{ alignSelf: 'flex-start' }}>{working === 'preview' ? 'Sorular ve yanıtlar eşleştiriliyor…' : 'Dosyayı aktar ve bilgileri kontrol et'}</Button>}
    {preview?.status === 'awaiting_format' && <Alert severity="info">{preview.message}</Alert>}
    {preview?.status === 'review' && <>
      <Alert severity="success">{preview.matches.length} soru yanıtı eşleşti. Aşağıdaki kişi bilgilerini ve yanıtları kontrol edip gerekli düzeltmeleri yapın. Henüz kayıt oluşturulmadı.</Alert>
      {!!preview.issues.length && <Accordion variant="outlined" disableGutters sx={{ '&:before': { display: 'none' } }}><AccordionSummary expandIcon={<IconChevronDown size={18} />}><Stack direction="row" spacing={1} alignItems="center"><Typography fontWeight={600}>Kontrol gereken alanlar</Typography><Chip label={preview.issues.length} color="warning" size="small" /></Stack></AccordionSummary><AccordionDetails><Stack spacing={1.5}>{preview.issues.map((issue, i) => <Box key={i}><Typography variant="body2" fontWeight={600}>{issue.label}</Typography><Typography variant="body2" color="text.secondary">{issue.reason}</Typography></Box>)}</Stack></AccordionDetails></Accordion>}
    </>}
  </Stack>;
}
