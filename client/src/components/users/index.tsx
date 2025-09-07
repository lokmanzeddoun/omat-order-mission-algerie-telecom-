import { Box, Button, Card, Chip, Stack, Tab, Tabs, Typography, TextField, ListItemIcon, ListItemText, MenuItem as MUIMenuItem } from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridPaginationModel,
  GridRowsProp,
  GridFilterModel,
  GridRowSelectionModel,
} from '@mui/x-data-grid';
import Menu from '@mui/material/Menu';
import IconifyIcon from 'components/base/IconifyIcon';
import EditIcon from 'assets/icons/hugeicons--pencil-edit-02.svg?react';
import DeleteIcon from 'assets/icons/hugeicons--delete-02.svg?react';
import CreateIcon from 'assets/icons/solar--document-add-linear.svg?react';
import CustomPagination from './customPagination';
import MissionModal from 'components/orders/CreateOrder';
import NoData from './NoData';
import { dateFormatFromUTC } from 'helpers/utils';
import { SyntheticEvent, useEffect, useRef, useState } from 'react';
import ActionMenu from './ActionMenu';
import CreateUserModal from './modals/CreateUserModal';
import EditUserModal from './modals/EditUserModal';
import ConfirmDeletionModal from './modals/DeleteUser';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from 'store';
import { RootState } from 'store/rootReducer';
import { addUser, deleteUser, getAllUsers, updateUser, uploadUsers } from './users.thunk';
import { Role } from 'constants/role';
import { Category } from 'constants/category';
import Splash from 'components/loader/Splash';
import { addOrder } from 'components/orders/orderthunk';
export interface RowData {
  id: number;
  matricule: number;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  grade: string;
  category: Category;
  serviceId: string | null;
  status?: string;
  service?: string;
  structure?: { name: string; code?: string } | null;
}

const initialColumns: GridColDef[] = [
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
    field: 'structure.name',
    headerName: 'Service',
    flex: 1,
    minWidth: 200,
    hideable: false,
    renderCell: (params) => <>{params.row?.structure?.name}</>,
    valueGetter: (params: any) => params?.row?.structure?.name ?? '',
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
    field: 'userSince',
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
];

const a11yProps = (index: number) => ({
  id: `transaction-tab-${index}`,
  'aria-controls': `transaction-tabpanel-${index}`,
});

const rowHeight = 60; // default row height

