import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataTable, type DataColumn } from './data-table';

interface Agent {
  id: number;
  nom: string;
  role: string;
  since: string;
}

const rows: Agent[] = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  nom: `Agent ${String(i + 1).padStart(2, '0')}`,
  role: i % 3 === 0 ? 'ADMIN' : 'USER',
  since: `2024-01-${String((i % 28) + 1).padStart(2, '0')}`,
}));

const columns: DataColumn<Agent>[] = [
  { id: 'nom', header: 'Nom' },
  { id: 'role', header: 'Rôle', filter: { type: 'select', options: [{ value: 'ADMIN', label: 'Admin' }, { value: 'USER', label: 'Utilisateur' }] } },
  { id: 'since', header: 'Depuis', filter: 'date', defaultHidden: true },
];

const bodyRows = () => within(screen.getAllByRole('rowgroup')[1]).getAllByRole('row');

describe('DataTable', () => {
  it('paginates client-side and reports the range', async () => {
    render(<DataTable caption="Agents" columns={columns} rows={rows} getRowId={(r) => r.id} initialPageSize={10} />);
    expect(bodyRows()).toHaveLength(10);
    expect(screen.getByText('1–10 sur 30')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Page suivante' }));
    expect(screen.getByText('11–20 sur 30')).toBeInTheDocument();
  });

  it('filters by text and by select from the filter row', async () => {
    render(<DataTable caption="Agents" columns={columns} rows={rows} getRowId={(r) => r.id} />);
    await userEvent.type(screen.getByRole('searchbox', { name: 'Filtrer Nom' }), 'agent 0');
    expect(bodyRows()).toHaveLength(9);
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Filtrer Rôle' }), 'ADMIN');
    expect(bodyRows().every((r) => within(r).queryByText('ADMIN'))).toBe(true);
    await userEvent.click(screen.getByRole('button', { name: /effacer les filtres/i }));
    expect(screen.getByText('1–25 sur 30')).toBeInTheDocument();
  });

  it('sorts when a header is activated and exposes aria-sort', async () => {
    render(<DataTable caption="Agents" columns={columns} rows={rows} getRowId={(r) => r.id} />);
    const header = screen.getByRole('columnheader', { name: /nom/i });
    await userEvent.click(within(header).getByRole('button'));
    expect(header).toHaveAttribute('aria-sort', 'ascending');
    await userEvent.click(within(header).getByRole('button'));
    expect(header).toHaveAttribute('aria-sort', 'descending');
    expect(within(bodyRows()[0]).getByText('Agent 30')).toBeInTheDocument();
  });

  it('hides defaultHidden columns', () => {
    render(<DataTable caption="Agents" columns={columns} rows={rows} getRowId={(r) => r.id} />);
    expect(screen.queryByRole('columnheader', { name: /depuis/i })).not.toBeInTheDocument();
  });

  it('renders labelled primary actions and handles double-click', async () => {
    const onDownload = vi.fn();
    const onOpen = vi.fn();
    render(
      <DataTable
        caption="Agents"
        columns={columns}
        rows={rows.slice(0, 2)}
        getRowId={(r) => r.id}
        onRowDoubleClick={onOpen}
        rowActions={(r) => ({ primary: [{ label: 'Télécharger', onSelect: () => onDownload(r.id) }] })}
      />,
    );
    await userEvent.click(screen.getAllByRole('button', { name: 'Télécharger' })[1]);
    expect(onDownload).toHaveBeenCalledWith(2);
    await userEvent.dblClick(bodyRows()[0]);
    expect(onOpen).toHaveBeenCalledWith(rows[0]);
  });

  it('shows an empty state', () => {
    render(<DataTable caption="Agents" columns={columns} rows={[]} getRowId={(r) => r.id} emptyTitle="Aucun agent" />);
    expect(screen.getByText('Aucun agent')).toBeInTheDocument();
    expect(screen.getByText('0 résultat')).toBeInTheDocument();
  });
});
