import { SyntheticEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { DataGrid, GridColDef, GridToolbar, GridRowsProp, GridPaginationModel, GridFilterModel, GridRowId, GridRowClassNameParams } from '@mui/x-data-grid';
import { TextField } from '@mui/material';
// import { rows } from 'data/taskOverview';
import ActionMenu from './ActionMenu';
import DecompteModal from './DecompteModal';
import { addDecompte } from './decompte.thunk';
import DecomptePdfPreview from './DecomptePdfPreview';
import { IDecompte } from './decompte.reducer';
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
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import IconifyIcon from 'components/base/IconifyIcon';
import EditIcon from 'assets/icons/hugeicons--pencil-edit-02.svg?react';
import DeleteIcon from 'assets/icons/hugeicons--delete-02.svg?react';
import ValidateIcon from 'assets/icons/hugeicons--document-validation.svg?react';
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
    filterable: true,
    valueGetter: (params: any) => {
      const v = params.value;
      return v ? moment(v).format('YYYY-MM-DD') : '';
    },
    renderCell: (params: any) => {
      const v = (params.row as any)?.date_sortie;
      return v ? (
        moment(v).format('YYYY/MM/DD')
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
    filterable: true,
    valueGetter: (params: any) => {
      const v = params.value;
      return v ? moment(v).format('YYYY-MM-DD') : '';
    },
    renderCell: (params: any) => {
      const v = (params.row as any)?.date_retour;
      return v ? (
        moment(v).format('YYYY/MM/DD')
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
  const selectedYear = useSelector((s: RootState) => (s as any).exercice?.selectedYear ?? null);
  const dispatch = useDispatch<AppDispatch>();
  // const [open, setOpen] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [viewOnly, setViewOnly] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDecompteOpen, setDecompteOpen] = useState(false);
  const [isPdfOpen, setPdfOpen] = useState(false);
  const [lastDecompte, setLastDecompte] = useState<IDecompte | null>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedOrder, setselectedOrder] = useState<IMission | null>(null);
  const [items, setItems] = useState<GridRowsProp<IMission>>([]);
  const [value, setValue] = useState(0);
  const [ctx, setCtx] = useState<{ mouseX: number; mouseY: number } | null>(null);
  const [ctxRow, setCtxRow] = useState<IMission | null>(null);
  const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [] });
  const [headerSearchField, setHeaderSearchField] = useState<string | null>(null);
  const [headerSearchValue, setHeaderSearchValue] = useState<string>('');
  const [highlightRowId, setHighlightRowId] = useState<GridRowId | null>(null);
  const handleChange = (_event: SyntheticEvent, newValue: number) => {
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
  const handleValidate = (order: any) => {
    setselectedOrder(order);
    setDecompteOpen(true);
  };
  const ConfirmationDelete = async () => {
    if (!selectedOrder) return;
    await dispatch(deleteOrder(selectedOrder.n_mission ?? null));
    await dispatch(fetchAllOrders(token));
    setDeleteModalOpen(false);
  };
  const EditSumbission = async (data: IMission) => {
    await dispatch(updateMission(data));
    await dispatch(fetchAllOrders(token));
    setEditModalOpen(false);
  };
  const DecompteSubmission = async (data: any) => {
    if (!selectedOrder) return;
    const payload = { ...data, missionId: selectedOrder.n_mission! } as IDecompte;
    await dispatch(addDecompte(payload, selectedOrder, token));
    setLastDecompte(payload);
    setDecompteOpen(false);
    setPdfOpen(true);
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
    [orders, user?.matricule],
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
          filterable: true,
          valueGetter: (params: any) => {
            const u = params.value;
            return u ? `${u.nom ?? ''} ${u.prenom ?? ''}`.trim() : '';
          },
          renderHeader: () =>
            headerSearchField === 'user' ? (
              <TextField
                autoFocus
                size="small"
                placeholder={`Rechercher Utilisateur`}
                value={headerSearchValue}
                onChange={(e) => {
                  const val = e.target.value;
                  setHeaderSearchValue(val);
                  const field = 'user';
                  const operator = 'contains';
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
              <>Utilisateur</>
            ),
          renderCell: (params: any) => {
            const u = (params.row && (params.row as any).user) || params.value;
            if (!u) {
              return (
                <Stack direction="column" alignItems="center" justifyContent="center" height={1}>
                  <Chip label={null} size="small" color="default" />
                </Stack>
              );
            }
            return typeof u === 'string' ? u : `${u.nom ?? ''} ${u.prenom ?? ''}`;
          },
        },
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
                    placeholder={
                      col.field === 'date_sortie' || col.field === 'date_retour'
                        ? undefined
                        : `Rechercher ${col.headerName}`
                    }
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
                  <>{col.headerName}</>
                )
              : col.renderHeader,
        })),
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
              onValidate={() => handleValidate(params.row)}
            />
          ),
        },
      ];
    }

    // Second Tab Columns (Mes Ordres)
    return [
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
                  placeholder={
                    col.field === 'date_sortie' || col.field === 'date_retour'
                      ? undefined
                      : `Rechercher ${col.headerName}`
                  }
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
                <>{col.headerName}</>
              )
            : col.renderHeader,
      })),
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
            onValidate={() => handleValidate(params.row)}
          />
        ),
      },
    ];
  }, [value, headerSearchField, headerSearchValue]);
  const filteredRows = useMemo(() => {
    if (!searchText) return items; // Use filtered `items` instead of `orders`

    return items.filter((row) => {
      const motifMatches = row.motif?.toLowerCase().includes(searchText.toLowerCase());
      const destinationMatches = row.destination?.toLowerCase().includes(searchText.toLowerCase());
      const anyRow: any = row as any;
      const userMatches =
        anyRow.user &&
        (anyRow.user.nom?.toLowerCase().includes(searchText.toLowerCase()) ||
          anyRow.user.prenom?.toLowerCase().includes(searchText.toLowerCase()));
      return motifMatches || destinationMatches || userMatches;
    });
  }, [items, searchText]);
  useEffect(() => {
    if (token) {
      // Refetch when token or selected exercice year changes
      dispatch(fetchAllOrders(token));
    }
  }, [dispatch, token, selectedYear]);

  useEffect(() => {
    // Apply filtering when orders or selected tab changes
    filterData(value);
  }, [orders, value, filterData]);
  if (loading) {
    return <Splash />;
  }

  const handleContextMenu: React.MouseEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    const target = event.target as HTMLElement;
    const rowEl = target.closest('[data-id]') as HTMLElement | null;
    const id = rowEl?.getAttribute('data-id');
    if (!id) return;
    const row = filteredRows.find((r) => String(r.n_mission) === id) || null;
    if (!row) return;
    setCtxRow(row);
    setselectedOrder(row);
    setHighlightRowId(row.n_mission as GridRowId);
    setCtx({ mouseX: event.clientX + 2, mouseY: event.clientY - 6 });
  };

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
        <div onContextMenu={handleContextMenu}>
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
            filterModel={filterModel}
            onFilterModelChange={setFilterModel}
            onColumnHeaderDoubleClick={(params: any) => {
              const field = params.field as string;
              if (!field) return;
              setHeaderSearchField(field);
              const existing = (filterModel.items as any[]).find((it: any) => it.field === field);
              setHeaderSearchValue((existing?.value as string) || '');
            }}
            paginationMode="server"
            paginationModel={paginationModel}
            onCellDoubleClick={() => {
              setEditModalOpen(true);
              setViewOnly(true);
            }}
            onRowDoubleClick={(params) => setHighlightRowId(params.id as GridRowId)}
            localeText={localizedTextsMap}
            onRowSelectionModelChange={(ids) => {
              const selectedRows = orders.filter(
                (row) => row.n_mission != null && ids.includes(row.n_mission as any),
              );
              setselectedOrder(selectedRows[0] || null);
            }}
            getRowClassName={(params: GridRowClassNameParams) =>
              highlightRowId != null && String(params.id) === String(highlightRowId)
                ? 'action-highlight'
                : ''
            }
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
              '& .MuiDataGrid-columnHeaders': {
                bgcolor: 'primary.main',
              },
              '& .MuiDataGrid-columnHeader': {
                fontSize: { xs: 13, lg: 16 },
                userSelect: 'none',
              },
              '& .MuiDataGrid-columnHeader .MuiInputBase-input': {
                userSelect: 'text',
              },
              '& .MuiDataGrid-main': {
                minHeight: 300,
              },
              '& .MuiDataGrid-virtualScroller': {
                minHeight: 300,
                p: 0,
              },
              '& .MuiDataGrid-cell': {
                fontSize: { xs: 13, lg: 16 },
                userSelect: 'none',
              },
              '& .MuiTypography-root': {
                fontSize: { xs: 13, lg: 16 },
              },
              '& .MuiDataGrid-row': {
                userSelect: 'none',
              },
              px: { xs: 0, md: 3 },
              // Keep selection logic but remove visual highlight
              '& .MuiDataGrid-row.Mui-selected': {
                backgroundColor: 'transparent !important',
              },
              '& .MuiDataGrid-row.Mui-selected:hover': {
                backgroundColor: 'transparent !important',
              },
              '& .MuiDataGrid-cell--selected': {
                backgroundColor: 'transparent !important',
              },
              '& .MuiDataGrid-cell--selected:hover': {
                backgroundColor: 'transparent !important',
              },
              // Action-based highlight
              '& .action-highlight': { backgroundColor: 'primary.light !important' },
            }}
          />
        </div>
      </Card>
      <Menu
        open={ctx !== null}
        onClose={() => setCtx(null)}
        anchorReference="anchorPosition"
        anchorPosition={ctx ? { top: ctx.mouseY, left: ctx.mouseX } : undefined}
        sx={{ mt: 0.5, '& .MuiList-root': { width: 140 } }}
      >
        <MenuItem
          onClick={() => {
            if (ctxRow) handleValidate(ctxRow);
            setCtx(null);
          }}
        >
          <ListItemIcon sx={{ mr: 1 }}>
            <IconifyIcon icon={ValidateIcon} color="success" />
          </ListItemIcon>
          <ListItemText>
            <Typography color="success.main">Valider</Typography>
          </ListItemText>
        </MenuItem>
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
      </Menu>
      <Box sx={{ mt: 2, display: 'flex', justifyContent: { xs: 'center', md: 'flex-end' } }}>
        <CustomPagination
          page={paginationModel.page + 1}
          pageCount={Math.ceil(items.length / paginationModel.pageSize)}
          onPageChange={(_event, value) =>
            setPaginationModel((prev) => ({ ...prev, page: value - 1 }))
          }
        />
      </Box>
      {/* Render modals after the main content to avoid any unintended layout shifts */}
      {selectedOrder ? (
        <>
          <DecompteModal
            open={isDecompteOpen}
            onClose={() => setDecompteOpen(false)}
            onSubmit={DecompteSubmission}
            order={selectedOrder as any}
          />
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
      {selectedOrder && lastDecompte ? (
        <DecomptePdfPreview
          open={isPdfOpen}
          onClose={() => setPdfOpen(false)}
          mission={selectedOrder}
          decompte={lastDecompte}
          user={user}
        />
      ) : null}
    </>
  );
};

export default OrderView;
