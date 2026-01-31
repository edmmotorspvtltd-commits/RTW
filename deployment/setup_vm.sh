#!/bin/bash
# =================================================================
#   RTWE ERP - CLOUD SERVER SETUP SCRIPT
#   Run this on your new Ubuntu 22.04 Server
# =================================================================

echo "Starting Server Setup... (This takes about 5 minutes)"
sleep 3

# 1. Update System
echo "[1/5] Updating System..."
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 18
echo "[2/5] Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node -v

# 3. Install PostgreSQL 14
echo "[3/5] Installing PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Set password for 'postgres' user to 'postgres' (Change this later!)
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
sudo -u postgres psql -c "CREATE DATABASE rtwe_erp;"

# 4. Install PM2 (Process Manager)
echo "[4/5] Installing PM2..."
sudo npm install -g pm2

# 5. Install Nginx (Web Server)
echo "[5/5] Installing Nginx..."
sudo apt install -y nginx

# Allow Firewall
sudo ufw allow 'Nginx Full'
sudo ufw allow 3000
sudo ufw allow 22

echo ""
echo "==================================================="
echo "   SETUP COMPLETE! 🚀"
echo "==================================================="
echo "Node Version: $(node -v)"
echo "DB Status:    $(systemctl is-active postgresql)"
echo ""
echo "Next Steps:"
echo "1. Upload your code to /var/www/rtwe-erp"
echo "2. Restore your database backup"
echo "3. Start app with: pm2 start backend/server.js"
