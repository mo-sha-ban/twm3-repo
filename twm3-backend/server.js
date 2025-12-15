const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const multer = require('multer');
const path = require("path");
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
require("dotenv").config();

// Import models
const Course = require('./models/Course');
const Blog = require('./models/Blog');
const Product = require('./models/Product');
const User = require("./models/User");

// Import routes
const authRoutes = require("./routes/auth");
const blogRoutes = require('./routes/blogRoutes');
const commentRoutes = require('./routes/commentRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const courseRoutes = require('./routes/courseRoutes');
const productRoutes = require('./routes/productRoutes');
const dataDeletionRoutes = require('./routes/dataDeletion');
const counterRoutes = require("./routes/counterRoutes");
const uploadRoutes = require("./routes/upload");
const progressRoutes = require("./routes/progressRoutes");
const communityRoutes = require('./routes/communityRoutes');

// ============ INITIALIZATION ============
const app = express();
const PORT = process.env.PORT || 5000;

console.log('🚀 ============ TWM3 BACKEND STARTING ============');
console.log('📅', new Date().toISOString());
console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
console.log('🎯 PORT:', PORT);
console.log('📁 Current directory:', __dirname);
console.log('==================================================\n');

// ============ MIDDLEWARE SETUP ============
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                "blob:",
                "data:",
                "'unsafe-eval'",
                "https://cdn.plyr.io",
                "https://cdnjs.cloudflare.com",
                "https://cdn.jsdelivr.net",
                "https://pagead2.googlesyndication.com",
                "https://www.googletagservices.com",
                "https://www.googletagmanager.com",
                "https://cdn.jsdelivr.net/npm/@emailjs/browser",
                "https://use.fontawesome.com",
                "https://www.youtube.com",
                "https://cdn.quilljs.com"
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://fonts.googleapis.com",
                "https://cdn.plyr.io",
                "https://cdnjs.cloudflare.com",
                "https://cdn.quilljs.com"
            ],
            imgSrc: ["'self'", "data:", "blob:", "https://*"],
            connectSrc: [
                "'self'",
                "http://localhost:5000",
                "https://twm3.org",
                "https://cdn.plyr.io",
                "https://noembed.com",
                "https://www.youtube.com",
                "https://www.youtube-nocookie.com",
                "https://cdn.quilljs.com"
            ],
            frameSrc: ["'self'", "https://www.youtube.com", "https://www.youtube-nocookie.com"],
            mediaSrc: ["'self'", "data:", "blob:", "https://cdn.plyr.io"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com", "https://use.fontawesome.com", "data:"],
            scriptSrcAttr: ["'unsafe-inline'"]
        }
    }
}));

app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://twm3.org', 'https://www.twm3.org', 'https://api.twm3.org', 'https://*.railway.app']
        : ['http://localhost:5000', 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://127.0.0.1:5000'],
    credentials: true
}));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// ============ STATIC FILES CONFIGURATION ============
console.log('📁 ============ CONFIGURING STATIC FILES ============');

// Determine the correct root path
let rootPath = path.join(__dirname, '..'); // Go up from twm3-backend folder
console.log('📍 Calculated root path:', rootPath);

// Verify the root exists
try {
    if (!fs.existsSync(rootPath)) {
        console.log('⚠️ Calculated path not found, trying alternatives...');
        
        const alternatives = [
            '/app',                    // Railway default
            process.cwd(),             // Current working directory
            path.join(__dirname, '../..'), // Two levels up
            __dirname                  // Current directory
        ];
        
        for (const altPath of alternatives) {
            if (fs.existsSync(altPath)) {
                rootPath = altPath;
                console.log(`✅ Using alternative path: ${altPath}`);
                break;
            }
        }
    }
    
    // List files in root
    const files = fs.readdirSync(rootPath);
    console.log(`📂 Found ${files.length} files/folders in root`);
    
    // Check for important files
    const importantFiles = ['index.html', 'package.json', 'server.js'];
    importantFiles.forEach(file => {
        const filePath = path.join(rootPath, file);
        const exists = fs.existsSync(filePath);
        console.log(`${exists ? '✅' : '❌'} ${file} - ${exists ? 'EXISTS' : 'MISSING'}`);
    });
    
} catch (error) {
    console.error('❌ Error examining root directory:', error.message);
}

