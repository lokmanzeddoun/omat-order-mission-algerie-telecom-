import { useState } from 'react';
import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import IconifyIcon from 'components/base/IconifyIcon';
import ValidateIcon from 'assets/icons/hugeicons--document-validation.svg?react';
import DeleteIcon from 'assets/icons/hugeicons--delete-02.svg?react';
import MenuIcon from 'assets/icons/iconamoon--menu-kebab-horizontal-fill.svg?react';
import { FC, SVGProps } from 'react';

interface Action {
  id: number;
  icon: FC<SVGProps<SVGSVGElement>>;
  title: string;
  showCondition?: (decompte: any, isAdmin: boolean) => boolean;
}

const actions: Action[] = [
  {
    id: 1,
    icon: ValidateIcon,
    title: 'Accepter',
    showCondition: (decompte, isAdmin) => isAdmin && decompte?.status === 'PENDING',
  },
  {
    id: 2,
    icon: DeleteIcon,
    title: 'Rejeter',
    showCondition: (decompte, isAdmin) => isAdmin && decompte?.status === 'PENDING',
  },
];

interface DecompteActionMenuProps {
  decompte: any;
  isAdmin: boolean;
  onAccept?: (decompte: any) => void;
  onReject?: (decompte: any) => void;
}

const DecompteActionMenu = ({ decompte, isAdmin, onAccept, onReject }: DecompteActionMenuProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleActionButtonClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleActionMenuClose = () => {
    setAnchorEl(null);
  };

  const handleActionItemClick = (id: number) => {
    switch (id) {
      case 1:
        onAccept?.(decompte);
        break;
      case 2:
        onReject?.(decompte);
        break;
      default:
        break;
    }
    handleActionMenuClose();
  };

  const visibleActions = actions.filter(
    (action) => !action.showCondition || action.showCondition(decompte, isAdmin)
  );

  // Don't show menu if no actions are available
  if (visibleActions.length === 0) {
    return null;
  }

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
        id="decompte-action-menu"
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
        {visibleActions.map((actionItem) => {
          return (
            <MenuItem key={actionItem.id} onClick={() => handleActionItemClick(actionItem.id)}>
              <ListItemIcon sx={{ mr: 1, fontSize: 'h5.fontSize' }}>
                <IconifyIcon
                  icon={actionItem.icon}
                  color={actionItem.id === 1 ? 'success' : actionItem.id === 2 ? 'error' : 'action'}
                />
              </ListItemIcon>
              <ListItemText>
                <Typography
                  color={
                    actionItem.id === 1
                      ? 'success.main'
                      : actionItem.id === 2
                        ? 'error.main'
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

export default DecompteActionMenu;
