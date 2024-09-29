import { useEffect } from 'react';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { DataGrid, GridColDef, useGridApiRef, GridApi } from '@mui/x-data-grid';
import DataGridFooter from 'components/common/DataGridFooter';
import { rows } from 'data/taskOverview';
import ActionMenu from 'components/admin/order-overview/ActionMenu';
import moment from 'moment';
import RenderCellDownload from './RenderCellDownload';
const columns: GridColDef<(typeof rows)[number]>[] = [
  {
    field: 'motif',
    headerName: 'Motif',
    editable: false,
    align: 'left',
    flex: 2,
    minWidth: 220,
  },
  {
    field: 'date_sortie',
    headerName: 'Date De Sortie',
    editable: false,
    flex: 2,
    minWidth: 150,
    valueFormatter: (params: { value: Date | string }) => {
      moment(params?.value).format('DD/MM/YYYY');
    },
  },
  {
    field: 'heure_sortie',
    headerName: 'Heure De Sortie',
    editable: false,
    flex: 2,
    minWidth: 150,
    valueFormatter: (params: { value: Date | string }) => {
      moment(params?.value).format('HH:MM');
    },
  },
  {
    field: 'date_retour',
    headerName: 'Date De Retour',
    editable: false,
    flex: 2,
    minWidth: 150,
    valueFormatter: (params: { value: Date | string }) => {
      moment(params?.value).format('DD/MM/YYYY');
    },
  },
  {
    field: 'heure_retour',
    headerName: 'Heure De Retour',
    editable: false,
    flex: 2,
    minWidth: 150,
    valueFormatter: (params: { value: Date | string }) => {
      moment(params?.value).format('HH:MM');
    },
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
        params.value === 'pending'
          ? 'primary'
          : params.value === 'completed'
          ? 'success'
          : params.value === 'in progress'
          ? 'warning'
          : 'info';
      return (
        <Stack direction="column" alignItems="center" justifyContent="center" height={1}>
          <Chip label={params.value} size="small" color={color} />
        </Stack>
      );
    },
  },
  {
    field: 'destination',
    headerName: 'Destination',
    headerAlign: 'center',
    align: 'center',
    editable: false,
    flex: 2,
    minWidth: 100,
  },
  {
    field: 'transport',
    headerName: 'Transport',
    headerAlign: 'center',
    align: 'center',
    editable: false,
    flex: 2,
    minWidth: 320,
  },
  {
    field: 'timeLeft',
    headerName: 'Temps restant',
    headerAlign: 'center',
    align: 'center',
    editable: false,
    flex: 1,
    minWidth: 100,
  },
  {
    field: 'download',
    headerName: '',
    headerAlign: 'center',
    align: 'right',
    sortable: false,
    flex: 1,
    minWidth: 150,
    renderCell: (params) => <RenderCellDownload params={params} />,
  },
  {
    field: '',
    headerAlign: 'right',
    align: 'right',
    editable: false,
    sortable: false,
    flex: 1,
    minWidth: 100,
    renderCell: () => <ActionMenu />,
  },
];

interface TaskOverviewTableProps {
  searchText: string;
}

const OrderView = ({ searchText }: TaskOverviewTableProps) => {
  const apiRef = useGridApiRef<GridApi>();

  useEffect(() => {
    apiRef.current.setQuickFilterValues(searchText.split(/\b\W+\b/).filter((word) => word !== ''));
  }, [searchText]);

  return (
    <DataGrid
      apiRef={apiRef}
      density="standard"
      columns={columns}
      rows={rows}
      rowHeight={60}
      disableColumnResize
      disableColumnMenu
      disableColumnSelector
      disableRowSelectionOnClick
      initialState={{
        pagination: { paginationModel: { pageSize: 5 } },
      }}
      autosizeOptions={{
        includeOutliers: true,
        includeHeaders: false,
        outliersFactor: 1,
        expand: true,
      }}
      slots={{
        pagination: DataGridFooter,
      }}
      checkboxSelection
      pageSizeOptions={[10]}
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
  );
};

export default OrderView;
