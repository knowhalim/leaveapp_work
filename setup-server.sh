#!/bin/bash

#####################################################################
# Simple HR Leave System - Server Setup Script
#
# This script sets up a fresh Ubuntu server (20.04, 22.04, 24.04)
# with all dependencies needed to run the HR Leave Management System.
#
# Usage:
#   chmod +x setup-server.sh
#   sudo ./setup-server.sh
#
# After running this script:
#   1. Configure your .env file
#   2. Access the application at http://your-server-ip
#####################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="simplehrleave"
APP_DIR="/var/www/${APP_NAME}"
REPO_URL="https://github.com/knowhalim/simplehrleave.git"
DOMAIN="_"  # Use "_" for default server block, or set your domain

# PHP 8.4 is required - composer.lock has Symfony 8.x packages that need PHP >=8.4
PHP_VERSION="8.4"

# Functions
print_header() {
    echo -e "\n${BLUE}============================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}============================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Detect Ubuntu version
detect_ubuntu_version() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
        VERSION=$VERSION_ID
        print_info "Detected: $OS $VERSION"
    else
        print_error "Cannot detect OS version"
        exit 1
    fi

    if [[ "$OS" != *"Ubuntu"* ]]; then
        print_warning "This script is designed for Ubuntu. Proceed with caution."
    fi
}

# Fix locale to prevent perl/locale warnings
fix_locale() {
    print_header "Fixing Locale Settings"
    locale-gen en_US.UTF-8 || true
    update-locale LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 || true
    export LANG=en_US.UTF-8
    export LC_ALL=en_US.UTF-8
    print_success "Locale configured"
}

# Add swap (safety net for low-memory VPS)
setup_swap() {
    print_header "Setting Up Swap Space"

    if [ -f /swapfile2g ]; then
        print_info "Swap file already exists, skipping"
        return
    fi

    # Add 2GB swap for safety during composer/npm builds
    fallocate -l 2G /swapfile2g
    chmod 600 /swapfile2g
    mkswap /swapfile2g
    swapon /swapfile2g
    echo '/swapfile2g none swap sw 0 0' >> /etc/fstab

    print_success "2GB swap file created (prevents out-of-memory during builds)"
}

# Update system packages
update_system() {
    print_header "Updating System Packages"
    apt-get update -y
    # Use --force-confdef to keep existing configs and avoid interactive prompts
    apt-get upgrade -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold"
    print_success "System packages updated"
}

# Install basic dependencies
install_basic_deps() {
    print_header "Installing Basic Dependencies"
    apt-get install -y \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        curl \
        wget \
        git \
        unzip \
        zip \
        acl \
        supervisor \
        cron
    print_success "Basic dependencies installed"
}

# Install PHP and extensions
install_php() {
    print_header "Installing PHP ${PHP_VERSION}"

    # Add PHP repository
    add-apt-repository -y ppa:ondrej/php
    apt-get update -y

    # Install PHP and required extensions for Laravel
    apt-get install -y \
        php${PHP_VERSION} \
        php${PHP_VERSION}-fpm \
        php${PHP_VERSION}-cli \
        php${PHP_VERSION}-common \
        php${PHP_VERSION}-mysql \
        php${PHP_VERSION}-sqlite3 \
        php${PHP_VERSION}-zip \
        php${PHP_VERSION}-gd \
        php${PHP_VERSION}-mbstring \
        php${PHP_VERSION}-curl \
        php${PHP_VERSION}-xml \
        php${PHP_VERSION}-bcmath \
        php${PHP_VERSION}-intl \
        php${PHP_VERSION}-readline \
        php${PHP_VERSION}-opcache

    # Ensure this PHP version is the default CLI
    update-alternatives --set php /usr/bin/php${PHP_VERSION} 2>/dev/null || true

    # Configure PHP-FPM
    sed -i "s/;cgi.fix_pathinfo=1/cgi.fix_pathinfo=0/" /etc/php/${PHP_VERSION}/fpm/php.ini
    sed -i "s/upload_max_filesize = .*/upload_max_filesize = 64M/" /etc/php/${PHP_VERSION}/fpm/php.ini
    sed -i "s/post_max_size = .*/post_max_size = 64M/" /etc/php/${PHP_VERSION}/fpm/php.ini
    sed -i "s/memory_limit = .*/memory_limit = 512M/" /etc/php/${PHP_VERSION}/fpm/php.ini
    sed -i "s/max_execution_time = .*/max_execution_time = 300/" /etc/php/${PHP_VERSION}/fpm/php.ini

    # Restart PHP-FPM
    systemctl restart php${PHP_VERSION}-fpm
    systemctl enable php${PHP_VERSION}-fpm

    print_success "PHP ${PHP_VERSION} installed and configured"
}

