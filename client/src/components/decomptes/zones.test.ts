import { describe, expect, it } from 'vitest';
import { countItems, total, zonesOf } from './zones';

const counts = {
  repas_pec_nord: 1,
  repas_sans_pec_nord: 2,
  hebergement_pec_nord: 0,
  hebergement_sans_pec_nord: 1,
  repas_pec_sud: 0,
  repas_sans_pec_sud: 3,
  hebergement_pec_sud: 0,
  hebergement_sans_pec_sud: 2,
};

describe('zonesOf', () => {
  it('maps each Direction to the zones its meals and nights may be spent in', () => {
    expect(zonesOf('NORD')).toEqual(['nord']);
    expect(zonesOf('SUD')).toEqual(['sud']);
    expect(zonesOf('MIXTE')).toEqual(['nord', 'sud']);
  });
});

describe('total', () => {
  it('adds an item across both zones', () => {
    expect(total(counts, 'repas_sans_pec')).toBe(5);
    expect(total({}, 'repas_pec')).toBe(0);
  });
});

describe('countItems', () => {
  it('keeps the plain labels for a single-zone ordre', () => {
    expect(countItems(counts, 'SUD')).toEqual([
      { label: 'Repas avec prise en charge', value: 0 },
      { label: 'Repas sans prise en charge', value: 3 },
      { label: 'Nuitées avec prise en charge', value: 0 },
      { label: 'Nuitées sans prise en charge', value: 2 },
    ]);
  });

  it('shows each zone separately for a Nord et Sud ordre', () => {
    const labels = countItems(counts, 'MIXTE').map((i) => `${i.label}=${i.value}`);
    expect(labels).toEqual([
      'Repas avec prise en charge (Nord)=1',
      'Repas sans prise en charge (Nord)=2',
      'Nuitées avec prise en charge (Nord)=0',
      'Nuitées sans prise en charge (Nord)=1',
      'Repas avec prise en charge (Sud)=0',
      'Repas sans prise en charge (Sud)=3',
      'Nuitées avec prise en charge (Sud)=0',
      'Nuitées sans prise en charge (Sud)=2',
    ]);
  });
});
