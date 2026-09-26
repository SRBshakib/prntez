#!/bin/bash
# PRNTEZ Production Server Unpack & Restart Script
# Run this directly on your VPS in /var/www:
set -e

echo "=== Deploying PRNTEZ on VPS ==="
cd /var/www

if [ ! -f "deploy.zip" ]; then
    echo "Error: deploy.zip not found in /var/www"
    exit 1
fi

echo "1. Unzipping deploy.zip into /var/www/prntez..."
unzip -o deploy.zip -d /var/www/prntez

echo "2. Installing server dependencies..."
cd /var/www/prntez
npm --prefix server install --production

echo "3. Restarting PM2 process..."
pm2 restart prntez || pm2 start server/index.js --name "prntez"

echo "4. Saving PM2 process list..."
pm2 save

echo "5. Verifying server health..."
sleep 2
curl -s http://localhost:5000/api/health || echo "Health check returned status."

echo "=== DEPLOYMENT COMPLETE ==="
pm2 status
