const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const multer = require('multer'); // تم استيراد multer
const path = require("path");
const session = require("express-session"); // إعادة تفعيل session لـ Passport
const fs = require('fs'); // أضفنا استيراد fs
const http = require('http');
const { Server } = require('socket.io');
const { exec } = require('child_process'); // للتحويل باستخدام FFmpeg
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
const nodemailer = require('nodemailer');

// OAuth setup
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;

require("dotenv").config();

// Set BASE_URL for OAuth callbacks based on deployment environment
if (!process.env.BASE_URL) {
    if (process.env.VERCEL_URL) {
        // Vercel deployment
        process.env.BASE_URL = `https://${process.env.VERCEL_URL}`;
    } else if (process.env.RAILWAY_PUBLIC_DOMAIN) {
        // Railway deployment
        process.env.BASE_URL = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
    } else {
        // Local development
        process.env.BASE_URL = `http://localhost:${process.env.PORT || 5000}`;
    }
}

const app = express();
// اقرأ متغير البيئة PORT المُقدم من Railway، وإذا لم يكن موجوداً، استخدم القيمة 5000.
const PORT = process.env.PORT || 5000;

// Session middleware for Passport
app.use(session({
    secret: process.env.SESSION_SECRET || 'd7f8e3a1b6c94f2e8b5a7d0c9f3e2a1b6c94f2e8b5a7d0c9f3e2a1b6c94f2e',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

// Passport serialize/deserialize
passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ providerId: profile.id, provider: 'google' });

        if (!user) {
            // Check if user exists with same email
            user = await User.findOne({ email: profile.emails[0].value });
            if (user) {
                // Link Google account to existing user
                user.provider = 'google';
                user.providerId = profile.id;
                user.avatarUrl = profile.photos[0].value;
                user.isVerified = true; // OAuth users are pre-verified
                await user.save();
            } else {
                // Create new user
                user = new User({
                    name: profile.displayName,
                    username: profile.emails[0].value.split('@')[0] + '_google',
                    email: profile.emails[0].value,
                    provider: 'google',
                    providerId: profile.id,
                    avatarUrl: profile.photos[0].value,
                    isVerified: true, // OAuth users are pre-verified
                    isAdmin: false
                });
                await user.save();
            }
        }

        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));

// GitHub OAuth Strategy
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ providerId: profile.id, provider: 'github' });

        if (!user) {
            // Check if user exists with same email
            user = await User.findOne({ email: profile.emails[0].value });
            if (user) {
                // Link GitHub account to existing user
                user.provider = 'github';
                user.providerId = profile.id;
                user.avatarUrl = profile.photos[0].value;
                user.isVerified = true;
                await user.save();
            } else {
                // Create new user
                user = new User({
                    name: profile.displayName || profile.username,
                    username: profile.username + '_github',
                    email: profile.emails[0].value,
                    provider: 'github',
                    providerId: profile.id,
                    avatarUrl: profile.photos[0].value,
                    isVerified: true,
                    isAdmin: false
                });
                await user.save();
            }
        }

        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));

// Microsoft OAuth Strategy
passport.use(new MicrosoftStrategy({
    clientID: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    callbackURL: process.env.MICROSOFT_CALLBACK_URL,
    scope: ['user.read']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ providerId: profile.id, provider: 'microsoft' });

        if (!user) {
            // Check if user exists with same email
            user = await User.findOne({ email: profile.emails[0].value });
            if (user) {
                // Link Microsoft account to existing user
                user.provider = 'microsoft';
                user.providerId = profile.id;
                user.avatarUrl = profile.photos[0].value;
                user.isVerified = true;
                await user.save();
            } else {
                // Create new user
                user = new User({
                    name: profile.displayName,
                    username: profile.username || profile.emails[0].value.split('@')[0] + '_microsoft',
                    email: profile.emails[0].value,
                    provider: 'microsoft',
                    providerId: profile.id,
                    avatarUrl: profile.photos[0].value,
                    isVerified: true,
                    isAdmin: false
                });
                await user.save();
            }
        }

        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));

// Email transporter setup
const emailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Function to send verification email
async function sendVerificationEmail(email, token) {
    const verificationUrl = `${process.env.BASE_URL}/verify-email?token=${token}`;

    const mailOptions = {
        from: process.env.SMTP_USER,
        to: email,
        subject: 'تأكيد حسابك في TWM3',
        html: `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb; text-align: center;">مرحباً بك في TWM3</h2>
                <p>شكراً لتسجيلك في منصة TWM3 للتعلم والأمن السيبراني.</p>
                <p>لإكمال عملية التسجيل، يرجى تأكيد بريدك الإلكتروني بالنقر على الرابط التالي:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">تأكيد البريد الإلكتروني</a>
                </div>
                <p>إذا لم تقم بطلب هذا التسجيل، يمكنك تجاهل هذا البريد الإلكتروني.</p>
                <p>مع خالص التحية,<br>فريق TWM3</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                <p style="font-size: 12px; color: #666;">هذا البريد الإلكتروني تم إرساله تلقائياً، يرجى عدم الرد عليه.</p>
            </div>
        `
    };

    try {
        await emailTransporter.sendMail(mailOptions);
        console.log('Verification email sent to:', email);
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw error;
    }
}

// Middleware
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
                        "https://cdn.quilljs.com",
                        "https://www.google-analytics.com",
                        "https://analytics.google.com",
                        "https://infird.com",
                        "https://cdn.socket.io"
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
                "https://cdn.quilljs.com",
                "https://www.google-analytics.com",
                "https://analytics.google.com",
                "https://cdn.socket.io",
                "ws://localhost:5000",
                "wss://twm3.org"
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
        ? ['https://twm3.org', 'https://www.twm3.org', 'https://api.twm3.org', process.env.BASE_URL]
        : ['http://localhost:5000', 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://127.0.0.1:5000'],
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from public/uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads'), {
    setHeaders: (res) => {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Cache-Control', 'public, max-age=3600');
    }
}));

// Specific subdirectories with longer cache times
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

// Serve static assets from public/assets
app.use('/assets', express.static(path.join(__dirname, 'public/assets'), {
    setHeaders: (res) => {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
}));

// Serve JS files with correct MIME type
app.use('/js', express.static(path.join(__dirname, '..', 'js'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        }
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
}));

// Serve CSS files with correct MIME type
app.use('/css', express.static(path.join(__dirname, '..', 'css'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css; charset=utf-8');
        }
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
}));

