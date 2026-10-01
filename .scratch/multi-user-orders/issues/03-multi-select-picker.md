# 03 — Multi-select user picker

Status: done
Type: task
Blocked by: 01

## Do

- `OwnersPicker` replaces the single-owner `OwnerPicker` in `MissionFormDialog` (admins, shell only): search, checkboxes, "Sélectionner toute ma structure", "Tout désélectionner", per-user error line.
- `addOrdersBatch` thunk: posts the lot, saves the PDF, maps per-user server errors to French/Arabic text.

## Acceptance

- Regular users never see the picker.
- One selected person still uses `POST /missions`.
- Vitest: picker (select, search, structure shortcut, errors), dialog (batch, single, empty selection), thunk (payload, blob error body).
- Playwright (`client/e2e/ordres.spec.ts`): create one ordre for two users and see two new rows.
