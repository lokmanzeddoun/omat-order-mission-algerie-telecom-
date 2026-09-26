import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import http from 'helpers/http';
import { useApiHandler } from 'components/hooks/useErrorHandler';
import { Button, Field, Input } from 'components/ui';
import paths from 'routes/paths';

/** Sends a password-reset request to the administrators (same request as before). */
const ForgotPassword = () => {
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
      handleSuccess('Demande envoyée avec succès');
      navigate(paths.signin);
    } catch (err) {
      handleError(err);
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ?? (err as Error)?.message ?? '';
      if (!msg.toLowerCase().includes('pending')) setSubmittedOnce(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="border-b border-border bg-surface-header px-6 py-4">
        <h1 className="text-lg font-semibold">Mot de passe oublié</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Indiquez votre adresse e-mail : une demande est transmise aux administrateurs, qui vous recontacteront.
        </p>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-4 px-6 py-5">
        <Field label="Adresse e-mail" required>
          <Input type="email" autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Button type="submit" variant="primary" className="w-full" disabled={loading || submittedOnce || !email.trim()}>
          {loading ? 'Envoi…' : 'Envoyer la demande'}
        </Button>
        <Link to={paths.signin} className="self-start text-sm text-primary underline underline-offset-2 hover:no-underline">
          Retour à la connexion
        </Link>
      </form>
    </>
  );
};

export default ForgotPassword;
