#!/bin/sh
set -e

echo "Ensuring uploads directory exists..."
mkdir -p /app/uploads

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Running seed..."
node prisma/seed.js

echo "Starting server..."
exec node server.js
