# 03 — Moves and re-keying

Status: resolved
Type: task
Blocked by: 01

## Do

- `PATCH /structures/:code/move` (super admin): new parent or root (with a code). Rejects cycles, depth above 3, name clashes (409).
- Renaming a child re-keys its subtree. Users and children follow through `ON UPDATE CASCADE`, in one transaction.
- Archiving a structure with live sub-structures is refused; permanent delete skips it (`has_children`).
- Audit `structure.move`, `structure.create`, `structure.responsible`, `structure.import`.
