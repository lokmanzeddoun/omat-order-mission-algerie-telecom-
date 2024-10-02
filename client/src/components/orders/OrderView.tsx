import { useEffect, useMemo, useState } from 'react';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { DataGrid, GridColDef, useGridApiRef, GridApi, GridToolbar } from '@mui/x-data-grid';
import DataGridFooter from 'components/common/DataGridFooter';
// import { rows } from 'data/taskOverview';
import ActionMenu from './ActionMenu';
import moment from 'moment';
import RenderCellDownload from './RenderCellDownload';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from 'store';
import { RootState } from 'store/rootReducer';
import { deleteOrder, fetchUserOrders, updateMission } from './orderthunk';
import NoData from 'components/users/NoData';
import { IMission } from './orderReducer';
import Splash from 'components/loader/Splash';
import ConfirmDeletionModal from './DeleteMissionModal';
import EditMissionModal from './EditMissionModal';

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

  {
    field: 'heure_sortie',
    headerName: 'Heure De Sortie',
    headerAlign: 'center',
    align: 'center',
    editable: false,
    flex: 2,
    filterable: false,
    minWidth: 150,
    renderCell: (params: any) => {
      return params?.value ? (
        params?.value
      ) : (
        <Stack direction="column" alignItems="center" justifyContent="center" height={1}>
          <Chip label={null} size="small" color="default" />
        </Stack>
      );
    },
  },
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
    field: 'heure_retour',
    headerName: 'Heure De Retour',
    editable: false,
    headerAlign: 'center',
    align: 'center',
    flex: 2,
    filterable: false,
    minWidth: 150,
    renderCell: (params: any) => {
      return params?.value ? (
        params?.value
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
    field: 'timeLeft',
    headerName: 'Temp de Mission',
    headerAlign: 'center',
    align: 'center',
    editable: false,
    filterable: false,
    flex: 1,
    minWidth: 150,
    renderCell: (params) => {
      const { date_sortie, heure_sortie, date_retour, heure_retour } = params.row; // Assuming these values are part of the same row

      // Check if all necessary fields are present
      if (!date_sortie || !heure_sortie || !date_retour || !heure_retour) {
        return (
          <Stack direction="column" alignItems="center" justifyContent="center" height={1}>
            <Chip label={null} size="small" color="default" />
          </Stack>
        ); // Display message if any data is missing
      }

      // Create Moment.js objects for date and time separately
      const startDate = moment(date_sortie).set({
        hour: parseInt(heure_sortie.split(':')[0]),
        minute: parseInt(heure_sortie.split(':')[1]),
      }); // e.g., Combine date_sortie and heure_sortie

      const endDate = moment(date_retour).set({
        hour: parseInt(heure_retour.split(':')[0]),
        minute: parseInt(heure_retour.split(':')[1]),
      }); // e.g., Combine date_retour and heure_retour

      // Calculate the time difference
      const duration = moment.duration(endDate.diff(startDate));

      // Get total hours and days left
      const hoursLeft = Math.floor(duration.asHours());
      const daysLeft = Math.floor(duration.asDays());

      // Format the output
      return <span>{daysLeft > 0 ? `${daysLeft} jour(s)` : `${hoursLeft} heure(s)`}</span>;
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

const OrderView = ({ searchText }: TaskOverviewTableProps) => {
  const { orders, loading } = useSelector((state: RootState) => state.orders);
  const { token } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  // const [open, setOpen] = useState(false);

  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedOrder, setselectedOrder] = useState(null);

  const apiRef = useGridApiRef<GridApi>();
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
    await dispatch(fetchUserOrders(token));
    setDeleteModalOpen(false);
  };
  const EditSumbission = async (data: IMission) => {
    await dispatch(updateMission(data));
    await dispatch(fetchUserOrders(token));
    setEditModalOpen(false);
  };
  useEffect(() => {
    if (token) {
      dispatch(fetchUserOrders(token)); // Dispatch the fetch action with token
    }
    // Filter logic specifically for "Destination" and "Motif"
  }, [dispatch, token]);

  const filteredRows = useMemo(() => {
    if (!searchText) return orders; // Return all rows if searchText is empty

    const filterWords = searchText.split(/\b\W+\b/).filter((word) => word !== '');
    return orders.filter((row) => {
      const motifMatches = row.motif?.toLowerCase().includes(searchText.toLowerCase());
      const destinationMatches = row.destination?.toLowerCase().includes(searchText.toLowerCase());
      return motifMatches || destinationMatches;
    });
  }, [orders, searchText]);

  const columns: GridColDef[] = [
    ...initialColumns, // Spread the static columns
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
          order={params.row} // Pass the row data (user) to the ActionMenu
          onEdit={() => handleEdit(params.row)} // Attach the edit handler
          onDelete={() => handleDelete(params.row)} // Attach the delete handler
        />
      ),
    },
  ];
  if (loading) {
    return <Splash />;
  }

  return (
    <>
      {selectedOrder ? (
        <>
          <EditMissionModal
            open={isEditModalOpen}
            onClose={() => setEditModalOpen(false)}
            missionData={selectedOrder}
            onSubmit={EditSumbission}
          />
          <ConfirmDeletionModal
            open={isDeleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            itemName={selectedOrder}
            onConfirm={ConfirmationDelete}
          />
        </>
      ) : null}
      <DataGrid
        getRowId={(row) => row.n_mission}
        apiRef={apiRef}
        density="standard"
        columns={columns}
        rows={filteredRows} // Use filteredRows instead of orders
        rowHeight={60}
        disableColumnResize
        disableColumnMenu
        disableColumnSelector
        disableDensitySelector
        disableRowSelectionOnClick
        disableColumnFilter
        localeText={localizedTextsMap}
        onRowSelectionModelChange={(ids) => {
          const selectedRows = orders.filter((row) => ids.includes(row.n_mission));
          setselectedOrder(selectedRows[0]);
        }}
        slots={{
          noRowsOverlay: () => <NoData />,
          pagination: DataGridFooter,
          toolbar: GridToolbar,
        }}
        slotProps={{ toolbar: { printOptions: { disableToolbarButton: true } } }}
        initialState={{
          pagination: { paginationModel: { pageSize: 5 } },
        }}
        autosizeOptions={{
          includeOutliers: true,
          includeHeaders: false,
          outliersFactor: 1,
          expand: true,
        }}
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
    </>
  );
};

export default OrderView;
