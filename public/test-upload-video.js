#!/usr/bin/env node

const fs = require('fs');
const FormData = require('form-data');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testVideoUpload() {
  try {
    console.log('🎬 اختبار رفع الفيديو...\n');
    
    // Create a dummy video file for testing
    const dummyVideo = Buffer.alloc(1024 * 1024); // 1MB dummy file
    const videoPath = '/tmp/test-video.mp4';
    fs.writeFileSync(videoPath, dummyVideo);
    
    const form = new (await import('form-data')).default();
    form.append('file', fs.createReadStream(videoPath), {
      filename: 'test-video.mp4',
      contentType: 'video/mp4'
    });
    
    console.log('📤 جاري رفع الملف...');
    const response = await fetch('http://localhost:5000/api/uploads/lesson-asset', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      },
      body: form
    });
    
    const data = await response.json();
    console.log('\n📥 الرد من الخادم:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('\n✅ تم رفع الفيديو بنجاح!');
      console.log(`🔗 الرابط: ${data.url}`);
      console.log(`📁 النوع: ${data.type}`);
    } else {
      console.log('\n❌ فشل رفع الفيديو');
    }
    
    // Cleanup
    fs.unlinkSync(videoPath);
    
  } catch (error) {
    console.error('\n❌ خطأ:', error.message);
  }
}

testVideoUpload();
