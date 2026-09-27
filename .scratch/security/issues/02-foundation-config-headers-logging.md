# 02 — Foundation: config validation, headers, log redaction, tooling

Status: resolved
Type: task
Blocked by: 01

## Do

- **Env validation.** `ConfigModule.forRoot({ validate })` with a class-validator schema (`server/src/common/configs/env.validation.ts`). Boot must fail if:
  - `JWT_SECRET` or `JWT_REFRESH_SECRET` is missing or shorter than 32 bytes, or
  - `DATABASE_URL`, `NODE_ENV` or `APP_PUBLIC_URL` is missing.
  - Also validate `CORS_ORIGINS` and `TRUST_PROXY`.
  - Update `server/.env.example` and untrack `client/.env`.
- **`main.ts`:**
  - `helmet()`.
  - `trust proxy` driven by `TRUST_PROXY`.
  - Explicit JSON/urlencoded body limit (100 kb).
  - Decide on `setGlobalPrefix('api')` versus the Vite proxy stripping `/api`, and document the choice.
- **pino:**
  - Redact `req.headers.authorization`, `req.headers.cookie`, `res.headers["set-cookie"]` and `*.password`.
  - `pino-pretty` in development only.
  - Remove the DTO `console.log`/`console.error` calls (`missions.service.ts`, `missions.controller.ts`, `jwt.strategy.ts`, `users.service.ts`).
- **Exception filters:**
  - Global filters apply in reverse order. Verify that Prisma errors reach `PrismaClientExceptionFilter` and add a test.
  - Stop returning `error.message` (`missions.service.ts` remove) and P2002 field names.
- **Client:**
  - Redux `devTools: import.meta.env.DEV` (`client/src/store/index.ts`).
  - No production `console.info` in `client/src/helpers/http.ts`.
- **Tooling:**
  - Server lint is broken: the hoisted `@typescript-eslint` plugins don't match ESLint 8, and Node 16 has no `structuredClone`. Fix the lint.
  - Add `.nvmrc` (20 LTS) and `engines`.

## Tests

A smoke e2e test that checks:
- helmet headers are present,
- `/docs` returns 404 when `NODE_ENV=production`,
- boot rejects a missing or short secret,
- `authorization` never appears in a captured log line.

## Comments

**Resolved (security/02-foundation):**

- **Env validation:** `ConfigModule` validates the environment at boot (`env.validation.ts`); the error message explains how to generate secrets. `config.ts` is now a factory, so the environment is read at boot.
- **Headers:** helmet with a deny-all API CSP (off only while Swagger is on, in development). `TRUST_PROXY`. 100 kb JSON/urlencoded limits.
- **Filter order:** fixed. Nest applies global filters in reverse, so the catch-all used to swallow Prisma and HTTP errors. Body-parser 413 and 400 errors now keep their status. P2002 no longer names the column.
- **Logging:** pino redaction (`logger.ts`); `pino-pretty` in development only. The `console.*` calls in missions, décomptes, jwt, exercices and destination-validator are gone.
- **Server lint:** moved to ESLint 9 with a flat config.
- **Not yet clean:** lint still fails in files that later issues rewrite: auth (04), missions (03), users/structures (06, also being edited by the import-validation session), and the pdf formatting. Issue 08 makes lint a CI gate.
- **Node:** `.nvmrc` 20, `engines` >= 20.
- **Client:** DevTools and production `console.info` are gated to development. `client/.env` is untracked.
- **Tests:** `configure-app.spec.ts` (headers, Swagger, body limits, trust proxy, filter mapping, no internal-message leak), `env.validation.spec.ts`, `logger.spec.ts`.
- **Global prefix:** none. The Vite proxy and nginx both strip `/api`, and the refresh cookie `Path` is set from the browser's point of view (issue 04).
