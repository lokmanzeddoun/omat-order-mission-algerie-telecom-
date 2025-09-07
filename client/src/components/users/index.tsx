import { Box, Button, Card, Chip, Stack, Tab, Tabs, Typography } from '@mui/material';
import { GridColDef, GridPaginationModel, GridRowsProp } from '@mui/x-data-grid';
import SmartTable from 'components/common/SmartTable';
// removed: per SmartTable
import CustomPagination from './customPagination';
import MissionModal from 'components/orders/CreateOrder';
import NoData from './NoData';
import { dateFormatFromUTC } from 'helpers/utils';
import { SyntheticEvent, useEffect, useState } from 'react';
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

// const rowHeight = 60; // default row height (handled by SmartTable)

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
  // header search & context menu handled by SmartTable

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

  // handled by SmartTable

  // header search handled by SmartTable

  // handled by SmartTable

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

  // no-op: handled by SmartTable

  // Define the full columns array including the dynamic action column
  const columns: GridColDef[] = [
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
            boxShadow: (theme) => `inset 0px -1px ${theme.palette.neutral.light}`,
          },
        }}
      >
        <SmartTable<RowData>
          columns={columns}
          rows={items.slice(
            paginationModel.page * paginationModel.pageSize,
            (paginationModel.page + 1) * paginationModel.pageSize,
          )}
          rowCount={items.length}
          getRowId={(row) => row.matricule}
          paginationModel={paginationModel}
          onPaginationModelChange={handlePaginationModelChange}
          loading={loading}
          noRowsOverlay={NoData as any}
          onViewDetails={(row) => {
            setSelectedUser(row);
            setViewOnly(true);
            setEditModalOpen(true);
          }}
          contextMenuItems={[]}
        />
      </Card>
      {/* Context menu is handled inside SmartTable via contextMenuItems if provided */}
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