# Install Composer
install_composer() {
    print_header "Installing Composer"

    # Allow composer to run as root without warnings
    export COMPOSER_ALLOW_SUPERUSER=1

    if command -v composer &> /dev/null; then
        print_info "Composer already installed, updating..."
        composer self-update
    else
        curl -sS https://getcomposer.org/installer | php
        mv composer.phar /usr/local/bin/composer
        chmod +x /usr/local/bin/composer
    fi

    print_success "Composer installed: $(composer --version 2>/dev/null | head -1)"
}

# Install Node.js and npm
install_nodejs() {
    print_header "Installing Node.js"

    if command -v node &> /dev/null; then
        print_info "Node.js already installed: $(node -v)"
        return
    fi

    # Install Node.js LTS (v20.x)
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs

    print_success "Node.js installed: $(node --version)"
    print_success "npm installed: $(npm --version)"
}

# Install Nginx
install_nginx() {
    print_header "Installing Nginx"

    apt-get install -y nginx

    # Remove default site
    rm -f /etc/nginx/sites-enabled/default

    # Start and enable Nginx
    systemctl start nginx
    systemctl enable nginx

    print_success "Nginx installed and started"
}

# Install MySQL (optional - script uses SQLite by default)
install_mysql() {
    print_header "Installing MySQL (Optional)"

    # Check if MySQL is already installed
    if command -v mysql &> /dev/null; then
        print_info "MySQL already installed"
        return
    fi

    # Install MySQL
    apt-get install -y mysql-server mysql-client

    # Start and enable MySQL
    systemctl start mysql
    systemctl enable mysql

    # Secure MySQL installation
    print_warning "Run 'mysql_secure_installation' to secure your MySQL installation"

    print_success "MySQL installed"
}

# Setup application directory
setup_application() {
    print_header "Setting Up Application"

    # Allow composer to run as root
    export COMPOSER_ALLOW_SUPERUSER=1

    # Create web directory if it doesn't exist
    mkdir -p /var/www

    # Clone or pull repository
    if [ -d "$APP_DIR" ]; then
        print_info "Application directory exists, pulling latest changes..."
        cd $APP_DIR
        git pull origin main
    else
        print_info "Cloning repository..."
        git clone $REPO_URL $APP_DIR
        cd $APP_DIR
    fi

    # Install PHP dependencies (as root with COMPOSER_ALLOW_SUPERUSER)
    print_info "Installing PHP dependencies..."
    composer install --no-dev --optimize-autoloader --no-interaction

    # Install Node.js dependencies and build assets
    print_info "Installing Node.js dependencies..."
    npm ci

    print_info "Building frontend assets..."
    npm run build

    # Setup environment file
    if [ ! -f .env ]; then
        cp .env.example .env
        print_info "Created .env file from .env.example"
    fi

    # Set admin credentials in .env for the seeder
    echo "" >> .env
    echo "ADMIN_NAME=\"${ADMIN_NAME}\"" >> .env
    echo "ADMIN_EMAIL=${ADMIN_EMAIL}" >> .env
    echo "ADMIN_PASSWORD=\"${ADMIN_PASSWORD}\"" >> .env

    # Generate application key
    php artisan key:generate --force

    # Create SQLite database
    touch database/database.sqlite

    # Set ownership AFTER composer/npm (they create files as root)
    # Must be done before migrations so www-data can write to SQLite
    chown -R www-data:www-data $APP_DIR
    chmod -R 755 $APP_DIR
    chmod -R 775 $APP_DIR/storage $APP_DIR/bootstrap/cache $APP_DIR/database

    # Run migrations
    sudo -u www-data php artisan migrate --force

    # Seed database with default data
    sudo -u www-data php artisan db:seed --force

    # Create storage link (--force overwrites if exists)
    php artisan storage:link --force 2>/dev/null || php artisan storage:link 2>/dev/null || true

    # Remove admin credentials from .env after seeding (security)
    sed -i '/^ADMIN_NAME=/d' .env
    sed -i '/^ADMIN_EMAIL=/d' .env
    sed -i '/^ADMIN_PASSWORD=/d' .env

    # Clear and cache
    sudo -u www-data php artisan config:cache
    sudo -u www-data php artisan route:cache
    sudo -u www-data php artisan view:cache

    print_success "Application setup complete"
}

