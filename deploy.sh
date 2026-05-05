#!/bin/bash
set -e

echo "=== Osaid Barber — Deploy ==="

# Pull latest code
git pull origin main

# Load production env
export $(grep -v '^#' .env.production | xargs)

# Build & start containers
docker compose -f docker-compose.prod.yml up -d --build

# Wait for DB to be ready
echo "Waiting for database..."
sleep 8

# Run migrations and seed
docker exec osaid_api node database/migrate.js
docker exec osaid_api node database/seed.js

echo ""
echo "✅ Done! Site is running on port 80."
