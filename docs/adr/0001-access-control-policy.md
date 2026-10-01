# 0001 — Access control is a central, query-level policy

Status: accepted (2026-09-27). "Own structure" is amended to "own structure's subtree" by [ADR 0004](0004-hierarchical-structures-and-subtree-access.md).

## Context

Most OMAT data is confidential, and an ordre de mission's décompte leads to a payment. The main threat is an insider going beyond their role, not an outside attacker. Audit findings on the codebase before this decision:

- Any logged-in USER could read, edit or download any other employee's ordres de mission and décomptes by id.
- ADMINs were unscoped outside the users module. Scope checks were one-off `if`s in individual services.

## Decision

- **Who sees what:**
  - A USER sees and changes only their own ordres de mission, décomptes and commentaires.
  - An ADMIN acts only within their own structure (`User.serviceId`).
  - A SUPER_ADMIN acts on everything.
- **One `AccessPolicy` enforces this**, in `server/src/common/policy/`:
  - It returns Prisma `where` fragments (`scopeMissions(actor)`, …), which every service merges into its query: `findFirst({ where: { id, ...scope } })`. Services never use a bare `findUnique({ where: { id } })` on scoped data.
  - A read outside the caller's scope returns **404**, so ids don't leak. A write the caller may see but not perform returns **403**.
- **No self-approval.** An ADMIN cannot validate their own ordre de mission, or accept or reject their own décompte. `validatedById`/`decidedById` and their timestamps are stored.
- **Approved records are locked.** A validated ordre de mission and an accepted décompte are read-only. Only a SUPER_ADMIN can reopen one; a reason is required and the reopen is recorded in the audit log.
- **Permanent deletion is kept for SUPER_ADMIN** on archived rows. It is audited before it happens and never applies to an accepted décompte.
- **Request bodies must be class DTOs.** Prisma input types are never accepted as bodies (mass assignment).

## Consequences

- New endpoints are secure only if they call the policy. A table-driven authorization-matrix e2e test (every route × every role/scope) catches the ones that don't.
- Analytics for an ADMIN become per-structure.
