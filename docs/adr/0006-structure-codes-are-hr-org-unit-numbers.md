# 0006 — Structure codes are HR org-unit numbers; the tree is given by `parentCode`

Status: accepted (2026-10-04). Supersedes the "code encodes the path" parts of ADR 0005.

## Context

ADR 0005 made a structure's code its path (`SDC / ERSTC / Section …`), so a descendant's code started with its ancestor's code. The structures actually come from the HR extract, which has two columns:

| Unité org. | Lib long UO |
| --- | --- |
| 13C0000000 | Sous Direction Commerciale |
| 13CA010000 | SDC / ACTEL TLEMCEN |
| 13CA011000 | SDC / ACTEL TLEMCEN / P.P BENSEKRANE |
| 13CT000000 | SDC / Etablissement Régional Support Technique au Commercial |
| 13CT100000 | SDC / ERSTC /  Section Realisation et intervention |

The label cannot be parsed into a reliable path: the root is called `Sous Direction Commerciale` but its children say `SDC`, and the children of `13CT000000` say `ERSTC` instead of its full label. The HR number, on the other hand, is stable and encodes the hierarchy.

## Decision

- `Structure.code` is the HR **Unité org.** number. It is an opaque identifier and **never changes**: renaming a structure changes only its name, and moving it changes only its `parentCode`.
- `Structure.name` is the HR **Lib long UO**, shown as is everywhere (`structureLabel` = name).
- The tree is given by `parentCode` alone, still at most **3** levels. "In my subtree" is `code = mine OR parentCode = mine OR parent.parentCode = mine`, so the policy stays query-level with no recursion. The request user carries `descendantCodes` (set by the JWT strategy on each request) so `canActInStructure` stays synchronous.
- **Import** reads `Unité org.` (or `Code`), `Lib long UO` (or `Name` / `Nom`), and an optional `Parent` column. Without a parent, it is **inferred from the code**: among HR-shaped codes (letters and digits only, 6 characters or more) of the same length in the database and the file, the one whose digits without trailing zeros are the longest strict prefix (`13CA011000 → 13CA010000 → 13C0000000`, and `13CA010000 → 13C0000000` because `13CA000000` does not exist). An existing structure whose code implies no parent keeps its current one. CSV files may use `,`, `;` or tab.
- *(Amended 2026-10-04)* When the code implies no parent either, it is **inferred from the name**: the structure whose name has the same ` / ` segments as all but the last one, each segment equal (ignoring case, accents and spaces) or the acronym of the other, French stopwords skipped. So `SDC / ACTEL TLEMCEN` goes under `Sous Direction Commerciale`, and `SDC / ERSTC / Section …` under `SDC / Etablissement Régional Support Technique au Commercial`. A **new** row whose ` / ` name matches no structure, or several, is rejected ("indiquez la colonne Parent") rather than created as a root. Order: `Parent` column → code → name → current parent.
- The export writes `Code`, `Name` and `Parent`, so it re-imports as is.
- Creating a structure (root or child) requires its code.

## Consequences

- No migration: existing codes, including path-shaped ones created under ADR 0005, stay valid as opaque identifiers.
- Codes written down elsewhere (exports, bookmarks, the users import's structure column) no longer change on a move or rename.
- Code inference only compares HR-shaped codes of the same length, so hand-made codes (`DG`, `NM-10`) never get a parent from their code; they get one from their ` / ` name, or from the `Parent` column.
- The rest of ADR 0005 (who sees what, responsibles, super-admin-only moves, the 3-level limit, dry-run imports) is unchanged.
