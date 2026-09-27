# OMAT - Order Mission Algeria Telecom

> **Ordre de Mission Algeria Telecom** - A comprehensive mission order and expense management system for Algeria Telecom employees.

## 🎯 Project Overview

OMAT is a modern web application designed to streamline the mission order process for Algeria Telecom. The system manages employee missions, expense reporting (decomptes), and administrative approval workflows. It automates the generation of official mission orders and provides a complete expense tracking system with built-in rate calculations.

## 🏗️ Architecture & Technologies

### Backend Stack
- **Framework**: [NestJS](https://nestjs.com/) - Progressive Node.js framework
- **Database**: [PostgreSQL](https://postgresql.org/) with [Prisma ORM](https://prisma.io/)
- **Authentication**: JWT-based authentication with role-based access control
- **Documentation**: [Swagger/OpenAPI](https://swagger.io/) integration
- **File Processing**: Document generation (PDF), Excel import/export
- **Validation**: Class-validator for request validation
- **Logging**: Pino logger for structured logging

### Core Dependencies
```json
{
  "@nestjs/core": "^10.0.0",
  "@nestjs/jwt": "^10.2.0",
  "@nestjs/passport": "^10.0.3",
  "@prisma/client": "5.19.1",
  "@react-pdf/renderer": "^4.9.0",
  "moment": "^2.30.1",
  "bcryptjs": "^2.4.3"
}
```

## 🔧 System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │───▶│   NestJS API    │───▶│   PostgreSQL    │
│   (Client)      │    │   (Backend)     │    │   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   File System   │
                       │  (PDF/Excel)    │
                       └─────────────────┘
```

## 📊 Database Schema

### Core Entities

1. **User** - Employee information and authentication
   - Matricule (ID), credentials, role, category, grade
   - Belongs to a Structure (department)

2. **Structure** - Organizational departments
   - DG, DRH, DT, DC, DF, DI

3. **Mission** - Mission orders
   - Travel details, status, user assignment
   - Automatic PDF generation

4. **Decompte** - Expense reports
   - Meals, accommodation, travel expenses
   - Automatic calculation based on Barem rates

5. **Barem** - Rate tables
   - Different rates for employee categories
   - North/South direction variations

6. **Commentaire** - Administrative messages
   - Approval/rejection reasons
   - Communication between users and admins

### Relationships
```
User ─────────────────▶ Structure (Many-to-One)
User ─────────────────▶ Mission (One-to-Many)
Mission ──────────────▶ Decompte (One-to-Many)
Decompte ─────────────▶ Commentaire (One-to-Many)
User ─────────────────▶ Commentaire (One-to-Many)
Barem ────────────────▶ Category (Enum)
```

## 🌊 Data Flow

### 1. Authentication Flow
```
Login Request → JWT Verification → Role-based Access → API Access
```

### 2. Mission Creation Flow
```
User Creates Mission → PDF Generation → Admin Review → Status Update
```

### 3. Expense Reporting Flow
```
Mission Completion → Decompte Creation → Rate Calculation → Admin Approval
```

### 4. Rate Calculation Logic
```
Employee Category → Barem Lookup → Direction (N/S) → Transport Type → Final Amount
```

## 🔒 Security & Authorization

### Role-Based Access Control (RBAC)
- **SUPER_ADMIN**: Full system access
- **ADMIN**: Department management, approvals
- **USER**: Personal missions and expense reports

### Authentication Features
- JWT token-based authentication
- Password hashing with bcrypt
- Role-based route protection
- Refresh token support

## 🏢 Core Components

### 1. Authentication Module (`/auth`)
- **Features**: Login, token refresh, password management
- **Guards**: JWT authentication, role-based access
- **Decorators**: `@Auth()`, `@GetUser()`

### 2. User Management (`/users`)
- **Features**: CRUD operations, Excel import, password changes
- **Services**: User service with validation and hashing
- **DTOs**: Create user, import Excel, change password

### 3. Mission Management (`/missions`)
- **Features**: Mission CRUD, PDF generation, status tracking
- **Document Generation**: Automatic mission order PDFs
- **Services**: Mission creation, document templating

### 4. Expense Management (`/decompte`)
- **Features**: Expense report CRUD, automatic calculations
- **Rate Engine**: Dynamic calculation based on employee category
- **Validation**: Business rules for meals and accommodation

### 5. Rate Management (`/barem`)
- **Features**: Rate table management by category
- **Categories**: EXECUTION_MAITRISE, CADRE, CADRE_SUPERIEUR
- **Variations**: North/South direction rates

### 6. Structure Management (`/structures`)
- **Features**: Department/service management
- **Import/Export**: Excel support for bulk operations
- **Hierarchy**: Organizational structure tracking

## 🔄 Business Logic

### Expense Calculation Engine
```typescript
// Automatic calculation based on:
1. Employee Category (from Barem)
2. Mission Direction (North/South)
3. Transport Type (affects km reimbursement)
4. PEC vs Non-PEC expenses (25% reduction for PEC)
```

### Document Generation
- **Engine**: `@react-pdf/renderer`, rendered natively in Node (no Word, no LibreOffice)
- **Layout**: React components in `src/pdf/documents/` (ordre: 2 pages, décompte: 1 page)
- **Data**: pure mappers in `src/pdf/mappers/` turn Prisma records into printable strings
- **Assets**: Inter fonts in `src/pdf/fonts/` (copied to `dist` by `nest build`), vector logo
- **QR code**: both documents carry a QR code linking to `<APP_PUBLIC_URL>/scan/<ordre|decompte>/<id>`. The client forwards it to the right detail page after sign-in (login required). Set `APP_PUBLIC_URL` to the LAN address phones can reach; when it is empty, no QR is printed
- **Preview**: `npx ts-node -r tsconfig-paths/register scripts/render-sample-pdfs.ts <outDir>`

### Validation Rules
- **Mission Dates**: Logical date validation
- **Expense Limits**: Business rule enforcement
- **User Permissions**: Role-based operation restrictions
- **Data Integrity**: Cross-entity validation

## 🚀 API Endpoints

### Authentication
- `POST /auth/login` - User authentication
- `POST /auth/refresh` - Token refresh

### Users
- `GET /users` - List all users
- `POST /users` - Create user
- `PATCH /users/:id` - Update user
- `POST /users/upload` - Excel import

### Missions
- `GET /missions` - List missions
- `POST /missions` - Create mission (generates PDF)
- `GET /missions/user` - User's missions
- `GET /missions/:id/download` - Download mission PDF

### Expense Reports
- `GET /decompte` - List expense reports
- `POST /decompte/:missionId` - Create expense report
- `PATCH /decompte/:id` - Update expense report
- `GET /decompte/user` - User's expense reports

### Administration
- `GET /structures` - List departments
- `GET /barem` - List rate tables
- `POST /barem` - Create/update rates

## 📱 Features Implemented

### ✅ User Management
- Role-based authentication (Super Admin, Admin, User)
- Employee profile management
- Department assignment
- Excel import for bulk user creation
- Password management

### ✅ Mission Orders
- Mission creation with automatic PDF generation
- Status tracking (In Progress, Completed)
- Multi-transport type support
- Direction-based calculations (North/South)
- Soft delete functionality

### ✅ Expense Management
- Automatic expense calculation
- Rate-based reimbursement (by employee category)
- PEC vs non-PEC expense tracking
- Approval workflow
- Comment system for rejections

### ✅ Administrative Features
- Rate table management
- Department structure management
- Bulk operations via Excel
- Comprehensive reporting
- Audit trails

### ✅ Document Generation
- Automatic mission order PDF creation
- Native PDF rendering with @react-pdf/renderer (~100 ms per document)
- Downloadable mission orders

### ✅ API Documentation
- Complete Swagger/OpenAPI documentation
- Interactive API testing
- Authentication integration
- Schema definitions

## 🔧 Development Setup

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Git

### Quick Start
```bash
# Clone repository
git clone <repository-url>
cd server

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database configuration

# Database setup and seeding
./setup-db.sh

# Start development server
npm run start:dev
```

### Environment Configuration
```env
DATABASE_URL="postgresql://username:password@localhost:5432/omat_mission_db"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
PORT=8000
NODE_ENV="development"
```

### Database Management
```bash
# Run migrations
npx prisma migrate deploy

# Seed with test data
npm run db:seed

# Reset database
npx prisma migrate reset
```

## 📖 API Documentation

Once the application is running, access the interactive Swagger documentation at:
```
http://localhost:8000/docs
```

Features:
- Complete API endpoint documentation
- Interactive testing interface
- Authentication integration
- Request/response schemas
- Example data

## 🔐 Test Credentials

The seeded database includes test accounts:

| Role        | Email                            | Password    | Department |
| ----------- | -------------------------------- | ----------- | ---------- |
| Super Admin | superadmin@algérietelecom.dz     | password123 | DG         |
| Admin       | ahmed.benali@algérietelecom.dz   | password123 | DRH        |
| User        | karim.mansouri@algérietelecom.dz | password123 | DT         |

## 📊 Database Seeding

The application includes comprehensive test data:
- 6 organizational structures
- 8 users with different roles
- 4 sample missions
- 4 expense reports with various statuses
- 3 rate tables for different employee categories

## 🛠️ Development Scripts

```bash
# Development
npm run start:dev          # Start with hot reload
npm run start:debug        # Start with debugging

# Building
npm run build              # Build for production
npm run start:prod         # Start production build

# Database
npm run db:seed            # Seed test data
./setup-db.sh             # Full database setup

# Testing
npm run test               # Unit tests
npm run test:e2e          # End-to-end tests
npm run test:cov          # Coverage report

# Code Quality
npm run lint               # ESLint
npm run format            # Prettier formatting
```

## 🤝 Contributing

1. Follow the existing code structure and patterns
2. Use proper TypeScript types and interfaces
3. Include proper validation and error handling
4. Update documentation for new features
5. Test your changes thoroughly

## 📄 License

This project is private and proprietary to Algeria Telecom.

---

**OMAT** - Streamlining mission management for Algeria Telecom 🇩🇿

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
