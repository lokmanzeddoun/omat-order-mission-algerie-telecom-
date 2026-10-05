import type { LucideIcon } from 'lucide-react';
import { Archive, BarChart3, BookOpen, Building2, FileCheck2, MessageSquare, ReceiptText, UserCog, Users } from 'lucide-react';
import paths from './paths';

export type Role = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

export interface NavItem {
  id: string;
  /** i18n key under `nav.` */
  labelKey: string;
  path: string;
  icon: LucideIcon;
  roles: Role[];
  /** Match only the exact path (for index routes). */
  end?: boolean;
}

const ADMINS: Role[] = ['ADMIN', 'SUPER_ADMIN'];

// Grouped by purpose: daily work first, then reference data, then housekeeping.
export const navigation: NavItem[] = [
  { id: 'ordres', labelKey: 'nav.ordres', path: paths.admins, icon: BookOpen, roles: ADMINS, end: true },
  { id: 'decomptes', labelKey: 'nav.decomptes', path: `${paths.admins}/decomptes`, icon: FileCheck2, roles: ADMINS },
  { id: 'analytics', labelKey: 'nav.analytics', path: `${paths.admins}/analytics`, icon: BarChart3, roles: ['SUPER_ADMIN'] },
  { id: 'users', labelKey: 'nav.users', path: `${paths.admins}/users`, icon: Users, roles: ADMINS },
  { id: 'structures', labelKey: 'nav.structures', path: `${paths.admins}/structures`, icon: Building2, roles: ['SUPER_ADMIN'] },
  { id: 'barem', labelKey: 'nav.barem', path: `${paths.admins}/barem`, icon: ReceiptText, roles: ADMINS },
  { id: 'grade-assignments', labelKey: 'nav.gradeAssignments', path: `${paths.admins}/grade-assignments`, icon: UserCog, roles: ['SUPER_ADMIN'] },
  { id: 'comments', labelKey: 'nav.comments', path: `${paths.admins}/support`, icon: MessageSquare, roles: ADMINS },
  { id: 'archive', labelKey: 'nav.archive', path: `${paths.admins}/archive`, icon: Archive, roles: ADMINS },
  { id: 'my-ordres', labelKey: 'nav.myOrdres', path: paths.users, icon: BookOpen, roles: ['USER'], end: true },
];

export const navigationFor = (role?: string | null) =>
  navigation.filter((item) => role != null && item.roles.includes(role as Role));

/** Home route for a role (used by the logo and breadcrumbs). */
export const homeFor = (role?: string | null) => (role === 'USER' ? paths.users : paths.admins);
