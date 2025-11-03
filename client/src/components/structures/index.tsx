import {
  Box,
  Button,
  Card,
  Stack,
  Typography,
  Container,
  Paper,
  Grid,
  alpha,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  AccountTree as AccountTreeIcon,
  Add as AddIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { GridColDef } from '@mui/x-data-grid';
import SmartTable, { ContextMenuItem } from 'components/common/SmartTable';
import IconifyIcon from 'components/base/IconifyIcon';
import EditIcon from 'assets/icons/hugeicons--pencil-edit-02.svg?react';
import DeleteIcon from 'assets/icons/hugeicons--delete-02.svg?react';
import NoData from 'components/users/NoData';
import { useEffect, useState } from 'react';
import ActionMenu from 'components/admin/order-overview/ActionMenu';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from 'store';
import { RootState } from 'store/rootReducer';
import {
  addStructure,
  archiveStructure,
  getAllStructures,
  updateStructure,
  uploadStructure,
  exportStructures,
} from './structure.thunk';
import CreateStructureModal from './modals/CreateStructureModal';
import EditStructureModal from './modals/EditStructureModal';
import ConfirmDeletionModal from './modals/ArchiveStructure';
import Splash from 'components/loader/Splash';

export interface RowData {
  code: string;
  name: string;
}

const initialColumns: GridColDef[] = [
  {
    field: 'code',
    headerName: 'Code',
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
    field: 'name',
    headerName: 'Nom du Service',
    flex: 1,
    minWidth: 200,
    hideable: false,
    renderCell: (params) => (
      <Typography variant="body2" fontWeight={500} color="text.primary">
        {params.value}
      </Typography>
    ),
  },
];

// rowHeight handled by SmartTable

const InvoiceOverviewTable: React.FC = () => {
  // get users State
  const dispatch = useDispatch<AppDispatch>();

  const { structures, loading: structureLoading } = useSelector(
    (state: RootState) => state.structures,
  );

  const [selectedStructure, setselectedStructure] = useState<RowData | null>(null);

  const [open, setOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);
  const [isArchiveModalOpen, setArchiveModalOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleEdit = (structure: any) => {
    setselectedStructure(structure);
    setViewOnly(false);
    setEditModalOpen(true);
  };
  const handleStructureSubmit = async (data: RowData) => {
    await dispatch(addStructure(data));
    await dispatch(getAllStructures());
    setOpen(false);
    // Handle the submission (e.g., send data to a backend)
  };
  const [loading, setLoading] = useState(false);
  // header search, selection, and context menu handled by SmartTable

  // handled by SmartTable

  // handled by SmartTable

  // handled by SmartTable

  // Function to handle opening of the archive modal
  const handleArchive = async (structure: any) => {
    setselectedStructure(structure);
    setArchiveModalOpen(true);
  };
  const ConfirmationArchive = async () => {
    if (selectedStructure) {
      await dispatch(archiveStructure(selectedStructure as any));
    }
    await dispatch(getAllStructures());
    setArchiveModalOpen(false);
  };
  const EditSumbission = async (data: RowData) => {
    await dispatch(updateStructure(data));
    setEditModalOpen(false);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];

      await dispatch(uploadStructure(file));
      await dispatch(getAllStructures());
    }
  };

  const handleExportStructures = async () => {
    await dispatch(exportStructures());
  };

  useEffect(() => {
    setLoading(true);
    dispatch(getAllStructures());
    setLoading(false);
  }, [dispatch]);

  // handled by SmartTable

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
          onDelete={() => handleArchive(params.row)} // Attach the archive handler
        />
      ),
    },
  ];
  if (structureLoading) {
    return <Splash />;
  }

  const totalStructures = structures.length;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <AccountTreeIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" fontWeight="600">
              Gestion des Services
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Gérer les structures organisationnelles et services
            </Typography>
          </Box>
          <Tooltip title="Actualiser">
            <IconButton
              onClick={() => dispatch(getAllStructures())}
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

      {/* Statistics Card */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
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
              <AccountTreeIcon sx={{ fontSize: 24, color: 'primary.main' }} />
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                Total Services
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight="600" color="primary.main">
              {totalStructures}
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
            startIcon={<AddIcon />}
            onClick={handleOpen}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Ajouter Service
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
            onClick={handleExportStructures}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Exporter
          </Button>
        </Stack>
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
          rows={structures}
          rowCount={structures.length}
          getRowId={(row) => row.code}
          loading={loading}
          noRowsOverlay={NoData as any}
          onViewDetails={(row) => {
            setselectedStructure(row);
            setViewOnly(true);
            setEditModalOpen(true);
          }}
          contextMenuItems={([
            {
              key: 'edit',
              label: 'Editer',
              color: 'inherit',
              icon: <IconifyIcon icon={EditIcon} />,
              onClick: (row) => handleEdit(row as any),
            },
            {
              key: 'archive',
              label: 'Archiver',
              color: 'error',
              icon: <IconifyIcon icon={DeleteIcon} color="error" />,
              onClick: (row) => handleArchive(row as any),
            },
          ] as ContextMenuItem<RowData>[])}
        />
      </Card>
      {/* Context menu handled by SmartTable via contextMenuItems */}
      <CreateStructureModal open={open} onClose={handleClose} onSubmit={handleStructureSubmit} />
      {selectedStructure ? (
        <>
          <EditStructureModal
            open={isEditModalOpen}
            onClose={() => setEditModalOpen(false)}
            userData={selectedStructure}
            onSubmit={EditSumbission}
            viewOnly={viewOnly}
          />
          <ConfirmDeletionModal
            open={isArchiveModalOpen}
            onClose={() => setArchiveModalOpen(false)}
            itemName={selectedStructure.name}
            onConfirm={ConfirmationArchive}
          />
        </>
      ) : null}
    </Container>
  );
};

export default InvoiceOverviewTable;
