import { uniqueId } from 'lodash';

import {
  IconLayoutDashboard,
  IconUser,
  IconUsers,
  IconCalendar,
  IconCalendarEvent,
  IconMessageCircle,
  IconChartBar,
  IconBriefcase,
  IconClock,
  IconStar,
  IconBell,
  IconVideo,
} from '@tabler/icons-react';

const Menuitems = [
  {
    navlabel: true,
    subheader: 'GENEL',
  },

  {
    id: uniqueId(),
    title: 'Dashboard',
    icon: IconLayoutDashboard,
    href: '/',
    chipColor: 'secondary',
  },

  {
    navlabel: true,
    subheader: 'MENTOR İŞLEMLERİ',
  },

  {
    id: uniqueId(),
    title: 'Profilim',
    icon: IconUser,
    href: '/mentor/my-profile',
  },

  {
    id: uniqueId(),
    title: 'Müsaitlik Yönetimi',
    icon: IconCalendar,
    href: '/mentor/availability',
  },



  {
    id: uniqueId(),
    title: 'Toplantılarım',
    icon: IconCalendarEvent,
    href: '/mentor/meetings',
  },
  {
    id: uniqueId(),
    title: 'Mesajlar',
    icon: IconMessageCircle,
    href: '/mentor/messages',
  },

  {
    id: uniqueId(),
    title: 'Katılımcılar',
    icon: IconUsers,
    href: '/mentor/participants',
  },

  /* Geçici olarak pasif
  {
    id: uniqueId(),
    title: 'Değerlendirmeler',
    icon: IconStar,
    href: '/mentor/feedbacks',
  },
  */

  {
    id: uniqueId(),
    title: 'Bildirim Ayarları',
    icon: IconBell,
    href: '/mentor/notification-settings',
  },

  {
    id: uniqueId(),
    title: 'Entegrasyonlar',
    icon: IconVideo,
    href: '/mentor/integrations',
  },


];

export default Menuitems;
