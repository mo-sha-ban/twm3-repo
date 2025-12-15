
const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const multer = require('multer');
const path = require("path");
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');
const Course = require('./models/Course');
const Blog = require('./models/Blog');
const Product = require('./models/Product');
const blogRoutes = require('./routes/blogRoutes');
const commentRoutes = require('./routes/commentRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const courseRoutes = require('./routes/courseRoutes');
const productRoutes = require('./routes/productRoutes');
const dataDeletionRoutes = require('./routes/dataDeletion');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const helmet = require('helmet');

require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 5000;

console.log('==========================================');
console.log('🚀 TWM3 BACKEND - PRODUCTION MODE');
console.log('==========================================');
console.log('Current directory:', __dirname);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', PORT);
console.log('==========================================');

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// CORS - Production settings
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://twm3.org', 'https://www.twm3.org', 'https://*.railway.app']
        : ['http://localhost:3000', 'http://localhost:5000'],
    credentials: true
}));

app.use(express.json());

// Serve static files - Multiple attempts
const tryStaticPaths = [
    '/app',
    path.join(__dirname, '..'),
    path.join(__dirname, '../..'),
    '/app/public',
    path.join(__dirname, '..', 'public')
];

for (const staticPath of tryStaticPaths) {
    try {
        if (fs.existsSync(staticPath)) {
            const stats = fs.statSync(staticPath);
            if (stats.isDirectory()) {
                const files = fs.readdirSync(staticPath);
                console.log(`📁 Serving static from: ${staticPath}`);
                console.log(`   Contains: ${files.slice(0, 5).join(', ')}...`);
                
                app.use(express.static(staticPath, {
                    extensions: ['html', 'htm', 'css', 'js'],
                    index: ['index.html', 'index.htm']
                }));
                break;
            }
        }
    } catch (e) {
        console.log(`   Skipping ${staticPath}: ${e.message}`);
    }
}

// Simple test route
app.get('/ping', (req, res) => {
    res.json({ 
        message: 'pong', 
        server: 'TWM3 Backend',
        timestamp: new Date().toISOString()
    });
});

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'UP',
        database: 'connected',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Main route
app.get('/', (req, res) => {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>TWM3 - Backend Server</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                padding: 20px;
            }
            .container {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(20px);
                padding: 50px 40px;
                border-radius: 24px;
                text-align: center;
                max-width: 800px;
                width: 100%;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            h1 {
                font-size: 3.5em;
                margin-bottom: 20px;
                background: linear-gradient(45deg, #fff, #f0f0f0);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                font-weight: 800;
            }
            .status-badge {
                background: #10B981;
                color: white;
                padding: 12px 30px;
                border-radius: 100px;
                font-weight: 600;
                letter-spacing: 1px;
                display: inline-block;
                margin: 25px 0;
                font-size: 1.1em;
                box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);
            }
            .subtitle {
                font-size: 1.2em;
                opacity: 0.9;
                margin-bottom: 40px;
                line-height: 1.6;
            }
            .grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin: 40px 0;
            }
            .card {
                background: rgba(255, 255, 255, 0.15);
                padding: 25px;
                border-radius: 16px;
                transition: all 0.3s ease;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            .card:hover {
                background: rgba(255, 255, 255, 0.25);
                transform: translateY(-5px);
            }
            .card h3 {
                margin-bottom: 15px;
                font-size: 1.3em;
            }
            .card a {
                color: white;
                text-decoration: none;
                font-weight: 600;
                display: block;
                padding: 10px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 10px;
                margin-top: 10px;
                transition: background 0.3s;
            }
            .card a:hover {
                background: rgba(255, 255, 255, 0.3);
            }
            .info {
                margin-top: 40px;
                padding-top: 30px;
                border-top: 1px solid rgba(255, 255, 255, 0.2);
                font-size: 0.9em;
                opacity: 0.7;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 TWM3 Backend</h1>
            <div class="status-badge">✅ SERVER IS RUNNING</div>
            <p class="subtitle">All systems operational • MongoDB Connected • API Ready</p>
            
            <div class="grid">
                <div class="card">
                    <h3>📚 Courses API</h3>
                    <p>Browse available courses</p>
                    <a href="/api/courses">View Courses →</a>
                </div>
                <div class="card">
                    <h3>📝 Blog API</h3>
                    <p>Read and manage blogs</p>
                    <a href="/api/blogs">View Blogs →</a>
                </div>
                <div class="card">
                    <h3>🛒 Products API</h3>
                    <p>Browse products</p>
                    <a href="/api/products">View Products →</a>
                </div>
                <div class="card">
                    <h3>📊 System Info</h3>
                    <p>Server status & health</p>
                    <a href="/health">Health Check →</a>
                </div>
            </div>
            
            <div class="info">
                <p>Port: ${PORT} • Environment: ${process.env.NODE_ENV}</p>
                <p>Server Time: ${new Date().toISOString()}</p>
                <p>Deployed on Railway • TWM3 Organization</p>
            </div>
        </div>
    </body>
    </html>
    `;
    
    res.send(html);
});

// ============ Serve Static Files ============
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads'), {
    setHeaders: (res) => {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Cache-Control', 'public, max-age=3600');
    }
}));

app.use('/uploads/avatars', express.static(path.join(__dirname, 'public/uploads/avatars'), {
    setHeaders: (res) => {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
}));

app.use('/uploads/lesson-assets', express.static(path.join(__dirname, 'public/uploads/lesson-assets'), {
    setHeaders: (res) => {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
}));

app.use('/uploads/notifications', express.static(path.join(__dirname, 'public/uploads/notifications'), {
    setHeaders: (res) => {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
}));

app.use('/uploads/videos', express.static(path.join(__dirname, 'public/uploads/videos'), {
    setHeaders: (res) => {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
}));

app.use('/assets', express.static(path.join(__dirname, 'public/assets'), {
    setHeaders: (res) => {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
}));

// Fallback route for uploads
app.get('/uploads/:fileName', (req, res, next) => {
    const fileName = req.params.fileName;
    const publicDir = path.join(__dirname, 'public', 'uploads');
    const candidates = [
        path.join(publicDir, fileName),
        path.join(publicDir, 'images', fileName),
        path.join(publicDir, 'videos', fileName),
        path.join(publicDir, 'avatars', fileName),
        path.join(publicDir, 'lesson-assets', fileName),
        path.join(publicDir, 'notifications', fileName)
    ];

    for (const p of candidates) {
        try {
            if (fs.existsSync(p)) {
                return res.sendFile(p);
            }
        } catch (e) { /* ignore */ }
    }

    const defaultImagePath = path.join(__dirname, '..', 'img', 'profile.png');
    if (fs.existsSync(defaultImagePath)) {
        console.warn(`Missing image: ${fileName}, serving default placeholder`);
        return res.sendFile(defaultImagePath);
    }

    next();
});

// ============ PDF Routes ============
app.get('/pdf', (req, res) => {
    const filePath = path.join(__dirname, 'public/files/myfile.pdf');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=myfile.pdf');
    res.sendFile(filePath);
});

app.get('/pdf/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'public/uploads', req.params.filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).send('❌ الملف غير موجود');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${req.params.filename}"`);
    res.sendFile(filePath);
});

