const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Blog = require('../models/Blog'); // تأكد من المسار الصحيح

// إعدادات multer للصور
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'public/uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('يُسمح بتحميل الصور فقط!'), false);
    }
  }
});

// إعدادات multer للفيديوهات
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'public/uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});
const videoUpload = multer({
  storage: videoStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('يُسمح بتحميل الفيديو فقط!'), false);
    }
  }
});

// الحصول على جميع المدونات (مرتبة من الأحدث)
router.get('/', async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json(blogs);
  } catch (err) {
    console.error('Error loading blogs:', err);
    res.status(500).json({ error: 'حدث خطأ أثناء تحميل المدونات' });
  }
});

// زيادة عدد الزيارات عند فتح المقالة
router.post('/:blogId/visit', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.blogId);
    if (!blog) return res.status(404).json({ error: 'لم يتم العثور على المقالة' });
    blog.visits = (blog.visits || 0) + 1;
    await blog.save();
    res.json({ visits: blog.visits });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في زيادة عدد الزيارات' });
  }
});

// جلب اقتراحات المدونات (الأكثر زيارة ثم الأحدث)
router.get('/api/blogs/suggestions', async (req, res) => {
  const currentBlogId = req.query.id;

  if (!currentBlogId) {
    return res.status(400).json({ error: 'Missing blog id' });
  }

  try {
    // استبعاد التدوينة الحالية
    const allBlogs = await Blog.find({ _id: { $ne: currentBlogId } });

    // فرز حسب الأعلى زيارة ثم الأحدث
    const sorted = allBlogs
      .sort((a, b) => (b.visits || 0) - (a.visits || 0) || new Date(b.createdAt) - new Date(a.createdAt));


    // اختيار 3 عشوائيًا
    const shuffled = sorted.sort(() => 0.5 - Math.random());
    const suggestions = shuffled.slice(0, 3);

    res.json(suggestions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


// الحصول على مدونة واحدة
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'معرّف المدونة غير صالح' });
    }

    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'لم يتم العثور على المدونة' });
    }

    res.json(blog);
  } catch (err) {
    console.error('Error fetching blog:', err);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب المدونة' });
  }
});

// إنشاء مدونة جديدة مع صورة
router.post('/', upload.single('featuredImage'), async (req, res) => {
  try {
    const { title, content, tags, excerpt, status } = req.body;

    if (!title || !content) {
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: 'العنوان والمحتوى مطلوبان' });
    }

    // معالجة الوسوم إذا كانت موجودة
    let tagsArr = [];
    if (tags) {
      tagsArr = typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags;
    }

    // توحيد مسار الصورة
    let featuredImage = null;
    if (req.file) {
      featuredImage = `/uploads/${path.basename(req.file.path)}`;
    }

    const newBlog = new Blog({
      title,
      content,
      tags: tagsArr,
      excerpt: excerpt || '',
      status: status || 'published',
      featuredImage
    });

    await newBlog.save();
    const blogObj = newBlog.toObject();
    res.status(201).json(blogObj);
  } catch (err) {
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error creating blog:', err);
    res.status(500).json({ error: 'فشل في إنشاء المدونة' });
  }
});

// تحديث مدونة
router.put('/:id', upload.single('featuredImage'), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      if (req.file && req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'معرّف المدونة غير صالح' });
    }

    const { title, content, tags, excerpt, status } = req.body;
    const updates = { title, content };

    // معالجة الوسوم إذا كانت موجودة
    if (tags) {
      updates.tags = typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags;
    }
    if (excerpt) updates.excerpt = excerpt;
    if (status) updates.status = status;

    if (req.file) {
      updates.featuredImage = req.file.path.replace(/\\/g, "/");
      // حذف الصورة القديمة إذا تم تحديثها
      const oldBlog = await Blog.findById(req.params.id);
      if (oldBlog && oldBlog.featuredImage && fs.existsSync(oldBlog.featuredImage)) {
        fs.unlinkSync(oldBlog.featuredImage);
      }
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    if (!updatedBlog) {
      if (req.file && req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'لم يتم العثور على المدونة' });
    }

    // أعد المسار النسبي للصورة للواجهة الأمامية
    const blogObj = updatedBlog.toObject();
    if (blogObj.featuredImage) {
      blogObj.featuredImage = blogObj.featuredImage.replace(/^.*private[\\/]/, '/private/');
    }

    res.json(blogObj);
  } catch (err) {
    if (req.file && req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('Error updating blog:', err);
    res.status(500).json({ error: 'فشل في تحديث المدونة' });
  }
});

// حذف مدونة
router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'معرّف المدونة غير صالح' });
    }

    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'لم يتم العثور على المدونة' });
    }

    // حذف الصورة المرتبطة إذا وجدت
    if (blog.featuredImage && fs.existsSync(blog.featuredImage)) {
      fs.unlinkSync(blog.featuredImage);
    }

    res.json({ message: 'تم حذف المدونة بنجاح' });
  } catch (err) {
    console.error('Error deleting blog:', err);
    res.status(500).json({ error: 'فشل في حذف المدونة' });
  }
});

// رفع صورة من محرر Quill أو أي محرر نصوص
router.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'لم يتم رفع أي صورة' });
    }
    // توحيد المسار دائماً
    const imageUrl = `/uploads/${path.basename(req.file.path)}`;
    res.status(201).json({ url: imageUrl });
  } catch (err) {
    console.error('Error uploading image:', err);
    res.status(500).json({ error: 'فشل في رفع الصورة' });
  }
});

// رفع فيديو من المحرر
router.post('/upload-video', videoUpload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'لم يتم رفع أي فيديو' });
    }
    // إعادة المسار النسبي للرابط
    const videoUrl = `/uploads/${path.basename(req.file.path)}`;
    res.status(201).json({ url: videoUrl });
  } catch (err) {
    console.error('Error uploading video:', err);
    res.status(500).json({ error: 'فشل في رفع الفيديو' });
  }
});

module.exports = router;