# 🚂 Railway Deployment Guide

## ما هي المشكلة الأصلية؟
الـ Container كان يتعطل بسبب:
- npm install لم تشتغل في الـ Container
- nodemailer ومكتبات أخرى غير موجودة

## ✅ الحل المطبق
1. تحديث الـ Dockerfile ليثبت الـ dependencies بشكل صحيح
2. تحديث entrypoint.sh ليتوافق مع Railway
3. إضافة railway.yml للتكوين
4. إضافة .railwayignore لتحسين الأداء

---

## 🚀 خطوات الرفع على Railway

### 1. تحضير Repository
```bash
cd d:\twm3-repo
git add .
git commit -m "Fix: Docker configuration for Railway deployment"
git push origin main
```

### 2. إعدادات Railway Dashboard

1. اذهب إلى https://railway.app
2. اختر "New Project"
3. اختر "Deploy from GitHub"
4. اختر repository الخاص بك

### 3. تكوين البيئة

في Railway Dashboard، اضبط المتغيرات التالية:

```
PORT=5000 (Railway تعينها تلقائياً)
MONGO_URI=mongodb+srv://... (من .env.production)
SESSION_SECRET=... (من .env.production)
JWT_SECRET=... (من .env.production)
NODE_ENV=production
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
FRONTEND_BASE_URL=...
```

### 4. تكوين النطاق (Domain)

1. في Railway Dashboard، اذهب إلى Settings
2. اختر "Domain" 
3. ربط النطاق: api.twm3.org

### 5. مراقبة النشر

```bash
# في Railway Dashboard اختر "Logs"
# ستشاهد:
# ✅ Installing dependencies...
# ✅ Dependencies installed successfully
# ✅ Starting server on port [PORT]...
# ✅ Server listening
```

---

## 🔍 التحقق من الأخطاء

### إذا رأيت "Cannot find module 'nodemailer'"
- تأكد من أن الـ Docker build اكتمل
- تحقق من الـ logs في Railway Dashboard

### إذا رأيت خطأ في الاتصال بـ MongoDB
- تحقق من MONGO_URI في متغيرات البيئة
- تأكد من أن MongoDB Atlas تسمح بـ Railway IP

### إذا لم يبدأ التطبيق
```
خطوات تشخيص:
1. اضغط "Redeploy" في Railway Dashboard
2. شاهد الـ logs
3. تحقق من المتغيرات البيئية
4. تأكد من أن PORT صحيح
```

---

## 📝 ملفات مهمة لـ Railway

| الملف | الدور |
|------|--------|
| `Dockerfile` | بناء الـ image الصحيح مع dependencies |
| `entrypoint.sh` | تشغيل التطبيق بشكل صحيح |
| `railway.yml` | إعدادات Railway |
| `.railwayignore` | تقليل حجم الـ build |
| `.env.production` | متغيرات البيئة (استخدم Dashboard بدلاً منه) |

---

## 🔐 الأمان

**لا تضع كلمات المرور في repository!**

بدلاً من ذلك:
1. استخدم Railway Dashboard لإضافة المتغيرات
2. أضف `.env.production` إلى `.gitignore` (تأكد من أنه موجود)
3. تحقق من عدم رفع ملفات .env

---

## 📊 Deployment Checklist

- [ ] Dockerfile محدث ويثبت dependencies
- [ ] entrypoint.sh محدثة
- [ ] railway.yml موجود
- [ ] .railwayignore موجود
- [ ] Repository مرفوع إلى GitHub
- [ ] Railway متصلة بـ GitHub
- [ ] متغيرات البيئة مضبوطة في Railway Dashboard
- [ ] Logs تظهر "✅ Server listening"

---

## 🆘 استكشاف الأخطاء

### المشكلة: Build فاشل
```
الحل:
1. تحقق من Dockerfile
2. تأكد من وجود package.json
3. اضغط "Redeploy" مرة أخرى
```

### المشكلة: Container متوقف
```
الحل:
1. شاهد الـ logs في Railway
2. تحقق من المتغيرات البيئية
3. تأكد من MONGO_URI صحيح
```

### المشكلة: لا يستجيب الـ API
```
الحل:
1. اضغط على النطاق للتحقق
2. تحقق من SSL Certificate
3. تأكد من firewall rules
```

---

## 📞 أوامر مهمة

```bash
# إعادة تشغيل الـ deployment
# اضغط "Redeploy" في Railway Dashboard

# عرض الـ logs
# اذهب إلى Logs tab في Railway

# تحديث المتغيرات البيئية
# اذهب إلى Variables tab في Railway
```

---

## عند النشر الناجح

- الـ API يعمل على: https://api.twm3.org (أو النطاق المخصص)
- MongoDB متصل
- جميع الـ dependencies مثبتة
- التطبيق يستمع على الـ PORT الديناميكي من Railway

---

## 🎯 التالي

1. ✅ أكمل الـ Deployment
2. ✅ اختبر الـ API endpoints
3. ✅ راقب الـ logs للأخطاء
4. ✅ أضف monitoring

---

**آخر تحديث:** December 6, 2025  
**الحالة:** جاهز للنشر ✅
