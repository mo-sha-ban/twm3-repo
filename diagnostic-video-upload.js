// 🔍 تقرير تشخيص مشاكل رفع الفيديو

console.clear();
console.log('%c🔍 تقرير تشخيص رفع الفيديو', 'font-size: 16px; font-weight: bold; color: blue;');

// 1. التحقق من وجود Media Items
console.log('\n%c1️⃣ فحص Media Items:', 'font-weight: bold; color: blue;');
if (typeof window.mediaItems !== 'undefined') {
    console.log(`✅ window.mediaItems موجود`);
    console.log(`📊 عدد العناصر: ${window.mediaItems.length}`);
    window.mediaItems.forEach((item, idx) => {
        console.log(`  [${idx}] Type: ${item.type}, URL: ${item.url || 'none'}, File: ${item.file?.name || 'none'}`);
    });
} else {
    console.log('❌ window.mediaItems غير موجود!');
}

// 2. التحقق من الـ Token
console.log('\n%c2️⃣ فحص الـ Token:', 'font-weight: bold; color: blue;');
const token = localStorage.getItem('token');
if (token) {
    console.log(`✅ Token موجود: ${token.substring(0, 20)}...`);
} else {
    console.log('❌ لم يتم العثور على Token!');
}

// 3. التحقق من الـ Quill Editor
console.log('\n%c3️⃣ فحص Quill Editor:', 'font-weight: bold; color: blue;');
if (typeof window.quill !== 'undefined' && window.quill !== null) {
    console.log(`✅ Quill محمّل`);
    console.log(`📝 المحتوى: ${window.quill.root.innerHTML.substring(0, 50)}...`);
} else {
    console.log('⚠️  Quill غير محمّل أو null');
}

// 4. التحقق من الـ File Input Elements
console.log('\n%c4️⃣ فحص عناصر الملفات:', 'font-weight: bold; color: blue;');
const imageInput = document.getElementById('productImageInput');
const videoInput = document.getElementById('productVideoInput');
const addImagesBtn = document.getElementById('addImagesBtn');
const addVideosBtn = document.getElementById('addVideosBtn');

console.log(`📁 imageInput: ${imageInput ? '✅ موجود' : '❌ غير موجود'}`);
console.log(`📹 videoInput: ${videoInput ? '✅ موجود' : '❌ غير موجود'}`);
console.log(`🔘 addImagesBtn: ${addImagesBtn ? '✅ موجود' : '❌ غير موجود'}`);
console.log(`🔘 addVideosBtn: ${addVideosBtn ? '✅ موجود' : '❌ غير موجود'}`);

// 5. اختبار رفع ملف فيديو
console.log('\n%c5️⃣ اختبار رفع ملف فيديو:', 'font-weight: bold; color: blue;');
console.log('📌 للاختبار، قم بتنفيذ الأمر التالي:');
console.log(`
// إنشاء ملف فيديو وهمي واختباره
const canvas = document.createElement('canvas');
canvas.width = 320;
canvas.height = 240;
const ctx = canvas.getContext('2d');
ctx.fillStyle = 'blue';
ctx.fillRect(0, 0, 320, 240);
canvas.toBlob(blob => {
    const file = new File([blob], 'test-video.mp4', { type: 'video/mp4' });
    const input = document.getElementById('productVideoInput');
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    input.files = dataTransfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    console.log('✅ تم إرسال ملف اختبار');
});
`);

// 6. اختبار الـ Endpoint
console.log('\n%c6️⃣ اختبار Endpoint:', 'font-weight: bold; color: blue;');
console.log('📌 للاختبار، قم بتنفيذ الأمر التالي:');
console.log(`
fetch('/api/uploads/lesson-asset', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
    },
    body: new FormData(document.querySelector('form'))
}).then(r => r.json()).then(d => console.log('Response:', d));
`);

// 7. فحص الـ Network
console.log('\n%c7️⃣ فحص الشبكة والـ CORS:', 'font-weight: bold; color: blue;');
console.log('📌 تحقق من Developer Tools > Network tab أثناء رفع الملفات');
console.log('📌 ابحث عن طلبات POST إلى /api/uploads/lesson-asset');

console.log('\n%c✅ انتهى التقرير', 'font-size: 14px; font-weight: bold; color: green;');
