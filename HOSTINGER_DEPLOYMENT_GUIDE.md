# دليل رفع الموقع على Hostinger

## المشكلة الحالية
الموقع مرفوع على Hostinger لكن الملفات JavaScript لا تعمل والـ API لا يستجيب.

## الحل

### 1. التأكد من رفع جميع الملفات على Hostinger

يجب رفع الملفات التالية على Hostinger:

#### الملفات الأساسية:
- `index.html`
- `.htaccess` (الملف الجديد المحدث)
- جميع ملفات HTML الأخرى

#### المجلدات المطلوبة:
- `js/` - جميع ملفات JavaScript
- `css/` - جميع ملفات CSS
- `img/` - جميع الصور
- `assets/` - الأصول الأخرى
- `pdfjs/` - مكتبة PDF.js

### 2. التحقق من إعدادات Hostinger

#### في لوحة تحكم Hostinger:

1. **تفعيل mod_rewrite**:
   - اذهب إلى Advanced → Apache Configuration
   - تأكد من تفعيل mod_rewrite

2. **تفعيل mod_headers**:
   - تأكد من تفعيل mod_headers لإعدادات CORS

3. **رفع ملف .htaccess**:
   - تأكد من رفع ملف `.htaccess` الجديد
   - يجب أن يكون في المجلد الرئيسي (public_html)

### 3. تحديث رابط API في Vercel

في ملف `js/config.js`، تأكد من تحديث رابط API:

```javascript
const API_CONFIG = {
    API_BASE_URL: 'https://your-vercel-app.vercel.app/api',
    // أو إذا كان لديك دومين مخصص:
    // API_BASE_URL: 'https://api.twm3.org/api',
};
```

### 4. إعدادات Vercel للـ Backend

تأكد من أن ملف `vercel.json` يحتوي على:

```json
{
    "version": 2,
    "env": {
        "NODE_ENV": "production"
    },
    "functions": {
        "api/*.js": {
            "memory": 1024,
            "maxDuration": 60
        }
    },
    "routes": [
        {
            "src": "/api/(.*)",
            "dest": "/api/index.js"
        }
    ]
}
```

### 5. اختبار الموقع

بعد رفع الملفات:

1. **اختبار تحميل JavaScript**:
   - افتح Developer Tools (F12)
   - تحقق من تحميل ملفات JS بدون أخطاء

2. **اختبار API**:
   - افتح Console
   - يجب ألا ترى أخطاء 404 للـ API

3. **اختبار التنقل**:
   - جرب التنقل بين الصفحات
   - يجب أن يعمل بدون مشاكل

## الملفات المحدثة

### ملفات جديدة تم إنشاؤها:
1. `.htaccess` - إعدادات Apache للـ MIME types و SPA routing
2. `js/config.js` - إعدادات API المركزية

### ملفات تم تحديثها:
1. `index.html` - إضافة config.js
2. `js/counter.js` - استخدام API_CONFIG

## خطوات الرفع السريعة

1. احذف جميع الملفات القديمة من Hostinger
2. ارفع جميع الملفات الجديدة
3. تأكد من رفع `.htaccess`
4. حدث رابط API في `js/config.js`
5. اختبر الموقع

## استكشاف الأخطاء

### إذا ظهرت أخطاء MIME type:
- تأكد من رفع `.htaccess`
- تحقق من إعدادات Apache في Hostinger

### إذا لم تعمل API:
- تحقق من رابط API في `js/config.js`
- تأكد من أن Vercel deployment يعمل
- تحقق من CORS settings في Vercel

### إذا لم يعمل التنقل:
- تأكد من وجود `.htaccess`
- تحقق من تفعيل mod_rewrite

## ملاحظات مهمة

1. **لا ترفع مجلد `node_modules/`** على Hostinger
2. **لا ترفع مجلد `api/`** على Hostinger (هذا للـ backend فقط)
3. **تأكد من رفع جميع مجلدات `js/`, `css/`, `img/`**
4. **الملف `.htaccess` يجب أن يكون في المجلد الرئيسي**

## الدعم

إذا واجهت مشاكل:
1. تحقق من Console في المتصفح (F12)
2. تحقق من Network tab لمعرفة الملفات التي فشلت
3. تحقق من error logs في Hostinger