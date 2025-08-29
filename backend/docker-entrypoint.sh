#!/bin/sh
set -e

# --- Parse DB host/port WITHOUT touching PORT (Render sets PORT for the web service) ---
PARSED_DB_HOST=""
PARSED_DB_PORT=""

if [ -n "$DATABASE_URL" ]; then
  # Extract host (between @ and : or /)
  PARSED_DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:/]+).*|\1|')
  # Extract port (digits after : before /)
  PARSED_DB_PORT=$(echo "$DATABASE_URL" | sed -E 's|.*:([0-9]+)/.*|\1|')
fi

DBHOST=${DB_HOST:-$PARSED_DB_HOST}
DBPORT=${DB_PORT:-$PARSED_DB_PORT}
DBPORT=${DBPORT:-5432}  # default for Postgres

if [ -z "$DBHOST" ]; then
  echo "❌ ERROR: Could not determine DB host. Set DATABASE_URL or DB_HOST."
  exit 1
fi

echo "⏳ Waiting for DB at $DBHOST:$DBPORT ..."
RETRIES=30
COUNT=0
until nc -z "$DBHOST" "$DBPORT" >/dev/null 2>&1; do
  COUNT=$((COUNT+1))
  if [ $COUNT -ge $RETRIES ]; then
    echo "❌ ERROR: Could not connect to DB at $DBHOST:$DBPORT after $RETRIES attempts."
    exit 1
  fi
  echo "DB not ready, sleeping 2s..."
  sleep 2
done
echo "✅ DB is reachable."

echo "🚀 Running Prisma migrate deploy..."
npx prisma migrate deploy --schema=./prisma/schema.prisma

echo "⚡ Generating Prisma client..."
npx prisma generate

# IMPORTANT: do NOT set/modify PORT here. Render provides PORT (e.g., 10000).
echo "🌐 App will bind to PORT=${PORT:-<not-set>}"

# Start app
exec node dist/server.js
