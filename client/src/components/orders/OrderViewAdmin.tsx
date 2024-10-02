import { SyntheticEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import {
  DataGrid,
  GridColDef,
  useGridApiRef,
  GridApi,
  GridToolbar,
  GridRowsProp,
  GridPaginationModel,
} from '@mui/x-data-grid';
import DataGridFooter from 'components/common/DataGridFooter';
// import { rows } from 'data/taskOverview';
import ActionMenu from './ActionMenu';
import moment from 'moment';
import RenderCellDownload from './RenderCellDownload';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from 'store';
import { RootState } from 'store/rootReducer';
import { deleteOrder, fetchAllOrders, updateMission } from './orderthunk';
import NoData from 'components/users/NoData';
import { IMission } from './orderReducer';
import Splash from 'components/loader/Splash';
import ConfirmDeletionModal from './DeleteMissionModal';
import EditMissionModal from './EditMissionModal';
import { Box, Card, Tab, Tabs } from '@mui/material';
import CustomPagination from 'components/users/customPagination';

const localizedTextsMap = {
  // Filter operators text
  filterOperatorContains: 'contient',
  filterOperatorEquals: 'égale',
  filterOperatorStartsWith: 'commence par',
  filterOperatorEndsWith: 'se termine par',
  filterOperatorIs: 'est',
  filterOperatorNot: "n'est pas",
  filterOperatorAfter: 'est après',
  filterOperatorOnOrAfter: 'est le ou après',
  filterOperatorBefore: 'est avant',
  filterOperatorOnOrBefore: 'est le ou avant',
  filterOperatorIsEmpty: 'est vide',
  filterOperatorIsNotEmpty: "n'est pas vide",
  filterOperatorIsAnyOf: "est l'un de",

  // Boolean cell text
  booleanCellTrueLabel: 'oui',
  booleanCellFalseLabel: 'non',

  // Filters toolbar button text in French
  toolbarFilters: 'Filtres',
  toolbarFiltersLabel: 'Afficher les filtres',
  toolbarFiltersTooltipHide: 'Masquer les filtres',
  toolbarFiltersTooltipShow: 'Afficher les filtres',
  toolbarFiltersTooltipActive: (count: any) =>
    count !== 1 ? `${count} filtres actifs` : `${count} filtre actif`,
  toolbarColumns: 'Colonnes',
  toolbarColumnsLabel: 'colonnes selectionne',
  // Filter panel text in French
  filterPanelAddFilter: 'Ajouter un filtre',
  filterPanelDeleteIconLabel: 'Supprimer',
  filterPanelLinkOperator: 'Opérateur logique',
  filterPanelOperator: 'Opérateur',
  filterPanelOperatorAnd: 'Et',
  filterPanelOperatorOr: 'Ou',
  filterPanelColumns: 'Colonnes',
  filterPanelInputLabel: 'Valeur',
  filterPanelInputPlaceholder: 'Valeur du filtre',

  toolbarExportCSV: 'Telecharger comme CSV',
};

const initialColumns: GridColDef<IMission>[] = [
  {
    field: 'motif',
    headerName: 'Motif',
    editable: false,
    headerAlign: 'center',
    align: 'center',
    filterable: false,
    flex: 2,
    minWidth: 220,
    renderCell: (params: any) => {
      return params?.value ? (
        params.value
      ) : (
        <Stack direction="column" alignItems="center" justifyContent="center" height={1}>
          <Chip label={null} size="small" color="default" />
        </Stack>
      );
    },
  },
  {
    field: 'date_sortie',
    headerName: 'Date De Sortie',
    editable: false,
    headerAlign: 'center',
    align: 'center',
    flex: 2,
    minWidth: 150,
    renderCell: (params: any) => {
      // Check if the date value exists and is valid
      const dateRetourValue = params.value; // Extract the value
      return dateRetourValue ? (
        moment(dateRetourValue).format('YYYY/MM/DD') // Correctly format the date
      ) : (
        <Stack direction="column" alignItems="center" justifyContent="center" height={1}>
          <Chip label={null} size="small" color="default" />
        </Stack>
      );
    },
  },

  // {
  //   field: 'heure_sortie',
  //   headerName: 'Heure De Sortie',
  //   headerAlign: 'center',
  //   align: 'center',
  //   editable: false,
  //   flex: 2,
  //   filterable: false,
  //   minWidth: 150,
  //   renderCell: (params: any) => {
  //     return params?.value ? (
  //       params?.value
  //     ) : (
  //       <Stack direction="column" alignItems="center" justifyContent="center" height={1}>
  //         <Chip label={null} size="small" color="default" />
  //       </Stack>
  //     );
  //   },
  // },
  {
    field: 'date_retour',
    headerName: 'Date De Retour',
    editable: false,
    headerAlign: 'center',
    align: 'center',
    flex: 2,
    minWidth: 150,
    renderCell: (params: any) => {
      // Check if the date value exists and is valid
      const dateRetourValue = params.value; // Extract the value
      return dateRetourValue ? (
        moment(dateRetourValue).format('YYYY/MM/DD') // Correctly format the date
      ) : (
        <Stack direction="column" alignItems="center" justifyContent="center" height={1}>
          <Chip label={null} size="small" color="default" />
        </Stack>
      );
    },
  },
  {
    field: 'status',
    headerName: 'Statut', // Translated header to French
    headerAlign: 'center',
    editable: false,
    flex: 1,
    minWidth: 140,
    renderCell: (params) => {
      // Define the status translations
      const statusTranslations: { [key: string]: string } = {
        PENDING: 'En attente',
        COMPLETED: 'Terminé',
        INPROGRESS: 'En cours',
      };

      // Get the translated label based on the value
      const translatedLabel = statusTranslations[params.value] || 'Inconnu';

      // Determine color based on status value
      const color =
        params.value === 'PENDING'
          ? 'primary'
          : params.value === 'COMPLETED'
          ? 'success'
          : params.value === 'INPROGRESS'
          ? 'warning'
          : 'info';

      return (
        <Stack direction="column" alignItems="center" justifyContent="center" height={1}>
          <Chip label={translatedLabel} size="small" color={color} />
        </Stack>
      );
    },
  },

  {
    field: 'destination',
    headerName: 'Destination',
    headerAlign: 'center',
    align: 'center',
    filterable: false,
    editable: false,
    flex: 2,
    minWidth: 100,
    renderCell: (params: any) => {
      return params?.value ? (
        params.value
      ) : (
        <Stack direction="column" alignItems="center" justifyContent="center" height={1}>
          <Chip label={null} size="small" color="default" />
        </Stack>
      );
    },
  },
  {
    field: 'transport',
    headerName: 'Transport',
    headerAlign: 'center',
    align: 'center',
    editable: false,
    flex: 2,
    minWidth: 320,
    renderCell: (params) => {
      // Transport type translations
      const transportMapping: { [key: string]: string } = {
        SERVICE_CAR: 'Véhicule de service',
        TRANSPORT_ENTREPRISE:
          'Autre moyens de transport dont les dépenses sont prises en charge par l’entreprise',
        TRANSPORT_EMPLOYEE:
          'Moyens de transport dont les dépenses sont prises en charge par le travailleur',
        PERSONAL_CAR:
          'Utilisation exceptionnelle du véhicule personnel, à la demande de la hiérarchie',
      };

      // Get the mapped transport type, or fallback to the original value if not found
      const translatedLabel = transportMapping[params.value] || params.value;

      return (
        <Stack direction="column" alignItems="center" justifyContent="center" height={1}>
          <Chip label={translatedLabel} size="small" color="default" />
        </Stack>
      );
    },
  },

  {
    field: 'download',
    headerName: '',
    headerAlign: 'center',
    align: 'right',
    sortable: false,
    flex: 1,
    minWidth: 150,
    filterable: false,
    renderCell: (params) => <RenderCellDownload params={params} />,
  },
];

interface TaskOverviewTableProps {
  searchText: string;
}
const a11yProps = (index: number) => ({
  id: `transaction-tab-${index}`,
  'aria-controls': `transaction-tabpanel-${index}`,
});

const OrderView = ({ searchText }: TaskOverviewTableProps) => {
  const { orders, loading } = useSelector((state: RootState) => state.orders);
  const { token, user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  // const [open, setOpen] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [viewOnly, setViewOnly] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedOrder, setselectedOrder] = useState(null);
  const [items, setItems] = useState<GridRowsProp<IMission>>([]);
  const [value, setValue] = useState(0);
  const handleChange = (event: SyntheticEvent, newValue: number) => {
    setValue(newValue);
    filterData(newValue);
  };
  const handleDelete = async (order: any) => {
    setselectedOrder(order);
    setDeleteModalOpen(true);
  };
  // const handleOpen = () => setOpen(true);
  // const handleClose = () => setOpen(false);
  const handleEdit = (order: any) => {
    setselectedOrder(order);
    setEditModalOpen(true);
  };
  const ConfirmationDelete = async () => {
    await dispatch(deleteOrder(selectedOrder.n_mission));
    await dispatch(fetchAllOrders(token));
    setDeleteModalOpen(false);
  };
  const EditSumbission = async (data: IMission) => {
    await dispatch(updateMission(data));
    await dispatch(fetchAllOrders(token));
    setEditModalOpen(false);
  };
  const filterData = useCallback(
    (tabIndex: number) => {
      switch (tabIndex) {
        case 1:
          setItems(orders.filter((row) => row.userId === user.matricule));
          break;
        default:
          setItems(orders);
          break;
      }
    },
    [orders],
  );

  const columns: GridColDef[] = useMemo(() => {
    if (value === 0) {
      // First Tab Columns (Tous Les Ordres)
      return [
        {
          field: 'user',
          headerName: 'Utilisateur',
          headerAlign: 'center',
          align: 'center',
          flex: 2,
          minWidth: 150,
          renderCell: (params: any) => {
            return params?.value ? (
              params.value.nom + ' ' + params.value.prenom // Render the user who made the order
            ) : (
              <Stack direction="column" alignItems="center" justifyContent="center" height={1}>
                <Chip label={null} size="small" color="default" />
              </Stack>
            );
          },
        },
        ...initialColumns,
        {
          field: '',
          headerAlign: 'right',
          align: 'right',
          editable: false,
          sortable: false,
          flex: 1,
          minWidth: 100,
          renderCell: (params) => (
            <ActionMenu
              order={params.row}
              onEdit={() => handleEdit(params.row)}
              onDelete={() => handleDelete(params.row)}
            />
          ),
        },
      ];
    }

    // Second Tab Columns (Mes Ordres)
    return [
      ...initialColumns,
      {
        field: '',
        headerAlign: 'right',
        align: 'right',
        editable: false,
        sortable: false,
        flex: 1,
        minWidth: 100,
        renderCell: (params) => (
          <ActionMenu
            order={params.row}
            onEdit={() => handleEdit(params.row)}
            onDelete={() => handleDelete(params.row)}
          />
        ),
      },
    ];
  }, [value, initialColumns]);
  const filteredRows = useMemo(() => {
    if (!searchText) return items; // Use filtered `items` instead of `orders`

    const filterWords = searchText.split(/\b\W+\b/).filter((word) => word !== '');
    return items.filter((row) => {
      const motifMatches = row.motif?.toLowerCase().includes(searchText.toLowerCase());
      const destinationMatches = row.destination?.toLowerCase().includes(searchText.toLowerCase());
      const userMatches =
        row.user &&
        (row.user.nom.toLowerCase().includes(searchText.toLowerCase()) ||
          row.user.prenom.toLowerCase().includes(searchText.toLowerCase()));
      return motifMatches || destinationMatches || userMatches;
    });
  }, [items, searchText]);
  useEffect(() => {
    if (token) {
      // Fetch the data only when the token changes
      dispatch(fetchAllOrders(token));
    }
  }, [dispatch, token]);

  useEffect(() => {
    // Apply filtering when orders or selected tab changes
    filterData(value);
  }, [orders, value, filterData]);
  if (loading) {
    return <Splash />;
  }

  return (
    <>
      <Box sx={{ borderBottom: 1, borderColor: 'secondary.lighter', mb: 3.5, mr: 2 }}>
        <Tabs value={value} onChange={handleChange} aria-label="transaction tabs">
          <Tab label="Tous Les Ordres" {...a11yProps(0)} />
          <Tab label="Mes Ordres" {...a11yProps(1)} />
        </Tabs>
      </Box>
      {selectedOrder ? (
        <>
          <EditMissionModal
            open={isEditModalOpen}
            onClose={() => setEditModalOpen(false)}
            missionData={selectedOrder}
            onSubmit={EditSumbission}
            viewOnly={viewOnly}
          />
          <ConfirmDeletionModal
            open={isDeleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            itemName={selectedOrder}
            onConfirm={ConfirmationDelete}
          />
        </>
      ) : null}
      <Card
        sx={{
          flexGrow: { md: 1 },
          display: { md: 'flex' },
          flexDirection: { md: 'column' },
          overflow: 'hidden',
          m: 1,
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
          getRowId={(row) => row.n_mission}
          density="standard"
          columns={columns.map((column) => ({
            ...column,
            width: column.width || 150, // Example: Set a default width
          }))}
          rows={filteredRows.slice(
            paginationModel.page * paginationModel.pageSize,
            (paginationModel.page + 1) * paginationModel.pageSize,
          )}
          rowCount={filteredRows.length}
          rowHeight={50}
          disableColumnResize
          disableColumnMenu
          disableColumnSelector
          disableDensitySelector
          disableColumnFilter
          paginationMode="server"
          paginationModel={paginationModel}
          onCellDoubleClick={(params, event) => {
            if (!event.ctrlKey) {
              event.defaultMuiPrevented = true;
            }
            setEditModalOpen(true);
            setViewOnly(true);
          }}
          localeText={localizedTextsMap}
          onRowSelectionModelChange={(ids) => {
            const selectedRows = orders.filter((row) => ids.includes(row.n_mission));
            setselectedOrder(selectedRows[0]);
          }}
          slots={{
            noRowsOverlay: () => <NoData />,
            pagination: () => null, // Hide the default pagination component
            toolbar: GridToolbar,
          }}
          slotProps={{ toolbar: { printOptions: { disableToolbarButton: true } } }}
          initialState={{
            pagination: { paginationModel: { pageSize: 5 } },
          }}
          // autosizeOptions={{
          //   includeOutliers: true,
          //   includeHeaders: false,
          //   outliersFactor: 1,
          //   expand: true,
          // }}
          pageSizeOptions={[10]}
          sx={{
            '.MuiDataGrid-cell:focus': {
              outline: 'none',
            },
            '& .MuiDataGrid-row:hover': {
              cursor: 'pointer',
            },
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
    </>
  );
};

export default OrderView;
