import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import IconifyIcon from 'components/base/IconifyIcon'; // Custom component
import { SyntheticEvent, useEffect, useState } from 'react';
import {
  Button,
  CardActions,
  FormControl,
  FormLabel,
  IconButton,
  InputAdornment,
  TextField,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from 'store';
import { loadUser } from 'components/auth/auth.thunk';
import { RootState } from 'store/rootReducer';
import { setAlert } from 'components/alert/alert.reducer';
import { AlertTypes } from 'constants/alert';
import { changePassword } from 'components/users/users.thunk';
import AppAlert from 'components/alert';
import ProfileIcon from 'assets/icons/pajamas--profile.svg?react';
import LockIcon from 'assets/icons/hugeicons--lock-key.svg?react';
import EditIcon from 'assets/icons/material-symbols--edit-rounded.svg?react';
import ViewIcon from 'assets/icons/fluent-mdl2--view.svg?react';
import HideIcon from 'assets/icons/fluent-mdl2--hide-3.svg?react';
import HomeIcon from 'assets/icons/ic--outline-home.svg?react';

export default function MyProfile() {
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [showPassword3, setShowPassword3] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { user, token } = useSelector((state: RootState) => state.auth);

  const [value, setValue] = useState(0);
  // const dispatch = useDispatch<AppDispatch>();

  const handleChange = (event: SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };
  const dispatch = useDispatch<AppDispatch>();

  const handleSubmit = async () => {
    if (newPassword !== confirmPassword) {
      dispatch(setAlert({ msg: 'Mot de passe confirmation errone', type: AlertTypes.ERROR }));
      return;
    }
    try {
      await dispatch(
        changePassword(token, {
          currentPassword,
          password: newPassword,
          passwordConfirm: confirmPassword,
        }),
      );

      // Reset input fields
      setConfirmPassword('');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      // Handle error appropriately, e.g., set an alert
      dispatch(
        setAlert({
          msg: 'Erreur lors de la modification du mot de passe',
          type: AlertTypes.ERROR,
        }),
      );
    }
  };
  useEffect(() => {
    const fetchUser = async () => {
      if (!user.grade) {
        await dispatch(loadUser());
      }
    };

    fetchUser(); // Call the async function
  }, [dispatch, user.grade]); // Ensure user and dispatch are in the dependency array
  return (
    <Box sx={{ flex: 1, width: '100%', px: { xs: 2, md: 6 }, py: { xs: 2, md: 4 } }}>
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1, pl: 0 }} separator=">">
        <Link
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          color="inherit"
          href="/omat/dashboard"
        >
          <IconifyIcon icon={HomeIcon} />
        </Link>
        <Typography sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 600 }}>
          <IconifyIcon icon={ProfileIcon} fontSize="1rem" />
          Profile
        </Typography>
      </Breadcrumbs>
      <AppAlert />
      <Typography
        component="h1"
        sx={{ fontSize: { xs: '1.75rem', md: '2rem' }, fontWeight: 700, color: 'text.primary' }}
      >
        Mon Profile
      </Typography>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={value} onChange={handleChange} aria-label="user profile">
          <Tab label="User Profile" />
          <Tab label="Contact" />
          <Tab label="Address" />
        </Tabs>
      </Box>

      {/* Personal Info Section */}
      <Stack
        spacing={5}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '800px',
          mx: 'auto',
          px: { xs: 2, md: 6 },
          py: { xs: 2, md: 3 },
        }}
      >
        {value === 0 && (
          <Stack
            spacing={6}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              maxWidth: '1000px',
              mx: 'auto',
              px: { xs: 2, md: 6 },
              py: { xs: 2, md: 3 },
            }}
          >
            <Card sx={{ border: 1, borderColor: 'divider' }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" component="h4">
                  Information Personelle
                </Typography>
                <Typography>
                  Personnalisez l'apparence de vos informations de profil sur le réseau.
                </Typography>
              </Box>
              {/* <Divider /> */}
              <Stack
                direction="row"
                spacing={2}
                sx={{
                  display: { xs: 'none', md: 'flex' },
                  my: 1,
                  py: 2,
                  borderTop: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Stack direction="column" spacing={1}>
                  <Box sx={{ position: 'relative', width: 120, height: 120 }}>
                    <Box
                      sx={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      <Box
                        component="img"
                        src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=286"
                        alt=""
                        loading="lazy"
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                        }}
                      />
                    </Box>
                    <IconButton
                      aria-label="upload new picture"
                      size="small"
                      sx={{
                        bgcolor: 'background.paper',
                        position: 'absolute',
                        zIndex: 2,
                        borderRadius: '50%',
                        right: 5,
                        bottom: 5,
                        boxShadow: 1,
                        '&:hover': { bgcolor: 'background.paper' },
                      }}
                    >
                      <IconifyIcon icon={EditIcon} fontSize="small" />
                    </IconButton>
                  </Box>
                </Stack>
                <Stack spacing={1} sx={{ flexDirection: 'column', flexGrow: 1 }}>
                  <FormLabel sx={{ pl: 2 }}>Name</FormLabel>
                  <FormControl
                    sx={{
                      display: 'flex',
                      flexDirection: 'row',
                      gap: 2,
                    }}
                  >
                    <TextField
                      size="small"
                      variant="outlined"
                      placeholder="nom"
                      defaultValue={user.nom}
                    />
                    <TextField
                      size="small"
                      variant="outlined"
                      placeholder="Prenom"
                      defaultValue={user.prenom}
                    />
                  </FormControl>
                  <FormControl sx={{ flexGrow: 1, gap: 1 }}>
                    <FormLabel sx={{ pl: 2 }}>Grade</FormLabel>
                    <TextField
                      size="small"
                      variant="outlined"
                      placeholder="Votre Grade"
                      defaultValue={user.grade}
                    />
                  </FormControl>
                  <FormControl sx={{ flexGrow: 1, gap: 1 }}>
                    <FormLabel sx={{ pl: 2 }}>Email</FormLabel>
                    <TextField
                      size="small"
                      variant="outlined"
                      type="email"
                      sx={{ flexGrow: 1 }}
                      placeholder="Votre Email"
                      defaultValue={user.email}
                    />
                  </FormControl>
                </Stack>
              </Stack>
              <Stack
                sx={{
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  justifyContent: 'flex-end', // Align buttons to the right
                }}
              >
                <CardActions sx={{ pt: 2 }}>
                  <Button size="small" variant="contained" color="primary">
                    Sauvegarder
                  </Button>
                </CardActions>
              </Stack>
            </Card>
            <Card sx={{ border: 1, borderColor: 'divider' }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" component="h4">
                  Changer le mot de pass{' '}
                </Typography>
                <Typography>
                  Mettre à jour votre mot de passe pour sécuriser votre compte.{' '}
                </Typography>
              </Box>
              <Stack
                spacing={2}
                sx={{ my: 1, p: 2, borderTop: '1px solid', borderColor: 'divider' }}
                flexDirection={'column'}
              >
                <TextField
                  type={showPassword ? 'text' : 'password'}
                  size="medium"
                  variant="outlined"
                  placeholder="mot de pass courant"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
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
                          opacity: 1,
                          pointerEvents: 'auto',
                        }}
                      >
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword(!showPassword)}
                          sx={{ border: 'none', bgcolor: 'transparent !important' }}
                          edge="end"
                        >
                          <IconifyIcon
                            icon={showPassword ? ViewIcon : HideIcon}
                            color="neutral.light"
                          />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  type={showPassword2 ? 'text' : 'password'}
                  size="medium"
                  variant="outlined"
                  placeholder="Noveau Mot De pass"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
                          opacity: 1,
                          pointerEvents: 'auto',
                        }}
                      >
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword2(!showPassword2)}
                          sx={{ border: 'none', bgcolor: 'transparent !important' }}
                          edge="end"
                        >
                          <IconifyIcon
                            icon={showPassword2 ? ViewIcon : HideIcon}
                            color="neutral.light"
                          />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  type={showPassword3 ? 'text' : 'password'}
                  size="medium"
                  variant="outlined"
                  placeholder="confirmer le noveau mot de pass"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                          opacity: 1,
                          pointerEvents: 'auto',
                        }}
                      >
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword3(!showPassword3)}
                          sx={{ border: 'none', bgcolor: 'transparent !important' }}
                          edge="end"
                        >
                          <IconifyIcon
                            icon={showPassword3 ? ViewIcon : HideIcon}
                            color="neutral.light"
                          />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Stack>
              <CardActions
                sx={{
                  justifyContent: 'flex-end',
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  pt: 2,
                }}
              >
                <Button size="small" variant="contained" color="primary" onClick={handleSubmit}>
                  Sauvegarder
                </Button>
              </CardActions>
            </Card>
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