# Set file permissions
set_permissions() {
    print_header "Setting File Permissions"

    # Set ownership
    chown -R www-data:www-data $APP_DIR

    # Set directory permissions
    find $APP_DIR -type d -exec chmod 755 {} \;

    # Set file permissions
    find $APP_DIR -type f -exec chmod 644 {} \;

    # Make artisan executable
    chmod +x $APP_DIR/artisan

    # Set writable permissions for storage and cache
    chmod -R 775 $APP_DIR/storage
    chmod -R 775 $APP_DIR/bootstrap/cache
    chmod -R 775 $APP_DIR/database

    # Set ACL for storage directories
    setfacl -R -m u:www-data:rwX $APP_DIR/storage
    setfacl -R -m u:www-data:rwX $APP_DIR/bootstrap/cache
    setfacl -dR -m u:www-data:rwX $APP_DIR/storage
    setfacl -dR -m u:www-data:rwX $APP_DIR/bootstrap/cache

    print_success "File permissions set"
}

# Configure Nginx
configure_nginx() {
    print_header "Configuring Nginx"

    # Create Nginx server block using the correct PHP version
    cat > /etc/nginx/sites-available/${APP_NAME} << NGINX_CONFIG
server {
    listen 80;
    listen [::]:80;
    server_name _;

    root /var/www/simplehrleave/public;
    index index.php index.html index.htm;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Logging
    access_log /var/log/nginx/simplehrleave_access.log;
    error_log /var/log/nginx/simplehrleave_error.log;

    # Max upload size
    client_max_body_size 64M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    # PHP-FPM configuration - uses PHP ${PHP_VERSION}
    location ~ \.php\$ {
        fastcgi_pass unix:/var/run/php/php${PHP_VERSION}-fpm.sock;
        fastcgi_param SCRIPT_FILENAME \$realpath_root\$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
        fastcgi_read_timeout 300;
    }

    # Deny access to hidden files
    location ~ /\.(?!well-known).* {
        deny all;
    }

    # Cache static files
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|pdf|txt|woff|woff2|ttf|svg|eot)\$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
NGINX_CONFIG

    # Enable site
    ln -sf /etc/nginx/sites-available/${APP_NAME} /etc/nginx/sites-enabled/

    # Test Nginx configuration
    nginx -t

    # Reload Nginx
    systemctl reload nginx

    print_success "Nginx configured"
}

# Setup firewall
setup_firewall() {
    print_header "Setting Up Firewall"

    # Install UFW if not present
    apt-get install -y ufw

    # Allow SSH
    ufw allow OpenSSH

    # Allow HTTP and HTTPS
    ufw allow 'Nginx Full'

    # Enable firewall
    echo "y" | ufw enable

    print_success "Firewall configured"
}

# Setup SSL with Let's Encrypt (optional)
setup_ssl() {
    print_header "SSL Setup Information"

    print_info "To setup SSL with Let's Encrypt, run the following commands:"
    echo ""
    echo "  sudo apt-get install certbot python3-certbot-nginx"
    echo "  sudo certbot --nginx -d yourdomain.com"
    echo ""
    print_info "Make sure to update the server_name in /etc/nginx/sites-available/${APP_NAME}"
}

# Setup cron jobs for Laravel scheduler
setup_cron() {
    print_header "Setting Up Cron Jobs"

    # Add Laravel scheduler cron job
    touch /var/log/laravel-scheduler.log && chmod 664 /var/log/laravel-scheduler.log || true
    (crontab -l 2>/dev/null | grep -v "${APP_DIR}/artisan schedule:run"; echo "* * * * * sudo -u www-data bash -c \"cd ${APP_DIR} && php artisan schedule:run\" >> /var/log/laravel-scheduler.log 2>&1") | crontab -

    print_success "Cron jobs configured"
}

