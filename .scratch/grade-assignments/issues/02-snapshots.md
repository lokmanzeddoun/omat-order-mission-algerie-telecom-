# 02 — Snapshot the category on the ordre and the rates on the décompte

Status: resolved
Type: task
Blocked by: 01

## Do

- `Mission.effectiveCategory` and `Mission.gradeAssignmentId`, written on create and when `date_sortie` moves.
- `Decompte.barem_*` (five rates), written by `settle` on validation and on edit. `settle` reads the barème of the ordre's frozen category, falling back to the agent's category on a row with no snapshot.
- `downloadDecompte` and the PDF mapper read the frozen rates; the live barème lookup is gone.
- Migration backfill of existing ordres and décomptes; no existing amount changes.
- Demo seed writes the same snapshots.

## Tests

- Create inside and outside a période; update of `date_sortie` re-resolves the snapshot.
- `settle` prices at the frozen category and freezes the five rates.
- After the période is ended, the agent's category changes and the barème is edited, the décompte and the ordre are unchanged.
- The backfill SQL (run from the migration file) fills the columns and leaves every `montant` equal.
