const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const helmet = require('helmet');

require("dotenv").config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB connection error:", err));

// Basic route
app.get('/api', (req, res) => {
    res.json({ message: 'API is working!' });
});

// Export for Vercel
module.exports = app;