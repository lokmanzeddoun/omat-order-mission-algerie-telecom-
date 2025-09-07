import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Menu, MenuItem, ListItemIcon, ListItemText, TextField } from '@mui/material';
import {
    DataGrid,
    GridColDef,
    GridFilterModel,
    GridPaginationModel,
    GridRowClassNameParams,
    GridRowId,
    GridRowSelectionModel,
    GridValidRowModel,
} from '@mui/x-data-grid';

export type ContextMenuItem<Row = any> = {
    key: string;
    label: React.ReactNode;
    icon?: React.ReactNode;
    onClick: (row: Row) => void;
};

type SmartTableProps<Row extends GridValidRowModel = GridValidRowModel> = {
    columns: GridColDef<Row>[];
    rows: Row[];
    getRowId: (row: Row) => GridRowId;
    rowCount?: number;
    paginationModel?: GridPaginationModel;
    onPaginationModelChange?: (model: GridPaginationModel) => void;
    loading?: boolean;
    noRowsOverlay?: React.FC;
    // Search
    enableHeaderSearch?: boolean;
    dateFields?: string[]; // fields that should use date input and equals operator
    enableDateClear?: boolean; // show clear icon for date searches
    // Interactions
    onViewDetails?: (row: Row) => void; // double click
    contextMenuItems?: ContextMenuItem<Row>[]; // right click
};

