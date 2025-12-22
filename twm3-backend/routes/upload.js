const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
// Use the auth middleware directly (it's exported as default)
const authenticateToken = require('../middlewares/auth');
// Generate unique ID (using Date.now + random instead of uuid)
function generateUniqueId() {
    return Date.now() + '-' + Math.round(Math.random() * 1E9);
}

// Configure multer for video uploads
const videoStorage = multer.diskStorage({
    destination: async function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../public/uploads/videos');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: function (req, file, cb) {
        // Generate a unique ID and keep the original extension
        const uniqueId = generateUniqueId();
        const ext = path.extname(file.originalname);
        cb(null, uniqueId + ext);
    }
});

// Configure multer for PDF uploads
const pdfStorage = multer.diskStorage({
    destination: async function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../public/uploads/pdfs');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: function (req, file, cb) {
        const uniqueId = generateUniqueId();
        cb(null, uniqueId + '.pdf');
    }
});

// File filters
const videoFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
        cb(null, true);
    } else {
        cb(new Error('Not a video file'), false);
    }
};

const pdfFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Not a PDF file'), false);
    }
};

const videoUpload = multer({
    storage: videoStorage,
    fileFilter: videoFilter,
    limits: {
        fileSize: 500 * 1024 * 1024 // 500 MB
    }
});

const pdfUpload = multer({
    storage: pdfStorage,
    fileFilter: pdfFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50 MB
    }
});

// Upload video endpoint
router.post('/video', authenticateToken, videoUpload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Return the file URL
        const fileUrl = `/uploads/videos/${req.file.filename}`;
        res.json({
            url: fileUrl,
            filename: req.file.filename,
            originalname: req.file.originalname
        });
    } catch (error) {
        console.error('Video upload error:', error);
        res.status(500).json({ error: 'Failed to upload video' });
    }
});

// Upload PDF endpoint
router.post('/pdf', authenticateToken, pdfUpload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Return the file URL
        const fileUrl = `/uploads/pdfs/${req.file.filename}`;
        res.json({
            url: fileUrl,
            filename: req.file.filename,
            originalname: req.file.originalname
        });
    } catch (error) {
        console.error('PDF upload error:', error);
        res.status(500).json({ error: 'Failed to upload PDF' });
    }
});

// Configure multer for image uploads (for notifications)
const imageStorage = multer.diskStorage({
    destination: async function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../public/uploads/notifications');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: function (req, file, cb) {
        const uniqueId = generateUniqueId();
        const ext = path.extname(file.originalname);
        cb(null, uniqueId + ext);
    }
});

const imageFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image file'), false);
    }
};

const imageUpload = multer({
    storage: imageStorage,
    fileFilter: imageFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10 MB
    }
});

// Upload image endpoint (for notifications)
router.post('/notification-image', authenticateToken, imageUpload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileUrl = `/uploads/notifications/${req.file.filename}`;
        res.json({
            url: fileUrl,
            filename: req.file.filename,
            originalname: req.file.originalname
        });
    } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

// Upload video endpoint (for notifications) - reuse video upload
router.post('/notification-video', authenticateToken, videoUpload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileUrl = `/uploads/videos/${req.file.filename}`;
        res.json({
            url: fileUrl,
            filename: req.file.filename,
            originalname: req.file.originalname
        });
    } catch (error) {
        console.error('Video upload error:', error);
        res.status(500).json({ error: 'Failed to upload video' });
    }
});

// Error handling middleware
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'File too large'
            });
        }
    }
    console.error('Upload error:', error);
    res.status(500).json({
        error: 'Upload failed'
    });
});

module.exports = router;