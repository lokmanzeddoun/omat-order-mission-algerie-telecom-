# 0004 — Interim and Remplaçant periods, and frozen barème snapshots

Status: accepted (2026-10-02)

## Context

An agent sometimes holds a higher category for a while (an Interim, or a Remplaçant standing in for someone absent). The ordres de mission of that time must be paid at the barème of the higher category, and only those.

The décompte read the barème live, from the agent's current category, both when it was settled and every time its PDF was printed. A barème edit or a promotion therefore changed what an old PDF printed, and a temporary category would have rewritten the past when it ended.

## Decision

- A `GradeAssignment` is a bounded period (kind, target category, first and last day, reference of the décision, `endedAt`). It is created and ended by a SUPER_ADMIN only, never edited and never deleted. The agent's stored `category` is never changed.
- Caps and rules: a Remplaçant lasts at most 4 months, an Interim at most 12; no extension (a renewal is a new period, and touching periods of one kind count together against the cap); no overlap per agent; the target is strictly above the agent's own category.
- The category used for pricing is a function of the **start date of the trip** (`date_sortie`), decided by the periods that exist then. Expiry is date based; there is no job.
- The ordre freezes that category (`effectiveCategory`, `gradeAssignmentId`) when it is created, and again if its start date moves while it is editable. The décompte freezes the five barème rates it was priced with (`barem_*`) when it is settled. Printing reads the frozen values only.
- The migration backfills existing ordres from the agent's current category and existing décomptes from the barème rates of that category today, with no period. Montants are not recomputed, so no existing amount changes.
- Days are calendar days in Africa/Algiers (UTC+1).

## Consequences

- Ending or changing a period never changes an ordre or décompte already created. Moving the start date of a still-editable ordre in or out of a period does change its category.
- A barème edit no longer alters the km indemnity printed on an existing décompte. Editing a pending décompte takes a fresh snapshot of the barème at that moment.
- Any code that creates an ordre must call `GradeAssignmentsService.snapshotFor`. A row without a snapshot falls back to the agent's current category (the legacy behaviour).
