#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
NGINX_CONF="nginx.conf"
NGINX_SITES_AVAILABLE="/etc/nginx/sites-available"
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"
SITE_NAME="vecall.pranavmishra.dev"

echo -e "${GREEN}=== Video Call Nginx Deployment Script ===${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Error: This script must be run as root (use sudo)${NC}"
    exit 1
fi

# Check if nginx.conf exists
if [ ! -f "$NGINX_CONF" ]; then
    echo -e "${RED}Error: nginx.conf not found in current directory${NC}"
    exit 1
fi

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}Nginx is not installed. Installing...${NC}"
    apt update && apt install -y nginx
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
echo -e "Site: ${GREEN}$SITE_NAME${NC}"
echo -e "Config: ${GREEN}$NGINX_SITES_AVAILABLE/$SITE_NAME${NC}"
echo -e "Status: ${GREEN}$(systemctl is-active nginx)${NC}"
echo ""
echo -e "${GREEN}Testing site connectivity...${NC}"

# Test HTTP connection
if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "301\|200"; then
    echo -e "${GREEN}✓ HTTP is responding${NC}"
else
    echo -e "${YELLOW}⚠ HTTP might not be responding correctly${NC}"
fi

# Check if services are running
echo ""
echo -e "${GREEN}=== Service Status ===${NC}"
if nc -z localhost 3000 2>/dev/null; then
    echo -e "${GREEN}✓ Backend (port 3000): Running${NC}"
else
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
