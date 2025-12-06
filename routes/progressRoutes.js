const express = require('express');
const router = express.Router();
const Progress = require('../models/Progress');
const Course = require('../models/Course');
const mongoose = require('mongoose');

// Helper function to count total lessons
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

// Track lesson watch - increment progress
router.post('/track-lesson', async (req, res) => {
    try {
        const { userId, courseId, lessonId, unitId } = req.body;

        if (!userId || !courseId || !lessonId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields: userId, courseId, lessonId' 
            });
        }

        // Get course info
        const course = await Course.findById(courseId).select('title units totalLessons content');
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        const lessonObjectId = new mongoose.Types.ObjectId(lessonId);
        
        // Get or create progress document
        let progress = await Progress.findOne({ user: userId, course: courseId });
        
        if (!progress) {
            // Calculate total lessons for this course
            const totalLessonsCount = countTotalLessons(course);

            progress = new Progress({
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
            // Check if lesson already completed (by lessonId only)
            const alreadyCompleted = progress.completedLessons.some(
                l => l.lessonId.toString() === lessonObjectId.toString()
            );

            if (!alreadyCompleted) {
                progress.completedLessons.push({
                    lessonId: lessonObjectId,
                    unitId: unitId ? new mongoose.Types.ObjectId(unitId) : null,
                    completedAt: new Date()
                });
            }
        }

        progress.lastAccessedAt = new Date();
        await progress.save();

        return res.json({
            success: true,
            progress: {
                lessonsCompleted: progress.completedLessons.length,
                totalLessons: progress.totalLessons,
                percentageComplete: progress.totalLessons > 0 
                    ? Math.round((progress.completedLessons.length / progress.totalLessons) * 100)
                    : 0,
                status: progress.status
            }
        });
    } catch (error) {
        console.error('Error tracking lesson:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error tracking lesson progress',
            error: error.message 
        });
    }
});

// Get user's progress for all courses
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const progressData = await Progress.find({ user: userId })
            .populate('course', 'name image category')
            .sort({ lastAccessedAt: -1 });

        return res.json({
            success: true,
            progress: progressData
        });
    } catch (error) {
        console.error('Error fetching user progress:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching progress',
            error: error.message 
        });
    }
});

// Get specific course progress for user
router.get('/course/:courseId/user/:userId', async (req, res) => {
    try {
        const { courseId, userId } = req.params;

        const progress = await Progress.findOne({ 
            user: userId, 
            course: courseId 
        }).populate('course', 'name image category');

        if (!progress) {
            return res.json({
                success: true,
                progress: {
                    lessonsCompleted: 0,
                    totalLessons: 0,
                    percentageComplete: 0,
                    status: 'not-started'
                }
            });
        }

        return res.json({
            success: true,
            progress: progress
        });
    } catch (error) {
        console.error('Error fetching course progress:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching course progress',
            error: error.message 
        });
    }
});

// Reset all user progress
router.delete('/user/:userId/reset', async (req, res) => {
    try {
        const { userId } = req.params;

        // Delete all progress documents for user
        await Progress.deleteMany({ user: userId });

        return res.json({
            success: true,
            message: 'All progress has been reset successfully'
        });
    } catch (error) {
        console.error('Error resetting progress:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error resetting progress',
            error: error.message 
        });
    }
});

// Reset course-specific progress
router.delete('/course/:courseId/user/:userId/reset', async (req, res) => {
    try {
        const { courseId, userId } = req.params;

        await Progress.deleteOne({ 
            user: userId, 
            course: courseId 
        });

        return res.json({
            success: true,
            message: 'Course progress has been reset successfully'
        });
    } catch (error) {
        console.error('Error resetting course progress:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error resetting course progress',
            error: error.message 
        });
    }
});

module.exports = router;