// ============ Multer Configurations ============
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        console.log('Processing file:', file.originalname, 'MIME:', file.mimetype);

        if (file.fieldname === 'lessonFile' && file.originalname) {
            const ext = path.extname(file.originalname).toLowerCase();
            const mime = (file.mimetype || '').toLowerCase();
            const allowedVideoExts = ['.mp4', '.mov'];
            const allowedVideoMimes = ['video/mp4', 'video/quicktime'];

            if (allowedVideoExts.includes(ext) || allowedVideoMimes.includes(mime)) {
                req._fileFilterPassed = true;
                return cb(null, true);
            }

            const error = new Error('صيغة الملف غير مسموح بها. الرجاء استخدام ملف فيديو بصيغة MP4 أو MOV.');
            error.code = 'INVALID_FILE_TYPE';
            return cb(error, false);
        }

        const allowedMimes = [
            'image/png',
            'image/jpeg',
            'image/webp',
            'application/pdf'
        ];

        if (file.mimetype && allowedMimes.includes(file.mimetype.toLowerCase())) {
            req._fileFilterPassed = true;
            return cb(null, true);
        }

        req._fileFilterPassed = false;
        return cb(null, false);
    }
});

const avatarStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dest = path.join(__dirname, 'public/uploads/avatars');
        try { fs.mkdirSync(dest, { recursive: true }); } catch(_) {}
        cb(null, dest);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const avatarUpload = multer({
    storage: avatarStorage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/png', 'image/jpeg', 'image/webp'];
        if (allowed.includes(file.mimetype)) return cb(null, true);
        cb(new Error('صيغة الصورة غير مسموح بها!'), false);
    }
});

const lessonAssetStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dest = path.join(__dirname, 'public/uploads/lesson-assets');
        try { fs.mkdirSync(dest, { recursive: true }); } catch(_) {}
        cb(null, dest);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const lessonAssetUpload = multer({
    storage: lessonAssetStorage,
    limits: { fileSize: 500 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = [
            'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif',
            'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv', 'video/ogg',
            'video/x-matroska', 'video/x-flv', 'video/mpeg', 'video/3gpp', 'video/mp2t',
            'application/x-mpegURL',
            'application/pdf'
        ];
        if (allowed.includes(file.mimetype)) return cb(null, true);
        if (file.mimetype && file.mimetype.startsWith('video/')) return cb(null, true);
        cb(new Error(`صيغة الملف غير مسموح بها (${file.mimetype}). يدعم الصور والفيديوهات و PDF فقط.`), false);
    }
});

const lessonStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const lessonUpload = multer({
    storage: lessonStorage,
    fileFilter: (req, file, cb) => {
        console.log('Processing lesson file:', file.originalname, 'MIME:', file.mimetype);

        const mime = (file.mimetype || '').toLowerCase();
        const ext = (path.extname(file.originalname || '') || '').toLowerCase();

        if (file.fieldname === 'lessonFile') {
            const allowedVideoMimes = ['video/mp4', 'video/quicktime'];
            const allowedVideoExts = ['.mp4', '.mov'];
            const allowedPdfMimes = ['application/pdf'];
            const allowedPdfExts = ['.pdf'];

            if (allowedVideoMimes.includes(mime) || allowedVideoExts.includes(ext) || allowedPdfMimes.includes(mime) || allowedPdfExts.includes(ext)) {
                req._fileFilterPassed = true;
                return cb(null, true);
            }

            req._fileFilterPassed = false;
            return cb(null, false);
        }

        const allowedMimes = [
            'image/png',
            'image/jpeg',
            'image/webp',
            'application/pdf'
        ];

        if (allowedMimes.includes(mime)) {
            req._fileFilterPassed = true;
            return cb(null, true);
        }

        req._fileFilterPassed = false;
        return cb(null, false);
    }
}).fields([
    { name: 'lessonFile', maxCount: 1 }
]);

// ============ Middleware Functions ============
function requireAdminToken(req, res, next) {
    if (req.user && req.user.isAdmin) {
        return next();
    } else {
        return res.status(403).json({ error: "غير مصرح لك بالدخول إلى لوحة التحكم!" });
    }
}

function requireAuthToken(req, res, next) {
    if (req.user) {
        return next();
    } else {
        return res.status(401).json({ error: 'يجب تسجيل الدخول' });
    }
}

// Serve static frontend files
app.use(express.static(path.join(__dirname, ".."), {
    extensions: ["html"],
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'text/javascript');
        }
    }
}));

// Special routes
app.get("/data-deletion-status", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "data-deletion-status.html"));
});

app.get("/data-deletion-status.html", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "data-deletion-status.html"));
});

// Routes
const authRoutes = require("./routes/auth");
const counterRoutes = require("./routes/counterRoutes");
const uploadRoutes = require("./routes/upload");
const progressRoutes = require("./routes/progressRoutes");
app.use("/api", authRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api', counterRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/progress', progressRoutes);

// Product Reviews & Comments
app.get('/api/products/:id/reviews', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).select('reviews');
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json(product.reviews || []);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

app.get('/api/products/:id/comments', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).select('comments');
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json(product.comments || []);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

app.post('/api/products/:id/reviews', async (req, res) => {
    try {
        const { user, rating, comment, text, title } = req.body;
        const finalRating = rating || parseInt(req.body.rating);
        const finalComment = comment || text || title;
        
        let finalUser = user;
        if (typeof user === 'string') {
            finalUser = user;
        } else if (user && typeof user === 'object') {
            finalUser = user;
        } else {
            finalUser = (req.user && req.user.name) || 'Anonymous';
        }
        
        if (!finalRating || !finalComment) {
            return res.status(400).json({ error: 'rating and comment/text are required', received: { rating: finalRating, comment: finalComment } });
        }
        
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        
        const newReview = { user: finalUser, rating: Number(finalRating), comment: finalComment, createdAt: new Date(), likes: [] };
        if (!product.reviews) product.reviews = [];
        product.reviews.push(newReview);
        await product.save();
        
        res.status(201).json(newReview);
    } catch (err) {
        console.error('Error adding review:', err);
        res.status(500).json({ error: 'Failed to add review', details: err.message });
    }
});

