# 02 — Foundation: config validation, headers, log redaction, tooling

Status: ready-for-agent
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