// Configure static file serving
app.use(express.static(rootPath, {
    extensions: ['html', 'htm', 'css', 'js', 'json', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'woff', 'woff2', 'ttf', 'eot'],
    index: ['index.html', 'index.htm', 'default.html'],
    fallthrough: true,
    setHeaders: (res, filePath) => {
        // Set caching headers
        const ext = path.extname(filePath);
        if (['.html', '.htm'].includes(ext)) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        } else {
            res.setHeader('Cache-Control', 'public, max-age=31536000');
        }
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    }
}));

console.log(`✅ Static files configured for: ${rootPath}`);
console.log('==================================================\n');

// ============ MULTER CONFIGURATION ============
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

        const allowedMimes = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
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

        const allowedMimes = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
        if (allowedMimes.includes(mime)) {
            req._fileFilterPassed = true;
            return cb(null, true);
        }

        req._fileFilterPassed = false;
        return cb(null, false);
    }
}).fields([{ name: 'lessonFile', maxCount: 1 }]);

// ============ AUTH MIDDLEWARE ============
function authToken(req, res, next) {
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

app.set('authToken', authToken);
app.set('requireAuthToken', requireAuthToken);

// ============ BASIC ROUTES ============
// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'UP',
        server: 'TWM3 Backend',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Test route
app.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Server is working correctly',
        rootPath: rootPath,
        filesInRoot: fs.existsSync(rootPath) ? fs.readdirSync(rootPath).slice(0, 10) : 'N/A'
    });
});

// Debug files route
app.get('/debug-files', (req, res) => {
    const dirs = [
        rootPath,
        path.join(rootPath, 'twm3-backend'),
        '/app',
        __dirname,
        process.cwd()
    ];
    
    const result = {};
    
    dirs.forEach(dir => {
        try {
            if (fs.existsSync(dir)) {
                const stats = fs.statSync(dir);
                const isDir = stats.isDirectory();
                result[dir] = {
                    exists: true,
                    type: isDir ? 'directory' : 'file',
                    files: isDir ? fs.readdirSync(dir).slice(0, 20) : 'N/A'
                };
            } else {
                result[dir] = { exists: false };
            }
        } catch (error) {
            result[dir] = { exists: false, error: error.message };
        }
    });
    
    res.json(result);
});

