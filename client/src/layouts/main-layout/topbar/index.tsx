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
import { addOrder } from 'components/orders/orderthunk';
import { AppDispatch } from 'store';
import MissionModal from 'components/orders/CreateOrder';
import { useDispatch, useSelector } from 'react-redux';
import AppAlert from 'components/alert';
import { Button } from '@mui/material';
import MenuIcon from 'assets/icons/clarity--menu-line.svg?react';
import SolarIcon from 'assets/icons/solar--bell-outline.svg?react';
import { useState } from 'react';
import { RootState } from 'store/rootReducer';

interface TopbarProps {
  isClosing: boolean;
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const Topbar = ({ isClosing, mobileOpen, setMobileOpen }: TopbarProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { token } = useSelector((state: RootState) => state.auth);
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleDrawerToggle = () => {
    if (!isClosing) {
      setMobileOpen(!mobileOpen);
    }
  };
  const handleUserSubmit = async (data: any) => {
    await dispatch(addOrder(data, token));
    // await dispatch(getAllUsers());
    setOpen(false);
    // Handle the submission (e.g., send data to a backend)
  };

  return (
    <Stack
      px={3.5}
      height={90}
      alignItems="center"
      justifyContent="space-between"
      bgcolor="info.lighter"
      position="sticky"
      top={0}
      zIndex={1200}
    >
      <Stack spacing={{ xs: 1, sm: 2 }} alignItems="center">
        <ButtonBase
          component={Link}
          href="/"
          disableRipple
          sx={{ lineHeight: 0, display: { xs: 'none', sm: 'block', lg: 'none' } }}
        >
          <Image src={LogoImg} alt="logo" height={54} width={54} />
        </ButtonBase>
        <Toolbar sx={{ display: { xm: 'block', lg: 'none' } }}>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleDrawerToggle}
          >
            <IconifyIcon icon={MenuIcon} />
          </IconButton>
        </Toolbar>
        <MissionModal open={open} onClose={handleClose} onSubmit={handleUserSubmit} />
      </Stack>
      <AppAlert />

      <Stack spacing={{ xs: 1, sm: 2 }} alignItems="center">
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
