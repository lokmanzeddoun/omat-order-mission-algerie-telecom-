import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { buttonVariants } from 'components/ui';
import paths from 'routes/paths';

const NotFoundPage = () => {
  const { t } = useTranslation();
  return (
    <main className="omat-ui flex min-h-screen flex-col items-center justify-center gap-4 bg-page px-4 text-center text-fg">
      <p className="text-sm font-semibold tracking-wide text-fg-muted uppercase">{t('notFound.code')}</p>
      <h1 className="text-2xl font-semibold">{t('notFound.title')}</h1>
      <p className="max-w-md text-sm text-fg-muted">{t('notFound.hint')}</p>
      {/* Router link so the /omat base path is kept (the previous href="/" left the app). */}
      <Link to={paths.signin} className={buttonVariants({ variant: 'primary' })}>
        {t('notFound.home')}
      </Link>
    </main>
  );
};

export default NotFoundPage;
