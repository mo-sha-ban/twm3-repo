const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// إعداد التخزين للملفات
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const base = 'public/uploads';
        let uploadPath = path.join(base, 'images');
        if (file.mimetype && file.mimetype.startsWith('video/')) {
            uploadPath = path.join(base, 'videos');
        }
        const fullPath = path.join(__dirname, '..', uploadPath);
        try { fs.mkdirSync(fullPath, { recursive: true }); } catch (_) {}
        cb(null, fullPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('نوع الملف غير مدعوم. يرجى رفع صور أو فيديوهات فقط.'), false);
        }
    }
});

// جلب جميع المنتجات
router.get('/', productController.getAllProducts);

// جلب تقييمات المنتج
router.get('/:id/reviews', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product.reviews || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// جلب تعليقات المنتج
router.get('/:id/comments', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product.comments || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// جلب منتج واحد
router.get('/:id', productController.getProduct);

// جلب المنتجات المميزة
router.get('/featured', productController.getFeaturedProducts);

// جلب المنتجات حسب الفئة
router.get('/category/:category', productController.getProductsByCategory);

// إضافة منتج جديد (للمديرين فقط)
router.post('/', auth, upload.any(), productController.createProduct);

// تحديث منتج (للمديرين فقط)
router.put('/:id', auth, upload.any(), productController.updateProduct);

// حذف منتج (للمديرين فقط)
router.delete('/:id', auth, productController.deleteProduct);

// رفع ملفات المنتج (صور/فيديو)
router.post('/upload', auth, upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'لم يتم رفع أي ملف' });
        }

        const relPath = path.relative('public', req.file.path).replace(/\\/g, '/');
        const fileUrl = `/${relPath}`;
        res.json({
            message: 'تم رفع الملف بنجاح',
            fileUrl,
            fileType: req.file.mimetype.startsWith('video/') ? 'video' : 'image'
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء رفع الملف' });
    }
});

// رفع ملفات متعددة للمنتج
router.post('/upload-multiple', auth, upload.array('files', 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'لم يتم رفع أي ملفات' });
        }

        const fileUrls = req.files.map(file => `/${path.relative('public', file.path).replace(/\\/g, '/')}`);
        res.json({
            message: 'تم رفع الملفات بنجاح',
            fileUrls,
            files: req.files.map(file => ({
                url: `/${path.relative('public', file.path).replace(/\\/g, '/')}`,
                type: file.mimetype.startsWith('video/') ? 'video' : 'image',
                originalName: file.originalname
            }))
        });
    } catch (error) {
        console.error('Multiple upload error:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء رفع الملفات' });
    }
});


// إضافة تقييم للمنتج
router.post('/:id/reviews', async (req, res) => {
  try {
    const { user, rating, comment } = req.body;
    if (!user || !rating || !comment) {
      return res.status(400).json({ error: 'user, rating, and comment are required' });
    }
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const newReview = { user, rating: Number(rating), comment, createdAt: new Date() };
    if (!product.reviews) product.reviews = [];
    product.reviews.push(newReview);
    await product.save();

    res.status(201).json(newReview);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add review' });
  }
});

// إضافة تعليق للمنتج
router.post('/:id/comments', async (req, res) => {
  try {
    const { user, text } = req.body;
    if (!user || !text) {
      return res.status(400).json({ error: 'user and text are required' });
    }
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const newComment = { user, text, createdAt: new Date() };
    if (!product.comments) product.comments = [];
    product.comments.push(newComment);
    await product.save();

    res.status(201).json(newComment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

module.exports = router;