import { uniqueId } from 'lodash';

import {
  IconAward,
  IconBoxMultiple,
  IconPoint,
  IconAlertCircle,
  IconNotes,
  IconCalendar,
  IconMail,
  IconTicket,
  IconEdit,
  IconGitMerge,
  IconCurrencyDollar,
  IconApps,
  IconFileDescription,
  IconFileDots,
  IconFiles,
  IconBan,
  IconStar,
  IconMoodSmile,
  IconBorderAll,
  IconChartArcs3,
  IconBorderHorizontal,
  IconBorderInner,
  IconBorderVertical,
  IconBorderTop,
  IconUserCircle,
  IconPackage,
  IconChartHistogram,
  IconMessage2,
  IconBasket,
  IconChartLine,
  IconChartArcs,
  IconChartCandle,
  IconChartArea,
  IconChartDots,
  IconChartDonut3,
  IconChartRadar,
  IconLogin,
  IconUserPlus,
  IconRotate,
  IconBox,
  IconShoppingCart,
  IconAperture,
  IconLayout,
  IconSettings,
  IconHelp,
  IconZoomCode,
  IconBoxAlignBottom,
  IconBoxAlignLeft,
  IconBorderStyle2,
  IconLockAccess,
  IconAppWindow,
  IconBuilding,
  IconNotebook,
  IconFileCheck,
  IconPageBreak,
  IconSitemap,
  IconNews,
  IconUsers,
  IconBuildingSkyscraper,
} from '@tabler/icons-react';

const Menuitems = [
  {
    navlabel: true,
    subheader: 'GENEL',
  },

  {
    id: uniqueId(),
    title: 'Anasayfa',
    icon: IconAperture,
    href: '/',
    chipColor: 'secondary',
  },

  {
    navlabel: true,
    subheader: 'DASHBOARD',
  },

  {
    id: uniqueId(),
    title: 'Başvurular',
    icon: IconFileDots,
    href: '/applications/list',
  },
  {
    id: uniqueId(),
    title: 'Girişimci Havuzu',
    icon: IconBuilding,
    href: '/entrepreneurs/list',
    roles: ['admin', 'superadmin'],
  },
  {
    id: uniqueId(),
    title: 'Girişimci Soru Seti',
    icon: IconFileDots,
    href: '/entrepreneurs/form',
    roles: ['superadmin'],
  },
  {
    id: uniqueId(),
    title: 'İletişim Yönetimi',
    icon: IconMessage2,
    href: '/contacts/list',
  },

  {
    id: uniqueId(),
    title: 'Üyeler',
    icon: IconUsers,
    href: '/members',
  },
  {
    id: uniqueId(),
    title: 'Takım Yönetimi',
    icon: IconUsers,
    href: '/teams/list',
  },
  {
    id: uniqueId(),
    title: 'Final Sonuçları',
    icon: IconAward,
    href: '/jury/final-results',
  },

  {
    navlabel: true,
    subheader: 'MENTOR',
  },

  {
    id: uniqueId(),
    title: 'Mentor Yönetimi',
    icon: IconNotebook,
    href: '/mentornet/management',
  },

  {
    id: uniqueId(),
    title: 'Mentor İstatistikleri',
    icon: IconChartHistogram,
    href: '/mentors',
  },

  {
    navlabel: true,
    subheader: 'YÖNETİM',
  },

  {
    id: uniqueId(),
    title: 'Admin/Juri Hesapları',
    icon: IconUserPlus,
    href: '/admin-juri/accounts',
  },

  {
    id: uniqueId(),
    title: 'İdeathon Yönetimi',
    icon: IconBuildingSkyscraper,
    href: '/ideathons',
  },

];

export default Menuitems;
