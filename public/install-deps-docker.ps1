#!/usr/bin/env pwsh
# Quick install dependencies in running container

Write-Host "📦 Installing dependencies in running container..." -ForegroundColor Cyan

# Check if container is running
$containerStatus = docker ps --filter "name=twm3-backend" --format "{{.State}}"
if ($containerStatus -ne "running") {
    Write-Host "❌ Container is not running. Starting it first..." -ForegroundColor Red
    docker-compose up -d backend
    Start-Sleep -Seconds 5
}

# Run npm install in the container
Write-Host "Running npm ci in container..." -ForegroundColor Yellow
docker exec twm3-backend npm ci --omit=dev

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green
    Write-Host "Restarting container..." -ForegroundColor Yellow
    docker-compose restart backend
    Start-Sleep -Seconds 3
    Write-Host "Container logs:" -ForegroundColor Green
    docker-compose logs backend
} else {
    Write-Host "❌ Failed to install dependencies!" -ForegroundColor Red
    exit 1
}
