const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const Blog = require('../models/Blog');
const User = require('../models/User');

// Admin / list endpoint: paginated comments, filter and search support
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.max(5, Math.min(50, parseInt(req.query.pageSize) || 10));
    const filter = req.query.filter || 'all';
    const search = (req.query.search || '').trim();

    const q = {};
    if (filter && filter !== 'all') q.status = filter;
    if (search) {
      // Search in comment content and (via blog lookup) blog title
      q.$or = [
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Comment.countDocuments(q);
    const comments = await Comment.find(q)
      .populate('user', 'name username')
      .populate('blog', 'title')
      .populate('replies.user', 'name username')
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();

    return res.json({
      comments,
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      totalItems: total
    });
  } catch (err) {
    console.error('Error in GET /api/comments:', err);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب التعليقات' });
  }
});

// إضافة تعليق جديد (يتطلب توكن)
router.post('/', async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'يجب تسجيل الدخول لإضافة تعليق' });
    }
    const { blogId, content } = req.body;
    if (!blogId || !content) {
      return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
    }
    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return res.status(400).json({ error: 'معرّف المدونة غير صالح' });
    }
    const comment = new Comment({
      user: req.user._id,
      blog: blogId,
      content
    });
    await comment.save();
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ أثناء إضافة التعليق' });
  }
});

// جلب جميع التعليقات لمدونة معينة
router.get('/blog/:blogId', async (req, res) => {
  try {
    const { blogId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return res.status(400).json({ error: 'معرّف المدونة غير صالح' });
    }
    const comments = await Comment.find({ blog: blogId })
      .populate('user', 'name username')
      .populate('replies.user', 'name username')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ أثناء جلب التعليقات' });
  }
});

// جلب جميع تعليقات مستخدم معين
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'معرّف المستخدم غير صالح' });
    }
    // جلب التعليقات التي كتبها المستخدم أو الردود التي كتبها
    const comments = await Comment.find({
      $or: [
        { user: userId },
        { 'replies.user': userId }
      ]
    })
      .populate('blog', 'title')
      .populate('user', 'name username')
      .populate('replies.user', 'name username')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ أثناء جلب تعليقات المستخدم' });
  }
});

// إضافة أو إزالة إعجاب على تعليق
router.post('/:commentId/like', async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'يجب تسجيل الدخول لإضافة إعجاب' });
    }
    const { commentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ error: 'معرّف التعليق غير صالح' });
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'لم يتم العثور على التعليق' });
    }
    // تحقق من وجود مصفوفات likes/dislikes
    if (!Array.isArray(comment.likes)) comment.likes = [];
    if (!Array.isArray(comment.dislikes)) comment.dislikes = [];
    const userId = req.user._id;
    // إذا كان المستخدم أضاف "لا يعجبني"، أزلها أولاً من dislikes
    if (Array.isArray(comment.dislikes)) {
      const dislikeIndex = comment.dislikes.findIndex(id => id.toString() === userId.toString());
      if (dislikeIndex !== -1) {
        comment.dislikes.splice(dislikeIndex, 1);
      }
    }
    // منطق الإعجاب
    const likeIndex = comment.likes.findIndex(id => id.toString() === userId.toString());
    if (likeIndex === -1) {
      // إضافة إعجاب
      comment.likes.push(userId);
    } else {
      // إزالة إعجاب
      comment.likes.splice(likeIndex, 1);
    }
    await comment.save();
    // إرجاع التعليق مع معلومات المستخدم
    const populatedComment = await Comment.findById(commentId)
      .populate('user', 'name username')
      .populate('replies.user', 'name username');
    res.json(populatedComment);
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ أثناء معالجة الإعجاب' });
  }
});

// إضافة أو إزالة "لا إعجاب" على تعليق
router.post('/:commentId/dislike', async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'يجب تسجيل الدخول' });
    }
    const { commentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ error: 'معرّف التعليق غير صالح' });
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'لم يتم العثور على التعليق' });
    }
    // تحقق من وجود مصفوفات likes/dislikes
    if (!Array.isArray(comment.likes)) comment.likes = [];
    if (!Array.isArray(comment.dislikes)) comment.dislikes = [];
    const userId = req.user._id;
    // إذا كان المستخدم أضاف إعجاب، أزلها أولاً من likes
    if (Array.isArray(comment.likes)) {
      const likeIndex = comment.likes.findIndex(id => id.toString() === userId.toString());
      if (likeIndex !== -1) {
        comment.likes.splice(likeIndex, 1);
      }
    }
    // منطق "لا إعجاب"
    const dislikeIndex = comment.dislikes.findIndex(id => id.toString() === userId.toString());
    if (dislikeIndex === -1) {
      // إضافة لا إعجاب
      comment.dislikes.push(userId);
    } else {
      // إزالة لا إعجاب
      comment.dislikes.splice(dislikeIndex, 1);
    }
    await comment.save();
    // إرجاع التعليق مع معلومات المستخدم والتفاعل
    const populatedComment = await Comment.findById(commentId)
      .populate('user', 'name username')
      .populate('replies.user', 'name username');
    res.json(populatedComment);
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ أثناء معالجة لا إعجاب' });
  }
});

