import { toast } from 'components/ui/toaster';

export type Id = number | string;

/** What every bulk endpoint returns: rows changed, and rows skipped with why. */
export interface BulkResult {
  done: Id[];
  skipped: { id: Id; reason: string }[];
}

/** "1 ordre", "3 ordres" (French: 0 and 1 are singular). */
export const countOf = (n: number, [one, many]: [string, string]) => `${n} ${n > 1 ? many : one}`;

/** Selected rows as request ids, dropping rows that have no id yet. */
export const idsOf = <Row,>(rows: Row[], idOf: (row: Row) => Id | null | undefined) =>
  rows.map(idOf).filter((id): id is Id => id != null && id !== '');

interface ReportOptions {
  result: BulkResult;
  /** Singular and plural noun, e.g. ['décompte', 'décomptes']. */
  noun: [string, string];
  /** Singular and plural participle, e.g. ['archivé', 'archivés']. */
  participle: [string, string];
  /** Human text for each skip reason the endpoint can return. */
  skipLabels: Record<string, string>;
  /** Offered as an action on the success toast. */
  undo?: { label: string; run: (ids: Id[]) => void };
}

/** Success toast for the rows done, warning toast grouping the skipped ones by reason. */
export function reportBulkResult({ result, noun, participle, skipLabels, undo }: ReportOptions) {
  const { done, skipped } = result;
  if (done.length) {
    toast.success(`${countOf(done.length, noun)} ${done.length > 1 ? participle[1] : participle[0]}`, {
      action: undo ? { label: undo.label, onClick: () => undo.run(done) } : undefined,
    });
  }
  if (skipped.length) {
    const byReason = new Map<string, number>();
    for (const s of skipped) byReason.set(s.reason, (byReason.get(s.reason) ?? 0) + 1);
    toast.warning(`${countOf(skipped.length, noun)} ${skipped.length > 1 ? 'ignorés' : 'ignoré'}`, {
      description: [...byReason].map(([reason, n]) => `${n} : ${skipLabels[reason] ?? reason}`).join(' · '),
    });
  }
}
