const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Mark all messages for current user as read
router.put('/mark-all-read', authTokenLocal, async (req, res) => {
    try {
        const me = String(req.user._id);
        const query = {
            $or: [
                { recipient: me },
                { sender: me }
            ],
            read: false
        };
        const result = await Message.updateMany(query, { read: true });
        console.log('Mark-all-read for user:', me, 'query:', JSON.stringify(query), 'Modified:', result.modifiedCount);
        // Return updated unread count for the client to update immediately
        const unreadRemaining = await Message.countDocuments({ recipient: me, read: false });
        // Mark message notifications as read too (clear message notifications count for this user)
        try {
            const notifResult = await Notification.updateMany({ user: me, type: 'message', read: false }, { read: true });
            console.log('Marked message notifications as read for user:', me, 'Modified:', notifResult.modifiedCount);
        } catch (e) { console.error('Failed to mark message notifications as read', e); }
        const notificationUnread = await Notification.countDocuments({ user: me, read: false });
        res.json({ success: true, updated: result.modifiedCount, unreadRemaining, notificationUnread });
    } catch (err) {
        console.error('PUT /api/messages/mark-all-read', err);
        res.status(500).json({ error: 'Failed to mark all messages as read' });
    }
});

// middleware authToken reused from server.js expectations (we'll re-check req.user)
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

// Helper: resolve recipients based on filter
async function resolveRecipients(filter) {
    // Removed phone-based recipient lookup by request.
    if (!filter) return [];
    if (filter === 'all') {
        const users = await User.find().select('_id email');
        return users.map(u => ({ _id: u._id, email: u.email }));
    }
    const ids = new Set();
    const results = [];
    if (Array.isArray(filter.userIds)) {
        for (const id of filter.userIds) ids.add(String(id));
    }
    if (Array.isArray(filter.emails)) {
        const users = await User.find({ email: { $in: filter.emails } }).select('_id email');
        users.forEach(u => ids.add(String(u._id)));
    }
    if (Array.isArray(filter.usernames)) {
        const users = await User.find({ username: { $in: filter.usernames } }).select('_id email');
        users.forEach(u => ids.add(String(u._id)));
    }
    if (ids.size > 0) {
        const users = await User.find({ _id: { $in: Array.from(ids) } }).select('_id email');
        users.forEach(u => results.push({ _id: u._id, email: u.email }));
    }
    return results;
}

// Helper to build HTML email from content
function buildEmailHTML(subject, body, contentType) {
    let htmlBody = body.replace(/\n/g, '<br>');
    
    // Convert URLs to links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    htmlBody = htmlBody.replace(urlRegex, '<a href="$1" style="color: #4f46e5; text-decoration: none;">$1</a>');
    
    // Handle images (both URLs and local uploads)
    const imageMatch = body.match(/🖼️\s*(https?:\/\/[^\s]+)/);
    if (imageMatch) {
        const imageUrl = imageMatch[1];
        // Get full URL if it's a local upload
        const fullImageUrl = imageUrl.startsWith('/') ? `${process.env.FRONTEND_URL || 'http://localhost:5000'}${imageUrl}` : imageUrl;
        htmlBody = htmlBody.replace(/🖼️\s*https?:\/\/[^\s]+/, `<img src="${fullImageUrl}" alt="Image" style="max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0;">`);
    }
    
    // Handle videos (YouTube and local uploads)
    const videoMatch = body.match(/https?:\/\/[^\s]+/);
    if (videoMatch) {
        const videoUrl = videoMatch[0];
        // Check if it's YouTube
        const videoId = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1];
        if (videoId) {
            htmlBody = htmlBody.replace(videoUrl, `
                <div style="margin: 16px 0; text-align: center;">
                    <a href="${videoUrl}" style="display: inline-block; padding: 12px 24px; background: #ff0000; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
                        ▶ شاهد الفيديو على YouTube
                    </a>
                </div>
            `);
        } else if (videoUrl.includes('/uploads/videos/')) {
            // Local video file
            const fullVideoUrl = videoUrl.startsWith('/') ? `${process.env.FRONTEND_URL || 'http://localhost:5000'}${videoUrl}` : videoUrl;
            htmlBody = htmlBody.replace(videoUrl, `
                <div style="margin: 16px 0; text-align: center;">
                    <a href="${fullVideoUrl}" style="display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
                        ▶ شاهد الفيديو
                    </a>
                </div>
            `);
        }
    }
    
    return `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Cairo', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 1.5rem;">TeamWork M3</h1>
            </div>
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                <h2 style="color: #1a1a1a; margin-top: 0; font-size: 1.25rem;">${subject || 'رسالة من الإدارة'}</h2>
                <div style="color: #4b5563; font-size: 1rem;">
                    ${htmlBody}
                </div>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                    هذه رسالة تلقائية من TeamWork M3. يرجى عدم الرد على هذا البريد.
                </p>
            </div>
        </body>
        </html>
    `;
}

