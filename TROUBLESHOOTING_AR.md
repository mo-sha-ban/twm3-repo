# دليل حل المشاكل - خطوة بخطوة

## 🔍 تشخيص المشكلة

### الخطوة 1: تحديد المشكلة

أجب على هذه الأسئلة:

1. **هل رفعت الكود على Vercel/Railway؟**
   - [ ] نعم
   - [ ] لا

2. **هل ظهرت أخطاء في Build؟**
   - [ ] نعم → اقرأ قسم "أخطاء البناء"
   - [ ] لا → اقرأ قسم "أخطاء التشغيل"

3. **هل الموقع على Hostinger يعمل؟**
   - [ ] نعم → المشكلة في API فقط
   - [ ] لا → المشكلة في Frontend

4. **هل يظهر أي شيء على الشاشة؟**
   - [ ] صفحة بيضاء → مشكلة JavaScript
   - [ ] أخطاء في Console → مشكلة API
   - [ ] لا شيء → مشكلة في الرفع

---

## 🚨 السيناريو 1: لم أرفع الكود بعد

### ما تحتاج فعله:

1. **تأكد من وجود Git:**
```bash
git --version
```

2. **إذا لم يكن موجوداً، ثبت Git:**
   - Windows: [git-scm.com](https://git-scm.com/)
   - اتبع التعليمات

3. **أنشئ repository على GitHub:**
   - اذهب إلى [github.com](https://github.com)
   - اضغط "New repository"
   - سمّه مثلاً: `twm3-website`

4. **ارفع الكود:**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/twm3-website.git
git push -u origin main
```

5. **اذهب إلى Vercel:**
   - [vercel.com/new](https://vercel.com/new)
   - اختر repository
   - اضغط Deploy

---

## 🚨 السيناريو 2: رفعت الكود لكن Build فشل

### أخطاء شائعة:

#### خطأ: `npm ci failed`
```
Missing: nodemailer@6.10.1 from lock file
```

**الحل:**
```bash
# احذف package-lock.json وأعد إنشاءه
Remove-Item package-lock.json
npm install
git add package-lock.json
git commit -m "Fix package-lock.json"
git push
```

#### خطأ: `Module not found`
```
Cannot find module '../twm3-backend/...'
```

**الحل:**
✅ تم إصلاحه في آخر تحديث
- تأكد من أنك رفعت آخر نسخة من api/index.js

#### خطأ: `Build exceeded maximum duration`
**الحل:**
- قلل حجم node_modules
- استخدم .vercelignore

---

## 🚨 السيناريو 3: Build نجح لكن API لا يعمل

### اختبار API:

1. **افتح ملف TEST_API.html:**
   - افتحه في المتصفح
   - أدخل رابط Vercel الخاص بك
   - اضغط على أزرار الاختبار

2. **إذا ظهر خطأ CORS:**
```
Access blocked by CORS policy
```

**الحل:**
- تحقق من api/index.js - سطر 63-68
- تأكد من إضافة دومين Hostinger

3. **إذا ظهر 404:**
```
GET /api/courses 404
```

**الحل:**
- تحقق من vercel.json
- تأكد من routes configuration

---

## 🚨 السيناريو 4: API يعمل لكن Frontend لا يعمل

### تشخيص Frontend:

1. **افتح Developer Tools (F12)**
2. **اذهب إلى Console**
3. **ابحث عن أخطاء**

#### خطأ: `Refused to execute script`
```
MIME type is 'text/html'
```

**الحل:**
```
1. تأكد من رفع .htaccess على Hostinger
2. تأكد من أن .htaccess في المجلد الرئيسي
3. تحقق من إعدادات Apache في Hostinger
```

#### خطأ: `Failed to fetch`
```
GET https://www.twm3.org/api/courses failed
```

**الحل:**
```javascript
// تحقق من js/config.js
const API_CONFIG = {
    API_BASE_URL: 'https://YOUR-PROJECT.vercel.app/api', // هل هذا صحيح؟
};
```

---

## 🚨 السيناريو 5: لا شيء يظهر على الشاشة

### الخطوات:

1. **تحقق من Hostinger:**
   - هل رفعت الملفات؟
   - هل الملفات في المجلد الصحيح (public_html)؟

2. **تحقق من index.html:**
   - هل يفتح مباشرة؟
   - جرب: https://www.twm3.org/index.html

3. **تحقق من .htaccess:**
   - هل موجود؟
   - هل في المجلد الرئيسي؟

---

## 📋 قائمة تحقق شاملة

### Backend (Vercel/Railway):
- [ ] الكود على GitHub
- [ ] Build نجح
- [ ] Environment Variables مضافة
- [ ] /health يعمل (اختبر: https://your-project.vercel.app/health)
- [ ] /api/courses يعمل

### Frontend (Hostinger):
- [ ] جميع الملفات مرفوعة
- [ ] .htaccess موجود
- [ ] js/config.js محدث برابط API الصحيح
- [ ] mod_rewrite مفعل
- [ ] index.html يفتح

### الاتصال:
- [ ] CORS مضبوط
- [ ] API URL صحيح في config.js
- [ ] لا أخطاء في Console
- [ ] Network requests تنجح

---

## 🛠️ أدوات المساعدة

### 1. اختبار API:
افتح `TEST_API.html` في المتصفح

### 2. فحص CORS:
```bash
curl -H "Origin: https://www.twm3.org" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://your-project.vercel.app/api/courses
```

### 3. فحص Logs:
- Vercel: Dashboard → Deployments → View Logs
- Hostinger: cPanel → Error Logs

---

## 📞 إذا ما زالت المشكلة موجودة

أرسل لي المعلومات التالية:

1. **رابط Vercel/Railway:**
2. **رابط Hostinger:**
3. **صورة من Console (F12):**
4. **صورة من Network tab:**
5. **آخر خطوة قمت بها:**

---

**آخر تحديث:** 2025-12-11