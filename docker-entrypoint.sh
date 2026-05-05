#!/bin/sh

echo "Ensuring uploads directory exists..."
mkdir -p /app/uploads

echo "Running Prisma migrations..."
if npx prisma migrate deploy; then
  echo "Migrations applied successfully."
else
  echo "WARNING: prisma migrate deploy failed or had warnings. Continuing..."
fi

echo "Starting server..."
exec node server.js
