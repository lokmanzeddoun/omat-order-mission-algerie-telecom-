# OMAT Mission Development Guide

## Quick Start

### 1. Database Setup

Before running the application, you need to set up the database:

```bash
# 1. Copy environment variables
cp .env.example .env

# 2. Edit .env and set your DATABASE_URL
# Example: DATABASE_URL="postgresql://username:password@localhost:5432/omat_mission_db"

# 3. Run the setup script
./setup-db.sh
```

### 2. Manual Setup (Alternative)

If you prefer to set up manually:

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database with test data
npm run db:seed
```

### 3. Start Development Server

```bash
npm run start:dev
```

## Database Management

### Seeding

The application includes a comprehensive seed script with:

- 6 Structures (departments)
- 3 Barem entries (rate tables)
- 8 Users (1 super admin, 2 admins, 5 users)
- 4 Missions (various statuses)
- 4 Decomptes (expense reports)
- 3 Commentaires (messages)

```bash
# Seed database
npm run db:seed

# Or using Prisma directly
npx prisma db seed
```

### Database Reset

To reset and reseed the database:

```bash
# Reset database
npx prisma migrate reset

# This will:
# 1. Drop the database
# 2. Recreate it
# 3. Run all migrations
# 4. Run the seed script
```

### Migrations

```bash
# Create new migration after schema changes
npx prisma migrate dev --name describe_your_change

# Apply pending migrations
npx prisma migrate deploy

# Check migration status
npx prisma migrate status
```

## Test Data Overview

### User Accounts

| Role        | Email                             | Department | Category           |
| ----------- | --------------------------------- | ---------- | ------------------ |
| Super Admin | superadmin@algérietelecom.dz      | DG         | CADRE_SUPERIEUR    |
| Admin       | ahmed.benali@algérietelecom.dz    | DRH        | CADRE              |
| Admin       | fatima.zemri@algérietelecom.dz    | DT         | CADRE              |
| User        | karim.mansouri@algérietelecom.dz  | DT         | CADRE              |
| User        | amina.khelifi@algérietelecom.dz   | DT         | EXECUTION_MAITRISE |
| User        | omar.boudjemaa@algérietelecom.dz  | DC         | CADRE              |
| User        | leila.hamidi@algérietelecom.dz    | DF         | EXECUTION_MAITRISE |
| User        | youcef.benaissa@algérietelecom.dz | DI         | CADRE_SUPERIEUR    |

**All users have password: `password123`**

### Structures

- DG: Direction Générale
- DRH: Direction des Ressources Humaines
- DT: Direction Technique
- DC: Direction Commerciale
- DF: Direction Financière
- DI: Direction Informatique

### Missions

1. **Completed**: Installation équipements réseau à Oran (Karim)
2. **In Progress**: Maintenance serveurs Tamanrasset (Amina)
3. **Completed**: Réunion commerciale Constantine (Omar)
4. **In Progress**: Formation équipe développement Ouargla (Youcef)

### Expense Reports (Decomptes)

- Mission 1: ACCEPTED (4,500 DA)
- Mission 2: PENDING (6,200 DA)
- Mission 3: REJECTED (1,200 DA)
- Mission 4: PENDING (5,800 DA)

## API Testing

With the seeded data, you can test various endpoints:

### Authentication

```bash
POST /auth/login
{
  "email": "superadmin@algérietelecom.dz",
  "password": "password123"
}
```

### Users

```bash
GET /users
GET /users/1001
```

### Missions

```bash
GET /missions
GET /missions/1
```

### Decomptes

```bash
GET /decompte
GET /decompte/1
```

## Database Schema

The application uses the following main entities:

- **User**: Employee information with roles and categories
- **Structure**: Organizational departments
- **Mission**: Mission orders with travel details
- **Decompte**: Expense reports for missions
- **Commentaire**: Comments/messages on expense reports

New: Password-reset flow (admin mediated)

- Users can submit a forget-password request which creates a `Commentaire` of type `FORGET_PASSWORD` via `POST /comments`.
- Admins can list these via `GET /comments/admin` and reset a user's password via `POST /users/:id/reset-password` which returns a temporary password.

Database migration note:

- We made the `Commentaire.decompteId` optional to allow generic support tickets. Run a prisma migration after pulling these changes:
  1. npx prisma generate
  2. npx prisma migrate dev --name make-comment-decompte-optional

- **Barem**: Rate tables for different employee categories

## Development Tips

1. **Environment**: Always work in development mode with seeded data
2. **Database**: Use the seed script to reset data when testing
3. **Authentication**: Use the provided test accounts for different role testing
4. **Categories**: Test with different user categories to verify rate calculations
5. **Migrations**: Always create migrations when changing the schema

## Troubleshooting

### Database Connection Issues

- Check your DATABASE_URL in .env
- Ensure PostgreSQL is running
- Verify database credentials

### Seeding Fails

- Ensure database is accessible
- Check for existing data conflicts
- Run `npx prisma migrate reset` to clean start

### Missing Dependencies

```bash
npm install
npx prisma generate
```

## End-to-end tests

`npm run test:e2e` boots the whole `AppModule` over HTTP, configured by the same `configureApp()` as `main.ts`, against a real Postgres. It needs Node 20 (`nvm use`; see `.nvmrc`).

- **Database:** `DATABASE_URL_TEST`. If it is unset, your `DATABASE_URL` is reused with the database renamed to `omat_test`.
  - The run **resets that database** with `prisma migrate reset`.
  - It refuses any database whose name does not end in `_test`, so your dev data is never touched.
- **Fixture:** `test/setup/fixture.ts` → `seedFixture(prisma)`. It creates:
  - two structures, `STR_A` and `STR_B`,
  - a USER and an ADMIN in each, plus a SUPER_ADMIN,
  - one ordre de mission and one décompte per USER.
- **Logging in:** `loginAs(app, 'userA')` (`test/setup/app.ts`) goes through `POST /auth/login` and returns the Bearer header and the refresh cookie.
- **PDF rendering is faked in e2e.** react-pdf is ESM-only. The suites check who may download a PDF, not its content.
