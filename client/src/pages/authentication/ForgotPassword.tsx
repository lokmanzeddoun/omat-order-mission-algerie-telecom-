import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import http from 'helpers/http';
import { useApiHandler } from 'components/hooks/useErrorHandler';
import { Button, Field, Input } from 'components/ui';
import paths from 'routes/paths';

/** Asks the administrators for a password reset (works signed out). */
const ForgotPassword = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { handleError, handleSuccess } = useApiHandler();
  const navigate = useNavigate();

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await http.post('/auth/forgot-password', { email });
      handleSuccess(t('auth.forgotSent'));
      navigate(paths.signin);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="border-b border-border bg-surface-header px-6 py-4">
        <h1 className="text-lg font-semibold">{t('auth.forgotTitle')}</h1>
        <p className="mt-1 text-sm text-fg-muted">{t('auth.forgotSubtitle')}</p>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-4 px-6 py-5">
        <Field label={t('auth.email')} required>
          {/* type="text": an email input would send the accented domain as punycode. */}
          <Input
            type="text"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            dir="ltr"
            autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Button type="submit" variant="primary" className="w-full" disabled={loading || !email.trim()}>
          {loading ? t('auth.sending') : t('auth.forgotSubmit')}
        </Button>
        <Link to={paths.signin} className="self-start text-sm text-primary underline underline-offset-2 hover:no-underline">
          {t('auth.backToSignIn')}
        </Link>
      </form>
    </>
  );
};

export default ForgotPassword;
