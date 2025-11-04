import { useEffect, useMemo, useState } from 'react';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { DataGrid, GridColDef, useGridApiRef, GridApi, GridToolbar, GridFilterModel, GridRowId, GridRowClassNameParams } from '@mui/x-data-grid';
import { Box, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DataGridFooter from 'components/common/DataGridFooter';
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
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import IconifyIcon from 'components/base/IconifyIcon';
import EditIcon from 'assets/icons/hugeicons--pencil-edit-02.svg?react';
import DeleteIcon from 'assets/icons/hugeicons--delete-02.svg?react';

const localizedTextsMap = {
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
  booleanCellTrueLabel: 'oui',
  booleanCellFalseLabel: 'non',
  toolbarFilters: 'Filtres',
  toolbarFiltersLabel: 'Afficher les filtres',
  toolbarFiltersTooltipHide: 'Masquer les filtres',
  toolbarFiltersTooltipShow: 'Afficher les filtres',
  toolbarFiltersTooltipActive: (count: any) =>
    count !== 1 ? `${count} filtres actifs` : `${count} filtre actif`,
  toolbarColumns: 'Colonnes',
  toolbarColumnsLabel: 'colonnes selectionne',
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
    filterable: true,
    valueGetter: (params: any) => {
      const v = params?.value;
      return v ? moment(v).format('YYYY-MM-DD') : '';
    },
    renderCell: (params: any) => {
      const value = (params?.row as any)?.date_sortie;
      return value ? (
        moment(value).format('YYYY/MM/DD')
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
      const row: any = params?.row || {};
      const ds = row.date_sortie;
      const label = ds ? moment(ds).format('HH:mm') : '';
      return label ? (
        label
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
    filterable: true,
    valueGetter: (params: any) => {
      const v = params?.value;
      return v ? moment(v).format('YYYY-MM-DD') : '';
    },
    renderCell: (params: any) => {
      const value = (params?.row as any)?.date_retour;
      return value ? (
        moment(value).format('YYYY/MM/DD')
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
      const row: any = params?.row || {};
      const dr = row.date_retour;
      const label = dr ? moment(dr).format('HH:mm') : '';
      return label ? (
        label
      ) : (
        <Stack direction="column" alignItems="center" justifyContent="center" height={1}>
          <Chip label={null} size="small" color="default" />
        </Stack>
      );
    },
  },
  {
    field: 'status',
    headerName: 'Statut',
    headerAlign: 'center',
    editable: false,
    flex: 1,
    minWidth: 140,
    renderCell: (params) => {
      const statusTranslations: { [key: string]: string } = {
        PENDING: 'En attente',
        COMPLETED: 'Terminé',
        INPROGRESS: 'En cours',
      };
      const translatedLabel = statusTranslations[(params?.value as string) || ''] || 'Inconnu';
      const color =
        params?.value === 'PENDING'
          ? 'primary'
          : params?.value === 'COMPLETED'
            ? 'success'
            : params?.value === 'INPROGRESS'
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
      const transportMapping: { [key: string]: string } = {
        SERVICE_CAR: 'Véhicule de service',
        TRANSPORT_ENTREPRISE:
          'Autre moyens de transport dont les dépenses sont prises en charge par l’entreprise',
        TRANSPORT_EMPLOYEE:
          'Moyens de transport dont les dépenses sont prises en charge par le travailleur',
        PERSONAL_CAR:
          'Utilisation exceptionnelle du véhicule personnel, à la demande de la hiérarchie',
      };

      const raw = (params?.value as string) ?? '';
      const translatedLabel = transportMapping[raw] || raw;

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
      const row: any = (params?.row as any) || {};
      const { date_sortie, date_retour } = row;
      if (!date_sortie || !date_retour) {
        return (
          <Stack direction="column" alignItems="center" justifyContent="center" height={1}>
            <Chip label={null} size="small" color="default" />
          </Stack>
        );
      }
      const startDate = moment(date_sortie);
      const endDate = moment(date_retour);
      const duration = moment.duration(endDate.diff(startDate));
      const hoursLeft = Math.floor(duration.asHours());
      const daysLeft = Math.floor(duration.asDays());
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
    renderCell: (params) => (params ? <RenderCellDownload params={params} /> : (
      <Stack direction="column" alignItems="center" justifyContent="center" height={1}>
        <Chip label={null} size="small" color="default" />
      </Stack>
    )),
  },
];

interface TaskOverviewTableProps {
  searchText: string;
}

const OrderView = ({ searchText }: TaskOverviewTableProps) => {
  const { orders, loading } = useSelector((state: RootState) => state.orders);
  const { token } = useSelector((state: RootState) => state.auth);
  const selectedYear = useSelector((s: RootState) => (s as any).exercice?.selectedYear ?? null);
  const dispatch = useDispatch<AppDispatch>();

  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedOrder, setselectedOrder] = useState<IMission | null>(null);
  const [viewOnly, setViewOnly] = useState(false);
  const [ctx, setCtx] = useState<{ mouseX: number; mouseY: number } | null>(null);
  const [ctxRow, setCtxRow] = useState<IMission | null>(null);
  const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [] });
  const [headerSearchField, setHeaderSearchField] = useState<string | null>(null);
  const [headerSearchValue, setHeaderSearchValue] = useState<string>('');
  const [highlightRowId, setHighlightRowId] = useState<GridRowId | null>(null);

  const apiRef = useGridApiRef<GridApi>();

  const handleDelete = (order: IMission) => {
    setselectedOrder(order);
    setDeleteModalOpen(true);
  };
  const handleEdit = (order: IMission) => {
    setselectedOrder(order);
    setViewOnly(false);
    setEditModalOpen(true);
  };
  // Removed view-only open on double click; users can still toggle read-only later if needed
  const ConfirmationDelete = async () => {
    if (!selectedOrder) return;
    const success = await dispatch(deleteOrder(selectedOrder.n_mission ?? null));
    if (success) {
      await dispatch(fetchUserOrders(token));
      setDeleteModalOpen(false);
    }
  };
  const EditSumbission = async (data: IMission) => {
    await dispatch(updateMission(data));
    await dispatch(fetchUserOrders(token));
    setEditModalOpen(false);
  };

  useEffect(() => {
    if (token) dispatch(fetchUserOrders(token));
  }, [dispatch, token, selectedYear]);

  const filteredRows = useMemo(() => {
    if (!searchText) return orders;
    return orders.filter((row) => {
      const motifMatches = row.motif?.toLowerCase().includes(searchText.toLowerCase());
      const destinationMatches = row.destination?.toLowerCase().includes(searchText.toLowerCase());
      return motifMatches || destinationMatches;
    });
  }, [orders, searchText]);

  const columns: GridColDef[] = [
    ...initialColumns.map((col) => ({
      ...col,
      renderHeader:
        col.field && col.headerName
          ? () =>
              headerSearchField === col.field ? (
                <TextField
                  autoFocus
                  size="small"
                  type={col.field === 'date_sortie' || col.field === 'date_retour' ? 'date' : 'text'}
                  placeholder={col.headerName ? `Rechercher ${col.headerName}` : 'Recherche'}
                  value={headerSearchValue}
                  onChange={(e) => {
                    const val = e.target.value;
                    setHeaderSearchValue(val);
                    const field = col.field as string;
                    const operator = field === 'date_sortie' || field === 'date_retour' ? 'equals' : 'contains';
                    setFilterModel((prev) => {
                      const others = prev.items.filter((it: any) => it.field !== field);
                      const nextItems = val ? [...others, { field, operator, value: val } as any] : others;
                      return { items: nextItems } as GridFilterModel;
                    });
                  }}
                  onBlur={() => {
                    if (!headerSearchValue) setHeaderSearchField(null);
                  }}
                  sx={{ '& .MuiInputBase-input': { py: 0.2 } }}
                />
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <SearchIcon
                    sx={{ fontSize: '1rem', color: 'text.secondary', cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                    onClick={(e) => {
                      e.stopPropagation();
                      const field = col.field as string;
                      if (!field) return;
                      setHeaderSearchField(field);
                      const existing = (filterModel.items as any[]).find((it: any) => it.field === field);
                      setHeaderSearchValue((existing?.value as string) || '');
                    }}
                  />
                  <span>{col.headerName}</span>
                </Box>
              )
          : col.renderHeader,
    })),
    {
      field: 'actions',
      headerName: '',
      headerAlign: 'right',
      align: 'right',
      sortable: false,
      flex: 1,
      minWidth: 100,
      renderCell: (params) => (
        <ActionMenu
          order={params.row}
          onEdit={() => handleEdit(params.row)}
          onDelete={() => handleDelete(params.row)}
          showValidate={false}
        />
      ),
    },
  ];

  if (loading) return <Splash />;

  const handleContextMenu: React.MouseEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    const target = event.target as HTMLElement;
    const rowEl = target.closest('[data-id]') as HTMLElement | null;
    const id = rowEl?.getAttribute('data-id');
    if (!id) return;
    const row = filteredRows.find((r) => String(r.n_mission) === id);
    if (!row) return;
    setCtxRow(row);
    setselectedOrder(row);
    setHighlightRowId(row.n_mission as GridRowId);
    setCtx({ mouseX: event.clientX + 2, mouseY: event.clientY - 6 });
  };

  return (
    <>
      {selectedOrder && (
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
            itemName={selectedOrder as any}
            onConfirm={ConfirmationDelete}
          />
        </>
      )}
      <div onContextMenu={handleContextMenu}>
        <DataGrid
          getRowId={(row) => row.n_mission}
          apiRef={apiRef}
          density="standard"
          columns={columns}
          rows={filteredRows}
          rowHeight={60}
          disableColumnResize
          disableColumnMenu
          disableColumnSelector
          disableDensitySelector
          disableColumnFilter
          filterModel={filterModel}
          onFilterModelChange={setFilterModel}
          onColumnHeaderDoubleClick={(params: any) => {
            const field = params?.field as string;
            if (!field) return;
            setHeaderSearchField(field);
            const existing = (filterModel.items as any[]).find((it: any) => it.field === field);
            setHeaderSearchValue((existing?.value as string) || '');
          }}
          localeText={localizedTextsMap}
          onRowDoubleClick={(params) => {
            if (!params) return;
            // Don't allow editing if status is COMPLETED
            if (params.row.status === 'COMPLETED') return;
            setHighlightRowId(params.id as GridRowId);
            handleEdit(params.row as IMission);
          }}
          onRowSelectionModelChange={(ids) => {
            const selectedRows = orders.filter(
              (row) => row.n_mission != null && (ids as any[]).includes(row.n_mission as any),
            );
            setselectedOrder(selectedRows[0] ?? null);
          }}
          getRowClassName={(params: GridRowClassNameParams) =>
            highlightRowId != null && String(params.id) === String(highlightRowId)
              ? 'action-highlight'
              : ''
          }
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
            border: 'none',
            '& .MuiDataGrid-root': {
              border: 'none',
            },
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: (theme) => theme.palette.mode === 'dark'
                ? '#3a3a52'
                : theme.palette.neutral.lighter,
              color: (theme) => theme.palette.mode === 'dark'
                ? '#FFFFFF'
                : theme.palette.text.primary,
              borderBottom: '2px solid',
              borderColor: 'divider',
              minHeight: '56px !important',
              maxHeight: '56px !important',
            },
            '& .MuiDataGrid-columnHeader': {
              fontSize: { xs: 13, lg: 16 },
              userSelect: 'none',
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              color: (theme) => theme.palette.mode === 'dark'
                ? '#FFFFFF'
                : theme.palette.text.primary,
              fontWeight: 600,
            },
            '& .MuiDataGrid-iconButtonContainer': {
              '& .MuiIconButton-root': {
                color: (theme) => theme.palette.mode === 'dark'
                  ? '#FFFFFF'
                  : theme.palette.text.primary,
              },
            },
            '& .MuiDataGrid-menuIcon': {
              '& .MuiSvgIcon-root': {
                color: (theme) => theme.palette.mode === 'dark'
                  ? '#FFFFFF'
                  : theme.palette.text.primary,
              },
            },
            '& .MuiDataGrid-sortIcon': {
              color: (theme) => theme.palette.mode === 'dark'
                ? '#FFFFFF'
                : theme.palette.text.primary,
            },
            '& .MuiDataGrid-main': { minHeight: 300 },
            '& .MuiDataGrid-virtualScroller': {
              minHeight: 300,
              p: 0,
              bgcolor: 'background.paper',
            },
            '& .MuiDataGrid-columnHeader .MuiInputBase-input': { userSelect: 'text' },
            '& .MuiDataGrid-cell': {
              fontSize: { xs: 13, lg: 16 },
              userSelect: 'none',
              color: 'text.primary',
              borderColor: 'divider',
            },
            '& .MuiTypography-root': {
              fontSize: { xs: 13, lg: 16 },
              color: 'text.primary',
            },
            '& .MuiDataGrid-row': {
              userSelect: 'none',
              '&:hover': {
                bgcolor: (theme) => theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(0, 0, 0, 0.04)',
              },
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            },
            // Action-based highlight
            '& .action-highlight': { backgroundColor: 'primary.light !important' },
          }}
        />
      </div>
      <Menu
        open={ctx !== null}
        onClose={() => setCtx(null)}
        anchorReference="anchorPosition"
        anchorPosition={ctx ? { top: ctx.mouseY, left: ctx.mouseX } : undefined}
        sx={{ mt: 0.5, '& .MuiList-root': { width: 140 } }}
      >
        {ctxRow && ctxRow.status !== 'COMPLETED' && (
          <MenuItem
            onClick={() => {
              if (ctxRow) handleEdit(ctxRow);
              setCtx(null);
            }}
          >
            <ListItemIcon sx={{ mr: 1 }}>
              <IconifyIcon icon={EditIcon} color="action" />
            </ListItemIcon>
            <ListItemText>
              <Typography>Editer</Typography>
            </ListItemText>
          </MenuItem>
        )}
        {ctxRow && ctxRow.status !== 'COMPLETED' && (
          <MenuItem
            onClick={() => {
              if (ctxRow) handleDelete(ctxRow);
              setCtx(null);
            }}
          >
            <ListItemIcon sx={{ mr: 1 }}>
              <IconifyIcon icon={DeleteIcon} color="error" />
            </ListItemIcon>
            <ListItemText>
              <Typography color="error.main">Annuler</Typography>
            </ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export default OrderView;
