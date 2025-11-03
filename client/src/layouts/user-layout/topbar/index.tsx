// Link intentionally removed (we use programmatic navigation)
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import IconifyIcon from 'components/base/IconifyIcon';
import Image from 'components/base/Image';
import LogoImg from 'assets/Logo.png';
import ProfileMenu from './ProfileMenu';
import AppAlert from 'components/alert';
import { Button, Typography } from '@mui/material';
import MissionModal from 'components/orders/CreateOrder';
import { useState } from 'react';
import { addOrder } from 'components/orders/orderthunk';
import { AppDispatch } from 'store';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store/rootReducer';
import { useNavigate } from 'react-router-dom';
import paths, { rootPaths } from 'routes/paths';
import SearchIcon from 'assets/icons/mynaui--search.svg?react';
import DarkModeToggle from 'components/common/DarkModeToggle';

const Topbar = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { token } = useSelector((state: RootState) => state.auth);

  const { isAuthenticated, loading, user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // If auth is still initializing, ignore clicks to avoid flashing login
    if (loading) return;
    if (isAuthenticated) {
      // Redirect based on role similar to RedirectBasedOnRole
      if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
        navigate(`${rootPaths.dashboard}/admins`);
        return;
      }
      if (user?.role === 'USER') {
        navigate(`${rootPaths.dashboard}/users`);
        return;
      }
      // default to dashboard
      navigate(rootPaths.dashboard);
      return;
    }
    // not authenticated -> go to sign-in
    navigate(paths.signin);
  };

  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleUserSubmit = async (data: any) => {
    await dispatch(addOrder(data, token));
    // await dispatch(getAllUsers());
    setOpen(false);
    // Handle the submission (e.g., send data to a backend)
  };

  return (
    <Stack
      direction="row"
      px={3.5}
      height={90}
      alignItems="center"
      justifyContent="space-between"
      bgcolor="background.paper"
      position="sticky"
      top={0}
      zIndex={1200}
    >
      <Stack direction="row" spacing={{ xs: 1, sm: 2 }} alignItems="center">
        <Stack
          position="sticky"
          top={0}
          pt={4}
          pb={2.5}
          alignItems="center"
          bgcolor="background.paper"
          zIndex={1000}
        >
          <ButtonBase onClick={handleLogoClick} disableRipple>
            <Image src={LogoImg} alt="logo" height={40} width={40} sx={{ mr: 1.25 }} />
            <Typography variant="h3" color="text.primary" letterSpacing={1}>
              OMAT
            </Typography>
          </ButtonBase>
        </Stack>

        <Toolbar sx={{ display: { xm: 'block', md: 'none' } }}>
          <IconButton size="large" edge="start" color="inherit" aria-label="search">
            <IconifyIcon icon={SearchIcon} />
          </IconButton>
        </Toolbar>
        <MissionModal open={open} onClose={handleClose} onSubmit={handleUserSubmit} />
        {/* <TextField
          variant="filled"
          placeholder="Recherche Un Ordre"
          sx={{ width: 350, display: { xs: 'none', md: 'flex' } }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconifyIcon icon={'mynaui:search'} />
              </InputAdornment>
            ),
          }}
        /> */}
      </Stack>
      <AppAlert />

      <Stack direction="row" spacing={{ xs: 1, sm: 2 }} alignItems="center">
        {/* <LanguageSelect /> */}
        <DarkModeToggle />
        <Button variant="contained" color="primary" onClick={handleOpen}>
          Ajouter Mission
        </Button>
        <ProfileMenu />
      </Stack>
    </Stack>
  );
};

export default Topbar;
