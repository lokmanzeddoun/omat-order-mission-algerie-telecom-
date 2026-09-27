# 07 — Audit trail, security events, PII (A09, Law 18-07)

Status: ready-for-agent
Type: task
Blocked by: 03, 04

## Do

- Prisma model `AuditLog { id, actorMatricule, action, entity, entityId, before Json?, after Json?, reason?, ip, at }`.
- `AuditService.record()` is called on:
  - validation,
  - décompte accept/reject,
  - reopen (with a reason),
  - role change,
  - password reset,
  - archive/restore,
  - **before** permanent delete,
  - import,
  - MFA reset.
- **Permanent delete:** also refuse it for accepted décomptes.
- `restoreStamp` must stop erasing archive history. The history lives in AuditLog.
- **Structured security events:**
  - login success or failure,
  - MFA failure,
  - refresh reuse,
  - 401/403 bursts.
  - The matricule is the only identifier logged.
- **Read-only audit view:** `GET /audit` for SUPER_ADMIN, scoped for ADMIN.
- **Retention:** `docs/security/data-retention.md` covers AuditLog, Session and logs, to be confirmed with company IT.
- **Performance:** move `exercices.ensureCurrentForNow` off the list hot paths, to boot plus a daily `@nestjs/schedule` job.

## Tests

- Each audited action writes exactly one entry, with the actor.
- Permanent delete of an accepted décompte is refused.
