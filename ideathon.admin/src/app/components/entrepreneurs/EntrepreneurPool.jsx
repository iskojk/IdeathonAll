'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { Alert, Box, Button, CardContent, Chip, CircularProgress, InputAdornment, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography } from '@mui/material';
import { IconEye, IconRefresh, IconSearch } from '@tabler/icons-react';
import BlankCard from '@/app/components/shared/BlankCard';
import { entrepreneurAdminAPI, entrepreneurError } from '@/utils/api/entrepreneurs';
import { formatDate } from './format';

export default function EntrepreneurPool() {
  const user = useSelector(state => state.auth.user);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [sort, setSort] = useState('newest');
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState({ data: [], pagination: { total: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    entrepreneurAdminAPI.list({ page: page + 1, limit, search: query, sort }, controller.signal)
      .then(data => { if (!controller.signal.aborted) setResult(data); })
      .catch(async err => {
        const message = await entrepreneurError(err, 'Başvurular yüklenemedi.');
        if (!controller.signal.aborted) setError(message);
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, limit, query, sort, refresh]);

  function applySearch(event) {
    event.preventDefault();
    setPage(0);
    setQuery(search.trim());
  }

  return <Stack spacing={3}>
    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} alignItems={{ sm: 'center' }}>
      <Box>
        <Typography variant="h4" component="h1">Girişimci Havuzu</Typography>
        <Typography color="text.secondary" mt={1}>Gönderilen tüm girişimci başvuruları burada toplanır. Bu havuz Ideathon seçiminden bağımsızdır.</Typography>
      </Box>
      {user?.role === 'superadmin' && <Button component={Link} href="/entrepreneurs/form" variant="outlined">Soru Setini Düzenle</Button>}
      <Button startIcon={<IconRefresh size={18} />} onClick={() => setRefresh(value => value + 1)} disabled={loading}>Yenile</Button>
    </Stack>
    <BlankCard><CardContent>
      <Stack component="form" onSubmit={applySearch} direction={{ xs: 'column', md: 'row' }} spacing={2} mb={3}>
        <TextField label="Girişim, ad soyad veya e-posta ara" size="small" fullWidth value={search} onChange={event => setSearch(event.target.value)} slotProps={{ htmlInput: { maxLength: 150 }, input: { startAdornment: <InputAdornment position="start"><IconSearch size={18} /></InputAdornment> } }} />
        <Button type="submit" variant="contained" sx={{ minWidth: 80 }}>Ara</Button>
        {query && <Button onClick={() => { setSearch(''); setQuery(''); setPage(0); }}>Temizle</Button>}
        <TextField select label="Sıralama" size="small" value={sort} onChange={event => { setSort(event.target.value); setPage(0); }} sx={{ minWidth: 180 }}>
          <MenuItem value="newest">En yeni başvuru</MenuItem><MenuItem value="oldest">En eski başvuru</MenuItem>
        </TextField>
      </Stack>
      {error ? <Alert severity="error" action={<Button color="inherit" onClick={() => setRefresh(value => value + 1)}>Tekrar dene</Button>}>{error}</Alert> : loading ? <Box py={6} textAlign="center"><CircularProgress aria-label="Başvurular yükleniyor" /></Box> : <>
        <Typography variant="subtitle2" mb={2} role="status">{result.pagination.total} başvuru{query ? ' bulundu' : ''}</Typography>
        {!result.data.length ? <Alert severity="info">{query ? 'Aramanızla eşleşen bir başvuru bulunamadı.' : 'Henüz gönderilmiş başvuru yok. Girişimciler formu gönderdiğinde burada görünecek; kaydedilen taslaklar havuza alınmaz.'}</Alert> : <TableContainer>
          <Table aria-label="Girişimci başvuruları" sx={{ minWidth: 760 }}>
            <TableHead><TableRow>
              <TableCell>Girişim</TableCell><TableCell>Başvuran</TableCell><TableCell>Gönderim tarihi</TableCell><TableCell>Evrak</TableCell><TableCell>Durum</TableCell><TableCell align="right">İşlem</TableCell>
            </TableRow></TableHead>
            <TableBody>{result.data.map(application => <TableRow key={application._id} hover>
              <TableCell sx={{ maxWidth: 250, overflowWrap: 'anywhere' }}><Typography fontWeight={600}>{application.ventureName || 'Girişim başvurusu'}</Typography></TableCell>
              <TableCell sx={{ maxWidth: 260, overflowWrap: 'anywhere' }}><Typography>{application.contactName || '—'}</Typography><Typography variant="body2" color="text.secondary">{application.contactEmail || '—'}</Typography></TableCell>
              <TableCell>{formatDate(application.submittedAt)}</TableCell>
              <TableCell>{application.documentCount} dosya</TableCell>
              <TableCell><Chip size="small" color="success" label="Gönderildi" /></TableCell>
              <TableCell align="right"><Button component={Link} href={`/entrepreneurs/${application._id}`} startIcon={<IconEye size={18} />} aria-label={`${application.ventureName || application.contactName || 'Başvuru'} detaylarını görüntüle`}>Detay</Button></TableCell>
            </TableRow>)}</TableBody>
          </Table>
        </TableContainer>}
        <TablePagination component="div" count={result.pagination.total} page={page} rowsPerPage={limit} rowsPerPageOptions={[10, 25, 50]} onPageChange={(_, nextPage) => setPage(nextPage)} onRowsPerPageChange={event => { setLimit(Number(event.target.value)); setPage(0); }} labelRowsPerPage="Sayfa başına" labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`} getItemAriaLabel={type => type === 'next' ? 'Sonraki sayfa' : 'Önceki sayfa'} sx={{ '.MuiTablePagination-toolbar': { flexWrap: 'wrap', px: 0 } }} />
      </>}
    </CardContent></BlankCard>
  </Stack>;
}
