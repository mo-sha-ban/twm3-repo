// Profile Page JavaScript - Modern Design

// Global variables
let currentUser = null;
let isDarkMode = false;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    (async () => {
        initializeTheme();
        initializeSidebar();
        initializeProfile();
        await loadUserData();
        // load comments and courses after user data is loaded
        loadUserComments();
        loadUserCourses();
    })();
});

// Theme Management
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    isDarkMode = savedTheme === 'dark';
    updateTheme();
    
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
}

function toggleTheme() {
    isDarkMode = !isDarkMode;
    updateTheme();
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
}

function updateTheme() {
    const body = document.body;
    const themeIcon = document.querySelector('#theme-toggle i');
    
    if (isDarkMode) {
        body.setAttribute('data-theme', 'dark');
        themeIcon.className = 'fas fa-sun';
    } else {
        body.removeAttribute('data-theme');
        themeIcon.className = 'fas fa-moon';
    }
}

// Sidebar Management
function initializeSidebar() {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    menuToggle.addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', closeSidebar);

    // Close sidebar when clicking outside
    document.addEventListener('click', function(e) {
        if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
            closeSidebar();
        }
    });
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    sidebar.classList.remove('open');
    overlay.classList.remove('open');
}

// Sidebar Menu Management
function initializeSidebarMenu() {
    const menuItems = document.querySelectorAll('.sidebar-menu .menu-item');
    console.log('Found menu items:', menuItems.length);

    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            console.log('Menu item clicked:', this.getAttribute('href'));
            e.preventDefault();
            e.stopPropagation();

            // Remove active class from all items
            menuItems.forEach(mi => mi.classList.remove('active'));
            // Add active class to clicked item
            this.classList.add('active');

            const href = this.getAttribute('href');
            console.log('Handling href:', href);
            if (href === '#courses') {
                console.log('Redirecting to courses page');
                window.location.href = 'courses.html';
            } else if (href === '#store') {
                console.log('Calling Store page');
                window.location.href = 'store.html';
            } else if (href === '#cart') {
                console.log('Calling Cart page');
                window.location.href = 'cart.html';
            } else if (href === '#community') {
                console.log('Calling handleCommunityMenu');
                handleCommunityMenu();
            } else {
                // Default behavior for other menu items
                const targetSection = document.querySelector(href);
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
}


function handleCommunityMenu() {
    // Show messages under development modal
    showMessagesUnderDevelopmentModal();
}

// Show "Under Development" modal for messages/community
function showMessagesUnderDevelopmentModal() {
    let modal = document.getElementById('messagesUnderDevelopmentModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'messagesUnderDevelopmentModal';
        modal.className = 'messages-dev-modal';
        modal.innerHTML = `
            <div class="messages-dev-backdrop"></div>
            <div class="messages-dev-content">
                <div class="messages-dev-icon">
                    <i class="fas fa-tools"></i>
                </div>
                <h2>المجتمع تحت التطوير</h2>
                <p>نعمل حالياً على تحسين نظام المجتمع لتقديم تجربة أفضل. سيتم تفعيله قريباً!</p>
                <button class="messages-dev-close">حسناً</button>
            </div>
        `;
        document.body.appendChild(modal);

        // Add styles
        if (!document.getElementById('messages-dev-styles')) {
            const style = document.createElement('style');
            style.id = 'messages-dev-styles';
            style.textContent = `
                .messages-dev-modal {
                    display: none;
                    position: fixed;
                    inset: 0;
                    z-index: 10000;
                    align-items: center;
                    justify-content: center;
                }

                .messages-dev-modal.show {
                    display: flex;
                }

                .messages-dev-backdrop {
                    position: absolute;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(4px);
                }

                .messages-dev-content {
                    position: relative;
                    background: var(--bg-primary, #ffffff);
                    border-radius: 20px;
                    padding: 40px;
                    max-width: 500px;
                    text-align: center;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    animation: slideUp 0.3s ease;
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .messages-dev-icon {
                    width: 80px;
                    height: 80px;
                    margin: 0 auto 24px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2rem;
                    color: white;
                }

                .messages-dev-content h2 {
                    margin: 0 0 16px;
                    font-size: 1.5rem;
                    color: var(--text-primary, #1a1a1a);
                }

                .messages-dev-content p {
                    margin: 0 0 24px;
                    color: var(--text-secondary, #666);
                    line-height: 1.6;
                }

                .messages-dev-close {
                    padding: 12px 32px;
                    background: var(--primary-color, #4f46e5);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .messages-dev-close:hover {
                    background: var(--primary-dark, #4338ca);
                    transform: translateY(-2px);
                }

                @media (prefers-color-scheme: dark) {
                    .messages-dev-backdrop {
                        background: rgba(0, 0, 0, 0.8);
                    }

                    .messages-dev-content {
                        background: var(--bg-primary, #1a1a1a);
                    }

                    .messages-dev-content h2 {
                        color: var(--text-primary, #ffffff);
                    }

                    .messages-dev-content p {
                        color: var(--text-secondary, #aaaaaa);
                    }
                }
            `;
            document.head.appendChild(style);
        }

        // Wire close button
        modal.querySelector('.messages-dev-close').addEventListener('click', () => {
            modal.classList.remove('show');
            document.body.classList.remove('modal-open');
        });

        // Close on backdrop click
        modal.querySelector('.messages-dev-backdrop').addEventListener('click', () => {
            modal.classList.remove('show');
            document.body.classList.remove('modal-open');
        });
    }

    modal.classList.add('show');
    document.body.classList.add('modal-open');
}

// Profile Management
function initializeProfile() {
    const avatar = document.getElementById('profile-avatar');
    const upload = document.getElementById('avatar-upload');

    avatar.addEventListener('click', openAvatarPicker);
    upload.addEventListener('change', handleAvatarUpload);

    // Initialize sidebar menu handlers
    initializeSidebarMenu();
}

// Avatar Picker Modal
function openAvatarPicker() {
    const modal = createAvatarModal();
    document.body.appendChild(modal);
}

function createAvatarModal() {
    const modal = document.createElement('div');
    modal.className = 'avatar-modal';
    modal.innerHTML = `
        <div class="avatar-sheet">
            <div class="avatar-header">
                <h3 class="avatar-title">اختر صورة البروفايل</h3>
                <button class="avatar-close" aria-label="إغلاق">&times;</button>
            </div>
            <div class="avatar-grid" id="avatar-grid">
                <!-- سيتم تعبئة الصور هنا -->
            </div>
            <div class="avatar-footer">
                <button class="avatar-btn secondary" id="btn-upload-custom">رفع صورة</button>
                <button class="avatar-btn" id="btn-cancel">إلغاء</button>
            </div>
        </div>
    `;

    // إضافة الصور الجاهزة
    const avatarGrid = modal.querySelector('#avatar-grid');
    const avatarImages = [
        '../img/avatar/profile-1.png',
        '../img/avatar/profile-2.png',
        '../img/avatar/profile-3.png',
        '../img/avatar/profile-4.png',
        '../img/avatar/profile-5.png'
    ];

    avatarImages.forEach((src, index) => {
        const card = document.createElement('div');
        card.className = 'avatar-card';
        card.innerHTML = `<img class="avatar-img" src="${src}" alt="صورة بروفايل ${index + 1}">`;
        card.addEventListener('click', () => selectAvatar(src, modal));
        avatarGrid.appendChild(card);
    });

    // إضافة أحداث الإغلاق
    modal.querySelector('.avatar-close').addEventListener('click', () => modal.remove());
    modal.querySelector('#btn-cancel').addEventListener('click', () => modal.remove());
    modal.querySelector('#btn-upload-custom').addEventListener('click', () => {
        modal.remove();
        document.getElementById('avatar-upload').click();
    });

    // إغلاق عند النقر خارج المودال
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    return modal;
}

async function selectAvatar(avatarSrc, modal) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        // تحميل الصورة وتحويلها إلى ملف
        const response = await fetch(avatarSrc, { cache: 'no-store' });
        const blob = await response.blob();
        const fileName = avatarSrc.split('/').pop() || 'avatar.png';
        const file = new File([blob], fileName, { type: blob.type || 'image/png' });

        const formData = new FormData();
        formData.append('avatar', file);

        const uploadResponse = await fetch('/api/users/me/avatar', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token },
            body: formData
        });

        if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json().catch(() => ({ error: 'خطأ غير معروف' }));
            throw new Error(errorData.error || 'فشل رفع الصورة');
        }

        const data = await uploadResponse.json();
        if (data.avatarUrl) {
            updateProfileAvatar(data.avatarUrl);
            showToast('تم تحديث الصورة', 'تم حفظ صورة البروفايل بنجاح', 'success');
        }

        modal.remove();
    } catch (error) {
        showToast('خطأ في رفع الصورة', error.message, 'error');
        modal.remove();
    }
}

