# End-to-end tests

Playwright runs against a locally running stack, using the installed Google Chrome (`channel: 'chrome'`).

1. Database: a Postgres reachable through `DATABASE_URL`, migrated and seeded (`npm run seed:db`).
2. API: `npm run start:dev --workspace=server` (set `PORT` if 8000 is taken).
3. Client: `npm run dev --workspace=client` (point `VITE_API_URL` at the API).
4. `npm run test:e2e --workspace=client` (override the app URL with `E2E_BASE_URL`).

Screenshots of every route are written to `e2e/.screens/` for visual review.
