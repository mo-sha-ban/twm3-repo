// Simple test endpoint for Vercel
module.exports = (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'API is working!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
};