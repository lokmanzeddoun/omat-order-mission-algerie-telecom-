export interface BulkResult<K, R extends string = string> {
  done: K[];
  skipped: { id: K; reason: R | 'not_found' }[];
}

/**
 * Splits requested ids into the ones a bulk action may change and the ones
 * it must skip. `rows` holds the rows that exist; missing ids are reported
 * as `not_found`, duplicates are ignored, and `reasonFor` returns why an
 * existing row can't be changed (or null when it can).
 */
export function partitionIds<K, T, R extends string>(
  ids: K[],
  rows: Map<K, T>,
  reasonFor: (row: T, id: K) => R | null,
): BulkResult<K, R> {
  const result: BulkResult<K, R> = { done: [], skipped: [] };
  for (const id of new Set(ids)) {
    const row = rows.get(id);
    const reason = row === undefined ? 'not_found' : reasonFor(row, id);
    if (reason) result.skipped.push({ id, reason });
    else result.done.push(id);
  }
  return result;
}
