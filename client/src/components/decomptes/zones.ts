import { directionLabels } from 'constants/labels';

/** Where a meal or night was spent; each zone is paid at its own barème. */
export type Zone = 'nord' | 'sud';

export const ITEMS = [
  { key: 'repas_pec', label: 'Repas avec prise en charge' },
  { key: 'repas_sans_pec', label: 'Repas sans prise en charge' },
  { key: 'hebergement_pec', label: 'Nuitées avec prise en charge' },
  { key: 'hebergement_sans_pec', label: 'Nuitées sans prise en charge' },
] as const;

export type Item = (typeof ITEMS)[number]['key'];
export type CountField = `${Item}_${Zone}`;
export type Counts = Partial<Record<CountField, number>>;

export const zoneLabel: Record<Zone, string> = { nord: directionLabels.NORD, sud: directionLabels.SUD };

/** The zones an ordre de mission of this Direction may be spent in. */
export const zonesOf = (direction?: string): Zone[] =>
  direction === 'SUD' ? ['sud'] : direction === 'MIXTE' ? ['nord', 'sud'] : ['nord'];

export const field = (item: Item, zone: Zone): CountField => `${item}_${zone}`;

/** One item added across both zones. */
export const total = (counts: Counts, item: Item) => (counts[field(item, 'nord')] ?? 0) + (counts[field(item, 'sud')] ?? 0);

/** Count lines for a DescriptionList; the zone is named only on a Nord et Sud ordre. */
export const countItems = (counts: Counts, direction?: string) => {
  const zones = zonesOf(direction);
  return zones.flatMap((zone) =>
    ITEMS.map(({ key, label }) => ({
      label: zones.length > 1 ? `${label} (${zoneLabel[zone]})` : label,
      value: counts[field(key, zone)] ?? 0,
    })),
  );
};
