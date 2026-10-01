# Hierarchical structures

Goal: structures form a tree (A / B / C, at most 3 levels) that mirrors Algérie Télécom's organisation, and an admin acts on their structure's subtree instead of on one flat structure. Work ships as small ordered PRs; each is one issue under `issues/`.

Decision: [ADR 0005](../../docs/adr/0005-hierarchical-structures-and-subtree-access.md), which amends [ADR 0001](../../docs/adr/0001-access-control-policy.md). Terms (Structure, Sous-structure, Responsable, Périmètre) are in `CONTEXT.md`.

## Real data

Root `Sous Direction Commerciale` with code `SDC`; children `SDC / ACTEL TLEMCEN` and `SDC / ERSTC / Section Réseau Intranet AT`. A root's code is its abbreviation; a child's code is its full path and its `name` is its own segment.

## Rules

- `Structure.parentCode` (self FK, `ON UPDATE CASCADE`), depth at most 3. `code` stays the primary key. Roots and segments may not contain `/`.
- `responsible_user_id`: nullable, unique, must belong to the structure.
- An ADMIN sees and administers their structure's subtree, downward only. Their own structure counts only if it has a responsible. Self-approval stays forbidden; admins still cannot change roles.
- Moves and renames re-key the subtree in one transaction; moves are super admin only and reject cycles and depth above 3.
- Import takes a `path` column, with a dry-run report; rows whose root does not exist are rejected.

## Order

01 schema and path parser -> 02 access policy -> 03 moves -> 04 import -> 05 client -> 06 tests and docs.

## Release gates

- The visibility matrix e2e (A/B/C admins and users) passes: no upward or sideways access.
- A move never leaves a user pointing at an old code.
- The migration leaves every existing admin with a responsible, so nobody loses access on deploy.
