import { useState, type FormEvent } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TriangleAlert } from 'lucide-react';
import type { AppDispatch } from 'store';
import { login } from 'components/auth/auth.thunk';
import { normalizeEmail } from 'helpers/utils';
import { Button, Field, Input, PasswordInput } from 'components/ui';
import paths from 'routes/paths';

const Signin = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirection after success is handled by HomeOrSignin once auth state changes.
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    // Normalize punycode domains (xn--algrietelecom-dhb.dz) back to Unicode for Chrome autofill
    const result = await dispatch(login({ email: normalizeEmail(email), password }));
    setSubmitting(false);
    if (!result.ok) setError(t(result.reason === 'invalid' ? 'auth.invalid' : 'auth.error'));
  };

  return (
    <>
      <div className="border-b border-border bg-surface-header px-6 py-4">
        <h1 className="text-lg font-semibold">{t('auth.signInTitle')}</h1>
        <p className="mt-1 text-sm text-fg-muted">{t('auth.signInSubtitle')}</p>
      </div>
      <form onSubmit={handleSubmit} noValidate={false} className="flex flex-col gap-4 px-6 py-5">
        {error && (
          <div role="alert" className="flex items-start gap-2 border-s-4 border-danger bg-danger-soft px-3 py-2 text-sm text-danger">
            <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {error}
          </div>
        )}
        <Field label={t('auth.email')} required>
          <Input
            name="email"
            type="text"
            inputMode="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label={t('auth.password')} required>
          <PasswordInput
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Link to={paths.forgotPassword} className="self-start text-sm text-primary underline underline-offset-2 hover:no-underline">
          {t('auth.forgot')}
        </Link>
        <Button type="submit" variant="primary" disabled={submitting} className="w-full">
          {submitting ? t('table.loading') : t('auth.signIn')}
        </Button>
      </form>
    </>
  );
};

export default Signin;
