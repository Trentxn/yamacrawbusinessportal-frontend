#!/bin/bash
set -euo pipefail

# =============================================================================
# Yamacraw Business Portal - Database Restore Script
# Usage: ./restore.sh <backup_file.sql.gz>
# =============================================================================

DEPLOY_DIR="$HOME/yamacraw-business-portal"
COMPOSE_FILE="$DEPLOY_DIR/docker-compose.prod.yml"
ENV_FILE="$DEPLOY_DIR/.env.prod"

if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    echo ""
    echo "Available backups:"
    ls -lh "$HOME/backups"/yamacraw_portal_*.sql.gz 2>/dev/null || echo "  No backups found."
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "WARNING: This will REPLACE the current database with the backup."
echo "Backup file: $BACKUP_FILE"
read -p "Are you sure? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

echo "[1/3] Stopping API..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" stop api

echo "[2/3] Restoring database..."
gunzip -c "$BACKUP_FILE" | docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T postgres \
    pg_restore -U yamacraw -d yamacraw_portal --clean --if-exists -Fc 2>/dev/null || true

echo "[3/3] Restarting API..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" start api

echo "Restore complete."
