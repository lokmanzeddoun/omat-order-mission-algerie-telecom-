import { useState } from 'react';
import Menu from '@mui/material/Menu';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import ListItemIcon from '@mui/material/ListItemIcon';
import IconifyIcon from 'components/base/IconifyIcon';
import { Avatar } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store/rootReducer';
import { AppDispatch } from 'store';
import { logout } from 'components/auth/auth.thunk';
import AccountIcon from 'assets/icons/hugeicons--account-setting-02.svg?react';
import LogoutIcon from 'assets/icons/hugeicons--logout-03.svg?react';
import ProfileIcon from 'assets/icons/hugeicons--user-circle-02.svg?react';
import { FC, SVGProps } from 'react';
import { useNavigate } from 'react-router-dom';

interface MenuItems {
  id: number;
  title: string;
  icon: FC<SVGProps<SVGSVGElement>>;
}

const menuItems: MenuItems[] = [
  {
    id: 1,
    title: 'Voire Profile',
    icon: ProfileIcon,
  },
  {
    id: 2,
    title: 'Parametres',
    icon: AccountIcon,
  },
  {
    id: 6,
    title: 'Logout',
    icon: LogoutIcon,
  },
];

const ProfileMenu = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const dispatch = useDispatch<AppDispatch>();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };
  const handleProfileSubmit = () => {
    navigate('/dashboard/me');
  };
  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <>
      <ButtonBase
        onClick={handleProfileClick}
        aria-controls={open ? 'account-menu' : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup="true"
        disableRipple
      >
        <Avatar
          sx={{
            height: 48,
            width: 48,
            bgcolor: 'primary.main',
            fontWeight: 600,
          }}
        >
          {user?.nom?.charAt(0) || 'U'}
        </Avatar>
      </ButtonBase>

      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        sx={{
          mt: 1.5,
          '& .MuiList-root': {
            p: 0,
            width: 230,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box p={1}>
          <MenuItem onClick={handleProfileMenuClose} sx={{ '&:hover': { bgcolor: 'info.light' } }}>
            {/* <Avatar src={Avatar3} sx={{ mr: 1, height: 42, width: 42 }} /> */}
            <Stack direction="column">
              <Typography variant="body2" color="text.primary" fontWeight={600}>
                {user.nom}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={400}>
                {user.email}
              </Typography>
            </Stack>
          </MenuItem>
        </Box>

        <Divider sx={{ my: 0 }} />

        <Box p={1}>
          {menuItems.map((item) => {
            return (
              <MenuItem
                key={item.id}
                onClick={item.title === 'Logout' ? handleLogout : handleProfileSubmit}
                sx={{ py: 1 }}
              >
                <ListItemIcon
                  sx={{
                    mr: 1,
                    color: 'text.secondary',
                    fontSize: 'h5.fontSize',
                  }}
                >
                  <IconifyIcon icon={item.icon} />
                </ListItemIcon>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  {item.title}
                </Typography>
              </MenuItem>
            );
          })}
        </Box>
      </Menu>
    </>
  );
};

export default ProfileMenu;
