import { useState } from 'react';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import FormHelperText from '@mui/material/FormHelperText';
import Typography from '@mui/material/Typography';
import PageLoader from 'components/loader/PageLoader';
import http from 'helpers/http';
import { useNavigate } from 'react-router-dom';
import { rootPaths } from 'routes/paths';
import { setAlert } from 'components/alert/alert.reducer';
import { useDispatch } from 'react-redux';
import { AppDispatch } from 'store';
import { AlertTypes } from 'constants/alert';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  // local guard to prevent double-submit from multiple clicks
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const submit = async (e: any) => {
    e.preventDefault();
    if (loading || submittedOnce) return;
    setLoading(true);
    setSubmittedOnce(true);
    try {
      await http.post('/comments', { title: 'Forgot password request', type: 'FORGET_PASSWORD', email });
      dispatch(setAlert({ msg: 'request submitted', type: AlertTypes.SUCCESS }));
      navigate(rootPaths.root);
    } catch (err: any) {
      // show server-provided message (e.g., existing pending request) and allow retry for other errors
      const msg = err?.response?.data?.message || err.message;
      dispatch(setAlert({ msg, type: AlertTypes.ERROR }));
      // If server explicitly says there is already a pending request, keep form disabled but inform user
      if (msg?.toLowerCase?.().includes('pending password reset') || msg?.toLowerCase?.().includes('pending password') || msg?.toLowerCase?.().includes('pending')) {
        // leave submittedOnce true to prevent further submissions
      } else {
        // allow retry on other errors
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
        <FormHelperText id="forgot-email-helper">Nous créerons un ticket pour les administrateurs — ils vous contacteront.</FormHelperText>
      </FormControl>
  <Button type="submit" variant="contained" fullWidth disabled={loading || submittedOnce || !email.trim()}>Envoyer la demande</Button>
    </Stack>
  );
};

export default ForgotPassword;
