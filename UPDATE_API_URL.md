# كيفية تحديث رابط API

## الخطوة 1: معرفة رابط Vercel الخاص بك

بعد رفع المشروع على Vercel، ستحصل على رابط مثل:
- `https://twm3-repo.vercel.app`
- أو `https://your-project-name.vercel.app`

## الخطوة 2: تحديث ملف config.js

افتح ملف `js/config.js` وغير السطر التالي:

### قبل التحديث:
```javascript
API_BASE_URL: 'https://twm3-repo.vercel.app/api',
```

### بعد التحديث:
```javascript
API_BASE_URL: 'https://YOUR-PROJECT-NAME.vercel.app/api',
```

**مهم:** استبدل `YOUR-PROJECT-NAME` باسم مشروعك الفعلي على Vercel

## الخطوة 3: أمثلة على الروابط الصحيحة

### إذا كان رابط Vercel الخاص بك:
`https://twm3-backend.vercel.app`

### يجب أن يكون API_BASE_URL:
```javascript
API_BASE_URL: 'https://twm3-backend.vercel.app/api',
```

### إذا كان لديك دومين مخصص:
`https://api.twm3.org`

### يجب أن يكون API_BASE_URL:
```javascript
API_BASE_URL: 'https://api.twm3.org/api',
```

## الخطوة 4: التحقق من الرابط

اختبر الرابط في المتصفح:

1. **اختبار Health Check:**
   ```
   https://YOUR-PROJECT-NAME.vercel.app/health
   ```
   يجب أن يعرض: `{"status":"OK"}`

2. **اختبار API:**
   ```
   https://YOUR-PROJECT-NAME.vercel.app/api/courses
   ```
   يجب أن يعرض بيانات JSON

## الخطوة 5: حفظ ورفع الملف

1. احفظ التغييرات في `js/config.js`
2. ارفع الملف المحدث على Hostinger
3. امسح الكاش في المتصفح (Ctrl+Shift+Delete)
4. أعد تحميل الموقع

## ملاحظات مهمة ⚠️

1. **لا تنسى `/api` في النهاية**
   - ✅ صحيح: `https://project.vercel.app/api`
   - ❌ خطأ: `https://project.vercel.app`

2. **استخدم HTTPS دائماً**
   - ✅ صحيح: `https://`
   - ❌ خطأ: `http://`

3. **لا تضع `/` في النهاية**
   - ✅ صحيح: `.../api`
   - ❌ خطأ: `.../api/`

## استكشاف الأخطاء

### إذا ظهر خطأ 404:
- تحقق من الرابط في `js/config.js`
- تأكد من أن Vercel deployment نجح
- اختبر الرابط مباشرة في المتصفح

### إذا ظهر خطأ CORS:
- تحقق من إعدادات CORS في `api/index.js`
- تأكد من إضافة دومين Hostinger في قائمة `origin`

### إذا لم يعمل:
1. افتح Developer Tools (F12)
2. اذهب لـ Network tab
3. انظر للأخطاء في الطلبات
4. تحقق من الرابط المستخدم

---

**نصيحة:** احفظ رابط Vercel في مكان آمن لاستخدامه لاحقاً!