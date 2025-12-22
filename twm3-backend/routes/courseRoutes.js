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

// حذف وحدة
router.delete('/unit/:unitId', auth, async (req, res) => {
    try {
        const { unitId } = req.params;
        const Course = require('../models/Course');
        
        // البحث عن الكورس الذي يحتوي على الوحدة
        const course = await Course.findOne({ 'units._id': unitId });
        if (!course) {
            return res.status(404).json({ error: 'Course or unit not found' });
        }
        
        // الحصول على الوحدة
        const unit = course.units.id(unitId);
        if (!unit) {
            return res.status(404).json({ error: 'Unit not found' });
        }
        
        // حذف الوحدة
        unit.remove();
        
        // حفظ التغييرات
        await course.save();
        
        res.json({ message: 'Unit deleted successfully' });
    } catch (error) {
        console.error('Delete unit error:', error);
        res.status(500).json({ error: 'Failed to delete unit' });
    }
});

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

// -------------------- كود إضافة درس عبر الكورس والوحدة (يدعم ملفات multipart) --------------------
router.post('/:courseId/units/:unitId/lessons', auth, upload.single('lessonFile'), async (req, res) => {
    try {
        const { courseId, unitId } = req.params;

        // Multer populates req.body (text fields) and req.file (uploaded file)
        console.log('📥 إضافة درس - body:', req.body, 'file:', req.file && req.file.filename);

        const { title, description, videoUrl, fileUrl, externalUrl, type, duration, isFree, specialization } = req.body || {};

        if (!title) return res.status(400).json({ error: 'Missing lesson title' });

        const Course = require('../models/Course');

        // البحث عن الكورس والتأكد من وجوده
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ error: 'Course not found' });

        // البحث عن الوحدة داخل الكورس
        const unit = course.units.id(unitId);
        if (!unit) return res.status(404).json({ error: 'Unit not found' });

        // Determine uploaded file path if any
        let uploadedPath = null;
        if (req.file && req.file.filename) {
            uploadedPath = `/uploads/videos/${req.file.filename}`;
        }

        // Build new lesson object depending on type
        const newLesson = {
            title: title,
            description: description || '',
            type: type || 'video',
            duration: Number(duration) || 0,
            isFree: isFree === 'true' || isFree === true,
            specialization: specialization || undefined,
        };

        if ((type || 'video') === 'video') {
            if (uploadedPath) newLesson.videoUrl = uploadedPath;
            else if (videoUrl) newLesson.videoUrl = videoUrl;
        } else if ((type || '') === 'pdf') {
            if (uploadedPath) newLesson.fileUrl = uploadedPath;
            else if (fileUrl) newLesson.fileUrl = fileUrl;
        } else if ((type || '') === 'url') {
            newLesson.externalUrl = externalUrl || '';
        }

        // إضافة الدرس للوحدة
        unit.lessons.push(newLesson);

        // تحديث عداد الدروس والمدة
        course.totalLessons = (course.totalLessons || 0) + 1;
        course.totalDuration = (course.totalDuration || 0) + (Number(newLesson.duration) || 0);

        await course.save();

        res.status(201).json({ message: '✅ تمت إضافة الدرس بنجاح', lesson: newLesson });
    } catch (error) {
        console.error('❌ خطأ أثناء إضافة الدرس:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء إضافة الدرس', details: error.message });
    }
});

module.exports = router;