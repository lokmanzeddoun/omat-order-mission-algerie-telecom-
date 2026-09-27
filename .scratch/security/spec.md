# Security hardening — OWASP Top 10

Goal: a deployable, defensible OMAT. Every OWASP Top 10 category is mapped to controls and to regression tests. We also apply the OWASP ASVS L2 requirements for authentication, sessions and access control (V2/V3/V4). Work ships as small ordered PRs. Each PR is one issue under `issues/`.

Decisions: [ADR 0001 access control](../../docs/adr/0001-access-control-policy.md), [ADR 0002 sessions](../../docs/adr/0002-session-and-token-strategy.md). Background and the go-live conditions: [docs/security/SECURITY_PLAN.md](../../docs/security/SECURITY_PLAN.md).

## Assumptions

- **Production:** same origin on the company network. nginx serves the client under `/omat` and proxies `/api`, behind HTTPS. CORS is off by default.
- **Main threat:** an insider going beyond their role.
- **Law 18-07:**
  - Personal data is kept to a minimum in logs.
  - An audit trail records who did what.
  - Retention periods are documented.
- **Deployment artifacts:** Docker images, compose, an nginx config and GitHub Actions CI, handed over to company IT.

## Top 10 → control → issue

| OWASP 2021 | Controls | Issue |
|---|---|---|
| A01 Broken access control | Deny-by-default guards (done). `AccessPolicy` scoping. No self-approval. Approved records locked. Class DTOs only. CSRF: Bearer header plus a SameSite=Strict refresh cookie and an Origin check. | 03, 04 |
| A02 Cryptographic failures | Separate secrets of ≥ 32 bytes. HS256 pinned. bcrypt cost 12. TLS and HSTS. | 02, 04, 05, 08 |
| A03 Injection (SQL, XSS, formula) | Prisma only, with a lint ban on raw/unsafe queries. React escaping, a lint ban on `dangerouslySetInnerHTML`, and a CSP. Spreadsheet cells escaped. | 06, 08 |
| A04 Insecure design | Separation of duties. Bounded amounts (`fees_transport`). `mustChangePassword`. | 03, 05 |
| A05 Security misconfiguration | Environment validation at boot. helmet. CORS allow-list. Swagger off in production. nginx headers. | 02, 08 |
| A06 Vulnerable components | exceljs in place of xlsx 0.18.5. Node LTS pinned. npm audit, Dependabot and CodeQL in CI. | 06, 08 |
| A07 Identification & authentication failures (JWT attacks) | 15-minute tokens. Session table with rotation and reuse detection. Admin MFA. Throttling. Password policy. | 04, 05 |
| A08 Software & data integrity | Validated, scoped imports. Images built in CI. | 06, 08 |
| A09 Logging & monitoring failures | Header/password redaction. Security events. AuditLog. | 02, 07 |
| A10 SSRF | No outbound HTTP today. Rule: any future fetch goes through an allow-listed client. | 08 (docs) |

## Order

01 e2e harness → 02 foundation → 03 access control → 04 sessions/JWT/MFA → 05 passwords → 06 files → 07 audit → 08 deployment.
Issue 03 is the biggest risk reduction. Issue 01 comes first because 03 and 04 are written test-first against it.

## Release gates (no go-live until all hold)

- No anonymous access to business data.
- No cross-user or cross-structure access; the authorization-matrix e2e passes.
- Sessions are revocable. Admin MFA is on.
- No secrets in responses or logs.
- Imports are bounded and validated.
- HTTPS with security headers.
- No open high or critical `npm audit` / ZAP baseline findings.
