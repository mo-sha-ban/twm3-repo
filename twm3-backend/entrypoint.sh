#!/bin/sh
# Docker entrypoint script

echo "Starting TWM3 Backend..."
echo "Current directory: $(pwd)"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "PORT environment: ${PORT:-5000}"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm ci --omit=dev
    if [ $? -ne 0 ]; then
        echo "Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed successfully"
else
    echo "✅ node_modules already exists"
fi

# Verify key dependencies are installed
echo "Checking key dependencies..."
npm list nodemailer express mongoose 2>/dev/null | head -5

echo ""
echo "✅ Starting server on port ${PORT:-5000}..."
echo "Starting npm..."
exec npm start