// Serve static files from public/uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads'), {
    setHeaders: (res) => {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Cache-Control', 'public, max-age=3600');
    }
}));

// Fallback route: try to resolve /uploads/:filename by checking common subfolders
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

    // If file not found, return a default placeholder image
    const defaultImagePath = path.join(__dirname, '..', 'img', 'profile.png');
    if (fs.existsSync(defaultImagePath)) {
        console.warn(`Missing image: ${fileName}, serving default placeholder`);
        return res.sendFile(defaultImagePath);
    }

    // not found, pass to next handler (will result in 404)
    next();
});




// 🟢 إذا حابب ترجع PDF من API مخصص
app.get('/pdf', (req, res) => {
    const filePath = path.join(__dirname, 'public/files/myfile.pdf');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=myfile.pdf');
    res.sendFile(filePath);
  });


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

        // For lessonFile accept both mp4 and mov (video/quicktime)
        if (file.fieldname === 'lessonFile' && file.originalname) {
            const ext = path.extname(file.originalname).toLowerCase();
            const mime = (file.mimetype || '').toLowerCase();
            const allowedVideoExts = ['.mp4', '.mov'];
            const allowedVideoMimes = ['video/mp4', 'video/quicktime'];

            console.log('File upload attempt:', {
                filename: file.originalname,
                extension: ext,
                mimetype: mime
            });

            if (allowedVideoExts.includes(ext) || allowedVideoMimes.includes(mime)) {
                req._fileFilterPassed = true;
                return cb(null, true);
            }

            // Reject with a clear error for debugging
            const error = new Error('صيغة الملف غير مسموح بها. الرجاء استخدام ملف فيديو بصيغة MP4 أو MOV.');
            error.code = 'INVALID_FILE_TYPE';
            return cb(error, false);
        }

        // For other types (images, PDFs)
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

// إعداد رفع صور البروفايل (صور فقط)
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

// إعداد رفع ملفات وصف الدروس (صور + PDF)
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
  limits: { fileSize: 500 * 1024 * 1024 }, // Increased to 500MB for videos
  fileFilter: (req, file, cb) => {
    // Accept images, videos, and PDFs
    const allowed = [
      // Images
      'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif',
      // Videos
      'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv', 'video/ogg',
      'video/x-matroska', 'video/x-flv', 'video/mpeg', 'video/3gpp', 'video/mp2t',
      'application/x-mpegURL', // HLS
      // Documents
      'application/pdf'
    ];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    // Also accept if it has a video/* type but MIME might not be registered
    if (file.mimetype && file.mimetype.startsWith('video/')) return cb(null, true);
    cb(new Error(`صيغة الملف غير مسموح بها (${file.mimetype}). يدعم الصور والفيديوهات و PDF فقط.`), false);
  }
});

// 🟢 مسار عرض PDF مباشرة
app.get('/pdf/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'public/uploads', req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('❌ الملف غير موجود');
  }

  // 🟢 هيدرز عرض Inline (بدل التحميل)
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    'inline; filename="' + req.params.filename + '"'
  );

  res.sendFile(filePath);
});

// API: رفع ملف مرفق (صور + فيديو + PDF) عبر حقل form-data باسم 'file'
app.post('/api/uploads/lesson-asset', authToken, requireAuthToken, (req, res) => {
    lessonAssetUpload.single('file')(req, res, async (err) => {
        if (err) return res.status(400).json({ error: err.message || 'فشل رفع الملف' });
        if (!req.file) return res.status(400).json({ error: 'يرجى اختيار ملف' });
        
        let rel = '/uploads/lesson-assets/' + req.file.filename;
        let type = 'file';
        const mimetype = (req.file.mimetype || '').toLowerCase();
        if (mimetype.startsWith('image/')) type = 'image';
        else if (mimetype.startsWith('video/')) type = 'video';
        else if (mimetype === 'application/pdf') type = 'pdf';
        
        // For MOV files, note that frontend should convert to MP4 URL
        if (req.file.originalname.toLowerCase().endsWith('.mov')) {
            console.log('🎬 MOV file uploaded:', req.file.filename);
            console.log('📹 Client will attempt to use .mp4 version as fallback');
        }
        
        return res.json({ 
            success: true, 
            url: rel, 
            type, 
            filename: req.file.originalname
        });
    });
});

// API: رفع فيديو للدرس
app.post('/api/uploads/lesson-video', authToken, requireAuthToken, (req, res) => {
    lessonUpload.single('video')(req, res, (err) => {
        if (err) return res.status(400).json({ error: err.message || 'فشل رفع الفيديو' });
        if (!req.file) return res.status(400).json({ error: 'يرجى اختيار ملف فيديو' });
        const rel = '/uploads/' + req.file.filename;
        return res.json({ url: rel, filename: req.file.filename });
    });
});

// API: رفع PDF للدرس
app.post('/api/uploads/lesson-pdf', authToken, requireAuthToken, (req, res) => {
    lessonUpload.single('pdf')(req, res, (err) => {
        if (err) return res.status(400).json({ error: err.message || 'فشل رفع PDF' });
        if (!req.file) return res.status(400).json({ error: 'يرجى اختيار ملف PDF' });
        const rel = '/uploads/' + req.file.filename;
        return res.json({ url: rel, filename: req.file.filename });
    });
});

// API: رفع الفيديو الترويجي للكورس
app.post('/api/uploads/promo-video', authToken, requireAuthToken, (req, res) => {
    lessonUpload.single('video')(req, res, (err) => {
        if (err) return res.status(400).json({ error: err.message || 'فشل رفع الفيديو' });
        if (!req.file) return res.status(400).json({ error: 'يرجى اختيار ملف فيديو' });
        const rel = '/uploads/' + req.file.filename;
        return res.json({ url: rel, filename: req.file.filename });
    });
});

// API: رفع صورة الفيديو الترويجي (Thumbnail)
app.post('/api/uploads/promo-thumbnail', authToken, requireAuthToken, (req, res) => {
    lessonUpload.single('image')(req, res, (err) => {
        if (err) return res.status(400).json({ error: err.message || 'فشل رفع الصورة' });
        if (!req.file) return res.status(400).json({ error: 'يرجى اختيار ملف صورة' });
        const rel = '/uploads/' + req.file.filename;
        return res.json({ url: rel, filename: req.file.filename });
    });
});

