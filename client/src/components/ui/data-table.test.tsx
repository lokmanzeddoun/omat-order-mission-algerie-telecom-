import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

  describe('selection', () => {
    const archive = vi.fn();
    const renderSelectable = (data: Agent[] = rows, pageSize = 10) =>
      render(
        <DataTable
          caption="Agents"
          columns={columns}
          rows={data}
          getRowId={(r) => r.id}
          initialPageSize={pageSize}
          bulkActions={(selected, clear) => [
            { label: 'Archiver', onSelect: () => archive(selected.map((r) => r.id), clear) },
          ]}
        />,
      );
    const rowBox = (name: string) => screen.getByRole('checkbox', { name: `Sélectionner ${name}` });
    const pageBox = () => screen.getByRole('checkbox', { name: 'Sélectionner les lignes de cette page' });
    const archived = () => archive.mock.lastCall?.[0] as number[];

    beforeEach(() => archive.mockClear());

    it('has no checkboxes unless bulk actions are given', () => {
      render(<DataTable caption="Agents" columns={columns} rows={rows} getRowId={(r) => r.id} />);
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    it('selects individual rows and passes them to the bulk action', async () => {
      renderSelectable();
      await userEvent.click(rowBox('Agent 02'));
      await userEvent.click(rowBox('Agent 05'));
      expect(screen.getByText('2 lignes sélectionnées')).toBeInTheDocument();
      expect(bodyRows()[1]).toHaveAttribute('aria-selected', 'true');
      await userEvent.click(screen.getByRole('button', { name: 'Archiver' }));
      expect(archived()).toEqual([2, 5]);
    });

    it('header checkbox selects the current page and shows a partial state', async () => {
      renderSelectable();
      await userEvent.click(rowBox('Agent 01'));
      expect(pageBox()).toHaveProperty('indeterminate', true);
      await userEvent.click(pageBox());
      expect(pageBox()).toBeChecked();
      expect(screen.getByText('10 lignes sélectionnées')).toBeInTheDocument();
      await userEvent.click(pageBox());
      expect(screen.queryByRole('region', { name: 'Actions sur la sélection' })).not.toBeInTheDocument();
    });

    it('offers to extend a full-page selection to every row', async () => {
      renderSelectable();
      await userEvent.click(pageBox());
      expect(screen.getByText(/Les 10 lignes de cette page sont sélectionnées/)).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Sélectionner les 30 lignes' }));
      expect(screen.getByText('30 lignes sélectionnées')).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Archiver' }));
      expect(archived()).toHaveLength(30);
    });

    it('"select all" only takes the rows matching the filters', async () => {
      renderSelectable(rows, 5);
      await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Filtrer Rôle' }), 'ADMIN');
      await userEvent.click(pageBox());
      await userEvent.click(
        screen.getByRole('button', { name: 'Sélectionner les 10 lignes correspondant aux filtres' }),
      );
      await userEvent.click(screen.getByRole('button', { name: 'Archiver' }));
      const admins = rows.filter((r) => r.role === 'ADMIN').map((r) => r.id);
      expect(archived().sort((a, b) => a - b)).toEqual(admins);
    });

    it('clears the selection when a filter changes', async () => {
      renderSelectable();
      await userEvent.click(rowBox('Agent 01'));
      await userEvent.type(screen.getByRole('searchbox', { name: 'Filtrer Nom' }), 'agent');
      expect(screen.queryByText(/sélectionnée/)).not.toBeInTheDocument();
    });

    it('keeps the selection across pages', async () => {
      renderSelectable();
      await userEvent.click(rowBox('Agent 01'));
      await userEvent.click(screen.getByRole('button', { name: 'Page suivante' }));
      await userEvent.click(rowBox('Agent 11'));
      expect(screen.getByText('2 lignes sélectionnées')).toBeInTheDocument();
    });

    it('selects a range with Shift+click', async () => {
      renderSelectable();
      await userEvent.click(rowBox('Agent 03'));
      const user = userEvent.setup();
      await user.keyboard('{Shift>}');
      await user.click(rowBox('Agent 07'));
      await user.keyboard('{/Shift}');
      await userEvent.click(screen.getByRole('button', { name: 'Archiver' }));
      expect(archived()).toEqual([3, 4, 5, 6, 7]);
    });

    it('drops rows that disappear but keeps the others', async () => {
      const { rerender } = renderSelectable();
      await userEvent.click(rowBox('Agent 01'));
      await userEvent.click(rowBox('Agent 02'));
      const props = {
        caption: 'Agents',
        columns,
        getRowId: (r: Agent) => r.id,
        initialPageSize: 10,
        bulkActions: (selected: Agent[]) => [{ label: 'Archiver', onSelect: () => archive(selected.map((r) => r.id)) }],
      };
      rerender(<DataTable {...props} rows={rows.filter((r) => r.id !== 1)} />);
      expect(screen.getByText('1 ligne sélectionnée')).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Archiver' }));
      expect(archived()).toEqual([2]);
    });

    it('exports only the selected rows, with the visible columns', async () => {
      // jsdom has no object URLs: capture the Blob instead of downloading it.
      let blob: Blob | undefined;
      URL.createObjectURL = vi.fn((b: Blob) => {
        blob = b;
        return 'blob:test';
      });
      URL.revokeObjectURL = vi.fn();
      const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

      renderSelectable();
      await userEvent.click(rowBox('Agent 02'));
      await userEvent.click(rowBox('Agent 04'));
      await userEvent.click(screen.getByRole('button', { name: /Exporter la sélection/ }));

      // UTF-8 BOM for Excel, then the header (hidden "Depuis" left out) and the two rows.
      const bytes = new Uint8Array(await blob!.arrayBuffer());
      expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
      expect(await blob!.text()).toBe('Nom;Rôle\r\nAgent 02;USER\r\nAgent 04;ADMIN');
      expect(click).toHaveBeenCalledTimes(1);
      click.mockRestore();
    });

    it('lets the action clear the selection', async () => {
      archive.mockImplementation((_ids: number[], clear: () => void) => clear());
      renderSelectable();
      await userEvent.click(rowBox('Agent 01'));
      await userEvent.click(screen.getByRole('button', { name: 'Archiver' }));
      expect(rowBox('Agent 01')).not.toBeChecked();
      archive.mockReset();
    });
  });
});
