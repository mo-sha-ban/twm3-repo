# 🚀 TWM3 - Backend Production Deployment

## 📱 نظرة عامة

هذا المستودع يحتوي على **TWM3** - تطبيق تعليمي متكامل مع:
- ✅ Frontend محسّن (على Hostinger)
- ✅ Backend قوي (جاهز للرفع على Railway)
- ✅ نظام تتبع التقدم (Progress Tracking)
- ✅ OAuth Integration (Google & GitHub)
- ✅ MongoDB Cloud Database

---

## 🎯 الحالة الحالية

```
Frontend:  ✅ Deployed (https://teamworkm3.com)
Backend:   ⏳ Ready for Railway Deployment
Database:  ✅ Connected (MongoDB Cloud)
API URLs:  ⏳ Waiting for update after deployment
```

---

## 📂 هيكل المشروع

```
d:\TWM3\
├── server.js                 (✅ Backend Server)
├── package.json              (✅ Dependencies)
├── .env                      (✅ Development Config)
├── .env.production           (✅ Production Config)
├── .gitignore                (✅ Git Config)
│
├── controllers/              (✅ Business Logic)
├── routes/                   (✅ API Routes)
├── models/                   (✅ Database Models)
├── middlewares/              (✅ Security)
├── public/                   (✅ Static Files)
├── uploads/                  (✅ User Uploads)
│
├── index.html                (Frontend)
├── login.html
├── dashboard.html
├── course-page.html
├── settings.html
├── css/, js/, assets/
│
└── 📚 Documentation/
    ├── QUICK_GUIDE_AR.md     (دليل سريع بالعربية)
    ├── NEXT_STEPS.md         (الخطوات التالية)
    ├── DEPLOYMENT_GUIDE.md   (دليل الرفع التفصيلي)
    ├── FILES_TO_UPDATE.md    (الملفات المطلوب تحديثها)
    ├── TROUBLESHOOTING.md    (حل المشاكل)
    ├── ENVIRONMENT_VARIABLES.md
    ├── CREDENTIALS_SUMMARY.md
    ├── BACKEND_STATUS.md
    ├── PROJECT_SUMMARY.md
    └── DEPLOYMENT_INDEX.html (صفحة فهرس HTML)
```

---

## 🚀 البدء السريع

### 1️⃣ تثبيت المتطلبات
```bash
# تثبيت Node.js من https://nodejs.org
# تثبيت Git من https://git-scm.com

# التحقق من التثبيت
node --version
npm --version
git --version
```

### 2️⃣ تثبيت Dependencies
```bash
cd d:\TWM3
npm install
```

### 3️⃣ إعداد البيئة
```bash
# انسخ .env للـ development
cp .env .env.local

# أو للـ production (بعد الرفع على Railway)
cp .env.production .env
```

### 4️⃣ تشغيل محلياً
```bash
npm start
# سيبدأ الخادم على http://localhost:5000
```

---

## 📚 الدليل الشامل

### للبدء السريع:
👉 **[اقرأ QUICK_GUIDE_AR.md](./QUICK_GUIDE_AR.md)**

### للخطوات التفصيلية:
👉 **[اقرأ NEXT_STEPS.md](./NEXT_STEPS.md)**

### للمشاكل والحلول:
👉 **[اقرأ TROUBLESHOOTING.md](./TROUBLESHOOTING.md)**

### لملخص المشروع:
👉 **[اقرأ PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)**

### لفهرس كامل:
👉 **[افتح DEPLOYMENT_INDEX.html](./DEPLOYMENT_INDEX.html)**

---

## 🔐 المتغيرات البيئية المطلوبة

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://keka:0111@nodejs.cq4in.mongodb.net/?retryWrites=true&w=majority&appName=nodejs

# Secrets
SESSION_SECRET=your-session-secret
JWT_SECRET=your-jwt-secret

