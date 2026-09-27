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
  - An **opaque** random value, `<session id>.<secret>`, not a JWT. The database stores only `HMAC-SHA256(JWT_REFRESH_SECRET, secret)`, so a leaked `Session` table yields no usable token.
  - Sent in an `httpOnly; Secure; SameSite=Strict; Path=/api/auth` cookie.
  - Stored **hashed** in a `Session` table, with a `familyId` for rotation.
  - Reusing a rotated token revokes the whole family. The exception is a replay within 30 s of the rotation, which is treated as two tabs refreshing at once. The client also refreshes single-flight.
  - Logout, a password change or reset, deactivation and archiving revoke the user's sessions.
- **CSRF:** API calls carry no cookie, so they are not CSRF-able. `/auth/refresh` and `/auth/logout` additionally check `Origin` against `APP_PUBLIC_URL`.
- **MFA:** ADMIN and SUPER_ADMIN must pass TOTP MFA at login.
  - The password step returns only a 5-minute `mfaToken` (audience `omat-mfa`), never a session.
  - Secrets are AES-256-GCM encrypted with `MFA_ENCRYPTION_KEY`.
  - A code is accepted once per 30 s step.
  - Ten single-use recovery codes are issued, stored as sha256.
  - A SUPER_ADMIN can reset an admin's MFA.
  - Company SSO can replace local passwords and MFA later if IT provides it.
- **Account status:** `INACTIVE` means "never signed in", and the first sign-in activates the account. Archived (`soft_delete`) accounts cannot sign in or use existing tokens.
- **Throttling:**
  - Credential routes are limited to 5/min per IP *and* account, so employees behind one NAT address don't lock each other out.
  - Everything else is limited to 300/min per IP.
  - From the 5th consecutive failure the account locks for 1, 2, 4… minutes, up to 60.

## Consequences

- A page reload restores the session through `/auth/refresh`. The client needs a single-flight refresh in its HTTP interceptor.
- An XSS can no longer steal a long-lived token from storage (CSP is still required).
