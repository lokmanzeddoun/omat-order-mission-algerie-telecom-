import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Direction } from 'constants/direction';
import ValidateMissionForm from './ValidateMissionForm';
import type { IMission } from './orderReducer';

// Leaves on the 10th at 08:00, back on the 11th at 15:00: 3 meals, 1 night.
const mission = (direction: Direction, transport = 'SERVICE_CAR'): IMission => ({
  n_mission: 7,
  date_sortie: '2026-03-10T08:00:00',
  date_retour: '2026-03-11T15:00:00',
  motif: 'Audit',
  destination: 'Ouargla',
  transport,
  direction,
});

const setup = (direction: Direction, transport?: string) => {
  const onSubmit = vi.fn();
  render(<ValidateMissionForm open mission={mission(direction, transport)} onClose={() => {}} onSubmit={onSubmit} />);
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
    await submit();

    expect(await screen.findByText('La répartition doit totaliser 3 repas.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  describe('transport inputs depend on the means of transport', () => {
    const rights = async (transport: string) => {
      const onSubmit = setup(Direction.sud, transport);
      const split = screen.getByRole('group', { name: 'Répartition' });
      await fill(split, 'Repas sans prise en charge', '3');
      await fill(split, 'Nuitées sans prise en charge', '1');
      return onSubmit;
    };
    const distance = () => screen.queryByLabelText(/Distance parcourue/);
    const cost = () => screen.queryByLabelText(/Frais de transport engagés/);

    it.each(['SERVICE_CAR', 'TRANSPORT_ENTREPRISE'])('%s needs no transport input', async (transport) => {
      const onSubmit = await rights(transport);
      expect(distance()).not.toBeInTheDocument();
      expect(cost()).not.toBeInTheDocument();
      await submit();
      const figures = onSubmit.mock.calls[0][0];
      expect(figures.distance_km).toBeUndefined();
      expect(figures.transport_cost).toBeUndefined();
    });

    it('PERSONAL_CAR asks for the distance only', async () => {
      const onSubmit = await rights('PERSONAL_CAR');
      expect(cost()).not.toBeInTheDocument();
      await submit();
      expect(await screen.findByText('La distance parcourue est obligatoire.')).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
      await userEvent.type(distance()!, '120');
      await submit();
      const figures = onSubmit.mock.calls[0][0];
      expect(figures.distance_km).toBe(120);
      expect(figures.transport_cost).toBeUndefined();
    });

    it('TRANSPORT_EMPLOYEE asks for the transport fees only', async () => {
      const onSubmit = await rights('TRANSPORT_EMPLOYEE');
      expect(distance()).not.toBeInTheDocument();
      await submit();
      expect(await screen.findByText('Les frais de transport engagés sont obligatoires.')).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
      await userEvent.type(cost()!, '2500');
      await submit();
      const figures = onSubmit.mock.calls[0][0];
      expect(figures.transport_cost).toBe(2500);
      expect(figures.distance_km).toBeUndefined();
    });
  });
});
