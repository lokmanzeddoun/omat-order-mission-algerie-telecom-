import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataTable, type DataColumn } from 'components/ui';
import { useBulkDelete } from './useBulkDelete';

const { post, toast } = vi.hoisted(() => ({
  post: vi.fn(),
  toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
}));
vi.mock('helpers/http', () => ({ default: { post } }));
vi.mock('components/ui/toaster', () => ({ toast }));

interface Row {
  id: number;
  nom: string;
}
const rows: Row[] = [1, 2, 3].map((id) => ({ id, nom: `Agent ${id}` }));
const columns: DataColumn<Row>[] = [{ id: 'nom', header: 'Nom' }];

function Harness({ onDone }: { onDone: () => void }) {
  const bulk = useBulkDelete<Row>({
    entity: 'users',
    idOf: (r) => r.id,
    labelOf: (r) => r.nom,
    noun: 'user',
    onDone,
  });
  return (
    <>
      <DataTable caption="Agents" columns={columns} rows={rows} getRowId={(r) => r.id} bulkActions={bulk.actions} />
      {bulk.dialog}
    </>
  );
}

const openDialog = async () => {
  await userEvent.click(screen.getByRole('checkbox', { name: 'Sélectionner les lignes de cette page' }));
  await userEvent.click(screen.getByRole('button', { name: 'Supprimer définitivement (3)' }));
};
const confirmButton = () => screen.getByRole('button', { name: 'Supprimer définitivement' });

describe('useBulkDelete', () => {
  beforeEach(() => vi.clearAllMocks());

  it('stays disabled until the exact count is typed', async () => {
    render(<Harness onDone={vi.fn()} />);
    await openDialog();
    expect(screen.getByRole('alertdialog')).toHaveTextContent('irréversible');
    expect(confirmButton()).toBeDisabled();

    const input = screen.getByLabelText('Saisissez 3 pour confirmer');
    await userEvent.type(input, '2');
    expect(confirmButton()).toBeDisabled();
    await userEvent.clear(input);
    await userEvent.type(input, '3');
    expect(confirmButton()).toBeEnabled();
  });

  it('deletes, reports skipped rows, and offers no undo', async () => {
    post.mockResolvedValue({ data: { done: [1, 2], skipped: [{ id: 3, reason: 'has_missions' }] } });
    const onDone = vi.fn();
    render(<Harness onDone={onDone} />);
    await openDialog();
    await userEvent.type(screen.getByLabelText('Saisissez 3 pour confirmer'), '3');
    await userEvent.click(confirmButton());

    expect(post).toHaveBeenCalledWith('/archive/users/bulk-delete', { ids: [1, 2, 3] });
    expect(toast.success).toHaveBeenCalledWith('2 utilisateurs supprimés définitivement', { action: undefined });
    expect(toast.warning).toHaveBeenCalledWith('1 utilisateur ignoré', {
      description: '1 : a des ordres de mission',
    });
    expect(onDone).toHaveBeenCalled();
  });
});
