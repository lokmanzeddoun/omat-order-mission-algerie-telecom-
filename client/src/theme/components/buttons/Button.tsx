import { Theme } from '@mui/material';
import { Components } from '@mui/material/styles/components';

const Button: Components<Omit<Theme, 'components'>>['MuiButton'] = {
  defaultProps: {
    disableElevation: true,
  },
  styleOverrides: {
    root: ({ theme }) => ({
      color: theme.palette.text.primary,
      borderRadius: theme.shape.borderRadius * 2.5,
      textTransform: 'initial',
    }),
    text: ({ theme }) => ({
      color: theme.palette.primary.main,
      backgroundColor: 'transparent !important',
    }),
    outlined: ({ theme }) => ({
      color: theme.palette.primary.main,
      borderColor: theme.palette.primary.main,
      backgroundColor: 'transparent',
      '&:hover': {
        backgroundColor: theme.palette.mode === 'dark'
          ? 'rgba(84, 111, 255, 0.08)'
          : 'rgba(84, 111, 255, 0.04)',
        borderColor: theme.palette.primary.main,
      },
    }),
    containedPrimary: ({ theme }) => ({
      color: '#FFFFFF',
      backgroundColor: theme.palette.primary.main,
      '&:hover': { backgroundColor: theme.palette.primary.dark },
    }),
    containedSecondary: ({ theme }) => ({
      color: theme.palette.text.primary,
      backgroundColor: theme.palette.background.paper,
      border: '1px solid',
      borderColor: theme.palette.divider,
      '&:hover': {
        backgroundColor: theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.08)'
          : 'rgba(0, 0, 0, 0.04)',
      },
    }),
    sizeLarge: ({ theme }) => ({
      padding: theme.spacing(1.25, 2.25),
      fontSize: theme.typography.button.fontSize,
      fontWeight: 600,
    }),
    sizeMedium: ({ theme }) => ({
      padding: theme.spacing(1.125, 1.5),
      fontSize: theme.typography.body2.fontSize,
      fontWeight: 600,
    }),
    sizeSmall: ({ theme }) => ({
      padding: theme.spacing(1, 1.15),
      fontSize: theme.typography.caption.fontSize,
      fontWeight: 700,
    }),
    startIcon: {
      marginRight: 6,
    },
    endIcon: {
      marginLeft: 6,
    },
  },
};

export default Button;
