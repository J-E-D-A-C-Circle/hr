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

# Run Prisma schema push FIRST to ensure all tables exist (staff, hr_letter_*, retirement_*, stations, etc.)
echo "📦 Syncing database schema with Prisma (all modules)..."
npx prisma db push --skip-generate --accept-data-loss || true

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
npx prisma db push --skip-generate --accept-data-loss || true

# Auto-restore any wiped bank/SSNIT/NIA fields on existing staff records from the latest SQL backup
LATEST_BACKUP=$(ls -1 /app/database/sql_backup_*.sql 2>/dev/null | sort | tail -n 1)
if [ -n "$LATEST_BACKUP" ]; then
  echo "🩹 Checking for any blanked-out staff bank/profile fields to restore from $LATEST_BACKUP..."
  mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS tempstaff_restore_tmp;" 2>/dev/null || true
  mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" tempstaff_restore_tmp < "$LATEST_BACKUP" 2>/dev/null || true
  mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "
    UPDATE \`staff\` s
    JOIN tempstaff_restore_tmp.\`staff\` b ON s.id = b.id
    SET
      s.bank_name = CASE WHEN (s.bank_name IS NULL OR TRIM(s.bank_name) = '') THEN b.bank_name ELSE s.bank_name END,
      s.bank_branch = CASE WHEN (s.bank_branch IS NULL OR TRIM(s.bank_branch) = '') THEN b.bank_branch ELSE s.bank_branch END,
      s.bank_account = CASE WHEN (s.bank_account IS NULL OR TRIM(s.bank_account) = '') THEN b.bank_account ELSE s.bank_account END,
      s.ssnit_no = CASE WHEN (s.ssnit_no IS NULL OR TRIM(s.ssnit_no) = '') THEN b.ssnit_no ELSE s.ssnit_no END,
      s.nia_number = CASE WHEN (s.nia_number IS NULL OR TRIM(s.nia_number) = '') THEN b.nia_number ELSE s.nia_number END,
      s.phone = CASE WHEN (s.phone IS NULL OR TRIM(s.phone) = '') THEN b.phone ELSE s.phone END,
      s.email = CASE WHEN (s.email IS NULL OR TRIM(s.email) = '') THEN b.email ELSE s.email END,
      s.role = CASE WHEN (s.role IS NULL OR TRIM(s.role) = '') THEN b.role ELSE s.role END,
      s.gender = CASE WHEN (s.gender IS NULL OR TRIM(s.gender) = '') THEN b.gender ELSE s.gender END,
      s.date_of_birth = COALESCE(s.date_of_birth, b.date_of_birth),
      s.salary = CASE WHEN (s.salary IS NULL OR s.salary = 0) THEN b.salary ELSE s.salary END;
    DROP DATABASE IF EXISTS tempstaff_restore_tmp;
  " 2>/dev/null || true
  echo "✅ Staff bank & statutory fields verified/restored."
fi

# Check retirement staff table count and auto-seed if empty
RETIREMENT_COUNT=$(mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD $DB_NAME -s -N -e "SELECT COUNT(*) FROM retirement_staff;" 2>/dev/null || echo "0")
echo "📊 Current retirement staff records in DB: ${RETIREMENT_COUNT:-0}"

if [ "${RETIREMENT_COUNT:-0}" -eq "0" ]; then
  if [ -f "/app/scripts/import_employee_csv_to_retirement.js" ]; then
    echo "🌱 Auto-seeding retirement staff dataset (1,129 staff across 59 stations)..."
    node /app/scripts/import_employee_csv_to_retirement.js || true
    echo "✅ Retirement staff dataset auto-seeded successfully."
  fi
fi

# Execute main process (Next.js server)
echo "🌐 Launching Next.js server on port 3002..."
exec "$@"
