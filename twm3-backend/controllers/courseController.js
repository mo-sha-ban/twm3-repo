const Course = require('../models/Course');
const User = require('../models/User');
const mongoose = require('mongoose');
const Progress = require('../models/Progress');

// جلب محتوى الكورس
exports.getCourseContent = async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  res.json(course);
};

// إضافة وحدة جديدة
exports.addUnit = async (req, res) => {
  const { title, description } = req.body;
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  
  // إنشاء ID يدوي للوحدة
  const unitId = new mongoose.Types.ObjectId();
  
  course.units.push({ 
    _id: unitId,
    title, 
    description,
    lessons: [] 
  });
  
  await course.save();
  res.json({...course._doc, newUnitId: unitId});
};

exports.addLesson = async (req, res) => {
  try {
    const { unitId } = req.params;
    const { title, videoUrl, description, duration, type, isFree, specialization } = req.body;

    const course = await Course.findOne({ 'units._id': unitId });
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const unit = course.units.id(unitId);

    // إنشاء ID يدوي للدرس
    const lessonId = new mongoose.Types.ObjectId();

    const newLesson = {
      _id: lessonId,
      title,
      videoUrl,
      description,
      duration: duration || 0,
      type: type || 'video',
      isFree: isFree || false,
      specialization: specialization || 'cybersecurity'
    };

    // إضافة الدرس داخل الوحدة
    unit.lessons.push(newLesson);

    // إضافة الدرس لمحتوى الكورس (كمؤشر للمحتوى المرتبط بالعرض)
    course.content.push({
      type: 'lesson',
      unitId: unitId,
      lessonId: lessonId,
      title,
    });

    // زيادة عدد الدروس
    course.totalLessons = (course.totalLessons || 0) + 1;

    await course.save();

    res.status(201).json({ 
      message: 'تم إضافة الدرس بنجاح', 
      lesson: newLesson,
      courseId: course._id,
      unitId: unit._id
    });
  } catch (error) {
    console.error('Add lesson error:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء إضافة الدرس' });
  }
};


// تعديل درس
exports.editLesson = async (req, res) => {
  const { unitId, lessonId } = req.params;
  const { title, videoUrl, description, fileUrl, externalUrl, content, duration, type, isFree, specialization } = req.body;
  console.log('editLesson payload:', { unitId, lessonId, title, videoUrl, fileUrl, externalUrl, content, duration, type, isFree, specialization });
  const course = await Course.findOne({ 'units._id': unitId });
  if (!course) return res.status(404).json({ error: 'Course not found' });
  const unit = course.units.id(unitId);
  const lesson = unit.lessons.id(lessonId);
  if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
  if (typeof title !== 'undefined') lesson.title = title;
  if (typeof duration !== 'undefined') lesson.duration = duration;
  if (typeof type !== 'undefined') lesson.type = type;
  if (typeof isFree !== 'undefined') lesson.isFree = isFree;
  if (typeof specialization !== 'undefined') lesson.specialization = specialization;
  if (typeof description !== 'undefined') lesson.description = description;
  if (typeof videoUrl !== 'undefined') { lesson.videoUrl = videoUrl; lesson.fileUrl = undefined; lesson.externalUrl = undefined; lesson.content = undefined; }
  if (typeof fileUrl !== 'undefined') { lesson.fileUrl = fileUrl; lesson.videoUrl = undefined; lesson.externalUrl = undefined; lesson.content = undefined; }
  if (typeof externalUrl !== 'undefined') { lesson.externalUrl = externalUrl; lesson.videoUrl = undefined; lesson.fileUrl = undefined; lesson.content = undefined; }
  if (typeof content !== 'undefined') { lesson.content = content; lesson.videoUrl = undefined; lesson.fileUrl = undefined; lesson.externalUrl = undefined; }
  await course.save();
  console.log('Saved lesson (controller):', lesson);
  res.json(lesson);
};

// حذف درس
exports.deleteLesson = async (req, res) => {
  const { unitId, lessonId } = req.params;
  const course = await Course.findOne({ 'units._id': unitId });
  if (!course) return res.status(404).json({ error: 'Course not found' });
  const unit = course.units.id(unitId);
  const lesson = unit.lessons.id(lessonId);
  if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
  lesson.remove();
  await course.save();
  res.json(unit);
};

