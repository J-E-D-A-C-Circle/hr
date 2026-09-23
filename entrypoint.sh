#!/bin/sh
set -e

echo "🚀 Starting HR Validation Platform container..."

# Ensure the DB directory exists and is writable by this user
DB_DIR=$(dirname "${DATABASE_URL#file:}")
if [ "$DB_DIR" = "." ] || [ -z "$DB_DIR" ]; then
  DB_DIR="/app/prisma"
fi
mkdir -p "$DB_DIR"

echo "🗄️  Initialising database at ${DATABASE_URL:-file:/app/prisma/dev.db} ..."
node /app/scripts/init-db.js

echo "🟢 Starting Next.js Standalone Server on port 3000..."
exec node server.js