const InvoiceOverviewTable: React.FC = () => {
  // get users State
  const dispatch = useDispatch<AppDispatch>();

  const { users } = useSelector((state: RootState) => state.users);
  const { token } = useSelector((state: RootState) => state.auth);
  const [open, setOpen] = useState(false);
  const [open1, setOpen1] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<RowData | null>(null);
  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setViewOnly(false);
    setEditModalOpen(true);
  };
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];

      await dispatch(uploadUsers(file));
      await dispatch(getAllUsers());
    }
  };
  const handleOrderSubmit = async (data: any) => {
    if (!selectedUser) return;
    const userWithoutStructure = { ...(selectedUser as any) };
    delete (userWithoutStructure as any).structure;
    data.user = userWithoutStructure;
    await dispatch(addOrder(data, token));
    // await dispatch(getAllUsers());
    setOpen(false);
    // Handle the submission (e.g., send data to a backend)
  };


  // Function to handle opening of the delete modal
  const handleDelete = (user: any) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };
  const ConfirmationDelete = async () => {
    if (selectedUser) {
      await dispatch(deleteUser(selectedUser as any));
    }
    setDeleteModalOpen(false);
  };
  const EditSumbission = async (data: RowData) => {
    const newData = { ...(data as any) };
    delete (newData as any).id;
    await dispatch(updateUser(selectedUser ? selectedUser.matricule : null, newData as any));
    setEditModalOpen(false);
  };
  const handleOpen = () => setOpen(true);
  const handleOpen1 = (user: any) => {
    setSelectedUser(user);
    setOpen1(true);
  };
  const handleClose = () => setOpen(false);
  const handleClose1 = () => setOpen1(false);
  const handleUserSubmit = async (data: RowData) => {
    const newData = { ...(data as any) };
    delete (newData as any).id;
    const payload: any = { password: 'Temp1234!', ...newData };
    await dispatch(addUser(payload));
    setOpen(false);
    // Handle the submission (e.g., send data to a backend)
  };
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<GridRowsProp<RowData>>([]);
  const [value, setValue] = useState(0);
  const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [] });
  const [headerSearchField, setHeaderSearchField] = useState<string | null>(null);
  const [headerSearchValue, setHeaderSearchValue] = useState<string>('');
  const [ctx, setCtx] = useState<{ mouseX: number; mouseY: number } | null>(null);
  const [ctxRow, setCtxRow] = useState<RowData | null>(null);
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>([]);
  const gridRef = useRef<HTMLDivElement | null>(null);

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  const handleChange = (_event: SyntheticEvent, newValue: number) => {
    setValue(newValue);
    filterData(newValue);
  };

  const handlePaginationModelChange = (model: GridPaginationModel) => {
    setPaginationModel(model);
  };

  const handleColumnHeaderDoubleClick = (params: any) => {
    const field = params.field as string;
    if (!field) return; // skip action column
    setHeaderSearchField(field);
    const existing = filterModel.items.find((it) => it.field === field);
    setHeaderSearchValue((existing?.value as string) || '');
  };

  const applyHeaderFilter = (field: string, value: string) => {
    setFilterModel((prev) => {
      const others = prev.items.filter((it) => it.field !== field);
      const nextItems = value
        ? [...others, { field, operator: 'contains', value } as any]
        : others;
      return { items: nextItems } as GridFilterModel;
    });
  };

  const handleContextMenu: React.MouseEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    const target = event.target as HTMLElement;
    const rowEl = target.closest('[data-id]') as HTMLElement | null;
    const id = rowEl?.getAttribute('data-id');
    if (!id) return;
    const row = items.find((r) => String(r.matricule) === id) || null;
    if (!row) return;
    setCtxRow(row);
    setRowSelectionModel([row.matricule]);
    setCtx({ mouseX: event.clientX + 2, mouseY: event.clientY - 6 });
  };

  const mapUsersToRows = (arr: any[]): RowData[] =>
    arr.map((u: any) => ({
      id: u.id ?? u.matricule ?? 0,
      matricule: u.matricule,
      nom: u.nom,
      prenom: u.prenom,
      email: u.email,
      role: u.role,
      grade: u.grade ?? '',
      category: u.category,
      serviceId: u.serviceId ?? u.service ?? null,
      status: u.status,
      service: u.service,
      structure: u.structure ?? null,
    }));

  const filterData = (tabIndex: number) => {
    switch (tabIndex) {
      case 1:
        setItems(mapUsersToRows(users.filter((row) => row.role === 'USER')));
        break;
      case 2:
        setItems(mapUsersToRows(users.filter((row) => row.role === 'ADMIN')));
        break;
      default:
        setItems(mapUsersToRows(users));
        break;
    }
  };

  useEffect(() => {
    setLoading(true);
    dispatch(getAllUsers());
    setLoading(false);
  }, [dispatch]);

  useEffect(() => {
    filterData(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, value]);

  // Clear selection when clicking outside the grid
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (gridRef.current && !gridRef.current.contains(target)) {
        setRowSelectionModel([]);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Define the full columns array including the dynamic action column
  const columns: GridColDef[] = [
    ...initialColumns.map((col) => ({
      ...col,
      renderHeader:
        col.field && col.field !== ''
          ? () =>
            headerSearchField === col.field ? (
              <TextField
                autoFocus
                size="small"
                placeholder={`Rechercher ${col.headerName}`}
                value={headerSearchValue}
                onChange={(e) => {
                  setHeaderSearchValue(e.target.value);
                  applyHeaderFilter(col.field as string, e.target.value);
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
          user={params.row} // Pass the row data (user) to the ActionMenu
          onEdit={() => handleEdit(params.row)} // Attach the edit handler
          onDelete={() => handleDelete(params.row)} // Attach the delete handler
          handleMissionOpen={() => handleOpen1(params.row)}
        />
      ),
    },
  ];
  if (loading) {
    return <Splash />;
  }
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
            onClick={handleOpen}
          >
            Ajouter Utilisateur
          </Button>
          <Button
            variant="outlined"
            component="label"
            tabIndex={-1}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              color: 'white',
              borderColor: 'primary.main',
              bgcolor: 'secondary.main',
              '&:hover': {
                color: 'primary.main',
                borderColor: 'secondary.light',
                bgcolor: 'primary.light',
              },
            }}
          >
            Importer
            <input type="file" hidden onChange={handleFileChange} />
          </Button>
        </Box>
      </Box>
      <Box sx={{ borderBottom: 1, borderColor: 'secondary.lighter', mb: 3.5, mr: 2 }}>
        <Tabs value={value} onChange={handleChange} aria-label="transaction tabs">
          <Tab label="All Users" {...a11yProps(0)} />
          <Tab label="Users" {...a11yProps(1)} />
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
        <div onContextMenu={handleContextMenu} ref={gridRef}>
          <DataGrid
            getRowId={(row) => row.matricule}
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
            onColumnHeaderDoubleClick={handleColumnHeaderDoubleClick as any}
            filterModel={filterModel}
            onFilterModelChange={setFilterModel}
            slots={{
              noRowsOverlay: () => <NoData />,
              pagination: () => null,
            }}
            disableColumnMenu
            disableColumnFilter
            loading={loading}
            rowSelectionModel={rowSelectionModel}
            onRowSelectionModelChange={(m) => setRowSelectionModel(m)}
            disableDensitySelector
            disableColumnSelector
            onCellDoubleClick={(params) => {
              setSelectedUser(params.row);
              setViewOnly(true);
              setEditModalOpen(true);
            }}
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
              '& .MuiDataGrid-row.Mui-selected': {
                bgcolor: 'primary.light',
              },
            }}
          />
        </div>
      </Card>
      {/* Inline header search replaces previous popover */}
      <Menu
        open={ctx !== null}
        onClose={() => setCtx(null)}
        anchorReference="anchorPosition"
        anchorPosition={ctx ? { top: ctx.mouseY, left: ctx.mouseX } : undefined}
        sx={{ mt: 0.5, '& .MuiList-root': { width: 180 } }}
      >
        <MUIMenuItem
          onClick={() => {
            if (ctxRow) handleOpen1(ctxRow);
            setCtx(null);
          }}
        >
          <ListItemIcon sx={{ mr: 1 }}>
            <IconifyIcon icon={CreateIcon} color="primary" />
          </ListItemIcon>
          <ListItemText>Ajouter</ListItemText>
        </MUIMenuItem>
        <MUIMenuItem
          onClick={() => {
            if (ctxRow) handleEdit(ctxRow);
            setCtx(null);
          }}
        >
          <ListItemIcon sx={{ mr: 1 }}>
            <IconifyIcon icon={EditIcon} />
          </ListItemIcon>
          <ListItemText>Editer</ListItemText>
        </MUIMenuItem>
        <MUIMenuItem
          onClick={() => {
            if (ctxRow) handleDelete(ctxRow);
            setCtx(null);
          }}
        >
          <ListItemIcon sx={{ mr: 1 }}>
            <IconifyIcon icon={DeleteIcon} color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>Supprimer</ListItemText>
        </MUIMenuItem>
      </Menu>
      <MissionModal open={open1} onClose={handleClose1} onSubmit={handleOrderSubmit} />
      <CreateUserModal open={open} onClose={handleClose} onSubmit={handleUserSubmit} />
      {selectedUser ? (
        <>
          <EditUserModal
            open={isEditModalOpen}
            onClose={() => setEditModalOpen(false)}
            userData={selectedUser}
            onSubmit={EditSumbission}
            viewOnly={viewOnly}
          />
          <ConfirmDeletionModal
            open={isDeleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            itemName={selectedUser.nom}
            onConfirm={ConfirmationDelete}
          />
        </>
      ) : null}

      <Box sx={{ mt: 2, display: 'flex', justifyContent: { xs: 'center', md: 'flex-end' } }}>
        <CustomPagination
          page={paginationModel.page + 1}
          pageCount={Math.ceil(items.length / paginationModel.pageSize)}
          onPageChange={(_event, value) =>
            setPaginationModel((prev) => ({ ...prev, page: value - 1 }))
          }
        />
      </Box>
    </Stack>
  );
};

export default InvoiceOverviewTable;
