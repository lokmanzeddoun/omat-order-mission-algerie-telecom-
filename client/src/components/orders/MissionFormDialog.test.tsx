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
