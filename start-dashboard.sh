#!/bin/bash

# One Ops Dashboard Startup Script

echo "========================================="
echo "  One Ops Dashboard - Startup Script"
echo "========================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ .env file created. Please edit it with your Databricks credentials."
    echo ""
    read -p "Press Enter to continue or Ctrl+C to exit and configure .env first..."
fi

# Check if node_modules exists for backend
if [ ! -d node_modules ] || [ ! -d node_modules/express ]; then
    echo "📦 Installing backend dependencies..."
    npm install express cors @databricks/sql dotenv
fi

echo ""
echo "🚀 Starting backend server..."
echo "   Backend will run on http://localhost:3001"
echo ""

# Start the backend server in the background
node server.cjs &
BACKEND_PID=$!

echo "✅ Backend started (PID: $BACKEND_PID)"
echo ""
echo "Note: Frontend should be started separately with 'npm run dev'"
echo ""
echo "To stop the backend, run: kill $BACKEND_PID"
echo ""
echo "========================================="
