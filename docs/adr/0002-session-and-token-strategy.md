# 0002 — Short-lived in-memory access token, revocable refresh sessions

Status: accepted (2026-09-27)

## Context

Before this decision, sessions worked like this:

- The access JWT lasted 7 days and, until the baseline fix, was never checked for expiry.
- The client persisted it to `localStorage` through redux-persist.
- The refresh token shared the access secret, and logout revoked nothing.
- Production is same-origin (nginx serves the client and proxies `/api`) on the company network.

## Decision

- **Access token:**
  - HS256 JWT, 15 minutes, with `iss`/`aud`, sent as `Authorization: Bearer`.
  - Kept **only in memory** on the client; never persisted.
  - The server re-reads the user's role and status from the database on every request, and rejects tokens issued before `passwordChangedAt`.
- **Refresh token:**
  - Separate secret (`JWT_REFRESH_SECRET`, required, ≥ 32 bytes).
  - Sent in an `httpOnly; Secure; SameSite=Strict; Path=/api/auth` cookie.
  - Stored **hashed** in a `Session` table, with a `familyId` for rotation.
  - Reusing a rotated token revokes the whole family.
  - Logout, a password change or reset, deactivation and archiving revoke the user's sessions.
- **CSRF:** API calls carry no cookie, so they are not CSRF-able. `/auth/refresh` and `/auth/logout` additionally check `Origin` against `APP_PUBLIC_URL`.
- **MFA:** ADMIN and SUPER_ADMIN must pass TOTP MFA at login. Company SSO can replace local passwords and MFA later if IT provides it.
- **Throttling:** login is rate-limited per IP and per account, with backoff.

## Consequences

- A page reload restores the session through `/auth/refresh`. The client needs a single-flight refresh in its HTTP interceptor.
- An XSS can no longer steal a long-lived token from storage (CSP is still required).
