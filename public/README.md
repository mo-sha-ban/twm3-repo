# TWM3 - Educational Platform

Educational platform with courses, community features, and e-learning capabilities.

## 📋 Project Overview

TWM3 is a comprehensive educational platform built with:
- **Frontend:** HTML/CSS/JavaScript (Hostinger)
- **Backend:** Node.js + Express (Railway)
- **Database:** MongoDB Atlas

## 🚀 Deployment

### Frontend
- **URL:** https://twm3.org
- **Platform:** Hostinger

### Backend API
- **URL:** https://api.twm3.org
- **Platform:** Railway

## 📦 Tech Stack

### Backend
- Node.js v22
- Express.js
- MongoDB
- Socket.io
- Nodemailer
- OAuth (Google, GitHub)

### Frontend
- HTML5
- CSS3
- JavaScript (Vanilla)
- Responsive Design

## 🔐 Features

- User Authentication (Email, Google, GitHub OAuth)
- Course Management
- Community Forum
- File Uploads
- Email Notifications
- Real-time Notifications via Socket.io
- User Profile Management
- Data Deletion on Request

## 📝 Documentation

- [Railway Deployment Guide](./RAILWAY_DEPLOYMENT_GUIDE.md)
- [Quick Start Guide](./RAILWAY_QUICK_START.md)
- [Environment Variables](./ENVIRONMENT_VARIABLES.md)
- [Deployment Configuration](./deployment-config.json)

## 🛠️ Installation

### Backend Setup

1. Install dependencies:
```bash
cd twm3-backend
npm ci --omit=dev
```

2. Set environment variables in `.env.production`

3. Start the server:
```bash
npm start
```

## 🌐 API Endpoints

Base URL: `https://api.twm3.org`

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `GET /api/auth/google/callback` - Google OAuth
- `GET /api/auth/github/callback` - GitHub OAuth

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course details
- `POST /api/courses` - Create course (admin)
- `PUT /api/courses/:id` - Update course (admin)
- `DELETE /api/courses/:id` - Delete course (admin)

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile
- `DELETE /api/profile` - Delete account

### Messages
- `GET /api/messages` - Get messages
- `POST /api/messages` - Send message
- `PUT /api/messages/mark-all-read` - Mark messages as read

## 📊 Environment Variables

```env
# Server
PORT=5000
NODE_ENV=production

# Database
MONGO_URI=mongodb+srv://...

# Security
SESSION_SECRET=...
JWT_SECRET=...

# OAuth - Google
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=https://api.twm3.org/api/auth/google/callback

# OAuth - GitHub
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_CALLBACK_URL=https://api.twm3.org/api/auth/github/callback

# Frontend
FRONTEND_BASE_URL=https://twm3.org
```

## 🐳 Docker

### Build Image
```bash
docker build -t twm3-backend -f twm3-backend/Dockerfile .
```

### Run Container
```bash
docker run -p 5000:5000 --env-file twm3-backend/.env.production twm3-backend
```

Or with Docker Compose:
```bash
docker-compose up -d
```

## 🚢 Railway Deployment

1. Connect GitHub repository
2. Set environment variables in Railway Dashboard
3. Deploy

See [Railway Deployment Guide](./RAILWAY_DEPLOYMENT_GUIDE.md) for detailed instructions.

## 📞 Support

For issues and questions, please refer to:
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [FAQ](./FAQ.md)

## 📄 License

ISC

## 👥 Team

- Backend Development
- Database Management
- DevOps & Deployment

---

**Last Updated:** December 6, 2025  
**Status:** Production Ready ✅
