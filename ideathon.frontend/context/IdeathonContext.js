/**
 * Ideathon Context
 * Multi-tenant ideathon slug yönetimi
 * 
 * Slug set edildiğinde backend'den ideathon durumlarını çeker:
 *   GET /api/ideathon-status/:slug (Next.js proxy)
 * 
 * Response'dan gelen registrationOpen, applicationOpen vb.
 * değerler useIdeathonConfig() ile tüm uygulamada kullanılır.
 * 
 * Slug 3 yoldan set edilebilir:
 * 1. URL query param: ?event=ideathon-2025
 * 2. Sayfa bazlı: useSetIdeathonSlug('ideathon-2025')
 * 3. Manuel: updateSlug('ideathon-2025')
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { ideathonAPI, setSlugFallback } from '@/lib/api';
import { getIdeathonConfig } from '@/config/ideathonConfig';

const IdeathonContext = createContext();

export const useIdeathon = () => {
  const context = useContext(IdeathonContext);
  if (!context) {
    throw new Error('useIdeathon must be used within IdeathonProvider');
  }
  return context;
};

/**
 * Sayfa bazlı slug set etmek için custom hook
 * Ideathon anasayfalarında kullanılır (örn: /ideathon-2025)
 * Sayfa mount olduğunda slug'ı otomatik set eder.
 */
export const useSetIdeathonSlug = (pageSlug) => {
  const { updateSlug, slug } = useIdeathon();

  useEffect(() => {
    if (pageSlug && pageSlug !== slug) {
      updateSlug(pageSlug);
    }
  }, [pageSlug, slug, updateSlug]);
};

/**
 * Aktif ideathon'un konfigürasyonunu döner (API'den çekilmiş)
 * 
 * Kullanım:
 *   const config = useIdeathonConfig()
 *   if (config.applicationOpen) { ... }
 *   if (config.loading) { ... } // henüz yükleniyor
 */
export const useIdeathonConfig = () => {
  const { ideathonConfig } = useIdeathon();
  return ideathonConfig;
};

/**
 * localStorage key'leri
 */
const STORAGE_KEYS = {
  SLUG: 'ideathon_slug',
  ID: 'ideathon_id',
};

/**
 * Default config — API'den veri gelene kadar kullanılır
 */
const DEFAULT_CONFIG = {
  loading: true,
  name: '',
  shortName: '',
  slug: '',
  status: '',
  registrationOpen: false,
  applicationOpen: false,
  individualApplicationOpen: false,
  applicationEditOpen: false,
  applicationWithdrawOpen: false,
  presentationUploadOpen: false,
  presentationTemplateUrl: '',
  projectDescriptionOpen: false,
  loginOpen: true,
  myApplicationsVisible: true,
  teamFormOpen: false,
  contactFormOpen: true,
  mentornetOpen: false,
  meetingCreateOpen: false,
  messagingOpen: false,
  maxTeamSize: 5,
  requireTeam: false,
  phases: null,
  closedMessages: {
    registration: 'Kayıt süreci şu an kapalıdır.',
    application: 'Başvuru süreci şu an kapalıdır.',
    team: 'Takım oluşturma süreci kapalıdır.',
  },
};

