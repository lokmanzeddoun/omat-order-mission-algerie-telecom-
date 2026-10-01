import {
  algiersDay,
  checkNewPeriod,
  effectiveEnd,
  lastAllowedDay,
  PeriodLike,
  resolveEffectiveCategory,
  toDate,
} from './grade-assignment.rules';

let nextId = 1;
const period = (
  start: string,
  end: string,
  over: Partial<PeriodLike> = {},
): PeriodLike => ({
  id: nextId++,
  kind: 'REMPLACANT',
  targetCategory: 'CADRE',
  startDate: toDate(start),
  endDate: toDate(end),
  endedAt: null,
  ...over,
});

const next = (
  start: string,
  end: string,
  over: Partial<Parameters<typeof checkNewPeriod>[2]> = {},
) =>
  ({
    kind: 'REMPLACANT',
    targetCategory: 'CADRE',
    start,
    end,
    ...over,
  }) as Parameters<typeof checkNewPeriod>[2];

describe('lastAllowedDay', () => {
  it.each([
    ['REMPLACANT', '2026-01-01', '2026-04-30'],
    ['REMPLACANT', '2026-01-31', '2026-05-30'],
    ['INTERIM', '2026-01-01', '2026-12-31'],
    ['INTERIM', '2026-03-15', '2027-03-14'],
  ] as const)('%s from %s ends at most on %s', (kind, start, last) => {
    expect(lastAllowedDay(kind, start)).toBe(last);
  });
});

