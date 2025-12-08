# 🐛 دليل حل المشاكل (Troubleshooting)

## ❌ المشكلة: "Cannot find module: express"

### السبب
npm packages لم تثبت

### الحل
```bash
cd d:\TWM3
npm install
```

---

## ❌ المشكلة: "Cannot find module: server"

### السبب
الـ start script خاطئ أو المسار خاطئ

### التحقق
تأكد من `package.json`:
```json
{
  "scripts": {
    "start": "node server.js"
  }
}
```

---

## ❌ المشكلة: "Port 5000 already in use"

### السبب
تطبيق آخر يستخدم المنفذ 5000

### الحل - الخيار 1: غيّر الـ PORT
```bash
# في .env
PORT=3000
```

### الحل - الخيار 2: أغلق البرنامج القديم
```powershell
# في PowerShell
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force
```

---

## ❌ المشكلة: "MongoDB connection timeout"

### السبب
- اتصال الـ Internet ضعيف أو معطوع
- IP address غير مصرح في MongoDB Atlas
- MONGO_URI خاطئ

### الحل - الخيار 1: تحقق من الـ MONGO_URI
```
✅ صحيح: mongodb+srv://keka:0111@nodejs.cq4in.mongodb.net/?...
❌ خاطئ: mongodb://localhost:27017
```

### الحل - الخيار 2: أضف IP Address في MongoDB Atlas
1. اذهب: https://www.mongodb.com/cloud/atlas
2. اختر Cluster
3. اضغط: Network Access
4. اختر: Add IP Address
5. أدخل: 0.0.0.0/0
6. Confirm

---

## ❌ المشكلة: "CORS Error" في المتصفح

### السبب
Frontend و Backend على domains مختلفة

### الحل - في server.js
تأكد من تحديث CORS:
```javascript
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://teamworkm3.com', 'https://www.teamworkm3.com', 'https://api.teamworkm3.com']
        : ['http://localhost:5000', 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://127.0.0.1:5000'],
    credentials: true
}));
```

---

## ❌ المشكلة: "Google OAuth callback URL not matching"

### السبب
الـ Callback URL في Google Console لا يطابق الـ Backend

### الحل
1. اذهب: https://console.cloud.google.com
2. اختر OAuth 2.0 Client ID
3. اختر: Authorized Redirect URIs
4. أضف الـ URIs الصحيحة:

**Development:**
```
http://localhost:5000/api/auth/google/callback
```

**Production:**
```
https://twm3-production-xxx.up.railway.app/api/auth/google/callback
https://teamworkm3.com/api/auth/google/callback
```

5. Save

---

## ❌ المشكلة: "GitHub OAuth failed"

### السبب
CLIENT_ID أو CLIENT_SECRET خاطئ

### الحل
1. اذهب: https://github.com/settings/developers
2. اختر: OAuth Apps
3. تحقق من القيم:
   - Client ID صحيح؟
   - Client Secret صحيح؟
   - Callback URL صحيح؟

4. اختبر locally أولاً قبل الـ production

---

## ❌ المشكلة: "API returns 404"

### السبب
الـ URL خاطئ أو الـ Endpoint غير موجود

### الحل - تحقق من الـ URL
```
❌ http://localhost:5000/api/courses/
✅ http://localhost:5000/api/courses

❌ https://teamworkm3.com/api/courses
✅ https://twm3-production-xxx.up.railway.app/api/courses
```

### الحل - اختبر الـ Endpoint
```bash
curl https://twm3-production-xxx.up.railway.app/api/courses
```

---

## ❌ المشكلة: "Build failed on Railway"

### السبب
عادة: node_modules غير موجودة أو package.json خاطئ

### الحل
1. في Railway → Service → Logs
2. ابحث عن الخطأ (أحمر)
3. تأكد من:
   - [ ] package.json موجود في الجذر
   - [ ] "start" script موجود
   - [ ] جميع الـ dependencies مذكورة
   - [ ] لا توجد syntax errors

---

## ❌ المشكلة: "Cannot read property 'email' of undefined"

### السبب
البيانات المرسلة من Frontend خاطئة

### الحل
1. افتح Chrome DevTools (F12)
2. اذهب: Network
3. اضغط على الـ Request
4. شوف الـ Request Body
5. تأكد من البيانات صحيحة

---

## ❌ المشكلة: "Frontend still calling localhost"

### السبب
لم تقم بـ Find & Replace بشكل صحيح

### الحل
1. افتح Find & Replace (Ctrl+H)
2. Find: `http://localhost:5000`
3. Replace: `https://your-railway-url.up.railway.app`
4. اضغط: Replace All
5. تأكد من التحديث من خلال البحث مرة أخرى

---

## ❌ المشكلة: "Deployment stuck at 'Building'"

### السبب
عادة: الـ build استغرق وقتاً طويلاً أو hung up

### الحل
1. في Railway → Deployments
2. اضغط: Cancel Deployment
3. اضغط: Trigger Deploy
4. أنتظر (قد يستغرق 5-10 دقائق)

---

## ❌ المشكلة: "Uploads not working"

### السبب
المسار `/public/uploads/` قد لا يكون موجود

### الحل - التحقق المحلي
```bash
cd d:\TWM3\public
mkdir uploads  # اذا لم تكن موجودة
```

### الحل - على Railway
Railway قد لا يدعم uploads محلية - تحتاج Cloud Storage (AWS S3, Firebase, etc.)

---

## ❌ المشكلة: "Email not sending"

### السبب
SMTP credentials خاطئة أو غير موجودة

### الحل
تأكد من وجود:
```
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...
```

في الـ environment variables

---

## ✅ اختبر الـ API بـ curl

### الاختبار 1: الاتصال الأساسي
```bash
curl https://your-railway-url.up.railway.app/
```

**النتيجة المتوقعة:**
```
Hello from TWM3 Backend!
```

### الاختبار 2: جلب الكورسات
```bash
curl https://your-railway-url.up.railway.app/api/courses
```

**النتيجة المتوقعة:**
```json
[
  {
    "id": "...",
    "title": "...",
    ...
  }
]
```

### الاختبار 3: تسجيل الدخول
```bash
curl -X POST https://your-railway-url.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "token": "...",
  ...
}
```

---

## 📊 Debugging Checklist

- [ ] تحقق من الـ URL الصحيح
- [ ] تحقق من الـ Method (GET, POST, etc.)
- [ ] تحقق من الـ Headers (Content-Type, etc.)
- [ ] تحقق من الـ Request Body
- [ ] تحقق من الـ Response Status (200, 404, 500, etc.)
- [ ] افتح Console (F12) وابحث عن الأخطاء
- [ ] افتح Network tab وشوف الـ requests
- [ ] تحقق من الـ Server Logs (في Railway)
- [ ] تحقق من الـ Database connection
- [ ] تحقق من الـ Environment Variables

---

## 📞 إذا لم تعرف السبب

1. **خذ screenshot من الخطأ**
2. **انسخ الـ error message كاملاً**
3. **قول لي:**
   - أي خطوة كنت تفعل؟
   - ما الخطأ الذي ظهر؟
   - هل الخطأ في المتصفح أو في Terminal؟
   - متى بدأ الخطأ؟

---

**لو عندك مشكلة ما موجودة هنا، اطلب مساعدة!** 💬
