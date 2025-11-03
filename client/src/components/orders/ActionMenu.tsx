import { useState } from 'react';
import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import { Archive as ArchiveIcon } from '@mui/icons-material';
import IconifyIcon from 'components/base/IconifyIcon';
import DeleteIcon from 'assets/icons/hugeicons--delete-02.svg?react';
import ValidateIcon from 'assets/icons/hugeicons--document-validation.svg?react';
import EditIcon from 'assets/icons/hugeicons--pencil-edit-02.svg?react';
import MenuIcon from 'assets/icons/iconamoon--menu-kebab-horizontal-fill.svg?react';
import { FC, SVGProps } from 'react';
import { IMission } from './orderReducer';

interface Action {
  id: number;
  icon: FC<SVGProps<SVGSVGElement>> | any;
  title: string;
  isMuiIcon?: boolean;
  showCondition?: (mission: IMission) => boolean;
}

const actions: Action[] = [
  {
    id: 3,
    icon: ValidateIcon,
    title: 'Valider',
    isMuiIcon: false,
    showCondition: (mission) => (mission?.status ?? '') !== 'COMPLETED',
  },
  {
    id: 1,
    icon: EditIcon,
    title: 'Editer',
    isMuiIcon: false,
    showCondition: () => true,
  },
  {
    id: 4,
    icon: ArchiveIcon,
    title: 'Archiver',
    isMuiIcon: true,
    showCondition: (mission) => (mission?.status ?? '') === 'COMPLETED',
  },
  {
    id: 2,
    icon: DeleteIcon,
    title: 'Annuler',
    isMuiIcon: false,
    showCondition: (mission) => (mission?.status ?? '') !== 'COMPLETED',
  },
];

interface ActionMenuProps {
  order: IMission;
  onEdit?: (order: IMission) => void;
  onDelete?: (order: IMission) => void;
  onValidate?: (order: IMission) => void;
  onArchive?: (order: IMission) => void;
}

const ActionMenu = ({ order, onEdit, onDelete, onValidate, onArchive }: ActionMenuProps) => {
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
        onEdit?.(order);
        break;
      case 2:
        onDelete?.(order);
        break;
      case 3:
        onValidate?.(order);
        break;
      case 4:
        onArchive?.(order);
        break;
      default:
        break;
    }
    handleActionMenuClose();
  };

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
        {actions
          .filter((actionItem) => !actionItem.showCondition || actionItem.showCondition(order))
          .map((actionItem) => {
          const IconComponent = actionItem.icon;
          const textColor = actionItem.id === 3
            ? 'success.main'
            : actionItem.id === 2
              ? 'error.main'
              : actionItem.id === 4
                ? 'warning.main'
                : 'text.primary';

          return (
            <MenuItem key={actionItem.id} onClick={() => handleActionItemClick(actionItem.id)}>
              <ListItemIcon sx={{ mr: 1, fontSize: 'h5.fontSize' }}>
                {actionItem.isMuiIcon ? (
                  <IconComponent sx={{ color: textColor }} />
                ) : (
                  <IconifyIcon icon={IconComponent} sx={{ color: textColor }} />
                )}
              </ListItemIcon>
              <ListItemText>
                <Typography color={textColor}>
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
