#!/bin/bash

# OMAT Workspace Validation Script
echo "🔍 OMAT Workspace Validation"
echo "============================"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ Root package.json not found"
    exit 1
fi
echo "✅ Root package.json found"

# Check workspace configuration
if ! grep -q '"workspaces"' package.json; then
    echo "❌ Workspaces configuration not found"
    exit 1
fi
echo "✅ Workspaces configuration found"

# Check client workspace
if [ ! -d "client" ] || [ ! -f "client/package.json" ]; then
    echo "❌ Client workspace not found"
    exit 1
fi
echo "✅ Client workspace found"

# Check server workspace
if [ ! -d "server" ] || [ ! -f "server/package.json" ]; then
    echo "❌ Server workspace not found"
    exit 1
fi
echo "✅ Server workspace found"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "⚠️  Dependencies not installed. Run 'npm install' first."
    exit 1
fi
echo "✅ Dependencies installed"

# Validate workspace structure
echo ""
echo "📋 Workspace Information:"
npm list --workspaces=false --depth=0 | grep -E "(client|server|concurrently)"

echo ""
echo "✅ Workspace validation successful!"
echo ""
echo "🚀 Ready to develop!"
echo "   npm run dev          # Start development servers"
echo "   npm run build        # Build for production"
echo "   npm run test         # Run tests"
echo "   npm run lint         # Lint code"