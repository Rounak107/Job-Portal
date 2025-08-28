#!/bin/sh
set -e

# Wait for DB
if [ -n "$DATABASE_URL" ]; then
  host="$(echo $DATABASE_URL | sed -E 's|.*@([^:/]+).*|\1|')"
  port="$(echo $DATABASE_URL | sed -E 's|.*:([0-9]+)/.*|\1|' )"
  if [ -z "$port" ]; then port=5432; fi
  echo "Waiting for DB $host:$port ..."
  while ! nc -z "$host" "$port"; do
    echo "DB not ready, sleeping 2s..."
    sleep 2
  done
fi

echo "Running Prisma migrate deploy..."
npx prisma migrate deploy || echo "prisma migrate deploy exited with non-zero (safe to continue in some cases)"

echo "Generating Prisma client..."
npx prisma generate

# Start built server if exists, otherwise run dev
if [ -f dist/server.js ]; then
  echo "Starting built server..."
  node dist/server.js
else
  echo "Built server not found — running npm run dev"
  npm run dev
fi