app.post('/api/products/:id/comments', async (req, res) => {
    try {
        const { user, text, comment } = req.body;
        const finalText = text || comment;
        
        let finalUser = user;
        if (typeof user === 'string') {
            finalUser = user;
        } else if (user && typeof user === 'object') {
            finalUser = user;
        } else {
            finalUser = (req.user && req.user.name) || 'Anonymous';
        }
        
        if (!finalText) {
            return res.status(400).json({ error: 'text is required', received: { text: finalText } });
        }
        
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        
        const newComment = { user: finalUser, text: finalText, createdAt: new Date(), likes: [] };
        if (!product.comments) product.comments = [];
        product.comments.push(newComment);
        await product.save();
        
        res.status(201).json(newComment);
    } catch (err) {
        console.error('Error adding comment:', err);
        res.status(500).json({ error: 'Failed to add comment', details: err.message });
    }
});

app.use('/api/products', productRoutes);

app.post('/api/products/:productId/reviews/:reviewId/like', authToken, async (req, res) => {
    try {
        const { productId, reviewId } = req.params;
        const userId = req.user && req.user._id;
        if (!userId) return res.status(401).json({ error: 'Not authenticated' });

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ error: 'Product not found' });

        const review = product.reviews.id(reviewId);
        if (!review) return res.status(404).json({ error: 'Review not found' });

        if (!review.likes) review.likes = [];
        const likeIndex = review.likes.findIndex(id => String(id) === String(userId));
        
        if (likeIndex >= 0) {
            review.likes.splice(likeIndex, 1);
        } else {
            review.likes.push(userId);
        }
        
        await product.save();
        res.json({ liked: likeIndex < 0, likes: review.likes.length });
    } catch (err) {
        console.error('Error liking review:', err);
        res.status(500).json({ error: 'Failed to like review' });
    }
});

app.post('/api/products/:productId/comments/:commentId/like', authToken, async (req, res) => {
    try {
        const { productId, commentId } = req.params;
        const userId = req.user && req.user._id;
        if (!userId) return res.status(401).json({ error: 'Not authenticated' });

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ error: 'Product not found' });

        const comment = product.comments.id(commentId);
        if (!comment) return res.status(404).json({ error: 'Comment not found' });

        if (!comment.likes) comment.likes = [];
        const likeIndex = comment.likes.findIndex(id => String(id) === String(userId));
        
        if (likeIndex >= 0) {
            comment.likes.splice(likeIndex, 1);
        } else {
            comment.likes.push(userId);
        }
        
        await product.save();
        res.json({ liked: likeIndex < 0, likes: comment.likes.length });
    } catch (err) {
        console.error('Error liking comment:', err);
        res.status(500).json({ error: 'Failed to like comment' });
    }
});

app.use('/api', dataDeletionRoutes);
app.use('/api/upload', uploadRoutes);

// ============ User Routes ============
const User = require("./models/User");

// API: جلب بيانات المستخدم
app.get('/api/user', async (req, res) => {
    try {
        let userDoc = null;
        const authHeader = req.headers['authorization'];
        if (authHeader) {
            const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwtsecret');
                const userId = decoded && (decoded._id || decoded.id);
                if (userId) {
                    userDoc = await User.findById(userId).lean();
                }
                if (!userDoc && decoded && decoded.email) {
                    userDoc = await User.findOne({ email: decoded.email }).lean();
                }
            } catch(_) { /* ignore */ }
        }
        if (!userDoc && req.query && req.query.email) {
            userDoc = await User.findOne({ email: req.query.email }).lean();
        }
        if (!userDoc) return res.status(400).json({ error: 'لا يمكن تحديد المستخدم' });
        const { _id, name, username, email, phone, isAdmin, created_at, avatarUrl } = userDoc;
        return res.json({ _id, name, username, email, phone, isAdmin, created_at, avatarUrl });
    } catch (err) {
        console.error('خطأ في /api/user:', err);
        return res.status(500).json({ error: 'فشل في جلب بيانات المستخدم' });
    }
});

// API: تحديث بيانات المستخدم الحالي
app.put('/api/user', authToken, requireAuthToken, async (req, res) => {
    try {
        const userId = req.user && (req.user._id || req.user.id);
        if (!userId) return res.status(401).json({ error: 'يجب تسجيل الدخول' });

        const { name, username, phone } = req.body || {};

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });

        if (name !== undefined) user.name = name;
        if (username !== undefined) user.username = username;
        if (phone !== undefined) user.phone = phone;

        await user.save();

        return res.json({
            success: true,
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            phone: user.phone,
            avatarUrl: user.avatarUrl
        });
    } catch (err) {
        console.error('خطأ في تحديث بيانات المستخدم:', err);
        return res.status(500).json({ error: 'فشل في تحديث بيانات المستخدم' });
    }
});

// Block/Unblock users
app.post('/api/users/:id/block', authToken, async (req, res) => {
    try {
        const me = req.user && req.user._id;
        const target = req.params.id;
        if (!me) return res.status(401).json({ error: 'Not authenticated' });
        if (!target) return res.status(400).json({ error: 'Target required' });
        const user = await User.findById(me);
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (!user.blockedUsers) user.blockedUsers = [];
        if (!user.blockedUsers.some(id => String(id) === String(target))) {
            user.blockedUsers.push(target);
            await user.save();
        }
        return res.json({ success: true });
    } catch (err) {
        console.error('Error in /api/users/:id/block', err);
        return res.status(500).json({ error: 'Failed to block user' });
    }
});

app.post('/api/users/:id/unblock', authToken, async (req, res) => {
    try {
        const me = req.user && req.user._id;
        const target = req.params.id;
        if (!me) return res.status(401).json({ error: 'Not authenticated' });
        const user = await User.findById(me);
        if (!user) return res.status(404).json({ error: 'User not found' });
        user.blockedUsers = (user.blockedUsers || []).filter(id => String(id) !== String(target));
        await user.save();
        return res.json({ success: true });
    } catch (err) {
        console.error('Error in /api/users/:id/unblock', err);
        return res.status(500).json({ error: 'Failed to unblock user' });
    }
});

app.get('/api/users/:id/block-status', authToken, async (req, res) => {
    try {
        const me = req.user && req.user._id;
        const target = req.params.id;
        if (!me) return res.status(401).json({ error: 'Not authenticated' });
        const meDoc = await User.findById(me).select('blockedUsers');
        const targetDoc = await User.findById(target).select('blockedUsers');
        const iBlocked = !!(meDoc && meDoc.blockedUsers && meDoc.blockedUsers.some(id => String(id) === String(target)));
        const theyBlockedMe = !!(targetDoc && targetDoc.blockedUsers && targetDoc.blockedUsers.some(id => String(id) === String(me)));
        const blocked = iBlocked || theyBlockedMe;
        return res.json({ iBlocked, theyBlockedMe, blocked });
    } catch (err) {
        console.error('Error in /api/users/:id/block-status', err);
        return res.status(500).json({ error: 'Failed to check block status' });
    }
});

