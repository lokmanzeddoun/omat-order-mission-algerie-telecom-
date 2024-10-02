import UserIcon from 'assets/icons/mynaui--user-hexagon.svg?react';
import BaremIcon from 'assets/icons/fluent--receipt-money-16-regular.svg?react';
import StructureIcon from 'assets/icons/lets-icons--structure.svg?react';
import SupportIcon from 'assets/icons/fluent--person-support-16-regular.svg?react';
import ArchiveIcon from 'assets/icons/material-symbols--archive-outline.svg?react';
import OrderIcon from 'assets/icons/hugeicons--book-open-01.svg?react';
import { FC, SVGProps } from 'react';

export interface SubMenuItem {
  name: string;
  pathName: string;
  path: string;
  icon?: FC<SVGProps<SVGSVGElement>>; // Use FC for functional component type
  active?: boolean;
  items?: SubMenuItem[];
}

export interface MenuItem {
  id: string;
  subheader: string;
  path?: string;
  icon?: FC<SVGProps<SVGSVGElement>>; // Use FC for functional component type
  avatar?: string;
  items?: SubMenuItem[];
}

const sitemap: MenuItem[] = [
  {
    id: 'order',
    subheader: 'Ordres',
    path: '/dashboard/admins',
    icon: OrderIcon,
  },
  {
    id: 'users',
    subheader: 'Utilisateur',
    path: '/dashboard/admins/users',
    icon: UserIcon,
  },
  {
    id: 'structures',
    subheader: 'Services',
    path: '/dashboard/admins/structures',
    icon: StructureIcon,
  },
  {
    id: 'barem',
    subheader: 'Barem',
    path: '/dashboard/admins/barem',
    icon: BaremIcon,
  },
  {
    id: 'archive',
    subheader: 'Archive',
    path: '/dashboard/admins/archive',
    icon: ArchiveIcon,
  },
  {
    id: 'support',
    subheader: 'support',
    path: '/dashboard/support',
    icon: SupportIcon,
  },
];

export default sitemap;
