import { useState } from 'react';
import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import IconifyIcon from 'components/base/IconifyIcon';
import DeleteIcon from 'assets/icons/hugeicons--delete-02.svg?react';
import EditIcon from 'assets/icons/hugeicons--pencil-edit-02.svg?react';
import CreateIcon from 'assets/icons/solar--document-add-linear.svg?react';
import MenuIcon from 'assets/icons/iconamoon--menu-kebab-horizontal-fill.svg?react';
import { FC, SVGProps } from 'react';
interface Action {
  id: number;
  icon: FC<SVGProps<SVGSVGElement>>;
  title: string;
}

const actions: Action[] = [
  {
    id: 0,
    icon: CreateIcon,
    title: 'Ajouter',
  },
  {
    id: 1,
    icon: EditIcon,
    title: 'Editer',
  },
  {
    id: 2,
    icon: DeleteIcon,
    title: 'Supprimer',
  },
];

const ActionMenu = ({ user, onEdit, onDelete, handleMissionOpen }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleActionButtonClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleActionMenuClose = () => {
    setAnchorEl(null);
  };

  // const handleActionItemClick = () => {
  //   handleActionMenuClose();
  // };

  return (
    <Box pr={1.5}>
      <IconButton
        onClick={handleActionButtonClick}
        sx={{ p: 0.75, border: 'none', bgcolor: 'transparent !important' }}
        size="large"
      >
        <IconifyIcon icon={MenuIcon} color="action" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleActionMenuClose}
        onClick={handleActionMenuClose}
        sx={{
          mt: 0.5,
          '& .MuiList-root': {
            width: 140,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {actions.map((actionItem) => {
          return (
            <MenuItem
              key={actionItem.id}
              onClick={
                actionItem.id === 1 ? onEdit : actionItem.id === 2 ? onDelete : handleMissionOpen
              }
            >
              <ListItemIcon sx={{ mr: 1, fontSize: 'h5.fontSize' }}>
                <IconifyIcon
                  icon={actionItem.icon}
                  color={actionItem.id === 2 ? 'error' : actionItem.id == 0 ? 'primary' : 'action'}
                />
              </ListItemIcon>
              <ListItemText>
                <Typography
                  color={
                    actionItem.id === 2
                      ? 'error.main'
                      : actionItem.id === 0
                      ? 'primary'
                      : 'text.primary'
                  }
                >
                  {actionItem.title}
                </Typography>
              </ListItemText>
            </MenuItem>
          );
        })}
      </Menu>
    </Box>
  );
};

export default ActionMenu;
