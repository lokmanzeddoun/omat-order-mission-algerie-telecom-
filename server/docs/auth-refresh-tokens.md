# Refresh Token Design — OMAT

Goal: implement a secure refresh token system to remove long-lived tokens from the client and allow short-lived access tokens with server-rotating refresh tokens.

Scope
- Server: add `RefreshToken` model to Prisma, endpoints for login, refresh, logout, and revocation.
- Client: store access token in memory (or Redux) and refresh token in an httpOnly, Secure cookie. Implement automatic token refresh logic in `client/src/helpers/http.ts`.
- Security: rotate refresh tokens on use, mark previous token as revoked, store a `hashedToken` in DB, include user agent/ip for auditing, set cookie flags `HttpOnly; Secure; SameSite=Lax`, use short lifetimes for access tokens (5-15m) and longer for refresh tokens (7-30d).

Data Model (Prisma)
- RefreshToken
  - id        Int @id @default(autoincrement())
  - tokenHash String
  - userMatricule Int
  - expiresAt DateTime
  - createdAt DateTime @default(now())
  - revoked   Boolean @default(false)
  - replacedBy Int? (reference to another RefreshToken.id)
  - ipAddress String?
  - userAgent String?

Steps
1. Add Prisma model `RefreshToken` and run `npx prisma migrate dev --name add-refresh-token`.
2. Create a `RefreshTokenService` in `server/src/auth/refresh-token.service.ts` to create, rotate, revoke tokens.
3. Update `AuthService` to issue access tokens and set refresh token cookie on login.
4. Add endpoint `POST /auth/refresh` to read the refresh token from cookie, validate, rotate, and return a new access token and set cookie with rotated refresh token.
5. Add `POST /auth/logout` to revoke refresh tokens and clear cookie.
6. Update global CORS and cookie options in `server/src/main.ts` to allow credentials from the client origin.
7. Update client `client/src/helpers/http.ts` to include `withCredentials: true`, attempt refresh once on 401, retry original request.
8. Add tests for token rotation, refresh, revoke flows.

Acceptance criteria
- Login response sets an httpOnly refresh cookie and returns accessToken in the JSON body.
- Refresh endpoint rotates the token and returns a fresh access token and new cookie.
- Revoked tokens cannot be used and cause logout.
- No tokens stored in `localStorage` after migration; update Redux persist config.

Migration notes
- Add migration file and apply in dev using `npm run setup:db` or `npx prisma migrate dev --name add-refresh-token`.
- Update `server/prisma/seed.ts` if you need to seed initial tokens for tests.

Rollout strategy
- Feature branch with server and client changes.
- Test in staging and migrate DB before deploying to production.

References
- OWASP: Token Based Authentication Cheat Sheet
- Prisma docs: storing hashed tokens
