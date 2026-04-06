#!/bin/bash

#####################################################################
# Simple HR Leave System - Update from Local to VPS (v2)
#
# Use this for all redeployments AFTER the initial deploy-localv2.sh.
# It uploads only changed files and runs the minimal steps needed
# to apply code changes — without touching Nginx, SSL, firewall,
# or re-seeding the database.
#
# What it does:
#   1. rsync changed files only
#   2. composer install (no scripts, to avoid boot-time DB issues)
#   3. Clear stale bootstrap cache
#   4. npm ci + npm run build (frontend assets)
#   5. php artisan migrate (new migrations only)
#   6. php artisan package:discover
#   7. Rebuild Laravel config/route/view caches
#   8. Restart queue workers (supervisor)
#   9. Bring app back up from maintenance mode
#
# Usage:
#   chmod +x update-localv2.sh
#   ./update-localv2.sh
#
# For Azure VM with key auth:
#   VPS IP:       20.188.123.16
#   SSH user:     aisg
#   SSH key path: ~/.ssh/aisg-azure.key
#####################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  HR Leave System - Update Deploy       ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

read -p "VPS IP address: " VPS_IP
read -p "SSH user [aisg]: " SSH_USER
SSH_USER=${SSH_USER:-aisg}
read -p "SSH port [22]: " SSH_PORT
SSH_PORT=${SSH_PORT:-22}
read -p "SSH key path (leave blank for password auth): " SSH_KEY
read -p "Install directory on VPS [/var/www/simplehrleave]: " INSTALL_DIR
INSTALL_DIR=${INSTALL_DIR:-/var/www/simplehrleave}

SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=30 -o ServerAliveInterval=60 -o ServerAliveCountMax=5 -p ${SSH_PORT}"
if [ -n "$SSH_KEY" ]; then
    SSH_OPTS="$SSH_OPTS -i $SSH_KEY"
fi

SSH_CMD="ssh ${SSH_OPTS} ${SSH_USER}@${VPS_IP}"
RSYNC_SSH="ssh ${SSH_OPTS}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo -e "${YELLOW}Configuration:${NC}"
echo "  VPS: ${SSH_USER}@${VPS_IP}:${SSH_PORT}"
echo "  Install dir: ${INSTALL_DIR}"
echo ""
read -p "Continue? (y/n): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""

#######################################
# Step 1: Upload changed files
#######################################
echo -e "${BLUE}[1/4]${NC} Uploading changed files..."

# Restore write access for aisg before rsync
# (previous deploy sets ownership to www-data)
$SSH_CMD "sudo chown -R ${SSH_USER}:${SSH_USER} ${INSTALL_DIR}"

rsync -azh --progress \
    --exclude='.git' \
    --exclude='.DS_Store' \
    --exclude='node_modules' \
    --exclude='vendor' \
    --exclude='.env' \
    --exclude='.env.backup' \
    --exclude='.env.production' \
    --exclude='database/database.sqlite' \
    --exclude='public/build' \
    --exclude='public/hot' \
    --exclude='public/storage' \
    --exclude='storage/logs/*.log' \
    --exclude='storage/framework/cache/data/*' \
    --exclude='storage/framework/sessions/*' \
    --exclude='storage/framework/views/*' \
    --exclude='.phpunit.cache' \
    --exclude='.idea' \
    --exclude='.vscode' \
    --exclude='.fleet' \
    --exclude='.nova' \
    --exclude='.zed' \
    --exclude='.claude' \
    --exclude='Homestead.*' \
    -e "${RSYNC_SSH}" \
    "${SCRIPT_DIR}/" "${SSH_USER}@${VPS_IP}:${INSTALL_DIR}/"

echo -e "${GREEN}[OK]${NC} Files uploaded"

#######################################
# Step 2: Build & migrate
#######################################
echo -e "${BLUE}[2/4]${NC} Building application..."

$SSH_CMD "sudo bash -s" << REMOTE_BUILD
set -e
export COMPOSER_ALLOW_SUPERUSER=1
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
cd ${INSTALL_DIR}

echo "==> Enabling maintenance mode..."
sudo -u www-data php artisan down --retry=30 2>/dev/null || true

echo "==> Clearing stale bootstrap cache..."
rm -f bootstrap/cache/packages.php bootstrap/cache/services.php bootstrap/cache/config.php bootstrap/cache/routes-v7.php bootstrap/cache/events.php

echo "==> Installing PHP deps..."
composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

echo "==> Installing Node deps..."
npm ci

echo "==> Building frontend assets..."
npm run build

echo "==> Setting bootstrap/cache permissions for artisan..."
chown www-data:www-data bootstrap/cache
chmod 775 bootstrap/cache

echo "==> Running migrations..."
sudo -u www-data php artisan migrate --force

echo "==> Running package:discover..."
php artisan package:discover --ansi

echo "==> Setting permissions..."
chown -R www-data:www-data ${INSTALL_DIR}
chmod -R 755 ${INSTALL_DIR}
chmod -R 775 storage bootstrap/cache database
setfacl -R -m u:www-data:rwX storage bootstrap/cache
setfacl -dR -m u:www-data:rwX storage bootstrap/cache

echo "BUILD_DONE"
REMOTE_BUILD

echo -e "${GREEN}[OK]${NC} Build complete"

#######################################
# Step 3: Rebuild Laravel caches
#######################################
echo -e "${BLUE}[3/4]${NC} Rebuilding Laravel caches..."

$SSH_CMD "sudo bash -s" << REMOTE_CACHE
set -e
cd ${INSTALL_DIR}

sudo -u www-data php artisan config:cache
sudo -u www-data php artisan route:cache
sudo -u www-data php artisan view:cache
sudo -u www-data php artisan cache:clear

echo "CACHE_DONE"
REMOTE_CACHE

echo -e "${GREEN}[OK]${NC} Caches rebuilt"

#######################################
# Step 4: Restart workers & bring up
#######################################
echo -e "${BLUE}[4/4]${NC} Restarting workers..."

$SSH_CMD "sudo bash -s" << REMOTE_RESTART
set -e

supervisorctl restart simplehrleave-worker: 2>/dev/null || true

cd ${INSTALL_DIR}
sudo -u www-data php artisan up

echo "RESTART_DONE"
REMOTE_RESTART

echo -e "${GREEN}[OK]${NC} Workers restarted, app is live"

#######################################
# Done!
#######################################
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Update Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "  ${YELLOW}Useful commands:${NC}"
echo "  - View logs:    ssh ${SSH_USER}@${VPS_IP} 'tail -f ${INSTALL_DIR}/storage/logs/laravel.log'"
echo "  - Check queue:  ssh ${SSH_USER}@${VPS_IP} 'sudo supervisorctl status'"
echo ""
