import { useDispatch, useSelector } from 'react-redux';
import { IconButton, Tooltip } from '@mui/material';
import { RootState } from 'store/rootReducer';
import { toggleTheme } from 'store/theme.slice';
import { DarkMode, LightMode } from '@mui/icons-material';

const DarkModeToggle = () => {
  const dispatch = useDispatch();
  const themeMode = useSelector((state: RootState) => state.theme.mode);

  const handleToggle = () => {
    dispatch(toggleTheme());
  };

  return (
    <Tooltip title={themeMode === 'light' ? 'Activer le mode sombre' : 'Activer le mode clair'}>
      <IconButton
        onClick={handleToggle}
        color="inherit"
        sx={{
          '& svg': {
            fontSize: 24,
          },
        }}
      >
        {themeMode === 'light' ? (
          <DarkMode />
        ) : (
          <LightMode />
        )}
      </IconButton>
    </Tooltip>
  );
};

export default DarkModeToggle;
