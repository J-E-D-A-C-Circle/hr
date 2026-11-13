#!/bin/sh
set -e

echo "🚀 Starting HR Validation Platform container..."

DB_HOST=${DB_HOST:-hr-mysql-service}
DB_PORT=${DB_PORT:-3306}

echo "⏳ Waiting for MySQL database at $DB_HOST:$DB_PORT to be ready..."
until node -e "const net = require('net'); const s = new net.Socket(); s.connect(Number(process.env.DB_PORT || $DB_PORT), process.env.DB_HOST || '$DB_HOST', () => { s.destroy(); process.exit(0); }); s.on('error', () => process.exit(1));" 2>/dev/null; do
  sleep 2
done

echo "✅ Database server is reachable!"

echo "🗄️ Running database initialization..."
node /app/scripts/init-db.js || true

echo "🟢 Starting Next.js Standalone Server on port 3000..."
exec node server.js
