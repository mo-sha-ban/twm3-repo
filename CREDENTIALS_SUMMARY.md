# 📝 قائمة جميع الـ Credentials والـ URLs

## 🔐 البيانات السرية

### Secrets
```
SESSION_SECRET=d7f8e3a1b6c94f2e8b5a7d0c9f3e2a1b6c94f2e8b5a7d0c9f3e2a1b6c94f2e
JWT_SECRET=d7f8e3a1b6c94f2e8b5a7d0c9f3e2a1b6c94f2e8b5a7d0c9f3e2a1b6c94f2e
```

---

## 🌐 URLs الهامة

### Development (محلي)
```
Frontend:     http://localhost:5000
Backend:      http://localhost:5000
API Base:     http://localhost:5000/api
```

### Production (عبر الإنترنت)
```
Frontend:     https://teamworkm3.com
Backend:      https://twm3-production-xxx.up.railway.app (سيأتي من Railway)
API Base:     https://twm3-production-xxx.up.railway.app/api
```

---

## 🔑 OAuth - Google

### البيانات المسجلة
```
CLIENT_ID:     696973788724-8gtl62c98iufbb5q5ind60mnamjcm1ob.apps.googleusercontent.com
CLIENT_SECRET: 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
```

### Authorized Redirect URIs (يجب تحديثها في Google Console)

**Development:**
```
http://localhost:5000/api/auth/google/callback
```

**Production:**
```
https://twm3-production-xxx.up.railway.app/api/auth/google/callback
https://teamworkm3.com/api/auth/google/callback
```

---

## 🐙 OAuth - GitHub

### البيانات المسجلة
```
CLIENT_ID:     Ov23ctW0a36zoWW0Ja9E
CLIENT_SECRET: eac4816217e9786a6b356ea478e590a2ad221382
```

### Authorization Callback URL (يجب تحديثها في GitHub)

**Development:**
```
http://localhost:5000/api/auth/github/callback
```

**Production:**
```
https://twm3-production-xxx.up.railway.app/api/auth/github/callback
```

---

## 🗄️ قاعدة البيانات

### MongoDB Cloud
```
Connection String: mongodb+srv://keka:0111@nodejs.cq4in.mongodb.net/?retryWrites=true&w=majority&appName=nodejs
Cluster: nodejs
Username: keka
Database: (default/auto)
```

### Databases في MongoDB:
```
keka (main database)
├── users
├── courses
├── lessons
├── progress
├── payments
└── ...
```

---

## 📋 قائمة الأدوات المطلوبة

| الأداة | الرابط |
|------|--------|
| GitHub | https://github.com |
| Railway | https://railway.app |
| Google Console | https://console.cloud.google.com |
| GitHub Settings | https://github.com/settings/developers |
| MongoDB Atlas | https://www.mongodb.com/cloud/atlas |
| Hostinger Panel | https://www.hostinger.com/cpanel |

---

## 🎯 الخطوات المتبقية

### ✅ تم:
- [x] Backend جاهز محلياً
- [x] package.json محدث
- [x] .env و .env.production جاهزان
- [x] CORS محدث

### ⏳ ينتظر:
- [ ] Git setup على الحاسوب
- [ ] رفع على GitHub
- [ ] Railway deployment
- [ ] الحصول على الـ Railway URL
- [ ] تحديث OAuth Callback URLs
- [ ] تحديث Frontend APIs
- [ ] رفع Frontend المحدثة

---

## 🔄 الـ Flow الكامل

```
قارئ الموقع (في المتصفح)
        ↓
الموقع (https://teamworkm3.com - Hostinger)
        ↓
API Request (https://twm3-production-xxx.up.railway.app/api/...)
        ↓
Express Server (Railway)
        ↓
MongoDB (Cloud)
        ↓
البيانات ترجع للموقع
        ↓
تظهر البيانات في الموقع
```

---

## 📞 المساعدة

| المشكلة | التحقق |
|-------|--------|
| "Cannot find API" | تحقق من الـ URL الصحيح |
| "CORS Error" | تحقق من CORS في server.js |
| "Authentication Failed" | تحقق من CLIENT_ID و CLIENT_SECRET |
| "Database Connection Error" | تحقق من MONGO_URI |
| "OAuth callback not matching" | تحقق من Callback URLs في Google/GitHub |

---

**معك جميع البيانات اللازمة! يمكنك البدء بـ Deployment الآن** 🚀