// الرد على تعليق
router.post('/:commentId/reply', async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'يجب تسجيل الدخول للرد' });
    }
    const { commentId } = req.params;
    const { content } = req.body;
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ error: 'معرّف التعليق غير صالح' });
    }
    if (!content) {
      return res.status(400).json({ error: 'محتوى الرد مطلوب' });
    }
    // الردود يمكن حفظها في حقل replies داخل التعليق
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'لم يتم العثور على التعليق' });
    }
    // تحقق من وجود replies
    if (!Array.isArray(comment.replies)) comment.replies = [];
    comment.replies.push({ user: req.user._id, content, createdAt: new Date() });
    await comment.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ أثناء إضافة الرد' });
  }
});

// تعديل تعليق
router.put('/:commentId', async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'يجب تسجيل الدخول للتعديل' });
    }
    const { commentId } = req.params;
    const { content } = req.body;
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ error: 'معرّف التعليق غير صالح' });
    }
    if (!content) {
      return res.status(400).json({ error: 'محتوى التعليق مطلوب' });
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'لم يتم العثور على التعليق' });
    }
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'غير مصرح لك بالتعديل' });
    }
    comment.content = content;
    await comment.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ أثناء تعديل التعليق' });
  }
});

// حذف تعليق
// تعديل رد داخل تعليق
// إضافة أو إزالة إعجاب على رد
router.post('/:commentId/reply/:replyId/like', async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'يجب تسجيل الدخول لإضافة إعجاب' });
    }
    const { commentId, replyId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(commentId) || !mongoose.Types.ObjectId.isValid(replyId)) {
      return res.status(400).json({ error: 'معرّف غير صالح' });
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'لم يتم العثور على التعليق' });
    }
    const reply = comment.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ error: 'لم يتم العثور على الرد' });
    }
    // تحقق من وجود مصفوفات likes/dislikes للرد
    if (!Array.isArray(reply.likes)) reply.likes = [];
    if (!Array.isArray(reply.dislikes)) reply.dislikes = [];
    const userId = req.user._id;
    // إذا كان المستخدم أضاف "لا يعجبني"، أزلها أولاً من dislikes
    if (Array.isArray(reply.dislikes)) {
      const dislikeIndex = reply.dislikes.findIndex(id => id.toString() === userId.toString());
      if (dislikeIndex !== -1) {
        reply.dislikes.splice(dislikeIndex, 1);
      }
    }
    // منطق الإعجاب
    const likeIndex = reply.likes.findIndex(id => id.toString() === userId.toString());
    if (likeIndex === -1) {
      // إضافة إعجاب
      reply.likes.push(userId);
    } else {
      // إزالة إعجاب
      reply.likes.splice(likeIndex, 1);
    }
    await comment.save();
    res.json({ likes: reply.likes, dislikes: reply.dislikes });
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ أثناء معالجة الإعجاب للرد' });
  }
});

