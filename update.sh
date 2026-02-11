#!/bin/bash

#######################################
# Simple HR Leave System - Update Script
# Run as root or with sudo
#
# Usage: sudo ./update.sh [/path/to/app]
#######################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[*]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Configuration
INSTALL_DIR=${1:-/var/www/simplehrleave}
APP_NAME="simplehrleave"

if [ ! -d "$INSTALL_DIR" ]; then
    print_error "Directory $INSTALL_DIR not found"
    echo "Usage: sudo ./update.sh [/path/to/app]"
    exit 1
fi

echo ""
echo "========================================"
echo "   Simple HR Leave System - Update"
echo "========================================"
echo ""
echo "Application Directory: $INSTALL_DIR"
echo ""

cd "$INSTALL_DIR"

print_status "Enabling maintenance mode..."
php artisan down --retry=60 || true

print_status "Pulling latest changes..."
if [ -d ".git" ]; then
    git fetch origin main
    git reset --hard origin/main
    print_success "Git pull complete"
else
    echo "Not a git repo, skipping pull"
fi

print_status "Installing PHP dependencies..."
composer install --optimize-autoloader --no-dev --no-interaction

print_status "Installing Node.js dependencies..."
npm ci

print_status "Building assets..."
npm run build

print_status "Running migrations..."
php artisan migrate --force

print_status "Clearing caches..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan cache:clear
php artisan event:cache

print_status "Creating storage link..."
php artisan storage:link 2>/dev/null || true

print_status "Setting permissions..."
chown -R www-data:www-data storage bootstrap/cache public/build database
chmod -R 775 storage bootstrap/cache database

print_status "Restarting queue workers..."
if command -v supervisorctl &> /dev/null; then
    supervisorctl restart ${APP_NAME}-worker:* 2>/dev/null || true
fi

print_status "Disabling maintenance mode..."
php artisan up

echo ""
print_success "Update complete!"
echo ""
echo "If you encounter issues, check the logs:"
echo "  tail -f $INSTALL_DIR/storage/logs/laravel.log"
echo ""