// حفظ تقدم المستخدم (باستخدام Progress model حتى يكون عبر الأجهزة)
exports.completeLesson = async (req, res) => {
  try {
    const userId = req.user._id;
    const { courseId, unitId, lessonId } = req.body;
    if (!courseId || !lessonId) return res.status(400).json({ error: 'courseId and lessonId are required' });

    // تأكد من أن الكورس موجود لحساب الدروس لاحقاً
    const course = await Course.findById(courseId).select('_id units lessons content title totalLessons');
    if (!course) return res.status(404).json({ error: 'Course not found' });

    // Calculate total lessons for this course
    const totalLessonsCount = countTotalLessons(course);

    const lessonObjectId = new mongoose.Types.ObjectId(lessonId);
    
    // Find existing progress
    let doc = await Progress.findOne({ user: userId, course: courseId });
    
    if (!doc) {
      // Create new progress document
      doc = new Progress({
        user: userId,
        course: courseId,
        totalLessons: totalLessonsCount,
        completedLessons: [{
          lessonId: lessonObjectId,
          unitId: unitId ? new mongoose.Types.ObjectId(unitId) : null,
          completedAt: new Date()
        }]
      });
    } else {
      // Check if lesson already completed (by lessonId only, ignore timestamp)
      const alreadyCompleted = doc.completedLessons.some(
        completed => completed.lessonId.toString() === lessonObjectId.toString()
      );
      
      if (!alreadyCompleted) {
        doc.completedLessons.push({
          lessonId: lessonObjectId,
          unitId: unitId ? new mongoose.Types.ObjectId(unitId) : null,
          completedAt: new Date()
        });
      }
    }
    
    // Update lastViewed
    doc.lastViewed = {
      lessonId: lessonObjectId,
      unitId: unitId ? new mongoose.Types.ObjectId(unitId) : null,
      at: new Date()
    };
    
    await doc.save();

    return res.json({ success: true, progress: doc });
  } catch (err) {
    console.error('completeLesson error', err);
    res.status(500).json({ error: 'Failed to save progress' });
  }
};

// حساب إجمالي عدد الدروس في كورس
function countTotalLessons(course) {
  try {
    if (!course) return 0;
    let total = 0;
    
    // طريقة 1: عد الدروس من units
    if (Array.isArray(course.units)) {
      for (const u of course.units) {
        if (u && Array.isArray(u.lessons)) {
          total += u.lessons.length;
        }
      }
    }
    
    // طريقة 2: إذا كان هناك totalLessons مخزن مباشرة في الكورس
    if (total === 0 && course.totalLessons) {
      total = course.totalLessons;
    }
    
    // طريقة 3: عد من content إذا كانت موجودة
    if (total === 0 && Array.isArray(course.content)) {
      total = course.content.filter(c => c.type === 'lesson').length;
    }
    
    return total > 0 ? total : 0;
  } catch (err) {
    console.error('Error in countTotalLessons:', err);
    return 0;
  }
}

// ملخص تقدم المستخدم في جميع الكورسات التي بدأها
exports.getProgressSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const docs = await Progress.find({ user: userId }).populate('course', 'title units totalLessons content');
    const summary = docs.map(d => {
      // Use cached totalLessons from Progress model if available, otherwise calculate from course
      let totalLessons = d.totalLessons || 0;
      if (!totalLessons) {
        totalLessons = countTotalLessons(d.course);
      }
      
      const completedCount = (d.completedLessons || []).length;
      const percent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
      
      // Debug logging
      console.log(`Progress Summary - Course: ${d.course?.title}, Total: ${totalLessons}, Completed: ${completedCount}, Percent: ${percent}%`);
      
      return {
        courseId: d.course?._id,
        courseTitle: d.course?.title || 'Course',
        completedCount,
        totalLessons,
        progressPercent: percent,
        lastViewed: d.lastViewed || null,
        updatedAt: d.updatedAt
      };
    });
    res.json(summary);
  } catch (err) {
    console.error('getProgressSummary error', err);
    res.status(500).json({ error: 'Failed to fetch progress summary' });
  }
};

// تقدم مستخدم لكورس محدد بالتفصيل
exports.getCourseProgress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { courseId } = req.params;
    const doc = await Progress.findOne({ user: userId, course: courseId }).populate('course', 'title units totalLessons content');
    if (!doc) return res.json({ courseId, courseTitle: '', completedLessons: [], totalLessons: 0, progressPercent: 0, lastViewed: null });
    
    // Use cached totalLessons from Progress model if available, otherwise calculate from course
    let totalLessons = doc.totalLessons || 0;
    if (!totalLessons) {
      totalLessons = countTotalLessons(doc.course);
    }
    
    const completedCount = (doc.completedLessons || []).length;
    const percent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
    
    // Debug logging
    console.log(`Course Progress - Course: ${doc.course?.title}, Total: ${totalLessons}, Completed: ${completedCount}, Percent: ${percent}%`);
    
    res.json({
      courseId: doc.course?._id,
      courseTitle: doc.course?.title || 'Course',
      completedLessons: doc.completedLessons || [],
      totalLessons,
      progressPercent: percent,
      lastViewed: doc.lastViewed || null,
      updatedAt: doc.updatedAt
    });
  } catch (err) {
    console.error('getCourseProgress error', err);
    res.status(500).json({ error: 'Failed to fetch course progress' });
  }
};