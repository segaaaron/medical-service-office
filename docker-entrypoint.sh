#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Running seed..."
node prisma/seed.js

echo "Starting server..."
exec node server.js
