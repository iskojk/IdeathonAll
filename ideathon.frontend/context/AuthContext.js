/**
 * Auth Context
 * Global authentication state yönetimi
 */

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import { authAPI } from '@/lib/api';
import { setToken, removeToken, getToken, setUser, removeUser, getUser as getUserFromStorage, logout as logoutHelper, getAuthUser } from '@/lib/auth';
import { toast } from '@/components/Toast';
import { isAuthPage, loginUrl } from '@/lib/authRoutes';

/**
 * Login/Register/Me response'dan ideathon bilgilerini localStorage'a kaydet
 * Backend artık user objesinde ideathonId ve ideathon objesi dönüyor.
 */
function saveIdeathonFromUser(userData) {
  if (typeof window === 'undefined' || !userData) return;
  if (userData.ideathonId) {
    localStorage.setItem('ideathon_id', userData.ideathonId);
  }
  if (userData.ideathon?.slug) {
    localStorage.setItem('ideathon_slug', userData.ideathon.slug);
  }
}

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Sayfa yüklendiğinde token varsa kullanıcı bilgilerini al
  useEffect(() => {
    let isMounted = true; // Component mount durumunu takip et

    const initAuth = async () => {
      const token = getToken();
      const cachedUser = getUserFromStorage();

      if (token && cachedUser) {
        // Token ve cache'de user varsa, önce cache'den yükle
        if (isMounted) {
          setUserState(cachedUser);
          setLoading(false); // Hemen loading'i false yap, kullanıcı içeriyi görsün
        }

        // Arka planda API'den güncel bilgileri al (sessizce)
        try {
          const response = await authAPI.getMe();
          const currentUser = getAuthUser(response);
          // API başarılıysa ve user verisi varsa güncelle (304 için user olmayabilir)
          if (currentUser && isMounted) {
            setUserState(currentUser);
            setUser(currentUser);
            saveIdeathonFromUser(currentUser); // ideathonId + slug güncelle
          }
          // API başarılı ama user verisi yoksa (304 vb.) cached user'ı kullanmaya devam et
        } catch (err) {
          // API çağrısı başarısız olsa bile cached user'ı kullanmaya devam et
          // Sadece gerçek 401 hatası gelirse logout yap
          if (err.status === 401 && isMounted) {
            logoutHelper();
            setUserState(null);
            if (!isAuthPage(window.location.pathname)) router.replace(loginUrl(router.asPath));
          }
          // Diğer hatalar için cached user'ı kullanmaya devam et
        }
      } else if (token && !cachedUser) {
        // Token var ama cache'de user yok, API'den al
        try {
          const response = await authAPI.getMe();
          const currentUser = getAuthUser(response);
          if (currentUser && isMounted) {
            setUserState(currentUser);
            setUser(currentUser);
            saveIdeathonFromUser(currentUser); // ideathonId + slug güncelle
          }
        } catch (err) {
          // Sadece 401 Unauthorized hatası gelirse logout yap
          if (err.status === 401 && isMounted) {
            logoutHelper();
            setUserState(null);
            if (!isAuthPage(window.location.pathname)) router.replace(loginUrl(router.asPath));
          }
          // Diğer hatalar için loading'i bitir
        }
        if (isMounted) {
          setLoading(false);
        }
      } else {
        // Token yok, direkt loading false
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Cleanup function - component unmount olduğunda
    return () => {
      isMounted = false;
    };
  }, []); // Sadece mount'ta çalış

  /**
   * Kayıt ol
   */
  const register = useCallback(async (name, email, password, phone = '', options = {}) => {
    try {
      setError(null);
      const response = await authAPI.register(name, email, password, phone, options);

      if (response.success) {
        setToken(response.data.token);
        setUser(response.data.user);
        setUserState(response.data.user);
        saveIdeathonFromUser(response.data.user); // ideathonId + slug kaydet
        toast.success(`Hoş geldiniz, ${response.data.user.name}! 🎉`);
        return { success: true, data: response.data };
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Kayıt işlemi başarısız oldu');
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Giriş yap
   */
  const login = useCallback(async (email, password) => {
    try {
      setError(null);
      const response = await authAPI.login(email, password);

      if (response.success) {
        setToken(response.data.token);
        setUser(response.data.user);
        setUserState(response.data.user);
        saveIdeathonFromUser(response.data.user); // ideathonId + slug kaydet
        toast.success(`Tekrar hoş geldiniz, ${response.data.user.name}! 👋`);
        return { success: true, data: response.data };
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Giriş başarısız oldu');
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Çıkış yap
   */
  const logout = useCallback(() => {
    logoutHelper();
    setUserState(null);
    setError(null);
    toast.info('Başarıyla çıkış yaptınız 👋');
    router.push('/');
  }, [router]);

  /**
   * Profil güncelle
   */
  const updateProfile = async (userData) => {
    try {
      setError(null);
      const response = await authAPI.updateProfile(userData);
      
      if (response.success) {
        setUser(response.data.user);
        setUserState(response.data.user);
        toast.success('Profiliniz başarıyla güncellendi! ✨');
        return { success: true, data: response.data };
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Profil güncellenemedi');
      return { success: false, error: err.message };
    }
  };

  /**
   * Token'ı yenile (API'den güncel bilgileri al)
   */
  const refreshUser = async () => {
    try {
      const response = await authAPI.getMe();
      const currentUser = getAuthUser(response);
      if (currentUser) {
        setUserState(currentUser);
        setUser(currentUser);
        saveIdeathonFromUser(currentUser); // ideathonId + slug güncelle
      }
    } catch (err) {
      console.error('Refresh user error:', err);
    }
  };

  const value = useMemo(() => ({
    user,
    loading,
    error,
    register,
    login,
    logout,
    updateProfile,
    refreshUser,
    isAuthenticated: !!user,
  }), [user, loading, error, register, login, logout, updateProfile, refreshUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
