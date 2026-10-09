'use client';

import { useEffect, useState } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, CircularProgress, Pagination, Stack, Typography } from '@mui/material';
import { IconChevronDown } from '@tabler/icons-react';
import { entrepreneurAdminAPI, entrepreneurError } from '@/utils/api/entrepreneurs';
import { formatDate } from './format';

export default function EntrepreneurDraftVersions({ draft, publication, busy, onOpen }) {
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  function beginLoading() { setLoading(true); setHistory(null); setError(''); }

  useEffect(() => {
    if (!expanded) return;
    const controller = new AbortController();
    setLoading(true); setHistory(null); setError('');
    entrepreneurAdminAPI.formDraftVersions(draft._id, page, controller.signal)
      .then(data => { if (!controller.signal.aborted) setHistory(data); })
      .catch(async err => {
        const message = await entrepreneurError(err, 'Sürümler yüklenemedi.');
        if (!controller.signal.aborted) setError(message);
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [expanded, draft._id, draft.revision, page, retry]);

  return <Accordion expanded={expanded} onChange={(_, open) => { setExpanded(open); setPage(1); setHistory(null); setError(''); setLoading(open); }} disabled={busy} disableGutters elevation={0} sx={{ mt: 2, borderTop: 1, borderColor: 'divider', '&:before': { display: 'none' } }}>
    <AccordionSummary expandIcon={<IconChevronDown size={18} />} id={`draft-versions-toggle-${draft._id}`} aria-controls={`draft-versions-${draft._id}`} aria-label={`${draft.name} sürümleri`} sx={{ px: 0, minHeight: 40 }}>
      <Typography variant="body2" fontWeight={600}>Sürümler</Typography>
    </AccordionSummary>
    <AccordionDetails sx={{ px: 0, pb: 0 }}>
      {loading && <Box py={2} textAlign="center"><CircularProgress size={24} aria-label="Sürümler yükleniyor" /></Box>}
      {error && <Alert severity="error" action={<Button disabled={busy} onClick={() => { beginLoading(); setRetry(value => value + 1); }}>Tekrar dene</Button>}>{error}</Alert>}
      {!loading && !error && <Stack spacing={1}>
        {history?.items.map(version => <Box key={version.revision} sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} justifyContent="space-between" alignItems={{ sm: 'center' }}>
            <Box sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
              <Typography variant="body2" fontWeight={600}>Sürüm {version.revision + 1}{version.isCurrent ? ' · Güncel' : ''}{String(publication?.draftId) === String(draft._id) && publication?.draftRevision === version.revision ? ' · Yayında' : ''}</Typography>
              <Typography variant="body2" color="text.secondary">{version.name}</Typography>
              <Typography variant="caption" color="text.secondary">{formatDate(version.savedAt)} · {version.questionCount} soru</Typography>
            </Box>
            <Button variant="outlined" size="small" disabled={busy} sx={{ flexShrink: 0 }} aria-label={`${draft.name} Sürüm ${version.revision + 1} düzenlemeye al`} onClick={() => onOpen(version.revision, draft._id, true)}>Düzenlemeye al</Button>
          </Stack>
        </Box>)}
        {history?.pagination.pages > 1 && <Pagination count={history.pagination.pages} page={history.pagination.page} disabled={busy} onChange={(_, value) => { beginLoading(); setPage(value); }} aria-label={`${draft.name} sürüm sayfaları`} />}
      </Stack>}
    </AccordionDetails>
  </Accordion>;
}
