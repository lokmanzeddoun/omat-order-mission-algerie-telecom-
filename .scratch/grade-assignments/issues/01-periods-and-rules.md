# 01 — Périodes, rules and the effective category

Status: resolved
Type: task
Blocked by: none

## Do

- Prisma model `GradeAssignment { id, userId, kind, targetCategory, startDate, endDate, decisionRef, endedAt, createdAt, createdById }` and enum `GradeAssignmentKind { INTERIM, REMPLACANT }`.
- Pure rules in `server/src/grade-assignments/grade-assignment.rules.ts`: caps, no extension, no overlap, strictly higher target, effective end, `resolveEffectiveCategory`.
- `GradeAssignmentsService` (create in a serializable transaction, end, list, `snapshotFor`) and `GradeAssignmentsController`, SUPER_ADMIN only, with `AuditLog` entries.

## Tests

- Caps at the boundary day for both kinds; a renewal counts against the cap; a gap resets it.
- Overlap: inside, straddling either end, around; touching days are allowed; early end frees the days.
- Target category matrix.
- Effective category: inside, outside, both boundary days, the Algiers day boundary, early end.
- e2e: ANON 401, USER and ADMIN 403, SUPER_ADMIN 201; ending twice is refused; audit rows.
