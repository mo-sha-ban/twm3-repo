const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
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

// Serve static files from parent directory (Vercel root)
app.use(express.static(path.join(__dirname, '..')));

// Explicit routes for static directories
app.use('/css', express.static(path.join(__dirname, '../css')));
app.use('/js', express.static(path.join(__dirname, '../js')));
app.use('/img', express.static(path.join(__dirname, '../img')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));
app.use('/pdfjs', express.static(path.join(__dirname, '../pdfjs')));

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

// 404 - Error handler (must be before final catch-all)
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Final catch-all: serve SPA routing
app.use((req, res) => {
    // If it's an API call, return 404
    if (req.path.startsWith('/api') || req.path.startsWith('/auth') || req.path.startsWith('/upload')) {
        return res.status(404).json({ error: 'Not Found' });
    }
    
    // Otherwise try to serve the file, or fall back to index.html
    const filePath = path.join(__dirname, '..', req.path);
    
    // Check if file exists
    try {
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            res.sendFile(filePath);
        } else {
            res.sendFile(path.join(__dirname, '../index.html'));
        }
    } catch (err) {
        res.sendFile(path.join(__dirname, '../index.html'));
    }
});

// Export app for Vercel Serverless Functions
module.exports = app;

