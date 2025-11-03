import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store/rootReducer';
import { useNavigate } from 'react-router-dom';
import Stack from '@mui/material/Stack';
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
// ...existing code... (react-redux imports consolidated above)
import AppAlert from 'components/alert';
import { Button } from '@mui/material';
import MenuIcon from 'assets/icons/clarity--menu-line.svg?react';
import { useState } from 'react';
import ExerciceSelector from 'components/exercices/ExerciceSelector';
import DarkModeToggle from 'components/common/DarkModeToggle';

interface TopbarProps {
  isClosing: boolean;
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

// Small logo button used in the topbar (guarded navigation)
const LogoButtonSmall: React.FC = () => {
  const { loading } = useSelector((s: RootState) => s.auth);
  const navigate = useNavigate();
  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (loading) return;
    navigate('/');
  };

  return (
    <ButtonBase disableRipple sx={{ lineHeight: 0, display: { xs: 'none', sm: 'block', lg: 'none' } }} onClick={onClick}>
      <Image src={LogoImg} alt="logo" height={54} width={54} />
    </ButtonBase>
  );
};

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
      direction="row"
      px={3.5}
      height={90}
      alignItems="center"
      justifyContent="space-between"
      bgcolor="background.paper"
      position="sticky"
      top={0}
      zIndex={1200}
      sx={{
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        backdropFilter: 'blur(8px)',
        boxShadow: (theme) =>
          theme.palette.mode === 'dark'
            ? '0 1px 3px rgba(0, 0, 0, 0.3)'
            : '0 1px 3px rgba(0, 0, 0, 0.08)',
      }}
    >
      <Stack direction="row" spacing={{ xs: 1, sm: 2 }} alignItems="center">
        {/* Use programmatic navigation and guard with auth.loading */}
        <LogoButtonSmall />
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

      <Stack direction="row" spacing={{ xs: 1, sm: 2 }} alignItems="center">
        <DarkModeToggle />
        <ExerciceSelector />
        <Button variant="contained" color="primary" onClick={handleOpen}>
          Ajouter Mission
        </Button>
        <ProfileMenu />
      </Stack>
    </Stack>
  );
};

export default Topbar;
