# OMAT - Order Mission Algeria Telecom - Monorepo

🇩🇿 **OMAT** - A comprehensive mission management system for Algeria Telecom, now organized as a modern monorepo.

## 📁 Project Structure

```
omat-order-mission-algerie-telecom/
├── client/                 # React Frontend (Vite + TypeScript)
├── server/                 # NestJS Backend (Node.js + Prisma)
├── docs/                   # Documentation
├── package.json           # Root workspace configuration
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm >= 8.0.0
- PostgreSQL database

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/lokmanzeddoun/omat-order-mission-algerie-telecom-.git
   cd omat-order-mission-algerie-telecom-
   ```

2. **Install all dependencies:**
   ```bash
   npm install
   ```
   This will install dependencies for both client and server workspaces.

3. **Setup environment files:**
   ```bash
   # Server environment
   cp server/.env.example server/.env
   # Edit server/.env with your database configuration
   
   # Client environment (if needed)
   cp client/.env.example client/.env
   ```

4. **Setup database:**
   ```bash
   npm run setup:db
   ```

## 🛠️ Development

### Start Development Servers

```bash
# Start both client and server simultaneously
npm run dev

# Start only the server
npm run dev:server

# Start only the client
npm run dev:client
```

### Available Scripts

#### Root Level Commands
- `npm run dev` - Start both client and server in development mode
- `npm run build` - Build both client and server for production
- `npm run test` - Run tests for both workspaces
- `npm run lint` - Run linting for both workspaces
- `npm run clean` - Clean all node_modules and build artifacts

#### Client Commands
- `npm run dev:client` - Start client development server
- `npm run build:client` - Build client for production
- `npm run lint:client` - Lint client code

#### Server Commands
- `npm run dev:server` - Start server in development mode
- `npm run build:server` - Build server for production
- `npm run lint:server` - Lint server code
- `npm run setup:db` - Setup database with migrations and seed data
- `npm run seed:db` - Seed database with test data

## 🏗️ Workspace Configuration

This project uses **npm workspaces** to manage dependencies and scripts across multiple packages:

- **@omat/client** - React frontend application
- **@omat/server** - NestJS backend application

### Workspace Benefits
- **Unified dependency management** - Single package-lock.json
- **Cross-package scripting** - Run commands across workspaces
- **Simplified CI/CD** - Single build pipeline
- **Consistent tooling** - Shared development tools

### Working with Workspaces

```bash
# Install dependency in specific workspace
npm install package-name --workspace=client
npm install package-name --workspace=server

# Run script in specific workspace
npm run script-name --workspace=client
npm run script-name --workspace=server

# List workspace information
npm list --workspaces
```

## 📦 Package Management

All dependencies are managed at the workspace level:
- **Root dependencies**: Development tools (concurrently, etc.)
- **Client dependencies**: React, Vite, MUI, etc.
- **Server dependencies**: NestJS, Prisma, Swagger, etc.

## 🔧 Configuration Files

### Root Configuration
- `package.json` - Workspace configuration and unified scripts
- `.gitignore` - Git ignore patterns for the entire repository

### Client Configuration  
- `client/package.json` - Client-specific dependencies and scripts
- `client/vite.config.ts` - Vite configuration
- `client/tsconfig.json` - TypeScript configuration
- `client/eslint.config.js` - ESLint configuration

### Server Configuration
- `server/package.json` - Server-specific dependencies and scripts
- `server/nest-cli.json` - NestJS CLI configuration
- `server/tsconfig.json` - TypeScript configuration
- `server/.eslintrc.js` - ESLint configuration
- `server/prisma/schema.prisma` - Database schema

## 🗄️ Database Setup

The server uses Prisma ORM with PostgreSQL:

1. **Configure database URL** in `server/.env`:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/omat_mission_db"
   ```

2. **Run database setup**:
   ```bash
   npm run setup:db
   ```
   This will:
   - Generate Prisma client
   - Run database migrations
   - Seed test data

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Production Start
```bash
# Server
cd server && npm run start:prod

# Client (serve built files)
cd client && npm run preview
```

## 🏢 Application Features

### Server (Backend)
- **Authentication & Authorization** - JWT-based with role management
- **User Management** - CRUD operations for users and roles
- **Mission Management** - Create, track, and manage missions
- **Expense Management** - Track and approve mission expenses
- **Rate Management** - Configure rates by category and direction
- **Structure Management** - Organizational hierarchy management
- **API Documentation** - Swagger/OpenAPI documentation

### Client (Frontend)
- **Modern React** - Vite + TypeScript + Material-UI
- **State Management** - Redux Toolkit with persistence
- **Responsive Design** - Mobile-first approach
- **Data Visualization** - Charts and analytics
- **File Management** - Upload/download capabilities

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
