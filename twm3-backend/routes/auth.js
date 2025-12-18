const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const User = require("../models/User.js");
const Course = require("../models/Course.js");
const Blog = require('../models/Blog');
const mongoose = require('mongoose');
const fetch = require('node-fetch');
const querystring = require('querystring');
const passport = require('passport');

const router = express.Router();

// OAuth config
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/auth/google/callback';
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/auth/github/callback';
const FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID;
const FACEBOOK_CLIENT_SECRET = process.env.FACEBOOK_CLIENT_SECRET;
const FACEBOOK_CALLBACK_URL = process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:5000/auth/facebook/callback';
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || 'http://localhost:5000';

// Google OAuth endpoints
const { OAuth2Client } = require('google-auth-library');
// Config endpoint for frontend
router.get('/config', (req, res) => {
    res.json({
        FRONTEND_BASE_URL: process.env.FRONTEND_BASE_URL || 'http://localhost:5000',
        GOOGLE_ENABLED: !!process.env.GOOGLE_CLIENT_ID,
        GITHUB_ENABLED: !!process.env.GITHUB_CLIENT_ID,
        MICROSOFT_ENABLED: !!process.env.MICROSOFT_CLIENT_ID
    });
});

// Facebook OAuth has been disabled by the administrator.
// The routes remain as no-op endpoints returning 410 Gone so any old clients or links
// receive a clear response without breaking the server.
router.get('/auth/facebook', (req, res) => {
    return res.status(410).json({ error: 'Facebook login has been disabled by the site administrator' });
});

router.get('/auth/facebook/callback', (req, res) => {
    return res.status(410).json({ error: 'Facebook login has been disabled by the site administrator' });
});

// Google OAuth route
router.get('/auth/google', (req, res) => {
    try {
        const scope = [
            'openid',
            'email',
            'profile'
        ];
        const params = {
            client_id: GOOGLE_CLIENT_ID,
            redirect_uri: GOOGLE_CALLBACK_URL,
            response_type: 'code',
            scope: scope.join(' '),
            access_type: 'offline',
            include_granted_scopes: 'true',
            prompt: 'consent'
        };
        // carry state if provided (e.g., state=signup)
        if (req.query && req.query.state) params.state = String(req.query.state);
        const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + querystring.stringify(params);
        return res.redirect(authUrl);
    } catch (err) {
        console.error('Error in /auth/google', err);
        return res.status(500).json({ error: 'Failed to start Google OAuth' });
    }
});

