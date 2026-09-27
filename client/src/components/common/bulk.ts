import i18n from 'i18n';
import { toast } from 'components/ui/toaster';

export type Id = number | string;

/** What every bulk endpoint returns: rows changed, and rows skipped with why. */
export interface BulkResult {
  done: Id[];
  skipped: { id: Id; reason: string }[];
}

/** Entity counted in bulk messages (plural forms live in the `bulk` namespace). */
export type BulkNoun = 'mission' | 'decompte' | 'user' | 'structure';

/** "1 ordre", "3 ordres" — plural rules come from the current language. */
export const countOf = (n: number, noun: BulkNoun) => i18n.t(`bulk:noun.${noun}`, { count: n });

/** Selected rows as request ids, dropping rows that have no id yet. */
export const idsOf = <Row,>(rows: Row[], idOf: (row: Row) => Id | null | undefined) =>
  rows.map(idOf).filter((id): id is Id => id != null && id !== '');

/** Outcome sentence key under `bulk:result.` (e.g. "8 utilisateurs archivés"). */
export type BulkOutcome = 'archived' | 'restored' | 'deleted' | 'accepted' | 'rejected';

interface ReportOptions {
  result: BulkResult;
  noun: BulkNoun;
  outcome: BulkOutcome;
  /** Key under `bulk:skip.` for each skip reason the endpoint can return. */
  skipReasons: string[];
  /** Offered as an action on the success toast. */
  undo?: { label: string; run: (ids: Id[]) => void };
}

/** Success toast for the rows done, warning toast grouping the skipped ones by reason. */
export function reportBulkResult({ result, noun, outcome, skipReasons, undo }: ReportOptions) {
  const { done, skipped } = result;
  if (done.length) {
    toast.success(i18n.t(`bulk:result.${outcome}`, { count: done.length, what: countOf(done.length, noun) }), {
      action: undo ? { label: undo.label, onClick: () => undo.run(done) } : undefined,
    });
  }
  if (skipped.length) {
    const byReason = new Map<string, number>();
    for (const s of skipped) byReason.set(s.reason, (byReason.get(s.reason) ?? 0) + 1);
    const reason = (r: string) => (skipReasons.includes(r) ? i18n.t(`bulk:skip.${r}`) : r);
    toast.warning(i18n.t('bulk:result.skipped', { count: skipped.length, what: countOf(skipped.length, noun) }), {
      description: [...byReason].map(([r, n]) => `${n} : ${reason(r)}`).join(' · '),
    });
  }
}
