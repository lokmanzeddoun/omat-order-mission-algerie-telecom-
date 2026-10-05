# Database Seeding

This project includes a comprehensive database seeding script to populate the application with test data.

## What's included in the seed data:

### 🏢 Structures (6 departments)
- Direction Générale (DG)
- Direction des Ressources Humaines (DRH)
- Direction Technique (DT)
- Direction Commerciale (DC)
- Direction Financière (DF)
- Direction Informatique (DI)

### 💰 Barem (Rate tables for 3 categories)
- EXECUTION_MAITRISE: Lower rates for meals, accommodation, and travel
- CADRE: Medium rates for managers
- CADRE_SUPERIEUR: Higher rates for senior management

### 👥 Users (8 users with different roles)
- 1 Super Admin
- 2 Admins (DRH and DT)
- 5 Regular users across different departments

**Default password for all users: `password123`**

### 🎯 Missions (4 test missions)
- Mix of completed and in-progress missions
- Different destinations (Oran, Tamanrasset, Constantine, Ouargla)
- Various transport types and directions (North/South)

### 📊 Decomptes (4 expense reports)
- Different statuses: ACCEPTED, PENDING, REJECTED
- Realistic expense amounts and travel distances

### 💬 Commentaires (3 comments)
- Administrative comments on expense reports
- Different message types

## How to run the seed:

### Option 1: Using npm script
```bash
npm run db:seed
```

### Option 2: Using Prisma directly
```bash
npx prisma db seed
```

### Option 3: Using ts-node directly
```bash
npx ts-node prisma/seed.ts
```

## Test Login Credentials:

| Role        | Email                             | Password    | Department |
| ----------- | --------------------------------- | ----------- | ---------- |
| Super Admin | superadmin@algérietelecom.dz      | password123 | DG         |
| Admin       | ahmed.benali@algérietelecom.dz    | password123 | DRH        |
| Admin       | fatima.zemri@algérietelecom.dz    | password123 | DT         |
| User        | karim.mansouri@algérietelecom.dz  | password123 | DT         |
| User        | amina.khelifi@algérietelecom.dz   | password123 | DT         |
| User        | omar.boudjemaa@algérietelecom.dz  | password123 | DC         |
| User        | leila.hamidi@algérietelecom.dz    | password123 | DF         |
| User        | youcef.benaissa@algérietelecom.dz | password123 | DI         |

## Big hierarchy dataset (`npm run db:seed:big`)

`db:seed` + `db:seed:hierarchy` + `db:seed:demo` in one go (~40 s). On top of the base data above:

- **74 structures** in 3 directions of 3 levels, with HR-style codes: `13C…` Sous Direction Commerciale Tlemcen (the real extract in `test-imports/structures/structures-hr.csv`), `31C…` Direction Opérationnelle Oran (`DOO / …`), `16C…` Direction Opérationnelle Alger Centre (`DOAC / …`).
- **~1,000 users** (matricules from 10001), 7–25 per structure, a few inactive or archived.
- **Responsables**: most structures have one, with role ADMIN and email `resp.<code>@algérietelecom.dz` (e.g. `resp.13c0000000@…` for Tlemcen, `resp.31ca010000@…` for ACTEL ORAN EST). Left without one on purpose: each Support Commercial department, one ACTEL per direction and every third leaf (visible only to the admins above). `adjoint.<code>@…` are ADMINs who are not responsables (one per direction root, one in the ACTEL without a responsable).
- **~3,000 ordres de mission** and their décomptes, reviewed by an admin above the traveller.

The full list (structure, parent, responsable, admins, user count) is written to `test-imports/hierarchy-seed/accounts.csv`. Every password is `password123`. `db:seed:hierarchy` alone is re-runnable: it replaces its own structures and users.

## Important Notes:

⚠️ **Warning**: The seed script will **DELETE ALL EXISTING DATA** before inserting new data. Only run this in development environments!

🔐 **Security**: All users have the same password (`password123`) for testing purposes. Change this in production!

📧 **Email Format**: Using Algeria Telecom email format (@algérietelecom.dz)

🏷️ **Categories**: Users are assigned to different categories (EXECUTION_MAITRISE, CADRE, CADRE_SUPERIEUR) which affect their expense rates.