// Force serve index.html for root
app.get('/', (req, res) => {
    const indexPath = path.join(rootPath, 'index.html');
    
    if (fs.existsSync(indexPath)) {
        console.log(`📤 Serving index.html from: ${indexPath}`);
        res.sendFile(indexPath);
    } else {
        // Fallback page
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>TWM3 Backend</title>
                <style>
                    body { font-family: Arial; padding: 40px; text-align: center; }
                    .card { background: #f5f5f5; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto; }
                    .success { color: green; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>✅ TWM3 Backend Server</h1>
                    <p class="success">Server is running successfully on Railway!</p>
                    <p>However, index.html was not found in deployment.</p>
                    <hr>
                    <p><a href="/test">Test API</a></p>
                    <p><a href="/health">Health Check</a></p>
                    <p><a href="/debug-files">Debug Files</a></p>
                    <hr>
                    <p><small>Root path: ${rootPath}</small></p>
                    <p><small>${new Date().toISOString()}</small></p>
                </div>
            </body>
            </html>
        `);
    }
});

// ============ API ROUTES ============
app.use("/api", authRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api', counterRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/products', productRoutes);
app.use('/api', dataDeletionRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/community', communityRoutes);

// Comments routes with auth
app.use('/api/comments', (req, res, next) => {
    if (!req.headers['authorization']) {
        return res.status(401).json({ error: 'يجب تسجيل الدخول (توكن غير موجود في الهيدر)' });
    }
    next();
}, authToken, commentRoutes);

// ============ USER ROUTES ============
app.get('/api/user', async (req, res) => {
    try {
        let userDoc = null;
        const authHeader = req.headers['authorization'];
        
        if (authHeader) {
            const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwtsecret');
                const userId = decoded && (decoded._id || decoded.id);
                if (userId) userDoc = await User.findById(userId).lean();
                if (!userDoc && decoded && decoded.email) {
                    userDoc = await User.findOne({ email: decoded.email }).lean();
                }
            } catch(_) {}
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

// Avatar upload
app.post('/api/users/me/avatar', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ error: 'يجب تسجيل الدخول' });
        
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
        let decoded;
        
        try { 
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwtsecret'); 
        } catch(_) { 
            return res.status(403).json({ error: 'توكن غير صالح أو منتهي الصلاحية' }); 
        }
        
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

// ============ COURSE ROUTES (Additional) ============
app.get('/api/courses/:id', async (req, res) => {
    try {
        const courseId = req.params.id;
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ error: 'الكورس غير موجود' });
        res.json(course);
    } catch (err) {
        console.error('خطأ أثناء جلب الكورس:', err);
        res.status(500).json({ error: 'حدث خطأ أثناء جلب الكورس' });
    }
});

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

        const updatedCourse = await Course.findByIdAndUpdate(courseId, updateData, { new: true });
        if (!updatedCourse) return res.status(404).json({ error: 'الكورس غير موجود' });

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
        if (!deletedCourse) return res.status(404).json({ error: 'الكورس غير موجود' });
        res.json({ message: 'تم حذف الكورس بنجاح' });
    } catch (err) {
        console.error('خطأ أثناء حذف الكورس:', err);
        res.status(500).json({ error: 'فشل في حذف الكورس' });
    }
});

// ============ STATIC FILE ROUTES ============
app.get('/uploads/:fileName', (req, res, next) => {
    const fileName = req.params.fileName;
    const publicDir = path.join(__dirname, 'public/uploads');
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
        } catch (e) {}
    }

    const defaultImagePath = path.join(__dirname, '..', 'img', 'profile.png');
    if (fs.existsSync(defaultImagePath)) {
        console.warn(`Missing image: ${fileName}, serving default placeholder`);
        return res.sendFile(defaultImagePath);
    }

    next();
});

// PDF routes
app.get('/pdf/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'public/uploads', req.params.filename);
    if (!fs.existsSync(filePath)) return res.status(404).send('❌ الملف غير موجود');
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${req.params.filename}"`);
    res.sendFile(filePath);
});

// ============ ADMIN ROUTES ============
app.get('/api/admin/users', authToken, requireAdminToken, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'فشل في جلب المستخدمين' });
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

// ============ SOCKET.IO SETUP ============
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production' 
            ? [
                'https://twm3.org',
                'https://www.twm3.org',
                'https://*.up.railway.app',
                'https://*.railway.app'
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
    console.log('Socket connected:', socket.id, 'userId=', socket.userId);
    if (socket.userId) socket.join(socket.userId);
    
    socket.on('join', (userId) => {
        if (userId) socket.join(userId);
    });
    
    socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
    });
});

// ============ ERROR HANDLERS ============
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

// ============ START SERVER ============
const startServer = async () => {
    try {
        console.log('\n🚀 ============ STARTING SERVER ============');
        
        // Connect to MongoDB
        if (process.env.MONGO_URI) {
            console.log('🔗 Connecting to MongoDB...');
            await mongoose.connect(process.env.MONGO_URI, {
                serverSelectionTimeoutMS: 10000,
            });
            console.log('✅ MongoDB connected successfully');
        } else {
            console.warn('⚠️ No MONGO_URI provided, running without database');
        }
        
        const port = parseInt(process.env.PORT || 5000, 10);
        
        server.listen(port, '0.0.0.0', () => {
            console.log(`==================================================`);
            console.log(`✅ SERVER STARTED SUCCESSFULLY`);
            console.log(`✅ Port: ${port} (0.0.0.0:${port})`);
            console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`✅ Railway URL: ${process.env.RAILWAY_STATIC_URL || 'Check Railway dashboard'}`);
            console.log(`✅ Root path: ${rootPath}`);
            console.log(`==================================================`);
            console.log(`🌐 Test the server:`);
            console.log(`   • Health: /health`);
            console.log(`   • Test: /test`);
            console.log(`   • Debug: /debug-files`);
            console.log(`   • API: /api/courses`);
            console.log(`==================================================\n`);
        });
        
        // Error handlers
        server.on('error', (error) => {
            console.error('❌ Server error:', error.message);
        });
        
        process.on('uncaughtException', (error) => {
            console.error('⚠️ Uncaught Exception:', error.message);
        });
        
        process.on('unhandledRejection', (reason, promise) => {
            console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason);
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        
        // Try to start without MongoDB
        const port = parseInt(process.env.PORT || 5000, 10);
        server.listen(port, '0.0.0.0', () => {
            console.log(`⚠️ Server started WITHOUT MongoDB on port ${port}`);
            console.log(`🔴 API will not work, but server is running`);
        });
    }
};

startServer();