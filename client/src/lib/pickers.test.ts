import { describe, expect, it } from 'vitest';
import { formatDisplayDate, maskDate, maskTime, monthGrid, normalizeTime, parseDisplayDate } from './pickers';

describe('date helpers', () => {
  it('masks digits as DD/MM/YYYY', () => {
    expect(maskDate('1')).toBe('1');
    expect(maskDate('153')).toBe('15/3');
    expect(maskDate('15032026')).toBe('15/03/2026');
    expect(maskDate('15/03/2026999')).toBe('15/03/2026');
    expect(maskDate('ab')).toBe('');
  });

  it('parses a full valid display date to ISO, strictly', () => {
    expect(parseDisplayDate('15/03/2026')).toBe('2026-03-15');
    expect(parseDisplayDate('31/02/2026')).toBeNull();
    expect(parseDisplayDate('15/03/26')).toBeNull();
    expect(parseDisplayDate('')).toBeNull();
  });

  it('formats ISO for display', () => {
    expect(formatDisplayDate('2026-03-15')).toBe('15/03/2026');
    expect(formatDisplayDate('')).toBe('');
  });

  it('builds a Monday-first grid of whole weeks', () => {
    const grid = monthGrid(2026, 2); // March 2026 starts on a Sunday
    expect(grid).toHaveLength(42);
    expect(grid[0]).toBe('2026-02-23');
    expect(grid[6]).toBe('2026-03-01');
    expect(grid[41]).toBe('2026-04-05');
  });
});

describe('time helpers', () => {
  it('masks digits as 24h HH:mm and never accepts impossible values', () => {
    expect(maskTime('8')).toBe('08');
    expect(maskTime('0830')).toBe('08:30');
    expect(maskTime('083')).toBe('08:3');
    expect(maskTime('2')).toBe('2');
    expect(maskTime('25')).toBe('2');
    expect(maskTime('1175')).toBe('11');
    expect(maskTime('08:30pm')).toBe('08:30');
  });

  it('normalizes loose input to HH:mm or null', () => {
    expect(normalizeTime('8:5')).toBe('08:05');
    expect(normalizeTime('0830')).toBe('08:30');
    expect(normalizeTime('8')).toBe('08:00');
    expect(normalizeTime('24:00')).toBeNull();
    expect(normalizeTime('12:60')).toBeNull();
    expect(normalizeTime('')).toBeNull();
  });
});