async function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
        const response = await fetch('/api/users/me/avatar', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'خطأ غير معروف' }));
            throw new Error(errorData.error || 'فشل رفع الصورة');
        }

        const data = await response.json();
        if (data.avatarUrl) {
            updateProfileAvatar(data.avatarUrl);
            showToast('تم تحديث الصورة', 'تم حفظ صورة البروفايل بنجاح', 'success');
        }
    } catch (error) {
        showToast('خطأ في رفع الصورة', error.message, 'error');
    } finally {
        event.target.value = '';
    }
}

function updateProfileAvatar(avatarUrl) {
    const avatar = document.getElementById('profile-avatar');
    if (!avatar) return;
    const resolved = getFullAvatarUrl(avatarUrl);
    // append cache buster
    const sep = resolved.includes('?') ? '&' : '?';
    avatar.src = `${resolved}${sep}v=${Date.now()}`;
}

// Resolve avatar URL: if it's already absolute (http/https) return as-is,
// otherwise prefix with API host (supports localhost dev server)
function getFullAvatarUrl(avatarUrl) {
    if (!avatarUrl) return '../img/profile.png';
    avatarUrl = String(avatarUrl);
    // If already absolute
    if (/^https?:\/\//i.test(avatarUrl)) return avatarUrl;

    // Some stored avatarUrl may already include leading slash; ensure single slash
    const origin = window.location.origin && window.location.origin.includes('localhost:5000') ? window.location.origin : 'http://localhost:5000';
    if (avatarUrl.startsWith('/')) return origin + avatarUrl;
    return origin + '/' + avatarUrl;
}

// User Data Loading
async function loadUserData() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.email) {
            window.location.href = 'login.html';
            return;
        }

        const token = localStorage.getItem('token');
        const response = await fetch(`/api/user?email=${encodeURIComponent(user.email)}`, {
            headers: token ? { 'Authorization': 'Bearer ' + token } : {}
        });

        if (!response.ok) {
            throw new Error('فشل في جلب بيانات المستخدم');
        }

        currentUser = await response.json();
        localStorage.setItem('user', JSON.stringify(currentUser));
        displayUserData();
    } catch (error) {
        console.error('Error loading user data:', error);
        window.location.href = 'login.html';
    }
}

