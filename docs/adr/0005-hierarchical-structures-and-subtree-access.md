# 0005 — Structures form a tree, and an admin acts on their subtree

Status: accepted (2026-10-01); partly superseded by [ADR 0006](0006-structure-codes-are-hr-org-unit-numbers.md): codes are HR org-unit numbers, not paths, and the tree is given by `parentCode`.

## Context

Structures were flat, and ADR 0001 scoped an ADMIN to their own structure (`User.serviceId`). Algérie Télécom's real organisation is a hierarchy: a Sous Direction (SDC) contains ACTEL agencies and sections, which in turn contain sections. A head of a Sous Direction has to validate décomptes and manage users across the whole branch, which "same structure" cannot express.

## Decision

### The tree

- A structure has an optional `parentCode` (self foreign key). The depth is at most **3** (root, child, grandchild).
- `code` stays the primary key and encodes the path:
  - A **root**'s code is its abbreviation (`SDC`); its `name` is the full name (`Sous Direction Commerciale`).
  - A **child**'s code is its full path (`SDC / ERSTC / Section Réseau Intranet AT`); its `name` is its own segment (`Section Réseau Intranet AT`).
  - So a descendant's code always starts with its ancestor's code + `" / "`. Roots and segments may not contain `/`.
- The UI and the PDFs show a root by its full name and a child by its path (`structureLabel`).
- `responsible_user_id` (nullable, unique) names the structure's responsible. The responsible must belong to the structure, and a user is responsible for at most one structure. Both are enforced; moving or archiving the responsible is refused or clears the link.
- `Structure.parentCode` and `User.serviceId` use `ON UPDATE CASCADE`, so re-keying a code carries the users and the children with it.

### Who sees what

"Same structure" in ADR 0001 becomes "the target's structure is in my **subtree**", **downward only**:

| Admin of | Sees |
| --- | --- |
| A | A, B (child of A), C (child of B) |
| B | B, C |
| C | C |

- Never upwards, never sideways.
- It covers ordres de mission, décomptes, commentaires, users and structures (`scopeMissions/Decomptes/Comments/Users/Structures`), user creation and edition (`canActInStructure`, `canAccessUser`), and the validation of ordres and décomptes by an ancestor's admin.
- An admin may consult the users of their subtree and create ordres for them, but never create, edit, archive or reset the password of a user: account management is SUPER_ADMIN only. In the Archive, an admin consults (read-only) the archived ordres and décomptes of their subtree; archived users and structures, and every restore or delete, are SUPER_ADMIN only.
- **Structures without a responsible** are visible only to the admins of their ancestors and to super admins: an admin's own structure counts only if it has a responsible. Its descendants stay in scope.
- Unchanged from ADR 0001: a USER sees only their own records; **no self-approval** (an ancestor's admin cannot validate their own ordre either); an ADMIN cannot change roles; a SUPER_ADMIN sees everything.
- The policy stays query-level and synchronous. It needs no recursion because a subtree is `code = mine OR code LIKE mine || ' / %'`. The request user carries `serviceHasResponsible` (set by the JWT strategy) for the check on their own structure.

### Moves and imports

- **Moving** a structure is **super admin only**: `PATCH /structures/:code/move`.
  - It rejects cycles (under itself or a descendant) and any move that would make the subtree deeper than 3.
  - Making a structure a root needs its new abbreviation.
  - It re-keys the codes of the whole subtree in one transaction, which carries users and children through the cascade; a name clash is a 409.
  - Renaming a child re-keys its subtree the same way.
  - Moves are audited (`structure.move`).
- **The path parser** (`structures/structure-path.ts`, pure and unit-tested) derives parent and child from a path string: at least 2 and at most 3 segments, no empty segment, and the first segment must match the code of a root (ignoring case).
- **Import** adds a `path` column (a root keeps `code` + `name`). Rows whose root does not exist are rejected. `POST /structures/upload?dryRun=true` reports what would be created or updated and every error without writing; applying runs the same validation, parents first.
- **Migration**: existing flat structures stay roots with no re-keying. Because a structure without a responsible hides it from its own admins, the migration makes the lowest-matricule active ADMIN of each structure its responsible, so nobody loses access on deploy. Super admins should review these.

## Consequences

- A role-based admin of a structure sees nothing in it until it has a responsible; ancestors' admins and super admins are unaffected.
- Codes are paths: any code written down elsewhere (exports, bookmarks) changes when its structure is moved or renamed. `AuditLog` keeps the old code in `entityId`.
- The `code`-prefix rule relies on an invariant kept by the structures service (create, rename, move, import). Nothing else may write `Structure.code` or `parentCode`.
- Each `scope*` fragment is a nested relation filter; at the current data size this is cheap, and it can be replaced by a materialised path if it ever isn't.
- Archiving a structure with live sub-structures is refused, and a permanent delete skips it (`has_children`).
