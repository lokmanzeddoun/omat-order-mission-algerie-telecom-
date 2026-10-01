import { describe, expect, it } from 'vitest';
import { higherCategories, stateOf } from './grade-assignments';

describe('higherCategories', () => {
  it('offers only categories strictly above the agent', () => {
    expect(higherCategories('EXECUTION_MAITRISE')).toEqual(['CADRE', 'CADRE_SUPERIEUR']);
    expect(higherCategories('CADRE')).toEqual(['CADRE_SUPERIEUR']);
    expect(higherCategories('CADRE_SUPERIEUR')).toEqual([]);
    expect(higherCategories(undefined)).toEqual([]);
  });
});

describe('stateOf', () => {
  const period = { startDate: '2026-03-01T00:00:00.000Z', endDate: '2026-03-31T00:00:00.000Z', endedAt: null };

  it.each([
    ['2026-02-28', 'upcoming'],
    ['2026-03-01', 'active'],
    ['2026-03-31', 'active'],
    ['2026-04-01', 'expired'],
  ])('on %s the period is %s', (today, state) => {
    expect(stateOf(period, today)).toBe(state);
  });

  it('is ended once ended early, whatever the date', () => {
    expect(stateOf({ ...period, endedAt: '2026-03-10T09:00:00.000Z' }, '2026-03-05')).toBe('ended');
  });
});
