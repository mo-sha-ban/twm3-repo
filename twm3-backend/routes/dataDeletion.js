const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Message = require('../models/Message');
const CommunityPost = require('../models/CommunityPost');

/**
 * Facebook Data Deletion Callback
 * POST /api/facebook/data-deletion
 * Accepts signed_request from Facebook, verifies it, and deletes user data
 */
router.post('/facebook/data-deletion', express.urlencoded({ extended: true }), async (req, res) => {
    try {
        const signed = req.body && req.body.signed_request;
        if (!signed) return res.status(400).json({ error: 'signed_request required' });

        const appSecret = process.env.FACEBOOK_CLIENT_SECRET || process.env.FACEBOOK_APP_SECRET;
        if (!appSecret) {
            console.error('Facebook app secret not configured in env (FACEBOOK_CLIENT_SECRET or FACEBOOK_APP_SECRET)');
            return res.status(500).json({ error: 'Server misconfiguration' });
        }

        // parse and verify signed_request
        function base64UrlDecode(str) {
            str = str.replace(/-/g, '+').replace(/_/g, '/');
            while (str.length % 4) str += '=';
            return Buffer.from(str, 'base64').toString('utf8');
        }

        const parts = signed.split('.');
        if (parts.length !== 2) return res.status(400).json({ error: 'Invalid signed_request format' });
        const sig = parts[0];
        const payloadEncoded = parts[1];

        const expectedSig = crypto.createHmac('sha256', appSecret).update(payloadEncoded).digest();
        const receivedSig = Buffer.from(sig.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

        if (receivedSig.length !== expectedSig.length || !crypto.timingSafeEqual(receivedSig, expectedSig)) {
            console.warn('signed_request signature mismatch');
            return res.status(400).json({ error: 'Invalid signature' });
        }

        const payloadJson = base64UrlDecode(payloadEncoded);
        let payload;
        try { payload = JSON.parse(payloadJson); } catch (e) {
            console.error('Failed to parse payload JSON', e);
            return res.status(400).json({ error: 'Invalid payload' });
        }

        const fbUserId = payload.user_id || payload.sub || (payload.user && payload.user.id);
        if (!fbUserId) return res.status(400).json({ error: 'user_id not found in payload' });

        // find the user in our DB by provider and providerId
        const user = await User.findOne({ provider: 'facebook', providerId: String(fbUserId) });

        // generate confirmation code and status URL
        const confirmationCode = crypto.randomBytes(12).toString('hex');
        const base = (process.env.FRONTEND_BASE_URL && process.env.FRONTEND_BASE_URL.replace(/\/$/, '')) || 'http://localhost:5000';
        const statusUrl = `${base}/data-deletion-status.html?code=${confirmationCode}`;

        if (!user) {
            // No user found - still respond 200 with confirmation info as FB expects
            return res.json({ 
                url: statusUrl, 
                confirmation_code: confirmationCode, 
                message: 'user not found - no data deleted' 
            });
        }

        const userId = user._id;

        // Delete user-related data (best-effort)
        // 1) Remove Comments authored by user
        await Comment.deleteMany({ user: userId });
        // Remove replies inside comments authored by user
        await Comment.updateMany(
            { 'replies.user': userId },
            { $pull: { replies: { user: userId } } }
        );

        // 2) Remove messages where user is sender or recipient
        await Message.deleteMany({ $or: [{ sender: userId }, { recipient: userId }] });

        // 3) Remove community posts authored by user, and remove their replies/likes
        await CommunityPost.deleteMany({ author: userId });
        await CommunityPost.updateMany(
            { 'replies.author': userId },
            { $pull: { replies: { author: userId } } }
        );
        await CommunityPost.updateMany(
            { likes: userId },
            { $pull: { likes: userId }, $inc: { likesCount: -1 } }
        );

        // 4) Remove the user document
        await User.findByIdAndDelete(userId);

        // Respond with JSON that Facebook expects
        return res.json({
            url: statusUrl,
            confirmation_code: confirmationCode,
            message: 'user data deleted'
        });
    } catch (err) {
        console.error('Error in facebook data deletion callback:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;