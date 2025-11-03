import { Theme } from '@mui/material';
import { Components } from '@mui/material/styles/components';

const Paper: Components<Omit<Theme, 'components'>>['MuiPaper'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      padding: theme.spacing(2.5),
      backgroundColor: theme.palette.background.paper,
      borderRadius: theme.shape.borderRadius * 3,
      overflow: 'hidden',
      boxShadow: 'none',
      // Add subtle border in dark mode for better definition
      ...(theme.palette.mode === 'dark' && {
        border: `1px solid ${theme.palette.divider}`,
      }),

      '&.MuiMenu-paper': {
        padding: 0,
        boxShadow: theme.customShadows[0],
      },

      // Remove padding from DataGrid parent containers
      '&:has(> .MuiDataGrid-root)': {
        padding: 0,
      },
    }),
  },
};

export default Paper;