// Google OAuth callback
router.get('/auth/google/callback', async (req, res) => {
    try {
        const code = req.query.code;
        if (!code) return res.status(400).json({ error: 'Missing code' });

        // Exchange code for tokens
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: querystring.stringify({
                code,
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                redirect_uri: GOOGLE_CALLBACK_URL,
                grant_type: 'authorization_code'
            })
        });
        const tokenJson = await tokenRes.json();
        if (!tokenRes.ok) {
            console.error('Google token exchange failed:', tokenJson);
            return res.status(400).json({ error: 'Google token exchange failed', details: tokenJson });
        }
        const idToken = tokenJson.id_token;
        if (!idToken) return res.status(400).json({ error: 'No id_token returned from Google' });

        // Verify id_token
        const oAuth2Client = new OAuth2Client(GOOGLE_CLIENT_ID);
        const ticket = await oAuth2Client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
        const payload = ticket.getPayload();
        const googleId = payload.sub;
        const email = payload.email;
        const name = payload.name || email.split('@')[0];
        const picture = payload.picture;
        const emailVerified = !!payload.email_verified;

        if (!email) return res.status(400).json({ error: 'Email missing in Google profile' });

        // Find or create user
        let user = await User.findOne({ $or: [ { provider: 'google', providerId: googleId }, { email } ] });
        if (!user) {
            // create username from email, ensure uniqueness
            let baseUsername = (email.split('@')[0] || 'user').replace(/[^a-zA-Z0-9_\-\.]/g, '').slice(0,20) || 'user';
            let username = baseUsername;
            let i = 1;
            while (await User.findOne({ username })) {
                username = baseUsername + i;
                i++;
            }
            user = new User({
                name: name || username,
                username,
                email,
                password: '',
                provider: 'google',
                providerId: googleId,
                isVerified: emailVerified,
                avatarUrl: picture || ''
            });
            await user.save();
        } else {
            // update provider fields if missing
            let changed = false;
            if (!user.provider || user.provider === 'local') { user.provider = 'google'; changed = true; }
            if (!user.providerId) { user.providerId = googleId; changed = true; }
            if (picture && user.avatarUrl !== picture) { user.avatarUrl = picture; changed = true; }
            if (emailVerified && !user.isVerified) { user.isVerified = true; changed = true; }
            if (changed) await user.save();
        }

        // issue JWT
        const jwtPayload = {
            _id: user._id,
            email: user.email,
            isAdmin: user.isAdmin,
            username: user.username,
            name: user.name,
            picture: user.avatarUrl || picture,
            provider: 'google',
            providerId: googleId
        };
        const token = jwt.sign(jwtPayload, process.env.JWT_SECRET || 'jwtsecret', { expiresIn: '7d' });

        // redirect to frontend with token and picture URL
        const state = req.query && req.query.state ? String(req.query.state) : '';
        let redirectUrl = FRONTEND_BASE_URL + '/login.html?token=' + encodeURIComponent(token);
        if (picture) {
            redirectUrl += '&picture=' + encodeURIComponent(picture);
        }
        if (state) {
            redirectUrl += '&state=' + encodeURIComponent(state);
        }
        return res.redirect(redirectUrl);
    } catch (err) {
        console.error('Error in /auth/google/callback', err);
        return res.status(500).json({ error: 'Failed to complete Google OAuth' });
    }
});

// GitHub OAuth route
router.get('/auth/github', (req, res) => {
    try {
        const scope = ['read:user', 'user:email'];
        const params = {
            client_id: GITHUB_CLIENT_ID,
            redirect_uri: GITHUB_CALLBACK_URL,
            scope: scope.join(' ')
        };
        // carry state if provided (e.g., state=signup)
        if (req.query && req.query.state) params.state = String(req.query.state);
        const authUrl = 'https://github.com/login/oauth/authorize?' + querystring.stringify(params);
        return res.redirect(authUrl);
    } catch (err) {
        console.error('Error in /auth/github', err);
        return res.status(500).json({ error: 'Failed to start GitHub OAuth' });
    }
});

