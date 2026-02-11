#!/bin/bash

#######################################
# HR Leave System - Deployment Script
# Run as root or with sudo
#######################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[*]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root or with sudo"
    exit 1
fi

echo ""
echo "========================================"
echo "   HR Leave System - Server Deployment"
echo "========================================"
echo ""

# Get domain/subdomain from user
read -p "Enter your domain or subdomain (e.g., leave.example.com): " DOMAIN

if [ -z "$DOMAIN" ]; then
    print_error "Domain cannot be empty"
    exit 1
fi

# Get installation directory
read -p "Installation directory [/var/www/leaveapp]: " INSTALL_DIR
INSTALL_DIR=${INSTALL_DIR:-/var/www/leaveapp}

# Get PHP version preference
read -p "PHP version [8.2]: " PHP_VERSION
PHP_VERSION=${PHP_VERSION:-8.2}

# Ask about SSL
read -p "Install SSL certificate with Let's Encrypt? (y/n) [y]: " INSTALL_SSL
INSTALL_SSL=${INSTALL_SSL:-y}

if [[ "$INSTALL_SSL" =~ ^[Yy]$ ]]; then
    read -p "Email for SSL certificate notifications: " SSL_EMAIL
fi

echo ""
print_status "Configuration Summary:"
echo "  - Domain: $DOMAIN"
echo "  - Install Directory: $INSTALL_DIR"
echo "  - PHP Version: $PHP_VERSION"
echo "  - SSL: $INSTALL_SSL"
echo ""

read -p "Continue with installation? (y/n): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "Installation cancelled."
    exit 0
fi

echo ""

#######################################
# Step 1: Install System Dependencies
#######################################
print_status "Installing system dependencies..."

apt update
apt install -y \
    nginx \
    php${PHP_VERSION}-fpm \
    php${PHP_VERSION}-sqlite3 \
    php${PHP_VERSION}-mysql \
    php${PHP_VERSION}-mbstring \
    php${PHP_VERSION}-xml \
    php${PHP_VERSION}-curl \
    php${PHP_VERSION}-zip \
    php${PHP_VERSION}-gd \
    php${PHP_VERSION}-bcmath \
    unzip \
    git \
    curl

print_success "System dependencies installed"

#######################################
# Step 2: Install Node.js (if not present)
#######################################
if ! command -v node &> /dev/null; then
    print_status "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    print_success "Node.js installed"
else
    print_success "Node.js already installed"
fi

#######################################
# Step 3: Install Composer (if not present)
#######################################
if ! command -v composer &> /dev/null; then
    print_status "Installing Composer..."
    curl -sS https://getcomposer.org/installer | php
    mv composer.phar /usr/local/bin/composer
    chmod +x /usr/local/bin/composer
    print_success "Composer installed"
else
    print_success "Composer already installed"
fi

#######################################
# Step 4: Setup Application Directory
#######################################
print_status "Setting up application directory..."

if [ -d "$INSTALL_DIR" ]; then
    print_warning "Directory $INSTALL_DIR already exists"
    read -p "Remove existing directory and continue? (y/n): " REMOVE_DIR
    if [[ "$REMOVE_DIR" =~ ^[Yy]$ ]]; then
        rm -rf "$INSTALL_DIR"
    else
        print_error "Installation cancelled"
        exit 1
    fi
fi

