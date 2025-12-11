const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    // Support either "Bearer <token>" or raw token in Authorization header
    const authHeader = req.headers.authorization;
    let token = null;
    if (authHeader) {
      token = authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : authHeader;
    }
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwtsecret');
    // Normalize id field
    if (decoded && decoded.id && !decoded._id) decoded._id = decoded.id;
    if (!decoded || !decoded._id) return res.status(401).json({ error: 'Invalid token payload' });

    const user = await User.findById(decoded._id).lean();
    if (!user) return res.status(401).json({ error: 'User not found' });

    // attach minimal user info to req
    req.user = { _id: String(user._id), email: user.email, isAdmin: !!user.isAdmin, name: user.name, username: user.username };
    return next();
  } catch (err) {
    console.error('Auth middleware error:', err && err.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};
