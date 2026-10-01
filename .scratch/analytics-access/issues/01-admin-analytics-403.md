# ADMIN gets 403 on the Analytics page; `/analytics` is unscoped

Status: needs-triage

The nav (`client/src/routes/navigation.ts`) and the route shell (`client/src/routes/router.tsx`) show Analytics to ADMIN and SUPER_ADMIN. But `GET /analytics` (`server/src/analytics/analytics.controller.ts`) is `@Auth('SUPER_ADMIN')`, so for an ADMIN the KPIs and charts fail with 403. Only the monthly décomptes recap loads, because `GET /analytics/monthly` is ADMIN + SUPER_ADMIN.

ADR 0001 says an ADMIN's analytics are per-structure, but `AnalyticsService.getAnalytics` ignores the caller and applies no `AccessPolicy` scope.

Fix: open `GET /analytics` to ADMIN and merge `accessPolicy.scopeMissions/scopeDecomptes(actor)` into every query, the same way `getMonthlyRecap` does. Then add e2e cases like the ones in `server/test/analytics.e2e-spec.ts`.
