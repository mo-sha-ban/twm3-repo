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

// Sync local progress to server
router.post('/sync', async (req, res) => {
    try {
        const { courseId, completedLessons, progressPercent } = req.body;

        // Get user from token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwtsecret');
        const userId = decoded._id || decoded.id;

        if (!userId || !courseId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: userId, courseId'
            });
        }

        // Get course info
        const course = await Course.findById(courseId).select('title units totalLessons');
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Get or create progress document
        let progress = await Progress.findOne({ user: userId, course: courseId });

        if (!progress) {
            const totalLessonsCount = countTotalLessons(course);
            progress = new Progress({
                user: userId,
                course: courseId,
                totalLessons: totalLessonsCount,
                completedLessons: []
            });
        }

        // Update completed lessons if provided
        if (Array.isArray(completedLessons)) {
            // Clear existing completed lessons
            progress.completedLessons = [];

            // Add new completed lessons
            for (const lesson of completedLessons) {
                if (lesson.unitId && lesson.lessonId) {
                    progress.completedLessons.push({
                        lessonId: new mongoose.Types.ObjectId(lesson.lessonId),
                        unitId: new mongoose.Types.ObjectId(lesson.unitId),
                        completedAt: new Date()
                    });
                }
            }
        }

        // Update progress percentage if provided
        if (typeof progressPercent === 'number') {
            progress.progressPercent = Math.max(0, Math.min(100, progressPercent));
        }

        progress.lastAccessedAt = new Date();
        await progress.save();

        return res.json({
            success: true,
            message: 'Progress synced successfully',
            progress: {
                lessonsCompleted: progress.completedLessons.length,
                totalLessons: progress.totalLessons,
                percentageComplete: progress.totalLessons > 0
                    ? Math.round((progress.completedLessons.length / progress.totalLessons) * 100)
                    : 0
            }
        });
    } catch (error) {
        console.error('Error syncing progress:', error);
        res.status(500).json({
            success: false,
            message: 'Error syncing progress',
            error: error.message
        });
    }
});

// Get progress summary for user
router.get('/summary', async (req, res) => {
    try {
        // Get user from token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwtsecret');
        const userId = decoded._id || decoded.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }

        const progressData = await Progress.find({ user: userId })
            .populate('course', 'title name')
            .select('course totalLessons completedLessons progressPercent lastAccessedAt');

        const summaries = progressData.map(p => ({
            courseId: p.course._id || p.course,
            courseTitle: p.course.title || p.course.name || 'Unknown Course',
            totalLessons: p.totalLessons || 0,
            completedCount: p.completedLessons ? p.completedLessons.length : 0,
            progressPercent: p.progressPercent || 0,
            lastAccessedAt: p.lastAccessedAt
        }));

        return res.json(summaries);
    } catch (error) {
        console.error('Error fetching progress summary:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching progress summary',
            error: error.message
        });
    }
});

// Mark lesson as complete
router.post('/complete', async (req, res) => {
    try {
        const { courseId, unitId, lessonId } = req.body;

        // Get user from token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwtsecret');
        const userId = decoded._id || decoded.id;

        if (!userId || !courseId || !lessonId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Get or create progress document
        let progress = await Progress.findOne({ user: userId, course: courseId });

        if (!progress) {
            const course = await Course.findById(courseId).select('title units totalLessons');
            const totalLessonsCount = countTotalLessons(course);

            progress = new Progress({
                user: userId,
                course: courseId,
                totalLessons: totalLessonsCount,
                completedLessons: []
            });
        }

        // Check if lesson already completed
        const lessonObjectId = new mongoose.Types.ObjectId(lessonId);
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

        progress.lastAccessedAt = new Date();
        await progress.save();

        return res.json({
            success: true,
            message: 'Lesson marked as complete',
            progress: {
                lessonsCompleted: progress.completedLessons.length,
                totalLessons: progress.totalLessons,
                percentageComplete: progress.totalLessons > 0
                    ? Math.round((progress.completedLessons.length / progress.totalLessons) * 100)
                    : 0
            }
        });
    } catch (error) {
        console.error('Error marking lesson complete:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking lesson complete',
            error: error.message
        });
    }
});

// Report data issue
router.post('/report-issue', async (req, res) => {
    try {
        const { courseId, issueType, issueData, clientInfo } = req.body;

        // Get user from token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwtsecret');
        const userId = decoded._id || decoded.id;

        console.log('Data issue reported:', {
            userId,
            courseId,
            issueType,
            issueData,
            clientInfo
        });

        // Here you could save the issue to a database or send an email
        // For now, just log it and return success

        return res.json({
            success: true,
            message: 'Issue reported successfully'
        });
    } catch (error) {
        console.error('Error reporting issue:', error);
        res.status(500).json({
            success: false,
            message: 'Error reporting issue',
            error: error.message
        });
    }
});

module.exports = router;
