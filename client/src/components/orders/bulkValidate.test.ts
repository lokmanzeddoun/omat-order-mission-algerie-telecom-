import { describe, expect, it } from 'vitest';
import { Direction } from 'constants/direction';
import { common, groupByEntitlement } from './bulkValidate';
import type { IMission } from './orderReducer';

const m = (n: number, date_sortie: string, overrides: Partial<IMission> = {}): IMission => ({
  n_mission: n,
  date_sortie,
  motif: '',
  destination: '',
  transport: 'SERVICE_CAR',
  direction: Direction.nord,
  ...overrides,
});

const schedule = { heure_sortie: '08:00', date_retour: '2026-03-11', heure_retour: '15:00' };

describe('groupByEntitlement', () => {
  it('finds no mismatch when every ordre is entitled to the same figures', () => {
    const { rows, mismatch } = groupByEntitlement([m(1, '2026-03-10T08:00:00'), m(2, '2026-03-10T09:00:00')], schedule);
    expect(mismatch).toBe(false);
    expect(rows.map((r) => [r.meals, r.nights, r.odd])).toEqual([
      [3, 1, false],
      [3, 1, false],
    ]);
  });

  it('flags the ordres outside the largest group', () => {
    const { rows, mismatch } = groupByEntitlement(
      [m(1, '2026-03-09T08:00:00'), m(2, '2026-03-10T08:00:00'), m(3, '2026-03-10T08:00:00')],
      schedule,
    );
    expect(mismatch).toBe(true);
    expect(rows.map((r) => r.odd)).toEqual([true, false, false]);
  });

  it('treats another means of transport as a mismatch', () => {
    const { mismatch } = groupByEntitlement(
      [m(1, '2026-03-10T08:00:00'), m(2, '2026-03-10T08:00:00', { transport: 'PERSONAL_CAR' })],
      schedule,
    );
    expect(mismatch).toBe(true);
  });
});

describe('common', () => {
  it('keeps a shared value and drops a differing one', () => {
    expect(common(['08:00', '08:00'])).toBe('08:00');
    expect(common(['08:00', '09:00'])).toBe('');
  });
});