export const IdeathonProvider = ({ children }) => {
  const router = useRouter();
  const [slug, setSlug] = useState(null);
  const [ideathonId, setIdeathonId] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [ideathonConfig, setIdeathonConfig] = useState(DEFAULT_CONFIG);
  const fetchedSlugRef = useRef(null); // aynı slug için tekrar istek atma

  /**
   * Slug değiştiğinde api.js fallback'ini güncel tut.
   * localStorage temizlense bile withSlug() doğru slug'ı bulabilir.
   */
  useEffect(() => {
    setSlugFallback(slug);
  }, [slug]);

  /**
   * Slug değiştiğinde API'den ideathon durumlarını çek
   */
  useEffect(() => {
    if (!slug) {
      setIdeathonConfig({ ...DEFAULT_CONFIG, loading: false });
      return;
    }

    // Aynı slug için tekrar istek atma
    if (fetchedSlugRef.current === slug) return;

    const fetchConfig = async () => {
      setIdeathonConfig(prev => ({ ...prev, loading: true }));
      try {
        const response = await ideathonAPI.getPublicBySlug(slug);
        if (response.success && response.data) {
          const d = response.data;
          fetchedSlugRef.current = slug;

          // shortName türet: "EK İdeathon 2025" → son 2 kelime veya name
          const nameParts = (d.name || '').split(' ');
          const shortName = nameParts.length > 2
            ? nameParts.slice(-2).join(' ')
            : d.name || '';

          setIdeathonConfig({
            loading: false,
            _id: d._id,
            name: d.name || '',
            shortName,
            slug: d.slug || slug,
            status: d.status || '',
            description: d.description || '',

            // Backend'den gelen ana flagler
            registrationOpen: !!d.registrationOpen,
            applicationOpen: !!d.applicationOpen,
            individualApplicationOpen: !!d.individualApplicationOpen,
            maxTeamSize: d.maxTeamSize || 5,
            requireTeam: !!d.requireTeam,
            phases: d.phases || null,
            startDate: d.startDate || null,
            endDate: d.endDate || null,

            // Backend'den gelen flagler
            applicationEditOpen: !!d.applicationEditOpen,
            applicationWithdrawOpen: !!d.applicationWithdrawOpen,
            presentationUploadOpen: !!d.presentationUploadOpen,
            presentationTemplateUrl: getIdeathonConfig(d.slug || slug).presentationTemplateUrl || '',
            projectDescriptionOpen: !!d.projectDescriptionOpen,

            // Genel
            loginOpen: true,
            myApplicationsVisible: true,
            teamFormOpen: !!d.teamCreationOpen,
            contactFormOpen: true,
            mentornetOpen: true,
            meetingCreateOpen: true,
            messagingOpen: true,

            // Kapalı mesajlar
            closedMessages: {
              registration: d.name ? `${d.name} için kayıt süreci kapalıdır.` : 'Kayıt süreci şu an kapalıdır.',
              application: d.name ? `${d.name} için başvuru süreci kapalıdır.` : 'Başvuru süreci şu an kapalıdır.',
              team: 'Takım oluşturma süreci kapalıdır.',
            },
          });
          // ideathonId'yi de kaydet
          if (d._id) {
            setIdeathonId(d._id);
            if (typeof window !== 'undefined') {
              localStorage.setItem(STORAGE_KEYS.ID, d._id);
            }
          }
        } else {
          // API'den veri gelemediyse — kapalı durumda bırak
          fetchedSlugRef.current = slug;
          setIdeathonConfig({
            ...DEFAULT_CONFIG,
            loading: false,
            slug: slug,
          });
        }
      } catch (err) {
        console.error('Ideathon config fetch error:', err);
        fetchedSlugRef.current = slug;
        setIdeathonConfig({
          ...DEFAULT_CONFIG,
          loading: false,
          slug: slug,
        });
      }
    };

    fetchConfig();
  }, [slug]);

  /**
   * URL'deki ?event= parametresinden veya localStorage'dan slug'ı al
   */
  useEffect(() => {
    if (!router.isReady) return;

    const eventSlug = router.query.event;

    if (eventSlug) {
      setSlug(eventSlug);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.SLUG, eventSlug);
      }
    } else if (typeof window !== 'undefined') {
      const savedSlug = localStorage.getItem(STORAGE_KEYS.SLUG);
      if (savedSlug) {
        setSlug(savedSlug);
      }
    }

    // localStorage'dan ideathonId'yi al
    if (typeof window !== 'undefined') {
      const savedId = localStorage.getItem(STORAGE_KEYS.ID);
      if (savedId) {
        setIdeathonId(savedId);
      }
    }

    setIsReady(true);
  }, [router.isReady, router.query.event]);

  /**
   * Slug'ı güncelle (farklı ideathon'a geçiş)
   */
  const updateSlug = useCallback((newSlug) => {
    setSlug(newSlug);
    // Farklı slug gelirse yeniden fetch edilmesi için ref temizle
    if (newSlug !== fetchedSlugRef.current) {
      fetchedSlugRef.current = null;
    }
    if (typeof window !== 'undefined') {
      if (newSlug) {
        localStorage.setItem(STORAGE_KEYS.SLUG, newSlug);
      } else {
        localStorage.removeItem(STORAGE_KEYS.SLUG);
      }
    }
  }, []);

  /**
   * IdeathonId'yi güncelle
   */
  const updateIdeathonId = useCallback((newId) => {
    setIdeathonId(newId);
    if (typeof window !== 'undefined') {
      if (newId) {
        localStorage.setItem(STORAGE_KEYS.ID, newId);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ID);
      }
    }
  }, []);

  /**
   * Tüm ideathon verilerini temizle (logout vb.)
   */
  const clearIdeathon = useCallback(() => {
    setSlug(null);
    setIdeathonId(null);
    fetchedSlugRef.current = null;
    setIdeathonConfig({ ...DEFAULT_CONFIG, loading: false });
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.SLUG);
      localStorage.removeItem(STORAGE_KEYS.ID);
    }
  }, []);

  /**
   * Config'i yeniden çek (force refresh)
   */
  const refreshConfig = useCallback(() => {
    fetchedSlugRef.current = null;
    // slug değişikliğini tetikle
    setSlug(prev => prev);
  }, []);

  const value = useMemo(() => ({
    slug,
    ideathonId,
    isReady,
    ideathonConfig,
    updateSlug,
    updateIdeathonId,
    clearIdeathon,
    refreshConfig,
    hasSlug: !!slug,
  }), [slug, ideathonId, isReady, ideathonConfig, updateSlug, updateIdeathonId, clearIdeathon, refreshConfig]);

  return (
    <IdeathonContext.Provider value={value}>
      {children}
    </IdeathonContext.Provider>
  );
};

export default IdeathonContext;
