import { MenuItem } from 'routes/sitemap';
import { Link } from 'react-router-dom';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import IconifyIcon from 'components/base/IconifyIcon';
import sitemap from 'routes/sitemap';
import { useLocation } from 'react-router-dom';
const ListItem = ({ subheader, icon, path }: MenuItem) => {
  const location = useLocation();
  const active = path === sitemap.find((item) => item.path === location.pathname)?.path;
  return (
    <ListItemButton
      component={Link}
      to={`${path}`}
      sx={{ mb: 2.5, bgcolor: active ? 'info.main' : null }}
    >
      <ListItemIcon>
        {icon && (
          <IconifyIcon
            icon={icon}
            fontSize="h4.fontSize"
            sx={{
              color: active ? 'text.primary' : null,
            }}
          />
        )}
      </ListItemIcon>
      <ListItemText
        primary={subheader}
        sx={{
          '& .MuiListItemText-primary': {
            color: active ? 'text.primary' : null,
          },
        }}
      />
    </ListItemButton>
  );
};

export default ListItem;
