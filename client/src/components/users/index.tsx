import { Box, Button, Card, Chip, Stack, Tab, Tabs, Typography } from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridPaginationModel,
  GridRowsProp,
  GridToolbar,
} from '@mui/x-data-grid';
import CustomPagination from './customPagination';
import NoData from './NoData';
import { invoiceRowData, RowData } from 'data/invoice-data';
import { dateFormatFromUTC } from 'helpers/utils';
import { SyntheticEvent, useEffect, useState } from 'react';
import ActionMenu from 'components/admin/order-overview/ActionMenu';

const columns: GridColDef[] = [
  {
    field: 'matricule',
    headerName: 'Matricule',
    flex: 1,
    minWidth: 150,
    hideable: false,
    renderCell: (params) => <>#{params.value}</>,
  },
  {
    field: 'nom',
    headerName: 'Nom',
    flex: 1,
    minWidth: 100,
    hideable: false,
    renderCell: (params) => <>{params.value}</>,
  },
  {
    field: 'prenom',
    headerName: 'Prenom',
    minWidth: 100,
    flex: 1,
    hideable: false,
    renderCell: (params) => <>{params.value}</>,
  },
  {
    field: 'email',
    headerName: 'Email',
    flex: 1,
    minWidth: 250,
    hideable: false,
    renderCell: (params) => <>{params.value}</>,
  },
  {
    field: 'service',
    headerName: 'Service',
    flex: 1,
    minWidth: 200,
    hideable: false,
    renderCell: (params) => <>{params.value}</>,
  },
  {
    field: 'grade',
    headerName: 'Grade',
    width: 100,
    hideable: false,
    renderCell: (params) => <>{params.value}</>,
  },
  {
    field: 'category',
    headerName: 'Category',
    width: 100,
    hideable: false,
    renderCell: (params) => <>{params.value}</>,
  },
  {
    field: 'role',
    headerName: 'Role',
    width: 100,
    hideable: false,
    renderCell: (params) => <>{params.value}</>,
  },
  {
    field: 'utilisateurDepuis',
    headerName: 'utilisateurDepuis',
    minWidth: 130,
    flex: 1,
    hideable: false,
    renderCell: (params) => <>{dateFormatFromUTC(params.value)}</>,
  },
  {
    field: 'status',
    headerName: 'Status',
    headerAlign: 'center',
    editable: false,
    flex: 1,
    minWidth: 140,
    renderCell: (params) => {
      const color =
        params.value === 'ACTIVE' ? 'success' : params.value === 'INACTIVE' ? 'error' : 'info';
      return (
        <Stack direction="column" alignItems="center" justifyContent="center" height={1}>
          <Chip label={params.value} size="small" color={color} />
        </Stack>
      );
    },
  },
  {
    field: 'action',
    headerAlign: 'right',
    align: 'right',
    editable: false,
    sortable: false,
    flex: 1,
    minWidth: 100,
    renderHeader: () => <ActionMenu />,
    renderCell: () => <ActionMenu />,
  },
];

const a11yProps = (index: number) => ({
  id: `transaction-tab-${index}`,
  'aria-controls': `transaction-tabpanel-${index}`,
});

const rowHeight = 60; // default row height

const InvoiceOverviewTable: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<GridRowsProp<RowData>>([]);
  const [value, setValue] = useState(0);

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 5,
  });

  const handleChange = (event: SyntheticEvent, newValue: number) => {
    setValue(newValue);
    filterData(newValue);
  };

  const handlePaginationModelChange = (model: GridPaginationModel) => {
    setPaginationModel(model);
  };

  const filterData = (tabIndex: number) => {
    switch (tabIndex) {
      case 1:
        setItems(invoiceRowData.filter((row) => row.status === 'ACTIVE'));
        break;
      case 2:
        setItems(invoiceRowData.filter((row) => row.role === 'Admin'));
        break;
      default:
        setItems(invoiceRowData);
        break;
    }
  };

  useEffect(() => {
    setLoading(true);
    filterData(value);
    setLoading(false);
  }, [value]);

  return (
    <Stack sx={{ overflow: 'auto', justifyContent: 'space-between', flexDirection: 'column' }}>
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Typography
          sx={{
            fontSize: {
              xs: 'body2.fontSize',
              md: 'h6.fontSize',
              xl: 'h3.fontSize',
            },
            fontWeight: 600,
          }}
        >
          Les Utilisateur courant
        </Typography>
        <Box sx={{ mr: 3 }}>
          <Button
            variant="outlined"
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              color: 'primary.main',
              borderColor: 'primary.main',
              '&:hover': {
                borderColor: 'primary.dark',
                bgcolor: 'primary.light',
              },
              mr: 3,
            }}
          >
            Create User
          </Button>
          <Button
            variant="outlined"
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              color: 'primary.main',
              borderColor: 'primary.main',
              '&:hover': {
                borderColor: 'primary.dark',
                bgcolor: 'primary.light',
              },
            }}
          >
            Import
          </Button>
        </Box>
      </Box>
      <Box sx={{ borderBottom: 1, borderColor: 'secondary.lighter', mb: 3.5, mr: 2 }}>
        <Tabs value={value} onChange={handleChange} aria-label="transaction tabs">
          <Tab label="All Users" {...a11yProps(0)} />
          <Tab label="Active Users" {...a11yProps(1)} />
          <Tab label="Admins" {...a11yProps(2)} />
        </Tabs>
      </Box>
      <Card
        sx={{
          flexGrow: { md: 1 },
          display: { md: 'flex' },
          flexDirection: { md: 'column' },
          overflow: 'hidden',
          m: 2,
          borderRadius: 6.5,
          '&.MuiPaper-root': {
            p: 1,
            border: 1,
            borderColor: 'neutral.light',
            bgcolor: { xs: 'transparent', sm: 'white' },
            boxShadow: (theme) => `inset 0px -1px ${theme.palette.neutral.light}`, // color for row border
          },
        }}
      >
        <DataGrid
          rowHeight={rowHeight}
          rows={items.slice(
            paginationModel.page * paginationModel.pageSize,
            (paginationModel.page + 1) * paginationModel.pageSize,
          )}
          rowCount={items.length}
          columns={columns}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={handlePaginationModelChange}
          slots={{
            noRowsOverlay: () => <NoData />,
            pagination: () => null, // Hide the default pagination component
            toolbar: GridToolbar,
          }}
          disableColumnMenu
          loading={loading}
          checkboxSelection
          sx={{
            px: { xs: 0, md: 3 },
            '& .MuiDataGrid-main': {
              minHeight: 300,
            },
            '& .MuiDataGrid-virtualScroller': {
              minHeight: 300,
              p: 0,
            },
            '& .MuiDataGrid-columnHeader': {
              fontSize: { xs: 13, lg: 16 },
            },
            '& .MuiDataGrid-cell': {
              fontSize: { xs: 13, lg: 16 },
            },
            '& .MuiTypography-root': {
              fontSize: { xs: 13, lg: 16 },
            },
          }}
        />
      </Card>
      <Box sx={{ mt: 2, display: 'flex', justifyContent: { xs: 'center', md: 'flex-end' } }}>
        <CustomPagination
          page={paginationModel.page + 1}
          pageCount={Math.ceil(items.length / paginationModel.pageSize)}
          onPageChange={(event, value) =>
            setPaginationModel((prev) => ({ ...prev, page: value - 1 }))
          }
        />
      </Box>
    </Stack>
  );
};

export default InvoiceOverviewTable;
