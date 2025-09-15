import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DataGrid, GridColDef, GridFilterModel, GridPaginationModel, GridRowClassNameParams, GridRowId } from '@mui/x-data-grid';
import { Box, Menu, MenuItem, ListItemIcon, ListItemText, TextField, Typography } from '@mui/material';
import NoData from 'components/users/NoData';
import CustomPagination from 'components/users/customPagination';
import IconifyIcon from 'components/base/IconifyIcon';

export interface TableAction<T = any> {
  id: string;
  label: string;
  icon?: any; // SVG React component or string for Iconify
  color?: 'default' | 'error' | 'success' | 'warning' | 'info';
  hidden?: (row: T | null, userRole?: string) => boolean;
  disabled?: (row: T | null, userRole?: string) => boolean;
  onClick: (row: T | null) => void | Promise<void>;
}

export interface AdvancedTableColumn extends Omit<GridColDef, 'renderHeader'> {
  headerSearchable?: boolean;
  // Optional custom header renderer override still possible via standard GridColDef props
}

export interface AdvancedTableProps<T = any> {
  rows: T[];
  columns: AdvancedTableColumn<T>[];
  getRowId: (row: T) => GridRowId;
  loading?: boolean;
  pageSize?: number;
  onDoubleClickRow?: (row: T) => void;
  actions?: TableAction<T>[]; // context menu actions
  userRole?: string;
  initialHighlightId?: GridRowId | null;
  enableHeaderSearch?: boolean;
  autoHeight?: boolean;
  /** Optional external filter model if parent wants control */
  externalFilterModel?: GridFilterModel;
  onFilterModelChange?: (model: GridFilterModel) => void;
}

