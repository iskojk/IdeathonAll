'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { Alert, Autocomplete, Box, Button, CardContent, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, MenuItem, Stack, Tab, Tabs, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import { IconEye, IconPencil, IconPlus, IconRefresh, IconRestore, IconSearch, IconTrash } from '@tabler/icons-react';
import BlankCard from '@/app/components/shared/BlankCard';
import { entrepreneurAdminAPI, entrepreneurError } from '@/utils/api/entrepreneurs';
import { formatDate } from './format';
import EntrepreneurPoolEditor from './EntrepreneurPoolEditor';
import { reviewStatus } from './status';

export default function EntrepreneurPool() {
  const router = useRouter();
  const canManage = useSelector(state => state.auth.user?.role === 'superadmin');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [searchField, setSearchField] = useState('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [sort, setSort] = useState('newest');
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState({ data: [], pagination: { total: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('active');
  const [editor, setEditor] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [busyAction, setBusyAction] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const refreshPool = () => setRefresh(value => value + 1);
    window.addEventListener('focus', refreshPool);
    return () => window.removeEventListener('focus', refreshPool);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { setPage(0); setQuery(search.trim()); }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    entrepreneurAdminAPI.list({ page: page + 1, limit, search: query, searchField, sort, view }, controller.signal)
      .then(data => { if (!controller.signal.aborted) { setResult({ ...data, query, searchField, view, page }); const lastPage = Math.max(0, Math.ceil(data.pagination.total / limit) - 1); if (page > lastPage) setPage(lastPage); } })
      .catch(async err => {
        const message = await entrepreneurError(err, 'Başvurular yüklenemedi.');
        if (!controller.signal.aborted) setError(message);
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, limit, query, searchField, sort, view, refresh]);

  async function changeMembership(application, restore = false) {
    if (!canManage || busyAction) return;
    setBusyAction(application._id); setActionError(''); setNotice('');
    try {
      await (restore ? entrepreneurAdminAPI.restore(application._id, application.revision) : entrepreneurAdminAPI.archive(application._id, application.revision));
      setRemoving(null);
      setNotice(restore ? 'Girişimci yeniden havuza alındı.' : 'Girişimci havuzdan kaldırıldı. Kaldırılanlar sekmesinden geri alabilirsiniz.');
      setRefresh(value => value + 1);
    } catch (err) { setActionError(await entrepreneurError(err, 'İşlem tamamlanamadı.')); }
    finally { setBusyAction(''); }
  }

  const searchLabels = { all: 'Ad-soyad, e-posta veya girişim adı ara', name: 'Ad-soyad ara', email: 'E-posta ara', venture: 'Girişim adı ara' };
  const resultsCurrent = result.query === search.trim() && result.searchField === searchField && result.view === view && result.page === page;
  const searchPending = !error && (loading || !resultsCurrent);
  const suggestions = resultsCurrent && !loading && !error ? result.data.slice(0, 8) : [];

  return <Stack spacing={3}>
    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} alignItems={{ sm: 'center' }}>
      <Box>
        <Typography variant="h4" component="h1">Girişimci Havuzu</Typography>
        <Typography color="text.secondary" mt={1}>Girişimci kayıtlarını ve başvurularını buradan yönetin. Havuz Ideathon seçiminden bağımsızdır.</Typography>
      </Box>
      <Stack direction="row" spacing={1}>
        <Button startIcon={<IconRefresh size={18} />} onClick={() => setRefresh(value => value + 1)} disabled={loading || !!busyAction}>Yenile</Button>
        {canManage && <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={() => { setActionError(''); setEditor({}); }} disabled={!!busyAction} sx={{ whiteSpace: 'nowrap' }}>Girişimci ekle</Button>}
      </Stack>
    </Stack>
    {notice && <Alert severity="success" onClose={() => setNotice('')}>{notice}</Alert>}
    {actionError && !removing && <Alert severity="error" onClose={() => setActionError('')}>{actionError}</Alert>}
    <BlankCard><CardContent>
      <Tabs value={view} onChange={(_, next) => { setView(next); setPage(0); }} aria-label="Girişimci havuzu görünümü" sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab value="active" label="Havuz" /><Tab value="archived" label="Kaldırılanlar" />
      </Tabs>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={3} alignItems="flex-start">
        <TextField select label="Arama alanı" size="small" value={searchField} onChange={event => { setSearchField(event.target.value); setPage(0); }} sx={{ minWidth: 160, width: { xs: '100%', md: 160 } }}>
          <MenuItem value="all">Tüm alanlar</MenuItem><MenuItem value="name">Ad-soyad</MenuItem><MenuItem value="email">E-posta</MenuItem><MenuItem value="venture">Girişim adı</MenuItem>
        </TextField>
        <Autocomplete clearOnBlur={false} forcePopupIcon={false} fullWidth value={null} inputValue={search} open={searchOpen && !!search.trim()} onOpen={() => setSearchOpen(true)} onClose={() => setSearchOpen(false)} options={suggestions} filterOptions={options => options} getOptionKey={option => option._id} getOptionLabel={option => typeof option === 'string' ? option : option.ventureName || option.contactName || 'Girişimci'} loading={searchPending} loadingText="Eşleşen kayıtlar aranıyor…" noOptionsText={error ? 'Arama tamamlanamadı. Tekrar deneyin.' : 'Eşleşen kayıt bulunamadı.'} onInputChange={(_, value, reason) => { if (reason === 'input' || reason === 'clear') { setSearch(value.slice(0, 150)); setSearchOpen(reason !== 'clear'); } }} onChange={(_, option) => { if (option && typeof option !== 'string') router.push(`/entrepreneurs/${option._id}`); }} renderOption={(props, option) => {
          const { key, ...optionProps } = props;
          return <Box component="li" key={key} {...optionProps} sx={{ '&:not(:last-child)': { borderBottom: 1, borderColor: 'divider' }, py: '10px !important' }}><Box sx={{ minWidth: 0, overflowWrap: 'anywhere' }}><Typography fontWeight={600}>{option.ventureName || 'Girişim başvurusu'}</Typography><Typography variant="body2" color="text.secondary">{option.contactName || '—'} · {option.contactEmail || option.applicant?.email || '—'}</Typography>{searchField === 'email' && option.applicant?.email && option.applicant.email !== option.contactEmail && <Typography variant="caption" color="text.secondary">Kayıtlı e-posta: {option.applicant.email}</Typography>}</Box></Box>;
        }} renderInput={params => <TextField {...params} label={searchLabels[searchField]} size="small" helperText="Yazarken sonuçlar güncellenir. Bir kayıt seçerek detayını açabilirsiniz." inputProps={{ ...params.inputProps, maxLength: 150 }} InputProps={{ ...params.InputProps, startAdornment: <InputAdornment position="start"><IconSearch size={18} /></InputAdornment>, endAdornment: <>{searchPending && search.trim() ? <CircularProgress size={16} /> : null}{params.InputProps.endAdornment}</> }} />} sx={{ minWidth: 0 }} />
        <TextField select label="Sıralama" size="small" value={sort} onChange={event => { setSort(event.target.value); setPage(0); }} sx={{ minWidth: 180 }}>
          <MenuItem value="newest">En yeni başvuru</MenuItem><MenuItem value="oldest">En eski başvuru</MenuItem>
        </TextField>
      </Stack>
      {error ? <Alert severity="error" action={<Button color="inherit" onClick={() => setRefresh(value => value + 1)}>Tekrar dene</Button>}>{error}</Alert> : loading ? <Box py={6} textAlign="center"><CircularProgress aria-label="Başvurular yükleniyor" /></Box> : <>
        <Typography variant="subtitle2" mb={2} role="status">{result.pagination.total} kayıt{query ? ' bulundu' : ''}</Typography>
        {!result.data.length ? <Alert severity="info">{query ? 'Aramanızla eşleşen bir girişimci bulunamadı.' : view === 'archived' ? 'Havuzdan kaldırılmış girişimci yok.' : 'Henüz havuzda girişimci yok. Yeni bir kayıt ekleyebilir veya gönderilen başvuruları burada görebilirsiniz.'}</Alert> : <TableContainer>
          <Table aria-label="Girişimci başvuruları" sx={{ minWidth: 960 }}>
            <TableHead><TableRow>
              <TableCell>Girişim Adı</TableCell><TableCell>Başvuran</TableCell><TableCell sx={{ whiteSpace: 'nowrap' }}>Başvuru Tarihi</TableCell><TableCell>Evrak</TableCell><TableCell align="center" sx={{ width: 130, whiteSpace: 'nowrap' }}>Başvuru Türü</TableCell><TableCell align="center" sx={{ width: 140, whiteSpace: 'nowrap' }}>Durum</TableCell><TableCell align="center" sx={{ width: 170, whiteSpace: 'nowrap' }}>İşlem</TableCell>
            </TableRow></TableHead>
            <TableBody>{result.data.map(application => <TableRow key={application._id} hover>
              <TableCell sx={{ maxWidth: 250, overflowWrap: 'anywhere' }}><Typography fontWeight={600}>{application.ventureName || 'Girişim başvurusu'}</Typography><Typography variant="caption" color="text.secondary">{application.applicationNumber}</Typography></TableCell>
              <TableCell sx={{ maxWidth: 260, overflowWrap: 'anywhere' }}><Typography>{application.contactName || '—'}</Typography><Typography variant="body2" color="text.secondary">{application.contactEmail || '—'}</Typography></TableCell>
              <TableCell>{formatDate(application.submittedAt)}</TableCell>
              <TableCell>{application.documentCount} dosya</TableCell>
              <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}><Chip size="small" variant="outlined" color={application.source === 'admin' ? 'secondary' : 'info'} label={application.source === 'admin' ? 'Manuel' : 'Sistem'} sx={{ minWidth: 82, fontWeight: 500 }} /></TableCell>
              <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}><Chip size="small" color={reviewStatus(application).color} label={reviewStatus(application).label} sx={{ minWidth: 104, fontWeight: 500 }} /></TableCell>
              <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}><Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
                <Button component={Link} href={`/entrepreneurs/${application._id}`} size="small" startIcon={<IconEye size={17} />} sx={{ minWidth: 74 }} aria-label={`${application.ventureName || application.contactName || 'Başvuru'} detaylarını görüntüle`}>Detay</Button>
                {canManage && (view === 'active' ? <>
                  <Tooltip title="Düzenle"><span><IconButton size="small" disabled={!!busyAction} onClick={() => setEditor({ id: application._id })} aria-label={`${application.ventureName || 'Girişimci'} bilgilerini düzenle`} sx={{ color: 'primary.main' }}><IconPencil size={18} /></IconButton></span></Tooltip>
                  <Tooltip title="Havuzdan kaldır"><span><IconButton size="small" disabled={!!busyAction} onClick={() => { setActionError(''); setRemoving(application); }} aria-label={`${application.ventureName || 'Girişimci'} kaydını havuzdan kaldır`} sx={{ color: 'error.main' }}><IconTrash size={18} /></IconButton></span></Tooltip>
                </> : <Tooltip title="Havuza geri al"><span><IconButton size="small" disabled={!!busyAction} onClick={() => changeMembership(application, true)} aria-label={`${application.ventureName || 'Girişimci'} kaydını havuza geri al`} sx={{ color: 'success.main' }}>{busyAction === application._id ? <CircularProgress size={18} /> : <IconRestore size={18} />}</IconButton></span></Tooltip>)}
              </Stack></TableCell>
            </TableRow>)}</TableBody>
          </Table>
        </TableContainer>}
        <TablePagination component="div" count={result.pagination.total} page={page} rowsPerPage={limit} rowsPerPageOptions={[10, 25, 50]} onPageChange={(_, nextPage) => setPage(nextPage)} onRowsPerPageChange={event => { setLimit(Number(event.target.value)); setPage(0); }} labelRowsPerPage="Sayfa başına" labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`} getItemAriaLabel={type => type === 'next' ? 'Sonraki sayfa' : 'Önceki sayfa'} sx={{ '.MuiTablePagination-toolbar': { flexWrap: 'wrap', px: 0 } }} />
      </>}
    </CardContent></BlankCard>
    {canManage && editor && <EntrepreneurPoolEditor id={editor.id} onClose={() => setEditor(null)} onSaved={message => { setEditor(null); setNotice(message); setRefresh(value => value + 1); }} />}
    <Dialog open={canManage && !!removing} onClose={() => { if (!busyAction) setRemoving(null); }} maxWidth="xs" fullWidth aria-labelledby="remove-entrepreneur-title">
      <DialogTitle id="remove-entrepreneur-title">Girişimciyi havuzdan kaldır</DialogTitle>
      <DialogContent><Typography><strong>{removing?.ventureName || removing?.contactName}</strong> aktif havuzdan kaldırılacak. Başvuru, evraklar ve kullanıcı hesabı korunur. Kaldırılanlar sekmesinden geri alabilirsiniz.</Typography>{actionError && <Alert severity="error" sx={{ mt: 2 }}>{actionError}</Alert>}</DialogContent>
      <DialogActions sx={{ p: 2 }}><Button onClick={() => setRemoving(null)} disabled={!!busyAction}>Vazgeç</Button><Button color="error" variant="contained" onClick={() => changeMembership(removing)} disabled={!!busyAction}>{busyAction ? 'Kaldırılıyor…' : 'Havuzdan kaldır'}</Button></DialogActions>
    </Dialog>
  </Stack>;
}
