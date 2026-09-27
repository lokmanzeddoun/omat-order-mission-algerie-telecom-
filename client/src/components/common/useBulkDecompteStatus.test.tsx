import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataTable, type DataColumn } from 'components/ui';
import { useBulkDecompteStatus } from './useBulkDecompteStatus';

const { patch, toast } = vi.hoisted(() => ({
  patch: vi.fn(),
  toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
}));
vi.mock('helpers/http', () => ({ default: { patch } }));
vi.mock('components/ui/toaster', () => ({ toast }));

interface Row {
  n: number;
  status: string;
}
const rows: Row[] = [
  { n: 1, status: 'PENDING' },
  { n: 2, status: 'ACCEPTED' },
  { n: 3, status: 'PENDING' },
];
const columns: DataColumn<Row>[] = [{ id: 'n', header: 'N°', accessor: (r) => `D${r.n}` }];

function Harness() {
  const bulk = useBulkDecompteStatus<Row>({
    idOf: (r) => r.n,
    labelOf: (r) => `N° ${r.n}`,
    isPending: (r) => r.status === 'PENDING',
    onDone: vi.fn(),
  });
  return (
    <>
      <DataTable caption="Décomptes" columns={columns} rows={rows} getRowId={(r) => r.n} bulkActions={bulk.actions} />
      {bulk.dialog}
    </>
  );
}

const selectAll = () =>
  userEvent.click(screen.getByRole('checkbox', { name: 'Sélectionner les lignes de cette page' }));

describe('useBulkDecompteStatus', () => {
  beforeEach(() => vi.clearAllMocks());

  it('counts and sends only the pending décomptes', async () => {
    patch.mockResolvedValue({ data: { done: [1, 3], skipped: [] } });
    render(<Harness />);
    await selectAll();
    await userEvent.click(screen.getByRole('button', { name: 'Accepter (2)' }));
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Accepter 2 décomptes ?');
    await userEvent.click(screen.getByRole('button', { name: 'Accepter' }));

    expect(patch).toHaveBeenCalledWith('/decompte/bulk/accept', { ids: [1, 3] });
    expect(toast.success).toHaveBeenCalledWith('2 décomptes acceptés', { action: undefined });
  });

  it('offers nothing when no selected décompte is pending', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Sélectionner D2' }));
    expect(screen.queryByRole('button', { name: /Accepter/ })).not.toBeInTheDocument();
  });

  it('requires a reason to reject and sends it to every row', async () => {
    patch.mockResolvedValue({ data: { done: [1], skipped: [{ id: 3, reason: 'not_pending' }] } });
    render(<Harness />);
    await selectAll();
    await userEvent.click(screen.getByRole('button', { name: 'Rejeter (2)' }));
    const confirm = screen.getByRole('button', { name: 'Rejeter' });
    expect(confirm).toBeDisabled();

    await userEvent.type(screen.getByLabelText(/Motif du rejet/), '  Pièces manquantes ');
    await userEvent.click(confirm);

    expect(patch).toHaveBeenCalledWith('/decompte/bulk/reject', { ids: [1, 3], message: 'Pièces manquantes' });
    expect(toast.warning).toHaveBeenCalledWith('1 décompte ignoré', { description: '1 : pas en attente' });
  });
});