// إعداد رفع ملفات الدروس
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

        // normalize
        const mime = (file.mimetype || '').toLowerCase();
        const ext = (path.extname(file.originalname || '') || '').toLowerCase();

        // For lessonFile: allow mp4 and mov (video/quicktime) by mime or extension
        if (file.fieldname === 'lessonFile') {
            // Allow video files (mp4, mov) and PDF files for lesson uploads
            const allowedVideoMimes = ['video/mp4', 'video/quicktime'];
            const allowedVideoExts = ['.mp4', '.mov'];
            const allowedPdfMimes = ['application/pdf'];
            const allowedPdfExts = ['.pdf'];

            if (allowedVideoMimes.includes(mime) || allowedVideoExts.includes(ext) || allowedPdfMimes.includes(mime) || allowedPdfExts.includes(ext)) {
                req._fileFilterPassed = true;
                return cb(null, true);
            }

            // mark as rejected but don't throw (so we can return JSON from the route)
            req._fileFilterPassed = false;
            return cb(null, false);
        }

        // For other types (images, PDFs)
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
    },
    limits: { fileSize: 500 * 1024 * 1024 } // 500 MB
}).fields([
    { name: 'lessonFile', maxCount: 1 } // فيديو أو PDF
]);

// ميدل وير جديد للتحقق من أن المستخدم أدمن بناءً على التوكن
function requireAdminToken(req, res, next) {
    if (req.user && req.user.isAdmin) {
        return next();
    } else {
        return res.status(403).json({ error: "غير مصرح لك بالدخول إلى لوحة التحكم!" });
    }
}

// ميدل وير جديد للتحقق من تسجيل الدخول بناءً على التوكن
function requireAuthToken(req, res, next) {
    if (req.user) {
        return next();
    } else {
        return res.status(401).json({ error: 'يجب تسجيل الدخول' });
    }
}

// NOTE: Frontend is hosted separately on Hostinger, not served from this backend
// Only API endpoints and uploads are served here

// Special route for data deletion status page
app.get("/data-deletion-status", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "data-deletion-status.html"));
});

// Special route for data deletion status page with .html extension
app.get("/data-deletion-status.html", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "data-deletion-status.html"));
});

// Redirect root to frontend (on Hostinger)
// But also serve static files if needed for hosting platforms like Vercel
app.get("/", (req, res) => {
    // Try to serve index.html if it exists (for static hosting)
    const indexPath = path.join(__dirname, '..', 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.redirect("https://twm3.org");
    }
});





// Serve static files from root directory for hosting platforms
app.use(express.static(path.join(__dirname, '..')));

// Serve CSS files
app.use('/css', express.static(path.join(__dirname, '..', 'css')));

// Serve JS files
app.use('/js', express.static(path.join(__dirname, '..', 'js')));

// Serve img files
app.use('/img', express.static(path.join(__dirname, '..', 'img')));

// Serve assets files
app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));

// Fallback for any other static file requests
app.get('/index.html', (req, res) => {
    const indexPath = path.join(__dirname, '..', 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).json({ error: 'Not Found' });
    }
});

// Serve other HTML pages
app.get('/:page', (req, res) => {
    const pageName = req.params.page;
    const pagePath = path.join(__dirname, '..', `${pageName}.html`);

    if (fs.existsSync(pagePath)) {
        res.sendFile(pagePath);
    } else {
        // Check if it's a page in Pages directory
        const pagesPath = path.join(__dirname, '..', 'Pages', `${pageName}.html`);
        if (fs.existsSync(pagesPath)) {
            res.sendFile(pagesPath);
        } else {
            // Check if it's a course page
            const coursePath = path.join(__dirname, '..', 'Pages', 'courses', `${pageName}.html`);
            if (fs.existsSync(coursePath)) {
                res.sendFile(coursePath);
            } else {
                res.status(404).json({ error: 'Page not found' });
            }
        }
    }
});














