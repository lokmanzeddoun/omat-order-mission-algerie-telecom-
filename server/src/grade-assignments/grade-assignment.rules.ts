import moment from 'moment';
import { Category, GradeAssignmentKind } from '@prisma/client';

/**
 * Pure rules for Interim / Remplaçant periods (CONTEXT.md). Days are
 * 'YYYY-MM-DD' strings: a period is a run of calendar days in Algiers (UTC+1,
 * no daylight saving), both ends included, so comparing strings is comparing days.
 */
export type Day = string;

export interface PeriodLike {
  id: number;
  kind: GradeAssignmentKind;
  targetCategory: Category;
  startDate: Date;
  endDate: Date;
  endedAt: Date | null;
}

export const MAX_MONTHS: Record<GradeAssignmentKind, number> = {
  REMPLACANT: 4,
  INTERIM: 12,
};

/** Higher rank = higher category. */
export const CATEGORY_RANK: Record<Category, number> = {
  EXECUTION_MAITRISE: 0,
  CADRE: 1,
  CADRE_SUPERIEUR: 2,
};

const ALGIERS_OFFSET_MS = 60 * 60 * 1000;

/** The calendar day in Algiers of an instant. */
export function algiersDay(instant: Date): Day {
  return new Date(instant.getTime() + ALGIERS_OFFSET_MS)
    .toISOString()
    .slice(0, 10);
}

/** Day stored in a `@db.Date` column (midnight UTC). */
export const dayOf = (date: Date): Day => date.toISOString().slice(0, 10);

export const toDate = (day: Day): Date => new Date(`${day}T00:00:00.000Z`);

const dayBefore = (day: Day): Day =>
  moment.utc(day).subtract(1, 'day').format('YYYY-MM-DD');

/** Last day a continuous run of `kind` starting on `start` may cover. */
export function lastAllowedDay(kind: GradeAssignmentKind, start: Day): Day {
  return moment
    .utc(start)
    .add(MAX_MONTHS[kind], 'months')
    .subtract(1, 'day')
    .format('YYYY-MM-DD');
}

/** The last day the period applies: its end date, or the day it was ended if earlier. */
export function effectiveEnd(a: PeriodLike): Day {
  const end = dayOf(a.endDate);
  if (!a.endedAt) return end;
  const ended = algiersDay(a.endedAt);
  return ended < end ? ended : end;
}

/** A period ended before it began never applies. */
export const isVoid = (a: PeriodLike): boolean =>
  effectiveEnd(a) < dayOf(a.startDate);

export const isHigher = (target: Category, own: Category): boolean =>
  CATEGORY_RANK[target] > CATEGORY_RANK[own];

export interface EffectiveCategory {
  category: Category;
  assignmentId: number | null;
  kind: GradeAssignmentKind | null;
}

/**
 * The category an ordre de mission is priced at: the user's own, unless a
 * period covers the mission's start date. Date-based only, there is no job
 * that flips anything when a period expires.
 */
export function resolveEffectiveCategory(
  own: Category,
  assignments: PeriodLike[],
  missionStart: Date,
): EffectiveCategory {
  const day = algiersDay(missionStart);
  const hit = assignments.find(
    (a) => dayOf(a.startDate) <= day && day <= effectiveEnd(a),
  );
  return hit
    ? { category: hit.targetCategory, assignmentId: hit.id, kind: hit.kind }
    : { category: own, assignmentId: null, kind: null };
}

export type PeriodViolation =
  | { code: 'ORDER' }
  | { code: 'NOT_HIGHER' }
  | { code: 'OVERLAP'; with: number }
  | { code: 'CAP'; maxEnd: Day; months: number; chainStart: Day };

export interface NewPeriod {
  kind: GradeAssignmentKind;
  targetCategory: Category;
  start: Day;
  end: Day;
}

/**
 * Checks a new period against the user's own category and their existing
 * periods. Returns the first violated rule, or null. A period is never
 * extended: a renewal is a new period, and any run of same-kind periods that
 * touch (no day between them) counts as one against the cap.
 */
export function checkNewPeriod(
  own: Category,
  existing: PeriodLike[],
  next: NewPeriod,
): PeriodViolation | null {
  if (next.end < next.start) return { code: 'ORDER' };
  if (!isHigher(next.targetCategory, own)) return { code: 'NOT_HIGHER' };

  const live = existing.filter((a) => !isVoid(a));
  const overlap = live.find(
    (a) => dayOf(a.startDate) <= next.end && next.start <= effectiveEnd(a),
  );
  if (overlap) return { code: 'OVERLAP', with: overlap.id };

  let chainStart = next.start;
  const sameKind = live.filter((a) => a.kind === next.kind);
  for (;;) {
    const prev = sameKind.find(
      (a) => effectiveEnd(a) === dayBefore(chainStart),
    );
    if (!prev) break;
    chainStart = dayOf(prev.startDate);
  }
  const maxEnd = lastAllowedDay(next.kind, chainStart);
  if (next.end > maxEnd) {
    return { code: 'CAP', maxEnd, months: MAX_MONTHS[next.kind], chainStart };
  }
  return null;
}