const SmartTable = <Row extends GridValidRowModel = GridValidRowModel>({
    columns,
    rows,
    getRowId,
    rowCount,
    paginationModel,
    onPaginationModelChange,
    loading,
    noRowsOverlay,
    enableHeaderSearch = true,
    dateFields = [],
    enableDateClear = false,
    onViewDetails,
    contextMenuItems = [],
}: SmartTableProps<Row>) => {
    const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [] });
    const [headerSearchField, setHeaderSearchField] = useState<string | null>(null);
    const [headerSearchValue, setHeaderSearchValue] = useState<string>('');
    const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>([]);
    const [highlightRowId, setHighlightRowId] = useState<GridRowId | null>(null);
    const gridRef = useRef<HTMLDivElement | null>(null);

    // Context menu state
    const [ctx, setCtx] = useState<{ mouseX: number; mouseY: number } | null>(null);
    const [ctxRow, setCtxRow] = useState<Row | null>(null);

    const isDateField = useCallback((field: string) => dateFields.includes(field), [dateFields]);

    // Close header search on Escape
    const closeHeaderSearch = useCallback((field?: string) => {
        if (!field && !headerSearchField) return;
        const f = field || headerSearchField!;
        setHeaderSearchField(null);
        setHeaderSearchValue('');
        setFilterModel((prev) => ({
            items: prev.items.filter((it: any) => it.field !== f),
        }));
    }, [headerSearchField]);

    // Click outside clears selection and highlight
    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (gridRef.current && !gridRef.current.contains(target)) {
                setRowSelectionModel([]);
                setHighlightRowId(null);
            }
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, []);

    const enhancedColumns: GridColDef<Row>[] = useMemo(() => {
        if (!enableHeaderSearch) return columns;
        return columns.map((col) => ({
            ...col,
            renderHeader:
                col.field && (col.headerName || col.field)
                    ? () =>
                        headerSearchField === col.field ? (
                            <TextField
                                autoFocus
                                size="small"
                                type={isDateField(col.field as string) ? 'date' : 'text'}
                                placeholder={isDateField(col.field as string) ? undefined : `Rechercher ${col.headerName || col.field}`}
                                value={headerSearchValue}
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                        e.stopPropagation();
                                        closeHeaderSearch(col.field as string);
                                    }
                                }}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setHeaderSearchValue(val);
                                    const field = col.field as string;
                                    const operator = isDateField(field) ? 'equals' : 'contains';
                                    setFilterModel((prev) => {
                                        const others = prev.items.filter((it: any) => it.field !== field);
                                        const nextItems = val ? [...others, { field, operator, value: val } as any] : others;
                                        return { items: nextItems } as GridFilterModel;
                                    });
                                }}
                                onBlur={() => {
                                    if (!headerSearchValue) setHeaderSearchField(null);
                                }}
                                InputProps={
                                    enableDateClear && isDateField(col.field as string) && headerSearchValue
                                        ? {
                                            endAdornment: (
                                                <Box component="span" sx={{ cursor: 'pointer', fontWeight: 600 }}
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={() => closeHeaderSearch(col.field as string)}
                                                >
                                                    ✕
                                                </Box>
                                            ),
                                        }
                                        : undefined
                                }
                                sx={{ '& .MuiInputBase-input': { py: 0.2 } }}
                            />
                        ) : (
                            <>{col.headerName || col.field}</>
                        )
                    : col.renderHeader,
        }));
    }, [columns, enableHeaderSearch, headerSearchField, headerSearchValue, isDateField, enableDateClear, closeHeaderSearch]);

    const handleContextMenu: React.MouseEventHandler<HTMLDivElement> = (event) => {
        event.preventDefault();
        const target = event.target as HTMLElement;
        const rowEl = target.closest('[data-id]') as HTMLElement | null;
        const idAttr = rowEl?.getAttribute('data-id');
        if (!idAttr) return;
        const row = rows.find((r) => String(getRowId(r)) === idAttr) || null;
        if (!row) return;
        setCtxRow(row);
        const rid = getRowId(row);
        setRowSelectionModel([rid]);
        setHighlightRowId(rid);
        if (contextMenuItems.length) {
            setCtx({ mouseX: event.clientX + 2, mouseY: event.clientY - 6 });
        }
    };

    return (
        <Box ref={gridRef} onContextMenu={handleContextMenu}>
            <DataGrid
                getRowId={getRowId}
                rows={rows}
                columns={enhancedColumns}
                loading={!!loading}
                rowSelectionModel={rowSelectionModel}
                onRowSelectionModelChange={(m) => setRowSelectionModel(m)}
                filterModel={filterModel}
                onFilterModelChange={setFilterModel}
                rowHeight={60}
                paginationMode={paginationModel ? 'server' : 'client'}
                paginationModel={paginationModel}
                onPaginationModelChange={onPaginationModelChange}
                rowCount={rowCount}
                onColumnHeaderDoubleClick={(params: any) => {
                    const field = params.field as string;
                    if (!field) return;
                    setHeaderSearchField(field);
                    const existing = (filterModel.items as any[]).find((it: any) => it.field === field);
                    setHeaderSearchValue((existing?.value as string) || '');
                }}
                onCellDoubleClick={(params) => {
                    if (onViewDetails) {
                        onViewDetails(params.row as Row);
                    }
                    const rid = getRowId(params.row as Row);
                    setRowSelectionModel([rid]);
                    setHighlightRowId(rid);
                }}
                getRowClassName={(params: GridRowClassNameParams) =>
                    highlightRowId != null && String(params.id) === String(highlightRowId)
                        ? 'action-highlight'
                        : ''
                }
                disableColumnMenu
                disableColumnFilter
                disableColumnSelector
                disableDensitySelector
                slots={{
                    noRowsOverlay: noRowsOverlay,
                }}
                sx={{
                    px: { xs: 0, md: 3 },
                    '& .MuiDataGrid-main': { minHeight: 300 },
                    '& .MuiDataGrid-virtualScroller': { minHeight: 300, p: 0 },
                    '& .MuiDataGrid-columnHeader': { fontSize: { xs: 13, lg: 16 }, userSelect: 'none' },
                    '& .MuiDataGrid-columnHeader .MuiInputBase-input': { userSelect: 'text' },
                    '& .MuiDataGrid-cell': { fontSize: { xs: 13, lg: 16 }, userSelect: 'none' },
                    '& .MuiTypography-root': { fontSize: { xs: 13, lg: 16 } },
                    '& .MuiDataGrid-row': { userSelect: 'none' },
                    // Disable default selection highlight
                    '& .MuiDataGrid-row.Mui-selected': { backgroundColor: 'transparent !important' },
                    '& .MuiDataGrid-row.Mui-selected:hover': { backgroundColor: 'transparent !important' },
                    '& .MuiDataGrid-cell--selected': { backgroundColor: 'transparent !important' },
                    '& .MuiDataGrid-cell--selected:hover': { backgroundColor: 'transparent !important' },
                    // Our action-based highlight
                    '& .action-highlight': { backgroundColor: 'primary.light !important' },
                }}
            />

            <Menu
                open={ctx !== null}
                onClose={() => setCtx(null)}
                anchorReference="anchorPosition"
                anchorPosition={ctx ? { top: ctx.mouseY, left: ctx.mouseX } : undefined}
                sx={{ mt: 0.5 }}
            >
                {contextMenuItems.map((mi) => (
                    <MenuItem
                        key={mi.key}
                        onClick={() => {
                            if (ctxRow) mi.onClick(ctxRow);
                            setCtx(null);
                        }}
                    >
                        {mi.icon ? <ListItemIcon sx={{ mr: 1 }}>{mi.icon}</ListItemIcon> : null}
                        <ListItemText>{mi.label}</ListItemText>
                    </MenuItem>
                ))}
            </Menu>
        </Box>
    );
};

export default SmartTable;