// Routes
const authRoutes = require("./routes/auth");
const counterRoutes = require("./routes/counterRoutes");
const uploadRoutes = require("./routes/upload");
const progressRoutes = require("./routes/progressRoutes");
app.use("/api", authRoutes);
app.use("/", authRoutes); // Enable root-level auth routes for callbacks like /auth/github/callback
app.use('/api/blogs', blogRoutes);
app.use('/api', counterRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/progress', progressRoutes);



// --- Product Reviews & Comments Endpoints (BEFORE productRoutes to take priority) ---
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

// POST review for a product
app.post('/api/products/:id/reviews', async (req, res) => {
  try {
    const { user, rating, comment, text, title } = req.body;
    const finalRating = rating || parseInt(req.body.rating);
    const finalComment = comment || text || title;
    
    // Handle user as object or string
    let finalUser = user;
    if (typeof user === 'string') {
      finalUser = user;
    } else if (user && typeof user === 'object') {
      finalUser = user; // Keep as object with name, email, avatarUrl
    } else {
      finalUser = (req.user && req.user.name) || 'Anonymous';
    }
    
    console.log('POST /api/products/:id/reviews', { rating: finalRating, comment: finalComment, user: finalUser });
    
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

// POST comment for a product
app.post('/api/products/:id/comments', async (req, res) => {
  try {
    const { user, text, comment } = req.body;
    const finalText = text || comment;
    
    // Handle user as object or string
    let finalUser = user;
    if (typeof user === 'string') {
      finalUser = user;
    } else if (user && typeof user === 'object') {
      finalUser = user; // Keep as object with name, email, avatarUrl
    } else {
      finalUser = (req.user && req.user.name) || 'Anonymous';
    }
    
    console.log('POST /api/products/:id/comments', { text: finalText, user: finalUser });
    
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

// Like/Unlike review (toggle)
app.post('/api/products/:productId/reviews/:reviewId/like', authToken, async (req, res) => {
  try {
    const { productId, reviewId } = req.params;
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    // Find product with this review
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const review = product.reviews.id(reviewId);
    if (!review) return res.status(404).json({ error: 'Review not found' });

    // Toggle like
    if (!review.likes) review.likes = [];
    const likeIndex = review.likes.findIndex(id => String(id) === String(userId));
    
    if (likeIndex >= 0) {
      // Unlike
      review.likes.splice(likeIndex, 1);
    } else {
      // Like
      review.likes.push(userId);
    }
    
    await product.save();
    res.json({ liked: likeIndex < 0, likes: review.likes.length });
  } catch (err) {
    console.error('Error liking review:', err);
    res.status(500).json({ error: 'Failed to like review' });
  }
});

// Like/Unlike comment (toggle)
app.post('/api/products/:productId/comments/:commentId/like', authToken, async (req, res) => {
  try {
    const { productId, commentId } = req.params;
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    // Find product with this comment
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const comment = product.comments.id(commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    // Toggle like
    if (!comment.likes) comment.likes = [];
    const likeIndex = comment.likes.findIndex(id => String(id) === String(userId));
    
    if (likeIndex >= 0) {
      // Unlike
      comment.likes.splice(likeIndex, 1);
    } else {
      // Like
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

// NOTE: Do not mount authRoutes on '/api/admin' here — admin endpoints
// are defined directly on `app` later in this file. Mounting a router
// on '/api/admin' here would intercept requests and return 404 before
// the real admin handlers run.

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});

const User = require("./models/User");

// API: جلب بيانات المستخدم عبر التوكن أو بالبريد كبديل
app.get('/api/user', async (req, res) => {
    try {
        let userDoc = null;
        const authHeader = req.headers['authorization'];
        if (authHeader) {
            const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwtsecret');
                // support both _id and id in JWT payload
                const userId = decoded && (decoded._id || decoded.id);
                if (userId) {
                    userDoc = await User.findById(userId).lean();
                }
                // fallback: if user not found and token has email, try lookup by email
                if (!userDoc && decoded && decoded.email) {
                    userDoc = await User.findOne({ email: decoded.email }).lean();
                }
            } catch(_) { /* ignore */ }
        }
        // fallback by email query param
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

// API: تحديث بيانات المستخدم الحالي (يمكن للمستخدم تعديل ملفه دون أن يكون أدمن)
app.put('/api/user', authToken, requireAuthToken, async (req, res) => {
    try {
        const userId = req.user && (req.user._id || req.user.id);
        if (!userId) return res.status(401).json({ error: 'يجب تسجيل الدخول' });

        const { name, username, phone } = req.body || {};

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });

        // Only allow updating safe fields for regular users
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

// Block a user (current user blocks target) - this prevents messaging between them
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

// Unblock a user
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

// Check block status between current user and target
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

// Lookup user by username or email
// NOTE: intentionally public so profile pages can resolve a username/email without a token
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

// Public: list active users (for community member list)
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

// API: رفع صورة البروفايل (حقل avatar)
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
            console.log('Looking for user with ID:', userId);
            const user = await User.findById(userId);
            if (!user) {
                console.log('User not found with ID:', userId);
                return res.status(404).json({ error: 'المستخدم غير موجود' });
            }
            console.log('User found:', user.name, user.email);
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

// User routes
app.post('/api/signup', async (req, res) => {
    try {
        const { name, username, email, password, phone } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'اسم المستخدم والبريد وكلمة المرور مطلوبة' });
        }

        // التحقق من صحة البريد الإلكتروني
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'يرجى إدخال بريد إلكتروني صحيح' });
        }

        // تحقق من عدم التكرار
        const existing = await User.findOne({ $or: [{ email }, { username }] });
        if (existing) {
            return res.status(400).json({ message: 'اسم المستخدم أو البريد الإلكتروني مستخدم بالفعل' });
        }

        // تشفير كلمة المرور قبل الحفظ
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);

        // إنشاء رمز التحقق
        const verificationToken = require('crypto').randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ساعة

        const user = new User({
            name: name || username,
            username,
            email,
            password: hashedPassword,
            phone: phone || '',
            verificationToken,
            verificationExpires,
            isVerified: false
        });

        await user.save();

        // إرسال بريد التحقق
        try {
            await sendVerificationEmail(email, verificationToken);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // لا نعيد خطأ هنا، المستخدم تم إنشاؤه بنجاح
        }

        res.json({
            success: true,
            message: 'تم إنشاء الحساب بنجاح. يرجى التحقق من بريدك الإلكتروني لتأكيد الحساب.'
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'اسم المستخدم أو البريد الإلكتروني مستخدم بالفعل' });
        }
        console.error('Signup error:', err);
        res.status(500).json({ message: 'حدث خطأ أثناء إنشاء الحساب' });
    }
});

// OAuth Routes
app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login.html' }),
    (req, res) => {
        const payload = {
            _id: req.user._id,
            email: req.user.email,
            isAdmin: req.user.isAdmin,
            username: req.user.username,
            name: req.user.name
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'jwtsecret', { expiresIn: '7d' });

        // Redirect to frontend with token
        res.redirect(`${process.env.FRONTEND_BASE_URL}/login.html?token=${token}&user=${encodeURIComponent(JSON.stringify(payload))}`);
    }
);

app.get('/api/auth/github', passport.authenticate('github', { scope: ['user:email'] }));

app.get('/api/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/login.html' }),
    (req, res) => {
        const payload = {
            _id: req.user._id,
            email: req.user.email,
            isAdmin: req.user.isAdmin,
            username: req.user.username,
            name: req.user.name
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'jwtsecret', { expiresIn: '7d' });

        res.redirect(`${process.env.FRONTEND_BASE_URL}/login.html?token=${token}&user=${encodeURIComponent(JSON.stringify(payload))}`);
    }
);

app.get('/api/auth/microsoft', passport.authenticate('microsoft'));

app.get('/api/auth/microsoft/callback',
    passport.authenticate('microsoft', { failureRedirect: '/login.html' }),
    (req, res) => {
        const payload = {
            _id: req.user._id,
            email: req.user.email,
            isAdmin: req.user.isAdmin,
            username: req.user.username,
            name: req.user.name
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'jwtsecret', { expiresIn: '7d' });

        res.redirect(`${process.env.FRONTEND_BASE_URL}/login.html?token=${token}&user=${encodeURIComponent(JSON.stringify(payload))}`);
    }
);

// مسار إعادة إرسال بريد التحقق
app.post('/api/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'البريد الإلكتروني مطلوب' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'المستخدم غير موجود' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'الحساب مُؤكد بالفعل' });
        }

        // إنشاء رمز تحقق جديد
        const verificationToken = require('crypto').randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ساعة

        user.verificationToken = verificationToken;
        user.verificationExpires = verificationExpires;
        await user.save();

        // إرسال بريد التحقق
        await sendVerificationEmail(email, verificationToken);

        res.json({ success: true, message: 'تم إرسال بريد التحقق مرة أخرى' });
    } catch (err) {
        console.error('Resend verification error:', err);
        res.status(500).json({ message: 'فشل في إرسال بريد التحقق' });
    }
});

