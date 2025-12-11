const CommunityPost = require('../models/CommunityPost');
const User = require('../models/User');
const mongoose = require('mongoose');

async function getPosts(req, res) {
    try {
        const limit = Math.min(100, parseInt(req.query.limit || '50', 10));
        const filter = {};
        if (req.query.category) filter.category = req.query.category;
        if (req.query.search) filter.content = { $regex: req.query.search, $options: 'i' };

        const posts = await CommunityPost.find(filter)
            .sort({ pinned: -1, createdAt: -1 })
            .limit(limit)
            .populate('author', '_id name username avatarUrl isVerified')
            .populate('replies.author', '_id name username avatarUrl isVerified')
            .lean();
        return res.json(posts);
    } catch (err) {
        console.error('Failed to load community posts', err);
        return res.status(500).json({ error: 'فشل في جلب المنشورات' });
    }
}

async function createPost(req, res) {
    try {
        const user = req.user && (req.user._id || req.user.id);
        if (!user) return res.status(401).json({ error: 'يجب تسجيل الدخول' });
        const { content, images, category } = req.body || {};
        if (!content || String(content).trim().length === 0) return res.status(400).json({ error: 'المحتوى مطلوب' });

        const post = new CommunityPost({
            author: user,
            content: content.trim(),
            images: Array.isArray(images) ? images : [],
            category: category && String(category).trim().length ? String(category).trim() : 'عام'
        });

        await post.save();

        const populated = await CommunityPost.findById(post._id)
            .populate('author', '_id name username avatarUrl isVerified')
            .lean();

        // emit socket event if io available
        try { req.app && req.app.get('io') && req.app.get('io').emit('community:new-post', populated); } catch(_) {}

        return res.status(201).json(populated);
    } catch (err) {
        console.error('Failed to create community post', err);
        return res.status(500).json({ error: 'فشل في إنشاء المنشور' });
    }
}

async function replyToPost(req, res) {
    try {
        const user = req.user && (req.user._id || req.user.id);
        if (!user) return res.status(401).json({ error: 'يجب تسجيل الدخول' });
        const { postId } = req.params;
        const { content } = req.body || {};
        if (!content || String(content).trim().length === 0) return res.status(400).json({ error: 'المحتوى مطلوب' });

        const post = await CommunityPost.findById(postId);
        if (!post) return res.status(404).json({ error: 'المنشور غير موجود' });

        const reply = { author: user, content: content.trim(), createdAt: new Date() };
        post.replies.push(reply);
        await post.save();

        const populated = await CommunityPost.findById(postId)
            .populate('author', '_id name username avatarUrl isVerified')
            .populate('replies.author', '_id name username avatarUrl isVerified')
            .lean();

        try { req.app && req.app.get('io') && req.app.get('io').emit('community:new-reply', populated); } catch(_) {}

        return res.json(populated);
    } catch (err) {
        console.error('Failed to reply to post', err);
        return res.status(500).json({ error: 'فشل في إضافة رد' });
    }
}

async function toggleLike(req, res) {
    try {
        const user = req.user && (req.user._id || req.user.id);
        if (!user) return res.status(401).json({ error: 'يجب تسجيل الدخول' });
        const { postId } = req.params;
        const post = await CommunityPost.findById(postId);
        if (!post) return res.status(404).json({ error: 'المنشور غير موجود' });
        // Ensure likes is an array (handle older documents)
        if (!Array.isArray(post.likes)) post.likes = [];
        const userIdStr = String(user);
        const idx = post.likes.findIndex(id => String(id) === userIdStr);
        if (idx === -1) {
            // push as ObjectId to be type-safe
            try {
                post.likes.push(mongoose.Types.ObjectId(userIdStr));
            } catch (_) {
                post.likes.push(userIdStr);
            }
        } else {
            post.likes.splice(idx, 1);
        }
        post.likesCount = Array.isArray(post.likes) ? post.likes.length : 0;
        await post.save();

        const populated = await CommunityPost.findById(postId)
            .populate('author', '_id name username avatarUrl isVerified')
            .populate('replies.author', '_id name username avatarUrl isVerified')
            .lean();

        try { req.app && req.app.get('io') && req.app.get('io').emit('community:like', populated); } catch(_) {}

        return res.json(populated);
    } catch (err) {
        console.error('Failed to toggle like', err && err.stack ? err.stack : err);
        // return error message to aid debugging (safe in dev)
        return res.status(500).json({ error: 'فشل في تسجيل الإعجاب', detail: err.message || String(err) });
    }
}

module.exports = { getPosts, createPost, replyToPost, toggleLike };
