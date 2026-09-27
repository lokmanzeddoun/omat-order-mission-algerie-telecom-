import { useSelector } from 'react-redux';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { buttonVariants } from 'components/ui';
import { RootState } from 'store/rootReducer';
import paths from './paths';

/**
 * Entry point of the QR codes printed on the PDFs (/scan/:kind/:id).
 * The printout can't know who scans it, so this forwards to the detail page
 * that matches the signed-in user's role.
 */
const ScanRedirect = () => {
  const { t } = useTranslation();
  const { kind, id } = useParams();
  const role = useSelector((s: RootState) => s.auth.user?.role);
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

  if (!id || !/^\d+$/.test(id) || (kind !== 'ordre' && kind !== 'decompte')) {
    return <Navigate to={paths.notFound} replace />;
  }

  if (kind === 'ordre') {
    return <Navigate to={`${isAdmin ? paths.admins : paths.users}/ordres/${id}`} replace />;
  }

  if (isAdmin) {
    return <Navigate to={`${paths.admins}/decomptes/${id}`} replace />;
  }

  // Décompte details only exist on the admin side.
  return (
    <main className="omat-ui flex min-h-screen flex-col items-center justify-center gap-4 bg-page px-4 text-center text-fg">
      <p className="text-sm font-semibold tracking-wide text-fg-muted uppercase">{t('decomptes:title', { n: id })}</p>
      <h1 className="text-2xl font-semibold">{t('scan.adminOnly')}</h1>
      <p className="max-w-md text-sm text-fg-muted">{t('scan.adminOnlyHint')}</p>
      <Link to={paths.users} className={buttonVariants({ variant: 'primary' })}>
        {t('scan.myDashboard')}
      </Link>
    </main>
  );
};

export default ScanRedirect;