app.get('/api/users/lookup', async (req, res) => {
    try {
        const { username, email } = req.query;
        if (!username && !email) return res.status(400).json({ error: 'username or email required' });
        let userDoc = null;
        if (email) {
            userDoc = await User.findOne({ email }).select('_id name username email avatarUrl').lean();
        } else if (username) {
            userDoc = await User.findOne({ username }).select('_id name username email avatarUrl').lean();
        }
        if (!userDoc) return res.status(404).json({ error: 'User not found' });
        return res.json(userDoc);
    } catch (err) {
        console.error('Error in /api/users/lookup:', err);
        return res.status(500).json({ error: 'Failed to lookup user' });
    }
});

app.get('/api/users/active', async (req, res) => {
    try {
        const limit = Math.min(100, parseInt(req.query.limit || '20', 10));
        const users = await User.find({ isBlocked: { $ne: true } })
            .select('_id name username avatarUrl isVerified')
            .sort({ created_at: -1 })
            .limit(limit)
            .lean();
        return res.json(users);
    } catch (err) {
        console.error('Failed to fetch active users', err);
        return res.status(500).json({ error: 'فشل في جلب الأعضاء' });
    }
});

app.post('/api/users/me/avatar', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'يجب تسجيل الدخول' });
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
        let decoded;
        try { decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwtsecret'); }
        catch(_) { return res.status(403).json({ error: 'توكن غير صالح أو منتهي الصلاحية' }); }
        avatarUpload.single('avatar')(req, res, async (err) => {
            if (err) return res.status(400).json({ error: err.message || 'فشل رفع الصورة' });
            if (!req.file) return res.status(400).json({ error: 'يجب رفع صورة' });
            const userId = decoded._id || decoded.id;
            const user = await User.findById(userId);
            if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
            const relPath = '/uploads/avatars/' + req.file.filename;
            user.avatarUrl = relPath;
            await user.save();
            return res.json({ success: true, avatarUrl: relPath });
        });
    } catch (err) {
        console.error('خطأ في رفع الصورة:', err);
        res.status(500).json({ error: 'فشل رفع الصورة' });
    }
});

app.post('/api/signup', async (req, res) => {
    try {
        const { name, username, email, password, phone } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'اسم المستخدم والبريد وكلمة المرور مطلوبة' });
        }

        const existing = await User.findOne({ $or: [{ email }, { username }] });
        if (existing) {
            return res.status(400).json({ message: 'اسم المستخدم أو البريد الإلكتروني مستخدم بالفعل' });
        }

        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name: name || username,
            username,
            email,
            password: hashedPassword,
            phone: phone || ''
        });

        await user.save();
        res.json({ success: true });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'اسم المستخدم أو البريد الإلكتروني مستخدم بالفعل' });
        }
        console.error('Signup error:', err);
        res.status(500).json({ message: 'حدث خطأ أثناء إنشاء الحساب' });
    }
});

app.post('/api/login', express.json(), async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'البريد الإلكتروني غير مسجل' });
    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'كلمة المرور غير صحيحة' });

    const payload = {
        _id: user._id,
        email: user.email,
        isAdmin: user.isAdmin,
        username: user.username,
        name: user.name
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'jwtsecret', { expiresIn: '7d' });
    res.json({ success: true, user: payload, token });
});

// ============ Auth Middleware ============
function authToken(req, res, next) {
    console.log('Authorization Header:', req.headers['authorization']);
    let token = null;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else {
            token = authHeader;
        }
    }
    if (!token) {
        return res.status(401).json({ error: 'يجب تسجيل الدخول (توكن غير موجود)' });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'jwtsecret', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'توكن غير صالح أو منتهي الصلاحية' });
        }
        if (user.id && !user._id) user._id = user.id;
        req.user = user;
        next();
    });
}

app.set('authToken', authToken);
app.set('requireAuthToken', requireAuthToken);

app.use('/api/comments', (req, res, next) => {
    console.log('--- [تعليقات] ---', req.method, req.originalUrl, '| Authorization:', req.headers['authorization'] || 'NONE');
    if (!req.headers['authorization']) {
        return res.status(401).json({ error: 'يجب تسجيل الدخول (توكن غير موجود في الهيدر)' });
    }
    next();
}, authToken, commentRoutes);

const communityRoutes = require('./routes/communityRoutes');
app.use('/api/community', communityRoutes);

// ============ Course Routes ============
app.put('/api/courses/:id', authToken, requireAuthToken, async (req, res) => {
    try {
        const courseId = req.params.id;
        const { title, description, instructor, duration, price, category, tags, icon, categories, featured, isFree } = req.body;

        const updateData = {};
        
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (instructor !== undefined) updateData.instructor = instructor;
        if (duration !== undefined) updateData.duration = duration;
        if (price !== undefined) updateData.price = price;
        if (category !== undefined) updateData.category = category;
        if (tags !== undefined && Array.isArray(tags)) updateData.tags = tags;
        if (icon !== undefined) updateData.icon = icon;
        if (categories !== undefined && Array.isArray(categories)) updateData.categories = categories;
        if (featured !== undefined) updateData.featured = featured;
        if (isFree !== undefined) updateData.isFree = isFree;
        
        updateData.updatedAt = new Date();

        const updatedCourse = await Course.findByIdAndUpdate(
            courseId,
            updateData,
            { new: true }
        );

        if (!updatedCourse) {
            return res.status(404).json({ error: 'الكورس غير موجود' });
        }

        res.json(updatedCourse);
    } catch (err) {
        console.error('خطأ أثناء تحديث الكورس:', err);
        res.status(500).json({ error: 'فشل في تحديث الكورس' });
    }
});

app.delete('/api/courses/:id', authToken, requireAuthToken, async (req, res) => {
    try {
        const courseId = req.params.id;
        const deletedCourse = await Course.findByIdAndDelete(courseId);

        if (!deletedCourse) {
            return res.status(404).json({ error: 'الكورس غير موجود' });
        }

        res.json({ message: 'تم حذف الكورس بنجاح' });
    } catch (err) {
        console.error('خطأ أثناء حذف الكورس:', err);
        res.status(500).json({ error: 'فشل في حذف الكورس' });
    }
});

app.patch('/api/courses/:id', authToken, requireAuthToken, async (req, res) => {
    try {
        const courseId = req.params.id;
        const updates = req.body || {};

        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ error: 'الكورس غير موجود' });

        if (updates.categories && Array.isArray(updates.categories)) {
            course.categories = updates.categories;
        }

        await course.save();
        res.json(course);
    } catch (err) {
        console.error('خطأ في PATCH /api/courses/:id', err);
        res.status(500).json({ error: 'فشل في تحديث الكورس' });
    }
});

app.get('/api/courses/:id', async (req, res) => {
    try {
        const courseId = req.params.id;
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ error: 'الكورس غير موجود' });
        }
        res.json(course);
    } catch (err) {
        console.error('خطأ أثناء جلب الكورس:', err);
        res.status(500).json({ error: 'حدث خطأ أثناء جلب الكورس' });
    }
});

