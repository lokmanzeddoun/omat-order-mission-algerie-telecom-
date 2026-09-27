# OMAT application security plan

> **Status (2026-09-27):** the decisions are recorded in [ADR 0001](../adr/0001-access-control-policy.md) and [ADR 0002](../adr/0002-session-and-token-strategy.md). The work is tracked as ordered issues in [`.scratch/security/`](../../.scratch/security/spec.md). Where this document and those files disagree, the ADRs win.

## Agreed operating assumptions

- Production runs on the company LAN, behind HTTPS, with the frontend and API on one origin.
- Employee and reimbursement records are confidential. Access is limited by employee and organizational structure.
- Employees access their own records. Administrators work only within their assigned structure. Super administrators have cross-structure administration.
- An approver cannot approve their own reimbursement. Approved financial records are locked; corrections require an auditable reopening or adjustment process. Permanent deletion is excluded from ordinary workflows until retention policy is defined.
- Use company SSO if it is available and authorized. Otherwise, use single-use account activation, administrator MFA, and session revocation on account recovery or deactivation. Do not invent secrets or email settings.
- Company IT operates certificates, production updates, backups, recovery, and alerts, with a documented developer handover.
- Use applicable OWASP ASVS Level 2 requirements as the verification target, mapped to the current OWASP Top 10.

## Code review summary

The application uses React/Vite, NestJS/Express, Prisma, and PostgreSQL. Global request validation is already configured. Prisma query APIs are used in reviewed code, and no obvious raw SQL injection path was found. Normal React rendering is used; an ECharts tooltip still needs review. No user-controlled server-side URL fetch path was identified in reviewed code. These are review observations, not proof that the attack classes are absent.

Confirmed critical/high findings include unguarded user creation, updates and spreadsheet import; unauthenticated mission, reimbursement, and user-detail routes; password hashes in raw user responses; access JWT expiration disabled; archived users accepted by JWT validation; predictable initial passwords; ID-only mission updates and downloads without ownership checks; and unbounded spreadsheet parsing. CORS has a localhost allowlist, Swagger is enabled in configuration, no security-header middleware was found, and configuration has no startup validation. See source findings in the related controllers and services before each remediation.

## Delivery plan

### Phase 0: Baseline and exposure containment

Status: done — deny-by-default guards, token expiry, archived-account rejection, users-module scoping and hash-free user responses (commit `d650725`). The HTTP-level integration tests move to issue 01/03.

- Require JWT authentication by default. Keep only login, refresh, logout, and root status explicitly public.
- Restore JWT expiry validation and reject archived accounts.
- Apply role checks to management operations and ensure controller-level role metadata is honored.
- Exclude password hashes from all user API responses.
- Add integration coverage for anonymous access, public exceptions, expiry, archived accounts, roles, and response secret filtering.

### Phase 1: Identity and session lifecycle

- Decide SSO integration from company IT availability; otherwise implement activation and recovery workflows without predictable credentials.
- Require TOTP MFA for administrators and super administrators (issue 04).
- Use distinct, required access and refresh secrets with explicit token purpose, issuer, audience, and algorithm checks.
- Rotate refresh sessions with server-side revocation and reuse detection. Revoke sessions on logout, password change/reset, archive, and role change.
- Add login and recovery throttling, generic authentication errors, and a documented password policy.
- Validate production-required environment settings on startup. Obtain secret values through company IT; never commit them.

### Phase 2: Authorization and financial integrity

- Implement a default-deny action/resource matrix for USER, ADMIN, and SUPER_ADMIN.
- Enforce ownership and structure scope inside service queries for detail, update, delete, download, export, analytics, import, archive, and bulk operations.
- Prevent self-approval. Lock approved fields and provide an audited correction path.
- Restrict role changes and global configuration to super administrators; prohibit mass assignment with dedicated runtime DTOs and explicit service allowlists.
- Return safe response projections for every model, not just users.

### Phase 3: Request, browser, and file protections

- Configure exact production CORS origins from deployment config; reject wildcard or reflected origins with credentials.
- Add Helmet and a tested Content Security Policy. Confirm cookie flags and add Origin/CSRF protections to cookie-authenticated refresh/logout flows.
- Bound request bodies and upload size, type, row count, parser time, and memory. Validate spreadsheet contents, make imports atomic, await processing, and log no sensitive cell values.
- Review every dynamic HTML/chart/PDF/export sink. Keep output encoding contextual; do not rely on input filtering as XSS protection.
- Preserve Prisma parameterization. Review any future raw SQL and user-controlled outbound network calls; apply network egress restrictions for SSRF containment.

### Phase 4: Deployment and ongoing assurance

- Disable or restrict Swagger in production, add health/readiness behavior, graceful shutdown, least-privilege database credentials, and network segmentation.
- Add explicit Pino redaction for authorization headers, cookies, passwords, tokens, and sensitive request fields. Remove request-body logging of mission data.
- Add CI checks for lint/build, dependency and secret scanning, migration review, and security integration tests. Standardize the authoritative lockfile and verify a clean production install.
- Document certificate renewal, backup encryption, restore drills, patch cadence, incident response, access reviews, and audit log retention with company IT.
- Complete an ASVS Level 2 verification checklist and an authorized pre-production security assessment before go-live.

## Release gates

Do not deploy with anonymous access to business data or mutation routes, broken authentication/session revocation, cross-user or cross-structure access, secrets in responses/logs, unbounded imports, missing HTTPS, or unresolved critical/high security findings. Every authorization rule must have positive and negative tests at the HTTP/service boundary.

## Environment inputs required from company IT

- LAN production hostname and HTTPS termination/proxy topology.
- Exact browser origin(s), trusted proxy behavior, and certificate ownership.
- SSO provider and permitted protocol/client registration, if available.
- Secret-manager mechanism and required JWT/database secret provisioning.
- Email delivery or administrator-assisted account activation procedure.
- Data retention, backup location, recovery objectives, audit retention, and incident contact.
