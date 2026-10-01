import { BadRequestException } from '@nestjs/common';
import { assertMissionDuration } from './mission-duration';

describe('assertMissionDuration', () => {
  const sortie = new Date('2026-01-01T08:00:00Z');

  it('accepts a trip of exactly 30 days', () => {
    expect(() =>
      assertMissionDuration(sortie, new Date('2026-01-31T08:00:00Z')),
    ).not.toThrow();
  });

  it('rejects a trip longer than 30 days', () => {
    expect(() =>
      assertMissionDuration(sortie, new Date('2026-01-31T08:01:00Z')),
    ).toThrow(BadRequestException);
  });

  it('ignores a trip with no return yet', () => {
    expect(() => assertMissionDuration(sortie, null)).not.toThrow();
  });
});
