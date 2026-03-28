#!/bin/bash
set -euo pipefail

# =============================================================================
# Yamacraw Business Portal - Database Backup Script
# Cron: 0 2 * * * /home/deploy/yamacraw-business-portal/backup.sh >> /home/deploy/backups/backup.log 2>&1
# Keeps 14 days of backups locally
# =============================================================================

DEPLOY_DIR="$HOME/yamacraw-business-portal"
COMPOSE_FILE="$DEPLOY_DIR/docker-compose.prod.yml"
ENV_FILE="$DEPLOY_DIR/.env.prod"
BACKUP_DIR="$HOME/backups"
RETENTION_DAYS=14
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/yamacraw_portal_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting database backup..."

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T postgres \
    pg_dump -U yamacraw -d yamacraw_portal -Fc \
    | gzip > "$BACKUP_FILE"

FILESIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[$(date)] Backup created: $BACKUP_FILE ($FILESIZE)"

DELETED=$(find "$BACKUP_DIR" -name "yamacraw_portal_*.sql.gz" -mtime +${RETENTION_DAYS} -delete -print | wc -l)
if [ "$DELETED" -gt 0 ]; then
    echo "[$(date)] Cleaned up $DELETED old backup(s)"
fi

echo "[$(date)] Backup complete."