# Copy application files (assuming script is run from app directory)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mkdir -p "$INSTALL_DIR"
cp -r "$SCRIPT_DIR"/* "$INSTALL_DIR"/
cp -r "$SCRIPT_DIR"/.env.example "$INSTALL_DIR"/ 2>/dev/null || true
cp -r "$SCRIPT_DIR"/.gitignore "$INSTALL_DIR"/ 2>/dev/null || true

print_success "Application files copied"

#######################################
# Step 5: Configure Application
#######################################
print_status "Configuring application..."

cd "$INSTALL_DIR"

# Create .env file
if [ -f ".env.example" ]; then
    cp .env.example .env
else
    cat > .env << EOF
APP_NAME="HR Leave System"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://${DOMAIN}

APP_LOCALE=en
APP_FALLBACK_LOCALE=en
APP_FAKER_LOCALE=en_US

APP_MAINTENANCE_DRIVER=file

BCRYPT_ROUNDS=12

LOG_CHANNEL=stack
LOG_STACK=single
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=error

DB_CONNECTION=sqlite

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=null

BROADCAST_CONNECTION=log
FILESYSTEM_DISK=local
QUEUE_CONNECTION=database

CACHE_STORE=database

MAIL_MAILER=smtp
MAIL_SCHEME=smtps
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=465
MAIL_USERNAME=apikey
MAIL_PASSWORD=
MAIL_FROM_ADDRESS="noreply@${DOMAIN}"
MAIL_FROM_NAME="\${APP_NAME}"

VITE_APP_NAME="\${APP_NAME}"
EOF
fi

# Update APP_URL in .env
sed -i "s|APP_URL=.*|APP_URL=https://${DOMAIN}|g" .env
sed -i "s|APP_DEBUG=.*|APP_DEBUG=false|g" .env
sed -i "s|APP_ENV=.*|APP_ENV=production|g" .env

# Create SQLite database
touch database/database.sqlite

# Set permissions
chown -R www-data:www-data "$INSTALL_DIR"
chmod -R 755 "$INSTALL_DIR"
chmod -R 775 storage bootstrap/cache database

print_success "Application configured"

#######################################
# Step 6: Install Dependencies
#######################################
print_status "Installing PHP dependencies..."
sudo -u www-data composer install --optimize-autoloader --no-dev --no-interaction

print_status "Installing Node.js dependencies and building assets..."
npm install
npm run build
chown -R www-data:www-data public/build

print_success "Dependencies installed"

#######################################
# Step 7: Laravel Setup
#######################################
print_status "Running Laravel setup..."

sudo -u www-data php artisan key:generate --force
sudo -u www-data php artisan migrate --force
sudo -u www-data php artisan config:cache
sudo -u www-data php artisan route:cache
sudo -u www-data php artisan view:cache
sudo -u www-data php artisan storage:link

print_success "Laravel setup complete"

#######################################
# Step 8: Configure Nginx
#######################################
print_status "Configuring Nginx..."

cat > /etc/nginx/sites-available/leaveapp << EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};
    root ${INSTALL_DIR}/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php${PHP_VERSION}-fpm.sock;
        fastcgi_param SCRIPT_FILENAME \$realpath_root\$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/leaveapp /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

# Test and reload nginx
nginx -t
systemctl reload nginx

print_success "Nginx configured"

#######################################
# Step 9: Install SSL Certificate
#######################################
if [[ "$INSTALL_SSL" =~ ^[Yy]$ ]]; then
    print_status "Installing SSL certificate..."

    apt install -y certbot python3-certbot-nginx

    if [ -n "$SSL_EMAIL" ]; then
        certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "$SSL_EMAIL" --redirect
    else
        certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --redirect
    fi

    print_success "SSL certificate installed"
fi

#######################################
# Step 10: Setup Cron for Laravel
#######################################
print_status "Setting up Laravel scheduler..."

(crontab -l 2>/dev/null | grep -v "artisan schedule:run"; echo "* * * * * cd ${INSTALL_DIR} && php artisan schedule:run >> /dev/null 2>&1") | crontab -

print_success "Laravel scheduler configured"

#######################################
# Complete!
#######################################
echo ""
echo "========================================"
echo -e "${GREEN}   Installation Complete!${NC}"
echo "========================================"
echo ""
echo "Your HR Leave System is now available at:"
if [[ "$INSTALL_SSL" =~ ^[Yy]$ ]]; then
    echo -e "  ${GREEN}https://${DOMAIN}${NC}"
else
    echo -e "  ${YELLOW}http://${DOMAIN}${NC}"
fi
echo ""
echo "Next steps:"
echo "  1. Point your domain's DNS A record to this server's IP"
echo "  2. Visit the URL above to run the setup wizard"
echo "  3. Create your admin account"
echo ""
echo "Useful commands:"
echo "  - View logs: tail -f ${INSTALL_DIR}/storage/logs/laravel.log"
echo "  - Clear cache: cd ${INSTALL_DIR} && php artisan cache:clear"
echo "  - Restart queue: cd ${INSTALL_DIR} && php artisan queue:restart"
echo ""
print_success "Deployment finished!"
