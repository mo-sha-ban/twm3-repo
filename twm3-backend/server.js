// ============ IMPORTS ============
const express = require('express');
const mongoose = require("mongoose");
require("dotenv").config();

// ============ APP SETUP ============
const app = express();
const PORT = process.env.PORT || 5000;

// Simple CORS for Railway
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-ethods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use(express.json());

// ============ ROUTES ============
// HEALTH CHECK - هام لـRailway
app.get('/health', (req, res) => {
    res.json({ 
        status: 'UP',
        server: 'TWM3 Railway',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        port: PORT
    });
});

// MAIN PAGE - بسيط ومضمون
app.get('/', (req, res) => {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>TWM3 على Railway</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                color: white;
            }
            .container {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                padding: 40px;
                border-radius: 20px;
                text-align: center;
                max-width: 800px;
                width: 100%;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            h1 {
                font-size: 3em;
                margin-bottom: 20px;
                color: white;
            }
            .success {
                background: #10B981;
                color: white;
                padding: 15px 30px;
                border-radius: 50px;
                font-weight: bold;
                display: inline-block;
                margin: 20px 0;
            }
            .links {
                margin: 30px 0;
            }
            .links a {
                display: inline-block;
                background: white;
                color: #667eea;
                padding: 12px 24px;
                margin: 10px;
                border-radius: 50px;
                text-decoration: none;
                font-weight: bold;
                transition: transform 0.3s;
            }
            .links a:hover {
                transform: translateY(-3px);
            }
            .info {
                margin-top: 30px;
                font-size: 0.9em;
                opacity: 0.8;
            }
            .logs {
                background: rgba(0,0,0,0.2);
                padding: 15px;
                border-radius: 10px;
                margin-top: 20px;
                font-family: monospace;
                text-align: left;
                font-size: 0.8em;
                max-height: 200px;
                overflow-y: auto;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 TWM3 على Railway</h1>
            <div class="success">✅ النشر نجح!</div>
            
            <p>تم نشر التطبيق بنجاح على Railway.</p>
            <p>جميع واجهات برمجة التطبيقات جاهزة.</p>
            
            <div class="links">
                <a href="/api/courses">الكورسات</a>
                <a href="/api/blogs">المدونات</a>
                <a href="/health">فحص الحالة</a>
                <a href="/test">اختبار</a>
            </div>
            
            <div class="info">
                <p>🔗 الرابط: <strong>twm3-repo-production.up.railway.app</strong></p>
                <p>🚪 المنفذ: <strong>${PORT}</strong></p>
                <p>🌐 البيئة: <strong>${process.env.NODE_ENV || 'production'}</strong></p>
                <p>🕐 الوقت: <span id="time">${new Date().toLocaleString('ar-EG')}</span></p>
            </div>
            
            <div class="logs">
                <strong>سجلات التشغيل:</strong><br>
                • الخادم بدأ على المنفذ ${PORT}<br>
                • Railway URL: twm3-repo-production.up.railway.app<br>
                • الوقت: ${new Date().toISOString()}<br>
                • حالة: ✅ جاهز للطلبات
            </div>
        </div>
        
        <script>
            // Update time
            setInterval(() => {
                document.getElementById('time').textContent = new Date().toLocaleString('ar-EG');
            }, 1000);
        </script>
    </body>
    </html>
    `;
    res.send(html);
});

// TEST ROUTE
app.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'TWM3 API is working on Railway!',
        url: 'twm3-repo-production.up.railway.app',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV
    });
});

// SIMPLE API ROUTES
app.get('/api/courses', (req, res) => {
    res.json({
        courses: [
            { id: 1, title: 'تطوير الويب', instructor: 'محمد' },
            { id: 2, title: 'الأمن السيبراني', instructor: 'سارة' },
            { id: 3, title: 'الذكاء الاصطناعي', instructor: 'علي' }
        ],
        count: 3
    });
});

app.get('/api/blogs', (req, res) => {
    res.json({
        blogs: [
            { id: 1, title: 'مقدمة في Node.js', author: 'أحمد' },
            { id: 2, title: 'أساسيات React', author: 'فاطمة' }
        ]
    });
});

// ============ ERROR HANDLERS ============
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Not found',
        message: 'Route does not exist',
        availableRoutes: ['/', '/health', '/test', '/api/courses', '/api/blogs']
    });
});

// ============ START SERVER ============
const startServer = async () => {
    try {
        // Try MongoDB if available
        if (process.env.MONGO_URI) {
            console.log('🔗 محاولة الاتصال بقاعدة البيانات...');
            await mongoose.connect(process.env.MONGO_URI, {
                serverSelectionTimeoutMS: 5000,
            });
            console.log('✅ تم الاتصال بقاعدة البيانات');
        }
        
        // Start the server
        app.listen(PORT, '0.0.0.0', () => {
            console.log('==========================================');
            console.log('✅  تم بدء الخادم بنجاح!');
            console.log(`✅  المنفذ: ${PORT} (0.0.0.0:${PORT})`);
            console.log('✅  البيئة:', process.env.NODE_ENV || 'production');
            console.log('🌐  رابط Railway: twm3-repo-production.up.railway.app');
            console.log('==========================================');
            console.log('🔗 روابط الاختبار:');
            console.log('   • الصفحة الرئيسية: /');
            console.log('   • فحص الحالة: /health');
            console.log('   • اختبار API: /test');
            console.log('   • الكورسات: /api/courses');
            console.log('==========================================');
        });
        
    } catch (error) {
        console.error('❌ خطأ في بدء الخادم:', error.message);
        
        // Start anyway without MongoDB
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`⚠️  الخادم يعمل بدون قاعدة بيانات على المنفذ ${PORT}`);
        });
    }
};

// Handle errors
process.on('uncaughtException', (error) => {
    console.log('⚠️  خطأ غير متوقع:', error.message);
});

// Start
startServer();