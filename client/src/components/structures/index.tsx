import { Box, Button, Card, Stack, Typography, TextField, ListItemIcon, ListItemText, MenuItem as MUIMenuItem } from '@mui/material';
import { DataGrid, GridColDef, GridPaginationModel, GridFilterModel, GridRowSelectionModel } from '@mui/x-data-grid';
import Menu from '@mui/material/Menu';
import IconifyIcon from 'components/base/IconifyIcon';
import EditIcon from 'assets/icons/hugeicons--pencil-edit-02.svg?react';
import DeleteIcon from 'assets/icons/hugeicons--delete-02.svg?react';
import CustomPagination from 'components/users/customPagination';
import NoData from 'components/users/NoData';
import { useEffect, useRef, useState } from 'react';
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

const rowHeight = 60; // default row height

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

  const handlePaginationModelChange = (model: GridPaginationModel) => {
    setPaginationModel(model);
  };

  const handleColumnHeaderDoubleClick = (params: any) => {
    const field = params.field as string;
    if (!field) return;
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
    const row = structures.find((r) => String(r.code) === id) || null;
    if (!row) return;
    setCtxRow(row);
    setRowSelectionModel([row.code]);
    setCtx({ mouseX: event.clientX + 2, mouseY: event.clientY - 6 });
  };

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

  useEffect(() => {
    setLoading(true);
    dispatch(getAllStructures());
    setLoading(false);
  }, [dispatch]);

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
            }}
          >
            Importer
            <input type="file" hidden onChange={handleFileChange} />
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
        <div onContextMenu={handleContextMenu} ref={gridRef}>
          <DataGrid
            getRowId={(row) => row.code}
            rowHeight={rowHeight}
            rows={structures.slice(
              paginationModel.page * paginationModel.pageSize,
              (paginationModel.page + 1) * paginationModel.pageSize,
            )}
            rowCount={structures.length}
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
            onRowSelectionModelChange={(m) => {
              setRowSelectionModel(m);
              const selectedRows = structures.filter((row) => m.includes(row.code));
              setselectedStructure(selectedRows[0] ?? null);
            }}
            disableDensitySelector
            disableColumnSelector
            onCellDoubleClick={(params) => {
              setselectedStructure(params.row);
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

      <Box sx={{ mt: 2, display: 'flex', justifyContent: { xs: 'center', md: 'flex-end' } }}>
        <CustomPagination
          page={paginationModel.page + 1}
          pageCount={Math.ceil(structures.length / paginationModel.pageSize)}
          onPageChange={(_event, value) =>
            setPaginationModel((prev) => ({ ...prev, page: value - 1 }))
          }
        />
      </Box>
    </Stack>
  );
};

export default InvoiceOverviewTable;
