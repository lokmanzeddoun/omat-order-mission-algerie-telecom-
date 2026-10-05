import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it, vi } from 'vitest';
import MissionFormDialog from './MissionFormDialog';

const store = configureStore({ reducer: { auth: () => ({ user: { matricule: 1, nom: 'A', prenom: 'B' } }) } });

describe('MissionFormDialog destination', () => {
  it('suggests destinations in a list inside the modal and submits the joined value', { timeout: 20000 }, async () => {
    const onSubmit = vi.fn();
    render(
      <Provider store={store}>
        <MissionFormDialog open mode="create" onClose={() => {}} onSubmit={onSubmit} />
      </Provider>,
    );
    await userEvent.type(screen.getByLabelText(/^Motif de la mission/), 'Audit');
    await userEvent.type(screen.getByLabelText(/^Date de départ/), '10032026');
    await userEvent.type(screen.getByLabelText(/^Heure de départ/), '0800');
    await userEvent.selectOptions(screen.getByLabelText(/^Moyen de transport/), 'SERVICE_CAR');

    await userEvent.type(screen.getByLabelText(/^Destination/), 'tl');
    const options = await screen.findAllByRole('option');
    expect(options.length).toBeGreaterThan(1);
    await userEvent.click(screen.getByRole('option', { name: 'Tlemcen' }));

    await userEvent.click(screen.getByRole('button', { name: 'Créer l’ordre de mission' }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ destination: 'Tlemcen', date_sortie: '2026-03-10' }),
    );
  });

  it('requires a destination from the list', async () => {
    render(
      <Provider store={store}>
        <MissionFormDialog open mode="create" onClose={() => {}} onSubmit={vi.fn()} />
      </Provider>,
    );
    await userEvent.type(screen.getByLabelText(/^Destination/), 'Atlantis');
    await userEvent.click(screen.getByRole('button', { name: 'Créer l’ordre de mission' }));
    expect(await screen.findByText('Choisissez au moins une destination dans la liste.')).toBeInTheDocument();
  });
});

describe('MissionFormDialog hours', () => {
  const fill = async (sortie: string, retour?: string) => {
    render(
      <Provider store={store}>
        <MissionFormDialog open mode="create" onClose={() => {}} onSubmit={onSubmit} />
      </Provider>,
    );
    await userEvent.type(screen.getByLabelText(/^Date de départ/), '10032026');
    if (sortie) await userEvent.type(screen.getByLabelText(/^Heure de départ/), sortie);
    await userEvent.type(screen.getByLabelText(/^Date de retour/), '10032026');
    if (retour) await userEvent.type(screen.getByLabelText(/^Heure de retour/), retour);
    await userEvent.click(screen.getByRole('button', { name: 'Créer l’ordre de mission' }));
  };
  const onSubmit = vi.fn();

  it('asks for the return hour instead of assuming 00:00 on a same-day return', async () => {
    await fill('0800');
    expect(await screen.findByText('Indiquez l’heure de retour.')).toBeInTheDocument();
    expect(screen.queryByText('Le retour doit être postérieur au départ.')).not.toBeInTheDocument();
  });

  it('asks for the departure hour instead of assuming 00:00', async () => {
    await fill('', '1700');
    expect(await screen.findByText('L’heure de départ est obligatoire.')).toBeInTheDocument();
    expect(screen.queryByText('Le retour doit être postérieur au départ.')).not.toBeInTheDocument();
  });

  it('accepts a same-day return later than the departure', async () => {
    await fill('0800', '1700');
    expect(screen.queryByText('Le retour doit être postérieur au départ.')).not.toBeInTheDocument();
  });

  it('refuses a same-day return before the departure', async () => {
    await fill('1700', '0800');
    expect(await screen.findByText('Le retour doit être postérieur au départ.')).toBeInTheDocument();
  });
});
