<!--
This file provides concise, repository-specific guidance for AI coding agents (Copilot-like assistants).
Keep it short (20-50 lines) and focused on actionable details that speed up contributions.
-->

# Copilot Instructions — OMAT monorepo

Purpose: Give an AI assistant immediate, actionable knowledge to be productive in this monorepo.

- Project layout: monorepo with two workspaces: `client/` (React + Vite + TS) and `server/` (NestJS + Prisma).
- Entry points:
  - Server: `server/src/main.ts` (Nest bootstrap, Swagger enabled via config).
  - Client: Vite entry is `client/src/main.tsx` and routing under `client/src/routes`.

- Important files to reference for behaviour and patterns:
  - `server/DEVELOPMENT.md` — DB setup, migrations, seeds, and test accounts (single source for DB workflows).
  - `server/prisma/schema.prisma` — canonical data model (User, Structure, Mission, Decompte, Barem, Exercice).
  - `client/vite.config.ts` and `client/src/helpers/http.ts` — dev proxy: client calls `/api` (proxied to server), production uses `VITE_API_URL`.
  - `client/src/ProtectedRoute.tsx` — auth gating pattern (uses Redux auth slice; token + isAuthenticated check). See `store/rootReducer.ts`.

- Build / dev / test commands (copy-pasteable):
  - Install: `npm install` (root workspace installs client & server)
  - Start both dev servers: `npm run dev`
  - Server dev only: `npm run dev:server`
  - Client dev only: `npm run dev:client`
  - Setup DB (generate, migrate, seed): `npm run setup:db` (root proxy to `server/setup:db`)
  - Reset & reseed (Prisma): `npx prisma migrate reset` then `npm run db:seed`
  - Build both: `npm run build`

- Coding conventions and patterns observed (be specific):
  - API client uses `axios` instance in `client/src/helpers/http.ts` and expects `/api` base in dev. Use that helper for requests.
  - Server uses NestJS pipes/filters globally in `server/src/main.ts` (ValidationPipe, PrismaClientExceptionFilter). New controllers should use DTOs and validation decorators.
  - Auth: JWT-based; front-end stores `token` and `user` in localStorage and Redux. Routes are protected with `ProtectedRoute`.
  - Prisma IDs: `User.matricule` is primary key (Int) and `Structure.code` is String primary key. Use these when composing relations.

- Testing and troubleshooting tips:
  - Use seeded accounts described in `server/DEVELOPMENT.md` (`superadmin@algérietelecom.dz` / `password123`) for auth flows.
  - If front-end requests 401/403 in dev, check Vite proxy (`/api` -> `VITE_API_URL`) and server CORS whitelist in `server/src/main.ts`.

- When making changes to DB schema:
  1. Update `server/prisma/schema.prisma`.
  2. Run `npx prisma migrate dev --name describe_change` (or use `npm run setup:db` in dev flows).
  3. Update seed data in `server/prisma/seed.ts` if needed.

- Quick examples to copy into PR descriptions or tests:
  - Example request (login): `POST /auth/login` body: `{ "email": "superadmin@algérietelecom.dz", "password": "password123" }` (see `server/DEVELOPMENT.md`).

If something seems missing (CI scripts, environment differences, or conventions), open an issue and link the changed files. Ask for missing env values instead of guessing secrets.

Files worth inspecting for further context: `client/src/store`, `server/src/auth`, `server/src/prisma-client-exception`.


## Language Policy

All instructions and prompts in this repository must be written in English. This applies to:
- All rule and instruction files in `.github/instructions/`
- All prompt files in `.github/prompts/`
- All documentation and code comments intended for contributors

## Development code generation

- This is monorepo project which have two apps client for the frontend and server for the api for full documentation visit the full readme file [README.MD](../README.md) .
- for the client we use mui with react and vite for building , the project is derived from a template anything you will design consider using pre built in component .
- for the server is built using nest js as rest api with postgres as main db and prisma as orm .
- for every major feature consider checkout new branch
- don't generate markdown file illustrating the new feature .
- when a feature is demanded or fix looks both in client and server
- don't run any command if you would than tell me
### Workflow implementation
1. when starting new feature consider starting with api implmentation than go for the ui development and integration .
2. after finishing the feature you can create an md file illustrating with mermaid diagram what've you do inside the docs folder at the root of the project