// GitHub OAuth callback
router.get('/auth/github/callback', async (req, res) => {
    try {
        const code = req.query.code;
        if (!code) return res.status(400).json({ error: 'Missing code' });

        // Exchange code for access token
        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                client_id: GITHUB_CLIENT_ID,
                client_secret: GITHUB_CLIENT_SECRET,
                code: code,
                redirect_uri: GITHUB_CALLBACK_URL
            })
        });
        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) {
            console.error('GitHub token exchange failed:', tokenData);
            return res.status(400).json({ error: 'GitHub token exchange failed' });
        }

        // Get user profile
        const userRes = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Accept': 'application/json'
            }
        });
        const userData = await userRes.json();
        
        // Get user emails if not public
        const emailRes = await fetch('https://api.github.com/user/emails', {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Accept': 'application/json'
            }
        });
        const emails = await emailRes.json();
        
        // Get primary email
        const primaryEmail = emails.find(e => e.primary)?.email || emails[0]?.email || userData.email;
        if (!primaryEmail) {
            return res.status(400).json({ error: 'No email found in GitHub profile' });
        }

        const githubId = userData.id.toString();
        const name = userData.name || userData.login;
        const picture = userData.avatar_url;
        
        // Find or create user
        let user = await User.findOne({ $or: [{ provider: 'github', providerId: githubId }, { email: primaryEmail }] });
        if (!user) {
            // create username from GitHub login, ensure uniqueness
            let baseUsername = (userData.login || 'user').replace(/[^a-zA-Z0-9_\-\.]/g, '').slice(0,20);
            let username = baseUsername;
            let i = 1;
            while (await User.findOne({ username })) {
                username = baseUsername + i;
                i++;
            }
            user = new User({
                name: name || username,
                username,
                email: primaryEmail,
                password: '',
                provider: 'github',
                providerId: githubId,
                isVerified: true, // GitHub verifies emails
                avatarUrl: picture || ''
            });
            await user.save();
        } else {
            // update provider fields if missing
            let changed = false;
            if (!user.provider || user.provider === 'local') { user.provider = 'github'; changed = true; }
            if (!user.providerId) { user.providerId = githubId; changed = true; }
            if (picture && user.avatarUrl !== picture) { user.avatarUrl = picture; changed = true; }
            if (!user.isVerified) { user.isVerified = true; changed = true; }
            if (changed) await user.save();
        }

        // issue JWT
        const jwtPayload = {
            _id: user._id,
            email: user.email,
            isAdmin: user.isAdmin,
            username: user.username,
            name: user.name,
            picture: user.avatarUrl || picture,
            provider: 'github',
            providerId: githubId
        };
        const token = jwt.sign(jwtPayload, process.env.JWT_SECRET || 'jwtsecret', { expiresIn: '7d' });

        // redirect to frontend with token and picture URL
        const state = req.query && req.query.state ? String(req.query.state) : '';
        let redirectUrl = FRONTEND_BASE_URL + '/login.html?token=' + encodeURIComponent(token);
        if (picture) {
            redirectUrl += '&picture=' + encodeURIComponent(picture);
        }
        if (state) {
            redirectUrl += '&state=' + encodeURIComponent(state);
        }
        return res.redirect(redirectUrl);
    } catch (err) {
        console.error('Error in /auth/github/callback', err);
        return res.status(500).json({ error: 'Failed to complete GitHub OAuth' });
    }
});

// Microsoft OAuth route
router.get('/auth/microsoft', passport.authenticate('microsoft', { prompt: 'select_account' }));

// Microsoft OAuth callback
router.get('/auth/microsoft/callback', passport.authenticate('microsoft', { session: false, failureRedirect: '/login.html' }), (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.redirect(FRONTEND_BASE_URL + '/login.html?error=auth_failed');
        }

        // issue JWT
        const jwtPayload = {
            _id: user._id,
            email: user.email,
            isAdmin: user.isAdmin,
            username: user.username,
            name: user.name,
            picture: user.avatarUrl,
            provider: 'microsoft',
            providerId: user.providerId
        };
        const token = jwt.sign(jwtPayload, process.env.JWT_SECRET || 'jwtsecret', { expiresIn: '7d' });

        // redirect to frontend with token and picture URL
        let redirectUrl = FRONTEND_BASE_URL + '/login.html?token=' + encodeURIComponent(token);
        if (user.avatarUrl) {
            redirectUrl += '&picture=' + encodeURIComponent(user.avatarUrl);
        }
        
        return res.redirect(redirectUrl);
    } catch (err) {
        console.error('Error in /auth/microsoft/callback', err);
        return res.redirect(FRONTEND_BASE_URL + '/login.html?error=server_error');
    }
});

// Regular auth routes
router.post("/signup", async (req, res) => {
    try {
        const { name, username, email, password, phone } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: "اسم المستخدم والبريد وكلمة المرور مطلوبة" });
        }

        const exist = await User.findOne({ $or: [{ email }, { username }] });
        if (exist) return res.status(400).json({ message: "اسم المستخدم أو البريد الإلكتروني مستخدم بالفعل" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name: name || username,
            username,
            email,
            password: hashedPassword,
            phone: phone || ''
        });
        await user.save();

        res.json({ success: true });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: "اسم المستخدم أو البريد الإلكتروني مستخدم بالفعل" });
        }
        res.status(500).json({ message: "حدث خطأ أثناء إنشاء الحساب" });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'البريد الإلكتروني غير مسجل' });

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
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
});

module.exports = router;