# OAuth - Google
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# OAuth - GitHub
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Frontend URL
FRONTEND_BASE_URL=http://localhost:5000
```

---

## 🎯 الخطوات الفورية

### 1. إعداد Git
```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
git init
git add .
git commit -m "Backend ready for production"
```

### 2. رفع على GitHub
```bash
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git branch -M main
git push -u origin main
```

### 3. Deployment على Railway
- اذهب: https://railway.app
- اختر: New Project → Deploy from GitHub
- اختر مستودعك
- اضغط: Deploy

### 4. تعيين المتغيرات في Railway
انظر `.env.production` للقيم الكاملة

### 5. تحديث Frontend URLs
استخدم Find & Replace:
```
Find:    http://localhost:5000
Replace: https://your-railway-url.up.railway.app
```

---

## 📊 API الـ Endpoints

### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/google
GET    /api/auth/github
```

### Courses
```
GET    /api/courses
GET    /api/courses/:id
POST   /api/courses (admin)
PUT    /api/courses/:id (admin)
DELETE /api/courses/:id (admin)
```

### Progress
```
POST   /api/progress/track-lesson
GET    /api/progress/user/:userId
GET    /api/progress/course/:courseId/user/:userId
DELETE /api/progress/user/:userId/reset
```

### Uploads
```
POST   /api/uploads/lesson-asset
POST   /api/uploads/profile-picture
```

---

## 🐛 المشاكل الشائعة

### "Cannot find module"
```bash
npm install
npm start
```

### "MongoDB connection timeout"
أضف IP Address في MongoDB Atlas:
- اذهب: https://www.mongodb.com/cloud/atlas
- Network Access → Add IP 0.0.0.0/0

### "CORS Error"
تأكد من تحديث CORS في `server.js` للـ production domains

### "OAuth callback URL not matching"
حدّث Callback URLs في Google/GitHub مع URLs الصحيحة

👉 **[اقرأ TROUBLESHOOTING.md](./TROUBLESHOOTING.md) لمزيد من الحلول**

---

## 🔧 الأدوات المستخدمة

| الأداة | الإصدار | الغرض |
|------|---------|--------|
| Node.js | 18+ | Runtime |
| Express | 5.1.0 | Web Framework |
| MongoDB | Cloud | Database |
| Mongoose | 8.14.2 | ODM |
| JWT | 9.0.2 | Authentication |
| Socket.io | 4.8.1 | Real-time |
| Multer | 2.0.1 | File Upload |
| Helmet | 8.1.0 | Security |
| CORS | 2.8.5 | Cross-Origin |

---

## 🌐 الروابط الهامة

| الخدمة | الرابط |
|-------|--------|
| Railway | https://railway.app |
| GitHub | https://github.com |
| MongoDB Atlas | https://www.mongodb.com/cloud/atlas |
| Google Console | https://console.cloud.google.com |
| GitHub Settings | https://github.com/settings/developers |
| Postman | https://www.postman.com |

---

## 📞 الدعم والمساعدة

إذا واجهت أي مشاكل:

1. **اقرأ TROUBLESHOOTING.md** أولاً
2. **افحص الـ logs** للبحث عن الأخطاء
3. **اختبر الـ endpoints** مع curl أو Postman
4. **تحقق من المتغيرات البيئية**
5. **افتح issue** مع تفاصيل المشكلة

---

## ✅ قائمة المراجعة

- [ ] Node.js و npm مثبتات
- [ ] Git مثبت ومُعدّ
- [ ] `npm install` تم تشغيله
- [ ] `.env` مُعدّ بشكل صحيح
- [ ] MongoDB connection يعمل locally
- [ ] `npm start` يشتغل بدون أخطاء
- [ ] جميع الـ endpoints تعمل locally
- [ ] الكود رُفع على GitHub
- [ ] Railway account تم إنشاؤه
- [ ] Backend مُنتشر على Railway
- [ ] Frontend URLs محدّثة
- [ ] موقع كامل يعمل ✅

---

## 📝 المساهمة

هذا المشروع خاص بـ TWM3 Team.

---

## 📅 السجل

| التاريخ | ما تم |
|--------|-------|
| 2024 | ✅ نظام Progress Tracking |
| 2024 | ✅ إصلاح أخطاء الحساب |
| 2024 | ✅ تحضير للـ Production |

---

## 🎉 شكراً!

شكراً لاستخدام TWM3. نتمنى لك رحلة تطوير ناجحة!

---

**آخر تحديث**: اليوم | **الإصدار**: 1.0.0 | **الحالة**: جاهز للـ Production 🚀
