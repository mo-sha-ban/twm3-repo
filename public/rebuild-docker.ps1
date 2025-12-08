#!/usr/bin/env pwsh
# Rebuild and restart Docker container script for Windows PowerShell

Write-Host "🔄 Rebuilding TWM3 Backend Docker Image..." -ForegroundColor Cyan

# Navigate to the repository root
$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoRoot

# Stop and remove existing container
Write-Host "Stopping existing container..." -ForegroundColor Yellow
docker-compose down

# Remove the old image to force rebuild
Write-Host "Removing old image..." -ForegroundColor Yellow
docker rmi twm3-backend:latest 2>$null | Out-Null

# Rebuild with no cache
Write-Host "Building Docker image..." -ForegroundColor Yellow
docker-compose build --no-cache

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Start the container
Write-Host "Starting container..." -ForegroundColor Yellow
docker-compose up -d

# Wait a moment for container to start
Start-Sleep -Seconds 3

# Check logs
Write-Host "Container logs:" -ForegroundColor Green
docker-compose logs -f backend
