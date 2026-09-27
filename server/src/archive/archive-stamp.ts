/**
 * Data written when a row is archived or restored. Every archive path
 * (single row, bulk, "annuler") goes through these so the audit columns
 * never drift from soft_delete.
 */
export const archiveStamp = (actorId: number) => ({
  soft_delete: true,
  archivedAt: new Date(),
  archivedById: actorId,
});

export const restoreStamp = () => ({
  soft_delete: false,
  archivedAt: null,
  archivedById: null,
});
