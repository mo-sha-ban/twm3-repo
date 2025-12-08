#!/usr/bin/env pwsh
# Test Docker setup - verifies everything is configured correctly

Write-Host "🧪 Testing TWM3 Backend Docker Setup..." -ForegroundColor Cyan
Write-Host ""

# Check 1: Docker installed
Write-Host "1. Checking Docker installation..." -ForegroundColor Yellow
$dockerVersion = docker --version 2>$null
if ($dockerVersion) {
    Write-Host "   ✅ Docker: $dockerVersion" -ForegroundColor Green
} else {
    Write-Host "   ❌ Docker not found. Please install Docker Desktop." -ForegroundColor Red
    exit 1
}

# Check 2: Docker Compose installed
Write-Host "2. Checking Docker Compose..." -ForegroundColor Yellow
$composeVersion = docker-compose --version 2>$null
if ($composeVersion) {
    Write-Host "   ✅ Docker Compose: $composeVersion" -ForegroundColor Green
} else {
    Write-Host "   ❌ Docker Compose not found." -ForegroundColor Red
    exit 1
}

# Check 3: Repository structure
Write-Host "3. Checking repository structure..." -ForegroundColor Yellow
$errors = 0

@("twm3-backend/package.json", "twm3-backend/Dockerfile", "docker-compose.yml", "twm3-backend/entrypoint.sh") | ForEach-Object {
    if (Test-Path $_) {
        Write-Host "   ✅ Found: $_" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Missing: $_" -ForegroundColor Red
        $errors++
    }
}

if ($errors -gt 0) {
    Write-Host "   ❌ Some files are missing. Run 'rebuild-docker.ps1' to recreate them." -ForegroundColor Red
    exit 1
}

# Check 4: Package.json contains nodemailer
Write-Host "4. Checking package.json for dependencies..." -ForegroundColor Yellow
$packageJson = Get-Content "twm3-backend/package.json" -Raw
$packages = @("nodemailer", "express", "mongoose")
foreach ($pkg in $packages) {
    if ($packageJson -match $pkg) {
        Write-Host "   ✅ Found: $pkg" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Missing: $pkg" -ForegroundColor Yellow
    }
}

# Check 5: Port availability
Write-Host "5. Checking if port 5000 is available..." -ForegroundColor Yellow
$portInUse = netstat -ano 2>$null | Select-String ":5000"
if ($portInUse) {
    Write-Host "   ⚠️  Port 5000 is already in use:" -ForegroundColor Yellow
    Write-Host "   $portInUse" -ForegroundColor Yellow
    Write-Host "   You may need to change the port in docker-compose.yml" -ForegroundColor Yellow
} else {
    Write-Host "   ✅ Port 5000 is available" -ForegroundColor Green
}

# Check 6: Docker running
Write-Host "6. Checking Docker daemon..." -ForegroundColor Yellow
$dockerInfo = docker info 2>$null
if ($dockerInfo) {
    Write-Host "   ✅ Docker daemon is running" -ForegroundColor Green
} else {
    Write-Host "   ❌ Docker daemon is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ All checks passed! Ready to build." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run: .\rebuild-docker.ps1" -ForegroundColor White
Write-Host "2. Wait for container to start and dependencies to install" -ForegroundColor White
Write-Host "3. Check logs with: docker-compose logs -f" -ForegroundColor White
Write-Host ""
