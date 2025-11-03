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
import { LockReset as LockResetIcon } from '@mui/icons-material';
import { FC, SVGProps } from 'react';

interface Action {
  id: number;
  icon: FC<SVGProps<SVGSVGElement>> | typeof LockResetIcon;
  title: string;
  color?: string;
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
    icon: LockResetIcon as any,
    title: 'Réinitialiser MDP',
    color: 'warning',
  },
  {
    id: 3,
    icon: DeleteIcon,
    title: 'Supprimer',
    color: 'error',
  },
];

interface ActionMenuProps {
  user: any;
  onEdit: () => void;
  onDelete: () => void;
  handleMissionOpen: () => void;
  onResetPassword: () => void;
}

const ActionMenu: React.FC<ActionMenuProps> = ({
  onEdit,
  onDelete,
  handleMissionOpen,
  onResetPassword
}) => {
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
          const handleClick = () => {
            if (actionItem.id === 0) handleMissionOpen();
            else if (actionItem.id === 1) onEdit();
            else if (actionItem.id === 2) onResetPassword();
            else if (actionItem.id === 3) onDelete();
          };

          return (
            <MenuItem key={actionItem.id} onClick={handleClick}>
              <ListItemIcon sx={{ mr: 1, fontSize: 'h5.fontSize' }}>
                {typeof actionItem.icon === 'function' && actionItem.icon.name !== 'LockResetIcon' ? (
                  <IconifyIcon
                    icon={actionItem.icon as FC<SVGProps<SVGSVGElement>>}
                    color={(actionItem.color as any) || (actionItem.id === 0 ? 'primary' : 'action')}
                  />
                ) : (
                  <LockResetIcon color="warning" fontSize="small" />
                )}
              </ListItemIcon>
              <ListItemText>
                <Typography
                  color={
                    actionItem.color === 'error'
                      ? 'error.main'
                      : actionItem.color === 'warning'
                      ? 'warning.main'
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
