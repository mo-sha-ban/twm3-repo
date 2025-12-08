# 🚂 Railway - الخطوات السريعة

## ✅ ما تم إصلاحه

```
الخطأ الأصلي من Railway:
Error: Cannot find module 'nodemailer'

الحل:
✅ Dockerfile محدث يثبت npm dependencies
✅ entrypoint.sh محدثة لـ Railway
✅ railway.yml مضافة للتكوين
✅ .railwayignore مضافة لتسريع البناء
```

---

## 🚀 كيفية الرفع على Railway

### الخطوة 1: رفع الـ Repository

```powershell
cd d:\twm3-repo
git add .
git commit -m "Fix: Docker config for Railway"
git push
```

### الخطوة 2: ربط Railway

1. اذهب إلى: https://railway.app
2. اختر "New Project" → "Deploy from GitHub"
3. اختر repository
4. اختر branch (main)

### الخطوة 3: المتغيرات البيئية

في Railway Dashboard → Variables:

```
PORT=5000
MONGO_URI=mongodb+srv://keka:0111@nodejs.cq4in.mongodb.net/?retryWrites=true&w=majority&appName=nodejs
SESSION_SECRET=d7f8e3a1b6c94f2e8b5a7d0c9f3e2a1b
JWT_SECRET=d7f8e3a1b6c94f2e8b5a7d0c9f3e2a1b
NODE_ENV=production
GOOGLE_CLIENT_ID=696973788724-8gtl62c98iufbb5q5ind60mnamjcm1ob.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_CALLBACK_URL=https://api.twm3.org/api/auth/google/callback
GITHUB_CLIENT_ID=Ov23ctW0a36zoWW0Ja9E
GITHUB_CLIENT_SECRET=eac4816217e9786a6b356ea478e590a2ad221382
GITHUB_CALLBACK_URL=https://api.twm3.org/api/auth/github/callback
FRONTEND_BASE_URL=https://twm3.org
```

### الخطوة 4: الانتظار

شاهد الـ Logs:
```
✅ Installing dependencies...
✅ Dependencies installed successfully
✅ nodemailer@6.9.7
✅ express@5.1.0
✅ mongoose@8.14.2
✅ Starting server...
✅ Server listening on port [PORT]
```

---

## 📁 الملفات الجديدة

```
✅ railway.yml          - إعدادات Railway
✅ .railwayignore       - تقليل حجم البناء
✅ RAILWAY_DEPLOYMENT_GUIDE.md  - دليل تفصيلي
✅ Dockerfile           - محدث
✅ entrypoint.sh        - محدثة
```

---

## 🔐 الأمان

✅ `.env.production` محمي في `.gitignore`  
✅ استخدم Railway Dashboard للمتغيرات  
✅ لا تضع كلمات مرور في Repository  

---

## ✅ عندما يعمل

API يكون على:
```
https://api.twm3.org
أو
https://[your-railway-domain]
```

---

📖 للمزيد: اقرأ `RAILWAY_DEPLOYMENT_GUIDE.md`
