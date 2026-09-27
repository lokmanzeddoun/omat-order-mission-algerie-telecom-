# 04 — Sessions, JWT hardening and admin MFA (A07, A02)

Status: resolved
Type: task
Blocked by: 01, 02

See [ADR 0002](../../../docs/adr/0002-session-and-token-strategy.md).

## Do

- **Prisma:**
  - `Session { id, userMatricule, tokenHash, familyId, expiresAt, revokedAt, createdAt, userAgent, ip }`
  - `User.passwordChangedAt`
  - `User.mfaSecret` (encrypted at rest with a key from env)
  - `User.mfaEnabledAt`
- **`auth.module.ts`:** sign with `{ algorithm: 'HS256', expiresIn: '15m', issuer, audience }`.
- **`jwt.strategy.ts`:**
  - `algorithms: ['HS256']`, plus issuer and audience.
  - Reload the user and reject if `soft_delete`, `status !== ACTIVE`, or `iat < passwordChangedAt`.
  - Take the role from the database.
- **Login:**
  - Refuse INACTIVE or archived users (remove the auto-reactivate).
  - Compare against a dummy hash when the user is missing.
  - Uniform 401.
- **MFA:**
  - For ADMIN and SUPER_ADMIN, login returns an `mfa_required` challenge, and `POST /auth/mfa` completes it.
  - Enrolment through `otplib` with a QR code (`qrcode` is already a dependency).
  - Recovery codes, stored hashed.
- **Refresh:**
  - Verify with `JWT_REFRESH_SECRET` only.
  - Look up the session by hash and rotate it.
  - **Reuse → revoke the family.**
  - Role from the database.
- **Logout:** revoke the session.
- **Password change or reset:** revoke all of the user's sessions.
- Delete the dead `jwt-refresh.strategy.ts`.
- **Cookie:** `httpOnly`, `secure` in production, `sameSite: 'strict'`, `path: '/api/auth'`, `maxAge` from config.
- **Origin check** on refresh and logout.
- **`@nestjs/throttler`:**
  - Global limit.
  - Login limited to 5/min per IP and email.
  - Per-account backoff.
- **Client:**
  - Remove `auth` from the redux-persist whitelist.
  - Drop `localStorage.setItem('user', …)` (`auth.reducers.ts`) and the `token` localStorage read in `http.ts`.
  - Single-flight refresh that stores the new token in Redux.
  - MFA step on the sign-in page.

## Tests

- **Token attacks:** a token that is `alg:none`, tampered, signed with the wrong secret, expired, or a refresh token presented as an access token → 401.
- **Sessions:**
  - Refresh reuse revokes the family.
  - A password change kills old sessions.
- **Accounts:**
  - An inactive user can't log in.
  - An admin without MFA gets no token.
- **Throttling:** a burst of logins → 429.
- **Client:** after login and reload, there's no token in `localStorage` and the session is still alive (Playwright).

## Comments

**Resolved (security/04-sessions).** What differs from the plan:

- **Refresh tokens are opaque,** stored as an HMAC keyed with `JWT_REFRESH_SECRET`, instead of JWTs.
- **INACTIVE users are not refused.** `INACTIVE` means "never signed in", and the first sign-in activates the account. Archived users are refused at login, at refresh, and on every request.
- **Revocation:** a password change or reset stamps `passwordChangedAt`. That kills older access tokens (`iat`) and sessions (`createdAt`), so `users.service` needs no dependency on `SessionsService`.
- **Environment:** `MFA_ENCRYPTION_KEY` is new and required. `AUTH_MFA_REQUIRED=false` is allowed in development only. `AUTH_RATE_LIMIT` defaults to 5.
- **Node:** the client test stack (jsdom) needs Node ≥ 20.19. `.nvmrc` is now 24.
- **Tests:**
  - `test/sessions.e2e-spec.ts`: token attacks (none/other secret/expired/aud/iss/typ/refresh secret/forged role), MFA token as access, archived user, lockout, throttling, cookie flags, rotation, reuse → family revoked, logout, password change, Origin, MFA verify/replay/enroll/recovery/reset.
  - `client/src/helpers/http.test.ts`: single-flight refresh.
  - `client/e2e/session.spec.ts`: no token in storage (Playwright, needs the running stack).