// مسار تأكيد البريد الإلكتروني
app.get('/verify-email', async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) {
            return res.status(400).send(`
                <div dir="rtl" style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h2>خطأ في التحقق</h2>
                    <p>رمز التحقق غير صحيح أو مفقود.</p>
                    <a href="/login.html">العودة لتسجيل الدخول</a>
                </div>
            `);
        }

        const user = await User.findOne({
            verificationToken: token,
            verificationExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).send(`
                <div dir="rtl" style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h2>خطأ في التحقق</h2>
                    <p>رمز التحقق غير صحيح أو منتهي الصلاحية.</p>
                    <a href="/login.html">العودة لتسجيل الدخول</a>
                </div>
            `);
        }

        // تأكيد الحساب
        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationExpires = undefined;
        await user.save();

        res.send(`
            <div dir="rtl" style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h2 style="color: #22c55e;">تم تأكيد الحساب بنجاح! ✅</h2>
                <p>يمكنك الآن تسجيل الدخول إلى حسابك.</p>
                <a href="/login.html" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">تسجيل الدخول</a>
            </div>
        `);
    } catch (err) {
        console.error('Email verification error:', err);
        res.status(500).send(`
            <div dir="rtl" style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h2>خطأ في الخادم</h2>
                <p>حدث خطأ أثناء التحقق من البريد الإلكتروني.</p>
                <a href="/login.html">العودة لتسجيل الدخول</a>
            </div>
        `);
    }
});

// تسجيل الدخول وإرجاع JWT
app.post('/api/login', express.json(), async (req, res) => {
    const { email, password } = req.body;

    // التحقق من صحة البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'يرجى إدخال بريد إلكتروني صحيح' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'البريد الإلكتروني غير مسجل' });

    // التحقق من تأكيد الحساب
    if (!user.isVerified) {
        return res.status(403).json({
            message: 'يجب تأكيد حسابك أولاً. تحقق من بريدك الإلكتروني.',
            requiresVerification: true
        });
    }

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

// ميدل وير مطور للتحقق من التوكن مع دعم Bearer أو إرسال التوكن مباشرة
function authToken(req, res, next) {
    // لوج للتشخيص
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
        // توحيد الحقل _id مع id إذا كان موجودًا فقط في التوكن
        if (user.id && !user._id) user._id = user.id;
        req.user = user;
        next();
    });
}

// Make authToken middleware accessible to route modules if they need to call it
app.set('authToken', authToken);
app.set('requireAuthToken', requireAuthToken);

// إصلاح مسار الحماية لمسارات التعليقات: يجب أن يكون تعريف واحد فقط
app.use('/api/comments', (req, res, next) => {
    console.log('--- [تعليقات] ---', req.method, req.originalUrl, '| Authorization:', req.headers['authorization'] || 'NONE');
    if (!req.headers['authorization']) {
        return res.status(401).json({ error: 'يجب تسجيل الدخول (توكن غير موجود في الهيدر)' });
    }
    next();
}, authToken, commentRoutes);

// إزالة التكرار: لا داعي لتعريف app.use('/api/comments', authToken, commentRoutes) مرتين

// adminRouter intentionally not mounted here — admin endpoints are
// declared directly on the main `app` instance above (e.g. /api/admin/users).
// Mounting the router here previously intercepted requests and returned
// 404 before those handlers could run.

// community routes (posts + replies)
const communityRoutes = require('./routes/communityRoutes');
app.use('/api/community', communityRoutes);

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});



// تحديث كورس
app.put('/api/courses/:id', authToken, requireAuthToken, async (req, res) => {
    try {
        const courseId = req.params.id;
        const { title, description, instructor, duration, price, category, tags, icon, categories, featured, isFree, udemyLink, promoVideo, promoVideoId, promoThumbnail, introVideo } = req.body;

        // Defensive: if client incorrectly sends a POST while intending to update
        // a course, allow update-by-id when an id is provided in the body to
        // avoid creating duplicates. This helps legacy frontends that post
        // instead of using PUT when editing.
        const editId = req.body._id || req.body.id || req.body.courseId || req.body.editingCourseId;
        if (editId) {
            try {
                const toUpdate = await Course.findById(editId);
                if (toUpdate) {
                    // ensure owner or admin (basic check)
                    const userIdStr = req.user && (req.user._id || req.user.id) ? String(req.user._id || req.user.id) : null;
                    const ownerIdStr = toUpdate.createdBy ? String(toUpdate.createdBy) : null;
                    if (userIdStr && ownerIdStr && userIdStr !== ownerIdStr && !(req.user && req.user.isAdmin)) {
                        // not owner and not admin -> forbidden
                        return res.status(403).json({ error: 'غير مصرح بتعديل هذا الكورس' });
                    }

                    // apply provided fields
                    toUpdate.title = title !== undefined ? title : toUpdate.title;
                    toUpdate.description = description !== undefined ? description : toUpdate.description;
                    toUpdate.instructor = instructor !== undefined ? instructor : toUpdate.instructor;
                    toUpdate.duration = duration !== undefined ? duration : toUpdate.duration;
                    toUpdate.price = price !== undefined ? price : toUpdate.price;
                    toUpdate.category = category !== undefined ? category : toUpdate.category;
                    toUpdate.tags = tags !== undefined ? tags : toUpdate.tags;
                    toUpdate.icon = icon !== undefined ? icon : toUpdate.icon;
                    if (categories !== undefined) toUpdate.categories = Array.isArray(categories) ? categories : toUpdate.categories;
                    if (udemyLink !== undefined) toUpdate.udemyLink = udemyLink;
                    if (promoVideoId !== undefined) toUpdate.promoVideoId = promoVideoId;
                    if (promoVideo !== undefined) toUpdate.promoVideo = promoVideo;
                    if (promoThumbnail !== undefined) toUpdate.promoThumbnail = promoThumbnail;
                    if (introVideo !== undefined) toUpdate.introVideo = introVideo;
                    toUpdate.updatedAt = new Date();

                    await toUpdate.save();
                    return res.status(200).json(toUpdate);
                }
            } catch (e) {
                console.warn('Edit-by-id path failed in POST /api/courses:', e && e.message);
                // fall through to normal create/upsert flow
            }
        }

        // Build update data - include all fields that are provided (even if empty)
        const updateData = {};
        
        // Update fields only if they are explicitly provided in the request
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (instructor !== undefined) updateData.instructor = instructor;
        if (duration !== undefined) updateData.duration = duration;
        if (price !== undefined) updateData.price = price;
        if (category !== undefined) updateData.category = category;
        if (tags !== undefined && Array.isArray(tags)) updateData.tags = tags;
        if (icon !== undefined) updateData.icon = icon;
        // allow updating categories array (objects with mainCategory...)
        if (categories !== undefined && Array.isArray(categories)) updateData.categories = categories;
        if (featured !== undefined) updateData.featured = featured;
        if (isFree !== undefined) updateData.isFree = isFree;
        if (udemyLink !== undefined) updateData.udemyLink = udemyLink;
        if (promoVideoId !== undefined) updateData.promoVideoId = promoVideoId;
        if (promoVideo !== undefined) updateData.promoVideo = promoVideo;
        if (promoThumbnail !== undefined) updateData.promoThumbnail = promoThumbnail;
        if (introVideo !== undefined) updateData.introVideo = introVideo;
        
        // Always update the updatedAt timestamp
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


// DELETE course
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

// Patch partial update (used by client to update categories quickly)
app.patch('/api/courses/:id', authToken, requireAuthToken, async (req, res) => {
    try {
        const courseId = req.params.id;
        const updates = req.body || {};

        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ error: 'الكورس غير موجود' });

        // فقط السماح بتحديث الحقول المعروفة
        if (updates.categories && Array.isArray(updates.categories)) {
            course.categories = updates.categories;
        }
        if (updates.udemyLink !== undefined) {
            course.udemyLink = updates.udemyLink;
        }
        if (updates.promoVideo !== undefined) {
            course.promoVideo = updates.promoVideo;
        }
        if (updates.promoThumbnail !== undefined) {
            course.promoThumbnail = updates.promoThumbnail;
        }
        if (updates.introVideo !== undefined) {
            course.introVideo = updates.introVideo;
        }
        // يمكن توسيع هذا إلى حقول أخرى لاحقاً إن لزم

        await course.save();
        res.json(course);
    } catch (err) {
        console.error('خطأ في PATCH /api/courses/:id', err);
        res.status(500).json({ error: 'فشل في تحديث الكورس' });
    }
});

// جلب كورس واحد عبر ID
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





// Admin routes (حماية مسارات الإدارة بالتوكن)

// جلب جميع المستخدمين - للمديرين فقط
app.get('/api/admin/users', authToken, requireAdminToken, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'فشل في جلب المستخدمين' });
    }
});

