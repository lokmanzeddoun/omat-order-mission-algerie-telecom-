import { useState, type FormEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from 'store';
import type { RootState } from 'store/rootReducer';
import { changePassword } from 'components/users/users.thunk';
import { Button, Field, PasswordInput } from 'components/ui';

export default function ChangePassword() {
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
      setError('Le mot de passe doit contenir au moins 12 caractères.');
      return;
    }
    if (password !== passwordConfirm) {
      setError('Les mots de passe ne correspondent pas.');
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
          <h1 className="text-lg font-semibold">Choisir un nouveau mot de passe</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Le mot de passe temporaire doit être remplacé avant d’accéder à l’application.
          </p>
        </header>
        <form onSubmit={submit} className="flex flex-col gap-4 px-6 py-5">
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <Field label="Mot de passe temporaire" required>
            <PasswordInput
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </Field>
          <Field label="Nouveau mot de passe" hint="12 à 128 caractères." required>
            <PasswordInput
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
          <Field label="Confirmer le mot de passe" required>
            <PasswordInput
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(event) => setPasswordConfirm(event.target.value)}
            />
          </Field>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Enregistrement…' : 'Enregistrer et se reconnecter'}
          </Button>
        </form>
      </section>
    </main>
  );
}
