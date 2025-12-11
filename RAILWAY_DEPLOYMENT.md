# دليل نشر Backend على Railway

## المشكلة الحالية
خطأ في بناء المشروع على Railway بسبب عدم تطابق package-lock.json

## الحل ✅

### 1. تحديث package-lock.json (تم ✓)
تم تحديث الملف ليتطابق مع package.json

### 2. ملفات التكوين الجديدة

تم إنشاء:
- `railway.json` - إعدادات Railway
- `nixpacks.toml` - إعدادات البناء

### 3. خطوات النشر على Railway

#### الطريقة 1: من خلال GitHub (موصى بها)

1. **ارفع التغييرات على GitHub:**
```bash
git add .
git commit -m "Fix package-lock.json and add Railway config"
git push origin main
```

2. **في Railway Dashboard:**
   - اذهب لمشروعك
   - اضغط "Redeploy" أو "Deploy"
   - انتظر حتى ينتهي البناء

#### الطريقة 2: من خلال Railway CLI

```bash
# تثبيت Railway CLI (إذا لم يكن مثبتاً)
npm install -g @railway/cli

# تسجيل الدخول
railway login

# ربط المشروع
railway link

# نشر
railway up
```

### 4. متغيرات البيئة المطلوبة

في Railway Dashboard → Variables، أضف:

```
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
```

### 5. التحقق من النشر

بعد النشر الناجح:

1. **اختبار Health Check:**
```
https://your-railway-app.railway.app/health
```
يجب أن يعرض: `{"status":"OK"}`

2. **اختبار API:**
```
https://your-railway-app.railway.app/api/courses
```

### 6. تحديث Frontend

بعد نشر Backend على Railway، حدث `js/config.js`:

```javascript
const API_CONFIG = {
    API_BASE_URL: 'https://your-railway-app.railway.app/api',
    // ...
};
```

## استكشاف الأخطاء

### خطأ: npm ci failed
**السبب:** package-lock.json غير متطابق
**الحل:** تم إصلاحه ✓

### خطأ: Module not found
**السبب:** مكتبة مفقودة في package.json
**الحل:** تأكد من وجود جميع المكتبات في dependencies

### خطأ: Port already in use
**السبب:** المنفذ محجوز
**الحل:** Railway يخصص المنفذ تلقائياً، استخدم `process.env.PORT`

### خطأ: Database connection failed
**السبب:** MONGODB_URI غير صحيح
**الحل:** تحقق من متغيرات البيئة في Railway

## ملاحظات مهمة

1. **استخدم Node.js 18.x** - متوافق مع جميع المكتبات
2. **لا تنسى متغيرات البيئة** - ضرورية للتشغيل
3. **تحقق من Logs** - في حالة فشل النشر
4. **استخدم GitHub** - للنشر التلقائي

## الخطوات التالية

1. ✅ تم إصلاح package-lock.json
2. ✅ تم إنشاء ملفات التكوين
3. 🔄 ارفع على GitHub
4. 🔄 أعد النشر على Railway
5. 🔄 حدث رابط API في Frontend
6. 🔄 اختبر الموقع

## روابط مفيدة

- [Railway Dashboard](https://railway.app/dashboard)
- [Railway Docs](https://docs.railway.app/)
- [Railway CLI](https://docs.railway.app/develop/cli)

---

**آخر تحديث:** 2025-12-11
**الحالة:** جاهز للنشر ✅