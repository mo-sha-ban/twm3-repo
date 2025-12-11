const express = require('express');
const router = express.Router();
const controller = require('../controllers/communityController');

// authToken is defined in server.js and attached to req via requiring the server file
// We'll require it from server.js at mount time by referring to req.app.get('auth') if needed.

// GET /api/community/posts
router.get('/posts', controller.getPosts);

// POST /api/community/posts  (create new post) - requires auth
router.post('/posts', (req, res, next) => {
    // defer to server's authToken middleware if available
    if (req.app && req.app.get('authToken')) return req.app.get('authToken')(req, res, () => controller.createPost(req, res));
    return controller.createPost(req, res);
});

// POST /api/community/posts/:postId/replies
router.post('/posts/:postId/replies', (req, res, next) => {
    if (req.app && req.app.get('authToken')) return req.app.get('authToken')(req, res, () => controller.replyToPost(req, res));
    return controller.replyToPost(req, res);
});

// POST /api/community/posts/:postId/like
router.post('/posts/:postId/like', (req, res, next) => {
    if (req.app && req.app.get('authToken')) return req.app.get('authToken')(req, res, () => controller.toggleLike(req, res));
    return controller.toggleLike(req, res);
});

module.exports = router;
