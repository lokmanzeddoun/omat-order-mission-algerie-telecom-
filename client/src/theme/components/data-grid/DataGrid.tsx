import { Theme } from '@mui/material';
import { Components } from '@mui/material/styles/components';

const DataGrid: Components<Omit<Theme, 'components'>>['MuiDataGrid'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      border: 'none',
      borderRadius: '0 !important',
      overflow: 'hidden',
      '--DataGrid-rowBorderColor': theme.palette.divider,
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.text.primary,
      '&:hover, &:focus': {
        '*::-webkit-scrollbar, *::-webkit-scrollbar-thumb': {
          visibility: 'visible',
        },
      },
      '& .MuiDataGrid-scrollbar--vertical': {
        visibility: 'hidden',
      },
      '& .MuiDataGrid-scrollbarFiller': {
        minWidth: 0,
        backgroundColor: 'transparent',
      },
      // Enhanced toolbar styling for dark mode
      '& .MuiDataGrid-toolbarContainer': {
        padding: theme.spacing(2),
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.02)'
          : 'transparent',
        '& .MuiButton-root': {
          color: theme.palette.text.primary,
        },
      },
      // Row hover effect
      '& .MuiDataGrid-row:hover': {
        backgroundColor: theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.03)'
          : 'rgba(0, 0, 0, 0.04)',
      },
      // Column header background
      '& .MuiDataGrid-columnHeaders': {
        backgroundColor: theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.02)'
          : 'rgba(0, 0, 0, 0.02)',
        borderBottom: `1px solid ${theme.palette.divider}`,
      },
      // Footer styling
      '& .MuiDataGrid-footerContainer': {
        borderTop: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.02)'
          : 'transparent',
      },
    }),
    row: {
      '&:hover': { backgroundColor: 'transparent' },
    },
    cell: ({ theme }) => ({
      padding: 0,
      color: theme.palette.text.primary,
      fontSize: theme.typography.body2.fontSize,
      fontWeight: 500,
      '&:focus-within': {
        outline: 'none !important',
      },
    }),
    cellCheckbox: ({ theme }) => ({
      paddingLeft: theme.spacing(1),
    }),
    columnHeaderCheckbox: ({ theme }) => ({
      '& .MuiDataGrid-columnHeaderTitleContainer': {
        paddingLeft: theme.spacing(1),
      },
    }),
    columnHeader: {
      border: 0,
      padding: 0,
      height: '3rem !important',
      '&:focus-within': {
        outline: 'none !important',
      },
    },
    columnHeaderTitle: ({ theme }) => ({
      color: theme.palette.text.primary,
      fontSize: theme.typography.body2.fontSize,
      fontWeight: `${theme.typography.caption.fontWeight} !important`,
    }),
    iconButtonContainer: () => ({
      '& .MuiIconButton-root': {
        backgroundColor: 'transparent !important',
        border: 'none',
      },
    }),
    columnSeparator: {
      display: 'none',
    },
    selectedRowCount: {
      display: 'none',
    },
    footerContainer: () => ({
      border: 'none',
    }),
  },
};

export default DataGrid;