// Optional email sender (nodemailer) - only used if SMTP env is set
async function sendEmailsIfNeeded(recipients, subject, body, fromName, contentType = 'text', htmlBody = null) {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('SMTP not configured, skipping email send');
        return { skipped: true };
    }
    
    // Gmail SMTP configuration
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { 
            user: process.env.SMTP_USER, 
            pass: process.env.SMTP_PASS 
        },
        tls: { rejectUnauthorized: false }
    });

    const sendPromises = recipients.map(r => {
        if (!r.email) return Promise.resolve({ skipped: true });
        
        // Build HTML email if htmlBody is provided
        const mailOptions = {
            from: `${fromName || 'TeamWork M3'} <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
            to: r.email,
            subject: subject || 'رسالة من الإدارة',
            text: body || ''
        };
        
        if (htmlBody) {
            mailOptions.html = htmlBody;
        }
        
        return transporter.sendMail(mailOptions);
    });
    
    return Promise.all(sendPromises);
}

// Send message(s) - admin only
// body: { recipients: 'all' | { emails:[], phones:[], usernames:[], userIds:[] }, subject, body, sendEmail }
router.post('/send', authTokenLocal, requireAdminLocal, async (req, res) => {
    try {
        const { recipients, subject, body, sendEmail, contentType = 'text' } = req.body;
        if (!body) return res.status(400).json({ error: 'Message body required' });

        const resolved = await resolveRecipients(recipients === 'all' ? 'all' : recipients);
        if (!resolved || resolved.length === 0) return res.status(400).json({ error: 'No recipients found' });

        const created = [];
        const notifications = [];
        
        // Determine notification type based on message content or contentType
        let notificationType = 'announcement';
        if (contentType === 'course' || contentType === 'video') {
            notificationType = 'course';
        } else if (contentType === 'update') {
            notificationType = 'update';
        } else if (contentType === 'discount' || contentType === 'link') {
            notificationType = 'discount';
        } else {
            const bodyLower = (body || '').toLowerCase();
            if (bodyLower.includes('كورس') || bodyLower.includes('دورة') || bodyLower.includes('course')) {
                notificationType = 'course';
            } else if (bodyLower.includes('تحديث') || bodyLower.includes('update')) {
                notificationType = 'update';
            } else if (bodyLower.includes('تخفيض') || bodyLower.includes('خصم') || bodyLower.includes('discount') || bodyLower.includes('sale')) {
                notificationType = 'discount';
            }
        }
        
        // Build HTML email if sendEmail is true
        let htmlEmailBody = null;
        if (sendEmail) {
            htmlEmailBody = buildEmailHTML(subject, body, contentType);
        }
        
        for (const r of resolved) {
            const msg = new Message({
                sender: req.user._id,
                recipient: r._id,
                subject: subject || '',
                body,
                viaEmail: !!sendEmail,
                isAdminBroadcast: true,
                displayName: 'Admin'
            });
            await msg.save();
            created.push(msg);
            
            // Create notification for this message
            const notification = new Notification({
                user: r._id,
                type: notificationType,
                title: subject || 'رسالة من الإدارة',
                body: body,
                message: body
            });
            await notification.save();
            notifications.push(notification);
        }

        // Send emails if requested - ALWAYS send to Gmail
        if (sendEmail) {
            try { 
                await sendEmailsIfNeeded(
                    resolved, 
                    subject, 
                    body, 
                    req.user.name || 'Admin',
                    contentType,
                    htmlEmailBody
                ); 
            }
            catch (e) { 
                console.error('Email send failed:', e);
                // Don't fail the entire request if email fails
            }
        }
        
        // Emit socket events for notifications
        try {
            const io = req.app && req.app.get && req.app.get('io');
            if (io) {
                notifications.forEach(notification => {
                    io.to(String(notification.user)).emit('notification:new', notification);
                });
            }
        } catch (e) {
            console.error('Socket emit failed for notifications:', e);
        }

        return res.json({ 
            success: true, 
            sent: created.length, 
            notifications: notifications.length,
            emailsSent: sendEmail ? resolved.filter(r => r.email).length : 0
        });
    } catch (err) {
        console.error('POST /api/messages/send', err);
        res.status(500).json({ error: 'Failed to send messages' });
    }
});

// Create a direct message from current user to recipientId (non-admin allowed)
// body: { recipientId, subject?, body, sendEmail? }
router.post('/create', authTokenLocal, async (req, res) => {
    try {
        const senderId = req.user && req.user._id;
        const { recipientId, subject, body, sendEmail } = req.body;
        if (!recipientId || !body) return res.status(400).json({ error: 'recipientId and body are required' });

        const recipientUser = await User.findById(recipientId).select('_id email blockedUsers');
        if (!recipientUser) return res.status(404).json({ error: 'Recipient not found' });

        // Check block: if either sender blocked recipient or recipient blocked sender => disallow
        const senderUser = await User.findById(senderId).select('blockedUsers');
        const senderBlockedRecipient = senderUser && senderUser.blockedUsers && senderUser.blockedUsers.some(id => String(id) === String(recipientId));
        const recipientBlockedSender = recipientUser && recipientUser.blockedUsers && recipientUser.blockedUsers.some(id => String(id) === String(senderId));
        if (senderBlockedRecipient || recipientBlockedSender) {
            return res.status(403).json({ error: 'Messaging blocked between these users' });
        }

        const msg = new Message({
            sender: senderId,
            recipient: recipientId,
            subject: subject || '',
            body,
            viaEmail: !!sendEmail
        });

        await msg.save();

        // populate sender info for emission
    const senderInfo = await User.findById(senderId).select('_id name username avatarUrl isAdmin isVerified');

        // Emit socket event to recipient (if socket server is attached)
        try {
            const io = req.app && req.app.get && req.app.get('io');
            if (io) {
                io.to(String(recipientId)).emit('message:new', {
                    _id: msg._id,
                    sender: senderInfo || { _id: senderId },
                    recipient: { _id: recipientId },
                    subject: msg.subject,
                    body: msg.body,
                    createdAt: msg.createdAt
                });
                // Also emit to sender's room so other open sender tabs/devices receive the update immediately
                try { io.to(String(senderId)).emit('message:new', {
                    _id: msg._id,
                    sender: senderInfo || { _id: senderId },
                    recipient: { _id: recipientId },
                    subject: msg.subject,
                    body: msg.body,
                    createdAt: msg.createdAt
                }); } catch (e) { console.error('Emit to sender failed', e); }
            }
        } catch (e) { console.error('Socket emit failed', e); }

        if (sendEmail) {
            try { await sendEmailsIfNeeded([{ _id: recipientUser._id, email: recipientUser.email }], subject, body, req.user.name || 'User'); }
            catch (e) { console.error('Email send failed', e); }
        }

        res.json({ success: true, message: msg });
    } catch (err) {
        console.error('POST /api/messages/create', err);
        res.status(500).json({ error: 'Failed to create message' });
    }
});

// Get inbox for logged-in user
router.get('/', authTokenLocal, async (req, res) => {
    try {
        const userId = req.user && req.user._id;
        console.log('GET /api/messages for user:', String(userId));
    const msgs = await Message.find({ recipient: userId }).sort({ createdAt: -1 }).populate('sender', 'name email username avatarUrl isAdmin isVerified');
        const unreadCount = msgs.filter(m => !m.read).length;
        console.log(`Fetched ${msgs.length} messages for ${String(userId)} (${unreadCount} unread)`);
        // mask admin broadcast messages
        const sanitized = msgs.map(m => {
            if (m.isAdminBroadcast) {
                const obj = m.toObject();
                obj.sender = obj.sender || {};
                obj.sender.name = obj.displayName || 'Admin';
                obj.sender.username = undefined;
                obj.sender.email = undefined;
                obj.sender.avatarUrl = undefined;
                return obj;
            }
            return m;
        });
        res.json(sanitized);
    } catch (err) {
        console.error('GET /api/messages', err);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Debug: get unread count for current user
router.get('/unread-count', authTokenLocal, async (req, res) => {
    try {
        const me = String(req.user._id);
        const count = await Message.countDocuments({ recipient: me, read: false });
        res.json({ unread: count });
    } catch (err) {
        console.error('GET /api/messages/unread-count', err);
        res.status(500).json({ error: 'Failed to get unread count' });
    }
});

// Mark all messages from a sender as read
router.put('/mark-read-by-sender/:senderId', authTokenLocal, async (req, res) => {
    try {
        // علم كل الرسائل غير المقروءة بين المستخدم الحالي والمرسل كمقروءة
        const me = String(req.user._id);
        const other = String(req.params.senderId);
        const query = {
            $or: [
                { sender: other, recipient: me },
                { sender: me, recipient: other }
            ],
            read: false
        };
        const result = await Message.updateMany(query, { read: true });
        console.log('Mark-read-by-sender for user:', me, 'other:', other, 'query:', JSON.stringify(query), 'Modified:', result.modifiedCount);
        // Also mark message notifications as read for this user
        try {
            const notifResult = await Notification.updateMany({ user: me, type: 'message', read: false }, { read: true });
            console.log('Marked message notifications read for user:', me, 'Modified:', notifResult.modifiedCount);
        } catch (e) { console.error('Failed to mark message notifications as read', e); }
        const unreadRemaining = await Message.countDocuments({ recipient: me, read: false });
        const notificationUnread = await Notification.countDocuments({ user: me, read: false });
        res.json({ success: true, updated: result.modifiedCount, unreadRemaining, notificationUnread });
    } catch (err) {
        console.error('PUT /api/messages/mark-read-by-sender/:senderId', err);
        res.status(500).json({ error: 'Failed to mark messages as read' });
    }
});

// Get conversation thread between logged-in user and other user
router.get('/thread/:otherId', authTokenLocal, async (req, res) => {
    try {
        const me = String(req.user._id);
        const other = String(req.params.otherId);
        const msgs = await Message.find({
            $or: [
                { sender: me, recipient: other },
                { sender: other, recipient: me }
            ]
        }).sort({ createdAt: 1 }).populate('sender', 'name email username avatarUrl isAdmin isVerified').populate('recipient', 'name email username avatarUrl isAdmin isVerified');
        const sanitized = msgs.map(m => {
            if (m.isAdminBroadcast) {
                const obj = m.toObject();
                obj.sender = obj.sender || {};
                obj.sender.name = obj.displayName || 'Admin';
                obj.sender.username = undefined;
                obj.sender.email = undefined;
                obj.sender.avatarUrl = undefined;
                return obj;
            }
            return m;
        });
        res.json(sanitized);
    } catch (err) {
        console.error('GET /api/messages/thread/:otherId', err);
        res.status(500).json({ error: 'Failed to fetch thread' });
    }
});

// Reply to a message (either user or admin) - adds reply to thread
router.post('/:id/reply', authTokenLocal, async (req, res) => {
    try {
        const msg = await Message.findById(req.params.id);
        if (!msg) return res.status(404).json({ error: 'Message not found' });

        // Prevent replies to admin broadcast messages from non-admin users
        if (msg.isAdminBroadcast && !req.user.isAdmin) {
            return res.status(403).json({ 
                error: 'لا يمكنك الرد على الرسائل المرسلة من لوحة التحكم. للتواصل مع الإدارة، يرجى إرسال رسالة جديدة باستخدام اسم المستخدم.' 
            });
        }

        // Only recipient or sender can reply
        const uid = String(req.user._id);
        if (String(msg.recipient) !== uid && String(msg.sender) !== uid && !req.user.isAdmin) {
            return res.status(403).json({ error: 'Not allowed to reply' });
        }

        const reply = { sender: req.user._id, body: req.body.body };
        msg.replies.push(reply);
        // If recipient replies to admin message, keep it unread for admin? We'll keep a read flag per recipient only.
        await msg.save();
        res.json(msg);
    } catch (err) {
        console.error('POST /api/messages/:id/reply', err);
        res.status(500).json({ error: 'Failed to add reply' });
    }
});

// Mark message as read
router.put('/:id/read', authTokenLocal, async (req, res) => {
    try {
        const msg = await Message.findById(req.params.id);
        if (!msg) return res.status(404).json({ error: 'Message not found' });
        if (String(msg.recipient) !== String(req.user._id)) return res.status(403).json({ error: 'Not allowed' });
        msg.read = true;
        await msg.save();
        res.json({ success: true });
    } catch (err) {
        console.error('PUT /api/messages/:id/read', err);
        res.status(500).json({ error: 'Failed to mark read' });
    }
});

// Delete entire thread between current user and other user
router.delete('/thread/:otherId', authTokenLocal, async (req, res) => {
    try {
        const me = String(req.user._id);
        const other = String(req.params.otherId);
        
        // Delete all messages where I'm either sender or recipient with this other user
        const result = await Message.deleteMany({
            $or: [
                { sender: me, recipient: other },
                { sender: other, recipient: me }
            ]
        });

        console.log('Delete thread result:', result);
        res.json({ success: true, deleted: result.deletedCount });
    } catch (err) {
        console.error('DELETE /api/messages/thread/:otherId', err);
        res.status(500).json({ error: 'Failed to delete thread' });
    }
});

module.exports = router;
