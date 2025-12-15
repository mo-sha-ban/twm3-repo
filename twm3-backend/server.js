const express = require('express');
const mongoose = require("mongoose");
const cors = require('cors');
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============ LOGGING ============
console.log('🚀 ============ TWM3 BACKEND STARTING ============');
console.log('📅', new Date().toISOString());
console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
console.log('🎯 PORT:', PORT);
console.log('📁 __dirname:', __dirname);
console.log('==================================================');

// ============ MIDDLEWARE ============
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5000', 'https://*.railway.app', 'https://twm3.org'],
    credentials: true
}));

app.use(express.json());

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// ============ FIXED ROUTES ============
// Test routes
app.get('/health', (req, res) => {
    res.json({ 
        status: 'UP', 
        server: 'TWM3 Backend',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

app.get('/ping', (req, res) => {
    res.json({ message: 'pong', timestamp: new Date().toISOString() });
});

// Main root route - ALWAYS RESPONDS
app.get('/', (req, res) => {
    const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TWM3 - منصة التعلم</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', sans-serif; }
            body { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white; min-height: 100vh; direction: rtl; text-align: center;
                display: flex; align-items: center; justify-content: center;
                padding: 20px;
            }
            .container { 
                background: rgba(255, 255, 255, 0.1); 
                backdrop-filter: blur(20px);
                border-radius: 24px; padding: 50px 40px; 
                max-width: 800px; width: 100%;
                border: 1px solid rgba(255, 255, 255, 0.2);
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }
            h1 { 
                font-size: 3.5em; margin-bottom: 20px;
                background: linear-gradient(45deg, #fff, #f0f0f0);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                font-weight: 800;
            }
            .status { 
                background: #10B981; color: white; 
                padding: 12px 30px; border-radius: 100px;
                font-weight: 600; display: inline-block;
                margin: 25px 0; font-size: 1.2em;
                box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);
            }
            .grid { 
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px; margin: 40px 0;
            }
            .card { 
                background: rgba(255, 255, 255, 0.15);
                padding: 25px; border-radius: 16px;
                transition: all 0.3s ease;
            }
            .card:hover { 
                background: rgba(255, 255, 255, 0.25);
                transform: translateY(-5px);
            }
            .btn { 
                display: inline-block; background: white;
                color: #667eea; padding: 12px 25px;
                border-radius: 50px; text-decoration: none;
                font-weight: 600; margin-top: 15px;
                transition: all 0.3s ease;
            }
            .btn:hover { background: #f8f9fa; transform: scale(1.05); }
            .info { 
                margin-top: 40px; padding-top: 30px;
                border-top: 1px solid rgba(255, 255, 255, 0.2);
                font-size: 0.9em; opacity: 0.8;
            }
            @media (max-width: 768px) {
                h1 { font-size: 2.5em; }
                .container { padding: 30px 20px; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 TWM3 Backend</h1>
            <div class="status">✅ الخادم شغال بنجاح على Railway</div>
            <p>تم نشر الخادم الخلفي بنجاح. جميع واجهات برمجة التطبيقات جاهزة.</p>
            
            <div class="grid">
                <div class="card">
                    <h3>📊 حالة النظام</h3>
                    <p>فحص حالة الخادم وقاعدة البيانات</p>
                    <a href="/health" class="btn">فحص الحالة</a>
                </div>
                <div class="card">
                    <h3>📚 الكورسات</h3>
                    <p>تصفح جميع الكورسات المتاحة</p>
                    <a href="/api/courses" class="btn">عرض الكورسات</a>
                </div>
                <div class="card">
                    <h3>📝 المدونات</h3>
                    <p>اقرأ أحدث المقالات والمدونات</p>
                    <a href="/api/blogs" class="btn">عرض المدونات</a>
                </div>
            </div>
            
            <div class="info">
                <p>🌐 النطاق: <strong>twm3.org</strong></p>
                <p>🔄 البيئة: <strong>${process.env.NODE_ENV || 'production'}</strong></p>
                <p>🚪 المنفذ: <strong>${PORT}</strong></p>
                <p>⏰ وقت الخادم: <span id="serverTime">${new Date().toLocaleString('ar-EG')}</span></p>
            </div>
        </div>
        
        <script>
            function updateTime() {
                const now = new Date();
                const el = document.getElementById('serverTime');
                el.textContent = now.toLocaleString('ar-EG', {
                    year: 'numeric', month: 'long', day: 'numeric',
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                });
            }
            setInterval(updateTime, 1000);
        </script>
    </body>
    </html>
    `;
    
    res.send(html);
});

// ============ API ROUTES ============
// Simple API routes
app.get('/api/courses', (req, res) => {
    res.json([
        { id: 1, title: 'دورة تطوير الويب', instructor: 'محمد أحمد' },
        { id: 2, title: 'دورة الأمن السيبراني', instructor: 'سارة خالد' },
        { id: 3, title: 'دورة الذكاء الاصطناعي', instructor: 'علي حسن' }
    ]);
});

app.get('/api/blogs', (req, res) => {
    res.json([
        { id: 1, title: 'مقدمة في Node.js', author: 'أحمد محمود' },
        { id: 2, title: 'أفضل ممارسات React', author: 'فاطمة عمر' }
    ]);
});

// ============ ERROR HANDLERS ============
// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Route not found',
        path: req.url,
        timestamp: new Date().toISOString()
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: err.message,
        timestamp: new Date().toISOString()
    });
});

// ============ START SERVER ============
const startServer = async () => {
    try {
        console.log('🔗 Connecting to MongoDB...');
        
        // Try to connect to MongoDB if URI exists
        if (process.env.MONGO_URI) {
            await mongoose.connect(process.env.MONGO_URI, {
                serverSelectionTimeoutMS: 10000,
            });
            console.log('✅ MongoDB connected successfully');
        } else {
            console.log('⚠️ Running without MongoDB');
        }
        
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`==================================================`);
            console.log(`✅ SERVER STARTED SUCCESSFULLY`);
            console.log(`✅ Port: ${PORT} (0.0.0.0:${PORT})`);
            console.log(`✅ Environment: ${process.env.NODE_ENV || 'production'}`);
            console.log(`✅ Railway URL: ${process.env.RAILWAY_STATIC_URL || 'Check dashboard'}`);
            console.log(`==================================================`);
            console.log(`🌐 Test URLs:`);
            console.log(`   • Main page: /`);
            console.log(`   • Health: /health`);
            console.log(`   • Ping: /ping`);
            console.log(`   • Courses API: /api/courses`);
            console.log(`   • Blogs API: /api/blogs`);
            console.log(`==================================================`);
        });
        
        // Error handling for server
        server.on('error', (error) => {
            console.error('❌ Server error:', error.message);
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        console.log('🔄 Starting server without MongoDB...');
        
        // Start server even without MongoDB
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`⚠️ Server started WITHOUT MongoDB on port ${PORT}`);
        });
    }
};

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('⚠️ Uncaught Exception:', error.message);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the server
startServer();