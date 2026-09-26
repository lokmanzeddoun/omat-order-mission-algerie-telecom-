import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import IconifyIcon from 'components/base/IconifyIcon';
import { useEffect, useState } from 'react';
import {
  Button,
  CardActions,
  FormControl,
  FormLabel,
  IconButton,
  InputAdornment,
  TextField,
  Avatar,
  Divider,
  Grid,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
import { AppDispatch } from 'store';
import { loadUser } from 'components/auth/auth.thunk';
import { RootState } from 'store/rootReducer';
import { setAlert } from 'components/alert/alert.reducer';
import { AlertTypes } from 'constants/alert';
import { changePassword } from 'components/users/users.thunk';
import ProfileIcon from 'assets/icons/pajamas--profile.svg?react';
import LockIcon from 'assets/icons/hugeicons--lock-key.svg?react';
import EditIcon from 'assets/icons/material-symbols--edit-rounded.svg?react';
import ViewIcon from 'assets/icons/fluent-mdl2--view.svg?react';
import HideIcon from 'assets/icons/fluent-mdl2--hide-3.svg?react';
import HomeIcon from 'assets/icons/ic--outline-home.svg?react';

export default function MyProfile() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, token } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      dispatch(setAlert({ msg: 'Tous les champs sont obligatoires', type: AlertTypes.ERROR }));
      return;
    }

    if (newPassword !== confirmPassword) {
      dispatch(setAlert({ msg: 'Les mots de passe ne correspondent pas', type: AlertTypes.ERROR }));
      return;
    }

    if (newPassword.length < 8) {
      dispatch(setAlert({ msg: 'Le mot de passe doit contenir au moins 8 caractères', type: AlertTypes.ERROR }));
      return;
    }

    setIsSubmitting(true);
    try {
      await dispatch(
        changePassword(token, {
          currentPassword,
          password: newPassword,
          passwordConfirm: confirmPassword,
        }),
      ).unwrap();

      dispatch(setAlert({ msg: 'Mot de passe modifié avec succès', type: AlertTypes.SUCCESS }));

      // Reset input fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      dispatch(
        setAlert({
          msg: 'Erreur lors de la modification du mot de passe',
          type: AlertTypes.ERROR,
        }),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      if (!user.grade) {
        await dispatch(loadUser());
      }
    };

    fetchUser();
  }, [dispatch, user.grade]);

  return (
    <Box sx={{ flex: 1, width: '100%', px: { xs: 2, md: 6 }, py: { xs: 2, md: 4 } }}>
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }} separator=">">
        <Link
          component={RouterLink}
          to="/dashboard"
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          color="inherit"
        >
          <IconifyIcon icon={HomeIcon} />
          Accueil
        </Link>
        <Typography sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 600 }}>
          <IconifyIcon icon={ProfileIcon} fontSize="1rem" />
          Mon Profil
        </Typography>
      </Breadcrumbs>


      <Typography
        component="h1"
        sx={{
          fontSize: { xs: '1.75rem', md: '2rem' },
          fontWeight: 700,
          color: 'text.primary',
          mb: 4
        }}
      >
        Mon Profil
      </Typography>

      {/* Main Content */}
      <Grid container spacing={3} sx={{ maxWidth: '1200px', mx: 'auto' }}>
        {/* Profile Information Card */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ border: 1, borderColor: 'divider', height: '100%' }}>
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <IconifyIcon icon={ProfileIcon} fontSize="1.5rem" color="primary.main" />
                <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                  Informations Personnelles
                </Typography>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Stack spacing={3}>
                {/* Avatar Section */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <Box sx={{ position: 'relative' }}>
                    <Avatar
                      sx={{
                        width: 120,
                        height: 120,
                        fontSize: '2.5rem',
                        bgcolor: 'primary.main',
                        boxShadow: 3,
                      }}
                    >
                      {user.nom?.[0]}{user.prenom?.[0]}
                    </Avatar>
                    <IconButton
                      aria-label="modifier la photo"
                      size="small"
                      sx={{
                        bgcolor: 'background.paper',
                        position: 'absolute',
                        zIndex: 2,
                        borderRadius: '50%',
                        right: 5,
                        bottom: 5,
                        boxShadow: 2,
                        border: '2px solid',
                        borderColor: 'divider',
                        '&:hover': { bgcolor: 'primary.light' },
                      }}
                    >
                      <IconifyIcon icon={EditIcon} fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                {/* Name Fields */}
                <FormControl fullWidth>
                  <FormLabel sx={{ mb: 1, fontWeight: 500 }}>Nom</FormLabel>
                  <TextField
                    size="small"
                    variant="outlined"
                    placeholder="Nom"
                    defaultValue={user.nom}
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                </FormControl>

                <FormControl fullWidth>
                  <FormLabel sx={{ mb: 1, fontWeight: 500 }}>Prénom</FormLabel>
                  <TextField
                    size="small"
                    variant="outlined"
                    placeholder="Prénom"
                    defaultValue={user.prenom}
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                </FormControl>

                <FormControl fullWidth>
                  <FormLabel sx={{ mb: 1, fontWeight: 500 }}>Matricule</FormLabel>
                  <TextField
                    size="small"
                    variant="outlined"
                    placeholder="Matricule"
                    defaultValue={user.matricule}
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                </FormControl>

                <FormControl fullWidth>
                  <FormLabel sx={{ mb: 1, fontWeight: 500 }}>Grade</FormLabel>
                  <TextField
                    size="small"
                    variant="outlined"
                    placeholder="Grade"
                    defaultValue={user.grade}
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                </FormControl>

                <FormControl fullWidth>
                  <FormLabel sx={{ mb: 1, fontWeight: 500 }}>Email</FormLabel>
                  <TextField
                    size="small"
                    variant="outlined"
                    type="email"
                    placeholder="Email"
                    defaultValue={user.email}
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                </FormControl>
              </Stack>
            </Box>
          </Card>
        </Grid>

        {/* Password Change Card */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ border: 1, borderColor: 'divider', height: '100%' }}>
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <IconifyIcon icon={LockIcon} fontSize="1.5rem" color="primary.main" />
                <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                  Changer le mot de passe
                </Typography>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Stack spacing={3}>
                <FormControl fullWidth>
                  <FormLabel sx={{ mb: 1, fontWeight: 500 }}>Mot de passe actuel</FormLabel>
                  <TextField
                    type={showCurrentPassword ? 'text' : 'password'}
                    size="small"
                    variant="outlined"
                    placeholder="Entrez votre mot de passe actuel"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconifyIcon icon={LockIcon} color="action.active" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="afficher/masquer le mot de passe"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            edge="end"
                            size="small"
                          >
                            <IconifyIcon
                              icon={showCurrentPassword ? ViewIcon : HideIcon}
                              color="action.active"
                            />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </FormControl>

                <FormControl fullWidth>
                  <FormLabel sx={{ mb: 1, fontWeight: 500 }}>Nouveau mot de passe</FormLabel>
                  <TextField
                    type={showNewPassword ? 'text' : 'password'}
                    size="small"
                    variant="outlined"
                    placeholder="Entrez le nouveau mot de passe (min. 8 caractères)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconifyIcon icon={LockIcon} color="action.active" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="afficher/masquer le mot de passe"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            edge="end"
                            size="small"
                          >
                            <IconifyIcon
                              icon={showNewPassword ? ViewIcon : HideIcon}
                              color="action.active"
                            />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </FormControl>

                <FormControl fullWidth>
                  <FormLabel sx={{ mb: 1, fontWeight: 500 }}>Confirmer le mot de passe</FormLabel>
                  <TextField
                    type={showConfirmPassword ? 'text' : 'password'}
                    size="small"
                    variant="outlined"
                    placeholder="Confirmez le nouveau mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconifyIcon icon={LockIcon} color="action.active" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="afficher/masquer le mot de passe"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                            size="small"
                          >
                            <IconifyIcon
                              icon={showConfirmPassword ? ViewIcon : HideIcon}
                              color="action.active"
                            />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </FormControl>

                <Divider sx={{ my: 2 }} />

                <CardActions sx={{ justifyContent: 'flex-end', p: 0 }}>
                  <Button
                    variant="outlined"
                    size="medium"
                    onClick={() => {
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    disabled={isSubmitting}
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="contained"
                    size="medium"
                    color="primary"
                    onClick={handlePasswordChange}
                    disabled={isSubmitting || !currentPassword || !newPassword || !confirmPassword}
                  >
                    {isSubmitting ? 'En cours...' : 'Modifier'}
                  </Button>
                </CardActions>
              </Stack>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
