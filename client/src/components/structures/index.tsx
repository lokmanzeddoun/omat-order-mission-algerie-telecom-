import { Box, Button, Card, Stack, Typography } from '@mui/material';
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
  deleteStructure,
  getAllStructures,
  updateStructure,
  uploadStructure,
  exportStructures,
} from './structure.thunk';
import CreateStructureModal from './modals/CreateStructureModal';
import EditStructureModal from './modals/EditStructureModal';
import ConfirmDeletionModal from './modals/DeleteStructure';
import Splash from 'components/loader/Splash';

export interface RowData {
  code: string;
  name: string;
}

const initialColumns: GridColDef[] = [
  {
    field: 'code',
    headerName: 'code',
    flex: 1,
    minWidth: 150,
    hideable: false,
    renderCell: (params) => <>#{params.value}</>,
  },
  {
    field: 'name',
    headerName: 'name',
    flex: 1,
    minWidth: 100,
    hideable: false,
    renderCell: (params) => <>{params.value}</>,
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
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

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

  // Function to handle opening of the delete modal
  const handleDelete = async (structure: any) => {
    setselectedStructure(structure);
    setDeleteModalOpen(true);
  };
  const ConfirmationDelete = async () => {
    if (selectedStructure) {
      await dispatch(deleteStructure(selectedStructure as any));
    }
    await dispatch(getAllStructures());
    setDeleteModalOpen(false);
  };
  const EditSumbission = async (data: RowData) => {
    await dispatch(updateStructure(data));
    setDeleteModalOpen(false);
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
          onDelete={() => handleDelete(params.row)} // Attach the delete handler
        />
      ),
    },
  ];
  if (structureLoading) {
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
          Les Services
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
            Ajouter Service
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
              mr: 3,
            }}
          >
            Importer
            <input type="file" hidden onChange={handleFileChange} />
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
            onClick={handleExportStructures}
          >
            Exporter
          </Button>
        </Box>
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
              key: 'delete',
              label: 'Supprimer',
              color: 'error',
              icon: <IconifyIcon icon={DeleteIcon} color="error" />,
              onClick: (row) => handleDelete(row as any),
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
            open={isDeleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            itemName={selectedStructure.name}
            onConfirm={ConfirmationDelete}
          />
        </>
      ) : null}
    </Stack>
  );
};

export default InvoiceOverviewTable;
