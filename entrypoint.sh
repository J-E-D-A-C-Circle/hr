#!/bin/sh
set -e

echo "🚀 Starting HR Validation Platform container..."
echo "🟢 Starting Next.js Standalone Server on port 3000..."
exec node server.js
