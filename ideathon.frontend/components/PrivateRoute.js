/**
 * PrivateRoute Component
 * Protected routes için authentication kontrolü
 */

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Loading from './Loading';
import { loginUrl } from '@/lib/authRoutes';

export default function PrivateRoute({ children, requireAuth = true }) {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Sadece loading false olduğunda ve henüz redirect olmadıysa kontrol et
    if (router.isReady && !loading && requireAuth && !isAuthenticated && !hasRedirected.current) {
      hasRedirected.current = true;
      
      // Kayıtlar kapalı olduğu için her zaman login'e yönlendir
      router.replace(loginUrl(router.asPath));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, loading, requireAuth, router.isReady]);

  // Auth kontrolü yapılırken loading göster
  if (loading) {
    return <Loading fullScreen message="Yükleniyor..." />;
  }

  // Auth gerekli ama kullanıcı giriş yapmamışsa hiçbir şey gösterme
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  // Her şey OK, children'ı render et
  return <>{children}</>;
}