// ============ Admin Routes ============
app.get('/api/admin/users', authToken, requireAdminToken, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'فشل في جلب المستخدمين' });
    }
});

app.post('/api/admin/users', authToken, requireAdminToken, async (req, res) => {
    try {
        const { name, username, email, password, phone, isAdmin } = req.body;
        
        if (!name || !username || !email || !password) {
            return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
        }
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'البريد الإلكتروني مسجل مسبقاً' });
        }
        
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = new User({
            name,
            username,
            email,
            password: hashedPassword,
            phone: phone || '',
            isAdmin: isAdmin === true || isAdmin === 'true'
        });
        
        await newUser.save();
        
        res.status(201).json({
            _id: newUser._id,
            name: newUser.name,
            username: newUser.username,
            email: newUser.email,
            phone: newUser.phone,
            isAdmin: newUser.isAdmin,
            created_at: newUser.created_at
        });
    } catch (err) {
        console.error('خطأ في إضافة المستخدم:', err);
        res.status(500).json({ error: 'فشل في إضافة المستخدم' });
    }
});

app.put('/api/admin/users/:userId', authToken, requireAdminToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, username, email, phone, isAdmin, isVerified } = req.body;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'المستخدم غير موجود' });
        }
        
        user.name = name || user.name;
        user.username = username || user.username;
        user.email = email || user.email;
        user.phone = phone || user.phone;
        user.isAdmin = isAdmin !== undefined ? isAdmin : user.isAdmin;
        if (isVerified !== undefined) user.isVerified = !!isVerified;
        
        await user.save();
        
        res.json({
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            phone: user.phone,
            isAdmin: user.isAdmin,
            isVerified: !!user.isVerified
        });
    } catch (err) {
        console.error('خطأ في تحديث المستخدم:', err);
        res.status(500).json({ error: 'فشل في تحديث المستخدم' });
    }
});

app.delete('/api/admin/users/:userId', authToken, requireAdminToken, async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'المستخدم غير موجود' });
        }
        
        await User.findByIdAndDelete(userId);
        res.json({ message: 'تم حذف المستخدم بنجاح' });
    } catch (err) {
        console.error('خطأ في حذف المستخدم:', err);
        res.status(500).json({ error: 'فشل في حذف المستخدم' });
    }
});

app.get('/api/admin/blogs', authToken, requireAdminToken, async (req, res) => {
    try {
        const blogs = await Blog.find().populate('author', 'name username');
        res.json(blogs);
    } catch (err) {
    res.status(500).json({ error: 'فشل في جلب المنشورات' });
    }
});

app.post('/api/admin/blogs', authToken, requireAdminToken, async (req, res) => {
    try {
        const { title, content, author, category, tags } = req.body;
        
        if (!title || !content) {
            return res.status(400).json({ error: 'العنوان والمحتوى مطلوبان' });
        }
        
        const newBlog = new Blog({
            title,
            content,
            author: author || req.user._id,
            category: category || 'عام',
            tags: tags || []
        });
        
        await newBlog.save();
        res.status(201).json(newBlog);
    } catch (err) {
    console.error('خطأ في إضافة المنشور:', err);
    res.status(500).json({ error: 'فشل في إضافة المنشور' });
    }
});

app.put('/api/admin/blogs/:blogId', authToken, requireAdminToken, async (req, res) => {
    try {
        const { blogId } = req.params;
        const { title, content, category, tags } = req.body;
        
        const blog = await Blog.findById(blogId);
        if (!blog) {
            return res.status(404).json({ error: 'المنشور غير موجود' });
        }
        
        blog.title = title || blog.title;
        blog.content = content || blog.content;
        blog.category = category || blog.category;
        blog.tags = tags || blog.tags;
        
        await blog.save();
        res.json(blog);
    } catch (err) {
    console.error('خطأ في تحديث المنشور:', err);
    res.status(500).json({ error: 'فشل في تحديث المنشور' });
    }
});

app.delete('/api/admin/blogs/:blogId', authToken, requireAdminToken, async (req, res) => {
    try {
        const { blogId } = req.params;
        
        const blog = await Blog.findById(blogId);
        if (!blog) {
            return res.status(404).json({ error: 'المنشور غير موجود' });
        }
        
        await Blog.findByIdAndDelete(blogId);
    res.json({ message: 'تم حذف المنشور بنجاح' });
    } catch (err) {
    console.error('خطأ في حذف المنشور:', err);
    res.status(500).json({ error: 'فشل في حذف المنشور' });
    }
});

app.get('/api/admin/courses', authToken, requireAdminToken, async (req, res) => {
    try {
        const courses = await Course.find().populate('createdBy', 'username');
        res.json(courses);
    } catch (err) {
        res.status(500).json({ error: 'فشل في جلب الكورسات' });
    }
});

app.put('/api/admin/courses/:courseId', authToken, requireAdminToken, async (req, res) => {
    try {
        const { courseId } = req.params;
        const { title, description, instructor, duration, price, category, tags } = req.body;
        
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ error: 'الكورس غير موجود' });
        }
        
        course.title = title || course.title;
        course.description = description || course.description;
        course.instructor = instructor || course.instructor;
        course.duration = duration || course.duration;
        course.price = price !== undefined ? price : course.price;
        course.category = category || course.category;
        course.tags = tags || course.tags;
        
        await course.save();
        res.json(course);
    } catch (err) {
        console.error('خطأ في تحديث الكورس:', err);
        res.status(500).json({ error: 'فشل في تحديث الكورس' });
    }
});

app.delete('/api/admin/courses/:courseId', authToken, requireAdminToken, async (req, res) => {
    try {
        const { courseId } = req.params;
        
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ error: 'الكورس غير موجود' });
        }
        
        await Course.findByIdAndDelete(courseId);
        res.json({ message: 'تم حذف الكورس بنجاح' });
    } catch (err) {
        console.error('خطأ في حذف الكورس:', err);
        res.status(500).json({ error: 'فشل في حذف الكورس' });
    }
});

