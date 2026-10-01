import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateMissionDto } from '../missions/dto/create-mission.dto';
import { UpdateMissionDto } from '../missions/dto/update-mission.dto';
import { MAX_DESTINATIONS, isValidDestination } from './destination-validator';

describe('isValidDestination', () => {
  it('accepts a wilaya', () => {
    expect(isValidDestination('Oran')).toBe(true);
    expect(isValidDestination('Béjaïa')).toBe(true);
  });

  it('accepts a commune qualified by its wilaya', () => {
    expect(isValidDestination('Timekten (Adrar)')).toBe(true);
  });

  it('accepts several destinations joined by " - "', () => {
    expect(isValidDestination('Timekten (Adrar) - Oran')).toBe(true);
  });

  it('keeps hyphenated commune names intact', () => {
    expect(isValidDestination('Sidi-Aich (Béjaïa)')).toBe(true);
  });

  it('rejects free text, bare commune names and legacy "-" strings', () => {
    expect(isValidDestination('Atlantis')).toBe(false);
    expect(isValidDestination('Timekten')).toBe(false);
    expect(isValidDestination('Alger-Oran')).toBe(false);
    expect(isValidDestination('')).toBe(false);
    expect(isValidDestination(undefined)).toBe(false);
  });

  it('rejects empty items, duplicates and too many destinations', () => {
    expect(isValidDestination('Oran - ')).toBe(false);
    expect(isValidDestination('Oran - Oran')).toBe(false);
    const wilayas = [
      'Adrar',
      'Chlef',
      'Laghouat',
      'Batna',
      'Biskra',
      'Blida',
      'Bouira',
      'Tlemcen',
      'Tiaret',
      'Alger',
      'Oran',
    ];
    expect(wilayas).toHaveLength(MAX_DESTINATIONS + 1);
    expect(
      isValidDestination(wilayas.slice(0, MAX_DESTINATIONS).join(' - ')),
    ).toBe(true);
    expect(isValidDestination(wilayas.join(' - '))).toBe(false);
  });
});

describe('mission DTOs', () => {
  const base = {
    date_sortie: '2026-03-10',
    motif: 'Audit',
    transport: 'SERVICE_CAR',
    direction: 'NORD',
  };

  it('CreateMissionDto rejects an unknown destination', async () => {
    const dto = plainToInstance(CreateMissionDto, {
      ...base,
      destination: 'Atlantis',
    });
    const errors = await validate(dto);
    expect(errors.map((e) => e.property)).toContain('destination');
  });

  it('CreateMissionDto accepts a known destination', async () => {
    const dto = plainToInstance(CreateMissionDto, {
      ...base,
      destination: 'Oran - Alger',
    });
    const errors = await validate(dto);
    expect(errors.map((e) => e.property)).not.toContain('destination');
  });

  it('UpdateMissionDto validates only when a destination is sent', async () => {
    expect(await validate(plainToInstance(UpdateMissionDto, {}))).toEqual([]);
    const errors = await validate(
      plainToInstance(UpdateMissionDto, { destination: 'Atlantis' }),
    );
    expect(errors.map((e) => e.property)).toContain('destination');
  });
});
