# 03 — PDFs show "(Intérim)" / "(Remplaçant)"

Status: resolved
Type: task
Blocked by: 02

## Do

- The ordre and décompte PDFs print the grade followed by "(Intérim)" or "(Remplaçant)" when the ordre was priced under a période.
- The décompte PDF takes its km indemnity from `barem_montant_km` on the décompte.

## Tests

- Mapper tests for both kinds on both PDFs, and none without a période.
- The km indemnity follows the frozen rate and is blank when the rate is null.
