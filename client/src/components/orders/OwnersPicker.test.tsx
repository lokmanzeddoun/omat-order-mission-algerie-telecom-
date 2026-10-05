import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import http from 'helpers/http';
import MissionFormDialog from './MissionFormDialog';
import OwnersPicker from './OwnersPicker';

vi.mock('helpers/http', () => ({ default: { get: vi.fn() } }));

const me = { matricule: 1, nom: 'Admin', prenom: 'Alice', serviceId: 'DT' };
const users = [
  { matricule: 1, nom: 'Admin', prenom: 'Alice', serviceId: 'DT', status: 'ACTIVE', structure: { name: 'Direction Technique' } },
  { matricule: 2, nom: 'Benali', prenom: 'Karim', serviceId: 'DT', status: 'ACTIVE', structure: { name: 'Direction Technique' } },
  { matricule: 3, nom: 'Cherif', prenom: 'Sara', serviceId: 'DT', status: 'ACTIVE', structure: { name: 'Direction Technique' } },
  { matricule: 4, nom: 'Dahmani', prenom: 'Omar', serviceId: 'RH', status: 'ACTIVE', structure: { name: 'Ressources Humaines' } },
  { matricule: 5, nom: 'Inactif', prenom: 'Zed', serviceId: 'DT', status: 'INACTIVE', structure: { name: 'Direction Technique' } },
];

beforeEach(() => {
  vi.mocked(http.get).mockResolvedValue({ data: users } as never);
});

function Harness({ initial = [1], errors }: { initial?: number[]; errors?: Record<number, string> }) {
  const [value, setValue] = useState<number[]>(initial);
  return <OwnersPicker me={me} value={value} onChange={setValue} errors={errors} />;
}

const checkbox = (name: RegExp | string) => screen.findByRole('checkbox', { name });

describe('OwnersPicker', () => {
  it('lists the scoped users, hides inactive ones and toggles a selection', async () => {
    render(<Harness />);
    expect(await checkbox(/Karim Benali/)).not.toBeChecked();
    expect(screen.queryByRole('checkbox', { name: /Zed Inactif/ })).not.toBeInTheDocument();
    expect(screen.getByText('Employés sélectionnés : 1')).toBeInTheDocument();

    await userEvent.click(await checkbox(/Karim Benali/));
    expect(await checkbox(/Karim Benali/)).toBeChecked();
    expect(screen.getByText('Employés sélectionnés : 2')).toBeInTheDocument();

    await userEvent.click(await checkbox(/Karim Benali/));
    expect(screen.getByText('Employés sélectionnés : 1')).toBeInTheDocument();
  });

  it('searches by name, matricule or structure, ignoring accents', async () => {
    render(<Harness />);
    await checkbox(/Karim Benali/);
    await userEvent.type(screen.getByRole('textbox', { name: /Rechercher/ }), 'ressources');
    expect(screen.getByRole('checkbox', { name: /Omar Dahmani/ })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: /Karim Benali/ })).not.toBeInTheDocument();
  });

  it('selects everyone in my structure only, and clears the selection', async () => {
    render(<Harness initial={[4]} />);
    await checkbox(/Karim Benali/);
    await waitFor(() => expect(screen.getByRole('button', { name: /Sélectionner toute ma structure/ })).toBeEnabled());
    await userEvent.click(screen.getByRole('button', { name: /Sélectionner toute ma structure/ }));

    expect(await checkbox(/Karim Benali/)).toBeChecked();
    expect(await checkbox(/Sara Cherif/)).toBeChecked();
    expect(await checkbox(/Vous-même/)).toBeChecked();
    expect(await checkbox(/Omar Dahmani/)).toBeChecked(); // kept: the shortcut adds, never removes
    expect(screen.queryByRole('checkbox', { name: /Zed Inactif/ })).not.toBeInTheDocument();
    expect(screen.getByText('Employés sélectionnés : 4')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Tout désélectionner' }));
    expect(screen.getByText('Employés sélectionnés : 0')).toBeInTheDocument();
  });

  it('also selects the users of my sub-structures, down to grandchildren', async () => {
    vi.mocked(http.get).mockResolvedValue({
      data: [
        users[0],
        { matricule: 6, nom: 'Fils', prenom: 'Nadia', serviceId: 'DT1', status: 'ACTIVE', structure: { name: 'DT / Réseau', parentCode: 'DT' } },
        {
          matricule: 7,
          nom: 'Petit',
          prenom: 'Yacine',
          serviceId: 'DT11',
          status: 'ACTIVE',
          structure: { name: 'DT / Réseau / Fibre', parentCode: 'DT1', parent: { parentCode: 'DT' } },
        },
        users[3],
      ],
    } as never);
    render(<Harness initial={[]} />);
    await checkbox(/Yacine Petit/);
    await userEvent.click(screen.getByRole('button', { name: /Sélectionner toute ma structure/ }));

    expect(await checkbox(/Nadia Fils/)).toBeChecked();
    expect(await checkbox(/Yacine Petit/)).toBeChecked();
    expect(await checkbox(/Omar Dahmani/)).not.toBeChecked();
    expect(screen.getByText('Employés sélectionnés : 3')).toBeInTheDocument();
  });

  it('shows the server error under the matching user', async () => {
    render(<Harness errors={{ 4: 'Cet employé n’appartient pas à votre structure.' }} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Cet employé n’appartient pas à votre structure.');
  });
});

