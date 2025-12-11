// notifications.js
// Modern notification system with dark mode support
(function(){
    'use strict';
    
    let notifications = [];
    let unreadCount = 0;
    let notificationModal = null;
    let isInitialized = false;
    
    // Initialize notification system
    function initializeNotifications() {
        if (isInitialized) return;
        isInitialized = true;
        
        createNotificationModal();
        wireNotificationButtons();
        loadNotifications();
        
        // Listen for new notifications via socket
        if (typeof io !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                const socket = io(window.location.origin, {
                    auth: { token },
                    reconnection: true
                });
                
                socket.on('connect', () => {
                    const userId = getCurrentUserId();
                    if (userId) {
                        socket.emit('join', String(userId));
                    }
                });
                
                socket.on('notification:new', (notification) => {
                    addNotification(notification);
                    showNotificationToast(notification);
                });
            }
        }
        
        // Check for new notifications every 30 seconds
        setInterval(checkNewNotifications, 30000);
    }
    
    function getCurrentUserId() {
        try {
            const user = JSON.parse(localStorage.getItem('user') || 'null');
            return user && (user._id || user.id) ? (user._id || user.id) : null;
        } catch(e) {
            return null;
        }
    }
    
    // Create modern notification modal
    function createNotificationModal() {
        if (notificationModal) return notificationModal;
        
        notificationModal = document.createElement('div');
        notificationModal.id = 'notificationsModal';
        notificationModal.className = 'notifications-modal';
        notificationModal.innerHTML = `
            <div class="notifications-modal-backdrop"></div>
            <div class="notifications-modal-content">
                <div class="notifications-header">
                    <h3>
                        <i class="fas fa-bell"></i>
                        الإشعارات
                        ${unreadCount > 0 ? `<span class="notifications-count-badge">${unreadCount}</span>` : ''}
                    </h3>
                    <button class="notifications-close" aria-label="إغلاق">&times;</button>
                </div>
                <div class="notifications-actions">
                    <button class="notifications-action-btn" id="markAllReadBtn">
                        <i class="fas fa-check-double"></i>
                        تحديد الكل كمقروء
                    </button>
                    <button class="notifications-action-btn" id="clearAllBtn">
                        <i class="fas fa-trash"></i>
                        حذف الكل
                    </button>
                </div>
                <div class="notifications-list" id="notificationsList">
                    <div class="notifications-loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        جاري التحميل...
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notificationModal);
        
        // Wire close button
        notificationModal.querySelector('.notifications-close').addEventListener('click', () => {
            notificationModal.classList.remove('show');
            document.body.classList.remove('modal-open');
        });
        
        // Close on backdrop click
        notificationModal.querySelector('.notifications-modal-backdrop').addEventListener('click', () => {
            notificationModal.classList.remove('show');
            document.body.classList.remove('modal-open');
        });
        
        // Wire action buttons
        const markAllReadBtn = notificationModal.querySelector('#markAllReadBtn');
        const clearAllBtn = notificationModal.querySelector('#clearAllBtn');
        
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', async () => {
                await markAllAsRead();
            });
        }
        
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', async () => {
                const confirmed = await window.showConfirm?.({
                    title: 'حذف جميع الإشعارات',
                    message: 'هل أنت متأكد من حذف جميع الإشعارات؟',
                    confirmText: 'حذف',
                    cancelText: 'إلغاء'
                });
                if (confirmed) {
                    await clearAllNotifications();
                }
            });
        }
        
        injectNotificationStyles();
    }
    
    // Wire notification buttons in header
    function wireNotificationButtons() {
        const notificationButtons = document.querySelectorAll('button.action-btn[title="الإشعارات"], button[title="الإشعارات"]');
        
        notificationButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (!notificationModal) {
                    createNotificationModal();
                }
                
                notificationModal.classList.add('show');
                document.body.classList.add('modal-open');
                
                loadNotifications();
            });
        });
    }
    
    // Load notifications from server
    async function loadNotifications() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            const res = await fetch('/api/notifications', {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
            
            if (!res.ok) throw new Error('Failed to load notifications');
            
            const data = await res.json();
            notifications = Array.isArray(data) ? data : [];
            unreadCount = notifications.filter(n => !n.read).length;
            
            renderNotifications();
            updateNotificationBadge();
        } catch (err) {
            console.error('Error loading notifications:', err);
            if (notificationModal) {
                const list = notificationModal.querySelector('#notificationsList');
                if (list) {
                    list.innerHTML = '<div class="notifications-error">حدث خطأ في تحميل الإشعارات</div>';
                }
            }
        }
    }
    
    // Render notifications list
    function renderNotifications() {
        if (!notificationModal) return;
        
        const list = notificationModal.querySelector('#notificationsList');
        if (!list) return;
        
        if (notifications.length === 0) {
            list.innerHTML = '<div class="notifications-empty"><i class="fas fa-bell-slash"></i><p>لا توجد إشعارات</p></div>';
            return;
        }
        
        // Sort by date (newest first)
        const sorted = [...notifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        list.innerHTML = sorted.map(notification => {
            const isUnread = !notification.read;
            const icon = getNotificationIcon(notification.type);
            const timeAgo = getTimeAgo(new Date(notification.createdAt));
            
            return `
                <div class="notification-item ${isUnread ? 'unread' : ''}" data-id="${notification._id}">
                    <div class="notification-icon ${notification.type || 'info'}">
                        <i class="${icon}"></i>
                    </div>
                    <div class="notification-content">
                        <div class="notification-title">${escapeHtml(notification.title || 'إشعار')}</div>
                        <div class="notification-body">${escapeHtml(notification.body || notification.message || '')}</div>
                        <div class="notification-time">${timeAgo}</div>
                    </div>
                    <div class="notification-actions">
                        ${isUnread ? `<button class="notification-mark-read" data-id="${notification._id}" title="تحديد كمقروء"><i class="fas fa-check"></i></button>` : ''}
                        <button class="notification-delete" data-id="${notification._id}" title="حذف"><i class="fas fa-times"></i></button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Wire notification item actions
        list.querySelectorAll('.notification-mark-read').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                await markAsRead(id);
            });
        });
        
        list.querySelectorAll('.notification-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                await deleteNotification(id);
            });
        });
        
        // Click on notification item to show details
        list.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                if (e.target.closest('.notification-actions')) return;
                const id = item.dataset.id;
                if (id) {
                    const notification = notifications.find(n => n._id === id);
                    if (notification) {
                        await markAsRead(id);
                        showNotificationDetails(notification);
                    }
                }
            });
        });
    }
    
    // Get notification icon based on type
    function getNotificationIcon(type) {
        const icons = {
            'course': 'fas fa-graduation-cap',
            'update': 'fas fa-sync-alt',
            'discount': 'fas fa-tag',
            'announcement': 'fas fa-bullhorn',
            'message': 'fas fa-envelope',
            'info': 'fas fa-info-circle',
            'success': 'fas fa-check-circle',
            'warning': 'fas fa-exclamation-triangle',
            'error': 'fas fa-times-circle'
        };
        return icons[type] || icons.info;
    }
    
    // Get time ago string
    function getTimeAgo(date) {
        const now = new Date();
        const diff = now - date;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `منذ ${days} ${days === 1 ? 'يوم' : 'أيام'}`;
        if (hours > 0) return `منذ ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`;
        if (minutes > 0) return `منذ ${minutes} ${minutes === 1 ? 'دقيقة' : 'دقائق'}`;
        return 'الآن';
    }
    
    // Add new notification
    function addNotification(notification) {
        notifications.unshift(notification);
        if (!notification.read) {
            unreadCount++;
        }
        renderNotifications();
        updateNotificationBadge();
    }
    
    // Mark notification as read
    async function markAsRead(id) {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            const res = await fetch(`/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
            
            if (res.ok) {
                const notification = notifications.find(n => n._id === id);
                if (notification) {
                    notification.read = true;
                    if (unreadCount > 0) unreadCount--;
                    renderNotifications();
                    updateNotificationBadge();
                }
            }
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    }
    
    // Mark all as read
    async function markAllAsRead() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            const res = await fetch('/api/notifications/mark-all-read', {
                method: 'PUT',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
            
            if (res.ok) {
                notifications.forEach(n => n.read = true);
                unreadCount = 0;
                renderNotifications();
                updateNotificationBadge();
            }
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
    }
    
    // Delete notification
    async function deleteNotification(id) {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            const res = await fetch(`/api/notifications/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
            
            if (res.ok) {
                const notification = notifications.find(n => n._id === id);
                if (notification && !notification.read) {
                    unreadCount--;
                }
                notifications = notifications.filter(n => n._id !== id);
                renderNotifications();
                updateNotificationBadge();
            }
        } catch (err) {
            console.error('Error deleting notification:', err);
        }
    }
    
    // Clear all notifications
    async function clearAllNotifications() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            const res = await fetch('/api/notifications/clear-all', {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
            
            if (res.ok) {
                notifications = [];
                unreadCount = 0;
                renderNotifications();
                updateNotificationBadge();
            }
        } catch (err) {
            console.error('Error clearing all notifications:', err);
        }
    }
    
    // Update notification badge in header
    function updateNotificationBadge() {
        const badges = document.querySelectorAll('.notification-badge');
        badges.forEach(badge => {
            if (unreadCount > 0) {
                badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                badge.style.display = 'inline-block';
            } else {
                badge.textContent = '';
                badge.style.display = 'none';
            }
        });
    }
    
    // Show notification toast
    function showNotificationToast(notification) {
        if (window.showToast) {
            window.showToast(notification.title || 'إشعار جديد', {
                type: notification.type || 'info',
                duration: 5000
            });
        }
        
        // Show browser notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title || 'إشعار جديد', {
                body: notification.body || notification.message || '',
                icon: '/img/loogo.png',
                tag: 'notification-' + notification._id
            });
        }
    }
    
    // Check for new notifications
    async function checkNewNotifications() {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        try {
            const res = await fetch('/api/notifications/unread-count', {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
            
            if (res.ok) {
                const data = await res.json();
                const newCount = data.count || 0;
                if (newCount !== unreadCount) {
                    loadNotifications();
                }
            }
        } catch (err) {
            console.error('Error checking notifications:', err);
        }
    }
    
    // Show notification details modal
    function showNotificationDetails(notification) {
        let detailsModal = document.getElementById('notificationDetailsModal');
        if (!detailsModal) {
            detailsModal = document.createElement('div');
            detailsModal.id = 'notificationDetailsModal';
            detailsModal.className = 'notification-details-modal';
            detailsModal.innerHTML = `
                <div class="notification-details-backdrop"></div>
                <div class="notification-details-content">
                    <div class="notification-details-header">
                        <h3>
                            <i class="${getNotificationIcon(notification.type)}"></i>
                            تفاصيل الإشعار
                        </h3>
                        <button class="notification-details-close">&times;</button>
                    </div>
                    <div class="notification-details-body" id="notificationDetailsBody">
                        <!-- Content will be inserted here -->
                    </div>
                </div>
            `;
            document.body.appendChild(detailsModal);
            
            // Wire close button
            detailsModal.querySelector('.notification-details-close').addEventListener('click', () => {
                detailsModal.classList.remove('show');
                document.body.classList.remove('modal-open');
            });
            
            // Close on backdrop click
            detailsModal.querySelector('.notification-details-backdrop').addEventListener('click', () => {
                detailsModal.classList.remove('show');
                document.body.classList.remove('modal-open');
            });
            
            // Add styles
            injectNotificationDetailsStyles();
        }
        
        // Parse and render content
        const body = detailsModal.querySelector('#notificationDetailsBody');
        const parsedContent = parseNotificationContent(notification.body || notification.message || '');
        
        body.innerHTML = `
            <div class="notification-details-title">${escapeHtml(notification.title || 'إشعار')}</div>
            <div class="notification-details-time">
                <i class="fas fa-clock"></i>
                ${new Date(notification.createdAt).toLocaleString('ar-SA')}
            </div>
            <div class="notification-details-content">
                ${parsedContent.html}
            </div>
        `;
        
        // Wire interactive elements
        wireNotificationContent(body, parsedContent);
        
        detailsModal.classList.add('show');
        document.body.classList.add('modal-open');
    }
    
    // Parse notification content to extract links, images, videos
    function parseNotificationContent(content) {
        const result = {
            text: content,
            links: [],
            images: [],
            videos: [],
            html: ''
        };
        
        if (!content) {
            result.html = '<p style="color: var(--text-secondary);">لا يوجد محتوى</p>';
            return result;
        }
        
        // Extract YouTube videos
        const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/g;
        let match;
        const videoIds = [];
        while ((match = youtubeRegex.exec(content)) !== null) {
            videoIds.push(match[1]);
            result.videos.push({
                id: match[1],
                url: `https://www.youtube.com/watch?v=${match[1]}`,
                embedUrl: `https://www.youtube.com/embed/${match[1]}`
            });
        }
        
        // Extract local video files (URLs ending with .mp4, .mov, etc. or starting with /uploads/videos/)
        // Support both relative paths (/uploads/videos/...) and absolute URLs
        const localVideoRegex = /(\/uploads\/videos\/[^\s\n\r]+)|(https?:\/\/[^\s\n\r]*\/uploads\/videos\/[^\s\n\r]+)|(https?:\/\/[^\s\n\r]+\.(mp4|mov|webm|ogg))/gi;
        const localVideos = [];
        let videoLastIndex = 0;
        localVideoRegex.lastIndex = 0; // Reset regex
        while ((match = localVideoRegex.exec(content)) !== null) {
            const videoUrl = (match[1] && match[1].trim()) || (match[2] && match[2].trim()) || (match[3] && match[3].trim());
            // Skip if already added as YouTube video
            if (videoUrl && !videoIds.some(id => videoUrl.includes(id)) && !localVideos.includes(videoUrl)) {
                localVideos.push(videoUrl);
                result.videos.push({
                    url: videoUrl,
                    embedUrl: null // Local video, no embed URL
                });
                console.log('Found local video:', videoUrl);
            }
            // Prevent infinite loop
            if (match.index === videoLastIndex) break;
            videoLastIndex = match.index;
        }
        
        // Extract images (URLs ending with image extensions or containing 🖼️, including relative paths)
        // Pattern 1: 🖼️ followed by any path (relative or absolute) - this is the main pattern
        // Pattern 2: Relative paths starting with /uploads/ (without emoji)
        // Pattern 3: Absolute URLs with image extensions (without emoji)
        const imageRegex = /🖼️\s*([^\s\n\r]+)|(\/uploads\/[^\s\n\r]+\.(jpg|jpeg|png|gif|webp|svg))|(https?:\/\/[^\s\n\r]+\.(jpg|jpeg|png|gif|webp|svg))/gi;
        const images = [];
        let imageLastIndex = 0;
        imageRegex.lastIndex = 0; // Reset regex
        while ((match = imageRegex.exec(content)) !== null) {
            // match[1] = after emoji, match[2] = relative /uploads/, match[4] = absolute URL
            const imageUrl = (match[1] && match[1].trim()) || (match[2] && match[2].trim()) || (match[4] && match[4].trim());
            if (imageUrl && !images.includes(imageUrl)) {
                images.push(imageUrl);
                result.images.push(imageUrl);
                console.log('Found image:', imageUrl);
            }
            // Prevent infinite loop
            if (match.index === imageLastIndex) break;
            imageLastIndex = match.index;
        }
        
        // Extract regular links (not YouTube or images)
        const linkRegex = /(https?:\/\/[^\s]+)/g;
        const links = [];
        let processedContent = content;
        
        // Remove video URLs from text
        videoIds.forEach(id => {
            processedContent = processedContent.replace(new RegExp(`https?://[^\\s]*youtube[^\\s]*${id}[^\\s]*`, 'g'), '');
        });
        
        // Remove local video URLs from text
        localVideos.forEach(videoUrl => {
            processedContent = processedContent.replace(new RegExp(videoUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
        });
        
        // Remove image URLs from text (including emoji prefix)
        images.forEach(img => {
            // Remove with emoji prefix
            processedContent = processedContent.replace(new RegExp(`🖼️\\s*${img.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'), '');
            // Remove without emoji (if it appears separately)
            processedContent = processedContent.replace(new RegExp(img.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
        });
        
        // Extract remaining links
        while ((match = linkRegex.exec(processedContent)) !== null) {
            const url = match[1];
            if (!url.includes('youtube') && !url.match(/\.(jpg|jpeg|png|gif|webp|svg)/i) && !links.includes(url)) {
                links.push(url);
                result.links.push(url);
            }
        }
        
        // Build HTML - work with original content to preserve image/video markers
        let html = content;
        
        // Replace newlines with <br>
        html = html.replace(/\n/g, '<br>');
        
        // Replace image markers with image placeholders FIRST (before removing from text)
        result.images.forEach(img => {
            // Convert relative URLs to absolute
            const fullImageUrl = img.startsWith('/') ? window.location.origin + img : img;
            const escapedImg = img.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            
            // Debug
            console.log('Processing image:', img, 'Full URL:', fullImageUrl);
            
            // Create a unique placeholder to prevent double replacement
            const placeholder = `__IMAGE_PLACEHOLDER_${result.images.indexOf(img)}__`;
            
            // Replace with emoji prefix first (case-insensitive, handle spaces)
            const emojiPattern = new RegExp(`🖼️\\s*${escapedImg}`, 'gi');
            emojiPattern.lastIndex = 0; // Reset before use
            html = html.replace(emojiPattern, placeholder);
            
            // Also replace if image URL appears without emoji (standalone) - but only if not already replaced
            if (html.includes(img) && !html.includes(placeholder)) {
                const standalonePattern = new RegExp(escapedImg, 'g');
                standalonePattern.lastIndex = 0; // Reset before use
                html = html.replace(standalonePattern, placeholder);
            }
            
            // Now replace placeholder with actual image HTML
            html = html.replace(placeholder, 
                `<div class="notification-image-container">
                    <img src="${fullImageUrl}" alt="Image" class="notification-image" data-src="${fullImageUrl}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0;">
                </div>`
            );
        });
        
        // Replace video URLs with video player FIRST (before removing from text)
        result.videos.forEach(video => {
            const escapedVideoUrl = video.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            
            // Debug
            console.log('Processing video:', video.url, 'Is YouTube:', !!video.embedUrl);
            
            // Check if it's a YouTube URL
            if (video.embedUrl) {
                const videoPattern = new RegExp(escapedVideoUrl, 'g');
                videoPattern.lastIndex = 0; // Reset before use
                html = html.replace(videoPattern, 
                    `<div class="notification-video-container">
                        <div class="notification-video-wrapper">
                            <iframe 
                                src="${video.embedUrl}" 
                                frameborder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowfullscreen
                                class="notification-video"
                                style="width: 100%; max-width: 100%; aspect-ratio: 16/9; border-radius: 8px;">
                            </iframe>
                        </div>
                    </div>`
                );
            } else {
                // Local video file - convert relative URLs to absolute
                const fullVideoUrl = video.url.startsWith('/') ? window.location.origin + video.url : video.url;
                const videoPattern = new RegExp(escapedVideoUrl, 'g');
                videoPattern.lastIndex = 0; // Reset before use
                html = html.replace(videoPattern, 
                    `<div class="notification-video-container">
                        <div class="notification-video-wrapper">
                            <video controls style="width: 100%; max-width: 100%; border-radius: 8px; margin: 12px 0;">
                                <source src="${fullVideoUrl}" type="video/mp4">
                                متصفحك لا يدعم تشغيل الفيديو.
                            </video>
                        </div>
                    </div>`
                );
            }
        });
        
        // Debug: log extracted images and videos
        console.log('Extracted images:', result.images);
        console.log('Extracted videos:', result.videos);
        console.log('Final HTML preview:', html.substring(0, 500));
        
        // Replace links with clickable links
        result.links.forEach(link => {
            html = html.replace(new RegExp(link.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 
                `<a href="${link}" target="_blank" rel="noopener noreferrer" class="notification-link">
                    <i class="fas fa-external-link-alt"></i> ${link}
                </a>`
            );
        });
        
        result.html = html;
        return result;
    }
    
    // Wire interactive elements in notification content
    function wireNotificationContent(container, parsedContent) {
        // Wire image clicks for fullscreen
        container.querySelectorAll('.notification-image').forEach(img => {
            img.addEventListener('click', () => {
                showImageFullscreen(img.src);
            });
        });
        
        // Links are already clickable via <a> tags
    }
    
    // Show image in fullscreen modal
    function showImageFullscreen(imageSrc) {
        let fullscreenModal = document.getElementById('imageFullscreenModal');
        if (!fullscreenModal) {
            fullscreenModal = document.createElement('div');
            fullscreenModal.id = 'imageFullscreenModal';
            fullscreenModal.className = 'image-fullscreen-modal';
            fullscreenModal.innerHTML = `
                <div class="image-fullscreen-backdrop"></div>
                <div class="image-fullscreen-content">
                    <button class="image-fullscreen-close">&times;</button>
                    <img class="image-fullscreen-img" src="" alt="Fullscreen Image">
                </div>
            `;
            document.body.appendChild(fullscreenModal);
            
            // Wire close
            fullscreenModal.querySelector('.image-fullscreen-close').addEventListener('click', () => {
                fullscreenModal.classList.remove('show');
                document.body.classList.remove('modal-open');
            });
            
            fullscreenModal.querySelector('.image-fullscreen-backdrop').addEventListener('click', () => {
                fullscreenModal.classList.remove('show');
                document.body.classList.remove('modal-open');
            });
            
            // Add styles
            if (!document.getElementById('image-fullscreen-styles')) {
                const style = document.createElement('style');
                style.id = 'image-fullscreen-styles';
                style.textContent = `
                    .image-fullscreen-modal {
                        display: none;
                        position: fixed;
                        inset: 0;
                        z-index: 20000;
                        align-items: center;
                        justify-content: center;
                        background: rgba(0, 0, 0, 0.95);
                    }
                    
                    .image-fullscreen-modal.show {
                        display: flex;
                    }
                    
                    .image-fullscreen-content {
                        position: relative;
                        max-width: 95%;
                        max-height: 95%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    
                    .image-fullscreen-img {
                        max-width: 100%;
                        max-height: 95vh;
                        object-fit: contain;
                        border-radius: 8px;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                    }
                    
                    .image-fullscreen-close {
                        position: absolute;
                        top: -50px;
                        right: 0;
                        background: rgba(255, 255, 255, 0.2);
                        border: none;
                        color: white;
                        font-size: 2rem;
                        width: 48px;
                        height: 48px;
                        border-radius: 50%;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    
                    .image-fullscreen-close:hover {
                        background: rgba(255, 255, 255, 0.3);
                        transform: scale(1.1);
                    }
                `;
                document.head.appendChild(style);
            }
        }
        
        fullscreenModal.querySelector('.image-fullscreen-img').src = imageSrc;
        fullscreenModal.classList.add('show');
        document.body.classList.add('modal-open');
    }
    
    // Inject notification details styles
    function injectNotificationDetailsStyles() {
        if (document.getElementById('notification-details-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'notification-details-styles';
        style.textContent = `
            .notification-details-modal {
                display: none;
                position: fixed;
                inset: 0;
                z-index: 15000;
                align-items: center;
                justify-content: center;
            }
            
            .notification-details-modal.show {
                display: flex;
            }
            
            .notification-details-backdrop {
                position: absolute;
                inset: 0;
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(4px);
            }
            
            .notification-details-content {
                position: relative;
                width: 90%;
                max-width: 800px;
                max-height: 90vh;
                background: var(--bg-primary, #ffffff);
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                animation: slideUp 0.3s ease;
            }
            
            .notification-details-header {
                padding: 24px;
                border-bottom: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            
            .notification-details-header h3 {
                margin: 0;
                font-size: 1.25rem;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .notification-details-close {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                font-size: 1.5rem;
                width: 36px;
                height: 36px;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .notification-details-close:hover {
                background: rgba(255, 255, 255, 0.3);
            }
            
            .notification-details-body {
                padding: 24px;
                overflow-y: auto;
                flex: 1;
            }
            
            .notification-details-title {
                font-size: 1.5rem;
                font-weight: 700;
                color: var(--text-primary, #1a1a1a);
                margin-bottom: 16px;
            }
            
            .notification-details-time {
                display: flex;
                align-items: center;
                gap: 8px;
                color: var(--text-secondary, #666);
                font-size: 0.875rem;
                margin-bottom: 24px;
                padding-bottom: 16px;
                border-bottom: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
            }
            
            .notification-details-content {
                color: var(--text-primary, #1a1a1a);
                line-height: 1.8;
                font-size: 1rem;
            }
            
            .notification-image-container {
                margin: 20px 0;
                text-align: center;
            }
            
            .notification-image {
                max-width: 100%;
                height: auto;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            
            .notification-image:hover {
                transform: scale(1.02);
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            }
            
            .notification-video-container {
                margin: 24px 0;
            }
            
            .notification-video-wrapper {
                position: relative;
                padding-bottom: 56.25%; /* 16:9 aspect ratio */
                height: 0;
                overflow: hidden;
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            
            .notification-video {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                border: none;
            }
            
            .notification-link {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                color: var(--primary-color, #4f46e5);
                text-decoration: none;
                padding: 8px 12px;
                background: var(--bg-secondary, #f8f9fa);
                border-radius: 8px;
                transition: all 0.2s ease;
                margin: 4px;
                word-break: break-all;
            }
            
            .notification-link:hover {
                background: var(--primary-color, #4f46e5);
                color: white;
                transform: translateY(-2px);
            }
            
            @media (prefers-color-scheme: dark) {
                .notification-details-content {
                    background: var(--bg-primary, #1a1a1a);
                }
                
                .notification-details-header {
                    border-bottom-color: var(--border-color, rgba(255, 255, 255, 0.1));
                }
                
                .notification-details-title {
                    color: var(--text-primary, #ffffff);
                }
                
                .notification-details-time {
                    color: var(--text-secondary, #aaaaaa);
                    border-bottom-color: var(--border-color, rgba(255, 255, 255, 0.1));
                }
                
                .notification-details-content {
                    color: var(--text-primary, #ffffff);
                }
                
                .notification-link {
                    background: var(--bg-secondary, #2a2a2a);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Inject notification styles
    function injectNotificationStyles() {
        if (document.getElementById('notifications-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'notifications-styles';
        style.textContent = `
            .notifications-modal {
                display: none;
                position: fixed;
                inset: 0;
                z-index: 10000;
                align-items: center;
                justify-content: center;
            }
            
            .notifications-modal.show {
                display: flex;
            }
            
            .notifications-modal-backdrop {
                position: absolute;
                inset: 0;
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(4px);
            }
            
            .notifications-modal-content {
                position: relative;
                width: 90%;
                max-width: 600px;
                max-height: 80vh;
                background: var(--bg-primary, #ffffff);
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                display: flex;
                flex-direction: column;
                overflow: hidden;
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
            
            .notifications-header {
                padding: 20px 24px;
                border-bottom: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: var(--bg-primary, #ffffff);
            }
            
            .notifications-header h3 {
                margin: 0;
                font-size: 1.25rem;
                font-weight: 600;
                color: var(--text-primary, #1a1a1a);
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .notifications-count-badge {
                background: var(--primary-color, #4f46e5);
                color: white;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 0.75rem;
                font-weight: 600;
            }
            
            .notifications-close {
                background: none;
                border: none;
                font-size: 1.5rem;
                color: var(--text-secondary, #666);
                cursor: pointer;
                padding: 8px;
                border-radius: 8px;
                transition: all 0.2s ease;
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .notifications-close:hover {
                background: var(--bg-secondary, #f8f9fa);
                color: var(--text-primary, #1a1a1a);
            }
            
            .notifications-actions {
                padding: 12px 24px;
                border-bottom: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
                display: flex;
                gap: 8px;
                background: var(--bg-secondary, #f8f9fa);
            }
            
            .notifications-action-btn {
                padding: 8px 16px;
                border: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
                border-radius: 8px;
                background: var(--bg-primary, #ffffff);
                color: var(--text-primary, #1a1a1a);
                cursor: pointer;
                font-size: 0.875rem;
                display: flex;
                align-items: center;
                gap: 6px;
                transition: all 0.2s ease;
            }
            
            .notifications-action-btn:hover {
                background: var(--bg-tertiary, #e9ecef);
                border-color: var(--primary-color, #4f46e5);
            }
            
            .notifications-list {
                flex: 1;
                overflow-y: auto;
                padding: 8px;
            }
            
            .notifications-loading,
            .notifications-empty,
            .notifications-error {
                padding: 40px 20px;
                text-align: center;
                color: var(--text-secondary, #666);
            }
            
            .notifications-empty i {
                font-size: 3rem;
                opacity: 0.3;
                margin-bottom: 16px;
            }
            
            .notification-item {
                padding: 16px;
                border-radius: 12px;
                margin-bottom: 8px;
                display: flex;
                gap: 12px;
                align-items: flex-start;
                background: var(--bg-primary, #ffffff);
                border: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .notification-item:hover {
                background: var(--bg-secondary, #f8f9fa);
                transform: translateX(-2px);
            }
            
            .notification-item.unread {
                background: var(--bg-secondary, #f0f4ff);
                border-left: 3px solid var(--primary-color, #4f46e5);
            }
            
            .notification-icon {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                font-size: 1.125rem;
            }
            
            .notification-icon.course {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            
            .notification-icon.update {
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                color: white;
            }
            
            .notification-icon.discount {
                background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                color: white;
            }
            
            .notification-icon.announcement {
                background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
                color: white;
            }
            
            .notification-icon.message {
                background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);
                color: white;
            }
            
            .notification-icon.info {
                background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
                color: #333;
            }
            
            .notification-icon.success {
                background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
                color: #333;
            }
            
            .notification-icon.warning {
                background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
                color: #333;
            }
            
            .notification-icon.error {
                background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
                color: #333;
            }
            
            .notification-content {
                flex: 1;
                min-width: 0;
            }
            
            .notification-title {
                font-weight: 600;
                font-size: 0.95rem;
                color: var(--text-primary, #1a1a1a);
                margin-bottom: 4px;
            }
            
            .notification-item.unread .notification-title {
                font-weight: 700;
            }
            
            .notification-body {
                font-size: 0.875rem;
                color: var(--text-secondary, #666);
                line-height: 1.5;
                margin-bottom: 6px;
            }
            
            .notification-time {
                font-size: 0.75rem;
                color: var(--text-muted, #999);
            }
            
            .notification-actions {
                display: flex;
                gap: 4px;
                flex-shrink: 0;
            }
            
            .notification-mark-read,
            .notification-delete {
                width: 32px;
                height: 32px;
                border: none;
                border-radius: 6px;
                background: transparent;
                color: var(--text-secondary, #666);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
            }
            
            .notification-mark-read:hover {
                background: var(--bg-tertiary, #e9ecef);
                color: var(--primary-color, #4f46e5);
            }
            
            .notification-delete:hover {
                background: var(--bg-tertiary, #e9ecef);
                color: #e74c3c;
            }
            
            /* Dark Mode */
            @media (prefers-color-scheme: dark) {
                .notifications-modal-backdrop {
                    background: rgba(0, 0, 0, 0.8);
                }
                
                .notifications-modal-content {
                    background: var(--bg-primary, #1a1a1a);
                }
                
                .notifications-header {
                    background: var(--bg-primary, #1a1a1a);
                    border-bottom-color: var(--border-color, rgba(255, 255, 255, 0.1));
                }
                
                .notifications-header h3 {
                    color: var(--text-primary, #ffffff);
                }
                
                .notifications-actions {
                    background: var(--bg-secondary, #2a2a2a);
                    border-bottom-color: var(--border-color, rgba(255, 255, 255, 0.1));
                }
                
                .notifications-action-btn {
                    background: var(--bg-primary, #1a1a1a);
                    color: var(--text-primary, #ffffff);
                    border-color: var(--border-color, rgba(255, 255, 255, 0.1));
                }
                
                .notifications-action-btn:hover {
                    background: var(--bg-tertiary, #333);
                }
                
                .notification-item {
                    background: var(--bg-primary, #1a1a1a);
                    border-color: var(--border-color, rgba(255, 255, 255, 0.1));
                }
                
                .notification-item:hover {
                    background: var(--bg-secondary, #2a2a2a);
                }
                
                .notification-item.unread {
                    background: var(--bg-secondary, #2a2a2a);
                }
                
                .notification-title {
                    color: var(--text-primary, #ffffff);
                }
                
                .notification-body {
                    color: var(--text-secondary, #aaaaaa);
                }
                
                .notification-time {
                    color: var(--text-muted, #888);
                }
                
                .notification-mark-read:hover,
                .notification-delete:hover {
                    background: var(--bg-tertiary, #333);
                }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeNotifications);
    } else {
        initializeNotifications();
    }
    
    // Expose API
    window.Notifications = {
        load: loadNotifications,
        markAsRead: markAsRead,
        delete: deleteNotification,
        markAllAsRead: markAllAsRead,
        clearAll: clearAllNotifications
    };
})();

