#!/bin/sh
set -e

echo "🚀 Starting DVLA HR Staff Management & Letters Application..."

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

# Run Prisma schema push FIRST to ensure all tables exist (staff, hr_letter_*, retirement_*, etc.)
echo "📦 Syncing database schema with Prisma (all modules)..."
npx prisma db push --skip-generate || true

# Check staff table count
STAFF_COUNT=$(mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD $DB_NAME -s -N -e "SELECT COUNT(*) FROM staff;" 2>/dev/null || echo "0")
echo "📊 Current temp staff records in DB: ${STAFF_COUNT:-0}"

# If staff table is empty, restore the most recent SQL backup file
if [ "${STAFF_COUNT:-0}" -eq "0" ]; then
  # Auto-discover the most recent dated backup (sql_backup_YYYY_MM_DD.sql)
  LATEST_BACKUP=$(ls -1 /app/database/sql_backup_*.sql 2>/dev/null | sort | tail -n 1)

  if [ -n "$LATEST_BACKUP" ]; then
    echo "📥 Importing backup: $LATEST_BACKUP ..."
    mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD $DB_NAME < "$LATEST_BACKUP" || true
    echo "✅ Backup imported."
  elif [ -f "/app/database/tempstaff_db.sql" ]; then
    echo "📥 Importing fallback: tempstaff_db.sql ..."
    mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD $DB_NAME < /app/database/tempstaff_db.sql || true
    echo "✅ Fallback imported."
  else
    echo "⚠️  No SQL backup found — starting with empty database. Prisma schema is applied."
  fi
fi

# Re-run Prisma db push after restore to catch any new columns / tables from latest schema
echo "📦 Re-syncing schema post-restore (ensures new hrletters & retirement tables exist)..."
npx prisma db push --skip-generate || true

# Execute main process (Next.js server)
echo "🌐 Launching Next.js server on port 3002..."
exec "$@"
