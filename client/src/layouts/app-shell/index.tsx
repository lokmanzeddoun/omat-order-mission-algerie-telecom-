import { useState, type PropsWithChildren } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Dialog as RadixDialog } from 'radix-ui';
import { Menu, Moon, PanelLeftClose, PanelLeftOpen, Plus, Sun, X } from 'lucide-react';
import type { AppDispatch } from 'store';
import type { RootState } from 'store/rootReducer';
import { toggleTheme } from 'store/theme.slice';
import { addOrder } from 'components/orders/orderthunk';
import MissionFormDialog from 'components/orders/MissionFormDialog';
import type { IMission } from 'components/orders/orderReducer';
import { Button } from 'components/ui';
import { cn } from 'lib/utils';
import { homeFor, navigationFor, type NavItem } from 'routes/navigation';
import atLogo from 'assets/Logo_Algérie_Télécom.svg';
import ExerciceSelect from './ExerciceSelect';
import UserMenu from './UserMenu';

const COLLAPSE_KEY = 'omat.nav.collapsed';

const readCollapsed = () => {
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
};

function NavList({ items, collapsed, onNavigate }: { items: NavItem[]; collapsed?: boolean; onNavigate?: () => void }) {
  const { t } = useTranslation();
  return (
    <ul className="flex flex-col gap-0.5 py-2">
      {items.map((item) => {
        const Icon = item.icon;
        const label = t(item.labelKey);
        return (
          <li key={item.id}>
            <NavLink
              to={item.path}
              end={item.end}
              onClick={onNavigate}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 border-s-4 px-4 py-2 text-sm',
                  collapsed && 'justify-center px-0',
                  isActive
                    ? 'border-accent bg-primary-soft font-semibold text-primary'
                    : 'border-transparent text-fg-muted hover:bg-surface-muted hover:text-fg',
                )
              }
            >
              <Icon aria-hidden="true" className="size-[18px] shrink-0" />
              <span className={cn(collapsed && 'sr-only')}>{label}</span>
            </NavLink>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Application shell for every authenticated page: official header band,
 * role-filtered navigation, main content area and footer.
 */
export default function AppShell({ children }: PropsWithChildren) {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { user, token } = useSelector((s: RootState) => s.auth) as { user: IUser | null; token: string | null };
  const themeMode = useSelector((s: RootState) => s.theme.mode);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [missionOpen, setMissionOpen] = useState(false);
  const items = navigationFor(user?.role);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      try {
        window.localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1');
      } catch {
        /* not remembered */
      }
      return !c;
    });
  };

  const submitMission = async (data: IMission) => {
    const success = await dispatch(addOrder(data, token));
    if (success) setMissionOpen(false);
  };

  return (
    <div className="omat-ui flex min-h-screen flex-col bg-page text-fg">
      <a
        href="#main"
        className="sr-only z-[1700] bg-focus px-3 py-2 text-sm font-semibold text-black focus:not-sr-only focus:fixed focus:start-2 focus:top-2"
      >
        {t('app.skipToContent')}
      </a>

      {/* Official header band */}
      <header className="border-b-4 border-accent bg-band text-white">
        <div className="flex h-16 items-center gap-3 px-3 sm:px-4">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label={t('actions.toggleNav')}
            className="cursor-pointer rounded-xs p-1.5 hover:bg-white/10 lg:hidden"
          >
            <Menu className="size-5" />
          </button>
          <Link to={homeFor(user?.role)} className="flex min-w-0 items-center gap-3">
            {/* The official SVG has wide built-in margins; crop them by scaling inside a fixed frame */}
            <span className="flex h-10 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xs bg-white sm:h-11 sm:w-32">
              <img src={atLogo} alt="Algérie Télécom" className="h-full w-full scale-[1.12] object-contain" />
            </span>
            <span className="hidden min-w-0 flex-col leading-tight sm:flex">
              <span className="text-xs tracking-wide text-white/80 uppercase">{t('app.institution')}</span>
              <span className="truncate text-base font-semibold">{t('app.title')}</span>
            </span>
          </Link>

          <div className="ms-auto flex min-w-0 items-center gap-1.5 sm:gap-3">
            <Button
              size="sm"
              onClick={() => setMissionOpen(true)}
              className="border-white bg-white text-band hover:bg-white/90"
            >
              <Plus />
              <span className="hidden md:inline">{t('actions.addMission')}</span>
            </Button>
            <ExerciceSelect />
            <button
              type="button"
              onClick={() => dispatch(toggleTheme())}
              aria-label={t('actions.toggleTheme')}
              title={t('actions.toggleTheme')}
              className="cursor-pointer rounded-xs p-1.5 text-white/90 hover:bg-white/10"
            >
              {themeMode === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </button>
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Desktop navigation */}
        <nav
          aria-label="Navigation principale"
          className={cn(
            'sticky top-0 hidden h-[calc(100vh-4.25rem)] shrink-0 flex-col border-e border-border bg-surface lg:flex',
            collapsed ? 'w-14' : 'w-60',
          )}
        >
          <div className="min-h-0 flex-1 overflow-y-auto">
            <NavList items={items} collapsed={collapsed} />
          </div>
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={t('actions.toggleNav')}
            aria-expanded={!collapsed}
            className="flex cursor-pointer items-center justify-center gap-2 border-t border-border py-2 text-xs text-fg-muted hover:bg-surface-muted"
          >
            {collapsed ? <PanelLeftOpen className="size-4 rtl:rotate-180" /> : <PanelLeftClose className="size-4 rtl:rotate-180" />}
          </button>
        </nav>

        {/* Mobile navigation drawer */}
        <RadixDialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
          <RadixDialog.Portal>
            <RadixDialog.Overlay className="omat-ui fixed inset-0 z-[1400] bg-black/40 lg:hidden" />
            <RadixDialog.Content
              aria-describedby={undefined}
              className="omat-ui fixed inset-y-0 start-0 z-[1400] w-72 border-e border-border bg-surface text-fg lg:hidden"
            >
              <div className="flex items-center justify-between border-b-4 border-accent bg-band px-4 py-3 text-white">
                <RadixDialog.Title className="text-sm font-semibold">{t('app.title')}</RadixDialog.Title>
                <RadixDialog.Close aria-label={t('actions.close')} className="cursor-pointer rounded-xs p-1 hover:bg-white/10">
                  <X className="size-4" />
                </RadixDialog.Close>
              </div>
              <NavList items={items} onNavigate={() => setMobileOpen(false)} />
            </RadixDialog.Content>
          </RadixDialog.Portal>
        </RadixDialog.Root>

        <main id="main" tabIndex={-1} className="min-w-0 flex-1 px-4 py-5 outline-none sm:px-6">
          {children}
        </main>
      </div>

      <footer className="border-t border-border bg-surface px-4 py-3 text-xs text-fg-subtle sm:px-6">
        {t('app.footer')}
      </footer>

      <MissionFormDialog open={missionOpen} mode="create" onClose={() => setMissionOpen(false)} onSubmit={submitMission} />
    </div>
  );
}
