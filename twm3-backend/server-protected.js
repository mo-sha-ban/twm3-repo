const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();

// إعداد السيشن
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));

// ميدل وير للتحقق من تسجيل الدخول
// function requireLogin(req, res, next) {
//   if (req.session && req.session.user) {
//     return next();
//   } else {
//     return res.redirect('/login.html?error=يجب تسجيل الدخول أولاً');
//   }
// }

// حماية صفحة الكورسات المجانية فقط
// app.get('/course-page.html', requireLogin, (req, res) => {
//   res.sendFile(path.join(__dirname, '..', 'course-page.html'));
// });
// app.get('/twm3-backend/private/dashboard.html', requireLogin, (req, res) => {
//   res.sendFile(path.join(__dirname, '..', 'twm3-backend/private/dashboard.html'));
// });
// app.get('/dashboard.html', requireLogin, (req, res) => {
//   res.sendFile(path.join(__dirname, '..', 'dashboard.html'));
// });

// ميدل وير للتحقق من أن المستخدم أدمن
// function requireAdmin(req, res, next) {
//   if (req.session && req.session.user && req.session.user.isAdmin) {
//     return next();
//   } else {
//     console.log(req.session.user);
//     console.log(req.session.user.isAdmin);
//     res.status(403).send("غير مصرح لك بالدخول إلى لوحة التحكم!");
//   }
// }

// // حماية مسار الداشبورد
// app.get("/twm3-backend/private/dashboard.html", requireAdmin, (req, res) => {
//   res.sendFile(path.join(__dirname, '..', "dashboard.html"));
// });


// // حماية كل ملفات /twm3-backend/private
// app.use("/twm3-backend/private", requireAdmin, express.static(path.join(__dirname, "twm3-backend/private")));


// باقي الموقع متاح للجميع
app.use(express.static(path.join(__dirname, '..'), { extensions: ["html"] }));


// مثال: تسجيل الدخول (يجب تعديل هذا حسب نظامك)
app.post('/api/login', express.json(), (req, res) => {
  const { email, password } = req.body;
  // تحقق من بيانات المستخدم من قاعدة البيانات هنا
  // إذا كان صحيحاً:
  req.session.user = { email }; // ضع بيانات المستخدم المطلوبة
  res.json({ success: true });
});

// تشغيل السيرفر
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
