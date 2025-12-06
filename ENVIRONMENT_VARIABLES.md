# 🔐 متغيرات البيئة (Environment Variables)

## 📋 القائمة الكاملة

### الـ PORT
```
PORT=5000
```
- يعني: الخادم سيستمع على المنفذ 5000
- في Development: `http://localhost:5000`
- في Production: Railway سيختار المنفذ تلقائياً

### الـ NODE_ENV
```
Development:  NODE_ENV=development
Production:   NODE_ENV=production
```
- Development: يظهر كل الـ logs والأخطاء
- Production: آمن وسريع وبدون فوضى

### قاعدة البيانات
```
MONGO_URI=mongodb+srv://keka:0111@nodejs.cq4in.mongodb.net/?retryWrites=true&w=majority&appName=nodejs
```
- اتصال MongoDB Cloud
- نفس القيمة للـ development و production

### الـ Secrets
```
SESSION_SECRET=d7f8e3a1b6c94f2e8b5a7d0c9f3e2a1b6c94f2e8b5a7d0c9f3e2a1b6c94f2e
JWT_SECRET=d7f8e3a1b6c94f2e8b5a7d0c9f3e2a1b6c94f2e8b5a7d0c9f3e2a1b6c94f2e
```
- استخدمت لتشفير البيانات والـ tokens
- يجب أن تكون معقدة وسرية
- لا تشارك هذه مع أحد!

### Google OAuth
```
GOOGLE_CLIENT_ID=696973788724-8gtl62c98iufbb5q5ind60mnamjcm1ob.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```
- ينتج عن: https://console.cloud.google.com
- للـ Development: تشير إلى localhost
- للـ Production: يجب أن تشير إلى الـ production domain

### GitHub OAuth
```
GITHUB_CLIENT_ID=Ov23ctW0a36zoWW0Ja9E
GITHUB_CLIENT_SECRET=eac4816217e9786a6b356ea478e590a2ad221382
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback
```
- ينتج عن: https://github.com/settings/developers
- نفس الـ concept مثل Google

### الـ Frontend Base URL
```
FRONTEND_BASE_URL=http://localhost:5000
```
- Development: يشير إلى localhost
- Production: يشير إلى teamworkm3.com

---

## 🎯 الفروقات بين Development و Production

### Development (.env)
```
PORT=5000
NODE_ENV=development
FRONTEND_BASE_URL=http://localhost:5000
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback
```

### Production (.env.production)
```
PORT=5000
NODE_ENV=production
FRONTEND_BASE_URL=https://teamworkm3.com
GOOGLE_CALLBACK_URL=https://api.teamworkm3.com/api/auth/google/callback
GITHUB_CALLBACK_URL=https://api.teamworkm3.com/api/auth/github/callback
```

---

## 📊 حالة المتغيرات الحالية

```
✅ MONGO_URI: جاهز (Cloud)
✅ JWT_SECRET: جاهز
✅ SESSION_SECRET: جاهز
✅ GOOGLE_CLIENT_ID: جاهز
✅ GOOGLE_CLIENT_SECRET: جاهز
✅ GITHUB_CLIENT_ID: جاهز
✅ GITHUB_CLIENT_SECRET: جاهز
```

---

## 🔧 كيفية التحديث

### على Railway:

1. اضغط على Service
2. اختر: Variables
3. أضف كل متغير:
   - Key: `PORT`
   - Value: `5000`
   - Save

---

## ⚠️ أشياء مهمة

### ❌ لا تفعل:
- ❌ لا تنسخ .env في المستودع العام (شارها على GitHub)
- ❌ لا تشارك SECRETS مع أحد
- ❌ لا تستخدم Callback URLs للـ localhost في Production

### ✅ افعل:
- ✅ احفظ .env محلياً فقط
- ✅ استخدم .env.production للـ production
- ✅ عدّل CALLBACK URLs حسب البيئة

---

## 🆘 إذا لم تعرف القيمة

| المتغير | كيف تجد القيمة |
|---------|---------------|
| GOOGLE_CLIENT_ID | https://console.cloud.google.com |
| GITHUB_CLIENT_ID | https://github.com/settings/developers |
| JWT_SECRET | أي string معقد (مثل hash) |
| SESSION_SECRET | أي string معقد (مثل hash) |
| MONGO_URI | MongoDB Atlas Connection String |

---

**هل تحتاج توضيح لأي متغير؟** 🎯
