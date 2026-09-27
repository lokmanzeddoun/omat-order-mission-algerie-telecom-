import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Direction } from 'constants/direction';
import ValidateMissionForm from './ValidateMissionForm';
import type { IMission } from './orderReducer';

// Leaves on the 10th at 08:00, back on the 11th at 15:00: 3 meals, 1 night.
const mission = (direction: Direction): IMission => ({
  n_mission: 7,
  date_sortie: '2026-03-10T08:00:00',
  date_retour: '2026-03-11T15:00:00',
  motif: 'Audit',
  destination: 'Ouargla',
  transport: 'SERVICE_CAR',
  direction,
});

const setup = (direction: Direction) => {
  const onSubmit = vi.fn();
  render(<ValidateMissionForm open mission={mission(direction)} onClose={() => {}} onSubmit={onSubmit} />);
  return onSubmit;
};

const fill = async (scope: HTMLElement, label: string, value: string) => {
  await userEvent.clear(within(scope).getByLabelText(label));
  await userEvent.type(within(scope).getByLabelText(label), value);
};

const submit = () => userEvent.click(screen.getByRole('button', { name: 'Valider et créer le décompte' }));

describe('ValidateMissionForm', () => {
  it('records a single-zone ordre in its own zone', async () => {
    const onSubmit = setup(Direction.sud);
    expect(screen.queryByRole('group', { name: /Nord/ })).not.toBeInTheDocument();
    const split = screen.getByRole('group', { name: 'Répartition' });
    await fill(split, 'Repas sans prise en charge', '3');
    await fill(split, 'Nuitées sans prise en charge', '1');
    await userEvent.type(screen.getByLabelText(/Distance parcourue/), '0');
    await submit();

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        repas_sans_pec_sud: 3,
        hebergement_sans_pec_sud: 1,
        repas_sans_pec_nord: 0,
        hebergement_sans_pec_nord: 0,
      }),
    );
  });

  it('splits a Nord et Sud ordre across both zones', async () => {
    const onSubmit = setup(Direction.mixte);
    const nord = screen.getByRole('group', { name: 'Répartition — Nord' });
    const sud = screen.getByRole('group', { name: 'Répartition — Sud' });
    await fill(nord, 'Repas sans prise en charge', '2');
    await fill(nord, 'Nuitées sans prise en charge', '1');
    await fill(sud, 'Repas sans prise en charge', '1');
    await userEvent.type(screen.getByLabelText(/Distance parcourue/), '0');
    await submit();

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        repas_sans_pec_nord: 2,
        hebergement_sans_pec_nord: 1,
        repas_sans_pec_sud: 1,
        hebergement_sans_pec_sud: 0,
      }),
    );
  });

  it('checks both zones together against the entitlements', async () => {
    const onSubmit = setup(Direction.mixte);
    const nord = screen.getByRole('group', { name: 'Répartition — Nord' });
    const sud = screen.getByRole('group', { name: 'Répartition — Sud' });
    await fill(nord, 'Repas sans prise en charge', '2');
    await fill(sud, 'Repas sans prise en charge', '2');
    await fill(sud, 'Nuitées sans prise en charge', '1');
    await userEvent.type(screen.getByLabelText(/Distance parcourue/), '0');
    await submit();

    expect(await screen.findByText('La répartition doit totaliser 3 repas.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
