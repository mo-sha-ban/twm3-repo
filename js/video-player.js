// إعدادات مشغل الفيديو
const defaultOptions = {
    controls: [
        'play-large',
        'play',
        'progress',
        'current-time',
        'mute',
        'volume',
        'captions',
        'settings',
        'pip',
        'airplay',
        'fullscreen'
    ],
    i18n: {
        restart: 'إعادة تشغيل',
        play: 'تشغيل',
        pause: 'إيقاف',
        mute: 'كتم الصوت',
        unmute: 'تشغيل الصوت',
        settings: 'الإعدادات',
        enterFullscreen: 'ملء الشاشة',
        exitFullscreen: 'خروج من ملء الشاشة',
        speed: 'السرعة',
        normal: 'عادية',
        quality: 'الجودة',
        loop: 'تكرار'
    },
    youtube: {
        noCookie: true,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        modestbranding: 1
    }
};

// تهيئة جميع مشغلات الفيديو في الصفحة
function initVideoPlayers() {
    document.querySelectorAll('video.js-player, video, .plyr__video-embed').forEach(element => {
        if (!element.plyr) { // تجنب إعادة التهيئة إذا كان المشغل موجود بالفعل
            new Plyr(element, defaultOptions);
        }
    });
}

// تهيئة مشغل فيديو واحد
function initVideoPlayer(elementId) {
    const element = document.getElementById(elementId);
    if (element && !element.plyr) {
        return new Plyr(element, defaultOptions);
    }
    return null;
}

// تصدير الدوال للاستخدام الخارجي
window.initVideoPlayer = initVideoPlayer;
window.initVideoPlayers = initVideoPlayers;

// تشغيل الدالة عند اكتمال تحميل الصفحة مع إمكانية تعطيل التهيئة التلقائية على بعض الصفحات
document.addEventListener('DOMContentLoaded', function() {
    // إذا تم تعيين هذه العلامة في الصفحة، لا نقوم بالتهيئة التلقائية
    if (window.disableGlobalPlyrAutoInit === true) {
        return;
    }

    // تهيئة مشغلات الفيديو الأولية
    initVideoPlayers();
    
    // مراقبة التغييرات في المحتوى
    const observer = new MutationObserver((mutations) => {
        let newVideoAdded = false;
        
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) { // عنصر HTML فقط
                    if (node.matches('video, .plyr__video-embed') || 
                        node.querySelector('video, .plyr__video-embed')) {
                        newVideoAdded = true;
                    }
                }
            });
        });

        if (newVideoAdded) {
            initVideoPlayers();
        }
    });

    // بدء المراقبة إذا كان الـ body موجوداً
    if (document.body) {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
});