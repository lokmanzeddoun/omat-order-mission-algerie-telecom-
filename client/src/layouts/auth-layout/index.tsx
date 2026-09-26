import { PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';
import atLogo from 'assets/Logo_Algérie_Télécom.svg';

/** Public pages (sign-in, password recovery): official band + centred form panel. */
const AuthLayout = ({ children }: PropsWithChildren) => {
  const { t } = useTranslation();
  return (
    <div className="omat-ui flex min-h-screen flex-col bg-page text-fg">
      <header className="border-b-4 border-accent bg-primary text-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4">
          <span className="flex h-11 w-32 items-center justify-center overflow-hidden rounded-xs bg-white">
            <img src={atLogo} alt="Algérie Télécom" className="h-full w-full scale-[1.12] object-contain" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-xs tracking-wide text-white/80 uppercase">{t('app.institution')}</span>
            <span className="text-base font-semibold">{t('app.title')}</span>
          </span>
        </div>
      </header>
      <main id="main" className="flex flex-1 items-start justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-sm border border-border bg-surface shadow-sm">{children}</div>
      </main>
      <footer className="border-t border-border bg-surface px-4 py-3 text-center text-xs text-fg-subtle">{t('app.footer')}</footer>
    </div>
  );
};

export default AuthLayout;
