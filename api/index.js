const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

require("dotenv").config();

const app = express();

// Middleware Configuration
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
        ? ['https://twm3.org', 'https://www.twm3.org', 'https://api.twm3.org']
        : ['http://localhost:5000', 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://127.0.0.1:5000'],
    credentials: true
}));

app.use(express.json());

// Import and use routes from twm3-backend
try {
    const blogRoutes = require('../twm3-backend/routes/blogRoutes');
    const commentRoutes = require('../twm3-backend/routes/commentRoutes');
    const messageRoutes = require('../twm3-backend/routes/messageRoutes');
    const notificationRoutes = require('../twm3-backend/routes/notificationRoutes');
    const courseRoutes = require('../twm3-backend/routes/courseRoutes');
    const productRoutes = require('../twm3-backend/routes/productRoutes');
    const dataDeletionRoutes = require('../twm3-backend/routes/dataDeletion');
    
    app.use('/api/blogs', blogRoutes);
    app.use('/api/comments', commentRoutes);
    app.use('/api/messages', messageRoutes);
    app.use('/api/notifications', notificationRoutes);
    app.use('/api/courses', courseRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/delete', dataDeletionRoutes);
} catch (err) {
    console.warn('Some routes could not be loaded:', err.message);
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

// Default endpoint
app.get('/', (req, res) => {
    res.status(200).json({ message: 'API is running' });
});

// Export app for Vercel Serverless Functions
module.exports = app;

