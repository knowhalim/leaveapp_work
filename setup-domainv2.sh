#!/bin/bash

#####################################################################
# Simple HR Leave System - Domain Setup Script
#
# Run this AFTER deploy-local.sh or setup-server.sh to point your
# app to a domain name with free SSL (Let's Encrypt).
#
# Supports:
#   - Top-level domains: example.com
#   - Subdomains: leave.example.com
#   - With or without www redirect
#
# Usage:
#   chmod +x setup-domainv2.sh
#   ./setup-domainv2.sh
#
# Requirements:
#   - SSH access to the VPS (sudo-capable user, e.g. 'aisg' on Azure)
#   - DNS A record already pointing to the VPS IP
#   - deploy-localv2.sh already run
#
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
echo -e "${BLUE}  HR Leave System - Domain Setup        ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Gather info
read -p "VPS IP address: " VPS_IP
read -p "SSH user [aisg]: " SSH_USER
SSH_USER=${SSH_USER:-aisg}
read -p "SSH port [22]: " SSH_PORT
SSH_PORT=${SSH_PORT:-22}
read -p "SSH key path (leave blank for password auth): " SSH_KEY
read -p "Domain name (e.g. example.com or leave.example.com): " DOMAIN
read -p "Install directory on VPS [/var/www/simplehrleave]: " INSTALL_DIR
INSTALL_DIR=${INSTALL_DIR:-/var/www/simplehrleave}
read -p "Email for SSL certificate notifications (or leave blank): " SSL_EMAIL

# Validate domain
if [ -z "$DOMAIN" ]; then
    echo -e "${RED}Domain cannot be empty${NC}"
    exit 1
fi

# Detect if top-level domain (e.g. example.com) or subdomain (e.g. leave.example.com)
DOT_COUNT=$(echo "$DOMAIN" | tr -cd '.' | wc -c | tr -d ' ')
if [ "$DOT_COUNT" -eq 1 ]; then
    DOMAIN_TYPE="top-level"
    echo -e "${BLUE}Detected:${NC} Top-level domain (${DOMAIN})"
    read -p "Also redirect www.${DOMAIN}? (y/n) [y]: " INCLUDE_WWW
    INCLUDE_WWW=${INCLUDE_WWW:-y}
else
    DOMAIN_TYPE="subdomain"
    INCLUDE_WWW="n"
    echo -e "${BLUE}Detected:${NC} Subdomain (${DOMAIN})"
fi

# Build SSH options
SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=30 -p ${SSH_PORT}"
if [ -n "$SSH_KEY" ]; then
    SSH_OPTS="$SSH_OPTS -i $SSH_KEY"
fi
SSH_CMD="ssh ${SSH_OPTS} ${SSH_USER}@${VPS_IP}"

# Build certbot domain flags
if [[ "$INCLUDE_WWW" =~ ^[Yy]$ ]]; then
    CERTBOT_DOMAINS="-d ${DOMAIN} -d www.${DOMAIN}"
    NGINX_SERVER_NAME="${DOMAIN} www.${DOMAIN}"
else
    CERTBOT_DOMAINS="-d ${DOMAIN}"
    NGINX_SERVER_NAME="${DOMAIN}"
fi

# Build certbot email flag
if [ -n "$SSL_EMAIL" ]; then
    CERTBOT_EMAIL="--email ${SSL_EMAIL}"
else
    CERTBOT_EMAIL="--register-unsafely-without-email"
fi

echo ""
echo -e "${YELLOW}Configuration:${NC}"
echo "  VPS: ${SSH_USER}@${VPS_IP}:${SSH_PORT}"
echo "  Domain: ${DOMAIN}"
echo "  Type: ${DOMAIN_TYPE}"
if [[ "$INCLUDE_WWW" =~ ^[Yy]$ ]]; then
    echo "  www redirect: yes (www.${DOMAIN} -> ${DOMAIN})"
fi
echo "  SSL: Let's Encrypt (auto-renewing)"
echo ""
echo -e "${YELLOW}Prerequisites:${NC}"
echo "  Make sure these DNS records exist BEFORE continuing:"
echo ""
echo "    Type   Name    Value"
echo "    A      ${DOMAIN}   ${VPS_IP}"
if [[ "$INCLUDE_WWW" =~ ^[Yy]$ ]]; then
    echo "    A      www.${DOMAIN}   ${VPS_IP}"
fi
echo ""
read -p "DNS records are set and I want to continue (y/n): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "Cancelled. Set up your DNS records first, then re-run this script."
    exit 0
fi

echo ""

