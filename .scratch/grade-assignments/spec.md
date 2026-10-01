# Intérim and Remplaçant: a temporary higher category

Goal: an agent can hold a higher category (CADRE or CADRE_SUPERIEUR) for a bounded period. An ordre de mission is priced with the barème of that category only when its date de sortie falls inside the period. Work ships as the ordered issues under `issues/`.

Decision: [ADR 0004 grade assignments and snapshots](../../docs/adr/0004-grade-assignments-and-snapshots.md). Terms: see CONTEXT.md (Période, Intérim, Remplaçant, Catégorie effective).

## Rules

- A **période** (`GradeAssignment`) belongs to one agent and has a kind (`INTERIM` or `REMPLACANT`), a target category, a first and a last day (both included), and a reference to the décision that grants it.
- Only a SUPER_ADMIN creates or ends a période. A période is never deleted and never edited. Ending it stamps `endedAt`; the période then applies up to and including that day.
- Caps: a Remplaçant lasts 4 months at most, an Interim 12 months at most. A période is never extended. A renewal is a new période, and periods of the same kind with no day between them count as one run against the cap. A gap of at least one day starts a new run.
- No two périodes of one agent overlap. A période ended before it began is ignored.
- The target category must be strictly higher than the agent's own: EXECUTION_MAITRISE can target CADRE or CADRE_SUPERIEUR, CADRE can target CADRE_SUPERIEUR, CADRE_SUPERIEUR has none.
- The stored `User.category` is never edited.
- Expiry is date based. No scheduled job flips anything.
- Days are calendar days in Africa/Algiers (UTC+1, no daylight saving).

## Effective category

`resolveEffectiveCategory(own, périodes, date_sortie)` returns the target category of the période covering the day of `date_sortie`, else the agent's own category. It is keyed on the start date of the trip, not on when the ordre is created or settled.

## Snapshots

- **Ordre de mission**: `Mission.effectiveCategory` and `Mission.gradeAssignmentId` are written at creation, and recomputed when `date_sortie` changes while the ordre is still editable.
- **Décompte**: the five barème rates (`barem_repas_nord`, `barem_hebergement_nord`, `barem_repas_sud`, `barem_hebergement_sud`, `barem_montant_km`) are written when the décompte is settled (validation and edit). `downloadDecompte` and the PDF mappers read these columns, never the live barème. This also fixes the older drift where a reprint used today's km rate.
- **Migration** `20261002100000_grade_assignments` backfills every existing ordre from its agent's current category (no période) and every existing décompte from the barème rates of that category today. Stored montants are not touched, so no existing amount changes.

## Surface

- `GET /grade-assignments[?userId=]`, `POST /grade-assignments`, `PATCH /grade-assignments/:id/end`. All SUPER_ADMIN only. Audit actions: `GRADE_ASSIGNMENT_CREATED`, `GRADE_ASSIGNMENT_ENDED`.
- PDFs print the grade as "Grade (Intérim)" or "Grade (Remplaçant)" for an ordre priced under a période.
- Client: a super admin page "Intérim et remplacements" (`/dashboard/admins/grade-assignments`) to create, list and end périodes. French and Arabic.

## Out of scope

- Editing or extending a période.
- Listing a période on the agent's own pages.
- A job that notifies when a période is about to expire.
- Batch ordres (feature 1) must call `GradeAssignmentsService.snapshotFor` for each agent; the batch work wires this in.

## Order

01 data model and rules → 02 snapshots on ordre and décompte → 03 PDFs → 04 super admin UI.
