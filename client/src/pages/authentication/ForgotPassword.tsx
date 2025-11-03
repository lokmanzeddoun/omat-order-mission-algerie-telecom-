import { useState } from 'react';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import Typography from '@mui/material/Typography';
import PageLoader from 'components/loader/PageLoader';
import http from 'helpers/http';
import { useNavigate } from 'react-router-dom';
import { rootPaths } from 'routes/paths';
import { useApiHandler } from 'components/hooks/useErrorHandler';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  // local guard to prevent double-submit from multiple clicks
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const { handleError, handleSuccess } = useApiHandler();
  const navigate = useNavigate();

  const submit = async (e: any) => {
    e.preventDefault();
    if (loading || submittedOnce) return;
    setLoading(true);
    setSubmittedOnce(true);
    try {
      await http.post('/comments', { title: 'Forgot password request', type: 'FORGET_PASSWORD', email });
      handleSuccess('Demande envoyée avec succès');
      navigate(rootPaths.root);
    } catch (err: any) {
      // Use the centralized error handler
      handleError(err);

      // If server explicitly says there is already a pending request, keep form disabled
      const msg = err?.response?.data?.message || err.message || '';
      const isPending = msg?.toLowerCase?.().includes('pending');

      if (!isPending) {
        // Allow retry on other errors
        setSubmittedOnce(false);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <Stack gap={2} component="form" onSubmit={submit} sx={{ maxWidth: 480, margin: '0 auto', px: 2 }}>
      <Typography variant="h3" align="center">Mot de passe oublié</Typography>
      <FormControl required fullWidth variant="outlined">
        {/* <InputLabel htmlFor="forgot-email">Votre email</InputLabel> */}
        <OutlinedInput
          id="forgot-email"
          placeholder="ex: vous@exemple.com"
          type="email"
          autoComplete="email"
          aria-describedby="forgot-email-helper"
        //   label="Votre email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {/* <FormHelperText id="forgot-email-helper">Nous créerons un ticket pour les administrateurs — ils vous contacteront.</FormHelperText> */}
      </FormControl>
      <Button type="submit" variant="contained" fullWidth disabled={loading || submittedOnce || !email.trim()}>Envoyer la demande</Button>
      <Button
        variant="text"
        fullWidth
        onClick={() => navigate(rootPaths.root)}
        sx={{ textTransform: 'none' }}
      >
        Retour à la connexion
      </Button>
    </Stack>
  );
};

export default ForgotPassword;
