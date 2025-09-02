#!/bin/bash

# Database Setup and Seeding Script
# This script helps set up the database and run migrations with seeding

echo "🚀 OMAT Mission Database Setup"
echo "==============================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "📋 Please create a .env file based on .env.example"
    echo "   Copy .env.example to .env and update the DATABASE_URL"
    echo ""
    echo "Example DATABASE_URL:"
    echo "   DATABASE_URL=\"postgresql://username:password@localhost:5432/omat_mission_db\""
    echo ""
    exit 1
fi

echo "✅ .env file found"

# Check if DATABASE_URL is set
if ! grep -q "DATABASE_URL" .env; then
    echo "❌ DATABASE_URL not found in .env file"
    echo "Please add DATABASE_URL to your .env file"
    exit 1
fi

echo "✅ DATABASE_URL configured"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "✅ Dependencies installed"

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run migrations
echo "🗄️  Running database migrations..."
npx prisma migrate deploy

# Seed the database
echo "🌱 Seeding database..."
npx prisma db seed

echo ""
echo "🎉 Database setup completed!"
echo ""
echo "📋 Summary:"
echo "   - Database migrations applied"
echo "   - Test data seeded"
echo "   - Ready for development"
echo ""
echo "🔐 Default login credentials:"
echo "   Super Admin: superadmin@algérietelecom.dz / password123"
echo "   Admin: ahmed.benali@algérietelecom.dz / password123"
echo "   User: karim.mansouri@algérietelecom.dz / password123"
echo ""
echo "🚀 Start the application:"
echo "   npm run start:dev"