describe('checkNewPeriod', () => {
  describe('caps', () => {
    it('allows a Remplaçant of exactly 4 months and refuses one day more', () => {
      expect(
        checkNewPeriod(
          'EXECUTION_MAITRISE',
          [],
          next('2026-01-01', '2026-04-30'),
        ),
      ).toBeNull();
      expect(
        checkNewPeriod(
          'EXECUTION_MAITRISE',
          [],
          next('2026-01-01', '2026-05-01'),
        ),
      ).toMatchObject({ code: 'CAP', maxEnd: '2026-04-30', months: 4 });
    });

    it('allows an Interim of exactly 12 months and refuses one day more', () => {
      const i = { kind: 'INTERIM' } as const;
      expect(
        checkNewPeriod(
          'CADRE',
          [],
          next('2026-01-01', '2026-12-31', {
            ...i,
            targetCategory: 'CADRE_SUPERIEUR',
          }),
        ),
      ).toBeNull();
      expect(
        checkNewPeriod(
          'CADRE',
          [],
          next('2026-01-01', '2027-01-01', {
            ...i,
            targetCategory: 'CADRE_SUPERIEUR',
          }),
        ),
      ).toMatchObject({ code: 'CAP', months: 12 });
    });

    it('counts a renewal that continues the previous period against the cap', () => {
      const first = period('2026-01-01', '2026-03-31');
      // 1 Jan to 31 May is 5 months in a row: refused, though each part is short.
      expect(
        checkNewPeriod(
          'CADRE',
          [first],
          next('2026-04-01', '2026-05-31', {
            targetCategory: 'CADRE_SUPERIEUR',
          }),
        ),
      ).toMatchObject({
        code: 'CAP',
        chainStart: '2026-01-01',
        maxEnd: '2026-04-30',
      });
      expect(
        checkNewPeriod(
          'CADRE',
          [first],
          next('2026-04-01', '2026-04-30', {
            targetCategory: 'CADRE_SUPERIEUR',
          }),
        ),
      ).toBeNull();
    });

    it('follows a chain of several renewals back to its start', () => {
      const a = period('2026-01-01', '2026-02-28');
      const b = period('2026-03-01', '2026-03-31');
      expect(
        checkNewPeriod(
          'CADRE',
          [a, b],
          next('2026-04-01', '2026-05-01', {
            targetCategory: 'CADRE_SUPERIEUR',
          }),
        ),
      ).toMatchObject({ code: 'CAP', chainStart: '2026-01-01' });
    });

    it('starts a fresh count after a gap', () => {
      const first = period('2026-01-01', '2026-03-31');
      expect(
        checkNewPeriod(
          'CADRE',
          [first],
          next('2026-04-02', '2026-07-31', {
            targetCategory: 'CADRE_SUPERIEUR',
          }),
        ),
      ).toBeNull();
    });

    it('does not chain periods of a different kind', () => {
      const interim = period('2026-01-01', '2026-06-30', {
        kind: 'INTERIM',
        targetCategory: 'CADRE_SUPERIEUR',
      });
      expect(
        checkNewPeriod(
          'CADRE',
          [interim],
          next('2026-07-01', '2026-10-31', {
            targetCategory: 'CADRE_SUPERIEUR',
          }),
        ),
      ).toBeNull();
    });

    it('measures a chain from the day a previous period was ended early', () => {
      const ended = period('2026-01-01', '2026-03-31', {
        endedAt: new Date('2026-02-10T09:00:00Z'),
      });
      // Effective end is 10 Feb, so 11 Feb continues it and the cap still starts on 1 Jan.
      expect(
        checkNewPeriod(
          'CADRE',
          [ended],
          next('2026-02-11', '2026-05-01', {
            targetCategory: 'CADRE_SUPERIEUR',
          }),
        ),
      ).toMatchObject({ code: 'CAP', chainStart: '2026-01-01' });
    });

    it('rejects an end before the start', () => {
      expect(
        checkNewPeriod(
          'EXECUTION_MAITRISE',
          [],
          next('2026-02-01', '2026-01-31'),
        ),
      ).toEqual({ code: 'ORDER' });
    });
  });

  describe('overlap', () => {
    const existing = period('2026-03-01', '2026-03-31');

    it.each([
      ['inside', '2026-03-10', '2026-03-20'],
      ['straddling the start', '2026-02-20', '2026-03-01'],
      ['straddling the end', '2026-03-31', '2026-04-10'],
      ['around it', '2026-02-01', '2026-04-30'],
    ])('refuses a period %s', (_label, start, end) => {
      expect(
        checkNewPeriod('EXECUTION_MAITRISE', [existing], next(start, end)),
      ).toEqual({ code: 'OVERLAP', with: existing.id });
    });

    it('allows a period that only touches on the next or previous day', () => {
      expect(
        checkNewPeriod(
          'EXECUTION_MAITRISE',
          [existing],
          next('2026-04-01', '2026-04-05'),
        ),
      ).toBeNull();
      expect(
        checkNewPeriod(
          'EXECUTION_MAITRISE',
          [existing],
          next('2026-02-20', '2026-02-28'),
        ),
      ).toBeNull();
    });

    it('frees the days after an early end', () => {
      const ended = period('2026-03-01', '2026-03-31', {
        endedAt: new Date('2026-03-10T09:00:00Z'),
      });
      expect(
        checkNewPeriod(
          'EXECUTION_MAITRISE',
          [ended],
          next('2026-03-11', '2026-03-31'),
        ),
      ).toBeNull();
      expect(
        checkNewPeriod(
          'EXECUTION_MAITRISE',
          [ended],
          next('2026-03-10', '2026-03-31'),
        ),
      ).toMatchObject({ code: 'OVERLAP' });
    });

    it('ignores a period ended before it started', () => {
      const cancelled = period('2026-03-01', '2026-03-31', {
        endedAt: new Date('2026-02-01T09:00:00Z'),
      });
      expect(
        checkNewPeriod(
          'EXECUTION_MAITRISE',
          [cancelled],
          next('2026-03-05', '2026-03-10'),
        ),
      ).toBeNull();
    });
  });

  describe('target category', () => {
    it.each([
      ['EXECUTION_MAITRISE', 'CADRE'],
      ['EXECUTION_MAITRISE', 'CADRE_SUPERIEUR'],
      ['CADRE', 'CADRE_SUPERIEUR'],
    ] as const)('accepts %s -> %s', (own, target) => {
      expect(
        checkNewPeriod(
          own,
          [],
          next('2026-01-01', '2026-01-31', { targetCategory: target }),
        ),
      ).toBeNull();
    });

    it.each([
      ['EXECUTION_MAITRISE', 'EXECUTION_MAITRISE'],
      ['CADRE', 'CADRE'],
      ['CADRE', 'EXECUTION_MAITRISE'],
      ['CADRE_SUPERIEUR', 'CADRE_SUPERIEUR'],
      ['CADRE_SUPERIEUR', 'CADRE'],
    ] as const)('refuses %s -> %s', (own, target) => {
      expect(
        checkNewPeriod(
          own,
          [],
          next('2026-01-01', '2026-01-31', { targetCategory: target }),
        ),
      ).toEqual({ code: 'NOT_HIGHER' });
    });
  });
});

