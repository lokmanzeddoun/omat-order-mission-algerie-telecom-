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
