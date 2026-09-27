# 03 — Central access-control policy (A01)

Status: ready-for-agent
Type: task
Blocked by: 01

See [ADR 0001](../../../docs/adr/0001-access-control-policy.md). Write the tests first.

## Findings this closes

- **Missions:**
  - `GET /missions` isn't scoped.
  - `GET /missions/:id`, `PATCH /missions/:id` and `GET /missions/:id/download` are IDORs (`missions.service.ts` findOne/update/generatePdf).
  - `userMatricule` override: an ADMIN can create for anyone.
- **Décomptes:**
  - `GET /decompte` isn't scoped.
  - `GET /decompte/:id` and `GET /decompte/:id/download` are IDORs.
  - No ADMIN structure scope on create/update/accept/reject/bulk.
- **Commentaires:**
  - Can be created on any décompte.
  - `status` is client-set.
  - `GET /comments/admin` is open to USERs.
  - There is an email-lookup fallback.
- **Archive:** every list/archive/restore/bulk route is unscoped for ADMIN, which bypasses the users-module scoping.
- **Structures and analytics:** structures archive and analytics are unscoped.
- **Barem:**
  - Bodies are raw `Prisma.BaremCreateInput`.
  - `GET /barem/category` reads a GET body.
- **Mass assignment:**
  - `UpdateMissionDto` inherits `userMatricule` and loses `@IsEnum(transport)`.
  - `direction` is editable by a USER.
  - `fees_transport` is unbounded.

## Do

- `server/src/common/policy/AccessPolicy`:
  - `scopeUsers/Missions/Decomptes/Structures/Comments(actor)` → `Prisma.*WhereInput`.
  - `assertCan(actor, action, resource)`.
  - Move `userScope`/`canAccessUser` out of `users.service.ts` into it.
- Migration adding:
  - `Mission.validatedById/validatedAt`
  - `Decompte.decidedById/decidedAt`
  - `Mission.lockedAt`/`Decompte.lockedAt`, or derive the lock from status.
- **No self-approval:** refuse if the actor owns the mission.
- **Lock after approval:** validated/accepted records are read-only. Add `POST /missions/:id/reopen` and `POST /decompte/:id/reopen` for SUPER_ADMIN only, with a reason (audited in 07).
- **DTOs:** replace every Prisma-typed body with a class DTO, and enum-validate comment `type`.

## Tests

`server/test/access-control.e2e-spec.ts`: a table-driven test over every route × {anon, USER own, USER other, ADMIN same structure, ADMIN other structure, SUPER_ADMIN}, with the expected 401/404/403/2xx.

Plus a metadata test: every controller route is either `@Public()` or reachable only through the global guards. It fails when a new public route appears.
