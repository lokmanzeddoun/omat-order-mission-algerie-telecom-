import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
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
import SearchIcon from 'assets/icons/mynaui--search.svg?react';
import SolarIcon from 'assets/icons/solar--bell-outline.svg?react';

const Topbar = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { token } = useSelector((state: RootState) => state.auth);

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
      bgcolor="info.lighter"
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
          bgcolor="info.lighter"
          zIndex={1000}
        >
          <ButtonBase component={Link} href="/" disableRipple>
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
        <Button variant="contained" color="primary" onClick={handleOpen}>
          Ajouter Mission
        </Button>
        <IconButton size="large">
          <Badge color="error" variant="dot">
            <IconifyIcon icon={SolarIcon} />
          </Badge>
        </IconButton>
        <ProfileMenu />
      </Stack>
    </Stack>
  );
};

export default Topbar;
