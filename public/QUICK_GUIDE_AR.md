# 🎯 دليل سريع لـ Deployment (خطوة بخطوة)

## 📱 المشكلة
الموقع على Hostinger لكن الـ Backend (API) لا يعمل

## ✅ الحل
رفع Backend على Railway (خدمة cloud مجانية)

---

## 🚀 الخطوات:

### 1️⃣ تثبيت Git
- اذهب: https://git-scm.com/download/win
- اختر 64-bit → Next → Next → ... → Finish
- أعد تشغيل الحاسوب

### 2️⃣ فتح Terminal في d:\TWM3
- افتح الخانة في VS Code
- اختر Terminal → New Terminal
- تأكد أنك في d:\TWM3

### 3️⃣ إعداد Git
```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

### 4️⃣ Commit الكود
```bash
git init
git add .
git commit -m "Backend ready"
```

### 5️⃣ رفع على GitHub
- اذهب: https://github.com/new
- أنشئ repository جديد (اسمه: TWM3-Backend)
- اتبع التعليمات:
```bash
git remote add origin https://github.com/YOUR-USERNAME/TWM3-Backend.git
git branch -M main
git push -u origin main
```

### 6️⃣ إنشاء حساب Railway
- اذهب: https://railway.app
- اضغط Sign up
- اختر GitHub
- وافق على الأذونات

### 7️⃣ إنشاء Project بـ Railway
- اضغط: New Project
- اختر: Deploy from GitHub
- ابحث عن: TWM3-Backend
- اضغط: Deploy

### 8️⃣ تعيين المتغيرات
في Railway Dashboard:
- اضغط على Service
- اختر: Variables
- أضف:

```
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://keka:0111@nodejs.cq4in.mongodb.net/?retryWrites=true&w=majority&appName=nodejs
SESSION_SECRET=d7f8e3a1b6c94f2e8b5a7d0c9f3e2a1b6c94f2e8b5a7d0c9f3e2a1b6c94f2e
JWT_SECRET=d7f8e3a1b6c94f2e8b5a7d0c9f3e2a1b6c94f2e8b5a7d0c9f3e2a1b6c94f2e
GOOGLE_CLIENT_ID=696973788724-8gtl62c98iufbb5q5ind60mnamjcm1ob.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GITHUB_CLIENT_ID=Ov23ctW0a36zoWW0Ja9E
GITHUB_CLIENT_SECRET=eac4816217e9786a6b356ea478e590a2ad221382
FRONTEND_BASE_URL=https://teamworkm3.com
```

### 9️⃣ انتظر البناء ✅
- تظهر: Build in progress...
- ثم: Deployment successful!
- سترى URL مثل: `https://twm3-production-abc123.up.railway.app`
- **احفظ هذا الـ URL!** 📝

### 🔟 تحديث Frontend
في VS Code:
- اضغط: Ctrl + H (Find & Replace)
- Find: `http://localhost:5000`
- Replace: `https://twm3-production-abc123.up.railway.app`
- اضغط: Replace All

### 1️⃣1️⃣ رفع Frontend المحدثة
- الخيار 1: FTP على Hostinger
- الخيار 2: Upload عبر Hostinger Control Panel

### 1️⃣2️⃣ اختبر الموقع! ✅
- افتح: https://teamworkm3.com
- سجل دخول
- ادخل كورس
- يجب أن يعمل كل شيء!

---

## ⚠️ لو حصلت مشكلة

### ❌ "Cannot find module"
- تأكد أن جميع المجلدات موجودة: `controllers/`, `routes/`, `models/`
- تحقق من `package.json` - يجب أن يكون في الجذر

### ❌ "Build failed"
- اضغط على Service في Railway
- اختر Logs
- ابحث عن الخطأ (حمراء)
- أخبرني بالخطأ

### ❌ "MongoDB connection error"
- تحقق من MONGO_URI في variables
- اذهب: https://www.mongodb.com/cloud/atlas
- اختر Network Access
- أضف: 0.0.0.0/0 (السماح للجميع)

### ❌ "CORS error"
- الخطأ يظهر في Console (F12)
- هذا يعني API URL خاطئ
- تأكد من التحديث الصحيح في Find & Replace

---

## 🎉 بعد النجاح

```
✅ الموقع يعمل
✅ الـ API يعمل
✅ تسجيل الدخول يعمل
✅ الكورسات تحمل
✅ الملف الشخصي يعمل
✅ كل شيء مثالي!
```

---

**في أي خطوة تحتاج مساعدة؟** 💬
