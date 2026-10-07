'use client';

import { useSelector } from 'react-redux';
import { Alert, Box, CircularProgress } from '@mui/material';

export default function EntrepreneurAccess({ children, superadminOnly = false }) {
  const { user, isAuthenticated } = useSelector(state => state.auth);
  if (!isAuthenticated) return <Box py={6} textAlign="center"><CircularProgress aria-label="Oturum kontrol ediliyor" /></Box>;
  if (superadminOnly && user?.role !== 'superadmin') return <Alert severity="error">Soru setini yalnızca süperadmin düzenleyebilir.</Alert>;
  if (!['admin', 'superadmin'].includes(user?.role)) return <Alert severity="error">Girişimci havuzunu görüntüleme yetkiniz bulunmuyor.</Alert>;
  return children;
}