// إضافة مستخدم جديد - للمديرين فقط
app.post('/api/admin/users', authToken, requireAdminToken, async (req, res) => {
    try {
        console.log('========== POST /api/admin/users ==========');
        console.log('Request body:', req.body);
        
        const { name, username, email, password, phone, isAdmin, role } = req.body;
        
        console.log('Extracted fields:', { name, username, email, phone, isAdmin, role });
        
        // التحقق من الحقول المطلوبة
        if (!name || !username || !email || !password) {
            console.log('Missing required fields');
            return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
        }
        
        console.log('All required fields present, checking for duplicates...');
        
        // التحقق من تكرار البريد الإلكتروني
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('Email already exists:', email);
            return res.status(400).json({ error: 'البريد الإلكتروني مسجل مسبقاً' });
        }
        
        // التحقق من تكرار اسم المستخدم
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            console.log('Username already exists:', username);
            return res.status(400).json({ error: 'اسم المستخدم مسجل مسبقاً' });
        }
        
        console.log('No duplicates found, hashing password...');
        
        // تشفير كلمة المرور
        const bcryptjs = require('bcryptjs');
        const hashedPassword = await bcryptjs.hash(password, 10);
        
        console.log('Password hashed, creating user...');
        
        // إنشاء مستخدم جديد
        const newUser = new User({
            name,
            username,
            email,
            password: hashedPassword,
            phone: phone || '',
            isAdmin: isAdmin === true || isAdmin === 'true' || role === 'admin'
        });
        
        console.log('User object created, saving to database...');
        
        await newUser.save();
        
        console.log('User created successfully:', newUser._id);
        
        res.status(201).json({
            success: true,
            message: 'تمت إضافة المستخدم بنجاح',
            _id: newUser._id,
            name: newUser.name,
            username: newUser.username,
            email: newUser.email,
            phone: newUser.phone,
            isAdmin: newUser.isAdmin,
            created_at: newUser.created_at
        });
    } catch (err) {
        console.error('========== ERROR in POST /api/admin/users ==========');
        console.error('Error message:', err.message);
        console.error('Error name:', err.name);
        console.error('Stack:', err.stack);
        console.error('Full error:', err);
        
        res.status(500).json({ 
            error: 'فشل في إضافة المستخدم',
            details: err.message,
            errorName: err.name
        });
    }
});

// تحديث مستخدم - للمديرين فقط
app.put('/api/admin/users/:userId', authToken, requireAdminToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, username, email, phone, isAdmin, isVerified } = req.body;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'المستخدم غير موجود' });
        }
        
        // تحديث البيانات
        user.name = name || user.name;
        user.username = username || user.username;
        user.email = email || user.email;
        user.phone = phone || user.phone;
        user.isAdmin = isAdmin !== undefined ? isAdmin : user.isAdmin;
        // allow admins to set verification flag
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

// حذف مستخدم - للمديرين فقط
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

// جلب جميع المدونات - للمديرين فقط
app.get('/api/admin/blogs', authToken, requireAdminToken, async (req, res) => {
    try {
        const blogs = await Blog.find().populate('author', 'name username');
        res.json(blogs);
    } catch (err) {
    res.status(500).json({ error: 'فشل في جلب المنشورات' });
    }
});

// إضافة مدونة جديدة - للمديرين فقط
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

// تحديث مدونة - للمديرين فقط
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

// حذف مدونة - للمديرين فقط
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

// جلب جميع الكورسات - للمديرين فقط
app.get('/api/admin/courses', authToken, requireAdminToken, async (req, res) => {
    try {
        const courses = await Course.find().populate('createdBy', 'username');
        res.json(courses);
    } catch (err) {
        res.status(500).json({ error: 'فشل في جلب الكورسات' });
    }
});

// تحديث كورس - للمديرين فقط
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

// حذف كورس - للمديرين فقط
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

