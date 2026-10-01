import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  buildDestinations,
  joinDestinations,
  parseDestinations,
  searchDestinations,
  type CityRow,
} from './destinations';

const rows = JSON.parse(readFileSync(resolve(__dirname, '../data/algeria_cities.json'), 'utf-8')) as CityRow[];
const options = buildDestinations(rows);

describe('buildDestinations', () => {
  it('lists the 58 wilayas and every commune qualified by its wilaya', () => {
    expect(options.filter((o) => o.kind === 'wilaya')).toHaveLength(58);
    expect(options.filter((o) => o.kind === 'commune')).toHaveLength(rows.length);
    expect(new Set(options.map((o) => o.value)).size).toBe(options.length);
  });

  it('keeps client and server data identical', () => {
    const server = readFileSync(resolve(__dirname, '../../../server/src/data/algeria_cities.json'), 'utf-8');
    expect(JSON.parse(server)).toEqual(rows);
  });
});

describe('searchDestinations', () => {
  it('suggests entries starting with the typed text first, ignoring case and accents', () => {
    const hits = searchDestinations(options, 'tl').map((o) => o.value);
    expect(hits[0]).toBe('Tlemcen');
    expect(searchDestinations(options, 'bejaia')[0].value).toBe('Béjaïa');
  });

  it('matches Arabic names', () => {
    expect(searchDestinations(options, 'تلمسان')[0].value).toBe('Tlemcen');
  });

  it('matches communes by name and shows their wilaya', () => {
    const hit = searchDestinations(options, 'timekten')[0];
    expect(hit.value).toBe('Timekten (Adrar)');
    expect(hit.wilaya).toBe('Adrar');
  });

  it('returns nothing for blank input and caps the result count', () => {
    expect(searchDestinations(options, '  ')).toEqual([]);
    expect(searchDestinations(options, 'a', 8)).toHaveLength(8);
  });
});

describe('join / parse', () => {
  it('joins with the spaced separator', () => {
    expect(joinDestinations(['Oran', 'Timekten (Adrar)'])).toBe('Oran - Timekten (Adrar)');
    expect(joinDestinations([])).toBe('');
  });

  it('parses a stored value back into options', () => {
    expect(parseDestinations(options, 'Oran - Timekten (Adrar)')?.map((o) => o.value)).toEqual([
      'Oran',
      'Timekten (Adrar)',
    ]);
    expect(parseDestinations(options, '')).toEqual([]);
    expect(parseDestinations(options, undefined)).toEqual([]);
  });

  it('migrates legacy "-" values best-effort, including hyphenated names', () => {
    expect(parseDestinations(options, 'Alger-Oran')?.map((o) => o.value)).toEqual(['Alger', 'Oran']);
    expect(parseDestinations(options, 'Tlemcen-Sidi-Aich')?.map((o) => o.value)).toEqual([
      'Tlemcen',
      'Sidi-Aich (Béjaïa)',
    ]);
  });

  it('gives up on commune names shared by several wilayas', () => {
    const communes = options.filter((o) => o.kind === 'commune');
    const dup = communes.find((c) => communes.filter((o) => o.name === c.name).length > 1)!;
    expect(parseDestinations(options, dup.name)).toBeNull();
  });

  it('returns null when a value cannot be matched', () => {
    expect(parseDestinations(options, 'Atlantis')).toBeNull();
    expect(parseDestinations(options, 'Alger-Atlantis')).toBeNull();
  });
});