function displayUserData() {
    if (!currentUser) return;

    // Update profile info
    document.getElementById('profile-name').textContent = currentUser.name || currentUser.username || 'مستخدم';
    
    // Determine and display user status
    let roleText = 'مستخدم';
    let roleClass = 'status-normal';
    
    if (currentUser.isAdmin) {
        roleText = 'مدير';
        roleClass = 'status-admin';
    } else if (currentUser.status === 'active' || currentUser.isActive) {
        roleText = 'نشط';
        roleClass = 'status-active';
    } else if (currentUser.status === 'blocked' || !currentUser.isActive) {
        roleText = 'محظور';
        roleClass = 'status-blocked';
    }

    const roleElement = document.getElementById('profile-role');
    roleElement.textContent = roleText;
    roleElement.className = `profile-role ${roleClass}`;

    // Update avatar if exists
    if (currentUser.avatarUrl) {
        updateProfileAvatar(currentUser.avatarUrl);
    }

    // Add dashboard link for admins
    if (currentUser.isAdmin) {
        addDashboardLink();
    }

    // Display identity info
    displayIdentityInfo();
}

function addDashboardLink() {
    const sidebarMenu = document.querySelector('.sidebar-menu');
    const existingDashboard = document.querySelector('.menu-item[href="#dashboard"]');
    
    if (!existingDashboard) {
        const dashboardItem = document.createElement('a');
        dashboardItem.href = './twm3-backend/private/dashboard.html';
        dashboardItem.className = 'menu-item';
        dashboardItem.innerHTML = '<i class="fas fa-tachometer-alt"></i> لوحة التحكم';
        
        // إدراج رابط الداشبورد في بداية القائمة
        sidebarMenu.insertBefore(dashboardItem, sidebarMenu.firstChild);
    }
}

