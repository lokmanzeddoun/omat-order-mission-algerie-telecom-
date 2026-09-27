# 01 — e2e harness against a real database

Status: ready-for-agent
Type: task

Access-control and session tests (issues 03 and 04) need real JWTs and a real database. The only e2e test today is the Nest scaffold (`server/test/app.e2e-spec.ts`, `GET /` → "Hello World!").

## Do

- Add `server/test/setup/`:
  - A test Postgres. Locally it comes from `DATABASE_URL_TEST`; in CI it is a docker service.
  - `prisma migrate reset --force --skip-seed` before the run.
  - A fixture seeding two structures (A, B), each with a USER and an ADMIN, plus one SUPER_ADMIN. Each USER gets one ordre de mission and one décompte.
- Add a `loginAs(role, structure)` helper that goes through `POST /auth/login` and returns the Bearer token plus the refresh cookie.
- Boot `AppModule` the same way `main.ts` does. Extract a `configureApp(app)` from `main.ts` so the pipes, filters, CORS and cookie-parser setup are shared.
- Replace the scaffold test with:
  - Anonymous `GET /missions` → 401.
  - `POST /auth/login` → 200 with a token.
- Keep `src/common/testing/http-app.ts` for fast controller-level role tests.

## Done when

`npm run test:e2e` passes locally against the test DB, and the fixture and helper are documented in `server/DEVELOPMENT.md`.
