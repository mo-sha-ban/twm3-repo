// سكريبت لإرسال رسالة لكل المشتركين في قاعدة بيانات MongoDB
// يجب تثبيت الحزم: npm install nodemailer mongodb

const nodemailer = require('nodemailer');
const { MongoClient } = require('mongodb');

// إعداد الاتصال بقاعدة البيانات
const uri = 'mongodb://localhost:27017'; // عدلها إذا كنت تستخدم اتصالاً آخر
const dbName = 'twm3'; // اسم قاعدة البيانات
const collectionName = 'users'; // اسم الكولكشن الذي يحتوي على الإيميلات

// إعداد nodemailer (مثال على Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'graduate01110@gmail.com', // بريدك
    pass: 'cwevkowbvzgsecnf'      // كلمة مرور التطبيق (وليس كلمة مرور البريد العادية)
  }
});

async function sendBulkEmail() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // جلب جميع الإيميلات
    const users = await collection.find({}, { projection: { email: 1 } }).toArray();
    const emails = users.map(u => u.email).filter(Boolean);

    if (emails.length === 0) {
      console.log('لا يوجد إيميلات لإرسال الرسالة إليها.');
      return;
    }

    // إعداد الرسالة
    const mailOptions = {
      from: 'graduate01110@gmail.com',
      bcc: emails, // إرسال جماعي مخفي
      subject: 'كورس جديد على موقع TWM3',
      text: 'تم إضافة كورسات جديدة على موقعنا! سارع بالتسجيل أو تصفح الكورسات الآن.',
      html: '<h2>تم إضافة كورسات جديدة!</h2><p>سارع بالتسجيل أو تصفح الكورسات الآن من خلال <a href="https://twm3.com/courses.html">صفحة الكورسات</a>.</p>'
    };

    // إرسال الرسالة
    await transporter.sendMail(mailOptions);
    console.log('تم إرسال الرسالة لجميع المشتركين بنجاح!');
  } catch (err) {
    console.error('حدث خطأ أثناء الإرسال:', err);
  } finally {
    await client.close();
  }
}

sendBulkEmail();
