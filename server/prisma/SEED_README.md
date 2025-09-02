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

## Important Notes:

⚠️ **Warning**: The seed script will **DELETE ALL EXISTING DATA** before inserting new data. Only run this in development environments!

🔐 **Security**: All users have the same password (`password123`) for testing purposes. Change this in production!

📧 **Email Format**: Using Algeria Telecom email format (@algérietelecom.dz)

🏷️ **Categories**: Users are assigned to different categories (EXECUTION_MAITRISE, CADRE, CADRE_SUPERIEUR) which affect their expense rates.
