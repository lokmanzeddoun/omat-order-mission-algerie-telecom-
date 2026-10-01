import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BaremTable from './index';

const { get, patch, toast, handleError } = vi.hoisted(() => ({
  get: vi.fn(),
  patch: vi.fn(),
  toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
  handleError: vi.fn(),
}));
vi.mock('helpers/http', () => ({ default: { get, patch } }));
vi.mock('components/ui/toaster', () => ({ toast }));
vi.mock('components/hooks/useErrorHandler', () => ({ useApiHandler: () => ({ handleError }) }));

const rows = [
  {
    id: 1,
    libell: 'EXECUTION_MAITRISE',
    repas_nord: 800,
    hebergement_nord: 1200,
    repas_sud: 1000,
    hebergement_sud: 1500,
    montant_km: 8,
  },
  {
    id: 2,
    libell: 'CADRE',
    repas_nord: 1200,
    hebergement_nord: 1800,
    repas_sud: 1500,
    hebergement_sud: 2200,
    montant_km: 8,
  },
];

const renderAs = (role: string) =>
  render(
    <Provider store={configureStore({ reducer: { auth: () => ({ user: { matricule: 1, role } }) } })}>
      <MemoryRouter>
        <BaremTable />
      </MemoryRouter>
    </Provider>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  get.mockResolvedValue({ data: rows });
  patch.mockImplementation((_url: string, body: object) => Promise.resolve({ data: { ...rows[0], ...body } }));
});

describe('BaremTable', () => {
  it('is read-only for an admin', async () => {
    renderAs('ADMIN');
    await screen.findByText('Exécution / Maîtrise');
    expect(screen.queryByRole('button', { name: /Modifier/ })).not.toBeInTheDocument();
  });

  it('lets a super admin edit a field in place and saves it with PATCH', async () => {
    renderAs('SUPER_ADMIN');
    const cell = (await screen.findAllByRole('button', { name: /Modifier .*Repas.*Nord/ }))[0];
    await userEvent.click(cell);
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveFocus();
    await userEvent.clear(input);
    await userEvent.type(input, '900{Enter}');
    await waitFor(() => expect(patch).toHaveBeenCalledWith('/barem/1', { repas_nord: 900 }));
    expect((await screen.findAllByRole('button', { name: /Modifier .*Repas.*Nord/ }))[0]).toHaveTextContent('900');
  });

  it('edits the kilometric allowance', async () => {
    renderAs('SUPER_ADMIN');
    await userEvent.click((await screen.findAllByRole('button', { name: /Modifier .*kilométrique/ }))[1]);
    const input = screen.getByRole('spinbutton');
    await userEvent.clear(input);
    await userEvent.type(input, '9.5');
    await userEvent.tab(); // blur saves
    await waitFor(() => expect(patch).toHaveBeenCalledWith('/barem/2', { montant_km: 9.5 }));
  });

  it('cancels with Escape and does not save unchanged or invalid values', async () => {
    renderAs('SUPER_ADMIN');
    const open = async () =>
      userEvent.click((await screen.findAllByRole('button', { name: /Modifier .*Repas.*Nord/ }))[0]);
    await open();
    await userEvent.type(screen.getByRole('spinbutton'), '5{Escape}');
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    await open();
    await userEvent.type(screen.getByRole('spinbutton'), '{Enter}'); // unchanged
    await open();
    await userEvent.clear(screen.getByRole('spinbutton'));
    await userEvent.type(screen.getByRole('spinbutton'), '-3{Enter}');
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(patch).not.toHaveBeenCalled();
  });

  it('reports a failed save and keeps the old value', async () => {
    patch.mockRejectedValueOnce(new Error('boom'));
    renderAs('SUPER_ADMIN');
    await userEvent.click((await screen.findAllByRole('button', { name: /Modifier .*Repas.*Nord/ }))[0]);
    await userEvent.clear(screen.getByRole('spinbutton'));
    await userEvent.type(screen.getByRole('spinbutton'), '900{Enter}');
    await waitFor(() => expect(handleError).toHaveBeenCalled());
    const cell = (await screen.findAllByRole('button', { name: /Modifier .*Repas.*Nord/ }))[0];
    expect(within(cell).getByText(/800/)).toBeInTheDocument();
  });
});
