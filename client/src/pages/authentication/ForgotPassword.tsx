import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import http from 'helpers/http';
import { serverMessage } from 'helpers/errorHandler';
import { useApiHandler } from 'components/hooks/useErrorHandler';
import { Button, Field, Input } from 'components/ui';
import paths from 'routes/paths';

/** Sends a password-reset request to the administrators (same request as before). */
const ForgotPassword = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  // Guard against double submission; stays locked when a request is already pending.
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const { handleError, handleSuccess } = useApiHandler();
  const navigate = useNavigate();

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading || submittedOnce) return;
    setLoading(true);
    setSubmittedOnce(true);
    try {
      await http.post('/comments', { title: 'Forgot password request', type: 'FORGET_PASSWORD', email });
      handleSuccess(t('auth.forgotSent'));
      navigate(paths.signin);
    } catch (err) {
      handleError(err);
      // Match on the backend's own text: the displayed message is translated.
      if (!serverMessage(err).toLowerCase().includes('pending')) setSubmittedOnce(false);
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
          <Input type="email" dir="ltr" autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Button type="submit" variant="primary" className="w-full" disabled={loading || submittedOnce || !email.trim()}>
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
