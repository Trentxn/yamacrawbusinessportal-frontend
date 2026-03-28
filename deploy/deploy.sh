#!/bin/bash
set -euo pipefail

# =============================================================================
# Yamacraw Business Portal - Deploy on VM
# This script runs ON the VM. It pulls the latest images and restarts services.
#
# Usage (from your local machine):
#   ssh -i ~/.ssh/yamacraw-business-portal deploy@204.12.170.114 'cd ~/yamacraw-business-portal && ./deploy.sh'
#
# Or run directly on the VM:
#   cd ~/yamacraw-business-portal && ./deploy.sh
# =============================================================================

DEPLOY_DIR="$HOME/yamacraw-business-portal"
COMPOSE_FILE="$DEPLOY_DIR/docker-compose.prod.yml"
ENV_FILE="$DEPLOY_DIR/.env.prod"

echo "=========================================="
echo "  Yamacraw Business Portal - Deploying"
echo "=========================================="

cd "$DEPLOY_DIR"

# Check .env.prod exists
if [ ! -f "$ENV_FILE" ]; then
    echo "ERROR: .env.prod not found at $ENV_FILE"
    exit 1
fi

echo "[1/4] Pulling latest images..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" pull

echo "[2/4] Stopping old containers..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" down

echo "[3/4] Starting services..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d

echo "[4/4] Waiting for health check..."
sleep 10

# Check if services are running
if docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps | grep -q "running"; then
    echo ""
    echo "=========================================="
    echo "  Deployment successful!"
    echo "=========================================="
    echo ""
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps
else
    echo ""
    echo "WARNING: Some services may not be running."
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps
    echo ""
    echo "Check logs:"
    echo "  docker compose --env-file $ENV_FILE -f $COMPOSE_FILE logs"
    exit 1
fi