describe('resolveEffectiveCategory', () => {
  const interim = period('2026-03-01', '2026-03-31', {
    kind: 'INTERIM',
    targetCategory: 'CADRE_SUPERIEUR',
  });
  // Algiers is UTC+1: 08:00 UTC is 09:00 there.
  const at = (day: string, time = '08:00:00Z') => new Date(`${day}T${time}`);

  it('uses the period when the start date is inside it', () => {
    expect(
      resolveEffectiveCategory('CADRE', [interim], at('2026-03-15')),
    ).toEqual({
      category: 'CADRE_SUPERIEUR',
      assignmentId: interim.id,
      kind: 'INTERIM',
    });
  });

  it('includes both boundary days', () => {
    for (const day of ['2026-03-01', '2026-03-31']) {
      expect(
        resolveEffectiveCategory('CADRE', [interim], at(day)).category,
      ).toBe('CADRE_SUPERIEUR');
    }
  });

  it('uses the own category the day before and the day after', () => {
    for (const day of ['2026-02-28', '2026-04-01']) {
      expect(resolveEffectiveCategory('CADRE', [interim], at(day))).toEqual({
        category: 'CADRE',
        assignmentId: null,
        kind: null,
      });
    }
  });

  it('reads the day in Algiers, not in UTC', () => {
    // 23:30 UTC on 31 Mar is already 1 April in Algiers: outside the period.
    expect(
      resolveEffectiveCategory(
        'CADRE',
        [interim],
        at('2026-03-31', '23:30:00Z'),
      ).category,
    ).toBe('CADRE');
    // 23:30 UTC on 28 Feb is 1 March in Algiers: inside it.
    expect(
      resolveEffectiveCategory(
        'CADRE',
        [interim],
        at('2026-02-28', '23:30:00Z'),
      ).category,
    ).toBe('CADRE_SUPERIEUR');
    expect(algiersDay(at('2026-02-28', '23:30:00Z'))).toBe('2026-03-01');
  });

  it('stops at the day a period was ended early', () => {
    const ended = {
      ...interim,
      endedAt: new Date('2026-03-10T10:00:00Z'),
    };
    expect(effectiveEnd(ended)).toBe('2026-03-10');
    expect(
      resolveEffectiveCategory('CADRE', [ended], at('2026-03-10')).category,
    ).toBe('CADRE_SUPERIEUR');
    expect(
      resolveEffectiveCategory('CADRE', [ended], at('2026-03-11')).category,
    ).toBe('CADRE');
  });

  it('is unaffected by the date on which the lookup runs', () => {
    // An expired period still prices the missions that started inside it.
    expect(
      resolveEffectiveCategory('CADRE', [interim], at('2026-03-20'))
        .assignmentId,
    ).toBe(interim.id);
  });

  it('picks the right period among several', () => {
    const a = period('2026-01-01', '2026-01-31', { targetCategory: 'CADRE' });
    const b = period('2026-06-01', '2026-06-30', {
      targetCategory: 'CADRE_SUPERIEUR',
    });
    expect(
      resolveEffectiveCategory('EXECUTION_MAITRISE', [a, b], at('2026-06-02'))
        .assignmentId,
    ).toBe(b.id);
    expect(
      resolveEffectiveCategory('EXECUTION_MAITRISE', [a, b], at('2026-03-02'))
        .assignmentId,
    ).toBeNull();
  });
});
