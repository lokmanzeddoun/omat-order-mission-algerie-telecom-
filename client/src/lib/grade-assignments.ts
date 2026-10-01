export type GradeKind = 'INTERIM' | 'REMPLACANT';
export type GradeCategory = 'CADRE' | 'CADRE_SUPERIEUR';

export interface GradeAssignment {
  id: number;
  userId: number;
  kind: GradeKind;
  targetCategory: string;
  startDate: string;
  endDate: string;
  decisionRef: string;
  endedAt: string | null;
  user: { matricule: number; nom: string; prenom: string; category: string };
}

export type PeriodState = 'ended' | 'upcoming' | 'active' | 'expired';

/** Categories strictly above the agent's own (the server enforces the same rule). */
export const higherCategories = (own?: string): GradeCategory[] =>
  own === 'EXECUTION_MAITRISE' ? ['CADRE', 'CADRE_SUPERIEUR'] : own === 'CADRE' ? ['CADRE_SUPERIEUR'] : [];

const day = (iso: string) => iso.slice(0, 10);

/** Where a period stands on `today` (YYYY-MM-DD); display only, the server prices by mission start date. */
export const stateOf = (a: Pick<GradeAssignment, 'startDate' | 'endDate' | 'endedAt'>, today: string): PeriodState => {
  if (a.endedAt) return 'ended';
  if (today < day(a.startDate)) return 'upcoming';
  if (today > day(a.endDate)) return 'expired';
  return 'active';
};
