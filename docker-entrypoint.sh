#!/bin/sh
set -e

echo "🚀 Starting DVLA NSS Portal Application..."

DB_HOST=${DB_HOST:-db}
DB_PORT=${DB_PORT:-3306}
DB_USER=${DB_USER:-hr_user}
DB_PASSWORD=${DB_PASSWORD:-hr_password}
DB_NAME=${DB_NAME:-dvla_nss_portal}

echo "⏳ Waiting for MySQL database at $DB_HOST:$DB_PORT to be ready..."
while ! nc -z $DB_HOST $DB_PORT; do
  sleep 2
done

echo "✅ Database server is reachable!"

# Check users table count
USER_COUNT=$(mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p"$DB_PASSWORD" $DB_NAME -s -N -e "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")

echo "📊 Current user records in DB: ${USER_COUNT:-0}"

# If user count is 0, restore the SQL backup file if present
if [ "${USER_COUNT:-0}" -eq "0" ]; then
  if [ -f "/app/database/dvla_nss_portal.sql" ]; then
    echo "📥 Importing SQL database dump (dvla_nss_portal.sql)..."
    mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p"$DB_PASSWORD" $DB_NAME < /app/database/dvla_nss_portal.sql || true
  elif [ -f "/app/database/schema.sql" ]; then
    echo "📥 Importing schema SQL file..."
    mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p"$DB_PASSWORD" $DB_NAME < /app/database/schema.sql || true
  fi
fi

# Execute main process (Next.js server)
echo "🌐 Launching Next.js server on port ${PORT:-3000}..."
exec "$@"
