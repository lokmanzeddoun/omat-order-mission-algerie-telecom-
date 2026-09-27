import { Link } from 'react-router-dom';
import { buttonVariants } from 'components/ui';
import paths from 'routes/paths';

const NotFoundPage = () => (
  <main className="omat-ui flex min-h-screen flex-col items-center justify-center gap-4 bg-page px-4 text-center text-fg">
    <p className="text-sm font-semibold tracking-wide text-fg-muted uppercase">Erreur 404</p>
    <h1 className="text-2xl font-semibold">Page introuvable</h1>
    <p className="max-w-md text-sm text-fg-muted">
      La page demandée n’existe pas ou a été déplacée. Vérifiez l’adresse ou revenez à l’accueil.
    </p>
    {/* Router link so the /omat base path is kept (the previous href="/" left the app). */}
    <Link to={paths.signin} className={buttonVariants({ variant: 'primary' })}>
      Retour à l’accueil
    </Link>
  </main>
);

export default NotFoundPage;
