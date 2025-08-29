#!/bin/sh
set -e

# --- Parse DB host/port ---
PARSED_HOST=""
PARSED_PORT=""

if [ -n "$DATABASE_URL" ]; then
  # Extract host (between @ and : or /)
  PARSED_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:/]+).*|\1|')
  # Extract port (digits after : before /). If not present, will be empty
  PARSED_PORT=$(echo "$DATABASE_URL" | sed -E 's|.*:([0-9]+)/.*|\1|')
fi

# Allow explicit overrides
HOST=${DB_HOST:-$PARSED_HOST}
PORT=${DB_PORT:-$PARSED_PORT}
PORT=${PORT:-5432}   # fallback

if [ -z "$HOST" ]; then
  echo "❌ ERROR: Could not determine DB host. Set DATABASE_URL or DB_HOST."
  exit 1
fi

# --- Wait for DB to be ready ---
echo "⏳ Waiting for DB at $HOST:$PORT ..."
RETRIES=30
COUNT=0
until nc -z "$HOST" "$PORT" >/dev/null 2>&1; do
  COUNT=$((COUNT+1))
  if [ $COUNT -ge $RETRIES ]; then
    echo "❌ ERROR: Could not connect to DB at $HOST:$PORT after $RETRIES attempts."
    exit 1
  fi
  echo "DB not ready, sleeping 2s..."
  sleep 2
done
echo "✅ DB is reachable."

# --- Run Prisma migrations & generate client ---
echo "🚀 Running Prisma migrate deploy..."
npx prisma migrate deploy --schema=./prisma/schema.prisma

echo "⚡ Generating Prisma client..."
npx prisma generate

# --- Start app ---
if [ -f dist/server.js ]; then
  echo "▶️ Starting built server..."
  exec node dist/server.js
else
  echo "▶️ Built server not found — running npm run dev"
  exec npm run dev
fi
