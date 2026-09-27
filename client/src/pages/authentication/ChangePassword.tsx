import { useState, type FormEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import type { AppDispatch } from 'store';
import type { RootState } from 'store/rootReducer';
import { changePassword } from 'components/users/users.thunk';
import { Button, Field, PasswordInput } from 'components/ui';

export default function ChangePassword() {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const token = useSelector((state: RootState) => state.auth.token);
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (password.length < 12) {
      setError(t('profile:errors.min'));
      return;
    }
    if (password !== passwordConfirm) {
      setError(t('users:password.mismatch'));
      return;
    }
    setError(null);
    setSubmitting(true);
    await dispatch(
      changePassword(token, { currentPassword, password, passwordConfirm }),
    );
    setSubmitting(false);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-8">
      <section className="w-full border border-border bg-surface shadow-sm">
        <header className="border-b border-border bg-surface-header px-6 py-4">
          <h1 className="text-lg font-semibold">{t('auth.changePasswordTitle')}</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {t('auth.changePasswordSubtitle')}
          </p>
        </header>
        <form onSubmit={submit} className="flex flex-col gap-4 px-6 py-5">
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <Field label={t('auth.tempPassword')} required>
            <PasswordInput
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </Field>
          <Field label={t('users:password.new')} hint={t('profile:hint')} required>
            <PasswordInput
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
          <Field label={t('users:password.confirm')} required>
            <PasswordInput
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(event) => setPasswordConfirm(event.target.value)}
            />
          </Field>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? t('auth.saving') : t('auth.saveAndReconnect')}
          </Button>
        </form>
      </section>
    </main>
  );
}
