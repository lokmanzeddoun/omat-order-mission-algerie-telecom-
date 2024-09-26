export interface SubMenuItem {
  name: string;
  pathName: string;
  path: string;
  icon?: string;
  active?: boolean;
  items?: SubMenuItem[];
}

export interface MenuItem {
  id: string;
  subheader: string;
  path?: string;
  icon?: string;
  avatar?: string;
  items?: SubMenuItem[];
}

const sitemap: MenuItem[] = [
  {
    id: 'dashboard',
    subheader: 'Accueil',
    path: '/dashboard',
    icon: 'hugeicons:grid-view',
  },
  {
    id: 'order',
    subheader: 'Ordres',
    path: '#!',
    icon: 'hugeicons:book-open-01',
  },
  {
    id: 'users',
    subheader: 'Utilisateur',
    path: '/dashboard/admins/users',
    icon: 'mynaui:user-hexagon',
  },
  {
    id: 'structures',
    subheader: 'Services',
    path: '/dashboard/admins/structures',
    icon: 'lets-icons:structure',
  },
  {
    id: 'archive',
    subheader: 'Archive',
    path: '/dashboard/archive',
    icon: 'material-symbols:archive-outline',
  },
  {
    id: 'support',
    subheader: 'support',
    path: '/dashboard/support',
    icon: 'fluent:person-support-16-regular',
  },
];

export default sitemap;
