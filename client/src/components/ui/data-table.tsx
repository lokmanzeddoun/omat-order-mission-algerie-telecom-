import { useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import {
  columnVisibilityFeature,
  createColumnHelper,
  createPaginatedRowModel,
  createSortedRowModel,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type ColumnVisibilityState,
  type PaginationState,
  type RowData,
  type SortingState,
} from '@tanstack/react-table';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Ellipsis,
  FileSpreadsheet,
  FilterX,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import dayjs from 'helpers/date';
import { cn } from 'lib/utils';
import { Button } from './button';
import { IconButton } from './icon-button';
import { Checkbox, Input, Select } from './input';
import { ContextMenu, DropdownMenu, type MenuAction } from './menu';
import { EmptyState, Skeleton } from './page';

export type ColumnFilter = false | 'text' | 'date' | { type: 'select'; options: { value: string; label: string }[] };

export interface DataColumn<Row> {
  /** Unique id; also the default property read from the row. */
  id: string;
  header: string;
  /** Value used for sorting / filtering. Defaults to `row[id]`. */
  accessor?: (row: Row) => unknown;
  /** Custom cell rendering. Defaults to the accessor value. */
  cell?: (row: Row) => ReactNode;
  /** Filter control in the filter row. Defaults to 'text'. */
  filter?: ColumnFilter;
  /** Text matched by a 'text' filter when it differs from the accessor (e.g. a label). */
  filterText?: (row: Row) => string;
  sortable?: boolean;
  align?: 'start' | 'center' | 'end';
  /** CSS width, e.g. 120 or '12rem'. */
  width?: number | string;
  /** Hidden by default; can be shown from the "Colonnes" menu. */
  defaultHidden?: boolean;
  /** Always visible; not listed in the "Colonnes" menu. */
  alwaysVisible?: boolean;
  /** Text written to the CSV export (defaults to the accessor value). */
  exportValue?: (row: Row) => string;
}

export interface RowActions {
  /** Shown as labelled icon buttons in the Actions column (keep to 1–2). */
  primary?: MenuAction[];
  /** Shown in the "⋯" menu. */
  menu?: MenuAction[];
}

export interface ServerPagination {
  rowCount: number;
  pagination: PaginationState;
  onPaginationChange: (p: PaginationState) => void;
}

interface DataTableProps<Row> {
  columns: DataColumn<Row>[];
  rows: Row[];
  getRowId: (row: Row) => string | number;
  /** Accessible name of the table. */
  caption: string;
  loading?: boolean;
  /** Key used to remember column visibility in this browser. */
  tableId?: string;
  rowActions?: (row: Row) => RowActions;
  /** Right-click menu (defaults to the row's actions). */
  contextMenu?: (row: Row) => MenuAction[];
  onRowDoubleClick?: (row: Row) => void;
  /** Toolbar content shown on the left (e.g. tabs, add buttons). */
  toolbar?: ReactNode;
  emptyTitle?: string;
  emptyHint?: string;
  pageSizeOptions?: number[];
  initialPageSize?: number;
  /** When set, pagination is done by the server and `rows` is the current page. */
  server?: ServerPagination;
  showFilters?: boolean;
  /** Adds an "Exporter (CSV)" button exporting the filtered rows and visible columns. */
  exportFileName?: string;
  /**
   * Enables row selection (checkboxes, "select all matching", action bar).
   * Receives the selected rows — always a subset of the filtered rows — and
   * a callback that clears the selection.
   */
  bulkActions?: (selected: Row[], clearSelection: () => void) => MenuAction[];
}

type Filters = Record<string, string>;

const EMPTY_ROWS: never[] = [];
const collator = new Intl.Collator('fr', { numeric: true, sensitivity: 'base' });

const toText = (v: unknown): string => {
  if (v == null) return '';
  if (v instanceof Date) return dayjs(v).format('DD/MM/YYYY');
  return String(v);
};

const compareValues = (a: unknown, b: unknown): number => {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  const da = typeof a === 'string' && /^\d{4}-\d{2}-\d{2}/.test(a) ? Date.parse(a) : NaN;
  const db = typeof b === 'string' && /^\d{4}-\d{2}-\d{2}/.test(b) ? Date.parse(b) : NaN;
  if (!Number.isNaN(da) && !Number.isNaN(db)) return da - db;
  return collator.compare(toText(a), toText(b));
};

export const sanitizeCsvCell = (value: string) =>
  /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
const csvCell = (raw: string) => {
  const value = sanitizeCsvCell(raw);
  return /[";\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
};

/** Semicolon-separated CSV with a BOM so Excel (French locale) opens accents and columns correctly. */
function downloadCsv(fileName: string, header: string[], lines: string[][]) {
  const body = [header, ...lines].map((cells) => cells.map(csvCell).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['\ufeff' + body], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function readVisibility(tableId: string | undefined): ColumnVisibilityState | null {
  if (!tableId) return null;
  try {
    const raw = window.localStorage.getItem(`omat.table.${tableId}.columns`);
    return raw ? (JSON.parse(raw) as ColumnVisibilityState) : null;
  } catch {
    return null;
  }
}

function writeVisibility(tableId: string | undefined, value: ColumnVisibilityState) {
  if (!tableId) return;
  try {
    window.localStorage.setItem(`omat.table.${tableId}.columns`, JSON.stringify(value));
  } catch {
    /* storage unavailable: visibility simply isn't remembered */
  }
}

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
  columnVisibilityFeature,
});

/**
 * Dense, bordered data table (institutional style) with a per-column filter row,
 * sortable headers, a visible Actions column, a column chooser and pagination.
 */
export function DataTable<Row extends RowData>({
  columns,
  rows,
  getRowId,
  caption,
  loading,
  tableId,
  rowActions,
  contextMenu,
  onRowDoubleClick,
  toolbar,
  emptyTitle,
  emptyHint,
  pageSizeOptions = [10, 25, 50, 100],
  initialPageSize = 25,
  server,
  showFilters = true,
  exportFileName,
  bulkActions,
}: DataTableProps<Row>) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<Filters>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [clientPagination, setClientPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });
  const [visibility, setVisibility] = useState<ColumnVisibilityState>(() => {
    const saved = readVisibility(tableId);
    if (saved) return saved;
    return Object.fromEntries(columns.filter((c) => c.defaultHidden).map((c) => [c.id, false]));
  });

  useEffect(() => writeVisibility(tableId, visibility), [tableId, visibility]);

  const selectable = !!bulkActions;
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set());
  // Last row toggled without Shift: the start of a Shift+click range.
  const anchor = useRef<string | null>(null);
  const idOf = (row: Row) => String(getRowId(row));
  const clearSelection = () => {
    setSelected(new Set());
    anchor.current = null;
  };

  const valueOf = (col: DataColumn<Row>, row: Row): unknown =>
    col.accessor ? col.accessor(row) : (row as Record<string, unknown>)[col.id];

  // Filter-row matching (client side, before sorting and paging).
  const filteredRows = useMemo(() => {
    const active = Object.entries(filters).filter(([, v]) => v !== '');
    if (active.length === 0) return rows;
    return rows.filter((row) =>
      active.every(([id, value]) => {
        const col = columns.find((c) => c.id === id);
        if (!col) return true;
        const raw = valueOf(col, row);
        if (col.filter === 'date') {
          return raw ? dayjs(raw as string).format('YYYY-MM-DD') === value : false;
        }
        if (typeof col.filter === 'object') return toText(raw) === value;
        const text = col.filterText ? col.filterText(row) : toText(raw);
        return text.toLocaleLowerCase('fr').includes(value.toLocaleLowerCase('fr'));
      }),
    );
    // valueOf only depends on columns
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, filters, columns]);

  // Reset to the first page when the filtered set changes size.
  useEffect(() => {
    setClientPagination((p) => (p.pageIndex === 0 ? p : { ...p, pageIndex: 0 }));
  }, [filters]);

  // A new filter means a new question: never carry hidden rows in the selection.
  useEffect(() => clearSelection(), [filters]);

  // When the rows change (refetch, page-level tabs), drop ids that are gone
  // but keep the rest, e.g. rows a bulk action skipped.
  useEffect(() => {
    setSelected((prev) => {
      if (prev.size === 0) return prev;
      const present = new Set(rows.map(idOf));
      const next = new Set([...prev].filter((id) => present.has(id)));
      return next.size === prev.size ? prev : next;
    });
    // idOf only depends on getRowId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const tableColumns = useMemo(() => {
    const helper = createColumnHelper<typeof features, Row>();
    return helper.columns(
      columns.map((col) =>
        helper.accessor((row: Row) => valueOf(col, row), {
          id: col.id,
          header: col.header,
          enableSorting: col.sortable !== false,
          enableHiding: !col.alwaysVisible,
          sortFn: (a, b, id) => compareValues(a.getValue(id), b.getValue(id)),
        }),
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns]);

  const pagination = server ? server.pagination : clientPagination;
  const table = useTable({
    features,
    columns: tableColumns,
    data: filteredRows.length ? filteredRows : (EMPTY_ROWS as Row[]),
    getRowId: (row: Row) => String(getRowId(row)),
    state: { sorting, pagination, columnVisibility: visibility },
    onSortingChange: (u) => setSorting((prev) => (typeof u === 'function' ? u(prev) : u)),
    onPaginationChange: (u) => {
      const next = typeof u === 'function' ? u(pagination) : u;
      if (server) server.onPaginationChange(next);
      else setClientPagination(next);
    },
    onColumnVisibilityChange: (u) => setVisibility((prev) => (typeof u === 'function' ? u(prev) : u)),
    manualPagination: !!server,
    rowCount: server?.rowCount,
  });

  const colById = useMemo(() => new Map(columns.map((c) => [c.id, c])), [columns]);
  const visibleColumns = table.getVisibleLeafColumns();
  const pageRows = table.getRowModel().rows;
  const total = server ? server.rowCount : filteredRows.length;
  const from = total === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
  const to = Math.min(total, (pagination.pageIndex + 1) * pagination.pageSize);
  const hasFilters = Object.values(filters).some(Boolean);
  const colSpan = visibleColumns.length + (rowActions ? 1 : 0) + (selectable ? 1 : 0);

  // Selection is always read through the filtered rows, so an action can
  // never reach a row the user can't currently see.
  const selectedRows = selectable ? filteredRows.filter((r) => selected.has(idOf(r))) : [];
  const pageIds = pageRows.map((r) => r.id);
  const pageAllSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const pageSomeSelected = pageIds.some((id) => selected.has(id));
  const allMatchingSelected = filteredRows.length > 0 && selectedRows.length === filteredRows.length;
  const morePagesThanThis = filteredRows.length > pageIds.length;

  const setMany = (ids: string[], on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (on) next.add(id);
        else next.delete(id);
      }
      return next;
    });

  const toggleRow = (id: string, e: MouseEvent) => {
    const on = !selected.has(id);
    if (e.shiftKey && anchor.current && anchor.current !== id) {
      // Range over the current sort order, across pages.
      const ordered = table.getSortedRowModel().rows.map((r) => r.id);
      const a = ordered.indexOf(anchor.current);
      const b = ordered.indexOf(id);
      if (a !== -1 && b !== -1) {
        setMany(ordered.slice(Math.min(a, b), Math.max(a, b) + 1), on);
        return;
      }
    }
    anchor.current = id;
    setMany([id], on);
  };

  const togglePage = () => setMany(pageIds, !pageAllSelected);
  const selectAllMatching = () => setSelected(new Set(filteredRows.map(idOf)));
  const visibleBulkActions = selectedRows.length ? (bulkActions?.(selectedRows, clearSelection) ?? []).filter((a) => !a.hidden) : [];
  const alignClass = (a?: DataColumn<Row>['align']) =>
    a === 'center' ? 'text-center' : a === 'end' ? 'text-end' : 'text-start';

  // CSV of the given rows with the visible columns.
  const exportRows = (list: Row[], fileName: string) => {
    const cols = visibleColumns.map((c) => colById.get(c.id)!);
    downloadCsv(
      fileName,
      cols.map((c) => c.header),
      list.map((row) => cols.map((c) => (c.exportValue ? c.exportValue(row) : toText(valueOf(c, row))))),
    );
  };
  const exportCsv = () => exportFileName && exportRows(filteredRows, exportFileName);
  const exportSelection = () => exportRows(selectedRows, `${exportFileName ?? tableId ?? 'export'}-selection`);

  const chooser: MenuAction[] = columns
    .filter((c) => !c.alwaysVisible)
    .map((c) => ({
      label: `${visibility[c.id] === false ? '☐' : '☑'}  ${c.header}`,
      onSelect: () => setVisibility((v) => ({ ...v, [c.id]: v[c.id] === false })),
    }));

  return (
    <div className="omat-ui flex flex-col rounded-sm border border-border bg-surface">
      {/* Toolbar (only when it has something to show) */}
      {(toolbar || hasFilters || chooser.length > 0 || exportFileName) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">{toolbar}</div>
          <div className="flex items-center gap-2">
            {hasFilters && (
              <Button size="sm" variant="ghost" onClick={() => setFilters({})}>
                <FilterX />
                {t('table.clearFilters')}
              </Button>
            )}
            {exportFileName && (
            <Button size="sm" variant="secondary" onClick={exportCsv} disabled={filteredRows.length === 0}>
              <FileSpreadsheet />
              Exporter (CSV)
            </Button>
          )}
          {chooser.length > 0 && (
              <DropdownMenu
                actions={chooser}
                trigger={
                  <Button size="sm" variant="secondary">
                    <Columns3 />
                    {t('table.columns')}
                  </Button>
                }
              />
            )}
          </div>
        </div>
      )}

      {selectable && selectedRows.length > 0 && (
        <div
          role="region"
          aria-label={t('table.bulkActions')}
          className="sticky top-0 z-10 flex flex-col gap-1 border-b border-border bg-primary-soft px-3 py-2 text-sm"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span aria-live="polite" className="font-semibold text-fg">
              {t('table.selected', { count: selectedRows.length })}
            </span>
            {visibleBulkActions.map((a) => (
              <Button
                key={a.label}
                size="sm"
                variant={a.tone === 'danger' ? 'danger' : 'secondary'}
                disabled={a.disabled}
                onClick={a.onSelect}
              >
                {a.icon}
                {a.label}
              </Button>
            ))}
            <Button size="sm" variant="secondary" onClick={exportSelection}>
              <FileSpreadsheet />
              {t('table.exportSelection')}
            </Button>
            <Button size="sm" variant="ghost" onClick={clearSelection}>
              {t('table.clearSelection')}
            </Button>
          </div>
          {morePagesThanThis && pageAllSelected && (
            <p className="text-fg-muted">
              {allMatchingSelected ? (
                <>
                  {t(hasFilters ? 'table.allMatchingSelected' : 'table.allSelected', { total: filteredRows.length })}{' '}
                  <Button size="sm" variant="link" onClick={clearSelection}>
                    {t('table.clearSelection')}
                  </Button>
                </>
              ) : (
                <>
                  {t('table.pageSelected', { count: pageIds.length })}{' '}
                  <Button size="sm" variant="link" onClick={selectAllMatching}>
                    {t(hasFilters ? 'table.selectAllMatching' : 'table.selectAll', { total: filteredRows.length })}
                  </Button>
                </>
              )}
            </p>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="bg-surface-header">
              {selectable && (
                <th scope="col" className="w-px border border-border px-2 py-2 text-center">
                  <Checkbox
                    aria-label={t('table.selectPage')}
                    checked={pageAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = pageSomeSelected && !pageAllSelected;
                    }}
                    onChange={togglePage}
                    disabled={pageIds.length === 0}
                  />
                </th>
              )}
              {visibleColumns.map((column) => {
                const col = colById.get(column.id)!;
                const sorted = column.getIsSorted();
                return (
                  <th
                    key={column.id}
                    scope="col"
                    style={{ width: col.width }}
                    aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}
                    className={cn(
                      'border border-border px-2 py-2 font-semibold whitespace-nowrap text-fg',
                      alignClass(col.align),
                    )}
                  >
                    {column.getCanSort() ? (
                      <button
                        type="button"
                        onClick={column.getToggleSortingHandler()}
                        className="inline-flex cursor-pointer items-center gap-1 hover:text-primary"
                      >
                        {col.header}
                        {sorted === 'asc' ? (
                          <ArrowUp className="size-3.5" aria-hidden="true" />
                        ) : sorted === 'desc' ? (
                          <ArrowDown className="size-3.5" aria-hidden="true" />
                        ) : (
                          <ArrowUpDown className="size-3.5 text-fg-subtle" aria-hidden="true" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
              {rowActions && (
                <th
                  scope="col"
                  className="w-px border border-border px-2 py-2 text-center font-semibold whitespace-nowrap"
                >
                  {t('table.actions')}
                </th>
              )}
            </tr>
            {showFilters && (
              <tr className="bg-surface-muted">
                {selectable && <td className="border border-border p-1" />}
                {visibleColumns.map((column) => {
                  const col = colById.get(column.id)!;
                  const label = t('table.filter', { column: col.header });
                  const value = filters[col.id] ?? '';
                  const set = (v: string) => setFilters((f) => ({ ...f, [col.id]: v }));
                  return (
                    <td key={column.id} className="border border-border p-1">
                      {col.filter === false ? null : col.filter === 'date' ? (
                        <Input
                          type="date"
                          aria-label={label}
                          value={value}
                          onChange={(e) => set(e.target.value)}
                          className="h-7 px-1.5 text-xs"
                        />
                      ) : typeof col.filter === 'object' ? (
                        <Select
                          aria-label={label}
                          value={value}
                          onChange={(e) => set(e.target.value)}
                          className="h-7 px-1.5 text-xs"
                        >
                          <option value="">{t('table.all')}</option>
                          {col.filter.options.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <Input
                          type="search"
                          aria-label={label}
                          value={value}
                          onChange={(e) => set(e.target.value)}
                          className="h-7 px-1.5 text-xs"
                        />
                      )}
                    </td>
                  );
                })}
                {rowActions && <td className="border border-border p-1" />}
              </tr>
            )}
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }, (_, i) => (
                <tr key={`sk-${i}`}>
                  {Array.from({ length: colSpan }, (__, j) => (
                    <td key={j} className="border border-border px-2 py-2">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="border border-border">
                  <EmptyState title={emptyTitle ?? t('table.empty')} hint={emptyHint ?? t('table.emptyHint')} />
                </td>
              </tr>
            ) : (
              pageRows.map((row) => {
                const original = row.original as Row;
                const actions = rowActions?.(original);
                const menuActions = contextMenu
                  ? contextMenu(original)
                  : [...(actions?.primary ?? []), ...(actions?.menu ?? [])];
                const isSelected = selectable && selected.has(row.id);
                return (
                  <ContextMenu key={row.id} actions={menuActions}>
                    <tr
                      aria-selected={selectable ? isSelected : undefined}
                      onDoubleClick={onRowDoubleClick ? () => onRowDoubleClick(original) : undefined}
                      className={cn(
                        'even:bg-surface-muted hover:bg-primary-soft',
                        isSelected && 'bg-primary-soft even:bg-primary-soft',
                        onRowDoubleClick && 'cursor-pointer',
                      )}
                    >
                      {selectable && (
                        <td className="border border-border px-2 py-1.5 text-center align-middle">
                          <Checkbox
                            aria-label={t('table.selectRow', {
                              label: toText(valueOf(columns[0], original)) || row.id,
                            })}
                            checked={isSelected}
                            // Toggled from onClick so Shift+click can select a range.
                            onClick={(e) => toggleRow(row.id, e)}
                            onChange={() => {}}
                            onDoubleClick={(e) => e.stopPropagation()}
                          />
                        </td>
                      )}
                      {visibleColumns.map((column) => {
                        const col = colById.get(column.id)!;
                        return (
                          <td
                            key={column.id}
                            className={cn('border border-border px-2 py-1.5 align-middle', alignClass(col.align))}
                          >
                            {col.cell ? col.cell(original) : toText(valueOf(col, original)) || '—'}
                          </td>
                        );
                      })}
                      {actions && (
                        <td className="border border-border px-1 py-1">
                          <div className="flex items-center justify-center gap-0.5">
                            {actions.primary
                              ?.filter((a) => !a.hidden)
                              .map((a) => (
                                <IconButton
                                  key={a.label}
                                  label={a.label}
                                  icon={a.icon}
                                  disabled={a.disabled}
                                  onClick={a.onSelect}
                                  className={a.tone === 'danger' ? 'text-danger' : 'text-primary'}
                                />
                              ))}
                            {actions.menu && actions.menu.some((a) => !a.hidden) && (
                              <DropdownMenu
                                actions={actions.menu}
                                trigger={<IconButton label={t('actions.more')} icon={<Ellipsis />} />}
                              />
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  </ContextMenu>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-3 py-2 text-sm text-fg-muted">
        <label className="flex items-center gap-2">
          {t('table.rowsPerPage')}
          <Select
            value={pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="h-7 w-20 px-1.5 text-xs"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </label>
        <div className="flex items-center gap-2">
          <span aria-live="polite" className="tabular-nums">
            {total === 0 ? t('table.rangeEmpty') : t('table.range', { from, to, total })}
          </span>
          <IconButton
            label={t('table.previous')}
            icon={<ChevronLeft className="rtl:rotate-180" />}
            variant="secondary"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          />
          <IconButton
            label={t('table.next')}
            icon={<ChevronRight className="rtl:rotate-180" />}
            variant="secondary"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          />
        </div>
      </div>
    </div>
  );
}