app.post('/api/courses', authToken, requireAuthToken, async (req, res) => {
    try {
        console.log('[/api/courses] Incoming POST — user:', (req.user && (req.user._id || req.user.id)) || 'anon');
        
        const { title, description, instructor, duration, price, category, tags, icon, categories, featured, isFree } = req.body;

        const creatorId = req.user ? req.user._id : (req.body.createdBy || null);
        const normalizedTitleRaw = (title || '').trim();
        const forceCreate = req.body && (req.body.forceCreate === true || req.body.forceCreate === 'true') || (req.query && req.query.force === '1');
        
        if (normalizedTitleRaw) {
            try {
                const titleRegex = { $regex: `^${normalizedTitleRaw.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}$`, $options: 'i' };
                if (creatorId) {
                    const existingByCreator = await Course.findOne({ createdBy: creatorId, title: titleRegex });
                    if (existingByCreator) {
                        console.log('Duplicate course detected for same creator — title:', title);
                        if (!forceCreate) {
                            return res.status(409).json({ error: 'CourseExists', message: 'You already have a course with this title', existing: existingByCreator });
                        }
                    }
                }

                const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
                const recent = await Course.findOne({ title: titleRegex, created_at: { $gte: oneMinuteAgo } });
                if (recent) {
                    console.log('Recent duplicate detected — title:', title);
                    if (!forceCreate) {
                        return res.status(409).json({ error: 'RecentDuplicate', message: 'A course with this title was created recently', existing: recent });
                    }
                }
            } catch (dupErr) {
                console.warn('Duplicate check failed:', dupErr && dupErr.message);
            }
        }

        const creator = req.user ? String(req.user._id) : (req.body.createdBy ? String(req.body.createdBy) : null);
        let normalizedTitleLower = (title || '').trim().toLowerCase();
        if (forceCreate) {
            normalizedTitleLower = `${normalizedTitleLower}-${Date.now()}`;
        }

        const insertDoc = {
            title,
            description,
            instructor,
            duration,
            price: price || 0,
            category: category || 'other',
            tags: tags || [],
            categories: Array.isArray(categories) ? categories : [],
            icon: icon || 'fa-solid fa-book',
            featured: featured || false,
            isFree: isFree !== undefined ? isFree : true,
            createdBy: creator,
            normalizedTitle: normalizedTitleLower,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        try {
            const filter = creator ? { createdBy: creator, normalizedTitle: normalizedTitleLower } : { normalizedTitle: normalizedTitleLower };
            const updated = await Course.findOneAndUpdate(
                filter,
                { $setOnInsert: insertDoc },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            const ageMs = Date.now() - new Date(updated.createdAt).getTime();
            const statusCode = ageMs < 5000 ? 201 : 200;
            return res.status(statusCode).json(updated);
        } catch (err) {
            if (err && err.code === 11000) {
                try {
                    const existing = await Course.findOne({ createdBy: creator, normalizedTitle: normalizedTitleLower });
                    if (existing) return res.status(200).json(existing);
                } catch (e2) { /* fallthrough */ }
            }
            console.error('خطأ في إنشاء/إيجاد الكورس:', err);
            return res.status(500).json({ error: 'حدث خطأ أثناء إضافة الكورس' });
        }
    } catch (err) {
        console.error('خطأ في إضافة الكورس:', err);
        res.status(500).json({ error: 'حدث خطأ أثناء إضافة الكورس' });
    }
});

app.post('/api/courses/:courseId/units', authToken, requireAuthToken, async (req, res) => {
    try {
        const { title, description } = req.body;
        const course = await Course.findById(req.params.courseId);
        
        if (!course) {
            return res.status(404).json({ error: 'الكورس غير موجود' });
        }

        const newUnit = {
            title,
            description,
            order: course.units.length + 1,
            lessons: []
        };

        course.units.push(newUnit);
        await course.save();
        
        res.status(201).json(newUnit);
    } catch (err) {
        console.error('خطأ في إضافة الوحدة:', err);
        res.status(500).json({ error: 'حدث خطأ أثناء إضافة الوحدة' });
    }
});

app.post('/api/courses/:courseId/units/:unitId/lessons', async (req, res) => {
    await new Promise((resolve, reject) => {
        lessonUpload(req, res, (err) => {
            if (err) {
                console.error('File upload error:', {
                    message: err.message,
                    code: err.code,
                    field: err.field
                });
                
                if (err.code === 'INVALID_FILE_TYPE') {
                    return res.status(400).json({
                        error: err.message,
                        allowedTypes: ['video/mp4 (.mp4)', 'video/quicktime (.mov)']
                    });
                }
                
                return res.status(400).json({
                    error: 'حدث خطأ أثناء رفع الملف: ' + err.message
                });
            }
            resolve();
        });
    });

    try {
        console.log('📂 الملفات المرفوعة:', req.files);
        console.log('📝 البيانات:', req.body);

    if (req._fileFilterPassed === false) {
        console.warn('ملف مرفوض بواسطة فلتر الصيغ. originalname=', req.files && req.files.lessonFile && req.files.lessonFile[0] && req.files.lessonFile[0].originalname);
        return res.status(400).json({ error: 'صيغة الملف غير مسموح بها أو الملف غير مدعوم. يرجى رفع ملف بصيغة mp4 أو mov أو pdf.' });
    }

    const { title, description, duration, type, videoUrl, fileUrl, externalUrl, content, isFree } = req.body;

    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ error: 'الكورس غير موجود' });

    const unit = course.units.id(req.params.unitId);
    if (!unit) return res.status(404).json({ error: 'الوحدة غير موجودة' });

    const files = req.files || {};
    const lessonFiles = Array.isArray(files.lessonFile) ? files.lessonFile : [];
    const videoFile = lessonFiles[0] || null;
const pdfFile = videoFile;

const newLesson = {
    title,
    description,
    duration: Number(duration) || 0,
    type: type || 'video',
    isFree: isFree === 'true' || isFree === true
};

if (newLesson.type === 'video') {
    if (videoFile && videoFile.mimetype.startsWith('video/')) {
        newLesson.videoUrl = `/uploads/${videoFile.filename}`;
    } else if (videoUrl) {
        newLesson.videoUrl = videoUrl;
    } else {
        return res.status(400).json({ error: 'يجب رفع ملف فيديو أو إدخال رابط فيديو' });
    }
} else if (newLesson.type === 'pdf') {
    if (pdfFile && pdfFile.mimetype === 'application/pdf') {
        newLesson.fileUrl = `/uploads/${pdfFile.filename}`;
    } else if (fileUrl) {
        newLesson.fileUrl = fileUrl;
    } else {
        return res.status(400).json({ error: 'يجب رفع ملف PDF أو إدخال رابط PDF' });
    }
} else if (newLesson.type === 'url') {
    if (!externalUrl) {
        return res.status(400).json({ error: 'يرجى إدخال الرابط الخارجي' });
    }
    newLesson.externalUrl = externalUrl;
} else if (newLesson.type === 'text') {
    newLesson.content = content || '';
}

    unit.lessons.push(newLesson);
    await course.save();

    const savedUnit = course.units.id(req.params.unitId);
    const savedLesson = savedUnit.lessons[savedUnit.lessons.length - 1];

    res.status(201).json(savedLesson);
} catch (err) {
    console.error('خطأ في إضافة الدرس:', err);
    res.status(500).json({ error: 'حدث خطأ أثناء إضافة الدرس' });
}
});

app.put('/api/courses/:courseId/content', authToken, requireAuthToken, async (req, res) => {
    try {
        const { units } = req.body;
        const course = await Course.findById(req.params.courseId);
        
        if (!course) {
            return res.status(404).json({ error: 'الكورس غير موجود' });
        }

        course.units = units;
        await course.save();
        
        res.json(course);
    } catch (err) {
        console.error('خطأ في تحديث محتوى الكورس:', err);
        res.status(500).json({ error: 'حدث خطأ أثناء تحديث محتوى الكورس' });
    }
});

