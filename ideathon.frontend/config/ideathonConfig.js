/**
 * Ideathon Konfigürasyon Dosyası
 * ================================
 * Her ideathon için açık/kapalı durumları burada yönetilir.
 * İleride backend'den gelecek, şimdilik manuel olarak ayarlanır.
 * 
 * KULLANIM:
 *   import { getIdeathonConfig } from '@/config/ideathonConfig'
 *   const config = getIdeathonConfig('ideathon-2025')
 *   if (config.applicationOpen) { ... }
 * 
 * YENİ IDEATHON EKLEMEK İÇİN:
 *   IDEATHON_CONFIGS objesine yeni slug key'i ekle ve değerleri ayarla.
 */

const IDEATHON_CONFIGS = {

  // ============================================================
  // IDEATHON 2025 — İstanbul
  // ============================================================
  'ideathon-2025': {
    // Genel bilgiler
    name: 'Emlak Konut Ideathon İstanbul',
    shortName: 'Ideathon İstanbul',

    // Slider / Hero
    sliderDesktop: '/img/slider-photo.webp',
    sliderMobile: '/img/slider-mobil.webp',
    heroComponent: 'HeroSection2',     // Kullanılacak hero section component adı

    // Kayıt & Giriş
    registrationOpen: false,        // Kayıt ol sayfası açık mı?
    loginOpen: true,                // Giriş sayfası açık mı? (genelde hep true)

    // Başvuru
    applicationOpen: false,              // Yeni başvuru yapılabilir mi?
    individualApplicationOpen: false,    // Bireysel başvuru yapılabilir mi?
    applicationEditOpen: false,          // Mevcut başvuru düzenlenebilir mi?
    applicationWithdrawOpen: false,      // Başvuru geri çekilebilir mi?

    // Başvurularım
    myApplicationsVisible: true,    // Başvurularım sayfası görünür mü?

    // Takım
    teamFormOpen: false,            // Takım oluşturma/düzenleme açık mı?
    maxTeamSize: 5,                 // Maksimum takım büyüklüğü
    requireTeam: false,             // Takım zorunlu mu?

    // Sunum & Proje
    presentationUploadOpen: true,  // Sunum dosyası yüklenebilir mi?
    presentationTemplateUrl: '/img/ideathon-sunum-sablonu.pptx', // Sunum şablonu URL'i (ideathon'a özel)
    projectDescriptionOpen: true,  // Proje açıklaması yazılabilir mi?

    // İletişim
    contactFormOpen: true,          // İletişim formu açık mı?

    // Mentorluk
    mentornetOpen: true,            // MentorNet erişimi açık mı?
    meetingCreateOpen: true,        // Toplantı oluşturma açık mı?
    messagingOpen: true,            // Mesajlaşma açık mı?

    // Özel mesajlar (kapalı olduğunda gösterilecek)
    closedMessages: {
      registration: 'Emlak Konut Ideathon 2025 için kayıt süreci sona ermiştir.',
      application: 'Emlak Konut Ideathon 2025 için başvuru süreci sona ermiştir.',
      team: 'Takım oluşturma süreci sona ermiştir.',
    },
  },

  // ============================================================
  // IDEATHON ANKARA
  // ============================================================
  'ideathon-ankara': {
    // Genel bilgiler
    name: 'Emlak Konut Ideathon Ankara',
    shortName: 'Ideathon Ankara',

    // Slider / Hero
    sliderDesktop: '/img/ankara/ideathon-ankara.jpg',
    sliderMobile: '/img/ankara/ideathon-ankara.jpg',
    heroComponent: 'HeroSectionAnkara',

    // Kayıt & Giriş
    registrationOpen: true,
    loginOpen: true,

    // Başvuru
    applicationOpen: true,
    individualApplicationOpen: true,
    applicationEditOpen: true,
    applicationWithdrawOpen: true,

    // Başvurularım
    myApplicationsVisible: true,

    // Takım
    teamFormOpen: true,
    maxTeamSize: 5,
    requireTeam: false,

    // Sunum & Proje
    presentationUploadOpen: false,
    presentationTemplateUrl: '/img/ideathon-sunum-sablonu.pptx',
    projectDescriptionOpen: false,

    // İletişim
    contactFormOpen: true,

    // Mentorluk
    mentornetOpen: false,
    meetingCreateOpen: false,
    messagingOpen: false,

    // Özel mesajlar
    closedMessages: {
      registration: 'Emlak Konut Ideathon Ankara için kayıt süreci henüz başlamamıştır.',
      application: 'Emlak Konut Ideathon Ankara için başvuru süreci henüz başlamamıştır.',
      team: 'Takım oluşturma süreci henüz başlamamıştır.',
    },
  },

  // ============================================================
  // IDEATHON KONYA
  // ============================================================
  'ideathon-konya': {
    name: 'Emlak Konut Ideathon Konya',
    shortName: 'Ideathon Konya',
    sliderDesktop: '/img/konya/ideathon-konya.jpg',
    sliderMobile: '/img/konya/ideathon-konya-mobil.jpg',
    heroComponent: 'HeroSectionKonya',
    registrationOpen: true,
    loginOpen: true,
    applicationOpen: true,
    individualApplicationOpen: true,
    applicationEditOpen: true,
    applicationWithdrawOpen: true,
    myApplicationsVisible: true,
    teamFormOpen: true,
    maxTeamSize: 5,
    requireTeam: false,
    presentationUploadOpen: true,
    presentationTemplateUrl: '/img/konya/ideathon-konya-sunum-sablonu.pptx',
    projectDescriptionOpen: false,
    contactFormOpen: true,
    mentornetOpen: false,
    meetingCreateOpen: false,
    messagingOpen: false,
    closedMessages: {
      registration: 'Emlak Konut Ideathon Konya için kayıt süreci henüz başlamamıştır.',
      application: 'Emlak Konut Ideathon Konya için başvuru süreci henüz başlamamıştır.',
      team: 'Takım oluşturma süreci henüz başlamamıştır.',
    },
  },

  // ============================================================
  // IDEATHON KAHRAMANMARAŞ
  // ============================================================
  'ideathon-kahramanmaras': {
    name: 'Emlak Konut Ideathon Kahramanmaraş',
    shortName: 'Ideathon Kahramanmaraş',
    sliderDesktop: '/img/maras/ideathon-maras.jpg',
    sliderMobile: '/img/maras/ideathon-maras-mobil.jpg',
    heroComponent: 'HeroSectionKahramanmaras',
    registrationOpen: true,
    loginOpen: true,
    applicationOpen: false,
    individualApplicationOpen: false,
    applicationEditOpen: false,
    applicationWithdrawOpen: false,
    myApplicationsVisible: true,
    teamFormOpen: false,
    maxTeamSize: 5,
    requireTeam: false,
    presentationUploadOpen: true,
    presentationTemplateUrl: '/img/maras/ideathon-maras-sunum-sablonu.pptx',
    projectDescriptionOpen: false,
    contactFormOpen: true,
    mentornetOpen: false,
    meetingCreateOpen: false,
    messagingOpen: false,
    closedMessages: {
      registration: 'Emlak Konut Ideathon Kahramanmaraş için kayıt süreci sona ermiştir.',
      application: 'Emlak Konut Ideathon Kahramanmaraş için başvuru süreci sona ermiştir.',
      team: 'Takım oluşturma süreci sona ermiştir.',
    },
  },

  // ============================================================
  // IDEATHON İZMİR
  // ============================================================
  'ideathon-izmir': {
    // Genel bilgiler
    name: 'Emlak Konut Ideathon İzmir',
    shortName: 'Ideathon İzmir',

    // Slider / Hero
    sliderDesktop: '/img/izmir/ideathon-izmir.webp',
    sliderMobile: '/img/izmir/ideathon-izmir-mobil.webp',
    heroComponent: 'HeroSectionIzmir',

    // Kayıt & Giriş
    registrationOpen: true,         // Kayıt ol sayfası açık mı?
    loginOpen: true,                // Giriş sayfası açık mı?

    // Başvuru
    applicationOpen: true,               // Yeni başvuru yapılabilir mi?
    individualApplicationOpen: true,     // Bireysel başvuru yapılabilir mi?
    applicationEditOpen: true,           // Mevcut başvuru düzenlenebilir mi?
    applicationWithdrawOpen: true,       // Başvuru geri çekilebilir mi?

    // Başvurularım
    myApplicationsVisible: true,    // Başvurularım sayfası görünür mü?

    // Takım
    teamFormOpen: true,             // Takım oluşturma/düzenleme açık mı?
    maxTeamSize: 5,                 // Maksimum takım büyüklüğü
    requireTeam: false,             // Takım zorunlu mu?

    // Sunum & Proje
    presentationUploadOpen: false,  // Sunum dosyası yüklenebilir mi?
    presentationTemplateUrl: '/img/ideathon-sunum-sablonu.pptx',    // Sunum şablonu URL'i (ideathon'a özel, backend'den gelir)
    projectDescriptionOpen: false,  // Proje açıklaması yazılabilir mi?

    // İletişim
    contactFormOpen: true,          // İletişim formu açık mı?

    // Mentorluk
    mentornetOpen: false,           // MentorNet erişimi açık mı?
    meetingCreateOpen: false,       // Toplantı oluşturma açık mı?
    messagingOpen: false,           // Mesajlaşma açık mı?

    // Özel mesajlar
    closedMessages: {
      registration: 'Emlak Konut Ideathon İzmir için kayıt süreci henüz başlamamıştır.',
      application: 'Emlak Konut Ideathon İzmir için başvuru süreci henüz başlamamıştır.',
      team: 'Takım oluşturma süreci henüz başlamamıştır.',
    },
  },
}

