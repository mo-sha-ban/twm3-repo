// Admin messaging UI helper (modern and simple)
(function(){
    'use strict';
    
    let currentContentType = 'text';
    
    async function sendMessage(payload){
        const token = localStorage.getItem('token');
        const res = await fetch('/api/messages/send', { 
            method: 'POST', 
            headers: { 
                'Content-Type':'application/json', 
                'Authorization': token? 'Bearer '+token : '' 
            }, 
            body: JSON.stringify(payload) 
        });
        return res;
    }

    function extractYouTubeId(url) {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    let uploadedImageUrl = null;
    let uploadedVideoUrl = null;
    
    async function uploadImageFile(file) {
        const formData = new FormData();
        formData.append('image', file);
        
        const token = localStorage.getItem('token');
        const res = await fetch('/api/upload/notification-image', {
            method: 'POST',
            headers: {
                'Authorization': token ? 'Bearer ' + token : ''
            },
            body: formData
        });
        
        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: 'فشل رفع الصورة' }));
            throw new Error(error.error || 'فشل رفع الصورة');
        }
        
        const data = await res.json();
        return data.url;
    }
    
    async function uploadVideoFile(file) {
        const formData = new FormData();
        formData.append('video', file);
        
        const token = localStorage.getItem('token');
        const res = await fetch('/api/upload/notification-video', {
            method: 'POST',
            headers: {
                'Authorization': token ? 'Bearer ' + token : ''
            },
            body: formData
        });
        
        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: 'فشل رفع الفيديو' }));
            throw new Error(error.error || 'فشل رفع الفيديو');
        }
        
        const data = await res.json();
        return data.url;
    }
    
    async function buildMessageContent() {
        let subject = '';
        let body = '';
        let contentType = currentContentType;
        
        switch(currentContentType) {
            case 'text':
                subject = document.getElementById('adminSubject').value.trim();
                body = document.getElementById('adminBody').value.trim();
                break;
            case 'link':
                subject = document.getElementById('adminSubjectLink').value.trim();
                const linkText = document.getElementById('adminBodyLink').value.trim();
                const linkUrl = document.getElementById('adminLink').value.trim();
                body = linkText + (linkUrl ? `\n\n🔗 ${linkUrl}` : '');
                break;
            case 'image':
                subject = document.getElementById('adminSubjectImage').value.trim();
                const imageText = document.getElementById('adminBodyImage').value.trim();
                const imageFile = document.getElementById('adminImageFile').files[0];
                const imageUrl = document.getElementById('adminImageUrl').value.trim();
                
                // Prioritize uploaded file over URL
                if (imageFile) {
                    try {
                        const uploadedUrl = await uploadImageFile(imageFile);
                        body = imageText + (uploadedUrl ? `\n\n🖼️ ${uploadedUrl}` : '');
                    } catch (err) {
                        throw err;
                    }
                } else if (imageUrl) {
                    body = imageText + `\n\n🖼️ ${imageUrl}`;
                } else {
                    body = imageText;
                }
                break;
            case 'video':
                subject = document.getElementById('adminSubjectVideo').value.trim();
                const videoText = document.getElementById('adminBodyVideo').value.trim();
                const videoFile = document.getElementById('adminVideoFile').files[0];
                const videoUrl = document.getElementById('adminVideoUrl').value.trim();
                
                // Prioritize uploaded file over YouTube URL
                if (videoFile) {
                    try {
                        const uploadedUrl = await uploadVideoFile(videoFile);
                        body = videoText + (uploadedUrl ? (videoText ? '\n\n' : '') + uploadedUrl : '');
                    } catch (err) {
                        throw err;
                    }
                } else if (videoUrl) {
                    const videoId = extractYouTubeId(videoUrl);
                    if (videoId) {
                        body = videoText + (videoText ? '\n\n' : '') + `https://www.youtube.com/watch?v=${videoId}`;
                    } else {
                        body = videoText + (videoText ? '\n\n' : '') + videoUrl;
                    }
                } else {
                    body = videoText;
                }
                break;
        }
        
        return { subject, body, contentType };
    }

    function buildEmailHTML(subject, body, contentType) {
        let htmlBody = body.replace(/\n/g, '<br>');
        
        // Convert URLs to links
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        htmlBody = htmlBody.replace(urlRegex, '<a href="$1" style="color: #4f46e5; text-decoration: none;">$1</a>');
        
        // Handle images
        if (contentType === 'image') {
            const imageMatch = body.match(/🖼️\s*(https?:\/\/[^\s]+)/);
            if (imageMatch) {
                const imageUrl = imageMatch[1];
                htmlBody = htmlBody.replace(/🖼️\s*https?:\/\/[^\s]+/, `<img src="${imageUrl}" alt="Image" style="max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0;">`);
            }
        }
        
        // Handle YouTube videos
        if (contentType === 'video') {
            const videoMatch = body.match(/https?:\/\/[^\s]*youtube[^\s]*/);
            if (videoMatch) {
                const videoUrl = videoMatch[0];
                const videoId = extractYouTubeId(videoUrl);
                if (videoId) {
                    htmlBody = htmlBody.replace(videoUrl, `
                        <div style="margin: 16px 0;">
                            <a href="${videoUrl}" style="display: inline-block; padding: 12px 24px; background: #ff0000; color: white; text-decoration: none; border-radius: 8px;">
                                <i class="fab fa-youtube"></i> شاهد الفيديو على YouTube
                            </a>
                        </div>
                    `);
                }
            }
        }
        
        return `
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: 'Cairo', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0;">TeamWork M3</h1>
                </div>
                <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                    <h2 style="color: #1a1a1a; margin-top: 0;">${subject || 'رسالة من الإدارة'}</h2>
                    <div style="color: #4b5563;">
                        ${htmlBody}
                    </div>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0;">
                        هذه رسالة تلقائية من TeamWork M3. يرجى عدم الرد على هذا البريد.
                    </p>
                </div>
            </body>
            </html>
        `;
    }

    function injectStyles() {
        if (document.getElementById('admin-messaging-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'admin-messaging-styles';
        style.textContent = `
            .admin-message-modal {
                display: none;
                position: fixed;
                inset: 0;
                z-index: 10000;
                align-items: center;
                justify-content: center;
            }
            
            .admin-message-modal.show {
                display: flex;
            }
            
            .admin-message-modal .modal-backdrop {
                position: absolute;
                inset: 0;
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(4px);
            }
            
            .admin-message-content {
                position: relative;
                width: 90%;
                max-width: 700px;
                max-height: 90vh;
                background: var(--bg-primary, #ffffff);
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                overflow: hidden;
                display: flex;
                flex-direction: column;
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
            
            .admin-message-content .modal-header {
                padding: 24px;
                border-bottom: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            
            .admin-message-content .modal-header h3 {
                margin: 0;
                font-size: 1.25rem;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .admin-message-content .modal-close {
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
            
            .admin-message-content .modal-close:hover {
                background: rgba(255, 255, 255, 0.3);
            }
            
            .admin-message-content form {
                padding: 24px;
                overflow-y: auto;
                flex: 1;
            }
            
            .form-section {
                margin-bottom: 24px;
            }
            
            .form-label {
                display: block;
                font-weight: 600;
                margin-bottom: 12px;
                color: var(--text-primary, #1a1a1a);
            }
            
            .radio-group {
                display: flex;
                gap: 16px;
                margin-bottom: 16px;
            }
            
            .radio-label {
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                padding: 12px 16px;
                border: 2px solid var(--border-color, rgba(0, 0, 0, 0.1));
                border-radius: 8px;
                transition: all 0.2s ease;
            }
            
            .radio-label:hover {
                border-color: var(--primary-color, #4f46e5);
            }
            
            .radio-label input[type="radio"] {
                display: none;
            }
            
            .radio-label input[type="radio"]:checked + .radio-custom {
                background: var(--primary-color, #4f46e5);
                border-color: var(--primary-color, #4f46e5);
            }
            
            .radio-label input[type="radio"]:checked + .radio-custom::after {
                content: '';
                position: absolute;
                inset: 3px;
                background: white;
                border-radius: 50%;
            }
            
            .radio-label input[type="radio"]:checked ~ span:last-child {
                color: var(--primary-color, #4f46e5);
                font-weight: 600;
            }
            
            .radio-custom {
                width: 20px;
                height: 20px;
                border: 2px solid var(--border-color, rgba(0, 0, 0, 0.2));
                border-radius: 50%;
                position: relative;
                transition: all 0.2s ease;
            }
            
            .content-type-tabs {
                display: flex;
                gap: 8px;
                margin-bottom: 16px;
                border-bottom: 2px solid var(--border-color, rgba(0, 0, 0, 0.1));
            }
            
            .content-tab {
                padding: 12px 20px;
                border: none;
                background: transparent;
                color: var(--text-secondary, #666);
                cursor: pointer;
                border-bottom: 2px solid transparent;
                margin-bottom: -2px;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 0.95rem;
            }
            
            .content-tab:hover {
                color: var(--primary-color, #4f46e5);
            }
            
            .content-tab.active {
                color: var(--primary-color, #4f46e5);
                border-bottom-color: var(--primary-color, #4f46e5);
                font-weight: 600;
            }
            
            .content-panel {
                display: none;
            }
            
            .content-panel.active {
                display: block;
            }
            
            .form-group {
                margin-bottom: 16px;
            }
            
            .form-group label {
                display: block;
                margin-bottom: 8px;
                font-weight: 500;
                color: var(--text-primary, #1a1a1a);
            }
            
            .form-group input,
            .form-group textarea {
                width: 100%;
                padding: 12px;
                border: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
                border-radius: 8px;
                font-size: 0.95rem;
                font-family: inherit;
                transition: all 0.2s ease;
                box-sizing: border-box;
            }
            
            .form-group input:focus,
            .form-group textarea:focus {
                outline: none;
                border-color: var(--primary-color, #4f46e5);
                box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
            }
            
            .form-hint {
                display: block;
                margin-top: 6px;
                font-size: 0.875rem;
                color: var(--text-secondary, #666);
            }
            
            .file-upload-wrapper {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 8px;
            }
            
            .file-upload-btn {
                padding: 10px 20px;
                background: var(--bg-secondary, #f8f9fa);
                border: 2px dashed var(--border-color, rgba(0, 0, 0, 0.2));
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 8px;
                color: var(--text-primary, #1a1a1a);
                font-size: 0.95rem;
            }
            
            .file-upload-btn:hover {
                background: var(--bg-tertiary, #e9ecef);
                border-color: var(--primary-color, #4f46e5);
            }
            
            .file-upload-name {
                color: var(--text-secondary, #666);
                font-size: 0.875rem;
                flex: 1;
            }
            
            .image-preview,
            .video-preview {
                border: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
                border-radius: 8px;
                padding: 8px;
                background: var(--bg-secondary, #f8f9fa);
            }
            
            .checkbox-label {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                cursor: pointer;
                padding: 16px;
                border: 2px solid var(--border-color, rgba(0, 0, 0, 0.1));
                border-radius: 8px;
                transition: all 0.2s ease;
            }
            
            .checkbox-label:hover {
                border-color: var(--primary-color, #4f46e5);
            }
            
            .checkbox-label input[type="checkbox"] {
                display: none;
            }
            
            .checkbox-label input[type="checkbox"]:checked + .checkbox-custom {
                background: var(--primary-color, #4f46e5);
                border-color: var(--primary-color, #4f46e5);
            }
            
            .checkbox-label input[type="checkbox"]:checked + .checkbox-custom::after {
                content: '✓';
                position: absolute;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 14px;
                font-weight: bold;
            }
            
            .checkbox-custom {
                width: 24px;
                height: 24px;
                border: 2px solid var(--border-color, rgba(0, 0, 0, 0.2));
                border-radius: 6px;
                position: relative;
                flex-shrink: 0;
                transition: all 0.2s ease;
            }
            
            .checkbox-label span:last-child {
                flex: 1;
            }
            
            .checkbox-label strong {
                display: block;
                margin-bottom: 4px;
                color: var(--text-primary, #1a1a1a);
            }
            
            .checkbox-label small {
                display: block;
                color: var(--text-secondary, #666);
                font-size: 0.875rem;
            }
            
            .form-actions {
                display: flex;
                gap: 12px;
                justify-content: flex-end;
                margin-top: 24px;
                padding-top: 24px;
                border-top: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
            }
            
            .btn {
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .btn-secondary {
                background: var(--bg-secondary, #f8f9fa);
                color: var(--text-primary, #1a1a1a);
            }
            
            .btn-secondary:hover {
                background: var(--bg-tertiary, #e9ecef);
            }
            
            .btn-primary {
                background: var(--primary-color, #4f46e5);
                color: white;
            }
            
            .btn-primary:hover {
                background: var(--primary-dark, #4338ca);
                transform: translateY(-2px);
            }
            
            @media (prefers-color-scheme: dark) {
                .admin-message-content {
                    background: var(--bg-primary, #1a1a1a);
                }
                
                .admin-message-content .modal-header {
                    border-bottom-color: var(--border-color, rgba(255, 255, 255, 0.1));
                }
                
                .form-label,
                .form-group label,
                .checkbox-label strong {
                    color: var(--text-primary, #ffffff);
                }
                
                .form-group input,
                .form-group textarea {
                    background: var(--bg-secondary, #2a2a2a);
                    color: var(--text-primary, #ffffff);
                    border-color: var(--border-color, rgba(255, 255, 255, 0.1));
                }
                
                .radio-label,
                .checkbox-label {
                    border-color: var(--border-color, rgba(255, 255, 255, 0.1));
                }
                
                .form-actions {
                    border-top-color: var(--border-color, rgba(255, 255, 255, 0.1));
                }
                
                .file-upload-btn {
                    background: var(--bg-secondary, #2a2a2a);
                    border-color: var(--border-color, rgba(255, 255, 255, 0.1));
                    color: var(--text-primary, #ffffff);
                }
                
                .file-upload-btn:hover {
                    background: var(--bg-tertiary, #333);
                }
                
                .image-preview,
                .video-preview {
                    background: var(--bg-secondary, #2a2a2a);
                    border-color: var(--border-color, rgba(255, 255, 255, 0.1));
                }
            }
        `;
        document.head.appendChild(style);
    }

    document.addEventListener('DOMContentLoaded', ()=>{
        injectStyles();
        
        const openBtn = document.getElementById('openAdminMessages');
        const modal = document.getElementById('adminMessagesModal');
        const closeBtn = document.getElementById('closeAdminMessages');
        const cancelBtn = document.getElementById('cancelAdminMsg');
        
        if(openBtn) {
            openBtn.addEventListener('click', ()=>{ 
                modal.classList.add('show'); 
                document.body.classList.add('modal-open'); 
            });
        }
        
        if(closeBtn) {
            closeBtn.addEventListener('click', ()=>{ 
                modal.classList.remove('show'); 
                document.body.classList.remove('modal-open'); 
            });
        }
        
        if(cancelBtn) {
            cancelBtn.addEventListener('click', ()=>{ 
                modal.classList.remove('show'); 
                document.body.classList.remove('modal-open'); 
            });
        }
        
        // Close on backdrop click
        if(modal) {
            modal.querySelector('.modal-backdrop')?.addEventListener('click', ()=>{ 
                modal.classList.remove('show'); 
                document.body.classList.remove('modal-open'); 
            });
        }

        // Handle recipient type change
        const toAll = document.getElementById('toAll');
        const toSpecific = document.getElementById('toSpecific');
        const recipientInputGroup = document.getElementById('recipientInputGroup');
        
        if(toAll && toSpecific && recipientInputGroup) {
            toAll.addEventListener('change', () => {
                if(toAll.checked) {
                    recipientInputGroup.style.display = 'none';
                }
            });
            
            toSpecific.addEventListener('change', () => {
                if(toSpecific.checked) {
                    recipientInputGroup.style.display = 'block';
                }
            });
        }

        // Handle content type tabs
        const contentTabs = document.querySelectorAll('.content-tab');
        const contentPanels = document.querySelectorAll('.content-panel');
        
        contentTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const type = tab.dataset.type;
                currentContentType = type;
                
                // Update tabs
                contentTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Update panels
                contentPanels.forEach(p => {
                    p.classList.remove('active');
                    p.style.display = 'none';
                });
                
                const targetPanel = document.getElementById(`content${type.charAt(0).toUpperCase() + type.slice(1)}`);
                if(targetPanel) {
                    targetPanel.classList.add('active');
                    targetPanel.style.display = 'block';
                }
            });
        });

        // Wire file upload buttons
        const adminImageFileBtn = document.getElementById('adminImageFileBtn');
        const adminImageFile = document.getElementById('adminImageFile');
        const adminImageFileName = document.getElementById('adminImageFileName');
        const adminImagePreview = document.getElementById('adminImagePreview');
        const adminImagePreviewImg = document.getElementById('adminImagePreviewImg');
        
        if(adminImageFileBtn && adminImageFile) {
            adminImageFileBtn.addEventListener('click', () => {
                adminImageFile.click();
            });
            
            adminImageFile.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    adminImageFileName.textContent = file.name;
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        adminImagePreviewImg.src = e.target.result;
                        adminImagePreview.style.display = 'block';
                    };
                    reader.readAsDataURL(file);
                } else {
                    adminImageFileName.textContent = 'لم يتم اختيار ملف';
                    adminImagePreview.style.display = 'none';
                }
            });
        }
        
        const adminVideoFileBtn = document.getElementById('adminVideoFileBtn');
        const adminVideoFile = document.getElementById('adminVideoFile');
        const adminVideoFileName = document.getElementById('adminVideoFileName');
        const adminVideoPreview = document.getElementById('adminVideoPreview');
        const adminVideoPreviewVideo = document.getElementById('adminVideoPreviewVideo');
        
        if(adminVideoFileBtn && adminVideoFile) {
            adminVideoFileBtn.addEventListener('click', () => {
                adminVideoFile.click();
            });
            
            adminVideoFile.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    adminVideoFileName.textContent = file.name;
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        adminVideoPreviewVideo.src = e.target.result;
                        adminVideoPreview.style.display = 'block';
                    };
                    reader.readAsDataURL(file);
                } else {
                    adminVideoFileName.textContent = 'لم يتم اختيار ملف';
                    adminVideoPreview.style.display = 'none';
                }
            });
        }

        const form = document.getElementById('adminMessageForm');
        if(form) {
            form.addEventListener('submit', async (e)=>{
                e.preventDefault();
                
                const toAllChecked = document.getElementById('toAll').checked;
                const raw = document.getElementById('toRecipient').value || '';
                const sendEmail = document.getElementById('sendEmail').checked;
                
                const { subject, body, contentType } = await buildMessageContent();
                
                if(!body.trim()) {
                    alert('يرجى إدخال محتوى الرسالة');
                    return;
                }
                
                let recipients = 'all';
                if (!toAllChecked) {
                    if(!raw.trim()) {
                        alert('يرجى إدخال المستلمين');
                        return;
                    }
                    const parts = raw.split(',').map(s=>s.trim()).filter(Boolean);
                    const emails = parts.filter(p => p.includes('@'));
                    const usernames = parts.filter(p => !p.includes('@'));
                    recipients = { 
                        emails: emails.length ? emails : undefined, 
                        usernames: usernames.length ? usernames : undefined 
                    };
                }
                
                try{
                    const submitBtn = form.querySelector('button[type="submit"]');
                    const originalText = submitBtn.innerHTML;
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
                    
                    const res = await sendMessage({ 
                        recipients, 
                        subject, 
                        body, 
                        sendEmail,
                        contentType 
                    });
                    
                    if(!res.ok) {
                        const error = await res.json().catch(() => ({ error: 'فشل الإرسال' }));
                        throw new Error(error.error || 'فشل الإرسال');
                    }
                    
                    const result = await res.json();
                    
                    // Rich admin toasts
                    if (window.showAdminSendSuccess) {
                        window.showAdminSendSuccess(result.sent || 0);
                    } else if (window.showToast) {
                        window.showToast(`تم الإرسال بنجاح إلى ${result.sent || 0} مستخدم`, { type: 'success' });
                    } else {
                        alert(`تم الإرسال بنجاح إلى ${result.sent || 0} مستخدم`);
                    }
                    // Optional: show details object if exists
                    if (window.showAdminObject && (result.notifications || result.emailsSent !== undefined)) {
                        window.showAdminObject('تفاصيل الإرسال', { notifications: result.notifications, emailsSent: result.emailsSent });
                    }
                    
                    modal.classList.remove('show'); 
                    document.body.classList.remove('modal-open'); 
                    form.reset();
                    
                    // Reset to default
                    toAll.checked = true;
                    recipientInputGroup.style.display = 'none';
                    currentContentType = 'text';
                    contentTabs[0].click();
                    
                } catch(err) { 
                    console.error(err); 
                    if(window.showToast) {
                        window.showToast(err.message || 'فشل الإرسال', { type: 'error' });
                    } else {
                        alert(err.message || 'فشل الإرسال');
                    }
                } finally {
                    const submitBtn = form.querySelector('button[type="submit"]');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> إرسال';
                }
            });
        }
    });
})();
