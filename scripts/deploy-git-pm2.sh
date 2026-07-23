#!/bin/bash
set -e

# Run on the server, from the taskgame repo root.
# Load web/.env.production if it exists
if [ -f web/.env.production ]; then
  export $(grep -v '^#' web/.env.production | xargs)
fi

echo "--- Starting Deploy ---"

echo "Pulling latest changes..."
git pull

echo "Installing dependencies..."
cd web
npm ci

echo "Generating Prisma client..."
npm run db:generate

echo "Running production migrations..."
npm run db:migrate:prod

echo "Building application..."
npm run build

cd ..

echo "Reloading PM2 process..."
pm2 reload ecosystem.config.cjs --update-env

echo "--- Deploy Complete ---"
