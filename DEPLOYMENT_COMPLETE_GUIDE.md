# دليل النشر الكامل - Frontend + Backend

## 📋 ملخص سريع

- **Frontend:** Hostinger (www.twm3.org)
- **Backend:** Railway أو Vercel
- **المشكلة:** تم حلها ✅

## 🔧 التحديثات التي تمت

### ملفات جديدة:
1. ✅ `.htaccess` - إعدادات Hostinger
2. ✅ `js/config.js` - إعدادات API
3. ✅ `railway.json` - إعدادات Railway
4. ✅ `nixpacks.toml` - إعدادات البناء
5. ✅ `api/server.js` - نقطة دخول السيرفر

### ملفات محدثة:
1. ✅ `package.json` - تحديث scripts و engines
2. ✅ `package-lock.json` - تم إعادة إنشائه
3. ✅ `vercel.json` - تحسين CORS
4. ✅ `api/index.js` - إضافة endpoints

---

## 🚀 خطوات النشر

### المرحلة 1: نشر Backend

#### اختيار 1: Railway (موصى به للمبتدئين)

**الخطوة 1: ارفع على GitHub**
```bash
git add .
git commit -m "Fix deployment configuration"
git push origin main
```

**الخطوة 2: في Railway Dashboard**
1. اذهب إلى [railway.app](https://railway.app)
2. اضغط "New Project"
3. اختر "Deploy from GitHub repo"
4. اختر مستودعك
5. انتظر حتى ينتهي البناء

**الخطوة 3: إضافة متغيرات البيئة**
في Railway → Variables:
```
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=5000
```

**الخطوة 4: احصل على الرابط**
```
https://your-project-name.railway.app
```

#### اختيار 2: Vercel

**الخطوة 1: تثبيت Vercel CLI**
```bash
npm install -g vercel
```

**الخطوة 2: تسجيل الدخول والنشر**
```bash
vercel login
vercel --prod
```

**الخطوة 3: إضافة متغيرات البيئة**
في Vercel Dashboard → Settings → Environment Variables

**الخطوة 4: احصل على الرابط**
```
https://your-project-name.vercel.app
```

---

### المرحلة 2: تحديث Frontend

**الخطوة 1: تحديث js/config.js**

افتح `js/config.js` وغير:
```javascript
const API_CONFIG = {
    // استخدم رابط Railway أو Vercel
    API_BASE_URL: 'https://your-project.railway.app/api',
    // أو
    // API_BASE_URL: 'https://your-project.vercel.app/api',
    
    FRONTEND_URL: 'https://www.twm3.org',
    TIMEOUT: 30000,
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000
};
```

**الخطوة 2: رفع على Hostinger**

الملفات المطلوبة:
- ✅ `.htaccess`
- ✅ `index.html` وجميع ملفات HTML
- ✅ مجلد `js/` كامل (مع config.js المحدث)
- ✅ مجلد `css/` كامل
- ✅ مجلد `img/` كامل
- ✅ مجلد `assets/` (إن وجد)

الملفات التي **لا** يجب رفعها:
- ❌ `node_modules/`
- ❌ `api/`
- ❌ `twm3-backend/`
- ❌ `.git/`
- ❌ `package.json`

**الخطوة 3: تفعيل mod_rewrite في Hostinger**
1. اذهب إلى Advanced → Apache Configuration
2. تأكد من تفعيل mod_rewrite
3. تأكد من تفعيل mod_headers

---

### المرحلة 3: الاختبار

**1. اختبار Backend:**

```bash
# Health Check
curl https://your-project.railway.app/health

# يجب أن يعرض:
{"status":"OK"}

# API Test
curl https://your-project.railway.app/api/courses

# يجب أن يعرض بيانات JSON
```

**2. اختبار Frontend:**

1. افتح https://www.twm3.org
2. اضغط F12 (Developer Tools)
3. تحقق من Console - لا أخطاء حمراء
4. تحقق من Network - تحميل ملفات JS بنجاح
5. اختبر التنقل بين الصفحات

**3. اختبار التكامل:**

- ✅ Counter يعمل
- ✅ Courses carousel يظهر
- ✅ الصور تحمل
- ✅ API calls تعمل

---

## 🐛 استكشاف الأخطاء الشائعة

### خطأ 1: npm ci failed (تم حله ✅)
```
Missing: nodemailer@6.10.1 from lock file
```
**الحل:** تم إعادة إنشاء package-lock.json

### خطأ 2: MIME type errors
```
Refused to execute script because MIME type is 'text/html'
```
**الحل:** 
- تأكد من رفع `.htaccess` على Hostinger
- تأكد من تفعيل mod_mime

### خطأ 3: API 404 errors
```
GET https://www.twm3.org/api/courses 404
```
**الحل:**
- تحقق من `js/config.js` - هل الرابط صحيح؟
- تأكد من نجاح deployment على Railway/Vercel

### خطأ 4: CORS errors
```
Access blocked by CORS policy
```
**الحل:**
- تحقق من `api/index.js` - إعدادات CORS
- تأكد من إضافة www.twm3.org في قائمة origin

### خطأ 5: Environment variables
```
Cannot connect to database
```
**الحل:**
- تحقق من Variables في Railway/Vercel
- تأكد من صحة MONGODB_URI

---

## 📝 قائمة التحقق النهائية

### Backend (Railway/Vercel):
- [ ] تم رفع الكود على GitHub
- [ ] تم النشر بنجاح
- [ ] تم إضافة متغيرات البيئة
- [ ] Health check يعمل
- [ ] API endpoints تعمل

### Frontend (Hostinger):
- [ ] تم تحديث js/config.js
- [ ] تم رفع جميع الملفات
- [ ] تم رفع .htaccess
- [ ] mod_rewrite مفعل
- [ ] الموقع يفتح بدون أخطاء

### الاختبار:
- [ ] Console خالي من الأخطاء
- [ ] Network tab يظهر نجاح التحميل
- [ ] Counter يعمل
- [ ] Courses تظهر
- [ ] التنقل يعمل

---

## 🎯 الخطوات التالية

1. **ارفع التغييرات:**
```bash
git add .
git commit -m "Complete deployment configuration"
git push origin main
```

2. **انتظر البناء على Railway/Vercel**

3. **احصل على رابط Backend**

4. **حدث js/config.js برابط Backend**

5. **ارفع Frontend على Hostinger**

6. **اختبر الموقع**

7. **استمتع! 🎉**

---

## 📞 الدعم

إذا واجهت مشاكل:
1. تحقق من Logs في Railway/Vercel
2. تحقق من Console في المتصفح
3. تحقق من Network tab
4. راجع هذا الدليل

---

**آخر تحديث:** 2025-12-11
**الحالة:** جاهز للنشر 100% ✅