# 0003 — An ordre de mission can be spent in both the Nord and the Sud

Status: accepted (2026-09-27)

## Context

An ordre de mission had exactly one Direction, NORD or SUD. Its décompte stored four counts (repas and nuitées, pec and sans pec), and the whole montant was priced at that Direction's barème.

A trip that crosses zones, such as a Sud mission with nights on the way in the Nord, had to be recorded under a single Direction and so was paid at the wrong rate for part of the trip. The paper forms already have a Nord and a Sud column for every repas and nuitée line.

## Decision

- `Direction` gains `MIXTE`, shown as **Nord et Sud**.
- A décompte stores each count per zone: `repas_pec_nord`, `repas_pec_sud`, … `hebergement_sans_pec_sud` (8 columns in place of 4). The migration copies each existing count into the zone of its ordre's Direction, so existing montants and PDFs do not change.
- The Direction of the ordre bounds the zones: a Nord ordre only accepts Nord counts, a Sud ordre only Sud counts, and a Nord et Sud ordre both. The admin enters the split when validating the ordre.
- The meal and night entitlements are checked against both zones added together.
- `computeMontant` (`server/src/decompte/montant.ts`) is the single pricing rule, shared by create, update and the demo seed:
  - Each zone is priced at its own barème.
  - The rules that existed per Direction are kept per zone: Nord pays every meal and night; Sud pays only the sans pec ones.
  - Any pec item, in either zone, keeps 25% of the total, including the km indemnity. `fees_transport` is added last.
- The décompte PDF fills each column from its own counts; a zone outside the ordre's Direction stays blank.
- Analytics show Nord et Sud as its own row. The montant is not split between the Nord and Sud rows.

## Consequences

- API clients send the 8 per-zone counts; the old 4 fields are gone.
- The Sud rule (pec items unpaid, then 25% kept) and the 25% rule itself contradict `docs/decompte-workflow.md`. They are kept as the code had them, pending a business decision; changing them now means changing `computeMontant` only.
- Reporting that needs the amount per zone must recompute it from the counts, as `montant` is only stored as a total.
