#!/bin/bash
# ==============================================================================
# E-Commerce Production Server Setup Script (Ubuntu)
# ==============================================================================
# This script will install Node.js, NGINX, PM2, and prepare the environment.
# Run this script ON YOUR SERVER using: sudo bash setup-server.sh
# ==============================================================================

set -e

echo "🚀 Starting Production Server Setup..."

# 1. Update system packages
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# 2. Install Node.js (Version 18 LTS)
echo "🟢 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
echo "Node.js version: $(node -v)"
echo "NPM version: $(npm -v)"

# 3. Install NGINX
echo "🌐 Installing NGINX..."
apt install -y nginx
systemctl enable nginx
systemctl start nginx

# 4. Install PM2 (Process Manager)
echo "⚙️ Installing PM2 globally..."
npm install -g pm2

# 5. Create application directory
echo "📂 Creating application directory at /var/www/ecommerce..."
mkdir -p /var/www/ecommerce
chown -R $USER:$USER /var/www/ecommerce

echo "✅ Server dependencies installed successfully!"
echo "=============================================================================="
echo "🎯 NEXT STEPS FOR YOU:"
echo "1. Upload your project files to: /var/www/ecommerce"
echo "2. Navigate to the folder: cd /var/www/ecommerce"
echo "3. Run: npm install"
echo "4. Create your .env file: cp .env.production .env (and fill in your credentials)"
echo "5. Start the app with PM2: pm2 start ecosystem.config.js"
echo "6. Setup NGINX: Copy your nginx.conf to /etc/nginx/sites-available/ecommerce and symlink it."
echo "=============================================================================="