#######################################
# Step 1: Verify DNS resolution
#######################################
echo -e "${BLUE}[1/4]${NC} Verifying DNS resolution..."

RESOLVED_IP=$(dig +short "$DOMAIN" 2>/dev/null | tail -1)
if [ -z "$RESOLVED_IP" ]; then
    # Fallback if dig is not installed locally
    RESOLVED_IP=$(host "$DOMAIN" 2>/dev/null | grep "has address" | head -1 | awk '{print $NF}')
fi

if [ "$RESOLVED_IP" = "$VPS_IP" ]; then
    echo -e "${GREEN}[OK]${NC} ${DOMAIN} resolves to ${VPS_IP}"
else
    echo -e "${YELLOW}[WARN]${NC} ${DOMAIN} resolves to '${RESOLVED_IP}' (expected ${VPS_IP})"
    echo "  DNS may not have propagated yet."
    read -p "  Continue anyway? SSL will fail if DNS isn't ready (y/n): " DNS_CONTINUE
    if [[ ! "$DNS_CONTINUE" =~ ^[Yy]$ ]]; then
        echo "Cancelled. Wait for DNS propagation and try again."
        exit 0
    fi
fi

#######################################
# Step 2: Update Nginx config
#######################################
echo -e "${BLUE}[2/4]${NC} Updating Nginx configuration..."

$SSH_CMD "sudo bash -s" << REMOTE_NGINX
set -e

# Detect PHP version from existing FPM socket
PHP_SOCK=\$(ls /var/run/php/php*-fpm.sock 2>/dev/null | sort -V | tail -1)
if [ -z "\$PHP_SOCK" ]; then
    echo "ERROR: No PHP-FPM socket found"
    exit 1
fi
echo "  Using PHP socket: \$PHP_SOCK"

cat > /etc/nginx/sites-available/simplehrleave << NGINXEOF
server {
    listen 80;
    listen [::]:80;
    server_name ${NGINX_SERVER_NAME};
    root ${INSTALL_DIR}/public;

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
        try_files \\\$uri \\\$uri/ /index.php?\\\$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }
    error_page 404 /index.php;

    location ~ \.php\\\$ {
        fastcgi_pass unix:\${PHP_SOCK};
        fastcgi_param SCRIPT_FILENAME \\\$realpath_root\\\$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
        fastcgi_read_timeout 300;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }

    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf|svg|eot)\\\$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/simplehrleave /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
echo "NGINX_DONE"
REMOTE_NGINX

echo -e "${GREEN}[OK]${NC} Nginx updated with domain ${DOMAIN}"

#######################################
# Step 3: Install SSL certificate
#######################################
echo -e "${BLUE}[3/4]${NC} Installing SSL certificate..."

$SSH_CMD "sudo bash -s" << REMOTE_SSL
set -e
export DEBIAN_FRONTEND=noninteractive

# Install certbot if not present
if ! command -v certbot &> /dev/null; then
    apt-get update -y
    apt-get install -y certbot python3-certbot-nginx
fi

# Get and install certificate
certbot --nginx ${CERTBOT_DOMAINS} --non-interactive --agree-tos ${CERTBOT_EMAIL} --redirect

echo "SSL_DONE"
REMOTE_SSL

echo -e "${GREEN}[OK]${NC} SSL certificate installed (auto-renews via certbot timer)"

#######################################
# Step 4: Update Laravel APP_URL
#######################################
echo -e "${BLUE}[4/4]${NC} Updating Laravel configuration..."

$SSH_CMD "sudo bash -s" << REMOTE_LARAVEL
set -e
cd ${INSTALL_DIR}

sed -i "s|APP_URL=.*|APP_URL=https://${DOMAIN}|g" .env
sudo -u www-data php artisan config:cache

echo "LARAVEL_DONE"
REMOTE_LARAVEL

echo -e "${GREEN}[OK]${NC} Laravel APP_URL set to https://${DOMAIN}"

#######################################
# Done!
#######################################
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Domain Setup Complete!                ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "  Your app is live at: ${BLUE}https://${DOMAIN}${NC}"
if [[ "$INCLUDE_WWW" =~ ^[Yy]$ ]]; then
    echo -e "  www redirect:        ${BLUE}https://www.${DOMAIN}${NC} -> ${BLUE}https://${DOMAIN}${NC}"
fi
echo ""
echo -e "  SSL auto-renews via certbot timer."
echo -e "  To check: ssh ${SSH_USER}@${VPS_IP} 'certbot certificates'"
echo -e "  To renew manually: ssh ${SSH_USER}@${VPS_IP} 'certbot renew --dry-run'"
echo ""
