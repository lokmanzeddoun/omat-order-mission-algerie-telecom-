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
    path: '/dashboard/home',
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
    subheader: 'utilisateur',
    path: '/dashboard/users',
    icon: 'mynaui:user-hexagon',
  },
  {
    id: 'settings',
    subheader: 'Parametres',
    path: '#!',
    icon: 'hugeicons:settings-01',
  },
];

export default sitemap;
