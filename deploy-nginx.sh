#!/bin/bash

# Complete Nginx and SSL setup script
# This script installs dependencies, obtains SSL certificate, and configures Nginx

set -e

# Configuration
DOMAIN="vecall.pranavmishra.dev"
EMAIL="pranavmishra2101@gmail.com"
NGINX_CONFIG_FILE="nginx.conf"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Starting Nginx and SSL setup for $DOMAIN"
echo "📁 Project directory: $PROJECT_DIR"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Check if nginx config file exists
if [ ! -f "$PROJECT_DIR/$NGINX_CONFIG_FILE" ]; then
    echo "❌ Nginx config file not found: $PROJECT_DIR/$NGINX_CONFIG_FILE"
    exit 1
fi

# Install nginx if not installed
if ! command -v nginx &> /dev/null; then
    echo "📦 Installing Nginx..."
    apt-get update
    apt-get install -y nginx
else
    echo "✅ Nginx already installed"
fi

# Install certbot if not installed
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing Certbot..."
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
else
    echo "✅ Certbot already installed"
fi

# Backup existing configuration if it exists
if [ -f "$NGINX_SITES_AVAILABLE/$SITE_NAME" ]; then
    echo -e "${YELLOW}Backing up existing configuration...${NC}"
    cp "$NGINX_SITES_AVAILABLE/$SITE_NAME" "$NGINX_SITES_AVAILABLE/$SITE_NAME.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Copy nginx configuration
echo -e "${GREEN}Copying nginx configuration...${NC}"
cp "$NGINX_CONF" "$NGINX_SITES_AVAILABLE/$SITE_NAME"

# Create symbolic link if it doesn't exist
if [ ! -L "$NGINX_SITES_ENABLED/$SITE_NAME" ]; then
    echo -e "${GREEN}Creating symbolic link...${NC}"
    ln -s "$NGINX_SITES_AVAILABLE/$SITE_NAME" "$NGINX_SITES_ENABLED/$SITE_NAME"
fi

# Remove default nginx site if it exists
if [ -L "$NGINX_SITES_ENABLED/default" ]; then
    echo -e "${YELLOW}Removing default nginx site...${NC}"
    rm "$NGINX_SITES_ENABLED/default"
fi

# Test nginx configuration
echo -e "${GREEN}Testing nginx configuration...${NC}"
if nginx -t; then
    echo -e "${GREEN}✓ Nginx configuration is valid${NC}"
else
    echo -e "${RED}✗ Nginx configuration test failed${NC}"
    echo -e "${YELLOW}Restoring backup if available...${NC}"
    if [ -f "$NGINX_SITES_AVAILABLE/$SITE_NAME.backup."* ]; then
        cp "$NGINX_SITES_AVAILABLE/$SITE_NAME.backup."* "$NGINX_SITES_AVAILABLE/$SITE_NAME"
    fi
    exit 1
fi

# Restart nginx
echo -e "${GREEN}Restarting nginx...${NC}"
systemctl restart nginx

if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Nginx restarted successfully${NC}"
else
    echo -e "${RED}✗ Nginx failed to start${NC}"
    echo -e "${YELLOW}Checking nginx status:${NC}"
    systemctl status nginx
    exit 1
fi

# Check if SSL certificates exist
echo ""
echo -e "${YELLOW}Checking SSL certificates...${NC}"
if [ ! -f "/etc/letsencrypt/live/$SITE_NAME/fullchain.pem" ]; then
    echo -e "${YELLOW}⚠ SSL certificates not found${NC}"
    echo -e "${YELLOW}To obtain SSL certificates, run:${NC}"
    echo -e "  sudo certbot --nginx -d $SITE_NAME"
    echo ""
    echo -e "${YELLOW}For now, you can access the site via HTTP${NC}"
else
    echo -e "${GREEN}✓ SSL certificates found${NC}"
fi

# Display status
echo ""
echo -e "${GREEN}=== Deployment Summary ===${NC}"
echo -e "Site: ${GREEN}$SIT
    echo -e "${YELLOW}⚠ Backend (port 3000): Not running${NC}"
    echo -e "  Run: docker-compose up -d"
fi

if nc -z localhost 5173 2>/dev/null; then
    echo -e "${GREEN}✓ Frontend (port 5173): Running${NC}"
else
    echo -e "${YELLOW}⚠ Frontend (port 5173): Not running${NC}"
    echo -e "  Run: docker-compose up -d"
fi

echo ""
echo -e "${GREEN}✓ Deployment complete!${NC}"
echo -e "Access your site at: ${GREEN}https://$SITE_NAME${NC}"
