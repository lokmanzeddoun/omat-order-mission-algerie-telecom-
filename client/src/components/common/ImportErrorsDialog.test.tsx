import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ImportErrorsDialog } from './ImportErrorsDialog';
import { uploadSpreadsheet, type ImportRowError } from './importFile';

const { post } = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock('helpers/http', () => ({ default: { post } }));
vi.mock('components/alert/alert.reducer', () => ({ setAlert: (payload: unknown) => ({ payload }) }));

const errors: ImportRowError[] = [
  { row: 1, field: 'Grade', message: "Colonne « Grade » manquante dans l'en-tête" },
  { row: 3, field: 'Email', value: 'nope', message: 'Adresse email invalide' },
  { row: 4, field: 'Password', message: 'Mot de passe obligatoire pour un nouvel utilisateur' },
];

describe('ImportErrorsDialog', () => {
  it('lists one table row per problem', () => {
    render(<ImportErrorsDialog errors={errors} onClose={() => {}} />);
    expect(screen.getByRole('dialog', { name: 'Import refusé — 3 erreurs' })).toBeInTheDocument();
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(3);
    expect(within(rows[0]).getByText('En-tête')).toBeInTheDocument();
    expect(within(rows[1]).getAllByRole('cell').map((c) => c.textContent)).toEqual([
      '3',
      'Email',
      'nope',
      'Adresse email invalide',
    ]);
    expect(within(rows[2]).getByText('—')).toBeInTheDocument();
  });

  it('closes from the footer button', async () => {
    const onClose = vi.fn();
    render(<ImportErrorsDialog errors={errors} onClose={onClose} />);
    await userEvent.click(screen.getAllByRole('button', { name: 'Fermer' }).at(-1)!);
    expect(onClose).toHaveBeenCalled();
  });

  it('renders nothing when there are no errors', () => {
    render(<ImportErrorsDialog errors={null} onClose={() => {}} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('uploadSpreadsheet', () => {
  const dispatch = vi.fn();
  const file = new File(['x'], 'u.xlsx');
  const rejection = (status: number, data: unknown) =>
    new AxiosError('fail', 'ERR_BAD_REQUEST', undefined, undefined, {
      status,
      data,
      statusText: '',
      headers: {},
      config: { headers: new AxiosHeaders() },
    });

  beforeEach(() => {
    post.mockReset();
    dispatch.mockReset();
  });

  it('returns the counts and shows a success toast', async () => {
    post.mockResolvedValue({ data: { created: 2, updated: 1 } });
    await expect(uploadSpreadsheet('/users/upload', file, dispatch)).resolves.toEqual({
      ok: true,
      created: 2,
      updated: 1,
    });
    expect(dispatch.mock.calls[0][0].payload.msg).toBe('Import terminé : 2 créé(s), 1 mis à jour');
  });

  it('returns the per-row problems without a toast', async () => {
    post.mockRejectedValue(rejection(400, { message: 'Import invalide', errors }));
    await expect(uploadSpreadsheet('/users/upload', file, dispatch)).resolves.toEqual({ ok: false, errors });
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('falls back to an error toast for other failures', async () => {
    post.mockRejectedValue(rejection(400, { message: 'Le fichier est vide.' }));
    await expect(uploadSpreadsheet('/users/upload', file, dispatch)).resolves.toBeNull();
    expect(dispatch.mock.calls[0][0].payload.msg).toBe('Le fichier est vide.');
  });
});
