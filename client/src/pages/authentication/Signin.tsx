import { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import IconifyIcon from 'components/base/IconifyIcon';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from 'store';
import { RootState } from 'store/rootReducer';
import { login } from 'components/auth/auth.thunk';
import { useNavigate } from 'react-router-dom';
import Splash from 'components/loader/Splash';
import MailIcon from 'assets/icons/hugeicons--mail-at-sign-02.svg?react';
import LockIcon from 'assets/icons/hugeicons--lock-key.svg?react';
import ViewIcon from 'assets/icons/fluent-mdl2--view.svg?react';
import HideIcon from 'assets/icons/fluent-mdl2--hide-3.svg?react';

const Signin = () => {
  const [isLoading, setIsLoading] = useState(false); // Track loading state
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  useEffect(() => {
    if (isAuthenticated) {
      // Redirect to dashboard or any other route if the user is authenticated
      navigate('/dashboard'); // You can change '/dashboard' to your desired route
    } else {
      setIsLoading(false); // Finish loading if not authenticated
    }
  }, [isAuthenticated, navigate]);

  const [userData, setUser] = useState<ReqLogin>({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUser({ ...userData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await dispatch(login(userData));
  };
  if (isLoading) {
    return <Splash />; // Fallback UI while checking authentication
  }
  return (
    <>
      <Typography align="center" variant="h4">
        Se Connecter
      </Typography>
      <Typography mt={1.5} align="center" variant="body2">
        Connextion à OMAT
      </Typography>

      <Stack component="form" mt={3} onSubmit={handleSubmit} direction="column" gap={2}>
        <TextField
          id="email"
          name="email"
          type="email"
          value={userData.email}
          onChange={handleInputChange}
          variant="filled"
          placeholder="Votre nom Email"
          autoComplete="email"
          fullWidth
          autoFocus
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <IconifyIcon icon={MailIcon} />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          id="password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          value={userData.password}
          onChange={handleInputChange}
          variant="filled"
          placeholder="Votre mot de pass"
          autoComplete="current-password"
          fullWidth
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <IconifyIcon icon={LockIcon} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment
                position="end"
                sx={{
                  opacity: userData.password ? 1 : 0,
                  pointerEvents: userData.password ? 'auto' : 'none',
                }}
              >
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  sx={{ border: 'none', bgcolor: 'transparent !important' }}
                  edge="end"
                >
                  <IconifyIcon icon={showPassword ? ViewIcon : HideIcon} color="neutral.light" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Stack mt={-2} alignItems="center" justifyContent="space-between">
          <FormControlLabel
            control={<Checkbox id="checkbox" name="checkbox" size="small" color="primary" />}
            label="Se souvenir de moi"
            sx={{ ml: -1 }}
          />
          <Link href="#!" fontSize="body2.fontSize">
            Mot de pass oublié?
          </Link>
        </Stack>

        <Button type="submit" variant="contained" size="medium" fullWidth>
          Se connecter
        </Button>
      </Stack>
    </>
  );
};

export default Signin;
