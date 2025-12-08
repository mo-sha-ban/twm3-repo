#!/bin/bash

# ✅ Deployment Readiness Checker
# هذا الملف يتحقق من استعداد المشروع للـ Deployment

echo "🔍 جاري التحقق من استعداد المشروع..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Helper function
check_item() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅${NC} $2"
        ((PASSED++))
    else
        echo -e "${RED}❌${NC} $2"
        ((FAILED++))
    fi
}

echo "📦 فحص الملفات الأساسية:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test -f "server.js"
check_item $? "server.js موجود"

test -f "package.json"
check_item $? "package.json موجود"

test -f ".env"
check_item $? ".env موجود"

test -f ".env.production"
check_item $? ".env.production موجود"

test -f ".gitignore"
check_item $? ".gitignore موجود"

test -d "controllers"
check_item $? "controllers/ موجود"

test -d "routes"
check_item $? "routes/ موجود"

test -d "models"
check_item $? "models/ موجود"

test -d "middlewares"
check_item $? "middlewares/ موجود"

test -d "public"
check_item $? "public/ موجود"

echo ""
echo "📖 فحص ملفات التوثيق:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test -f "QUICK_GUIDE_AR.md"
check_item $? "QUICK_GUIDE_AR.md موجود"

test -f "NEXT_STEPS.md"
check_item $? "NEXT_STEPS.md موجود"

test -f "TROUBLESHOOTING.md"
check_item $? "TROUBLESHOOTING.md موجود"

test -f "PROJECT_SUMMARY.md"
check_item $? "PROJECT_SUMMARY.md موجود"

test -f "README.md"
check_item $? "README.md موجود"

echo ""
echo "🔧 فحص package.json:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if start script exists
grep -q '"start"' package.json
check_item $? "start script موجود في package.json"

# Check if dependencies exist
grep -q '"express"' package.json
check_item $? "express مثبت"

grep -q '"mongoose"' package.json
check_item $? "mongoose مثبت"

grep -q '"cors"' package.json
check_item $? "cors مثبت"

echo ""
echo "🌍 فحص الـ Environment Variables:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

grep -q "MONGO_URI" .env
check_item $? "MONGO_URI معين"

grep -q "JWT_SECRET" .env
check_item $? "JWT_SECRET معين"

grep -q "GOOGLE_CLIENT_ID" .env
check_item $? "GOOGLE_CLIENT_ID معين"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "📊 النتائج النهائية:"
echo -e "${GREEN}✅ نجح:${NC} $PASSED"
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}❌ فشل:${NC} $FAILED"
else
    echo -e "${GREEN}❌ فشل:${NC} 0"
fi
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🎉 مبروك! المشروع جاهز للـ Deployment!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "📝 الخطوة التالية:"
    echo "1. اقرأ: QUICK_GUIDE_AR.md"
    echo "2. ثبّت: Git"
    echo "3. رفع على: GitHub"
    echo "4. Deploy على: Railway"
    echo ""
else
    echo -e "${RED}⚠️ هناك بعض المشاكل يجب حلها!${NC}"
    echo "اقرأ: TROUBLESHOOTING.md"
    echo ""
fi
