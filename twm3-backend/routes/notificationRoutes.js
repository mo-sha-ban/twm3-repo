const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware for authentication
function authTokenLocal(req, res, next) {
    let token = null;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
        if (authHeader.startsWith('Bearer ')) token = authHeader.split(' ')[1];
        else token = authHeader;
    }
    if (!token) return res.status(401).json({ error: 'Missing token' });
    try {
        const user = jwt.verify(token, process.env.JWT_SECRET || 'jwtsecret');
        if (user.id && !user._id) user._id = user.id;
        req.user = user;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid token' });
    }
}

function requireAdminLocal(req, res, next) {
    if (req.user && req.user.isAdmin) return next();
    return res.status(403).json({ error: 'Admin only' });
}

// Get all notifications for logged-in user
router.get('/', authTokenLocal, async (req, res) => {
    try {
        const userId = req.user._id;
        const notifications = await Notification.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(100);
        res.json(notifications);
    } catch (err) {
        console.error('GET /api/notifications', err);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Get unread count
router.get('/unread-count', authTokenLocal, async (req, res) => {
    try {
        const userId = req.user._id;
        const count = await Notification.countDocuments({ user: userId, read: false });
        res.json({ count });
    } catch (err) {
        console.error('GET /api/notifications/unread-count', err);
        res.status(500).json({ error: 'Failed to fetch unread count' });
    }
});

// Mark notification as read
router.put('/:id/read', authTokenLocal, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) return res.status(404).json({ error: 'Notification not found' });
        
        if (String(notification.user) !== String(req.user._id)) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        
        notification.read = true;
        await notification.save();
        res.json({ success: true, notification });
    } catch (err) {
        console.error('PUT /api/notifications/:id/read', err);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

// Mark all notifications as read
router.put('/mark-all-read', authTokenLocal, async (req, res) => {
    try {
        const userId = req.user._id;
        const result = await Notification.updateMany(
            { user: userId, read: false },
            { read: true }
        );
        res.json({ success: true, updated: result.modifiedCount });
    } catch (err) {
        console.error('PUT /api/notifications/mark-all-read', err);
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
});

// Clear all notifications - MUST be before /:id route
router.delete('/clear-all', authTokenLocal, async (req, res) => {
    try {
        const userId = req.user._id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const result = await Notification.deleteMany({ user: userId });
        res.json({ success: true, deleted: result.deletedCount });
    } catch (err) {
        console.error('DELETE /api/notifications/clear-all', err);
        res.status(500).json({ error: 'Failed to clear all notifications', details: err.message });
    }
});

// Delete notification - MUST be after /clear-all route
router.delete('/:id', authTokenLocal, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) return res.status(404).json({ error: 'Notification not found' });
        
        if (String(notification.user) !== String(req.user._id)) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        
        await Notification.deleteOne({ _id: notification._id });
        res.json({ success: true });
    } catch (err) {
        console.error('DELETE /api/notifications/:id', err);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

// Create notification (admin only) - used when sending messages from dashboard
router.post('/create', authTokenLocal, requireAdminLocal, async (req, res) => {
    try {
        const { userIds, type, title, body, link } = req.body;
        
        if (!title) return res.status(400).json({ error: 'Title is required' });
        
        const userIdsArray = Array.isArray(userIds) ? userIds : (userIds === 'all' ? [] : [userIds]);
        
        let targetUsers = [];
        if (userIdsArray.length === 0 || userIds === 'all') {
            // Send to all users
            targetUsers = await User.find().select('_id');
        } else {
            targetUsers = await User.find({ _id: { $in: userIdsArray } }).select('_id');
        }
        
        const notifications = targetUsers.map(user => ({
            user: user._id,
            type: type || 'info',
            title,
            body: body || '',
            message: body || '',
            link: link || ''
        }));
        
        const created = await Notification.insertMany(notifications);
        
        // Emit socket events for real-time notifications
        try {
            const io = req.app && req.app.get && req.app.get('io');
            if (io) {
                created.forEach(notification => {
                    io.to(String(notification.user)).emit('notification:new', notification);
                });
            }
        } catch (e) {
            console.error('Socket emit failed:', e);
        }
        
        res.json({ success: true, created: created.length });
    } catch (err) {
        console.error('POST /api/notifications/create', err);
        res.status(500).json({ error: 'Failed to create notifications' });
    }
});

module.exports = router;