describe('MissionFormDialog multi-user creation', () => {
  const admin = { matricule: 1, nom: 'Admin', prenom: 'Alice', role: 'ADMIN' };
  const store = (user: object) => configureStore({ reducer: { auth: () => ({ user }) } });

  const fill = async () => {
    await userEvent.type(screen.getByLabelText(/^Motif de la mission/), 'Audit');
    await userEvent.type(screen.getByLabelText(/^Date de départ/), '10032026');
    await userEvent.type(screen.getByLabelText(/^Heure de départ/), '0800');
    await userEvent.selectOptions(screen.getByLabelText(/^Moyen de transport/), 'SERVICE_CAR');
    await userEvent.type(screen.getByLabelText(/^Destination/), 'tl');
    await userEvent.click(await screen.findByRole('option', { name: 'Tlemcen' }));
  };

  const open = (user: object, handlers: { onSubmit?: () => void; onSubmitBatch?: (...a: never[]) => Promise<unknown> }) =>
    render(
      <Provider store={store(user)}>
        <MissionFormDialog
          open
          mode="create"
          onClose={() => {}}
          onSubmit={handlers.onSubmit ?? vi.fn()}
          onSubmitBatch={handlers.onSubmitBatch as never}
        />
      </Provider>,
    );

  it('submits one batch for several users, then shows per-user errors', { timeout: 30000 }, async () => {
    const onSubmit = vi.fn();
    const onSubmitBatch = vi.fn().mockResolvedValue({ 4: 'Cet employé n’appartient pas à votre structure.' });
    open(admin, { onSubmit, onSubmitBatch });
    await fill();
    await userEvent.click(await screen.findByRole('checkbox', { name: /Karim Benali/ }));
    await userEvent.click(await screen.findByRole('checkbox', { name: /Omar Dahmani/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Créer l’ordre de mission' }));

    await waitFor(() => expect(onSubmitBatch).toHaveBeenCalledTimes(1));
    expect(onSubmit).not.toHaveBeenCalled();
    const [mission, matricules] = onSubmitBatch.mock.calls[0];
    expect(matricules.sort()).toEqual([1, 2, 4]);
    expect(mission).toEqual(expect.objectContaining({ destination: 'Tlemcen', date_sortie: '2026-03-10', motif: 'Audit' }));
    expect(await screen.findByText('Cet employé n’appartient pas à votre structure.')).toBeInTheDocument();
  });

  it('keeps the single flow when only one person is selected', { timeout: 30000 }, async () => {
    const onSubmit = vi.fn();
    const onSubmitBatch = vi.fn();
    open(admin, { onSubmit, onSubmitBatch });
    await fill();
    await userEvent.click(await screen.findByRole('checkbox', { name: /Vous-même/ })); // deselect me
    await userEvent.click(await screen.findByRole('checkbox', { name: /Karim Benali/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Créer l’ordre de mission' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmitBatch).not.toHaveBeenCalled();
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ userMatricule: 2 }));
  });

  it('requires at least one person', { timeout: 30000 }, async () => {
    const onSubmit = vi.fn();
    open(admin, { onSubmit, onSubmitBatch: vi.fn() });
    await fill();
    await userEvent.click(await screen.findByRole('checkbox', { name: /Vous-même/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Créer l’ordre de mission' }));
    expect(await screen.findByText('Sélectionnez au moins un employé.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not offer the picker to a regular user', () => {
    open({ matricule: 7, nom: 'U', prenom: 'U', role: 'USER' }, { onSubmitBatch: vi.fn() });
    expect(screen.queryByRole('button', { name: /Sélectionner toute ma structure/ })).not.toBeInTheDocument();
  });
});
