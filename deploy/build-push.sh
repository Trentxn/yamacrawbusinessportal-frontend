#!/bin/bash
set -euo pipefail

# =============================================================================
# Yamacraw Business Portal - Build & Push Images to GHCR
# Run this locally after pushing code changes to main
#
# Prerequisites:
#   1. Install Docker Desktop
#   2. Create a GitHub Personal Access Token (classic) with: read:packages, write:packages, delete:packages
#   3. Login: echo "YOUR_TOKEN" | docker login ghcr.io -u Trentxn --password-stdin
# =============================================================================

FRONTEND_DIR="$(cd "$(dirname "$0")/.." && pwd)"
API_DIR="$(cd "$FRONTEND_DIR/../yamacrawbusinessportal-api" && pwd)"

FRONTEND_IMAGE="ghcr.io/trentxn/yamacrawbusinessportal-frontend:latest"
API_IMAGE="ghcr.io/trentxn/yamacrawbusinessportal-api:latest"

echo "=========================================="
echo "  Building & Pushing Production Images"
echo "=========================================="

# Build frontend
echo ""
echo "[1/4] Building frontend image..."
docker build -t "$FRONTEND_IMAGE" "$FRONTEND_DIR"

# Build API
echo ""
echo "[2/4] Building API image..."
docker build -t "$API_IMAGE" "$API_DIR"

# Push frontend
echo ""
echo "[3/4] Pushing frontend image..."
docker push "$FRONTEND_IMAGE"

# Push API
echo ""
echo "[4/4] Pushing API image..."
docker push "$API_IMAGE"

echo ""
echo "=========================================="
echo "  Images pushed successfully!"
echo "=========================================="
echo ""
echo "  Frontend: $FRONTEND_IMAGE"
echo "  API:      $API_IMAGE"
echo ""
echo "Now deploy to the VM:"
echo "  ssh -i ~/.ssh/yamacraw-business-portal deploy@204.12.170.114 'cd ~/yamacraw-business-portal && ./deploy.sh'"
