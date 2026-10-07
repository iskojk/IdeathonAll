import { uniqueId } from 'lodash';

import {
  IconAperture,
  IconClipboardCheck,
  IconTrophy,
  IconUsers,
  IconListCheck,
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
    title: 'Ön Değerlendirme',
    icon: IconClipboardCheck,
    href: '/applications/list',
  },

  {
    navlabel: true,
    subheader: 'FİNAL DEĞERLENDİRME',
  },

  {
    id: uniqueId(),
    title: 'Takımlar',
    icon: IconUsers,
    href: '/jury/teams',
  },

  {
    id: uniqueId(),
    title: 'Değerlendirmelerim',
    icon: IconListCheck,
    href: '/jury/my-evaluations',
  },

];

export default Menuitems;
