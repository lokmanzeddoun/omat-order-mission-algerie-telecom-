# 04 — Super admin page for périodes

Status: resolved
Type: task
Blocked by: 01

## Do

- Page "Intérim et remplacements" under the admin area, SUPER_ADMIN only (route guard and navigation entry).
- List with state (En cours, À venir, Échue, Terminée), a creation dialog (agent, type, target limited to categories above the agent's, dates, reference of the décision) and an "end" action behind a confirmation.
- French and Arabic strings in the `gradeAssignments` namespace.

## Tests

- `higherCategories` and `stateOf` unit tests.
- `locales.test.ts` keeps French and Arabic keys equal.
