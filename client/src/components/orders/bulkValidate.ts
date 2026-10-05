import dayjs from 'helpers/date';
import { calculateMealsAndAccommodation } from 'helpers/utils';
import type { IMission } from './orderReducer';

/** The schedule entered once for every ordre of the form. */
export interface Schedule {
  heure_sortie: string;
  date_retour: string;
  heure_retour: string;
}

/** The ordre's departure day, as the agent sees it (YYYY-MM-DD). */
export const departureDateOf = (m: IMission) => (m.date_sortie ? dayjs(m.date_sortie).format('YYYY-MM-DD') : '');

/** Meals / nights the agent is entitled to for the declared schedule. */
export const entitlements = (departureDate: string, v: Schedule) =>
  departureDate && v.heure_sortie && v.date_retour && v.heure_retour
    ? calculateMealsAndAccommodation(departureDate, v.heure_sortie, v.date_retour, v.heure_retour)
    : { meals: 0, accommodations: 0 };

export interface EntitlementRow {
  mission: IMission;
  meals: number;
  nights: number;
  /** Outside the largest group: the shared figures can't fit this ordre. */
  odd: boolean;
}

/**
 * Ordres validated with one form must be entitled to the same meals and nights
 * for the shared schedule, and share the Direction (which zones are split) and
 * the means of transport (which transport figure is asked). Ordres outside the
 * largest such group are flagged `odd`.
 */
export function groupByEntitlement(missions: IMission[], schedule: Schedule) {
  const rows = missions.map((mission) => {
    const { meals, accommodations } = entitlements(departureDateOf(mission), schedule);
    return { mission, meals, nights: accommodations, key: `${meals}|${accommodations}|${mission.direction}|${mission.transport}` };
  });
  const sizes = new Map<string, number>();
  for (const r of rows) sizes.set(r.key, (sizes.get(r.key) ?? 0) + 1);
  // The largest group wins; on a tie, the one of the first ordre.
  let main = rows[0]?.key;
  for (const [key, size] of sizes) if (size > (sizes.get(main!) ?? 0)) main = key;
  return {
    rows: rows.map(({ key, ...r }): EntitlementRow => ({ ...r, odd: key !== main })),
    mismatch: sizes.size > 1,
  };
}

/** The value every ordre shares, or '' when they differ. */
export const common = (values: string[]) => (values.every((v) => v === values[0]) ? (values[0] ?? '') : '');
