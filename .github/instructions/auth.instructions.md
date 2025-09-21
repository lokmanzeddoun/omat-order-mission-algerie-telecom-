---
applyTo: '**/*.ts'
---
# Auth Instructions — OMAT monorepo
 the project is a monorepo with two workspaces: `client/` (React + Vite + TS) and `server/` (NestJS + Prisma).
    the server uses JWT-based authentication; front-end stores `token` and `user` in local
    storage and Redux. Routes are protected with `ProtectedRoute`.
    the server uses NestJS pipes/filters globally in `server/src/main.ts` (ValidationPipe, PrismaClientExceptionFilter). New controllers should use DTOs and validation decorators.
    the API client uses `axios` instance in `client/src/helpers/http.ts` and expects `/api` base in dev. Use that helper for requests.
    Prisma IDs: `User.matricule` is primary key (Int) and `Structure.code` is String primary key. Use these when composing relations.
    Use seeded accounts described in `server/DEVELOPMENT.md` (`superadmin@algérietelecom.dz` / `password123`) for auth flows.
    If front-end requests 401/403 in dev, check Vite proxy (`/api` -> `VITE_API_URL`) and server CORS whitelist in `server/src/main.ts`.
    When making changes to DB schema:
    1. Update `server/prisma/schema.prisma`.
    2. Run `npx prisma migrate dev --name describe_change` (or use `npm run setup:db` in dev flows).
    3. Update seed data in `server/prisma/seed.ts` if needed.
    Example request (login): `POST /auth/login` body: `{ "email": "superadmin@algérietelecom.dz", "password": "password123" }` (see `server/DEVELOPMENT.md`).
The missing parts are:
- the auth doesn't extend to refresh tokens and password resets.
- the project it store presist user sessions in local storage and redux. which is not the most secure way to store tokens.
- the project doesn't have role based access control implemented.
- the loading of dashboard and other protected routes is not optimized for performance, and it has flaw which it is showing the login page before redirecting to the dashboard.
- if you find any other critical missing parts please open an issue and link the changed files.
- please make implmenting each missing part a separate PR.
- ask for missing env values instead of guessing secrets.
- files worth inspecting for further context: `client/src/store`, `server/src/auth`, `server/src/prisma-client-exception`.
- for full documentation visit the full readme file [README.MD](../README.md) .
- use context7 to get docs for relevant libraries and frameworks.
- start implementing the missing parts one by one. starting with the most critical ones.
- implment the missing parts in both the client and server side.
