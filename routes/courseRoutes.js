const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const auth = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');

// إعداد التخزين للملفات
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/videos');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// -------------------- المحتوى الأساسي --------------------

// جلب محتوى الكورس
router.get('/:id/content', auth, courseController.getCourseContent);

// إضافة وحدة جديدة
router.post('/:id/unit', auth, courseController.addUnit);

// إضافة درس جديد (ملف أو رابط) عبر unitId
router.post('/unit/:unitId/lesson', auth, upload.single('file'), courseController.addLesson);

// تعديل درس
router.put('/unit/:unitId/lesson/:lessonId', auth, upload.single('file'), courseController.editLesson);

// حذف درس
router.delete('/unit/:unitId/lesson/:lessonId', auth, courseController.deleteLesson);

// حفظ تقدم المستخدم (إكمال درس)
router.post('/progress/complete', auth, courseController.completeLesson);

// ملخص تقدم المستخدم لجميع الكورسات
router.get('/progress/summary', auth, courseController.getProgressSummary);

// تفاصيل تقدم المستخدم في كورس محدد
router.get('/:courseId/progress', auth, courseController.getCourseProgress);

// -------------------- الكود المضاف: إضافة درس بشكل مباشر عبر الكورس والوحدة --------------------

router.post('/courses/:courseId/units/:unitId/lessons', auth, async (req, res) => {
    try {
        const { courseId, unitId } = req.params;
        const { title, description, videoUrl, type, duration } = req.body;

        console.log("📥 بيانات الدرس:", req.body);

        const Course = require('../models/Course'); // تأكد من المسار حسب مشروعك

        // البحث عن الكورس والتأكد من وجوده
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // البحث عن الوحدة داخل الكورس
        const unit = course.units.id(unitId);
        if (!unit) {
            return res.status(404).json({ error: 'Unit not found' });
        }

        // إنشاء الدرس
        const newLesson = {
            title,
            description,
            videoUrl,
            type,
            duration,
        };

        // إضافة الدرس للوحدة
        unit.lessons.push(newLesson);

        // تحديث عدد الدروس والمدة
        course.totalLessons += 1;
        course.totalDuration += parseInt(duration);

        // حفظ الكورس
        await course.save();

        res.status(201).json({ message: '✅ تمت إضافة الدرس بنجاح', lesson: newLesson });
    } catch (error) {
        console.error("❌ خطأ أثناء إضافة الدرس:", error);
        res.status(500).json({ error: 'حدث خطأ أثناء إضافة الدرس', details: error.message });
    }
});

module.exports = router;
