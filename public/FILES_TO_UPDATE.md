# 📋 ملفات يجب تحديث API URLs فيها

## ملفات Frontend (الأهم)

### 1. ✅ settings.js - LINE 3
```javascript
// BEFORE
const API_BASE = 'http://localhost:5000/api';

// AFTER
const API_BASE = 'https://your-railway-url.up.railway.app/api';
```

---

### 2. ✅ course.js - LINE 10
```javascript
// BEFORE
const API_BASE = 'http://localhost:5000/api';

// AFTER
const API_BASE = 'https://your-railway-url.up.railway.app/api';
```

---

### 3. ✅ course-page.html - LINE 2193
```javascript
// BEFORE
let response = await fetch(`http://localhost:5000/api/courses/${courseId}`);

// AFTER
let response = await fetch(`https://your-railway-url.up.railway.app/api/courses/${courseId}`);
```

---

### 4. ✅ js/profile.js - LINE 438
```javascript
// BEFORE
const origin = window.location.origin && window.location.origin.includes('localhost:5000') 
    ? window.location.origin 
    : 'http://localhost:5000';

// AFTER
const origin = window.location.origin && window.location.origin.includes('your-railway-url') 
    ? window.location.origin 
    : 'https://your-railway-url.up.railway.app';
```

---

### 5. ✅ test-video-upload.html - LINE 236
```javascript
// BEFORE
const response = await fetch('http://localhost:5000/api/uploads/lesson-asset', {

// AFTER
const response = await fetch('https://your-railway-url.up.railway.app/api/uploads/lesson-asset', {
```

---

### 6. ✅ private/dash.js - LINE 1209
```javascript
// BEFORE
const res = await fetch('http://localhost:5000/api/uploads/lesson-asset', {

// AFTER
const res = await fetch('https://your-railway-url.up.railway.app/api/uploads/lesson-asset', {
```

---

### 7. ✅ pdf_tester.html - LINE 11
```html
<!-- BEFORE -->
<iframe src="http://localhost:5000/uploads/1758875856330-84098961.pdf"

<!-- AFTER -->
<iframe src="https://your-railway-url.up.railway.app/uploads/1758875856330-84098961.pdf"
```

---

## ملفات Backend (تم التحديث بالفعل)

### 1. ✅ server.js - صفات متعددة
الملف محدث بالفعل لـ production - يدعم متغيرات البيئة

### 2. ✅ routes/auth.js - صفات متعددة
```javascript
// تم التحديث لاستخدام process.env
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || 'http://localhost:5000';
```

---

## 🔥 الطريقة الأسرع: Find & Replace

**في VS Code:**

1. اضغط `Ctrl+H` (Find and Replace)
2. ابحث عن:
   ```
   http://localhost:5000
   ```
3. استبدل بـ:
   ```
   https://your-railway-url.up.railway.app
   ```
4. اضغط "Replace All"

---

## 📊 ملخص التحديثات

```
Total: 48 matches
├─ Frontend (critical):     7 files
├─ Backend (already done):  15 files
├─ Docs (no change):        ~25 files
└─ Other:                   Mostly in duplicates
```

---

## ⚠️ تنبيهات مهمة

### ⚠️ لا تنسى الـ HTTPS!

```
❌ http://localhost:5000
✅ https://your-railway-url.up.railway.app
```

### ⚠️ الـ URL يجب أن ينتهي بـ .app أو .io

```
✅ https://twm3-production-abcd.up.railway.app
❌ https://twm3-production-abcd.up.railway.app/
❌ https://twm3-production-abcd
```

---

## 🎯 الخطوات:

1. **احصل على الـ URL من Railway** ← ستحصل عليه بعد Deployment
2. **استخدم Find & Replace** ← `Ctrl+H`
3. **استبدل جميع instances** ← "Replace All"
4. **رفع على Hostinger** ← استخدم FTP أو Upload
5. **اختبر الموقع** ← افتح https://teamworkm3.com

---

## 💡 مثال عملي

**بعد الحصول على URL من Railway:**

```
https://twm3-production-xyz123.up.railway.app
```

**الخطوات في VS Code:**

```
1. Ctrl+H
2. Find: http://localhost:5000
3. Replace: https://twm3-production-xyz123.up.railway.app
4. Replace All
5. Save (Ctrl+S)
```

**النتيجة:**
```javascript
// settings.js
const API_BASE = 'https://twm3-production-xyz123.up.railway.app/api';

// course.js
const API_BASE = 'https://twm3-production-xyz123.up.railway.app/api';

// course-page.html
let response = await fetch(`https://twm3-production-xyz123.up.railway.app/api/courses/${courseId}`);
```

---

## ✅ التحقق النهائي

بعد التحديث:

- [ ] جميع `localhost:5000` استبدلت
- [ ] استخدمت `https` (آمن)
- [ ] الـ URL من Railway صحيح
- [ ] لم تنسى `/api` عند الحاجة
- [ ] تم الحفظ والرفع على Hostinger

---

**هل تحتاج أي مساعدة في Find & Replace؟** 🚀