// إضافة كورس جديد
app.post('/api/courses', authToken, requireAuthToken, async (req, res) => {
    // Lightweight request logging for debugging duplicate submissions
    try {
        console.log('[/api/courses] Incoming POST — referer:', req.headers.referer || 'NONE', 'user:', (req.user && (req.user._id || req.user.id)) || 'anon');
        try { console.log('[/api/courses] body preview:', JSON.stringify(req.body).slice(0,200)); } catch(_){}
    } catch(_) {}
    try {
        const { title, description, instructor, duration, price, category, tags, icon, categories, featured, isFree, udemyLink, promoVideoId } = req.body;

        // Basic duplicate prevention:
        // 1) If the same creator already has a course with the same title (case-insensitive),
        //    return the existing course.
        // 2) Otherwise, if a course with the same title was created very recently
        //    (within the last 60 seconds) by any creator, assume accidental duplicate
        //    and return the existing course.
        const creatorId = req.user ? req.user._id : (req.body.createdBy || null);
        const normalizedTitleRaw = (title || '').trim();
        const forceCreate = req.body && (req.body.forceCreate === true || req.body.forceCreate === 'true') || (req.query && req.query.force === '1');
        if (normalizedTitleRaw) {
            try {
                // exact-match case-insensitive search
                const titleRegex = { $regex: `^${normalizedTitleRaw.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}$`, $options: 'i' };
                if (creatorId) {
                    const existingByCreator = await Course.findOne({ createdBy: creatorId, title: titleRegex });
                    if (existingByCreator) {
                        console.log('Duplicate course detected for same creator — title:', title);
                        if (!forceCreate) {
                            // Inform client that a course with this title already exists for this user
                            return res.status(409).json({ error: 'CourseExists', message: 'You already have a course with this title', existing: existingByCreator });
                        }
                        console.log('forceCreate requested — will create distinct course despite same title');
                    }
                }

                // recently-created duplicate check (last 60 seconds)
                const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
                const recent = await Course.findOne({ title: titleRegex, created_at: { $gte: oneMinuteAgo } });
                if (recent) {
                    console.log('Recent duplicate detected — title:', title);
                    if (!forceCreate) {
                        return res.status(409).json({ error: 'RecentDuplicate', message: 'A course with this title was created recently', existing: recent });
                    }
                    console.log('forceCreate requested — bypassing recent-duplicate prevention');
                }
            } catch (dupErr) {
                console.warn('Duplicate check failed:', dupErr && dupErr.message);
            }
        }

        // Use atomic upsert with normalizedTitle to avoid race conditions that
        // could create duplicate courses when two POSTs arrive concurrently.
        const creator = req.user ? String(req.user._id) : (req.body.createdBy ? String(req.body.createdBy) : null);
        let normalizedTitleLower = (title || '').trim().toLowerCase();
        if (forceCreate) {
            // ensure normalizedTitle is unique by appending a timestamp
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
            udemyLink: udemyLink || '',
            promoVideoId: promoVideoId || null,
            promoVideo: '',
            promoThumbnail: '',
            introVideo: '',
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

            // If the document was newly inserted, Mongo returns it; if it existed
            // findOneAndUpdate returns the existing doc too (new:true). In both
            // cases return 201 only when inserted; otherwise 200.
            // We can't directly know if it was an insert, but we can try to detect
            // by checking updated.createdAt close to now — but simplest is to
            // return 200 for existing and 201 if createdAt within last 5 seconds.
            const ageMs = Date.now() - new Date(updated.createdAt).getTime();
            const statusCode = ageMs < 5000 ? 201 : 200;
            return res.status(statusCode).json(updated);
        } catch (err) {
            // if unique index violation occurs despite checks, return existing
            if (err && err.code === 11000) {
                try {
                    const existing = await Course.findOne({ createdBy: creator, normalizedTitle: normalizedTitleLower });
                    if (existing) return res.status(200).json(existing);
                } catch (e2) { /* fallthrough */ }
            }
            console.error('خطأ في إنشاء/إيجاد الكورس:', err);
            console.error('Error details:', err.message, err.stack);
            return res.status(500).json({ error: 'حدث خطأ أثناء إضافة الكورس', details: err.message });
        }
    } catch (err) {
        console.error('خطأ في إضافة الكورس:', err);
        console.error('Error details:', err.message, err.stack);
        res.status(500).json({ error: 'حدث خطأ أثناء إضافة الكورس', details: err.message });
    }
});

// إضافة وحدة لكورس
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




app.post(
'/api/courses/:courseId/units/:unitId/lessons',
async (req, res) => {
    // Handle multer file upload with proper error handling
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

    // If multer's fileFilter marked the file as not allowed, return a JSON error
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
const pdfFile = videoFile; // لأنك تستخدم نفس الاسم في الـ form

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
}
);


// تحديث محتوى الكورس بالكامل
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

// جلب محتوى الكورس
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

// تحديث الفيديو الترويجي للكورس
app.put('/api/courses/:courseId/promo-video', authToken, requireAuthToken, async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({ error: 'الكورس غير موجود' });
        }

        // Check if user is admin or course creator
        const userId = req.user && (req.user._id || req.user.id);
        const isAdmin = req.user && req.user.isAdmin;
        const isCreator = course.createdBy && String(course.createdBy) === String(userId);

        if (!isAdmin && !isCreator) {
            return res.status(403).json({ error: 'غير مصرح لك بتعديل هذا الكورس' });
        }

        const { promoVideo, promoThumbnail } = req.body;

        // Handle file uploads if present
        if (req.files) {
            if (req.files.promoVideoFile && req.files.promoVideoFile[0]) {
                const videoFile = req.files.promoVideoFile[0];
                course.promoVideo = `/uploads/${videoFile.filename}`;
            }

            if (req.files.promoThumbnailFile && req.files.promoThumbnailFile[0]) {
                const thumbnailFile = req.files.promoThumbnailFile[0];
                course.promoThumbnail = `/uploads/${thumbnailFile.filename}`;
            }
        }

        // Update URL fields if provided
        if (promoVideo !== undefined) {
            course.promoVideo = promoVideo;
        }
        if (promoThumbnail !== undefined) {
            course.promoThumbnail = promoThumbnail;
        }

        course.updatedAt = new Date();
        await course.save();

        res.json({
            success: true,
            message: 'تم تحديث الفيديو الترويجي بنجاح',
            promoVideo: course.promoVideo,
            promoThumbnail: course.promoThumbnail
        });
    } catch (err) {
        console.error('خطأ في تحديث الفيديو الترويجي:', err);
        res.status(500).json({ error: 'فشل في تحديث الفيديو الترويجي' });
    }
});

// حذف وحدة
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

// جلب درس واحد
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

