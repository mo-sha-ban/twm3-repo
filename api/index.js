const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

require("dotenv").config();

const app = express();

// Minimal middleware for security and CORS
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://twm3.org', 'https://www.twm3.org', 'https://api.twm3.org', 'https://twm3-repo.vercel.app']
        : ['http://localhost:5000', 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://127.0.0.1:5000'],
    credentials: true,
}));
app.use(express.json());


// --- API ROUTES ---

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

// Counter config endpoint
app.get('/api/counter-config', (req, res) => {
    res.json({
        baseCount: 50000,
        dailyIncrement: 20,
        startDate: new Date('2024-01-01').getTime()
    });
});

// Courses endpoint - directly serves courses.json
app.get('/api/courses', (req, res) => {
    const coursesPath = path.join(__dirname, '../courses.json');
    try {
        if (fs.existsSync(coursesPath)) {
            // Let's read and send the file content directly
            res.sendFile(coursesPath);
        } else {
            res.status(404).json({ error: 'courses.json not found' });
        }
    } catch (error) {
        console.error('Error handling /api/courses:', error);
        res.status(500).json({ error: 'Failed to get courses data' });
    }
});


// --- ERROR HANDLER ---
// This should be the last middleware
app.use((err, req, res, next) => {
    console.error('❌ Internal Server Error:', err.message);
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Internal Server Error', 
        message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : 'A server error occurred'
    });
});

// Generic 404 for any unhandled /api routes
// This should come after all other API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});


// Export app for Vercel
module.exports = app;