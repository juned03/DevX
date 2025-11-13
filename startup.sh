#!/bin/bash
# Azure App Service startup script
# This ensures dependencies are installed before starting the app

cd /home/site/wwwroot

# Display Node.js version
echo "Node.js version:"
node -v
echo "NPM version:"
npm -v

# Always ensure dependencies are properly installed
# Azure App Service may have partial or stale node_modules, so we always reinstall
echo "Installing production dependencies..."
# Remove node_modules if it exists to ensure clean install
if [ -d "node_modules" ]; then
    echo "Removing existing node_modules for clean install..."
    rm -rf node_modules
fi

# Install dependencies
npm ci --production --prefer-offline --no-audit

# Verify critical modules are installed
echo "Verifying critical modules..."
if [ ! -d "node_modules/drizzle-orm" ]; then
    echo "ERROR: drizzle-orm not found after installation!"
    exit 1
fi
if [ ! -d "node_modules/mysql2" ]; then
    echo "ERROR: mysql2 not found after installation!"
    exit 1
fi
if [ ! -d "node_modules/express" ]; then
    echo "ERROR: express not found after installation!"
    exit 1
fi
echo "Critical modules verified successfully"

# Verify dist directory exists
if [ ! -d "dist" ]; then
    echo "ERROR: dist directory not found!"
    exit 1
fi

# Verify dist/index.js exists
if [ ! -f "dist/index.js" ]; then
    echo "ERROR: dist/index.js not found!"
    exit 1
fi

# Start the application
echo "Starting application with NODE_ENV=production..."
export NODE_ENV=production
node dist/index.js