function AdvancedTable<T = any>({
  rows,
  columns,
  getRowId,
  loading,
  pageSize = 10,
  onDoubleClickRow,
  actions = [],
  userRole,
  initialHighlightId = null,
  enableHeaderSearch = true,
  externalFilterModel,
  onFilterModelChange,
  autoHeight = false,
}: AdvancedTableProps<T>) {
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize });
  const [highlightRowId, setHighlightRowId] = useState<GridRowId | null>(initialHighlightId);
  const [headerSearchField, setHeaderSearchField] = useState<string | null>(null);
  const [headerSearchValue, setHeaderSearchValue] = useState<string>('');
  const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [] });
  const [ctx, setCtx] = useState<{ mouseX: number; mouseY: number } | null>(null);
  const [ctxRow, setCtxRow] = useState<T | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Merge external filter model if provided
  useEffect(() => {
    if (externalFilterModel) setFilterModel(externalFilterModel);
  }, [externalFilterModel]);

  const handleInternalFilterChange = (model: GridFilterModel) => {
    setFilterModel(model);
    onFilterModelChange?.(model);
  };

  const effectiveColumns: GridColDef[] = useMemo(() => {
    return columns.map((col) => {
      const guarded: GridColDef = { ...col } as GridColDef;

      // Wrap valueGetter safely
      if (col.valueGetter) {
        const originalVG = col.valueGetter as any;
        guarded.valueGetter = (params: any) => {
          try {
            return originalVG(params ?? { row: {}, value: undefined });
          } catch {
            return undefined as any;
          }
        };
      }

      // Wrap renderCell safely
      if (col.renderCell) {
        const originalRC = col.renderCell as any;
        guarded.renderCell = (params: any) => {
          try {
            return originalRC(params ?? { row: {}, value: undefined });
          } catch {
            return null;
          }
        };
      }

      if (!enableHeaderSearch || !col.field || !col.headerSearchable) return guarded;

      guarded.renderHeader = () =>
        headerSearchField === col.field ? (
          <TextField
            autoFocus
            size="small"
            type={col.type === 'date' ? 'date' : 'text'}
            placeholder={col.headerName ? `Rechercher ${col.headerName}` : 'Recherche'}
            value={headerSearchValue}
            onChange={(e) => {
              const val = e.target.value;
              setHeaderSearchValue(val);
              const field = col.field as string;
              const operator = col.type === 'date' ? 'equals' : 'contains';
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
        );

      return guarded;
    });
  }, [columns, headerSearchField, headerSearchValue, enableHeaderSearch]);

  const visibleActions = useMemo(
    () => actions.filter((a) => !a.hidden || !a.hidden(ctxRow, userRole)),
    [actions, ctxRow, userRole],
  );

  const handleContextMenu: React.MouseEventHandler<HTMLDivElement> = (event) => {
    if (!actions.length) return;
    event.preventDefault();
    const target = event.target as HTMLElement;
    const rowEl = target.closest('[data-rowid]') as HTMLElement | null;
    // DataGrid uses data-id attribute on row root
    const attr = rowEl?.getAttribute('data-id');
    if (!attr) return;
    const found = rows.find((r) => String(getRowId(r)) === attr) || null;
    setCtxRow(found as any);
    setCtx({ mouseX: event.clientX + 2, mouseY: event.clientY - 6 });
    setHighlightRowId(attr);
  };

  const pagedRows = useMemo(
    () =>
      rows.slice(
        paginationModel.page * paginationModel.pageSize,
        (paginationModel.page + 1) * paginationModel.pageSize,
      ),
    [rows, paginationModel],
  );

  const onHeaderDoubleClick = useCallback(
    (params: any) => {
      if (!enableHeaderSearch) return;
      const field = params?.field as string;
      if (!field) return;
      setHeaderSearchField(field);
      const existing = (filterModel.items as any[]).find((it: any) => it.field === field);
      setHeaderSearchValue((existing?.value as string) || '');
    },
    [filterModel, enableHeaderSearch],
  );

  return (
    <Box ref={rootRef} sx={{ width: 1, position: 'relative' }} onContextMenu={handleContextMenu}>
      <DataGrid
        getRowId={getRowId}
        rows={pagedRows as any}
        columns={effectiveColumns}
        rowCount={rows.length}
        filterModel={filterModel}
        onFilterModelChange={handleInternalFilterChange}
        density="standard"
        loading={loading}
        rowHeight={50}
        disableColumnResize
        disableColumnMenu
        disableColumnSelector
        disableDensitySelector
        disableColumnFilter
        paginationMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        onColumnHeaderDoubleClick={onHeaderDoubleClick}
        onRowDoubleClick={(params) => {
          setHighlightRowId(params.id as GridRowId);
          if (onDoubleClickRow) {
            const row = rows.find((r) => String(getRowId(r)) === String(params.id));
            if (row) onDoubleClickRow(row);
          }
        }}
        getRowClassName={(params: GridRowClassNameParams) =>
          highlightRowId != null && String(params.id) === String(highlightRowId) ? 'action-highlight' : ''
        }
        slots={{
          noRowsOverlay: () => <NoData />,
          pagination: () => null,
        }}
        sx={{
          '.MuiDataGrid-cell:focus': { outline: 'none' },
          '& .MuiDataGrid-row:hover': { cursor: 'pointer' },
          '& .MuiDataGrid-main': { minHeight: 300 },
          '& .MuiDataGrid-virtualScroller': { minHeight: 300, p: 0 },
          '& .action-highlight': { backgroundColor: 'primary.light !important' },
        }}
        autoHeight={autoHeight}
      />

      <Box sx={{ mt: 2, display: 'flex', justifyContent: { xs: 'center', md: 'flex-end' } }}>
        <CustomPagination
          page={paginationModel.page + 1}
          pageCount={Math.ceil(rows.length / paginationModel.pageSize) || 1}
          onPageChange={(_e, v) => setPaginationModel((prev) => ({ ...prev, page: v - 1 }))}
        />
      </Box>

      <Menu
        open={ctx !== null && !!visibleActions.length}
        onClose={() => setCtx(null)}
        anchorReference="anchorPosition"
        anchorPosition={ctx ? { top: ctx.mouseY, left: ctx.mouseX } : undefined}
        sx={{ mt: 0.5, '& .MuiList-root': { width: 180 } }}
      >
        {visibleActions.map((action) => {
          const disabled = action.disabled?.(ctxRow, userRole) ?? false;
          const color = action.color ? `${action.color}.main` : undefined;
          return (
            <MenuItem
              key={action.id}
              disabled={disabled}
              onClick={() => {
                action.onClick(ctxRow);
                setCtx(null);
              }}
            >
              {action.icon ? (
                <ListItemIcon sx={{ mr: 1 }}>
                  <IconifyIcon icon={action.icon} color={color} />
                </ListItemIcon>
              ) : null}
              <ListItemText>
                <Typography color={color}>{action.label}</Typography>
              </ListItemText>
            </MenuItem>
          );
        })}
      </Menu>
    </Box>
  );
}

export default AdvancedTable;
