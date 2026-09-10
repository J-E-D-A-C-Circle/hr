#!/bin/sh
set -e

echo "🚀 Starting HR Temp & Retirement Staff Management Application..."

DB_HOST=${DB_HOST:-db}
DB_PORT=${DB_PORT:-3306}
DB_USER=${DB_USER:-root}
DB_PASSWORD=${DB_PASSWORD:-root}
DB_NAME=${DB_NAME:-tempstaff_db}

echo "⏳ Waiting for MySQL database at $DB_HOST:$DB_PORT to be ready..."
while ! nc -z $DB_HOST $DB_PORT; do
  sleep 2
done

echo "✅ Database server is reachable!"

# Run Prisma schema push to ensure all tables exist
echo "📦 Syncing database schema with Prisma..."
npx prisma db push --skip-generate || true

# Check staff table count
STAFF_COUNT=$(mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD $DB_NAME -s -N -e "SELECT COUNT(*) FROM staff;" 2>/dev/null || echo "0")

echo "📊 Current staff records in DB: ${STAFF_COUNT:-0}"

# If staff count is 0, restore the SQL backup file
if [ "${STAFF_COUNT:-0}" -eq "0" ] && [ -f "/app/database/sql_backup_2026_09_10.sql" ]; then
  echo "📥 Importing full SQL database backup (Temp Staff + Retirement System data)..."
  mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD $DB_NAME < /app/database/tempstaff_db.sql || true
  echo "✅ Database backup imported successfully!"
fi

# Execute main process (Next.js server)
echo "🌐 Launching Next.js server on port 3002..."
exec "$@"
