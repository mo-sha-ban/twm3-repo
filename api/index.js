const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const helmet = require('helmet');
const path = require('path');

require("dotenv").config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://twm3.org', 'https://www.twm3.org', 'https://api.twm3.org']
        : ['http://localhost:5000', 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://127.0.0.1:5000'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const mongoUri = process.env.MONGO_URI;
if (mongoUri) {
    mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
        .then(() => console.log("MongoDB connected"))
        .catch(err => console.error("MongoDB connection error:", err));
}

// Root route - redirect to frontend
app.get('/', (req, res) => {
    res.redirect('https://twm3.org');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Import API Routes from twm3-backend
try {
    const authRoutes = require('../twm3-backend/routes/auth');
    const courseRoutes = require('../twm3-backend/routes/courseRoutes');
    const productRoutes = require('../twm3-backend/routes/productRoutes');
    const blogRoutes = require('../twm3-backend/routes/blogRoutes');
    const courseRoutesModule = require('../twm3-backend/routes/courseRoutes');
    const counterRoutes = require('../twm3-backend/routes/counterRoutes');
    const progressRoutes = require('../twm3-backend/routes/progressRoutes');

    // Register API Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/courses', courseRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/blogs', blogRoutes);
    app.use('/api', counterRoutes);
    app.use('/api/progress', progressRoutes);

    console.log('✅ API routes loaded successfully');
} catch (err) {
    console.error('⚠️ Error loading routes:', err.message);
}

// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, '../twm3-backend/public/uploads')));

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found', path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Export for Vercel
module.exports = app;