#!/bin/bash
set -euo pipefail

# =============================================================================
# Yamacraw Business Portal - First-Time VM Setup
# Run this ONCE on the VM as the deploy user
#
# The VM only needs: docker-compose.prod.yml, nginx config, .env.prod, and scripts.
# Application code is never cloned — images are pulled from GHCR.
# =============================================================================

DEPLOY_DIR="$HOME/yamacraw-business-portal"

echo "=========================================="
echo "  Yamacraw Business Portal - VM Setup"
echo "=========================================="

mkdir -p "$DEPLOY_DIR/nginx"
mkdir -p "$HOME/backups"

# Check if files were copied
if [ ! -f "$DEPLOY_DIR/docker-compose.prod.yml" ]; then
    echo "ERROR: Deployment files not found."
    echo ""
    echo "Copy files from your local machine first:"
    echo "  scp -i ~/.ssh/yamacraw-business-portal deploy/docker-compose.prod.yml deploy@204.12.170.114:~/yamacraw-business-portal/"
    echo "  scp -i ~/.ssh/yamacraw-business-portal deploy/nginx/prod.conf deploy@204.12.170.114:~/yamacraw-business-portal/nginx/"
    echo "  scp -i ~/.ssh/yamacraw-business-portal deploy/.env.prod.example deploy@204.12.170.114:~/yamacraw-business-portal/"
    echo "  scp -i ~/.ssh/yamacraw-business-portal deploy/deploy.sh deploy/backup.sh deploy/restore.sh deploy@204.12.170.114:~/yamacraw-business-portal/"
    exit 1
fi

# Generate .env.prod if it doesn't exist
if [ ! -f "$DEPLOY_DIR/.env.prod" ]; then
    echo "[1/4] Generating .env.prod with secure secrets..."
    cp "$DEPLOY_DIR/.env.prod.example" "$DEPLOY_DIR/.env.prod"

    DB_PASSWORD=$(openssl rand -base64 32 | tr -d '=/+' | head -c 32)
    JWT_SECRET=$(openssl rand -base64 64 | tr -d '=/+' | head -c 64)

    sed -i "s/CHANGE_ME_STRONG_PASSWORD_HERE/$DB_PASSWORD/g" "$DEPLOY_DIR/.env.prod"
    sed -i "s/CHANGE_ME_GENERATE_A_64_CHAR_SECRET/$JWT_SECRET/" "$DEPLOY_DIR/.env.prod"

    echo "       Generated secure DB password and JWT secret."
    echo "       IMPORTANT: Edit .env.prod to add RESEND_API_KEY and TURNSTILE_SECRET_KEY"
else
    echo "[1/4] .env.prod already exists, skipping..."
fi

# Make scripts executable
echo "[2/4] Setting permissions..."
chmod +x "$DEPLOY_DIR/deploy.sh" "$DEPLOY_DIR/backup.sh" "$DEPLOY_DIR/restore.sh"

# Login to GHCR
echo "[3/4] Logging into GitHub Container Registry..."
echo "       You need a GitHub Personal Access Token with read:packages scope."
echo "       Create one at: https://github.com/settings/tokens"
read -p "       Paste your token: " GHCR_TOKEN
echo "$GHCR_TOKEN" | docker login ghcr.io -u Trentxn --password-stdin

# Set up backup cron
if ! crontab -l 2>/dev/null | grep -q "backup.sh"; then
    (crontab -l 2>/dev/null; echo "0 2 * * * $DEPLOY_DIR/backup.sh >> $HOME/backups/backup.log 2>&1") | crontab -
    echo "[4/4] Backup cron job added (daily at 2 AM)"
else
    echo "[4/4] Backup cron job already exists"
fi

echo ""
echo "=========================================="
echo "  Setup complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Edit ~/yamacraw-business-portal/.env.prod (add RESEND_API_KEY, TURNSTILE_SECRET_KEY)"
echo "  2. Run: cd ~/yamacraw-business-portal && ./deploy.sh"
echo "  3. Seed admin: docker compose --env-file .env.prod -f docker-compose.prod.yml exec api python -m app.seed"
echo ""
