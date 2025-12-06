# ✅ Deployment Readiness Checker for Windows
# هذا الملف يتحقق من استعداد المشروع للـ Deployment

Write-Host "🔍 جاري التحقق من استعداد المشروع..." -ForegroundColor Cyan
Write-Host ""

# Counters
$PASSED = 0
$FAILED = 0

# Helper function
function Check-Item {
    param(
        [bool]$condition,
        [string]$message
    )
    
    if ($condition) {
        Write-Host "✅ $message" -ForegroundColor Green
        $script:PASSED++
    } else {
        Write-Host "❌ $message" -ForegroundColor Red
        $script:FAILED++
    }
}

Write-Host "📦 فحص الملفات الأساسية:" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

Check-Item (Test-Path "server.js") "server.js موجود"
Check-Item (Test-Path "package.json") "package.json موجود"
Check-Item (Test-Path ".env") ".env موجود"
Check-Item (Test-Path ".env.production") ".env.production موجود"
Check-Item (Test-Path ".gitignore") ".gitignore موجود"
Check-Item (Test-Path "controllers") "controllers/ موجود"
Check-Item (Test-Path "routes") "routes/ موجود"
Check-Item (Test-Path "models") "models/ موجود"
Check-Item (Test-Path "middlewares") "middlewares/ موجود"
Check-Item (Test-Path "public") "public/ موجود"

Write-Host ""
Write-Host "📖 فحص ملفات التوثيق:" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

Check-Item (Test-Path "QUICK_GUIDE_AR.md") "QUICK_GUIDE_AR.md موجود"
Check-Item (Test-Path "NEXT_STEPS.md") "NEXT_STEPS.md موجود"
Check-Item (Test-Path "TROUBLESHOOTING.md") "TROUBLESHOOTING.md موجود"
Check-Item (Test-Path "PROJECT_SUMMARY.md") "PROJECT_SUMMARY.md موجود"
Check-Item (Test-Path "README.md") "README.md موجود"

Write-Host ""
Write-Host "🔧 فحص package.json:" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

$packageContent = Get-Content package.json -Raw

Check-Item ($packageContent -match '"start"') "start script موجود في package.json"
Check-Item ($packageContent -match '"express"') "express مثبت"
Check-Item ($packageContent -match '"mongoose"') "mongoose مثبت"
Check-Item ($packageContent -match '"cors"') "cors مثبت"

Write-Host ""
Write-Host "🌍 فحص الـ Environment Variables:" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

$envContent = Get-Content .env -Raw

Check-Item ($envContent -match "MONGO_URI") "MONGO_URI معين"
Check-Item ($envContent -match "JWT_SECRET") "JWT_SECRET معين"
Check-Item ($envContent -match "GOOGLE_CLIENT_ID") "GOOGLE_CLIENT_ID معين"

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host ""
Write-Host "📊 النتائج النهائية:" -ForegroundColor Cyan

Write-Host "✅ نجح: $PASSED" -ForegroundColor Green

if ($FAILED -gt 0) {
    Write-Host "❌ فشل: $FAILED" -ForegroundColor Red
} else {
    Write-Host "❌ فشل: 0" -ForegroundColor Green
}

Write-Host ""

if ($FAILED -eq 0) {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host "🎉 مبروك! المشروع جاهز للـ Deployment!" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 الخطوة التالية:" -ForegroundColor Cyan
    Write-Host "1. اقرأ: QUICK_GUIDE_AR.md"
    Write-Host "2. ثبّت: Git"
    Write-Host "3. رفع على: GitHub"
    Write-Host "4. Deploy على: Railway"
    Write-Host ""
} else {
    Write-Host "⚠️ هناك بعض المشاكل يجب حلها!" -ForegroundColor Red
    Write-Host "اقرأ: TROUBLESHOOTING.md" -ForegroundColor Yellow
    Write-Host ""
}
