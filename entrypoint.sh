#!/bin/sh
set -e

echo "🚀 Starting HR Validation Platform container..."

echo "🗄️  Running database initialization..."
node /app/scripts/init-db.js

echo "🟢 Starting Next.js Standalone Server on port 3000..."
exec node server.js