function displayIdentityInfo() {
    const container = document.getElementById('identity-info');
    const fields = [
        { key: 'name', label: 'الاسم الكامل' },
        { key: 'username', label: 'اسم المستخدم' },
        { key: 'email', label: 'البريد الإلكتروني' },
        { key: 'phone', label: 'رقم الهاتف' },
        { key: 'created_at', label: 'تاريخ الإنشاء', transform: formatDate }
    ];

    container.innerHTML = fields.map(field => {
        const value = field.transform ? 
            field.transform(currentUser[field.key]) : 
            currentUser[field.key] || '---';
        
        return `
            <div class="info-row">
                <span class="info-label">${field.label}</span>
                <span class="info-value">${value}</span>
            </div>
        `;
    }).join('');
}

function formatDate(dateString) {
    if (!dateString) return '---';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Comments Loading
async function loadUserComments() {
    const container = document.getElementById('community-content');
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i> جاري التحميل...</div>';

    try {
        if (!currentUser || !currentUser._id) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-comments"></i><h3>لا توجد تعليقات</h3><p>لم تقم بإضافة أي تعليقات بعد</p></div>';
            return;
        }

        const token = localStorage.getItem('token');
        const response = await fetch(`/api/comments/user/${currentUser._id}`, {
            headers: token ? { 'Authorization': 'Bearer ' + token } : {}
        });

        if (!response.ok) {
            throw new Error('فشل في جلب التعليقات');
        }

        const comments = await response.json();
        displayComments(comments);

            // إضافة مستمعات الأحداث بعد عرض التعليقات
            addCommentEventListeners();
    } catch (error) {
        console.error('Error loading comments:', error);
        container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>خطأ في التحميل</h3><p>تعذر تحميل التعليقات</p></div>';
    }
}

    // دالة لإضافة مستمعات الأحداث للتعليقات
    function addCommentEventListeners() {
        // مستمع لأزرار الإعجاب
        document.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const commentId = this.dataset.id;
                const token = localStorage.getItem('token');
                try {
                    const res = await fetch(`/api/comments/${commentId}/like`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { 'Authorization': 'Bearer ' + token } : {})
                        }
                    });
                    if (res.ok) {
                        loadUserComments(); // تحديث التعليقات
                    }
                } catch (error) {
                    showToast('خطأ', 'تعذر تسجيل الإعجاب', 'error');
                }
            });
        });

        // مستمع لأزرار عدم الإعجاب
        document.querySelectorAll('.dislike-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const commentId = this.dataset.id;
                const token = localStorage.getItem('token');
                try {
                    const res = await fetch(`/api/comments/${commentId}/dislike`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { 'Authorization': 'Bearer ' + token } : {})
                        }
                    });
                    if (res.ok) {
                        loadUserComments(); // تحديث التعليقات
                    }
                } catch (error) {
                    showToast('خطأ', 'تعذر تسجيل عدم الإعجاب', 'error');
                }
            });
        });
    }
