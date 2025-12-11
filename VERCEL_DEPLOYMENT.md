# تعليمات الرفع على Vercel

## المشاكل التي تم حلها:

### 1. ✅ مشكلة `Cannot find module '/app/server.js'`
- **السبب**: ملف `server.js` كان موجود في مجلد `twm3-backend/` وليس في الجذر
- **الحل**: تحديث `vercel.json` و`package.json` ليشير إلى المجلد الصحيح

### 2. ✅ تحديث إعدادات الرفع
- تم إنشاء `vercel.json` في المجلد الجذر
- تم إنشاء `vercel.json` في مجلد `twm3-backend/`
- تم تحديث `package.json` في الجذر

## خطوات الرفع على Vercel:

### الطريقة الأولى: عبر CLI (موصى به)
```bash
# 1. تثبيت Vercel CLI
npm install -g vercel

# 2. الدخول من نهاية المشروع
cd d:\twm3-repo

# 3. الرفع على Vercel
vercel

# 4. اتبع التعليمات التفاعلية
# - اختر المشروع أو أنشئ واحداً جديداً
# - أكد البنية
# - انتظر عملية البناء
```

### الطريقة الثانية: عبر GitHub
```bash
# 1. ادفع الكود إلى GitHub
git add .
git commit -m "Fix Vercel deployment configuration"
git push origin main

# 2. اتصل بـ Vercel عبر GitHub
# - اذهب إلى https://vercel.com
# - اختر "Import Project"
# - اختر مستودع GitHub
# - اتبع التعليمات
```

## المتغيرات البيئية على Vercel:

تأكد من إضافة هذه المتغيرات في لوحة تحكم Vercel:

```
PORT=5000
MONGO_URI=mongodb+srv://keka:0111@nodejs.cq4in.mongodb.net/?retryWrites=true&w=majority&appName=nodejs
SESSION_SECRET=d7f8e3a1b6c94f2e8b5a7d0c9f3e2a1b6c94f2e8b5a7d0c9f3e2a1b6c94f2e
JWT_SECRET=d7f8e3a1b6c94f2e8b5a7d0c9f3e2a1b6c94f2e8b5a7d0c9f3e2a1b6c94f2e
NODE_ENV=production
GOOGLE_CLIENT_ID=696973788724-8gtl62c98iufbb5q5ind60mnamjcm1ob.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_CALLBACK_URL=https://your-vercel-domain.vercel.app/api/auth/google/callback
GITHUB_CLIENT_ID=Ov23ctW0a36zoWW0Ja9E
GITHUB_CLIENT_SECRET=eac4816217e9786a6b356ea478e590a2ad221382
GITHUB_CALLBACK_URL=https://your-vercel-domain.vercel.app/api/auth/github/callback
FRONTEND_BASE_URL=https://your-vercel-domain.vercel.app
```

## التحقق من النجاح:

بعد الرفع، تحقق من:
1. ✅ هل الصفحة الرئيسية تحمل بدون أخطاء؟
2. ✅ هل الاتصال بـ API يعمل؟
3. ✅ هل المصادقة (Authentication) تعمل؟
4. ✅ هل رفع الملفات يعمل؟

## استكشاف الأخطاء:

إذا واجهت مشاكل:
1. تحقق من سجلات Vercel (Logs)
2. تأكد من المتغيرات البيئية
3. تحقق من أذونات قاعدة البيانات (MongoDB)
4. اطلب من Vercel فحص build والتحقق من الأخطاء

## ملفات مهمة تم تعديلها:

- ✅ `/vercel.json` - إعدادات الرفع على Vercel
- ✅ `/twm3-backend/vercel.json` - إعدادات الباك إند
- ✅ `/package.json` - تحديث أمر البداية
- ✅ `/twm3-backend/.env.production` - متغيرات الإنتاج