// إضافة أو إزالة لا إعجاب على رد
router.post('/:commentId/reply/:replyId/dislike', async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'يجب تسجيل الدخول لإضافة لا يعجبني' });
    }
    const { commentId, replyId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(commentId) || !mongoose.Types.ObjectId.isValid(replyId)) {
      return res.status(400).json({ error: 'معرّف غير صالح' });
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'لم يتم العثور على التعليق' });
    }
    const reply = comment.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ error: 'لم يتم العثور على الرد' });
    }
    // تحقق من وجود مصفوفات likes/dislikes للرد
    if (!Array.isArray(reply.likes)) reply.likes = [];
    if (!Array.isArray(reply.dislikes)) reply.dislikes = [];
    const userId = req.user._id;
    // إذا كان المستخدم أضاف إعجاب، أزلها أولاً من likes
    if (Array.isArray(reply.likes)) {
      const likeIndex = reply.likes.findIndex(id => id.toString() === userId.toString());
      if (likeIndex !== -1) {
        reply.likes.splice(likeIndex, 1);
      }
    }
    // منطق لا إعجاب
    const dislikeIndex = reply.dislikes.findIndex(id => id.toString() === userId.toString());
    if (dislikeIndex === -1) {
      // إضافة لا إعجاب
      reply.dislikes.push(userId);
    } else {
      // إزالة لا إعجاب
      reply.dislikes.splice(dislikeIndex, 1);
    }
    await comment.save();
    res.json({ likes: reply.likes, dislikes: reply.dislikes });
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ أثناء معالجة لا إعجاب للرد' });
  }
});
router.put('/:commentId/reply/:replyId', async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'يجب تسجيل الدخول للتعديل' });
    }
    const { commentId, replyId } = req.params;
    const { content } = req.body;
    if (!mongoose.Types.ObjectId.isValid(commentId) || !mongoose.Types.ObjectId.isValid(replyId)) {
      return res.status(400).json({ error: 'معرّف غير صالح' });
    }
    if (!content) {
      return res.status(400).json({ error: 'محتوى الرد مطلوب' });
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'لم يتم العثور على التعليق' });
    }
    const reply = comment.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ error: 'لم يتم العثور على الرد' });
    }
    if (reply.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'غير مصرح لك بالتعديل' });
    }
    reply.content = content;
    await comment.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ أثناء تعديل الرد' });
  }
});
// حذف رد من تعليق
router.delete('/:commentId/reply/:replyId', async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'يجب تسجيل الدخول للحذف' });
    }
    const { commentId, replyId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(commentId) || !mongoose.Types.ObjectId.isValid(replyId)) {
      return res.status(400).json({ error: 'معرّف غير صالح' });
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'لم يتم العثور على التعليق' });
    }
    // ابحث عن الرد
    const reply = comment.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ error: 'لم يتم العثور على الرد' });
    }
    // تحقق من ملكية الرد
    if (reply.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'غير مصرح لك بحذف هذا الرد' });
    }
    // احذف الرد باستخدام الفلترة
    comment.replies = comment.replies.filter(r => r._id.toString() !== replyId);
    await comment.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ أثناء حذف الرد' });
  }
});
router.delete('/:commentId', async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'يجب تسجيل الدخول للحذف' });
    }
    const { commentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ error: 'معرّف التعليق غير صالح' });
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'لم يتم العثور على التعليق' });
    }
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'غير مصرح لك بالحذف' });
    }
    await comment.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ أثناء حذف التعليق' });
  }
});

// إضافة endpoint للرد على رد داخل replies
router.post('/:commentId/reply/:replyId/reply', async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'يجب تسجيل الدخول للرد' });
    }
    const { commentId, replyId } = req.params;
    const { content } = req.body;
    if (!mongoose.Types.ObjectId.isValid(commentId) || !mongoose.Types.ObjectId.isValid(replyId)) {
      return res.status(400).json({ error: 'معرّف غير صالح' });
    }
    if (!content) {
      return res.status(400).json({ error: 'محتوى الرد مطلوب' });
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'لم يتم العثور على التعليق' });
    }
    const reply = comment.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ error: 'لم يتم العثور على الرد' });
    }
    if (!Array.isArray(reply.replies)) reply.replies = [];
    reply.replies.push({ user: req.user._id, content, createdAt: new Date() });
    await comment.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ أثناء إضافة الرد على الرد' });
  }
});

// إضافة endpoint لجلب جميع الردود على رد معين
router.get('/:commentId/reply/:replyId/replies', async (req, res) => {
  try {
    const { commentId, replyId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(commentId) || !mongoose.Types.ObjectId.isValid(replyId)) {
      return res.status(400).json({ error: 'معرّف غير صالح' });
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'لم يتم العثور على التعليق' });
    }
    const reply = comment.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ error: 'لم يتم العثور على الرد' });
    }
    if (!Array.isArray(reply.replies)) reply.replies = [];
    res.json(reply.replies);
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ أثناء جلب ردود الرد' });
  }
});

// إضافة endpoint لتعديل وحذف رد على رد
router.put('/:commentId/reply/:replyId/reply/:subReplyId', async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'يجب تسجيل الدخول للتعديل' });
    }
    const { commentId, replyId, subReplyId } = req.params;
    const { content } = req.body;
    if (!mongoose.Types.ObjectId.isValid(commentId) || !mongoose.Types.ObjectId.isValid(replyId) || !mongoose.Types.ObjectId.isValid(subReplyId)) {
      return res.status(400).json({ error: 'معرّف غير صالح' });
    }
    if (!content) {
      return res.status(400).json({ error: 'محتوى الرد مطلوب' });
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'لم يتم العثور على التعليق' });
    }
    const reply = comment.replies.id(replyId);
    if (!reply || !Array.isArray(reply.replies)) {
      return res.status(404).json({ error: 'لم يتم العثور على الرد' });
    }
    const subReply = reply.replies.id(subReplyId);
    if (!subReply) {
      return res.status(404).json({ error: 'لم يتم العثور على الرد الفرعي' });
    }
    if (subReply.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'غير مصرح لك بالتعديل' });
    }
    subReply.content = content;
    await comment.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ أثناء تعديل الرد الفرعي' });
  }
});

