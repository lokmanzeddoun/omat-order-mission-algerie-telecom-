#!/bin/bash

# OMAT Workspace Setup Script
echo "🚀 OMAT - Order Mission Algeria Telecom"
echo "======================================="
echo "Setting up the monorepo workspace..."
echo ""

# Check Node.js version
echo "📋 Checking prerequisites..."
NODE_VERSION=$(node --version | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ is required. You have $(node --version)"
    echo "Please update Node.js to version 18 or higher."
    exit 1
fi
echo "✅ Node.js $(node --version) is supported"

# Check npm version
NPM_VERSION=$(npm --version | cut -d '.' -f 1)
if [ "$NPM_VERSION" -lt 8 ]; then
    echo "❌ npm 8+ is required. You have $(npm --version)"
    echo "Please update npm: npm install -g npm@latest"
    exit 1
fi
echo "✅ npm $(npm --version) is supported"

echo ""
echo "📦 Installing workspace dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "✅ Workspace setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Configure your database in server/.env:"
echo "      cp server/.env.example server/.env"
echo "      # Edit DATABASE_URL in server/.env"
echo ""
echo "   2. Setup database:"
echo "      npm run setup:db"
echo ""
echo "   3. Start development:"
echo "      npm run dev"
echo ""
echo "🔐 Default login credentials (after database setup):"
echo "   (development data only: the seed refuses to run with NODE_ENV=production)"
echo "   Super Admin: superadmin@algérietelecom.dz / password123"
echo "   Admin: ahmed.benali@algérietelecom.dz / password123"
echo "   User: karim.mansouri@algérietelecom.dz / password123"
echo ""
echo "📚 Available commands:"
echo "   npm run dev          # Start both client and server"
echo "   npm run dev:client   # Start only client"
echo "   npm run dev:server   # Start only server"
echo "   npm run build        # Build both for production"
echo "   npm run test         # Run all tests"
echo "   npm run lint         # Lint all code"
echo "   npm run clean        # Clean build artifacts"
echo ""
echo "🎉 Happy coding!"