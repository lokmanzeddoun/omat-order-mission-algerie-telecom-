import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataTable, type DataColumn } from 'components/ui';
import { useBulkArchive } from './useBulkArchive';

const { patch, toast } = vi.hoisted(() => ({
  patch: vi.fn(),
  toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
}));
vi.mock('helpers/http', () => ({ default: { patch } }));
vi.mock('components/ui/toaster', () => ({ toast }));

interface Row {
  id: number;
  nom: string;
}
const rows: Row[] = Array.from({ length: 8 }, (_, i) => ({ id: i + 1, nom: `Agent ${i + 1}` }));
const columns: DataColumn<Row>[] = [{ id: 'nom', header: 'Nom' }];

function Harness({ mode = 'archive', onDone }: { mode?: 'archive' | 'restore'; onDone: () => void }) {
  const bulk = useBulkArchive<Row>({
    entity: 'users',
    mode,
    idOf: (r) => r.id,
    labelOf: (r) => r.nom,
    noun: ['utilisateur', 'utilisateurs'],
    onDone,
  });
  return (
    <>
      <DataTable caption="Agents" columns={columns} rows={rows} getRowId={(r) => r.id} bulkActions={bulk.actions} />
      {bulk.dialog}
    </>
  );
}

const selectAll = async () => {
  await userEvent.click(screen.getByRole('checkbox', { name: 'Sélectionner les lignes de cette page' }));
};

describe('useBulkArchive', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('confirms with the count and the first names, then archives', async () => {
    patch.mockResolvedValue({ data: { done: [1, 2, 3, 4, 5, 6, 7, 8], skipped: [] } });
    const onDone = vi.fn();
    render(<Harness onDone={onDone} />);
    await selectAll();
    await userEvent.click(screen.getByRole('button', { name: 'Archiver (8)' }));

    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveTextContent('Archiver 8 utilisateurs ?');
    expect(dialog).toHaveTextContent('Agent 5');
    expect(dialog).not.toHaveTextContent('Agent 6');
    expect(dialog).toHaveTextContent('… et 3 autres');

    await userEvent.click(screen.getByRole('button', { name: 'Archiver' }));
    expect(patch).toHaveBeenCalledWith('/archive/users/bulk', { ids: [1, 2, 3, 4, 5, 6, 7, 8] });
    expect(toast.success).toHaveBeenCalledWith('8 utilisateurs archivés', expect.anything());
    expect(onDone).toHaveBeenCalled();
  });

  it('undo restores exactly the rows that were archived', async () => {
    patch.mockResolvedValue({ data: { done: [1, 2], skipped: [] } });
    render(<Harness onDone={vi.fn()} />);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Sélectionner Agent 1' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Sélectionner Agent 2' }));
    await userEvent.click(screen.getByRole('button', { name: 'Archiver (2)' }));
    await userEvent.click(screen.getByRole('button', { name: 'Archiver' }));

    const { action } = toast.success.mock.calls[0][1];
    patch.mockResolvedValue({ data: { done: [1, 2], skipped: [] } });
    await action.onClick();
    expect(patch).toHaveBeenLastCalledWith('/archive/users/bulk/restore', { ids: [1, 2] });
  });

  it('reports skipped rows with their reasons', async () => {
    patch.mockResolvedValue({
      data: { done: [2], skipped: [{ id: 1, reason: 'self' }] },
    });
    render(<Harness onDone={vi.fn()} />);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Sélectionner Agent 1' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Sélectionner Agent 2' }));
    await userEvent.click(screen.getByRole('button', { name: 'Archiver (2)' }));
    await userEvent.click(screen.getByRole('button', { name: 'Archiver' }));

    expect(toast.success).toHaveBeenCalledWith('1 utilisateur archivé', expect.anything());
    expect(toast.warning).toHaveBeenCalledWith('1 utilisateur ignoré', {
      description: '1 : votre propre compte',
    });
  });

  it('restores from the Archive page', async () => {
    patch.mockResolvedValue({ data: { done: [3], skipped: [] } });
    render(<Harness mode="restore" onDone={vi.fn()} />);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Sélectionner Agent 3' }));
    await userEvent.click(screen.getByRole('button', { name: 'Désarchiver (1)' }));
    await userEvent.click(screen.getByRole('button', { name: 'Désarchiver' }));
    expect(patch).toHaveBeenCalledWith('/archive/users/bulk/restore', { ids: [3] });
  });

  it('shows the server error and still refreshes', async () => {
    patch.mockRejectedValue(new Error('Accès refusé'));
    const onDone = vi.fn();
    render(<Harness onDone={onDone} />);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Sélectionner Agent 1' }));
    await userEvent.click(screen.getByRole('button', { name: 'Archiver (1)' }));
    await userEvent.click(screen.getByRole('button', { name: 'Archiver' }));
    expect(toast.error).toHaveBeenCalled();
    expect(onDone).toHaveBeenCalled();
  });
});