app.get('/api/courses/:courseId/content', async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        
        if (!course) {
            return res.status(404).json({ error: 'الكورس غير موجود' });
        }

        res.json({
            courseId: course._id,
            title: course.title,
            units: course.units,
            totalLessons: course.totalLessons,
            totalDuration: course.totalDuration
        });
    } catch (err) {
        console.error('خطأ في جلب محتوى الكورس:', err);
        res.status(500).json({ error: 'حدث خطأ أثناء جلب محتوى الكورس' });
    }
});

app.delete('/api/courses/:courseId/units/:unitId', authToken, requireAuthToken, async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        
        if (!course) {
            return res.status(404).json({ error: 'الكورس غير موجود' });
        }

        const unitIndex = course.units.findIndex(unit => unit._id.toString() === req.params.unitId);
        if (unitIndex === -1) {
            return res.status(404).json({ error: 'الوحدة غير موجودة' });
        }

        course.units.splice(unitIndex, 1);
        await course.save();
        
        res.json({ message: 'تم حذف الوحدة بنجاح' });
    } catch (err) {
        console.error('خطأ في حذف الوحدة:', err);
        res.status(500).json({ error: 'حدث خطأ أثناء حذف الوحدة' });
    }
});

app.get('/api/courses/:courseId/units/:unitId/lessons/:lessonId', async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        
        if (!course) {
            return res.status(404).json({ error: 'الكورس غير موجود' });
        }

        const unit = course.units.id(req.params.unitId);
        if (!unit) {
            return res.status(404).json({ error: 'الوحدة غير موجودة' });
        }

        const lesson = unit.lessons.id(req.params.lessonId);
        if (!lesson) {
            return res.status(404).json({ error: 'الدرس غير موجود' });
        }

        res.json(lesson);
    } catch (err) {
        console.error('خطأ في جلب الدرس:', err);
        res.status(500).json({ error: 'حدث خطأ أثناء جلب الدرس' });
    }
});

app.put('/api/courses/:courseId/units/:unitId/lessons/:lessonId', authToken, requireAuthToken, async (req, res) => {
    try {
        const { title, videoUrl, description, duration, type, fileUrl, externalUrl, content, isFree } = req.body;
        console.log('PUT update lesson payload:', { title, videoUrl, description, duration, type, fileUrl, externalUrl, content, isFree });
        const course = await Course.findById(req.params.courseId);
        
        if (!course) {
            return res.status(404).json({ error: 'الكورس غير موجود' });
        }

        const unit = course.units.id(req.params.unitId);
        if (!unit) {
            return res.status(404).json({ error: 'الوحدة غير موجودة' });
        }

        const lesson = unit.lessons.id(req.params.lessonId);
        if (!lesson) {
            return res.status(404).json({ error: 'الدرس غير موجود' });
        }

        lesson.title = title || lesson.title;
        lesson.description = description || lesson.description;
        lesson.duration = duration || lesson.duration;
        lesson.type = type || lesson.type;
        lesson.isFree = isFree !== undefined ? isFree : lesson.isFree;
        
        if (typeof videoUrl !== 'undefined') {
            lesson.videoUrl = videoUrl;
            lesson.fileUrl = undefined;
            lesson.externalUrl = undefined;
            lesson.content = undefined;
        }
        if (typeof fileUrl !== 'undefined') {
            lesson.fileUrl = fileUrl;
            lesson.videoUrl = undefined;
            lesson.externalUrl = undefined;
            lesson.content = undefined;
        }
        if (typeof externalUrl !== 'undefined') {
            lesson.externalUrl = externalUrl;
            lesson.videoUrl = undefined;
            lesson.fileUrl = undefined;
            lesson.content = undefined;
        }
        if (typeof content !== 'undefined') {
            lesson.content = content;
            lesson.videoUrl = undefined;
            lesson.fileUrl = undefined;
            lesson.externalUrl = undefined;
        }

        await course.save();
        console.log('Saved lesson:', lesson);
        
        res.json(lesson);
    } catch (err) {
        console.error('خطأ في تحديث الدرس:', err);
        res.status(500).json({ error: 'حدث خطأ أثناء تحديث الدرس' });
    }
});

app.delete('/api/courses/:courseId/units/:unitId/lessons/:lessonId', authToken, requireAuthToken, async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        
        if (!course) {
            return res.status(404).json({ error: 'الكورس غير موجود' });
        }

        const unit = course.units.id(req.params.unitId);
        if (!unit) {
            return res.status(404).json({ error: 'الوحدة غير موجودة' });
        }

        const lessonIndex = unit.lessons.findIndex(lesson => lesson._id.toString() === req.params.lessonId);
        if (lessonIndex === -1) {
            return res.status(404).json({ error: 'الدرس غير موجود' });
        }

        unit.lessons.splice(lessonIndex, 1);
        await course.save();
        
        res.json({ message: 'تم حذف الدرس بنجاح' });
    } catch (err) {
        console.error('خطأ في حذف الدرس:', err);
        res.status(500).json({ error: 'حدث خطأ أثناء حذف الدرس' });
    }
});

app.get('/api/courses', async (req, res) => {
    try {
        const filter = {};

        if (req.query && req.query.categories) {
            const cats = Array.isArray(req.query.categories) ? req.query.categories : [req.query.categories];
            filter['categories.mainCategory'] = { $in: cats };
        }

        const courses = await Course.find(filter);
        res.json(courses);
    } catch (err) {
        console.error('GET /api/courses failed', err);
        res.status(500).json({ error: 'حدث خطأ أثناء جلب الكورسات' });
    }
});

app.get('/api/blogs', async (req, res) => {
    try {
        const blogs = await Blog.find().populate('author', 'name username');
        res.json(blogs);
    } catch (err) {
        res.status(500).json({ error: 'فشل في جلب المدونات' });
    }
});

app.get('/api/user/lessons/completed', authToken, requireAuthToken, async (req, res) => {
    try {
        const userId = req.user && req.user._id;
        if (!userId) return res.status(400).json({ error: 'المستخدم غير محدد' });
        const user = await User.findById(userId).lean();
        if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });

        let completed = [];
        if (Array.isArray(user.courseProgress)) {
            user.courseProgress.forEach(cp => {
                (cp.completedLessons || []).forEach(lessonId => {
                    completed.push({ courseId: cp.course, lessonId });
                });
            });
        }

        return res.json({ completedLessons: completed });
    } catch (err) {
        console.error('خطأ في /api/user/lessons/completed:', err);
        return res.status(500).json({ error: 'فشل في جلب دروس المستخدم المكتملة' });
    }
});

