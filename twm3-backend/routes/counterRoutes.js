const express = require('express');
const router = express.Router();
const CounterConfig = require('../models/CounterConfig');
const jwt = require('jsonwebtoken');

// Authentication middleware
const authToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ error: 'يجب تسجيل الدخول' });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    jwt.verify(token, process.env.JWT_SECRET || 'jwtsecret', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'توكن غير صالح أو منتهي الصلاحية' });
        }
        if (user.id && !user._id) user._id = user.id;
        req.user = user;
        next();
    });
};

// Admin authorization middleware
const requireAdmin = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ error: 'صلاحيات الإدارة مطلوبة' });
    }
    next();
};

// Get counter configuration
router.get('/counter-config', async (req, res) => {
    try {
        let config = await CounterConfig.findOne();
        
        if (!config) {
            // Create default configuration if none exists
            config = new CounterConfig({
                baseCount: 50000,
                dailyIncrement: 20,
                startDate: new Date('2024-01-01')
            });
            await config.save();
        }

        const response = {
            baseCount: config.baseCount,
            dailyIncrement: config.dailyIncrement,
            startDate: config.startDate.getTime(),
            currentCount: config.currentCount
        };

        res.json(response);
    } catch (error) {
        console.error('Error getting counter config:', error);
        res.status(500).json({ error: 'فشل في قراءة إعدادات العداد' });
    }
});

// Update counter configuration (admin only)
router.put('/counter-config', authToken, requireAdmin, async (req, res) => {
    try {
        const { baseCount, dailyIncrement, startDate } = req.body;

        // Validate input
        if (typeof baseCount !== 'number' || typeof dailyIncrement !== 'number' || !startDate) {
            return res.status(400).json({ error: 'معلومات العداد غير صحيحة' });
        }

        // Update or create config
        const config = await CounterConfig.findOne();
        if (config) {
            config.baseCount = baseCount;
            config.dailyIncrement = dailyIncrement;
            config.startDate = new Date(startDate);
            config.lastUpdated = new Date();
            await config.save();
        } else {
            const newConfig = new CounterConfig({
                baseCount,
                dailyIncrement,
                startDate: new Date(startDate)
            });
            await newConfig.save();
        }

        res.json({
            baseCount,
            dailyIncrement,
            startDate
        });
    } catch (error) {
        console.error('Error updating counter config:', error);
        res.status(500).json({ error: 'فشل في تحديث إعدادات العداد' });
    }
});

module.exports = router;