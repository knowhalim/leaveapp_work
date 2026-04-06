#!/bin/bash

#####################################################################
# Simple HR Leave System - Deploy from Local to VPS
#
# Uploads files directly from your local machine to a fresh VPS
# and sets everything up. No GitHub required.
#
# Usage:
#   chmod +x deploy-local.sh
#   ./deploy-local.sh
#
# Requirements:
#   - SSH access to the VPS (root or sudo user)
#   - rsync installed locally (pre-installed on macOS)
#####################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  HR Leave System - Local to VPS Deploy ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Gather VPS info
read -p "VPS IP address: " VPS_IP
read -p "SSH user [root]: " SSH_USER
SSH_USER=${SSH_USER:-root}
read -p "SSH port [22]: " SSH_PORT
SSH_PORT=${SSH_PORT:-22}
read -p "SSH key path (leave blank for password auth): " SSH_KEY
read -p "Install directory on VPS [/var/www/simplehrleave]: " INSTALL_DIR
INSTALL_DIR=${INSTALL_DIR:-/var/www/simplehrleave}
read -p "Domain name (or leave blank to use server IP): " DOMAIN
DOMAIN=${DOMAIN:-_}

# Super Admin account setup
echo ""
echo -e "${YELLOW}Super Admin Account:${NC}"
read -p "Admin name [Super Admin]: " ADMIN_NAME
ADMIN_NAME=${ADMIN_NAME:-Super Admin}
read -p "Admin email: " ADMIN_EMAIL
while [ -z "$ADMIN_EMAIL" ]; do
    echo -e "${RED}Email is required.${NC}"
    read -p "Admin email: " ADMIN_EMAIL
