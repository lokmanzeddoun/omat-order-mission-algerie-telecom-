import {
  Box,
  Button,
  Card,
  Chip,
  Stack,
  Tab,
  Tabs,
  Typography,
  Container,
  Paper,
  Grid,
  alpha,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { GridRowsProp } from '@mui/x-data-grid';
import SmartTable, { ContextMenuItem, SmartTableColumn } from 'components/common/SmartTable';
import IconifyIcon from 'components/base/IconifyIcon';
import DeleteIcon from 'assets/icons/hugeicons--delete-02.svg?react';
import EditIcon from 'assets/icons/hugeicons--pencil-edit-02.svg?react';
import CreateIcon from 'assets/icons/solar--document-add-linear.svg?react';
// removed: per SmartTable
import MissionModal from 'components/orders/CreateOrder';
import NoData from './NoData';
import { dateFormatFromUTC } from 'helpers/utils';
import { SyntheticEvent, useEffect, useState } from 'react';
import ActionMenu from './ActionMenu';
import CreateUserModal from './modals/CreateUserModal';
import EditUserModal from './modals/EditUserModal';
import ConfirmDeletionModal from './modals/ArchiveUser';
import ResetPasswordModal from './modals/ResetPasswordModal';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from 'store';
import { RootState } from 'store/rootReducer';
import { addUser, archiveUser, getAllUsers, updateUser, uploadUsers, exportUsers, resetUserPassword } from './users.thunk';
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

const initialColumns: SmartTableColumn<RowData>[] = [
  {
    field: 'matricule',
    headerName: 'Matricule',
    flex: 1,
    minWidth: 150,
    hideable: false,
    renderCell: (params) => (
      <Chip
        label={`#${params.value}`}
        size="small"
        color="primary"
        variant="outlined"
        sx={{ fontWeight: 600 }}
      />
    ),
  },
  {
    field: 'nom',
    headerName: 'Nom',
    flex: 1,
    minWidth: 100,
    hideable: false,
    renderCell: (params) => (
      <Typography variant="body2" fontWeight={500} color="text.primary">
        {params.value}
      </Typography>
    ),
  },
  {
    field: 'prenom',
    headerName: 'Prenom',
    minWidth: 100,
    flex: 1,
    hideable: false,
    renderCell: (params) => (
      <Typography variant="body2" fontWeight={500} color="text.primary">
        {params.value}
      </Typography>
    ),
  },
  {
    field: 'email',
    headerName: 'Email',
    flex: 1.2,
    minWidth: 280,
    hideable: false,
    renderCell: (params) => (
      <Typography variant="body2" color="text.primary" sx={{ px: 1 }}>
        {params.value}
      </Typography>
    ),
  },
  {
    field: 'structure.name',
    headerName: 'Service',
    flex: 1.2,
    minWidth: 220,
    hideable: false,
    renderCell: (params) => (
      <Typography variant="body2" color="text.primary" sx={{ px: 1 }}>
        {params.row?.structure?.name}
      </Typography>
    ),
    valueGetter: (params: any) => params?.row?.structure?.name ?? '',
  },
  {
    field: 'grade',
    headerName: 'Grade',
    minWidth: 150,
    flex: 0.8,
    hideable: false,
    renderCell: (params) => (
      <Typography variant="body2" color="text.primary" sx={{ px: 1 }}>
        {params.value}
      </Typography>
    ),
  },
  {
    field: 'category',
    headerName: 'Category',
    width: 100,
    hideable: false,
    sortable: false,
    filterable: false,
    headerSearchable: false,
    renderCell: (params) => (
      <Chip label={params.value} size="small" variant="outlined" />
    ),
  },
  {
    field: 'role',
    headerName: 'Role',
    width: 100,
    hideable: false,
    sortable: false,
    filterable: false,
    headerSearchable: false,
    renderCell: (params) => (
      <Chip
        label={params.value}
        size="small"
        color={params.value === 'ADMIN' ? 'secondary' : 'default'}
      />
    ),
  },
  {
    field: 'userSince',
    headerName: 'utilisateurDepuis',
    minWidth: 130,
    flex: 1,
    hideable: false,
    headerSearchable: false,
    renderCell: (params) => (
      <Typography variant="body2" color="text.secondary">
        {dateFormatFromUTC(params.value)}
      </Typography>
    ),
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
  const [isResetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
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

  const handleExportUsers = async () => {
    await dispatch(exportUsers());
  };
  const handleOrderSubmit = async (data: any) => {
    if (!selectedUser) return;
    // Attach target user matricule for backend to create mission for that user
    const payload = { ...data, userMatricule: selectedUser.matricule };
    const success = await dispatch(addOrder(payload, token));
    if (success) {
      setOpen(false);
    }
    // If there's an error, the modal stays open so user can fix the form
  };


  // Function to handle opening of the archive modal
  const handleArchive = (user: any) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  // Function to handle opening of the reset password modal
  const handleResetPassword = (user: any) => {
    setSelectedUser(user);
    setResetPasswordModalOpen(true);
  };

  // Function to submit password reset
  const handleResetPasswordSubmit = async (newPassword: string) => {
    if (!selectedUser) return;
    await dispatch(resetUserPassword(selectedUser.matricule, newPassword));
    setResetPasswordModalOpen(false);
  };

  const ConfirmationArchive = async () => {
    if (selectedUser) {
      await dispatch(archiveUser(selectedUser as any));
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

  const handleChange = (_event: SyntheticEvent, newValue: number) => {
    setValue(newValue);
    filterData(newValue);
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
  const columns: SmartTableColumn<RowData>[] = [
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
          onDelete={() => handleArchive(params.row)} // Attach the archive handler
          handleMissionOpen={() => handleOpen1(params.row)}
          onResetPassword={() => handleResetPassword(params.row)} // Attach the reset password handler
        />
      ),
    },
  ];
  if (loading) {
    return <Splash />;
  }

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === 'ACTIVE').length;
  const adminUsers = users.filter((u) => u.role === 'ADMIN').length;
  const regularUsers = users.filter((u) => u.role === 'USER').length;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <PeopleIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" fontWeight="600">
              Gestion des Utilisateurs
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Gérer les utilisateurs, leurs rôles et permissions
            </Typography>
          </Box>
          <Tooltip title="Actualiser">
            <IconButton
              onClick={() => dispatch(getAllUsers())}
              sx={{
                backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.2),
                },
              }}
            >
              <RefreshIcon color="primary" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.04),
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <PeopleIcon sx={{ fontSize: 24, color: 'primary.main' }} />
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                Total
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight="600" color="primary.main">
              {totalUsers}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: (theme) => alpha(theme.palette.success.main, 0.04),
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <PeopleIcon sx={{ fontSize: 24, color: 'success.main' }} />
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                Actifs
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight="600" color="success.main">
              {activeUsers}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: (theme) => alpha(theme.palette.secondary.main, 0.04),
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <PeopleIcon sx={{ fontSize: 24, color: 'secondary.main' }} />
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                Administrateurs
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight="600" color="secondary.main">
              {adminUsers}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: (theme) => alpha(theme.palette.info.main, 0.04),
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <PeopleIcon sx={{ fontSize: 24, color: 'text.primary' }} />
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                Utilisateurs
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight="600" color="text.primary">
              {regularUsers}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          Actions
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={handleOpen}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Ajouter Utilisateur
          </Button>
          <Button
            variant="outlined"
            component="label"
            startIcon={<UploadIcon />}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Importer
            <input type="file" hidden onChange={handleFileChange} />
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportUsers}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Exporter
          </Button>
        </Stack>
      </Paper>

      {/* Tabs */}
      <Paper elevation={0} sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs
          value={value}
          onChange={handleChange}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
              minHeight: 64,
            },
          }}
        >
          <Tab label={`Tous les Utilisateurs (${totalUsers})`} {...a11yProps(0)} />
          <Tab label={`Utilisateurs (${regularUsers})`} {...a11yProps(1)} />
          <Tab label={`Administrateurs (${adminUsers})`} {...a11yProps(2)} />
        </Tabs>
      </Paper>

      {/* Table Card */}
      <Card
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
          '& .MuiDataGrid-root': {
            border: 'none',
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.04),
            borderBottom: '2px solid',
            borderColor: 'divider',
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 600,
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.02),
          },
        }}
      >
        <SmartTable<RowData>
          columns={columns}
          rows={[...items]}
          rowCount={items.length}
          getRowId={(row) => row.matricule}
          loading={loading}
          noRowsOverlay={NoData as any}
          onViewDetails={(row) => {
            setSelectedUser(row);
            setViewOnly(true);
            setEditModalOpen(true);
          }}
          contextMenuItems={(
            // provide contextual actions for right-click menu
            [
              {
                key: 'add-mission',
                label: 'Ajouter Mission',
                color: 'primary',
                icon: <IconifyIcon icon={CreateIcon} color="primary" />,
                onClick: (row: RowData) => handleOpen1(row),
              },
              {
                key: 'edit',
                label: 'Editer',
                color: 'inherit',
                icon: <IconifyIcon icon={EditIcon} />,
                onClick: (row: RowData) => handleEdit(row),
              },
              {
                key: 'reset-password',
                label: 'Réinitialiser MDP',
                color: 'warning',
                icon: <IconifyIcon icon={EditIcon} color="warning" />,
                onClick: (row: RowData) => handleResetPassword(row),
              },
              {
                key: 'archive',
                label: 'Archiver',
                color: 'error',
                icon: <IconifyIcon icon={DeleteIcon} color="error" />,
                onClick: (row: RowData) => handleArchive(row),
              },
            ] as ContextMenuItem<RowData>[]
          )}
        />
      </Card>
      {/* Context menu is handled inside SmartTable via contextMenuItems if provided */}
      <MissionModal
        open={open1}
        onClose={handleClose1}
        onSubmit={handleOrderSubmit}
        targetUser={
          selectedUser
            ? { matricule: selectedUser.matricule, nom: selectedUser.nom, prenom: selectedUser.prenom }
            : undefined
        }
      />
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
            onConfirm={ConfirmationArchive}
          />
          <ResetPasswordModal
            open={isResetPasswordModalOpen}
            onClose={() => setResetPasswordModalOpen(false)}
            onSubmit={handleResetPasswordSubmit}
            userName={`${selectedUser.nom} ${selectedUser.prenom}`}
          />
        </>
      ) : null}
    </Container>
  );
};

export default InvoiceOverviewTable;