function displayComments(comments) {
    const container = document.getElementById('community-content');
    
    if (!Array.isArray(comments) || comments.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-comments"></i><h3>لا توجد تعليقات</h3><p>لم تقم بإضافة أي تعليقات بعد</p></div>';
        return;
    }
    // render comments with proper data attributes for event listeners
    container.innerHTML = comments
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map(comment => {
            const likesCount = Array.isArray(comment.likes) ? comment.likes.length : 0;
            const dislikesCount = Array.isArray(comment.dislikes) ? comment.dislikes.length : 0;
            const blogTitle = comment.blog?.title || 'مقال';
            const avatar = comment.user?.avatarUrl ? getFullAvatarUrl(comment.user.avatarUrl) : '../img/profile.png';

            return `
                <div class="comment-item fade-in">
                    <div class="comment-header">
                        <img src="${avatar}" alt="صورة المستخدم" class="comment-avatar" onerror="this.src='../img/profile.png'">
                        <div>
                            <div class="comment-user">${comment.user?.name || comment.user?.username || 'مستخدم'}</div>
                            <div class="comment-time">${formatDate(comment.createdAt)}</div>
                            <div class="comment-blog">
                                <a href="blog-details.html?id=${comment.blog?._id || ''}" class="blog-link" title="الذهاب للمقال">${escapeHtml(blogTitle)}</a>
                            </div>
                        </div>
                    </div>
                    <div class="comment-content">${escapeHtml(comment.content)}</div>
                    <div class="comment-actions">
                        <button class="like-btn" data-id="${comment._id}" title="إعجاب" aria-label="إعجاب">
                            <i class="fas fa-heart"></i>
                            <span class="likes-count">${likesCount}</span>
                        </button>
                        <button class="dislike-btn" data-id="${comment._id}" title="عدم إعجاب" aria-label="عدم إعجاب">
                            <i class="fas fa-heart-broken"></i>
                            <span class="dislikes-count">${dislikesCount}</span>
                        </button>
                        <button class="action-button delete" title="حذف" onclick="deleteComment('${comment._id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

    // attach listeners for like/dislike after render
    addCommentEventListeners();
}

// Courses Loading
async function loadUserCourses() {
    const container = document.getElementById('courses-content');
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i> جاري التحميل...</div>';

    try {
        if (!currentUser || !currentUser._id) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-graduation-cap"></i><h3>لا توجد كورسات</h3><p>لم تسجل في أي كورسات بعد</p></div>';
            return;
        }

        const token = localStorage.getItem('token');
        // جلب جميع الكورسات
        const coursesResponse = await fetch('/api/courses', {
            headers: token ? { 'Authorization': 'Bearer ' + token } : {}
        });

        if (!coursesResponse.ok) throw new Error('فشل في جلب الكورسات');
        const coursesData = await coursesResponse.json();
        const allCourses = Array.isArray(coursesData) ? coursesData : coursesData.courses || [];

        // جلب تقدم المستخدم
        const userResponse = await fetch(`/api/user?email=${encodeURIComponent(currentUser.email)}`, {
            headers: token ? { 'Authorization': 'Bearer ' + token } : {}
        });
        if (!userResponse.ok) throw new Error('فشل في جلب بيانات المستخدم');
        const userData = await userResponse.json();
        const userProgress = userData.courseProgress || [];

        // جلب سجل الدروس المكتملة (اختياري، قد لا يتواجد هذا المسار عند بعض الـ API)
        let completedLessonsGlobal = [];
        try {
            const lessonsResponse = await fetch('/api/user/lessons/completed', {
                headers: token ? { 'Authorization': 'Bearer ' + token } : {}
            });
            if (lessonsResponse.ok) {
                const lessonsData = await lessonsResponse.json();
                completedLessonsGlobal = lessonsData.completedLessons || [];
            }
        } catch (e) {
            // تجاهل، سنعتمد على بيانات userProgress إن لم تتوفر
        }

        // جلب ملخص التقدم من الخادم لتحديد عدد الدروس المكتملة بدقة
        let progressSummary = [];
        try {
            const summaryRes = await fetch('/api/courses/progress/summary', {
                headers: token ? { 'Authorization': 'Bearer ' + token } : {}
            });
            if (summaryRes.ok) {
                progressSummary = await summaryRes.json();
            }
        } catch (e) {
            // تجاهل الخطأ؛ سنعتمد على مصادر أخرى إن لم يتوفر الملخص
        }
        const summaryMap = {};
        try {
            (Array.isArray(progressSummary) ? progressSummary : []).forEach(s => {
                const cid = String(s.courseId || s.course || s._id || '');
                if (cid) summaryMap[cid] = s;
            });
        } catch(e) {}

        // دمج البيانات
        const coursesWithProgress = allCourses.map(course => {
            // حساب إجمالي الدروس
            let totalLessons = 0;
            if (course.units && Array.isArray(course.units)) {
                course.units.forEach(unit => {
                    if (unit.lessons && Array.isArray(unit.lessons)) totalLessons += unit.lessons.length;
                });
            }

            // استخدام ملخص الخادم إن توفر
            const sum = summaryMap[String(course._id)] || null;
            const completedCount = sum && typeof sum.completedCount === 'number' ? sum.completedCount : 0;
            
            // check localStorage for started courses (user may have opened the course but not completed lessons)
            let localProgressKey = null;
            try { localProgressKey = localStorage.getItem(`courseProgress_${course._id}`); } catch(e) { localProgressKey = null; }
            const startedLocal = !!localProgressKey;
            const progressPercentage = sum && typeof sum.progressPercent === 'number'
                ? Math.max(0, Math.min(100, Math.round(sum.progressPercent)))
                : (totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0);
            const status = progressPercentage >= 100 ? 'completed' : (progressPercentage > 0 ? 'in-progress' : 'not-started');

            // حساب الوقت المستغرق (إن توفر بيانات لحلقات الدروس في completedLessonsGlobal)
            const courseCompletedLessons = completedLessonsGlobal.filter(l => l.courseId === course._id);
            const timeSpent = courseCompletedLessons.reduce((sum, l) => sum + (l.timeSpent || 0), 0);

            return {
                id: course._id,
                title: course.title,
                instructor: course.instructor || 'مدرب',
                progress: progressPercentage,
                started: startedLocal || (completedCount > 0),
                status: status,
                totalLessons: totalLessons,
                completedLessons: completedCount,
                timeSpent: timeSpent
            };
        });

        displayCourses(coursesWithProgress);
    } catch (error) {
        console.error('Error loading courses:', error);
        container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>خطأ في التحميل</h3><p>تعذر تحميل الكورسات</p></div>';
    }
}

function displayCourses(courses) {
    const container = document.getElementById('courses-content');
    if (!Array.isArray(courses) || courses.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-graduation-cap"></i><h3>لا توجد كورسات</h3><p>لم تسجل في أي كورسات بعد</p></div>';
        return;
    }

    // ترتيب حسب التقدم نزولاً واظهار فقط الكورسات التي تم البدء فيها فعلياً وسمع على الأقل درس واحد
    const sorted = courses.slice().filter(c=> (c.progress > 0) && c.started).sort((a, b) => b.progress - a.progress);

    if (sorted.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-graduation-cap"></i><h3>لا توجد كورسات مرئية</h3><p>لن تظهر الكورسات التي لم تبدأ فيها فعلياً أو لم تسمع أي درس</p></div>';
        return;
    }

    container.innerHTML = sorted.map(course => {
        return `
            <div class="course-item fade-in">
                <div class="course-header">
                    <div>
                        <div class="course-title">${escapeHtml(course.title)}</div>
                        <div class="course-instructor">المدرب: ${escapeHtml(course.instructor)}</div>
                        <div class="course-stats">${course.completedLessons} من ${course.totalLessons} درس مكتمل <span class="bullet">•</span> ${formatTimeSpent(course.timeSpent || 0)}</div>
                    </div>
                    <div class="course-status">
                        <span class="status-badge status-${course.status}">${getStatusText(course.status, course.progress)}</span>
                    </div>
                </div>
                <div class="course-progress">
                    <div class="progress-label"><span>التقدم</span><span>${course.progress}%</span></div>
                    <div class="progress-bar"><div class="progress-fill ${course.progress >= 100 ? 'completed' : ''}" style="width:${course.progress}%"></div></div>
                </div>
                <div class="course-footer"><a class="view-course-btn" href="course-page.html?id=${course.id}"><i class="fas fa-external-link-alt"></i> فتح الكورس</a></div>
            </div>
        `;
    }).join('');
}


// دالة تحويل الوقت إلى تنسيق مقروء
function formatTimeSpent(minutes) {
    if (!minutes) return '0 دقيقة';
    if (minutes < 60) return minutes + ' دقيقة';
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
    if (remaining === 0) return hours + ' ساعة';
    return hours + ' ساعة و ' + remaining + ' دقيقة';
}

// دالة الحصول على نص حالة الكورس
function getStatusText(status, progress) {
    if (status === 'completed' || progress >= 100) return 'مكتمل ✓';
    if (progress > 75) return 'قريب جداً';
    if (progress > 50) return 'في منتصف الطريق';
    if (progress > 25) return 'بداية جيدة';
    if (progress > 0) return 'قيد التعلم';
    return 'لم يبدأ بعد';
}

// Utility Functions
function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showToast(title, message, type = 'info') {
    if (window.__TW_TOAST__) {
        window.__TW_TOAST__.show({
            title: title,
            desc: message,
            danger: type === 'error',
            durationMs: 4000
        });
    } else {
        alert(`${title}: ${message}`);
    }
}

// Comment deletion
async function deleteComment(commentId) {
    if (!confirm('هل أنت متأكد من حذف هذا التعليق؟')) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/comments/${commentId}`, {
            method: 'DELETE',
            headers: token ? { 'Authorization': 'Bearer ' + token } : {}
        });

        if (response.ok) {
            showToast('تم الحذف', 'تم حذف التعليق بنجاح', 'success');
            loadUserComments();
        } else {
            throw new Error('فشل في حذف التعليق');
        }
    } catch (error) {
        showToast('خطأ', error.message, 'error');
    }
}