// تحديث درس
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

        // تحديث بيانات الدرس
        lesson.title = title || lesson.title;
        lesson.description = description || lesson.description;
        lesson.duration = duration || lesson.duration;
        lesson.type = type || lesson.type;
        lesson.isFree = isFree !== undefined ? isFree : lesson.isFree;
        
        // Update media fields if provided - do not rely solely on the 'type' value
        if (typeof videoUrl !== 'undefined') {
            lesson.videoUrl = videoUrl;
            // clear other media to avoid conflicts
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

// حذف درس
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

        // دعم فلترة حسب التصنيفات: ?categories=programming&categories=web-development
        if (req.query && req.query.categories) {
            const cats = Array.isArray(req.query.categories) ? req.query.categories : [req.query.categories];
            // ابحث عن أي كورس يحتوي على mainCategory داخل المصفوفة
            filter['categories.mainCategory'] = { $in: cats };
        }

        const courses = await Course.find(filter);
        res.json(courses);
    } catch (err) {
        console.error('GET /api/courses failed', err);
        res.status(500).json({ error: 'حدث خطأ أثناء جلب الكورسات' });
    }
});

// جلب المدونات العامة
app.get('/api/blogs', async (req, res) => {
    try {
        const blogs = await Blog.find().populate('author', 'name username');
        res.json(blogs);
    } catch (err) {
        res.status(500).json({ error: 'فشل في جلب المدونات' });
    }
});

// جلب الدروس المكتملة للمستخدم (اختياري، يستخدمه الواجهة لعرض التقدم)
app.get('/api/user/lessons/completed', authToken, requireAuthToken, async (req, res) => {
    try {
        const userId = req.user && req.user._id;
        if (!userId) return res.status(400).json({ error: 'المستخدم غير محدد' });
        const user = await User.findById(userId).lean();
        if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });

        // جمع الدروس المكتملة عبر كل الكورسات
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


// جلب جميع المنتجات مع تصفية بسيطة
app.get('/api/products', async (req, res) => {
    try {
        const { search, category, minPrice, maxPrice, sort } = req.query;

        // بناء فلتر البحث
        const filter = {};
        if (search) {
            const regex = new RegExp(search, 'i'); // حساس لحالة الأحرف
            filter.$or = [
                { name: regex },
                { description: regex },
                { 'category.name': regex } // ابحث في اسم التصنيف الفرعي
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

        // جلب المنتجات مع التصنيف
        const products = await Product.find(filter)
            .populate('category', 'name') // اجلب اسم التصنيف فقط
            .sort({ createdAt: -1 }) // ترتيب حسب تاريخ الإضافة تنازلياً
            .lean();

        // تطبيق الفرز على مستوى التطبيق إذا لزم الأمر
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


// Protected routes (حماية عبر التوكن فقط)
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
            if (err2) return; // سيقوم الميدل وير بإرجاع الرد في حالة الخطأ
            res.sendFile(path.join(__dirname, '..', 'twm3-backend/private/dashboard.html'));
        });
    });
});

app.get('/dashboard.html', authToken, requireAuthToken, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dashboard.html'));
});


app.use("/twm3-backend/private", authToken, requireAdminToken, express.static(path.join(__dirname, "private")));

// Admin helper: list products with missing image files (for troubleshooting)
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

// Custom error handler for all errors
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    
    // Always return JSON, never HTML
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        status: err.status || 500
    });
});

// Catch-all handler for any unhandled routes to return JSON instead of HTML
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Route not found',
        status: 404 
    });
});

// Create HTTP server and attach Socket.IO (so routes can access io via req.app.get('io'))
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5000', 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://127.0.0.1:5000'],
        methods: ['GET', 'POST']
    }
});
app.set('io', io);

// Authenticate socket connections using the token provided in handshake.auth.token
io.use((socket, next) => {
    try {
        const token = socket.handshake && socket.handshake.auth && socket.handshake.auth.token;
        if (!token) return next(); // allow unauthenticated sockets too (optional)
        jwt.verify(token, process.env.JWT_SECRET || 'jwtsecret', (err, decoded) => {
            if (err) {
                console.warn('Socket auth failed:', err && err.message);
                return next();
            }
            // normalize id
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

    // Auto-join the user's room if authenticated
    try { if (socket.userId) socket.join(socket.userId); } catch (e) { console.error('Auto-join room failed', e); }

    // Support legacy client 'join' call as well
    socket.on('join', (userId) => {
        try { if (userId) socket.join(userId); } catch (e) { console.error('join handler failed', e); }
    });

    socket.on('disconnect', (reason) => {
        // optional logging
        // console.log('Socket disconnected', socket.id, reason);
    });
});








// تحديد المجلد الرئيسي مرة واحدة فقط في بداية الملف أو هنا
const rootDirectory = path.resolve(__dirname, '..');

// 1. مسار الصفحة الرئيسية
app.get('/', (req, res) => {
    const indexPath = path.join(rootDirectory, 'index.html');
    if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
    }
    res.redirect("https://twm3.org");
});

// 2. نظام تنقل ذكي لجميع الصفحات (بما فيها الكورسات)
app.get('/:page', (req, res) => {
    const pageName = req.params.page.replace('.html', ''); // تنظيف الاسم
    
    // قائمة بالأماكن المحتملة للملف
    const paths = [
        path.join(rootDirectory, `${pageName}.html`),
        path.join(rootDirectory, 'Pages', `${pageName}.html`),
        path.join(rootDirectory, 'Pages', 'courses', `${pageName}.html`)
    ];

    const foundPath = paths.find(p => fs.existsSync(p));

    if (foundPath) {
        res.sendFile(foundPath);
    } else {
        res.status(404).send("الصفحة غير موجودة - يرجى التأكد من مسار الملف في السيرفر");
    }
});




// Start server بعد التأكد من اتصال قاعدة البيانات
mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("MongoDB connected");
        

        
        const port = parseInt(process.env.PORT || PORT || 5000, 10);
        const maxRetries = 5;
        let attempt = 0;

        function tryListen(p) {
            // attach an error handler for this attempt only
            server.once('error', (err) => {
                if (err && err.code === 'EADDRINUSE') {
                    attempt++;
                    if (attempt <= maxRetries) {
                        const nextPort = p + 1;
                        console.warn(`Port ${p} in use; trying port ${nextPort} (attempt ${attempt}/${maxRetries})`);
                        tryListen(nextPort);
                    } else {
                        console.error(`Port ${p} still in use after ${maxRetries} attempts; exiting.`);
                        process.exit(1);
                    }
                } else {
                    console.error('Server listen error:', err);
                    process.exit(1);
                }
            });

            server.listen(p, () => {
                console.log(`Server is running on http://localhost:${p}`);
            });
        }

        tryListen(port);
    })
    .catch(err => {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    });