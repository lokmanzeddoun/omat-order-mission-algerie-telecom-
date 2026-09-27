import { Barem, Direction, TransportType } from '@prisma/client';

export type Zone = 'nord' | 'sud';
export const ZONES: Zone[] = ['nord', 'sud'];

/** Meals and nights spent in one zone, pris en charge (pec) or not. */
export interface ZoneCounts {
  repas_pec: number;
  repas_sans_pec: number;
  hebergement_pec: number;
  hebergement_sans_pec: number;
}

export type Counts = Record<Zone, ZoneCounts>;

const ITEMS = [
  'repas_pec',
  'repas_sans_pec',
  'hebergement_pec',
  'hebergement_sans_pec',
] as const;

/** The flat décompte columns: repas_pec_nord, repas_pec_sud, … */
export type CountColumns = {
  [K in `${(typeof ITEMS)[number]}_${Zone}`]: number;
};

export const emptyCounts = (): Counts => ({
  nord: {
    repas_pec: 0,
    repas_sans_pec: 0,
    hebergement_pec: 0,
    hebergement_sans_pec: 0,
  },
  sud: {
    repas_pec: 0,
    repas_sans_pec: 0,
    hebergement_pec: 0,
    hebergement_sans_pec: 0,
  },
});

export function toCounts(columns: Partial<CountColumns>): Counts {
  const counts = emptyCounts();
  for (const zone of ZONES) {
    for (const item of ITEMS) {
      counts[zone][item] = columns[`${item}_${zone}`] ?? 0;
    }
  }
  return counts;
}

export function toColumns(counts: Counts): CountColumns {
  const columns = {} as CountColumns;
  for (const zone of ZONES) {
    for (const item of ITEMS) {
      columns[`${item}_${zone}`] = counts[zone][item];
    }
  }
  return columns;
}

/** The zones an ordre de mission of this Direction may be spent in. */
export function zonesOf(direction: Direction): Zone[] {
  if (direction === Direction.NORD) return ['nord'];
  if (direction === Direction.SUD) return ['sud'];
  return ZONES;
}

const zoneTotal = (c: ZoneCounts) =>
  c.repas_pec + c.repas_sans_pec + c.hebergement_pec + c.hebergement_sans_pec;

/** Zones that hold at least one meal or night outside the ordre's Direction. */
export function zonesOutside(direction: Direction, counts: Counts): Zone[] {
  const allowed = zonesOf(direction);
  return ZONES.filter((z) => !allowed.includes(z) && zoneTotal(counts[z]) > 0);
}

export const totalMeals = (c: Counts) =>
  ZONES.reduce((n, z) => n + c[z].repas_pec + c[z].repas_sans_pec, 0);

export const totalNights = (c: Counts) =>
  ZONES.reduce(
    (n, z) => n + c[z].hebergement_pec + c[z].hebergement_sans_pec,
    0,
  );

export interface MontantInput {
  counts: Counts;
  transport: TransportType | null;
  parcours: number;
  fees_transport: number;
}

type Rates = Pick<
  Barem,
  | 'repas_nord'
  | 'hebergement_nord'
  | 'repas_sud'
  | 'hebergement_sud'
  | 'montant_km'
>;

/**
 * Montant of a décompte, each zone priced at its own barème rates.
 * Nord pays every meal and night; Sud pays only the sans_pec ones. Any pec
 * item, in either zone, keeps 25% of the total; fees_transport is added last.
 */
export function computeMontant(input: MontantInput, barem: Rates): number {
  const { nord, sud } = input.counts;
  let montant =
    (nord.hebergement_pec + nord.hebergement_sans_pec) *
      barem.hebergement_nord +
    (nord.repas_pec + nord.repas_sans_pec) * barem.repas_nord +
    sud.hebergement_sans_pec * barem.hebergement_sud +
    sud.repas_sans_pec * barem.repas_sud;

  if (input.transport === TransportType.PERSONAL_CAR) {
    montant += input.parcours * barem.montant_km;
  }
  const anyPec = ZONES.some(
    (z) => input.counts[z].repas_pec > 0 || input.counts[z].hebergement_pec > 0,
  );
  if (anyPec) {
    montant *= 0.25;
  }
  return montant + (input.fees_transport || 0);
}
