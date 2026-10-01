#!/bin/sh
set -e

echo "🚀 Starting DVLA NSS Portal Application..."

DB_HOST=${DB_HOST:-db}
DB_PORT=${DB_PORT:-3306}
DB_USER=${DB_USER:-hr_user}
DB_PASSWORD=${DB_PASSWORD:-hr_password}
DB_NAME=${DB_NAME:-dvla_nss_portal}

echo "⏳ Waiting for MySQL database at $DB_HOST:$DB_PORT to be ready..."
until node -e "const net = require('net'); const s = new net.Socket(); s.connect(Number(process.env.DB_PORT || $DB_PORT), process.env.DB_HOST || '$DB_HOST', () => { s.destroy(); process.exit(0); }); s.on('error', () => process.exit(1));" 2>/dev/null; do
  sleep 2
done

echo "✅ Database server is reachable!"

echo "🛠️ Verifying / initializing database schema..."
node scripts/init-db.js || true

# Execute main process (Next.js server)
echo "🌐 Launching Next.js server on port ${PORT:-3000}..."
if [ "$#" -eq 0 ]; then
  exec node server.js
else
  exec "$@"
fi