router.delete('/:commentId/reply/:replyId/reply/:subReplyId', async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'يجب تسجيل الدخول للحذف' });
    }
    const { commentId, replyId, subReplyId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(commentId) || !mongoose.Types.ObjectId.isValid(replyId) || !mongoose.Types.ObjectId.isValid(subReplyId)) {
      return res.status(400).json({ error: 'معرّف غير صالح' });
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'لم يتم العثور على التعليق' });
    }
    const reply = comment.replies.id(replyId);
    if (!reply || !Array.isArray(reply.replies)) {
      return res.status(404).json({ error: 'لم يتم العثور على الرد' });
    }
    const subReply = reply.replies.id(subReplyId);
    if (!subReply) {
      return res.status(404).json({ error: 'لم يتم العثور على الرد الفرعي' });
    }
    if (subReply.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'غير مصرح لك بالحذف' });
    }
    reply.replies = reply.replies.filter(r => r._id.toString() !== subReplyId);
    await comment.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ أثناء حذف الرد الفرعي' });
  }
});

// إضافة endpoint لإعجاب ولا يعجبني للردود الفرعية
router.post('/:commentId/reply/:replyId/reply/:subReplyId/like', async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'يجب تسجيل الدخول لإضافة إعجاب' });
    }
    const { commentId, replyId, subReplyId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(commentId) || !mongoose.Types.ObjectId.isValid(replyId) || !mongoose.Types.ObjectId.isValid(subReplyId)) {
      return res.status(400).json({ error: 'معرّف غير صالح' });
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'لم يتم العثور على التعليق' });
    }
    const reply = comment.replies.id(replyId);
    if (!reply || !Array.isArray(reply.replies)) {
      return res.status(404).json({ error: 'لم يتم العثور على الرد' });
    }
    const subReply = reply.replies.id(subReplyId);
    if (!subReply) {
      return res.status(404).json({ error: 'لم يتم العثور على الرد الفرعي' });
    }
    if (!Array.isArray(subReply.likes)) subReply.likes = [];
    if (!Array.isArray(subReply.dislikes)) subReply.dislikes = [];
    const userId = req.user._id;
    // إذا كان المستخدم أضاف "لا يعجبني"، أزلها أولاً من dislikes
    if (Array.isArray(subReply.dislikes)) {
      const dislikeIndex = subReply.dislikes.findIndex(id => id.toString() === userId.toString());
      if (dislikeIndex !== -1) {
        subReply.dislikes.splice(dislikeIndex, 1);
      }
    }
    // منطق الإعجاب
    const likeIndex = subReply.likes.findIndex(id => id.toString() === userId.toString());
    if (likeIndex === -1) {
      // إضافة إعجاب
      subReply.likes.push(userId);
    } else {
      // إزالة إعجاب
      subReply.likes.splice(likeIndex, 1);
    }
    await comment.save();
    res.json({ likes: subReply.likes, dislikes: subReply.dislikes });
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ أثناء معالجة الإعجاب للرد الفرعي' });
  }
});

router.post('/:commentId/reply/:replyId/reply/:subReplyId/dislike', async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'يجب تسجيل الدخول لإضافة لا يعجبني' });
    }
    const { commentId, replyId, subReplyId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(commentId) || !mongoose.Types.ObjectId.isValid(replyId) || !mongoose.Types.ObjectId.isValid(subReplyId)) {
      return res.status(400).json({ error: 'معرّف غير صالح' });
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'لم يتم العثور على التعليق' });
    }
    const reply = comment.replies.id(replyId);
    if (!reply || !Array.isArray(reply.replies)) {
      return res.status(404).json({ error: 'لم يتم العثور على الرد' });
    }
    const subReply = reply.replies.id(subReplyId);
    if (!subReply) {
      return res.status(404).json({ error: 'لم يتم العثور على الرد الفرعي' });
    }
    if (!Array.isArray(subReply.likes)) subReply.likes = [];
    if (!Array.isArray(subReply.dislikes)) subReply.dislikes = [];
    const userId = req.user._id;
    // إذا كان المستخدم أضاف إعجاب، أزلها أولاً من likes
    if (Array.isArray(subReply.likes)) {
      const likeIndex = subReply.likes.findIndex(id => id.toString() === userId.toString());
      if (likeIndex !== -1) {
        subReply.likes.splice(likeIndex, 1);
      }
    }
    // منطق لا إعجاب
    const dislikeIndex = subReply.dislikes.findIndex(id => id.toString() === userId.toString());
    if (dislikeIndex === -1) {
      // إضافة لا إعجاب
      subReply.dislikes.push(userId);
    } else {
      // إزالة لا إعجاب
      subReply.dislikes.splice(dislikeIndex, 1);
    }
    await comment.save();
    res.json({ likes: subReply.likes, dislikes: subReply.dislikes });
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ أثناء معالجة لا إعجاب للرد الفرعي' });
  }
});

module.exports = router;
