# 04 — Sessions, JWT hardening and admin MFA (A07, A02)

Status: ready-for-agent
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