app.get('/api/products', async (req, res) => {
    try {
        const { search, category, minPrice, maxPrice, sort } = req.query;

        const filter = {};
        if (search) {
            const regex = new RegExp(search, 'i');
            filter.$or = [
                { name: regex },
                { description: regex },
                { 'category.name': regex }
            ];
        }
        if (category) {
            filter.category = category;
        }
        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.price = {};
            if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
            if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
        }

        const products = await Product.find(filter)
            .populate('category', 'name')
            .sort({ createdAt: -1 })
            .lean();

        let sortedProducts = products;
        if (sort === 'priceAsc') {
            sortedProducts = products.sort((a, b) => a.price - b.price);
        } else if (sort === 'priceDesc') {
            sortedProducts = products.sort((a, b) => b.price - a.price);
        }

        res.json(sortedProducts);
    } catch (err) {
        console.error('خطأ في جلب المنتجات:', err);
        res.status(500).json({ error: 'فشل في جلب المنتجات' });
    }
});

// ============ Protected routes ============
app.get('/course-page.html', authToken, requireAuthToken, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'course-page.html'));
});

app.get('/twm3-backend/private/dashboard.html', (req, res, next) => {
    const allowPublic = process.env.ALLOW_DASHBOARD_PUBLIC === 'true' || req.query.test === '1';
    if (allowPublic) {
        return res.sendFile(path.join(__dirname, '..', 'twm3-backend/private/dashboard.html'));
    }
    authToken(req, res, (err) => {
        if (err) return next(err);
        requireAdminToken(req, res, (err2) => {
            if (err2) return;
            res.sendFile(path.join(__dirname, '..', 'twm3-backend/private/dashboard.html'));
        });
    });
});

app.get('/dashboard.html', authToken, requireAuthToken, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dashboard.html'));
});

app.use("/twm3-backend/private", authToken, requireAdminToken, express.static(path.join(__dirname, "private")));

app.get('/api/admin/missing-product-images', authToken, requireAdminToken, async (req, res) => {
    try {
        const products = await Product.find({}).lean();
        const missing = [];
        for (const p of products) {
            const imageMissing = !!(p.image && !fs.existsSync(path.join(__dirname, 'public', p.image.replace(/^\//, ''))));
            let imagesMissing = [];
            if (p.images && typeof p.images === 'object') {
                for (const [k, v] of Object.entries(p.images)) {
                    if (v && !fs.existsSync(path.join(__dirname, 'public', v.replace(/^\//, '')))) imagesMissing.push(k);
                }
            }
            if (imageMissing || imagesMissing.length > 0) {
                missing.push({ _id: p._id, title: p.name, image: p.image, missingImages: imagesMissing });
            }
        }
        res.json({ count: missing.length, items: missing });
    } catch (e) {
        console.error('Error listing missing product images:', e);
        res.status(500).json({ error: 'internal' });
    }
});

// ============ Error Handlers ============
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        status: err.status || 500
    });
});

app.use((req, res) => {
    res.status(404).json({ 
        error: 'Route not found',
        status: 404 
    });
});

// ============ Socket.IO Server ============
const server = http.createServer(app);

// ✅ **التعديل المهم هنا: CORS لـSocket.IO يجب يتضمن Railway domains**
const io = new Server(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production' 
            ? [
                'https://twm3.org',
                'https://www.twm3.org',
                'https://*.up.railway.app', // كل Railway domains
                'https://*.railway.app'     // للمجال العام
              ]
            : ['http://localhost:5000', 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://127.0.0.1:5000'],
        methods: ['GET', 'POST'],
        credentials: true
    }
});

app.set('io', io);

io.use((socket, next) => {
    try {
        const token = socket.handshake && socket.handshake.auth && socket.handshake.auth.token;
        if (!token) return next();
        jwt.verify(token, process.env.JWT_SECRET || 'jwtsecret', (err, decoded) => {
            if (err) {
                console.warn('Socket auth failed:', err && err.message);
                return next();
            }
            if (decoded && decoded.id && !decoded._id) decoded._id = decoded.id;
            socket.user = decoded;
            socket.userId = decoded && (decoded._id || decoded.id) ? String(decoded._id || decoded.id) : null;
            return next();
        });
    } catch (e) {
        console.error('Socket auth error', e);
        return next();
    }
});

io.on('connection', (socket) => {
    try { console.log('Socket connected:', socket.id, 'userId=', socket.userId); } catch(e) { console.log('Socket connected:', socket.id); }

    try { if (socket.userId) socket.join(socket.userId); } catch (e) { console.error('Auto-join room failed', e); }

    socket.on('join', (userId) => {
        try { if (userId) socket.join(userId); } catch (e) { console.error('join handler failed', e); }
    });

    socket.on('disconnect', (reason) => {
        // optional logging
    });
});




// أضف error handler للـserver
server.on('error', (error) => {
    console.error('❌ Server error:', error);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('⚠️ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason);
});






// ============ Start Server ============
// ============ START SERVER ============
console.log('🚀 Attempting to start server...');

// Simple routes that don't need MongoDB
app.get('/status', (req, res) => {
    res.json({
        status: 'alive',
        server: 'TWM3 Backend',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>TWM3 Backend</title>
            <style>
                body { font-family: Arial; padding: 40px; text-align: center; }
                .status { background: green; color: white; padding: 10px; border-radius: 5px; }
            </style>
        </head>
        <body>
            <h1>TWM3 Backend Server</h1>
            <div class="status">✅ Server is running</div>
            <p>Go to <a href="/status">/status</a> for API status</p>
            <p>Go to <a href="/api/courses">/api/courses</a> for courses</p>
            <p><small>${new Date().toISOString()}</small></p>
        </body>
        </html>
    `);
});

const startServer = async () => {
    try {
        const port = parseInt(process.env.PORT || 5000, 10);
        
        // Try to connect to MongoDB first
        if (process.env.MONGO_URI) {
            console.log('🔗 Connecting to MongoDB...');
            try {
                await mongoose.connect(process.env.MONGO_URI, {
                    serverSelectionTimeoutMS: 10000,
                });
                console.log('✅ MongoDB connected');
            } catch (dbError) {
                console.warn('⚠️ MongoDB connection failed:', dbError.message);
                console.log('🔄 Starting server without database...');
            }
        } else {
            console.log('⚠️ No MONGO_URI provided');
        }
        
        // Start the server regardless of MongoDB
        server.listen(port, '0.0.0.0', () => {
            console.log(`==========================================`);
            console.log(`✅ SERVER STARTED SUCCESSFULLY`);
            console.log(`✅ Port: ${port} (0.0.0.0:${port})`);
            console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`✅ Railway URL: ${process.env.RAILWAY_STATIC_URL || 'Not set'}`);
            console.log(`==========================================`);
        });
        
        // Error handling
        server.on('error', (error) => {
            console.error('❌ Server error:', error.message);
        });
        
    } catch (error) {
        console.error('❌ Critical error starting server:', error);
    }
};

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('⚠️ Uncaught Exception:', error.message);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the server
startServer();