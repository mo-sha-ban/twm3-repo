# 🚀 Backend Deployment Guide - TWM3

## الحالة الحالية
- الموقع (Frontend) مرفوع على Hosting
- Backend لم يتم رفعه بعد
- تحتاج تشغيل Server منفصل للـ API

---

## ✅ خطوات الرفع على Hosting

### **الخطوة 1: اختيار Hosting Provider**

يمكنك استخدام أي من هذه الخدمات (الأفضل):
- **Render** (مجاني بـ limitations)
- **Railway** (سهل جداً، مجاني أول شهر)
- **Heroku** (كان مجاني، الآن مدفوع)
- **Vercel** (للـ Serverless Functions)
- **DigitalOcean** (AppPlatform)

### **الخطوة 2: تحضير الملفات**

#### أولاً: تحديث package.json

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  }
}
```

#### ثانياً: التأكد من وجود .env مع المتغيرات الصحيحة

الملفات المطلوبة:
- ✅ `server.js` - الملف الرئيسي
- ✅ `package.json` - التبعيات
- ✅ `.env` - المتغيرات (سيتم تعيينها من Platform)
- ✅ `models/` - جميع الـ models
- ✅ `routes/` - جميع الـ routes
- ✅ `controllers/` - جميع الـ controllers
- ✅ `middlewares/` - جميع الـ middlewares
- ✅ `uploads/` - مجلد الرفع (أو استخدام Cloud Storage)

---

## 📋 خطوات الرفع على Railway (الأسهل)

### 1️⃣ إنشاء حساب
- اذهب إلى [Railway.app](https://railway.app)
- سجل باستخدام GitHub

### 2️⃣ ربط المشروع
```bash
# 1. دخول مجلد البروجكت
cd d:\TWM3\twm3-backend

# 2. تثبيت Railway CLI (اختياري)
npm i -g @railway/cli

# 3. تسجيل الدخول
railway login

# 4. إنشاء مشروع جديد
railway init

# 5. رفع المشروع
railway up
```

### 3️⃣ تعيين المتغيرات على Railway
في لوحة التحكم:
```
PORT=5000
MONGO_URI=mongodb+srv://keka:0111@nodejs.cq4in.mongodb.net/?retryWrites=true&w=majority&appName=nodejs
SESSION_SECRET=d7f8e3a1b6c94f2e8b5a7d0c9f3e2a1b6c94f2e8b5a7d0c9f3e2a1b6c94f2e
JWT_SECRET=d7f8e3a1b6c94f2e8b5a7d0c9f3e2a1b6c94f2e8b5a7d0c9f3e2a1b6c94f2e
NODE_ENV=production
GOOGLE_CLIENT_ID=696973788724-8gtl62c98iufbb5q5ind60mnamjcm1ob.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_CALLBACK_URL=https://your-app-name.up.railway.app/api/auth/google/callback
GITHUB_CLIENT_ID=Ov23ctW0a36zoWW0Ja9E
GITHUB_CLIENT_SECRET=eac4816217e9786a6b356ea478e590a2ad221382
GITHUB_CALLBACK_URL=https://your-app-name.up.railway.app/api/auth/github/callback
FRONTEND_BASE_URL=https://your-frontend-domain.com
```

### 4️⃣ إضافة MongoDB (اختياري - أنت بالفعل تستخدم Cloud MongoDB)
لا تحتاج إضافة database جديد، استخدم نفس MONGO_URI

---

## 📋 خطوات الرفع على Render

### 1️⃣ إنشاء حساب
- اذهب إلى [Render.com](https://render.com)
- سجل الدخول

### 2️⃣ ربط GitHub
- انقر "Connect Repository"
- اختر مستودع GitHub الخاص بك
- اختر فرع `main`

### 3️⃣ إنشاء Web Service
```
Service Name: twm3-backend
Environment: Node
Build Command: npm install
Start Command: node server.js
```

### 4️⃣ تعيين المتغيرات في Environment
نفس القيم أعلاه في Railway

---

## 🔧 تحديث الـ Frontend للاتصال بالـ Backend

### تحديث API URLs

في `login.html` و `dashboard.html` وجميع الملفات:

```javascript
// BEFORE (localhost)
const API_BASE = 'http://localhost:5000/api';

// AFTER (production)
const API_BASE = 'https://your-backend-domain.com/api';
```

### البحث والاستبدال السريع:

استخدم Find & Replace في VS Code:
- **Find**: `http://localhost:5000/api`
- **Replace**: `https://your-api-domain.com/api`

---

## ⚙️ إعدادات CORS

تأكد أن `server.js` يحتوي على:

```javascript
const corsOptions = {
  origin: [
    'https://your-frontend-domain.com',
    'http://localhost:5000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
```

---

## 🗄️ Storage للـ Uploads

### الحل الأفضل: Cloud Storage (AWS S3)

بدل تخزين الملفات على الـ Server:

```bash
npm install aws-sdk
```

### أو استخدم Firebase Storage:

```bash
npm install firebase-admin
```

---

## ✅ قائمة التحقق قبل الرفع

- [ ] `npm install` تم بنجاح
- [ ] `.env` محدث بـ Production URLs
- [ ] `package.json` يحتوي على `"start": "node server.js"`
- [ ] جميع الـ Routes تعمل محلياً
- [ ] MongoDB Connection String صحيح
- [ ] CORS مكون بشكل صحيح
- [ ] OAuth Callback URLs محدثة
- [ ] جميع المتغيرات البيئية معينة على الـ Platform

---

## 🐛 حل المشاكل الشائعة

### المشكلة: "Cannot find module"
**الحل**: 
```bash
rm -r node_modules package-lock.json
npm install
```

### المشكلة: "MONGO_URI is undefined"
**الحل**: تأكد من تعيين متغيرات البيئة على Platform

### المشكلة: "CORS error"
**الحل**: تحديث `corsOptions` بـ Frontend URL الصحيح

### المشكلة: "Port 5000 already in use"
**الحل**: استخدم port مختلف في `.env`

---

## 📞 URLs النهائية

```
Frontend: https://your-frontend-domain.com
Backend: https://your-api-domain.com
API: https://your-api-domain.com/api
```

---

## الخطوة التالية

بعد الرفع:
1. اختبر جميع الـ API endpoints
2. تأكد من تسجيل الدخول يعمل
3. اختبر الرفع والتحميل
4. جرب OAuth (Google, GitHub)
5. راقب الـ Logs للأخطاء

استخدم لوحة تحكم Platform لمراقبة الـ Logs والأداء! 📊

---

**هل تريد مساعدة في أي خطوة محددة؟** 🎯