# Setup queue worker with Supervisor (optional)
setup_supervisor() {
    print_header "Setting Up Queue Worker"

    cat > /etc/supervisor/conf.d/${APP_NAME}-worker.conf << SUPERVISOR_CONFIG
[program:${APP_NAME}-worker]
process_name=%(program_name)s_%(process_num)02d
command=php ${APP_DIR}/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=${APP_DIR}/storage/logs/worker.log
stopwaitsecs=3600
SUPERVISOR_CONFIG

    supervisorctl reread
    supervisorctl update
    supervisorctl start ${APP_NAME}-worker:* 2>/dev/null || true

    print_success "Supervisor queue worker configured"
}

# Display final information
display_final_info() {
    print_header "Setup Complete!"

    # Get server IP
    SERVER_IP=$(hostname -I | awk '{print $1}')

    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  HR Leave System Installation Complete${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "Application URL: ${BLUE}http://${SERVER_IP}${NC}"
    echo -e "Application Directory: ${BLUE}${APP_DIR}${NC}"
    echo ""
    echo -e "${YELLOW}Login Credentials:${NC}"
    echo -e "  Email: ${BLUE}${ADMIN_EMAIL}${NC}"
    echo -e "  Password: ${BLUE}(the password you entered during setup)${NC}"
    echo ""
    echo -e "${YELLOW}Important Next Steps:${NC}"
    echo "  1. Update the .env file with your settings:"
    echo "     - APP_URL"
    echo "     - Mail settings (MAIL_*)"
    echo "     - Database settings (if using MySQL)"
    echo ""
    echo "  2. Change the default admin password immediately!"
    echo ""
    echo "  3. For SSL/HTTPS, run:"
    echo "     sudo apt-get install certbot python3-certbot-nginx"
    echo "     sudo certbot --nginx -d yourdomain.com"
    echo ""
    echo -e "${YELLOW}Useful Commands:${NC}"
    echo "  - View logs: tail -f ${APP_DIR}/storage/logs/laravel.log"
    echo "  - Clear cache: cd ${APP_DIR} && php artisan cache:clear"
    echo "  - Run migrations: cd ${APP_DIR} && php artisan migrate"
    echo "  - Restart queue: supervisorctl restart ${APP_NAME}-worker:*"
    echo ""
    echo -e "${GREEN}Thank you for using Simple HR Leave System!${NC}"
}

# Main installation function
main() {
    print_header "Simple HR Leave System - Server Setup"

    check_root
    detect_ubuntu_version

    # Confirm installation
    echo ""
    print_warning "This script will install and configure:"
    echo "  - PHP ${PHP_VERSION} with required extensions"
    echo "  - Composer"
    echo "  - Node.js 20.x and npm"
    echo "  - Nginx"
    echo "  - SQLite (default) / MySQL (optional)"
    echo "  - Supervisor"
    echo "  - UFW Firewall"
    echo "  - 2GB swap (safety net for low-memory VPS)"
    echo ""
    read -p "Do you want to continue? (y/n) " -n 1 -r
    echo ""

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Installation cancelled"
        exit 1
    fi

    # Prompt for super admin account
    echo ""
    print_header "Super Admin Account Setup"
    read -p "Admin name [Super Admin]: " ADMIN_NAME
    ADMIN_NAME=${ADMIN_NAME:-Super Admin}
    read -p "Admin email: " ADMIN_EMAIL
    while [ -z "$ADMIN_EMAIL" ]; do
        print_error "Email is required."
        read -p "Admin email: " ADMIN_EMAIL
    done
    while true; do
        read -s -p "Admin password (min 8 chars): " ADMIN_PASSWORD
        echo ""
        if [ ${#ADMIN_PASSWORD} -lt 8 ]; then
            print_error "Password must be at least 8 characters."
            continue
        fi
        read -s -p "Confirm password: " ADMIN_PASSWORD_CONFIRM
        echo ""
        if [ "$ADMIN_PASSWORD" != "$ADMIN_PASSWORD_CONFIRM" ]; then
            print_error "Passwords do not match. Try again."
            continue
        fi
        break
    done

    # Run installation steps
    fix_locale
    setup_swap
    update_system
    install_basic_deps
    install_php
    install_composer
    install_nodejs
    install_nginx
    # install_mysql  # Uncomment if you want MySQL instead of SQLite
    setup_application
    set_permissions
    configure_nginx
    setup_firewall
    setup_cron
    setup_supervisor

    display_final_info
}

# Run main function
main "$@"
