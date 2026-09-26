import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, LogOut, UserRound } from 'lucide-react';
import type { AppDispatch } from 'store';
import type { RootState } from 'store/rootReducer';
import { logout } from 'components/auth/auth.thunk';
import { DropdownMenu } from 'components/ui';
import paths from 'routes/paths';

const roleLabel: Record<string, string> = {
  SUPER_ADMIN: 'Super administrateur',
  ADMIN: 'Administrateur',
  USER: 'Agent',
};

export default function UserMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((s: RootState) => s.auth.user) as IUser | null;
  const fullName = user ? `${user.prenom ?? ''} ${user.nom ?? ''}`.trim() : '';
  const initials = fullName
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu
      actions={[
        { label: t('user.profile'), icon: <UserRound />, onSelect: () => navigate(paths.me) },
        {
          label: t('user.logout'),
          icon: <LogOut />,
          onSelect: async () => {
            await dispatch(logout());
            navigate(paths.signin, { replace: true });
          },
        },
      ]}
      trigger={
        <button
          type="button"
          aria-label={t('user.menu')}
          className="flex cursor-pointer items-center gap-2 rounded-xs px-1.5 py-1 text-start text-white hover:bg-white/10"
        >
          <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-full border border-white/50 bg-white/10 text-xs font-semibold">
            {initials || '?'}
          </span>
          <span className="hidden flex-col leading-tight md:flex">
            <span className="text-sm font-medium">{fullName || '—'}</span>
            <span className="text-xs text-white/75">{user ? (roleLabel[user.role] ?? user.role) : ''}</span>
          </span>
          <ChevronDown aria-hidden="true" className="size-4 text-white/80" />
        </button>
      }
    />
  );
}