// Logout functionality
document.getElementById('logout-btn').addEventListener('click', function() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    }
});
// Go To Home functionality
document.getElementById('home-btn').addEventListener('click', function() {
        window.location.href = 'index.html';
});

// New message form handler (message by username/email)
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('newMessageForm');
    if (!form) return;
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const recipient = (document.getElementById('newMessageRecipient')||{}).value || '';
        const body = (document.getElementById('newMessageBody')||{}).value || '';
        if (!recipient) { window.showToast && window.showToast('خطأ', 'أدخل اسم المستخدم أو الايميل', { type: 'error' }); return; }

        try {
            if (window.sendDirectMessage) {
                // sendDirectMessage will resolve recipient and open the thread in the messaging UI
                await window.sendDirectMessage(recipient, body || '');
                window.showToast && window.showToast('تم الإرسال', 'تم إرسال الرسالة بنجاح', { type: 'success' });
            } else {
                // fallback: resolve recipient and send via API
                const token = localStorage.getItem('token');
                const isEmail = recipient.includes('@');
                const q = isEmail ? `email=${encodeURIComponent(recipient)}` : `username=${encodeURIComponent(recipient)}`;
                const res = await fetch('/api/users/lookup?' + q, { headers: token ? { 'Authorization': 'Bearer ' + token } : {} });
                if (!res.ok) throw new Error('المستخدم غير موجود');
                const user = await res.json();
                const sendRes = await fetch('/api/messages/create', { method: 'POST', headers: { 'Content-Type':'application/json', ...(token?{ 'Authorization':'Bearer '+token }:{}) }, body: JSON.stringify({ recipientId: user._id, body, sendEmail: false }) });
                if (!sendRes.ok) throw new Error('فشل الإرسال');
                window.showToast && window.showToast('تم الإرسال', 'تم إرسال الرسالة بنجاح', { type: 'success' });
            }
            // clear form
            document.getElementById('newMessageRecipient').value = '';
            document.getElementById('newMessageBody').value = '';
            // attempt to refresh messages list if messaging script exposes a refresh method
            if (window.fetchMessages) try{ window.fetchMessages(); }catch(e){}
        } catch (err) {
            console.error('New message send failed', err);
            window.showToast && window.showToast('خطأ', err.message || 'فشل في إرسال الرسالة', { type: 'error' });
        }
    });
});

