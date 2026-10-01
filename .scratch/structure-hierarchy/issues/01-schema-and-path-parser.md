# 01 — Schema and path parser

Status: resolved
Type: task

## Do

- Migration `20261002110000_structure_hierarchy`: `parentCode` (self FK, `ON DELETE NO ACTION`, `ON UPDATE CASCADE`), `responsible_user_id` (unique FK to `User`, `ON DELETE SET NULL`). Existing flat structures stay roots.
- Backfill the responsible with the lowest-matricule active ADMIN of each structure.
- `server/src/structures/structure-path.ts`: pure `parseStructurePath`, `childCode`, `isDescendantCode`, `depthFromCode`, `rekeyCode`, `structureLabel`.
- Unit tests: root matching (case-insensitive, by code not name), unknown root, depth above 3, single segment, empty segments.