// ============================================================
// DEFAULT CONFIG — slug bulunamazsa bu kullanılır
// ============================================================
const DEFAULT_CONFIG = {
  name: 'Emlak Konut Ideathon',
  shortName: 'Ideathon',
  sliderDesktop: '/img/slider-photo.webp',
  sliderMobile: '/img/slider-mobil.webp',
  heroComponent: '',
  registrationOpen: false,
  loginOpen: true,
  applicationOpen: false,
  individualApplicationOpen: false,
  applicationEditOpen: false,
  applicationWithdrawOpen: false,
  myApplicationsVisible: true,
  teamFormOpen: false,
  maxTeamSize: 5,
  requireTeam: false,
  presentationUploadOpen: false,
  presentationTemplateUrl: '',
  projectDescriptionOpen: false,
  contactFormOpen: true,
  mentornetOpen: false,
  meetingCreateOpen: false,
  messagingOpen: false,
  closedMessages: {
    registration: 'Kayıt süreci şu an kapalıdır.',
    application: 'Başvuru süreci şu an kapalıdır.',
    team: 'Takım oluşturma süreci şu an kapalıdır.',
  },
}

// ============================================================
// HELPER FONKSİYONLAR
// ============================================================

/**
 * Slug'a göre ideathon konfigürasyonunu döner
 * @param {string|null} slug - Ideathon slug'ı (örn: 'ideathon-2025')
 * @returns {object} - Konfigürasyon objesi
 */
export function getIdeathonConfig(slug) {
  if (!slug) return DEFAULT_CONFIG
  return IDEATHON_CONFIGS[slug] || DEFAULT_CONFIG
}

/**
 * Tüm ideathon konfigürasyonlarını döner
 * @returns {object}
 */
export function getAllIdeathonConfigs() {
  return IDEATHON_CONFIGS
}

/**
 * Mevcut aktif slug'ı localStorage'dan alıp config döner
 * Client-side only
 * @returns {object}
 */
export function getCurrentIdeathonConfig() {
  if (typeof window === 'undefined') return DEFAULT_CONFIG
  const slug = localStorage.getItem('ideathon_slug')
  return getIdeathonConfig(slug)
}

export default IDEATHON_CONFIGS

