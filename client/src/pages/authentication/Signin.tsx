import { useState, type FormEvent } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TriangleAlert } from 'lucide-react';
import type { AppDispatch } from 'store';
import {
  finishMfaEnrollment,
  login,
  startMfaEnrollment,
  verifyMfa,
  type LoginResult,
  type MfaChallenge,
  type MfaEnrollment,
} from 'components/auth/auth.thunk';
import { normalizeEmail } from 'helpers/utils';
import { Button, Field, Input, PasswordInput } from 'components/ui';
import paths from 'routes/paths';

type Step =
  | { kind: 'password' }
  | { kind: 'code'; mfa: MfaChallenge; enrollment?: MfaEnrollment }
  | { kind: 'recovery'; codes: string[]; session: ResLoginApi };

const Signin = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const [step, setStep] = useState<Step>({ kind: 'password' });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const explain = (result: LoginResult) => {
    if (result.ok || result.reason === 'mfa') return;
    const key = step.kind === 'code' && result.reason === 'invalid' ? 'auth.mfaInvalid' : `auth.${result.reason}`;
    setError(t(key));
  };

  // Redirection after success is handled by HomeOrSignin once auth state changes.
  const submitPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    // Normalize punycode domains (xn--algrietelecom-dhb.dz) back to Unicode for Chrome autofill
    const result = await dispatch(login({ email: normalizeEmail(email), password }));
    if (!result.ok && result.reason === 'mfa') {
      const enrollment = result.mfa.stage === 'enroll' ? await startMfaEnrollment(result.mfa.mfaToken) : undefined;
      if (result.mfa.stage === 'enroll' && !enrollment) setError(t('auth.error'));
      else setStep({ kind: 'code', mfa: result.mfa, enrollment: enrollment ?? undefined });
      setPassword('');
    } else {
      explain(result);
    }
    setSubmitting(false);
  };

  const submitCode = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (step.kind !== 'code') return;
    setError(null);
    setSubmitting(true);
    const result = await dispatch(verifyMfa(step.mfa.mfaToken, code.trim()));
    setSubmitting(false);
    setCode('');
    if (result.ok && result.recoveryCodes && result.session) {
      setStep({ kind: 'recovery', codes: result.recoveryCodes, session: result.session });
    } else {
      explain(result);
    }
  };

  const errorBox = error && (
    <div role="alert" className="flex items-start gap-2 border-s-4 border-danger bg-danger-soft px-3 py-2 text-sm text-danger">
      <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      {error}
    </div>
  );

  const header = (title: string, subtitle: string) => (
    <div className="border-b border-border bg-surface-header px-6 py-4">
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="mt-1 text-sm text-fg-muted">{subtitle}</p>
    </div>
  );

  if (step.kind === 'recovery') {
    return (
      <>
        {header(t('auth.recoveryTitle'), t('auth.recoverySubtitle'))}
        <div className="flex flex-col gap-4 px-6 py-5">
          <ul className="grid grid-cols-2 gap-2 font-mono text-sm" aria-label={t('auth.recoveryTitle')}>
            {step.codes.map((c) => (
              <li key={c} className="border border-border px-2 py-1 text-center">
                {c}
              </li>
            ))}
          </ul>
          <Button type="button" variant="primary" className="w-full" onClick={() => dispatch(finishMfaEnrollment(step.session))}>
            {t('auth.recoveryDone')}
          </Button>
        </div>
      </>
    );
  }

  if (step.kind === 'code') {
    const { enrollment } = step;
    return (
      <>
        {header(
          t(enrollment ? 'auth.mfaEnrollTitle' : 'auth.mfaTitle'),
          t(enrollment ? 'auth.mfaEnrollSubtitle' : 'auth.mfaSubtitle'),
        )}
        <form onSubmit={submitCode} className="flex flex-col gap-4 px-6 py-5">
          {errorBox}
          {enrollment && (
            <div className="flex flex-col items-center gap-2">
              <img src={enrollment.qrDataUrl} alt={t('auth.mfaQrAlt')} className="size-48" />
              <p className="text-center text-xs text-fg-muted">
                {t('auth.mfaManual')} <code className="break-all font-mono">{enrollment.secret}</code>
              </p>
            </div>
          )}
          <Field label={t('auth.mfaCode')} required>
            <Input
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={11}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </Field>
          <Button type="submit" variant="primary" disabled={submitting || !code.trim()} className="w-full">
            {submitting ? t('table.loading') : t('auth.mfaSubmit')}
          </Button>
          <button
            type="button"
            className="self-start text-sm text-primary underline underline-offset-2 hover:no-underline"
            onClick={() => {
              setStep({ kind: 'password' });
              setError(null);
            }}
          >
            {t('auth.mfaBack')}
          </button>
        </form>
      </>
    );
  }

  return (
    <>
      {header(t('auth.signInTitle'), t('auth.signInSubtitle'))}
      <form onSubmit={submitPassword} noValidate={false} className="flex flex-col gap-4 px-6 py-5">
        {errorBox}
        <Field label={t('auth.email')} required>
          <Input
            name="email"
            type="text"
            inputMode="email"
            dir="ltr"
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
