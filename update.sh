#!/bin/bash

#######################################
# HR Leave System - Update Script
# Run as root or with sudo
#######################################

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[*]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

# Configuration
INSTALL_DIR=${1:-/var/www/leaveapp}

if [ ! -d "$INSTALL_DIR" ]; then
    echo "Directory $INSTALL_DIR not found"
    exit 1
fi

echo ""
echo "========================================"
echo "   HR Leave System - Update"
echo "========================================"
echo ""

cd "$INSTALL_DIR"

print_status "Enabling maintenance mode..."
php artisan down || true

print_status "Pulling latest changes..."
git pull origin main 2>/dev/null || echo "Not a git repo, skipping pull"

print_status "Installing PHP dependencies..."
composer install --optimize-autoloader --no-dev --no-interaction

print_status "Installing Node.js dependencies..."
npm install

print_status "Building assets..."
npm run build

print_status "Running migrations..."
php artisan migrate --force

print_status "Clearing caches..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan cache:clear

print_status "Setting permissions..."
chown -R www-data:www-data storage bootstrap/cache public/build database
chmod -R 775 storage bootstrap/cache database

print_status "Disabling maintenance mode..."
php artisan up

echo ""
print_success "Update complete!"