done
while true; do
    read -s -p "Admin password (min 8 chars): " ADMIN_PASSWORD
    echo ""
    if [ ${#ADMIN_PASSWORD} -lt 8 ]; then
        echo -e "${RED}Password must be at least 8 characters.${NC}"
        continue
    fi
    read -s -p "Confirm password: " ADMIN_PASSWORD_CONFIRM
    echo ""
    if [ "$ADMIN_PASSWORD" != "$ADMIN_PASSWORD_CONFIRM" ]; then
        echo -e "${RED}Passwords do not match. Try again.${NC}"
        continue
    fi
    break
done

# PHP 8.4 is required - composer.lock has Symfony 8.x packages that need PHP >=8.4
PHP_VERSION="8.4"

# Build SSH options
SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=30 -o ServerAliveInterval=60 -o ServerAliveCountMax=5 -p ${SSH_PORT}"
if [ -n "$SSH_KEY" ]; then
    SSH_OPTS="$SSH_OPTS -i $SSH_KEY"
fi

SSH_CMD="ssh ${SSH_OPTS} ${SSH_USER}@${VPS_IP}"
RSYNC_SSH="ssh ${SSH_OPTS}"

# Helper: retry SSH connection (system upgrades can briefly drop network)
ssh_with_retry() {
    local max_retries=5
    local retry_delay=10
    for i in $(seq 1 $max_retries); do
        if $SSH_CMD "echo connected" &>/dev/null; then
            return 0
        fi
        echo -e "${YELLOW}  SSH connection attempt $i/$max_retries failed, retrying in ${retry_delay}s...${NC}"
        sleep $retry_delay
    done
    echo -e "${RED}  Failed to reconnect after $max_retries attempts${NC}"
    exit 1
}

echo ""
echo -e "${YELLOW}Configuration:${NC}"
echo "  VPS: ${SSH_USER}@${VPS_IP}:${SSH_PORT}"
echo "  Install dir: ${INSTALL_DIR}"
echo "  Domain: ${DOMAIN}"
echo "  Admin: ${ADMIN_EMAIL}"
echo "  PHP: ${PHP_VERSION} (required by composer.lock)"
echo ""
read -p "Continue? (y/n): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""

#######################################
# Step 1: Upload files to VPS
#######################################
echo -e "${BLUE}[1/5]${NC} Uploading files to VPS..."

$SSH_CMD "mkdir -p ${INSTALL_DIR}"

rsync -azh --progress \
    --exclude='.git' \
    --exclude='.DS_Store' \
    --exclude='node_modules' \
    --exclude='vendor' \
    --exclude='.env' \
    --exclude='.env.backup' \
    --exclude='.env.production' \
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
# Step 2: Install server dependencies
#######################################
echo -e "${BLUE}[2/5]${NC} Installing server dependencies (this may take a few minutes)..."

$SSH_CMD "bash -s" << 'REMOTE_DEPS'
set -e
export DEBIAN_FRONTEND=noninteractive

echo "==> Fixing locale..."
locale-gen en_US.UTF-8 || true
update-locale LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 || true
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

echo "==> Adding swap (safety net for 1GB VPS)..."
if [ ! -f /swapfile2g ]; then
    fallocate -l 2G /swapfile2g
    chmod 600 /swapfile2g
    mkswap /swapfile2g
    swapon /swapfile2g
    echo '/swapfile2g none swap sw 0 0' >> /etc/fstab
    echo "  Swap added: 2GB"
else
    echo "  Swap already exists"
fi

echo "==> Updating packages..."
apt-get update -y
apt-get upgrade -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold"

echo "==> Installing basic deps..."
apt-get install -y software-properties-common apt-transport-https ca-certificates curl wget git unzip zip acl supervisor cron

echo "==> Adding PHP repo and installing PHP 8.4..."
add-apt-repository -y ppa:ondrej/php
apt-get update -y
apt-get install -y \
    php8.4 php8.4-fpm php8.4-cli php8.4-common \
    php8.4-mysql php8.4-sqlite3 php8.4-zip php8.4-gd \
    php8.4-mbstring php8.4-curl php8.4-xml php8.4-bcmath \
    php8.4-intl php8.4-readline php8.4-opcache

echo "==> Configuring PHP 8.4..."
sed -i "s/;cgi.fix_pathinfo=1/cgi.fix_pathinfo=0/" /etc/php/8.4/fpm/php.ini
sed -i "s/upload_max_filesize = .*/upload_max_filesize = 64M/" /etc/php/8.4/fpm/php.ini
sed -i "s/post_max_size = .*/post_max_size = 64M/" /etc/php/8.4/fpm/php.ini
sed -i "s/memory_limit = .*/memory_limit = 512M/" /etc/php/8.4/fpm/php.ini
sed -i "s/max_execution_time = .*/max_execution_time = 300/" /etc/php/8.4/fpm/php.ini

# Ensure PHP 8.4 is the default CLI version
update-alternatives --set php /usr/bin/php8.4 2>/dev/null || true

systemctl restart php8.4-fpm
systemctl enable php8.4-fpm

echo "==> Installing Nginx..."
apt-get install -y nginx
rm -f /etc/nginx/sites-enabled/default
systemctl start nginx
systemctl enable nginx

echo "==> Installing Composer..."
if ! command -v composer &> /dev/null; then
    curl -sS https://getcomposer.org/installer | php
    mv composer.phar /usr/local/bin/composer
    chmod +x /usr/local/bin/composer
fi

echo "==> Installing Node.js 20.x..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

echo ""
echo "==> Verification:"
php -v | head -1
node -v
composer --version 2>/dev/null | head -1 || true
echo "DEPS_DONE"
REMOTE_DEPS

echo -e "${GREEN}[OK]${NC} Server dependencies installed"

# Reconnect in case system upgrade dropped the connection
ssh_with_retry

#######################################
# Step 3: Configure & build application
#######################################
echo -e "${BLUE}[3/5]${NC} Building application on VPS..."

# Determine APP_URL
if [ "${DOMAIN}" != "_" ]; then
    APP_URL="https://${DOMAIN}"
else
    APP_URL="http://${VPS_IP}"
fi

$SSH_CMD "bash -s" << REMOTE_BUILD
set -e
export COMPOSER_ALLOW_SUPERUSER=1
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
cd ${INSTALL_DIR}

echo "==> Setting up .env..."
cp .env.example .env
sed -i "s|APP_ENV=.*|APP_ENV=production|g" .env
sed -i "s|APP_DEBUG=.*|APP_DEBUG=false|g" .env
sed -i "s|APP_URL=.*|APP_URL=${APP_URL}|g" .env

# Set admin credentials in .env for the seeder
echo "" >> .env
echo "ADMIN_NAME=\"${ADMIN_NAME}\"" >> .env
echo "ADMIN_EMAIL=${ADMIN_EMAIL}" >> .env
echo "ADMIN_PASSWORD=\"${ADMIN_PASSWORD}\"" >> .env

echo "==> Creating SQLite database..."
rm -f database/database.sqlite
touch database/database.sqlite

echo "==> Installing PHP deps (as root with COMPOSER_ALLOW_SUPERUSER)..."
composer install --no-dev --optimize-autoloader --no-interaction

echo "==> Installing Node deps..."
npm ci

echo "==> Building frontend assets..."
npm run build

echo "==> Running Laravel setup..."
php artisan key:generate --force

# Set ownership AFTER composer/npm install (they create files as root)
chown -R www-data:www-data ${INSTALL_DIR}
chmod -R 755 ${INSTALL_DIR}
chmod -R 775 storage bootstrap/cache database

sudo -u www-data php artisan migrate --force
sudo -u www-data php artisan db:seed --force
php artisan storage:link --force 2>/dev/null || php artisan storage:link 2>/dev/null || true
sudo -u www-data php artisan config:cache
sudo -u www-data php artisan route:cache
sudo -u www-data php artisan view:cache

# Remove admin credentials from .env after seeding (security)
sed -i '/^ADMIN_NAME=/d' .env
sed -i '/^ADMIN_EMAIL=/d' .env
sed -i '/^ADMIN_PASSWORD=/d' .env

echo "==> Setting final permissions..."
chown -R www-data:www-data ${INSTALL_DIR}
setfacl -R -m u:www-data:rwX storage bootstrap/cache
setfacl -dR -m u:www-data:rwX storage bootstrap/cache

echo "BUILD_DONE"
REMOTE_BUILD

echo -e "${GREEN}[OK]${NC} Application built"

#######################################
# Step 4: Configure Nginx
#######################################
echo -e "${BLUE}[4/5]${NC} Configuring Nginx..."

$SSH_CMD "bash -s" << REMOTE_NGINX
set -e

cat > /etc/nginx/sites-available/simplehrleave << 'NGINXEOF'
server {
    listen 80;
    listen [::]:80;
    server_name PLACEHOLDER_DOMAIN;
    root PLACEHOLDER_DIR/public;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    index index.php;
    charset utf-8;
    client_max_body_size 64M;

    gzip on;
    gzip_vary on;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss image/svg+xml;

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }
    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.4-fpm.sock;
        fastcgi_param SCRIPT_FILENAME \$realpath_root\$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
        fastcgi_read_timeout 300;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }

    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf|svg|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
NGINXEOF

sed -i "s|PLACEHOLDER_DOMAIN|${DOMAIN}|g" /etc/nginx/sites-available/simplehrleave
sed -i "s|PLACEHOLDER_DIR|${INSTALL_DIR}|g" /etc/nginx/sites-available/simplehrleave

ln -sf /etc/nginx/sites-available/simplehrleave /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

echo "NGINX_DONE"
REMOTE_NGINX

echo -e "${GREEN}[OK]${NC} Nginx configured"

#######################################
# Step 5: Firewall + Cron + Supervisor
#######################################
echo -e "${BLUE}[5/5]${NC} Final setup (firewall, cron, supervisor)..."

$SSH_CMD "bash -s" << REMOTE_FINAL
set -e

# Firewall
apt-get install -y ufw
ufw allow OpenSSH
ufw allow 'Nginx Full'
echo "y" | ufw enable

# Cron for Laravel scheduler
touch /var/log/laravel-scheduler.log && chmod 664 /var/log/laravel-scheduler.log || true
(crontab -l 2>/dev/null | grep -v "artisan schedule:run"; echo "* * * * * sudo -u www-data bash -c \"cd ${INSTALL_DIR} && php artisan schedule:run\" >> /var/log/laravel-scheduler.log 2>&1") | crontab -

# Supervisor for queue worker
cat > /etc/supervisor/conf.d/simplehrleave-worker.conf << 'SUPEOF'
[program:simplehrleave-worker]
process_name=%(program_name)s_%(process_num)02d
command=php ${INSTALL_DIR}/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=${INSTALL_DIR}/storage/logs/worker.log
stopwaitsecs=3600
SUPEOF

supervisorctl reread
supervisorctl update
supervisorctl start simplehrleave-worker: 2>/dev/null || true

echo "FINAL_DONE"
REMOTE_FINAL

echo -e "${GREEN}[OK]${NC} Firewall, cron, and supervisor configured"

#######################################
# Done!
#######################################
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
if [ "${DOMAIN}" != "_" ]; then
    echo -e "  App URL: ${BLUE}http://${DOMAIN}${NC}"
else
    echo -e "  App URL: ${BLUE}http://${VPS_IP}${NC}"
fi
echo ""
echo -e "  ${YELLOW}Login:${NC}"
echo -e "  Email:    ${ADMIN_EMAIL}"
echo -e "  Password: (the password you entered during setup)"
echo ""
echo -e "  ${YELLOW}Next steps:${NC}"
echo "  1. Set up your domain: ./setup-domain.sh"
echo "  2. Update .env mail settings if needed"
echo ""
echo -e "  ${YELLOW}To redeploy after changes:${NC}"
echo "  Just run this script again - rsync only uploads changed files."
echo ""