// New Chat Modal wiring (open/close/backdrop/escape + submit handling)
(function() {
    document.addEventListener('DOMContentLoaded', function() {
        const modal = document.getElementById('newChatModal');
        if (!modal) return;
        const openTriggers = document.querySelectorAll('[data-open-new-chat]');
        const closeBtn = document.getElementById('newChatClose');
        const cancelBtn = document.getElementById('newChatCancel');
        const form = document.getElementById('newChatForm');
        const recipientInput = document.getElementById('newChatRecipient');
        const messageInput = document.getElementById('newChatMessage');

        function showModal() {
            modal.classList.add('show');
            setTimeout(() => recipientInput && recipientInput.focus(), 80);
        }
        function hideModal() {
            modal.classList.remove('show');
            if (form) form.reset();
        }

        openTriggers.forEach(btn => btn.addEventListener('click', showModal));
        if (closeBtn) closeBtn.addEventListener('click', hideModal);
        if (cancelBtn) cancelBtn.addEventListener('click', hideModal);

        // backdrop click closes
        modal.addEventListener('click', function(e) {
            if (e.target === modal) hideModal();
        });

        // escape key closes
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.classList.contains('show')) hideModal();
        });

        if (form) {
            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                const recipient = recipientInput ? recipientInput.value.trim() : '';
                const body = messageInput ? messageInput.value.trim() : '';
                if (!recipient) { window.showToast && window.showToast('خطأ', 'أدخل اسم المستخدم أو الايميل', 'error'); return; }

                try {
                    if (typeof window.sendDirectMessage === 'function') {
                        await window.sendDirectMessage(recipient, body || '');
                    } else {
                        // fallback: resolve recipient and send via API
                        const token = localStorage.getItem('token');
                        const isEmail = recipient.includes('@');
                        const q = isEmail ? `email=${encodeURIComponent(recipient)}` : `username=${encodeURIComponent(recipient)}`;
                        const res = await fetch('/api/users/lookup?' + q, { headers: token ? { 'Authorization': 'Bearer ' + token } : {} });
                        if (!res.ok) throw new Error('المستخدم غير موجود');
                        const user = await res.json();
                        const sendRes = await fetch('/api/messages/create', { method: 'POST', headers: { 'Content-Type':'application/json', ...(token?{ 'Authorization':'Bearer '+token }:{}) }, body: JSON.stringify({ recipientId: user._id, body, sendEmail: false }) });
                        if (!sendRes.ok) {
                            const txt = await sendRes.text().catch(()=>sendRes.statusText||'');
                            throw new Error(txt || 'فشل الإرسال');
                        }
                    }

                    window.showToast && window.showToast('تم الإرسال', 'تم إرسال الرسالة بنجاح', 'success');

                    // attempt to open thread for the resolved recipient (ensure we pass a user object)
                    try {
                        // if sendDirectMessage was used it already opens the thread; for fallback we have `user`
                        if (typeof window.openThreadForSender === 'function' && typeof user !== 'undefined' && user && user._id) {
                            window.openThreadForSender(user);
                        }
                    } catch(e){ console.error('openThreadForSender failed', e); }
                    try { if (typeof window.fetchMessages === 'function') window.fetchMessages(); } catch(e){}
                } catch (err) {
                    console.error('New chat send failed', err);
                    window.showToast && window.showToast('خطأ', err.message || 'فشل في إرسال الرسالة', 'error');
                } finally {
                    hideModal();
                }
            });
        }
    });
})();



