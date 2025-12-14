// messages-ui.js
// Creates a header-connected messaging modal: unread badge, senders list, and threaded chat
// Prevent double-loading if multiple message UI scripts are included
if (window.__messagesUIInitialized) {
    console.log('messages-ui: already initialized, skipping duplicate load');
} else {
    window.__messagesUIInitialized = true;
    (function(){
    // Socket.IO connection handling
    let socket = null;
    // Global flags to prevent duplicates
    let isInitializing = false;
    let isSendingMessage = false;
    let isOpeningThread = false;
    let lastMessageTime = 0;
    let markingRead = false; // Flag to prevent duplicate mark-read calls
    let lastSentMessage = null; // Track last sent message to prevent duplicates
    let currentOpenThreadId = null; // Tracks the currently visible thread in the modal

    // When the user returns to tab, mark the currently open thread as read
    if (!document.__messages_visibility_handler_attached) {
        document.addEventListener('visibilitychange', async () => {
            try {
                if (!document.hidden && currentOpenThreadId) {
                    const token = localStorage.getItem('token');
                    if (!token) return;
                    console.log('Marking messages as read for thread:', currentOpenThreadId, 'User:', (localStorage.getItem('user')||'?'));
                    const res = await fetch('/api/messages/mark-read-by-sender/' + currentOpenThreadId, { method: 'PUT', headers: { 'Authorization': 'Bearer ' + token } });
                    if (res.ok) {
                        try { window.showToast && window.showToast('تم', 'تم تعليم الرسائل كمقروءة', 'success'); } catch(e){}
                        await renderConversations();
                        setTimeout(() => renderConversations(), 300);
                    }
                }
            } catch (e) { console.error('visibility mark read failed', e); }
        });
        document.__messages_visibility_handler_attached = true;
    }

    // (initializeMessaging is defined later once; avoid duplicate definitions)

    // Track initialization to prevent duplicates
    let isInitialized = false;

    // Start initialization
    function startInitialization() {
        if (isInitialized) {
            console.log('Messaging system already initialized, skipping...');
            return;
        }
        isInitialized = true;
        initializeMessaging();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startInitialization);
    } else {
        startInitialization();
    }
    
    // Reinitialize when user logs in
    window.addEventListener('storage', (event) => {
        if (event.key === 'token' && event.newValue) {
            console.log('Auth token changed - reinitializing messaging');
            isInitialized = false;
            startInitialization();
        }
    });

    function connectSocket() {
        const token = localStorage.getItem('token');
        if (!token) return; // Only connect if user is authenticated
        
        // Check if Socket.IO is available, retry if not
        if (typeof io === 'undefined') {
            console.log('Socket.IO not loaded yet, retrying in 1s...');
            setTimeout(connectSocket, 1000);
            return;
        }
        
        // If we already have a socket, disconnect it first
        if (socket) {
            socket.disconnect();
        }
        
        // Connect to same host as current page, with auth token
        socket = io(window.location.origin, {
            auth: { token },
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: Infinity
        });

        socket.on('connect', () => {
            console.log('Socket.IO connected successfully');
            // join room for this user so server can emit to the user's room
            try { 
                const uid = getCurrentUserId(); 
                if(uid) {
                    socket.emit('join', String(uid));
                    console.log('Joined room:', uid);
                }
            } catch(e){
                console.error('Error joining room:', e);
            }
        });

        // Notifications are handled by top-level helpers (showNotification / showNativeNotification)

        socket.on('message:new', (message) => {
            try {
                // Only handle if recipient is current user
                if (String(message.recipient._id || message.recipient) !== String(getCurrentUserId()) || 
                    String(message.sender._id) === String(getCurrentUserId())) return; // Skip messages from myself

                // Notifications disabled
                // showNotification(message, message.sender);
                // showNativeNotification(message, message.sender);

                // Refresh conversations list
                renderConversations();

                // If the chat panel for this sender is open, append the message there
                const chatFormEl = document.querySelector('#chatForm');
                const activeChatId = chatFormEl && chatFormEl.dataset ? chatFormEl.dataset.otherId : null;

                if (activeChatId && String(activeChatId) === String(message.sender._id)) {
                    const chatMessages = document.querySelector('#chatMessages');
                    if (chatMessages) {
                        const msgEl = document.createElement('div');
                        msgEl.className = 'chat-msg theirs';
                        msgEl.style.opacity = '0';
                        msgEl.style.transform = 'translateY(20px)';
                        msgEl.style.transition = 'all 0.3s ease';

                        const who = message.sender && message.sender.name ? message.sender.name : 'admin';
                        const isAdmin = message.sender && (message.sender.isAdmin || message.sender.role === 'admin');
                        const isVerified = message.sender && message.sender.isVerified;
                        const avatar = message.sender && message.sender.avatarUrl
                            ? `<img src="${message.sender.avatarUrl}" alt="${who}" class="avatar"/>`
                            : `<div class="avatar-placeholder">${who.charAt(0)}</div>`;

                        msgEl.innerHTML = `
                            ${avatar}
                            <div class="chat-content">
                                <div class="chat-msg-body">${escapeHtml(message.body)}</div>
                                <div class="chat-msg-meta">
                                    <small>
                                        ${who}
                                        ${isAdmin ? '<span class="verified-badge admin" title="حساب مسؤول"><i class="fas fa-check"></i></span>' : ''}
                                        ${isVerified ? '<span class="verified-badge verified" title="حساب موثق"><i class="fas fa-check"></i></span>' : ''}
                                        • ${new Date(message.createdAt).toLocaleString()}
                                    </small>
                                </div>
                            </div>
                        `;
                        chatMessages.appendChild(msgEl);

                        // Animate and scroll
                        requestAnimationFrame(() => {
                            chatMessages.scrollTop = chatMessages.scrollHeight;
                            setTimeout(() => {
                                msgEl.style.opacity = '1';
                                msgEl.style.transform = 'translateY(0)';
                            }, 50);
                        });

                        // Mark message as read
                        fetch(API_MARK_READ(message._id), { method: 'PUT', headers: getAuthHeader() })
                            .then(r => { if (!r.ok) console.error('Mark read by id failed', r.status); return r; })
                            .then(async (r) => {
                                if (r && r.ok) {
                                    try { window.showToast && window.showToast('تم', 'تم تعليم الرسالة كمقروءة', 'success'); } catch (e) {}
                                    await renderConversations();
                                    setTimeout(() => renderConversations(), 300);
                                }
                                return r;
                            })
                            .catch(e => console.error('Mark read failed:', e));
                    }
                } else {
                    // If the modal is not currently open, optionally open the thread so the user sees the incoming message
                    const modal = document.getElementById('messagesModal');
                    if (!modal || !modal.classList.contains('show')) {
                        try { openThreadForSender(message.sender); } catch (e) { /* ignore */ }
                    }
                }
            } catch (err) {
                console.error('Error handling incoming message:', err);
            }
        });

        socket.on('disconnect', (reason) => {
            console.log('Socket.IO disconnected:', reason);
            
            // Show disconnected status to user
            showDisconnectedStatus();
            
            if (reason === 'io server disconnect') {
                // Server disconnected us, try to reconnect
                setTimeout(() => {
                    socket.connect();
                }, 1000);
            }
            // For other reasons, socket.io will try to reconnect automatically
        });

        socket.on('reconnect', (attemptNumber) => {
            console.log('Socket.IO reconnected after', attemptNumber, 'attempts');
            hideDisconnectedStatus();
            
            // Re-join user room
            try {
                const uid = getCurrentUserId();
                if (uid) {
                    socket.emit('join', String(uid));
                }
            } catch(e) {
                console.error('Error rejoining room:', e);
            }
            
            // Refresh conversations to sync state
            renderConversations();
        });

        socket.on('reconnect_attempt', () => {
            console.log('Socket.IO attempting to reconnect...');
        });

        socket.on('reconnect_error', (error) => {
            console.error('Socket.IO reconnect error:', error);
            showDisconnectedStatus();
        });

        socket.on('error', (error) => {
            console.error('Socket.IO error:', error);
            showDisconnectedStatus();
            // Don't disconnect - let reconnection logic handle it
        });
    }

    // inject minimal styles for messaging modal
    (function injectStyles(){
        const css = `
        /* Main Modal */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(8px);
            z-index: 1000;
            opacity: 0;
            transition: all 0.3s ease;
        }

        .modal.show {
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 1;
        }

        .messages-modal-content {
            width: 1000px;
            max-width: 95%;
            background: var(--surface-1, #ffffff);
            border-radius: 24px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            overflow: hidden;
            transform: translateY(20px);
            transition: all 0.3s ease;
        }

        /* Profile card styling */
        .profile-card {
            background: var(--surface-2, #f8f9fa);
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 20px;
            height: 400px;
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: var(--primary-color) transparent;
        }
        
        .profile-card::-webkit-scrollbar {
            width: 8px;
        }
        
        .profile-card::-webkit-scrollbar-track {
            background: transparent;
        }
        
        .profile-card::-webkit-scrollbar-thumb {
            background-color: var(--primary-color);
            border-radius: 20px;
            border: 2px solid transparent;
        }
        .modal.show .messages-modal-content {
            transform: translateY(0);
        }

        .messages-shell {
            display: flex;
            height: 80vh;
            max-height: 800px;
        }

        /* Conversations List */
        .conversations {
            width: 35%;
            border-left: 1px solid var(--border-color, rgba(0,0,0,0.1));
            background: var(--bg-primary, #ffffff);
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        .conv-header {
            padding: 20px;
            border-bottom: 1px solid var(--border-color, rgba(0,0,0,0.1));
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: var(--bg-primary, #ffffff);
        }

        .conv-header h3 {
            margin: 0;
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--text-primary, #1a1a1a);
        }

        .modal-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            color: var(--text-secondary, #666);
            cursor: pointer;
            padding: 8px;
            border-radius: 8px;
            transition: all 0.2s ease;
        }

        .modal-close:hover {
            background: var(--bg-tertiary, rgba(0,0,0,0.05));
            color: var(--text-primary, #1a1a1a);
        }

        .conversations-list {
            padding: 16px;
            overflow-y: auto;
            flex: 1;
        }

        .conv-item {
            display: flex;
            justify-content: space-between;
            padding: 16px;
            border-radius: 12px;
            cursor: pointer;
            align-items: center;
            transition: all 0.2s ease;
            margin-bottom: 8px;
            border: 1px solid var(--border-color, rgba(0,0,0,0.1));
            background: var(--bg-secondary, #f8f9fa);
        }

        .conv-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            border-color: var(--primary-color, #4f46e5);
        }

        .conv-left {
            display: flex;
            gap: 12px;
            align-items: center;
        }

        .conv-avatar-placeholder {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--primary-color, #4f46e5);
            color: white;
            font-weight: 600;
            font-size: 1.2rem;
            text-transform: uppercase;
        }

        .conv-meta {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .conv-name {
            font-size: 1rem;
            font-weight: 600;
            color: var(--text-primary, #1a1a1a);
        }

        .conv-snippet {
            font-size: 0.875rem;
            color: var(--text-secondary, #666);
        }

        .conv-right {
            text-align: right;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 4px;
        }

        .conv-time {
            font-size: 0.75rem;
            color: var(--text-secondary, #666);
        }

        .conv-unread {
            background: var(--primary-color, #4f46e5);
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 500;
        }

        /* Chat Panel */
        .chat-panel {
            flex: 1;
            display: flex;
            flex-direction: column;
            background-color: var(--bg-primary);
            border-right: 1px solid var(--border-color, rgba(0,0,0,0.1));
        }

        .chat-header {
            padding: 20px;
            border-bottom: 1px solid var(--border-color, rgba(0,0,0,0.1));
            font-weight: 600;
            color: var(--text-primary, #1a1a1a);
            background-color: var(--bg-primary);
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .chat-header img {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            object-fit: cover;
        }

        .chat-messages {
            padding: 20px;
            overflow-y: auto;
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 16px;
            scroll-behavior: smooth;
            background: var(--bg-primary);
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: var(--text-muted) var(--bg-tertiary);
        }

        .chat-msg {
            max-width: 75%;
            padding: 16px;
            border-radius: 20px;
            position: relative;
            font-size: 0.95rem;
            line-height: 1.5;
            display: flex;
            gap: 12px;
            align-items: flex-start;
        }

        .chat-msg .avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            object-fit: cover;
            flex-shrink: 0;
        }

        .chat-msg .avatar-placeholder {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: var(--primary-color);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            flex-shrink: 0;
        }

        .chat-msg.mine {
            margin-left: auto;
            flex-direction: row-reverse;
            background: var(--primary-color, #4338ca);
            color: white;
            border-bottom-right-radius: 4px;
        }

        .chat-msg.theirs {
            margin-right: auto;
            background: var(--surface-1, #ffffff);
            color: var(--text-primary, #1a1a1a);
            border-bottom-left-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        @media (prefers-color-scheme: dark) {
            .chat-msg.mine {
                background: var(--primary-dark, #4338ca);
            }
            
            .chat-msg.theirs {
                background: var(--surface-3, #374151);
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            }
        }

        .chat-msg-body {
            white-space: pre-wrap;
            margin-bottom: 4px;
        }

        .chat-msg-meta {
            font-size: 0.75rem;
            opacity: 0.8;
        }
        
        .verified-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            font-size: 10px;
            margin-right: 4px;
            margin-left: 4px;
            vertical-align: middle;
            position: relative;
        }

        .verified-badge.admin {
            background: linear-gradient(45deg, #1DA1F2, #1a91da);
        }

        .verified-badge.verified {
            background: linear-gradient(45deg, #00ba7c, #00a06a);
        }
        
        .verified-badge i {
            font-size: 8px;
            filter: drop-shadow(0 1px 1px rgba(0,0,0,0.1));
        }
        
        .verified-badge::after {
            content: '';
            position: absolute;
            inset: -1px;
            border-radius: inherit;
            border: 1px solid rgba(255,255,255,0.2);
        }

        .chat-form {
            display: flex;
            gap: 12px;
            padding: 20px;
            border-top: 1px solid var(--border-color, rgba(0,0,0,0.1));
            background: var(--bg-primary, #ffffff);
        }

        .chat-form input {
            flex: 1;
            padding: 12px 16px;
            border: 1px solid var(--border-color, rgba(0,0,0,0.1));
            border-radius: 12px;
            font-size: 0.95rem;
            background: var(--bg-secondary, #f8f9fa);
            color: var(--text-primary, #1a1a1a);
            transition: all 0.2s ease;
        }

        .chat-form input:focus {
            outline: none;
            border-color: var(--primary-color, #4f46e5);
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .chat-form button {
            padding: 12px 24px;
            border: none;
            border-radius: 12px;
            background: var(--primary-color, #4f46e5);
            color: white;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .chat-form button:hover {
            background: var(--primary-dark, #4338ca);
            transform: translateY(-1px);
        }

        /* Admin broadcast avatar styling */
        .avatar-placeholder.admin-broadcast,
        .conv-avatar-placeholder.admin-broadcast {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: 2px solid rgba(255,255,255,0.2);
        }
        
        /* Admin broadcast warning */
        .admin-broadcast-warning {
            animation: slideIn 0.3s ease;
        }
        
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* Dark Mode */
        @media (prefers-color-scheme: dark) {
            .modal {
                background: rgba(0, 0, 0, 0.8);
            }

            .messages-modal-content {
                background: var(--bg-primary, #1a1a1a);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
            }

            .conversations {
                background: var(--bg-primary, #1a1a1a);
                border-left-color: var(--border-color, rgba(255,255,255,0.1));
            }

            .conv-header {
                background: var(--bg-primary, #1a1a1a);
                border-bottom-color: var(--border-color, rgba(255,255,255,0.1));
            }

            .conv-item {
                background: var(--bg-secondary, #2a2a2a);
                border-color: var(--border-color, rgba(255,255,255,0.1));
            }

            .conv-item:hover {
                background: var(--bg-tertiary, #333);
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                border-color: var(--primary-color, #4f46e5);
            }

            .conv-name {
                color: var(--text-primary, #ffffff);
            }

            .conv-snippet {
                color: var(--text-secondary, #aaaaaa);
            }

            .chat-panel {
                background: var(--bg-primary, #1a1a1a);
            }

            .chat-header {
                background: var(--bg-primary, #1a1a1a);
                border-bottom-color: var(--border-color, rgba(255,255,255,0.1));
                color: var(--text-primary, #ffffff);
            }

            .chat-messages {
                background: var(--bg-primary, #1a1a1a);
            }

            .chat-msg.theirs {
                background: var(--bg-secondary, #2a2a2a);
                color: var(--text-primary, #ffffff);
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            }

            .chat-msg.mine {
                background: var(--primary-color, #4f46e5);
                color: #ffffff;
            }

            .chat-form {
                background: var(--bg-primary, #1a1a1a);
                border-top-color: var(--border-color, rgba(255,255,255,0.1));
            }

            .chat-form input {
                background: var(--bg-secondary, #2a2a2a);
                color: var(--text-primary, #ffffff);
                border-color: var(--border-color, rgba(255,255,255,0.1));
            }

            .chat-form input:focus {
                border-color: var(--primary-color, #4f46e5);
                box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
            }

            .admin-broadcast-warning {
                background: var(--warning-bg, rgba(255, 193, 7, 0.2));
                border-color: var(--warning-border, #ffc107);
                color: var(--warning-text, #ffc107);
            }
        }
        
        /* Reply Modal */
        #replyModal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 1100;
            display: none;
        }
        
        #replyModal.show {
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        #replyModal .modal-content {
            background: var(--bg-primary);
            border-radius: 8px;
            width: 90%;
            max-width: 500px;
            padding: 0;
        }
        
        #replyModal .modal-header {
            padding: 1rem;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        #replyModal .modal-header h3 {
            margin: 0;
            font-size: 1.2rem;
        }
        
        #replyModal .modal-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            padding: 0.5rem;
            color: var(--text-secondary);
        }
        
        #replyModal .modal-close:hover {
            color: var(--text-primary);
        }
        
        #replyModal form {
            padding: 1rem;
        }
        
        #replyModal textarea {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            resize: vertical;
            min-height: 100px;
            background: var(--bg-primary);
            color: var(--text-primary);
        }
        
        #replyModal textarea:focus {
            outline: none;
            border-color: var(--primary-color);
        }
        
        #replyModal .form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 0.5rem;
            margin-top: 1rem;
        }
        
        #replyModal .btn {
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            border: none;
            font-weight: 500;
        }
        
        #replyModal .btn-primary {
            background: var(--primary-color);
            color: white;
        }
        
        #replyModal .btn-secondary {
            background: var(--bg-tertiary);
            color: var(--text-primary);
        }
        .conv-item { display:flex; justify-content:space-between; padding:8px; border-radius:6px; cursor:pointer; align-items:center }
        .conv-item:hover{ background: rgba(0,0,0,0.03); }
        .conv-left{ display:flex; gap:8px; align-items:center }
        .conv-avatar{ width:40px;height:40px;border-radius:50%;object-fit:cover }
        .conv-avatar-placeholder{ width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#ccc;color:#fff }
        .conv-meta{ display:flex; flex-direction:column }
        .conv-name{ font-size:0.95rem }
        .conv-snippet{ font-size:0.8rem; color:#666 }
        .conv-right{ text-align:right }
        .conv-unread{ background:#e74c3c;color:#fff;padding:4px 7px;border-radius:12px;font-size:0.8rem }
        .chat-panel{ flex:1; display:flex; flex-direction:column }
        .chat-header{ padding:10px 14px; border-bottom:1px solid #eee }
        .chat-msg{ max-width:75%; margin:8px 0; padding:8px 10px; border-radius:10px }
        .chat-msg.mine{ margin-left:auto; background:#dff0d8 }
        .chat-msg.theirs{ margin-right:auto; background:#fff }
        .chat-msg-body{ white-space:pre-wrap }
        .chat-form{ display:flex; gap:8px; padding:8px; border-top:1px solid #eee }
        .chat-form input{ flex:1; padding:8px; border:1px solid #ddd; border-radius:6px }
        @media (prefers-color-scheme: dark){
            .messages-modal-content { background: #1f1f1f; color:#eee }
            .conversations { border-left-color:#333 }
            .conv-item:hover { background: rgba(255,255,255,0.02) }
            .chat-msg.mine{ background:#1f5682 }
            .chat-msg.theirs{ background:#3aa5d5;color:#fff }
        }
        `;
        const s = document.createElement('style'); s.setAttribute('data-src','messages-ui'); s.textContent = css;
        document.head.appendChild(s);
    })();
    // Global notification styles and helper (used by socket handlers and periodic checks)
    (function injectNotificationHelpers(){
        const notificationStyles = document.createElement('style');
        notificationStyles.textContent = `
        .message-notification {
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: var(--bg-primary, #ffffff);
            border: 1px solid var(--border-color, rgba(0,0,0,0.1));
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            border-radius: 12px;
            padding: 16px;
            display: flex;
            align-items: flex-start;
            gap: 12px;
            max-width: 400px;
            z-index: 9999;
            transform: translateY(100px);
            opacity: 0;
            transition: all 0.3s ease;
        }
        
        .message-notification.show {
            transform: translateY(0);
            opacity: 1;
        }
        
        .message-notification-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: var(--primary-color, #4f46e5);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            flex-shrink: 0;
        }
        
        .message-notification-content {
            flex: 1;
        }
        
        .message-notification-title {
            font-weight: 600;
            margin-bottom: 4px;
            color: var(--text-primary, #1a1a1a);
        }
        
        .message-notification-body {
            color: var(--text-secondary, #666);
            font-size: 0.9rem;
            line-height: 1.4;
        }
        
        .message-notification-close {
            background: none;
            border: none;
            padding: 4px;
            cursor: pointer;
            color: var(--text-secondary, #666);
            transition: color 0.2s ease;
        }
        
        .message-notification-close:hover {
            color: var(--text-primary, #1a1a1a);
        }
        
        @media (prefers-color-scheme: dark) {
            .message-notification {
                background: var(--bg-tertiary, #1f2937);
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            }
        }
    `;
        document.head.appendChild(notificationStyles);

        // top-level showNotification so periodic checks and socket code can both call it
        window.showNotification = function(message, sender) {
            try {
                const notification = document.createElement('div');
                notification.className = 'message-notification';
                const senderName = sender && sender.name ? sender.name : 'admin';
                notification.innerHTML = `
                    <div class="message-notification-avatar">${(senderName||'A').charAt(0)}</div>
                    <div class="message-notification-content">
                        <div class="message-notification-title">رسالة جديدة من ${senderName}</div>
                        <div class="message-notification-body">${formatSnippet(message.body)}</div>
                    </div>
                    <button class="message-notification-close">&times;</button>
                `;
                document.body.appendChild(notification);

                // sound disabled by request

                requestAnimationFrame(()=> notification.classList.add('show'));

                notification.addEventListener('click', (e)=>{
                    if (e.target.closest('.message-notification-close')) { notification.remove(); return; }
                    // Prevent opening modal on notification click
                    notification.remove();
                });

                setTimeout(()=>{ notification.classList.remove('show'); setTimeout(()=> notification.remove(), 300); }, 5000);
            } catch(e){ console.error('showNotification failed', e); }
        };
    })();
    const API_INBOX = '/api/messages';
    const API_THREAD = (otherId) => `/api/messages/thread/${otherId}`;
    const API_REPLY = (id) => `/api/messages/${id}/reply`;
    const API_MARK_READ = (id) => `/api/messages/${id}/read`;

    function getAuthHeader(){
        const token = localStorage.getItem('token');
        return token ? { 'Authorization': 'Bearer ' + token } : {};
    }

    async function markAllAsRead() {
        const token = localStorage.getItem('token');
        if (!token) return { success: false };
        try {
            const res = await fetch('/api/messages/mark-all-read', { method: 'PUT', headers: { 'Authorization': 'Bearer ' + token } });
            if (!res.ok) {
                const txt = await res.text();
                console.error('mark-all-read failed:', txt);
                return { success: false };
            }
            const json = await res.json();
            console.log('markAllAsRead result:', json);
            if (json && json.updated > 0) {
                updateHeaderBadge(0);
                try { await renderConversations(); } catch(e) { console.error('renderConversations after markAllAsRead failed', e); }
            }
            return json;
        } catch (e) { console.error('markAllAsRead error', e); return { success: false }; }
    }

    async function fetchInbox(){
        try{
            const res = await fetch(API_INBOX, { headers: getAuthHeader() });
            if(!res.ok) throw new Error('Failed fetching inbox');
            return await res.json();
        }catch(err){ console.error(err); return []; }
    }

    // Build modal DOM once and attach to body
    function ensureModal(){
        const existing = document.getElementById('messagesModal');
        if (existing) return existing;

        if (!socket) connectSocket();

        const modal = document.createElement('div');
        modal.id = 'messagesModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content messages-modal-content">
                <div class="messages-shell">
                    <div class="conversations">
                        <div class="conv-header">
                            <h3>الرسائل</h3>
                            <div style="display:flex;gap:8px">
                                <button id="newChatBtn" class="btn btn-primary" style="padding:6px 12px;border-radius:6px">
                                    <i class="fas fa-plus"></i>
                                    محادثة جديدة
                                </button>
                                <button id="closeMessagesModal" class="modal-close">&times;</button>
                            </div>
                        </div>
                        <div id="conversationsList" class="conversations-list"></div>
                    </div>
                    <div class="chat-panel">
                        <div id="chatHeader" class="chat-header">اختر محادثة</div>
                        <div id="chatMessages" class="chat-messages"></div>
                        <form id="chatForm" class="chat-form" style="display:none">
                            <input id="chatInput" placeholder="اكتب رسالة..." autocomplete="off" />
                            <button class="btn btn-primary" type="submit">إرسال</button>
                        </form>
                    </div>
                </div>
                <!-- Reply Modal -->
                <div id="replyModal" class="modal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>الرد على الرسالة</h3>
                            <button id="replyClose" class="modal-close">&times;</button>
                        </div>
                        <form id="replyForm">
                            <div class="form-group">
                                <textarea id="replyBody" rows="4" placeholder="اكتب ردك هنا..." required></textarea>
                            </div>
                            <div class="form-actions">
                                <button type="button" class="btn btn-secondary" id="replyCancel">إلغاء</button>
                                <button type="submit" class="btn btn-primary">إرسال</button>
                            </div>
                        </form>
                    </div>
                </div>
                <!-- New Chat Modal -->
                <div id="newChatModal" class="modal">
                    <div class="modal-content" style="max-width:500px">
                        <div class="modal-header">
                            <h3>محادثة جديدة</h3>
                            <button id="newChatClose" class="modal-close">&times;</button>
                        </div>
                        <form id="newChatForm" style="padding:1rem">
                            <div style="display:flex;flex-direction:column;gap:16px">
                                <div class="form-group">
                                    <label for="newChatRecipient" style="display:block;margin-bottom:8px">اسم المستخدم أو البريد الإلكتروني</label>
                                    <input type="text" id="newChatRecipient" required style="width:100%;padding:8px 12px;border-radius:6px;border:1px solid var(--border-color)">
                                </div>
                                <div class="form-group">
                                    <label for="newChatMessage" style="display:block;margin-bottom:8px">الرسالة</label>
                                    <textarea id="newChatMessage" rows="4" required style="width:100%;padding:8px 12px;border-radius:6px;border:1px solid var(--border-color)"></textarea>
                                </div>
                                <div class="form-actions" style="display:flex;justify-content:flex-end;gap:8px">
                                    <button type="button" class="btn btn-secondary" id="newChatCancel">إلغاء</button>
                                    <button type="submit" class="btn btn-primary">إرسال</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        // Attach a MutationObserver to detect when the modal is shown and mark all messages read
        if (!document.__messages_modal_mark_all_observer_attached) {
            try {
                const modalEl = modal;
                const observer = new MutationObserver((mutations) => {
                    for (const m of mutations) {
                        if (m.attributeName === 'class') {
                            const isShown = modalEl.classList.contains('show');
                            if (isShown) {
                                // mark all messages as read when modal is shown
                                markAllAsRead();
                            }
                        }
                    }
                });
                observer.observe(modalEl, { attributes: true, attributeFilter: ['class'] });
                document.__messages_modal_mark_all_observer_attached = true;
            } catch (e) {
                console.error('Failed to attach modal class observer', e);
            }
        }

        // wires
        modal.querySelector('#closeMessagesModal').addEventListener('click', ()=>{ modal.classList.remove('show'); document.body.classList.remove('modal-open'); currentOpenThreadId = null; });
        modal.addEventListener('click', (e)=>{ if(e.target===modal){ modal.classList.remove('show'); document.body.classList.remove('modal-open'); currentOpenThreadId = null; } });
        return modal;
    }

    function formatSnippet(text){
        if(!text) return '';
        return text.length > 80 ? text.slice(0,77) + '...' : text;
    }

    async function renderConversations(){
        const modal = ensureModal();
        const convList = modal.querySelector('#conversationsList');
        convList.innerHTML = '<p>جاري التحميل...</p>';
        const msgs = await fetchInbox();
        // group by sender id, but separate admin broadcasts
        const map = new Map();
        msgs.forEach(m => {
            // For admin broadcasts, use a special key to group them together
            let sid;
            if (m.isAdminBroadcast) {
                sid = 'admin-broadcast';
            } else {
                sid = m.sender && m.sender._id ? m.sender._id : 'admin';
            }
            
            if(!map.has(sid)) {
                map.set(sid, { 
                    sender: m.isAdminBroadcast ? { _id: 'admin-broadcast', name: m.displayName || 'Admin', isAdminBroadcast: true } : m.sender, 
                    messages: [], 
                    unread:0, 
                    latest: m 
                });
            }
            const group = map.get(sid);
            group.messages.push(m);
            if(!m.read) group.unread++;
            if(new Date(m.createdAt) > new Date(group.latest.createdAt)) group.latest = m;
        });

        // sort by latest desc
        const groups = Array.from(map.values()).sort((a,b)=> new Date(b.latest.createdAt) - new Date(a.latest.createdAt));
        if(groups.length===0) convList.innerHTML = '<p>لا توجد رسائل</p>';
        else convList.innerHTML = '';
        groups.forEach(g=>{
            const el = document.createElement('div');
            el.className = 'conv-item';
            
            // Check if this is an admin broadcast conversation
            const isAdminBroadcast = g.latest && g.latest.isAdminBroadcast === true;
            
            let name, avatar;
            if (isAdminBroadcast) {
                // Admin broadcast: show displayName or "Admin", no avatar
                name = g.latest.displayName || 'Admin';
                avatar = `<div class="conv-avatar-placeholder admin-broadcast">${name.charAt(0)}</div>`;
            } else {
                name = g.sender && g.sender.name ? g.sender.name : (g.sender && g.sender.username ? g.sender.username : 'admin');
                avatar = (g.sender && g.sender.avatarUrl) ? `<img src="${g.sender.avatarUrl}" alt="avatar" class="conv-avatar"/>` : `<div class="conv-avatar-placeholder">${(name||'A').charAt(0)}</div>`;
            }
            
            const isAdmin = isAdminBroadcast || (g.sender && (g.sender.isAdmin || g.sender.role === 'admin'));
            const isVerified = g.sender && g.sender.isVerified;
            el.innerHTML = `
                <div class="conv-left">${avatar}<div class="conv-meta">
                    <strong class="conv-name" style="display:flex;align-items:center">
                        ${name}
                        ${isAdmin ? '<span class="verified-badge admin" title="حساب مسؤول"><i class="fas fa-check"></i></span>' : ''}
                        ${isVerified ? '<span class="verified-badge verified" title="حساب موثق"><i class="fas fa-check"></i></span>' : ''}
                    </strong>
                    <div class="conv-snippet">${(function(){ try{ const t=(g.latest && g.latest.body)||''; const parts=String(t).trim().split(/\s+/); return parts.length? parts[parts.length-1] : formatSnippet(t); }catch(e){ return formatSnippet(g.latest.body); } })()}</div>
                </div></div>
                <div class="conv-right">${g.unread>0?`<span class="conv-unread">${g.unread}</span>`:''}<small class="conv-time">${new Date(g.latest.createdAt).toLocaleString()}</small></div>
            `;
            
            // For admin broadcast, create a special sender object
            const senderForThread = isAdminBroadcast 
                ? { _id: g.latest.sender && g.latest.sender._id ? g.latest.sender._id : 'admin', name: name, isAdminBroadcast: true }
                : g.sender;
            
            el.addEventListener('click', ()=> openThreadForSender(senderForThread));
            convList.appendChild(el);
        });

        const unreadCounts = Array.from(map.values()).map(g => g.unread);
        const totalUnread = unreadCounts.reduce((s, c) => s + c, 0);
        console.log('Unread counts per conversation:', unreadCounts, 'Total unread:', totalUnread);
        updateHeaderBadge(totalUnread);

        // إذا تم فتح نافذة الرسائل، علم كل الرسائل كمقروءة
        if (modal.classList.contains('show') && totalUnread > 0) {
            const token = localStorage.getItem('token');
            if (token) {
                fetch('/api/messages/mark-all-read', {
                    method: 'PUT',
                    headers: { 'Authorization': 'Bearer ' + token }
                }).then(res => res.json()).then(result => {
                    console.log('Marked all messages as read:', result);
                    if (result && result.updated > 0) {
                        console.log('تم تعليم الرسائل كمقروءة بنجاح', result);
                        if (typeof result.unreadRemaining !== 'undefined') updateHeaderBadge(result.unreadRemaining);
                        if (typeof result.notificationUnread !== 'undefined') updateNotificationBadge(result.notificationUnread);
                    } else {
                        console.warn('لم يتم تعليم أي رسالة كمقروءة!');
                    }
                }).catch(e => console.error('Failed to mark all as read', e));
            }
        }
    }

    function updateHeaderBadge(count){
        // Update message-specific badges only
        document.querySelectorAll('.messages-badge, .messages-badge span, .messages-badge .badge').forEach(b=>{
            try {
                if (typeof b.textContent !== 'undefined') {
                    if (count>0) { b.textContent = count; b.style.display = 'inline-block'; }
                    else { b.textContent = ''; b.style.display = 'none'; }
                } else if (b.querySelector) {
                    b.innerText = (count>0 ? String(count) : '');
                    b.style.display = (count>0 ? 'inline-block' : 'none');
                }
            } catch(e){ /* ignore */ }
        });
    }

    function updateNotificationBadge(count){
        document.querySelectorAll('.notification-badge').forEach(b=>{
            if(count>0){ b.textContent = count; b.style.display = 'inline-block'; }
            else { b.textContent = ''; b.style.display = 'none'; }
        });
    }

    async function openThreadForSender(sender){
        const modal = ensureModal();
        modal.classList.add('show'); document.body.classList.add('modal-open');
        const otherId = sender && sender._id ? sender._id : null;
        const isAdminBroadcast = sender && sender.isAdminBroadcast === true;
        
        // For admin broadcast, use a special ID
        const threadId = isAdminBroadcast ? (otherId || 'admin-broadcast') : otherId;
        
        if (!threadId && !isAdminBroadcast) {
            console.error('No sender ID available:', sender);
            return;
        }
        
        const chatHeader = modal.querySelector('#chatHeader');
        // Add block/unblock controls in header (will populate details after thread is fetched)
        const blockBtnId = 'blockBtn_' + threadId;
        const unblockBtnId = 'unblockBtn_' + threadId;
        
        // Render a placeholder header now; we'll replace it with full details once we fetch the thread
        if (isAdminBroadcast) {
            const name = sender.name || 'Admin';
            chatHeader.innerHTML = `<div style="display:flex;align-items:center;gap:12px;width:100%"><div style="flex:1;display:flex;align-items:center;gap:12px"><div class="chat-header-avatar-placeholder admin-broadcast">${name.charAt(0)}</div><div style="display:flex;flex-direction:column"><div style="font-weight:600;display:flex;align-items:center">${name}<span class="verified-badge admin" title="حساب مسؤول"><i class="fas fa-check"></i></span></div></div></div></div>`;
        } else {
            chatHeader.innerHTML = `<div style="display:flex;align-items:center;gap:12px;width:100%"><div style="flex:1;display:flex;align-items:center;gap:12px"><div class="chat-header-avatar-placeholder">${(sender && sender.name?sender.name.charAt(0):'A')}</div><div style="display:flex;flex-direction:column"><div style="font-weight:600;display:flex;align-items:center">${sender && sender.name ? sender.name : '...'}</div><div style="font-size:0.85rem;color:var(--text-secondary)">${sender && sender.username? '@'+sender.username : ''}</div></div></div><div class="chat-actions" data-other="${threadId}"><button class="chat-actions-toggle" aria-label="خيارات المحادثة"><i class="fas fa-ellipsis-vertical"></i></button><div class="chat-actions-menu" aria-hidden="true"><button class="chat-action-item" data-action="block"> <i class="fas fa-ban"></i> حظر المستخدم</button><button class="chat-action-item" data-action="unblock" style="display:none"> <i class="fas fa-user-check"></i> إلغاء الحظر</button><button class="chat-action-item destructive" data-action="delete"> <i class="fas fa-trash-alt"></i> حذف المحادثة</button></div></div></div>`;
        }
        
        const chatMessages = modal.querySelector('#chatMessages');
        chatMessages.innerHTML = '<p>جاري التحميل...</p>';

        // Mark notifications as read when opening chat (skip for admin broadcast)
        if (!isAdminBroadcast && threadId) {
            try {
                console.log('Marking messages as read for sender:', threadId);
                const token = localStorage.getItem('token');
                if (!token) {
                    console.error('No auth token available');
                    return;
                }
                
                const headers = { 'Authorization': 'Bearer ' + token };
                const res = await fetch('/api/messages/mark-read-by-sender/' + threadId, { 
                    method: 'PUT',
                    headers 
                });
                
                if (!res.ok) {
                    const error = await res.text();
                    console.error('Failed to mark messages as read:', error);
                    throw new Error(error);
                }
                
                const result = await res.json();
                console.log('Messages marked as read (by-sender):', result);
                if (result && typeof result.unreadRemaining !== 'undefined') updateHeaderBadge(result.unreadRemaining);
                if (result && typeof result.notificationUnread !== 'undefined') updateNotificationBadge(result.notificationUnread);
                try { window.showToast && window.showToast('تم', 'تم تعليم الرسائل كمقروءة', 'success'); } catch(e){}
                // Refresh conversations and badge after marking read
                await renderConversations();
                // فور فتح المحادثة وقراءة الرسائل، اجعل عدد الإشعارات صفر
                updateHeaderBadge(0);
                // Enforce another refresh after a short delay to guard against race conditions
                setTimeout(() => { try { renderConversations(); } catch (e) {} }, 300);
            } catch (err) {
                console.error('Error marking messages as read:', err);
            }
        }
        
        const res = await fetch(API_THREAD(threadId), { headers: getAuthHeader() });
        if(!res.ok){ chatMessages.innerHTML = '<p>فشل في جلب المحادثة</p>'; return; }
        const thread = await res.json();
        
        // Keep track of current open thread ID
        currentOpenThreadId = (!isAdminBroadcast && threadId) ? threadId : null;

        // Check if this is an admin broadcast thread (from dashboard)
        const isAdminBroadcastThread = thread.some(m => m.isAdminBroadcast === true);
        const currentUserId = getCurrentUserId();
        let currentUser = {};
        try { currentUser = JSON.parse(localStorage.getItem('user')||'{}'); } catch(e) {}
        const currentIsAdmin = !!(currentUser && (currentUser.isAdmin || currentUser.role === 'admin'));
        
        // If sender object lacks rich info, derive it from the thread messages
        let headerSender = sender;
        if ((!headerSender || !headerSender.name || !headerSender.avatarUrl) && Array.isArray(thread) && thread.length > 0) {
            // find a message sent by the other user
            const example = thread.find(m => String(m.sender && m.sender._id) === String(threadId)) || thread[0];
            if (example && example.sender) headerSender = example.sender;
        }
        
        // Update chat header with full sender info (after thread fetched)
        try {
            // Handle admin broadcast messages
            let headerName, headerAvatar, headerUsername, headerIsAdmin, headerIsVerified;
            if (isAdminBroadcastThread) {
                // Admin broadcast: show displayName or "Admin", no avatar, no username
                const firstMsg = thread.find(m => m.isAdminBroadcast);
                headerName = (firstMsg && firstMsg.displayName) || 'Admin';
                headerAvatar = `<div class="chat-header-avatar-placeholder admin-broadcast">${headerName.charAt(0)}</div>`;
                headerUsername = '';
                headerIsAdmin = true;
                headerIsVerified = false;
            } else {
                headerName = headerSender && headerSender.name ? headerSender.name : 'user';
                headerAvatar = headerSender && headerSender.avatarUrl 
                    ? `<img src="${headerSender.avatarUrl}" style="width:36px;height:36px;border-radius:50%;object-fit:cover">` 
                    : `<div class="chat-header-avatar-placeholder">${(headerSender && headerSender.name?headerSender.name.charAt(0):'A')}</div>`;
                headerUsername = headerSender && headerSender.username ? '@' + headerSender.username : '';
                headerIsAdmin = headerSender && (headerSender.isAdmin || headerSender.role === 'admin');
                headerIsVerified = headerSender && headerSender.isVerified;
            }
            
            chatHeader.innerHTML = `\n        <div style="display:flex;align-items:center;gap:12px;width:100%">\n            <div style="flex:1;display:flex;align-items:center;gap:12px">\n                ${headerAvatar}\n                <div style="display:flex;flex-direction:column">\n                    <div style="font-weight:600;display:flex;align-items:center">\n                        ${headerName}\n                        ${headerIsAdmin ? '<span class="verified-badge admin" title="حساب مسؤول"><i class="fas fa-check"></i></span>' : ''}\n                        ${headerIsVerified ? '<span class="verified-badge verified" title="حساب موثق"><i class="fas fa-check"></i></span>' : ''}\n                    </div>\n                    ${headerUsername ? `<div style="font-size:0.85rem;color:var(--text-secondary)">${headerUsername}</div>` : ''}\n                </div>\n            </div>\n            ${!isAdminBroadcastThread ? `<div class="chat-actions" data-other="${threadId}">\n                <button class="chat-actions-toggle" aria-label="خيارات المحادثة"><i class="fas fa-ellipsis-vertical"></i></button>\n                <div class="chat-actions-menu" aria-hidden="true">\n                    <button class="chat-action-item" data-action="block"> <i class="fas fa-ban"></i> حظر المستخدم</button>\n                    <button class="chat-action-item" data-action="unblock" style="display:none"> <i class="fas fa-user-check"></i> إلغاء الحظر</button>\n                    <button class="chat-action-item destructive" data-action="delete"> <i class="fas fa-trash-alt"></i> حذف المحادثة</button>\n                </div>\n            </div>` : ''}\n        </div>`;
        } catch (e) { console.error('Failed to update chat header', e); }
        
        // render thread: messages from both sides (sender/recipient)
        chatMessages.innerHTML = '';
        thread.forEach(m=>{
            const mine = String(m.sender && m.sender._id) === String(currentUserId);
            const msgEl = document.createElement('div');
            msgEl.className = 'chat-msg ' + (mine? 'mine':'theirs');
            // Add smooth scroll animation
            msgEl.style.opacity = '0';
            msgEl.style.transform = 'translateY(20px)';
            msgEl.style.transition = 'all 0.3s ease';
            msgEl.dataset.messageId = m._id;
            msgEl.dataset.isAdminBroadcast = m.isAdminBroadcast ? 'true' : 'false';
            
            // Handle admin broadcast messages - mask sender info
            let who, avatar, isAdmin, isVerified;
            if (m.isAdminBroadcast && !mine) {
                // Admin broadcast: show displayName or "Admin", no avatar, no username
                who = m.displayName || 'Admin';
                avatar = `<div class="avatar-placeholder admin-broadcast">${who.charAt(0)}</div>`;
                isAdmin = true; // Show admin badge
                isVerified = false;
            } else {
                who = mine ? 'انا' : (m.sender && m.sender.name ? m.sender.name : 'admin');
                isAdmin = m.sender && (m.sender.isAdmin || m.sender.role === 'admin');
                isVerified = m.sender && m.sender.isVerified;
                avatar = m.sender && m.sender.avatarUrl 
                    ? `<img src="${m.sender.avatarUrl}" alt="${who}" class="avatar"/>` 
                    : `<div class="avatar-placeholder">${who.charAt(0)}</div>`;
            }
            
            const badges = [
                isAdmin ? '<span class="verified-badge admin" title="حساب مسؤول"><i class="fas fa-check"></i></span>' : '',
                isVerified ? '<span class="verified-badge verified" title="حساب موثق"><i class="fas fa-check"></i></span>' : ''
            ].filter(Boolean).join('');
            msgEl.innerHTML = `
                ${avatar}
                <div class="chat-content">
                    <div class="chat-msg-body">${escapeHtml(m.body)}</div>
                    <div class="chat-msg-meta"><small>${who}${badges} • ${new Date(m.createdAt).toLocaleString()}</small></div>
                </div>
            `;
            chatMessages.appendChild(msgEl);
            // Animate in after a brief delay
            setTimeout(() => {
                msgEl.style.opacity = '1';
                msgEl.style.transform = 'translateY(0)';
            }, 50);
        });

        // Scroll to latest message with smooth animation
        requestAnimationFrame(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });

        // show form - but hide it if this is an admin broadcast and user is not admin
        const form = modal.querySelector('#chatForm');
        form.dataset.otherId = threadId;
        
        // Remove any existing warning first
        const existingWarning = chatMessages.parentNode.querySelector('.admin-broadcast-warning');
        if (existingWarning) existingWarning.remove();
        
        // Check if we should disable replies for admin broadcasts
        if (isAdminBroadcastThread && !currentIsAdmin) {
            // Hide form and show warning message
            form.style.display = 'none';
            const warningEl = document.createElement('div');
            warningEl.className = 'admin-broadcast-warning';
            warningEl.style.cssText = 'padding: 16px; margin: 16px; background: var(--warning-bg, #fff3cd); border: 1px solid var(--warning-border, #ffc107); border-radius: 8px; color: var(--warning-text, #856404); text-align: center;';
            warningEl.innerHTML = '<i class="fas fa-info-circle"></i> <strong>رسالة من الإدارة</strong><br><small>لا يمكنك الرد على الرسائل المرسلة من لوحة التحكم. للتواصل مع الإدارة، يرجى إرسال رسالة جديدة باستخدام اسم المستخدم.</small>';
            chatMessages.parentNode.insertBefore(warningEl, form);
        } else {
            form.style.display = '';
        }
        
        // Mark all unread messages in thread as read (skip for admin broadcast)
        if (!isAdminBroadcastThread && threadId) {
            const unreadMessages = thread.filter(m => 
                String(m.recipient) === String(getCurrentUserId()) && 
                !m.read
            );
            
            if (unreadMessages.length > 0) {
                try {
                    const token = localStorage.getItem('token');
                    if (token) {
                        await fetch('/api/messages/mark-read-by-sender/' + threadId, { 
                            method: 'PUT',
                            headers: { 'Authorization': 'Bearer ' + token }
                        });
                        try { window.showToast && window.showToast('تم', 'تم تعليم الرسائل كمقروءة', 'success'); } catch(e){}
                        setTimeout(() => renderConversations(), 300);
                        // Immediately refresh conversation list after marking
                        try { window.showToast && window.showToast('تم', 'تم تعليم الرسائل كمقروءة', 'success'); } catch(e){}
                        await renderConversations();
                        setTimeout(() => renderConversations(), 300);
                    }
                } catch (e) {
                    console.error('Error marking thread as read:', e);
                }
            }
        }
        // Check block status and wire block/unblock (skip for admin broadcast)
        if (!isAdminBroadcastThread && threadId) {
            try{
                const blkRes = await fetch('/api/users/' + threadId + '/block-status', { headers: getAuthHeader() });
                if (blkRes.ok) {
                    const js = await blkRes.json();
                    if (js.blocked) {
                        // hide form when either party has blocked
                        form.style.display = 'none';
                        const msg = js.theyBlockedMe ? 'هذا المستخدم قام بحظرك' : 'لقد قمت بحظر هذا المستخدم';
                        const info = document.createElement('div'); info.style.padding='12px'; info.style.color='#b00'; info.textContent = msg;
                        chatMessages.parentNode.insertBefore(info, chatMessages.nextSibling);
                    }
                }
            }catch(e){ console.error('block-status check failed', e); }

            // wire block/unblock buttons
            (function wireBlockButtons(){
                const b = document.getElementById(blockBtnId); const ub = document.getElementById(unblockBtnId);
                if(!b || !ub) return;
                // If sender or current user is admin, hide block controls entirely
                const senderIsAdmin = !!(sender && (sender.isAdmin || sender.role === 'admin'));
                let currentUser = {};
                try { currentUser = JSON.parse(localStorage.getItem('user')||'{}'); } catch(e) {}
                const currentIsAdmin = !!(currentUser && (currentUser.isAdmin || currentUser.role === 'admin'));
                if (senderIsAdmin || currentIsAdmin) {
                    b.style.display = 'none';
                    ub.style.display = 'none';
                    return;
                }
                // check if current user blocked the other (show proper button)
                fetch('/api/users/' + threadId + '/block-status', { headers: getAuthHeader() }).then(r=>r.json()).then(js=>{
                    if(js && js.iBlocked) { 
                        ub.style.display='inline-block'; 
                        b.style.display='none';
                    } else if (!js.theyBlockedMe) { 
                        b.style.display='inline-block'; 
                        ub.style.display='none';
                    } else {
                        // they blocked me - don't show either button
                        b.style.display='none';
                        ub.style.display='none';
                    }
                }).catch(()=>{ b.style.display='inline-block'; });

                b.addEventListener('click', async ()=>{
                    try{
                        const res = await fetch('/api/users/' + threadId + '/block', { method: 'POST', headers: getAuthHeader() });
                        if(res.ok){ window.showToast('تم حظر المستخدم', { type: 'success' }); form.style.display='none'; b.style.display='none'; ub.style.display='inline-block'; }
                    }catch(e){ console.error(e); window.showToast('فشل الحظر', { type: 'error' }); }
                });

                ub.addEventListener('click', async ()=>{
                    try{
                        const res = await fetch('/api/users/' + threadId + '/unblock', { method: 'POST', headers: getAuthHeader() });
                        if(res.ok){ window.showToast('تم إلغاء الحظر', { type: 'success' }); form.style.display=''; b.style.display='inline-block'; ub.style.display='none'; }
                    }catch(e){ console.error(e); window.showToast('فشل إلغاء الحظر', { type: 'error' }); }
                });
            })();
        }

        // Wire chat header actions menu (block/unblock/delete) using same endpoints
        (function wireChatHeaderMenu(){
            try{
                const chatActions = chatHeader.querySelector('.chat-actions');
                if(!chatActions) return;
                const toggle = chatActions.querySelector('.chat-actions-toggle');
                const menu = chatActions.querySelector('.chat-actions-menu');
                const blockItem = menu.querySelector('[data-action="block"]');
                const unblockItem = menu.querySelector('[data-action="unblock"]');
                const deleteItem = menu.querySelector('[data-action="delete"]');

                // Skip block controls for admin broadcast
                if (isAdminBroadcastThread) {
                    if(blockItem) blockItem.style.display='none';
                    if(unblockItem) unblockItem.style.display='none';
                    return;
                }
                
                // initial block-status check to determine which buttons to show
                fetch('/api/users/' + threadId + '/block-status', { headers: getAuthHeader() }).then(r=> r.ok? r.json(): null).then(js => {
                    // Hide block controls for admins
                    const senderIsAdmin = !!(sender && (sender.isAdmin || sender.role === 'admin'));
                    let currentUser = {};
                    try { currentUser = JSON.parse(localStorage.getItem('user')||'{}'); } catch(e){}
                    const currentIsAdmin = !!(currentUser && (currentUser.isAdmin || currentUser.role === 'admin'));
                    if (senderIsAdmin || currentIsAdmin) {
                        if(blockItem) blockItem.style.display='none';
                        if(unblockItem) unblockItem.style.display='none';
                    } else if (js) {
                        if (js.theyBlockedMe) { if(blockItem) blockItem.style.display='none'; if(unblockItem) unblockItem.style.display='none'; }
                        else if (js.iBlocked) { if(blockItem) blockItem.style.display='none'; if(unblockItem) unblockItem.style.display=''; }
                        else { if(blockItem) blockItem.style.display=''; if(unblockItem) unblockItem.style.display='none'; }
                    }
                }).catch(()=>{ if(blockItem) blockItem.style.display=''; if(unblockItem) unblockItem.style.display='none'; });

                // toggle menu
                if(toggle && menu){
                    toggle.addEventListener('click', (ev)=>{
                        ev.stopPropagation();
                        document.querySelectorAll('.chat-actions-menu.show').forEach(m=>{ if(m!==menu) m.classList.remove('show'); });
                        menu.classList.toggle('show');
                        menu.setAttribute('aria-hidden', menu.classList.contains('show')? 'false':'true');
                    });

                    // actions
                    [blockItem, unblockItem, deleteItem].forEach(it=>{
                        if(!it) return;
                        it.addEventListener('click', async (e)=>{
                            e.stopPropagation();
                            const action = it.getAttribute('data-action');
                            if(action === 'block'){
                                try{ const r = await fetch('/api/users/' + threadId + '/block', { method: 'POST', headers: getAuthHeader() }); if(r.ok){ window.showToast('تم حظر المستخدم', {type:'success'}); if(blockItem) blockItem.style.display='none'; if(unblockItem) unblockItem.style.display=''; }}catch(err){ console.error(err); window.showToast('فشل الحظر', {type:'error'}); }
                            }
                            if(action === 'unblock'){
                                try{ const r = await fetch('/api/users/' + threadId + '/unblock', { method: 'POST', headers: getAuthHeader() }); if(r.ok){ window.showToast('تم إلغاء الحظر', {type:'success'}); if(blockItem) blockItem.style.display=''; if(unblockItem) unblockItem.style.display='none'; }}catch(err){ console.error(err); window.showToast('فشل إلغاء الحظر', {type:'error'}); }
                            }
                            if(action === 'delete'){
                                try{
                                    const confirmed = await window.showConfirm({ title: 'حذف المحادثة', message: 'هل أنت متأكد من حذف هذه المحادثة؟', confirmText: 'حذف', cancelText: 'إلغاء' });
                                    if(!confirmed) return;
                                    const res = await fetch('/api/messages/thread/' + threadId, { method: 'DELETE', headers: getAuthHeader() });
                                    if(res.ok){ window.showToast('تم حذف المحادثة', {type:'success'}); // close modal and refresh
                                        const modalEl = document.getElementById('messagesModal'); if(modalEl) modalEl.classList.remove('show'); document.body.classList.remove('modal-open'); fetchInbox().then(()=> renderConversations());
                                    } else {
                                        let txt = '';
                                        try { txt = await res.text(); } catch(e){}
                                        console.error('Delete thread failed', res.status, txt);
                                        window.showToast('فشل حذف المحادثة: ' + (txt || res.status), {type:'error'});
                                    }
                                }catch(err){ console.error(err); window.showToast('فشل حذف المحادثة', {type:'error'}); }
                            }

                            menu.classList.remove('show');
                        });
                    });

                    // close menu on outside click
                    document.addEventListener('click', (e)=>{ if(!e.target.closest || !e.target.closest('.chat-actions')){ if(menu.classList.contains('show')) menu.classList.remove('show'); } });
                }
            }catch(e){ console.error('wireChatHeaderMenu failed', e); }
        })();

        // Mark all unread messages in thread as read (skip for admin broadcast)
        if (!isAdminBroadcastThread && threadId) {
            const unreadMessages = thread.filter(m => 
                String(m.recipient) === String(getCurrentUserId()) && 
                !m.read
            );
            
            if (unreadMessages.length > 0) {
                try {
                    const token = localStorage.getItem('token');
                    if (token) {
                        await fetch('/api/messages/mark-read-by-sender/' + threadId, { 
                            method: 'PUT',
                            headers: { 'Authorization': 'Bearer ' + token }
                        });
                    }
                } catch (e) {
                    console.error('Error marking thread as read:', e);
                }
            }
        }
        renderConversations();
    }

    function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    // Top-level helper to show native system notifications when permitted
    function showNativeNotification(message, sender) {
        try {
            if (!('Notification' in window)) return;
            if (Notification.permission !== 'granted') return;
            const title = `رسالة جديدة من ${sender && sender.name ? sender.name : 'admin'}`;
            const opts = {
                body: formatSnippet(message.body),
                icon: (sender && sender.avatarUrl) ? sender.avatarUrl : '/favicon.ico',
                tag: 'twm3-message-' + (message._id || Date.now())
            };
            const n = new Notification(title, opts);
            n.onclick = function() {
                window.focus();
                // Prevent opening modal on native notification click
                this.close();
            };
        } catch (e) {
            console.error('Native notification failed', e);
        }
    }

    function getCurrentUserId(){
        try{ const u = JSON.parse(localStorage.getItem('user')||'null'); return u && (u._id||u.id) ? (u._id||u.id) : null; }catch(e){ return null; }
    }

    async function sendChatMessage(e) {
        e.preventDefault();
        const form = e.currentTarget;
        const otherId = form.dataset.otherId;
        const input = document.getElementById('chatInput');
        const body = input.value.trim();
        
        if (!body) return;
        
        // Check if this is an admin broadcast thread and user is not admin
        const chatMessages = document.querySelector('#chatMessages');
        if (chatMessages) {
            const adminBroadcastMsg = chatMessages.querySelector('[data-is-admin-broadcast="true"]');
            if (adminBroadcastMsg) {
                let currentUser = {};
                try { currentUser = JSON.parse(localStorage.getItem('user')||'{}'); } catch(e) {}
                const currentIsAdmin = !!(currentUser && (currentUser.isAdmin || currentUser.role === 'admin'));
                if (!currentIsAdmin) {
                    window.showToast && window.showToast('لا يمكنك الرد على الرسائل المرسلة من لوحة التحكم. للتواصل مع الإدارة، يرجى إرسال رسالة جديدة باستخدام اسم المستخدم.', { type: 'error' });
                    return;
                }
            }
        }
        
        // Prevent duplicate sends
        const messageKey = `${otherId}:${body}:${Date.now()}`;
        if (messageKey === lastSentMessage) {
            console.log('Preventing duplicate message send');
            return;
        }
        lastSentMessage = messageKey;
        
        // Clear input immediately to prevent double-send
        input.value = '';
        if (isSendingMessage) {
            console.log('Already sending a message, preventing duplicate send');
            return;
        }

        // Prevent rapid-fire messages
        const now = Date.now();
        if (now - lastMessageTime < 1000) {
            console.log('Sending too fast, preventing duplicate send');
            return;
        }
        
        
        isSendingMessage = true;
        lastMessageTime = now;
        try {
            // Optimistic UI update
            const chatMessages = document.querySelector('#chatMessages');
            const msgEl = document.createElement('div');
            msgEl.className = 'chat-msg mine';
            msgEl.innerHTML = `
                <div class="chat-content">
                    <div class="chat-msg-body">${escapeHtml(body)}</div>
                    <div class="chat-msg-meta">
                        <small>أنا • ${new Date().toLocaleString()}</small>
                    </div>
                </div>
            `;
            
            if (chatMessages) {
                msgEl.style.opacity = '0';
                msgEl.style.transform = 'translateY(20px)';
                msgEl.style.transition = 'all 0.3s ease';
                chatMessages.appendChild(msgEl);
                
                requestAnimationFrame(() => {
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                    setTimeout(() => {
                        msgEl.style.opacity = '1';
                        msgEl.style.transform = 'translateY(0)';
                    }, 50);
                });
            }

            // Send to server
            const token = localStorage.getItem('token');
            const headers = token ? { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token } : { 'Content-Type': 'application/json' };
            
            const res = await fetch('/api/messages/create', {
                method: 'POST',
                headers,
                body: JSON.stringify({ recipientId: otherId, body, sendEmail: false })
            });

            // Update conversations list to show new message immediately
            setTimeout(() => {
                renderConversations();
            }, 500);

            if (!res.ok) {
                const txt = await res.text().catch(() => null);
                throw new Error(txt || 'Failed to send message');
            }

            // Update conversations list to show new message immediately
            renderConversations();

        } catch (err) {
            console.error('Send message error (optimistic):', err);
            window.showToast && window.showToast('فشل إرسال الرسالة. حاول مرة أخرى.', { type: 'error' });
        }
    }

    // Resolve a recipient identifier (username or email) to a user object {_id, name, username, email, avatarUrl}
    async function resolveRecipient(identifier){
        if(!identifier) return null;
        identifier = identifier.trim();
        try{
            const isEmail = identifier.includes('@');
            const q = isEmail ? `email=${encodeURIComponent(identifier)}` : `username=${encodeURIComponent(identifier)}`;
            const res = await fetch('/api/users/lookup?' + q, { headers: getAuthHeader() });
            if(res.ok) return await res.json();
            return null;
        }catch(err){ console.error('resolveRecipient error', err); return null; }
    }

    // Send a direct message to a recipient identified by username or email
    async function sendDirectMessage(recipientIdentifier, body, sendEmail=false){
        if (isSendingMessage) {
            console.log('Already sending a message, preventing duplicate send');
            return;
        }
        
        isSendingMessage = true;
        setTimeout(() => {
            isSendingMessage = false;
        }, 1000); // Prevent sending new message for 1 second
        
        if(!recipientIdentifier || !body) {
            isSendingMessage = false;
            throw new Error('recipient and body required');
        }
        
        const user = await resolveRecipient(recipientIdentifier);
        if(!user) {
            isSendingMessage = false;
            throw new Error('Recipient not found');
        }
        
        const token = localStorage.getItem('token');
        const headers = token ? { 'Content-Type':'application/json', 'Authorization':'Bearer '+token } : { 'Content-Type':'application/json' };
        const res = await fetch('/api/messages/create', { method: 'POST', headers, body: JSON.stringify({ recipientId: user._id, body, sendEmail }) });
        
        if(!res.ok){ 
            isSendingMessage = false;
            const txt = await res.text(); 
            throw new Error(txt || 'send failed'); 
        }
        
        const json = await res.json();
        
        // Refresh conversations list immediately to show the new message
        setTimeout(() => {
            renderConversations();
        }, 200);
        
        return json;
    }

    // Expose helper globally so dashboard or other scripts can call it
    window.sendDirectMessage = sendDirectMessage;

    // Handle reply button clicks
    async function handleReplyClick(messageId) {
        try {
            // First get inbox to find the sender
            const inbox = await fetchInbox();
            const message = inbox.find(m => m._id === messageId);

            if (!message) {
                console.error('Message not found in inbox');
                return;
            }

            // Open messages modal
            const modal = ensureModal();
            modal.classList.add('show');
            document.body.classList.add('modal-open');

            // Open thread with sender
            await openThreadForSender(message.sender);

            // Focus the reply input
            const chatInput = document.getElementById('chatInput');
            if (chatInput) chatInput.focus();

            // Scroll to the bottom of the chat and highlight the last message
            const chatMessages = document.querySelector('#chatMessages');
            if (chatMessages) {
                chatMessages.scrollTop = chatMessages.scrollHeight;
                const messages = chatMessages.querySelectorAll('.chat-msg');
                if (messages.length > 0) {
                    const lastMessage = messages[messages.length - 1];
                    lastMessage.style.animation = 'highlight 2s';
                }
            }
        } catch (err) {
            console.error('Error handling reply:', err);
        }
    }

    // Add highlighting animation
    const highlightStyle = document.createElement('style');
    highlightStyle.textContent = `
        @keyframes highlight {
            0% { background-color: var(--primary-color); }
            100% { background-color: inherit; }
        }
    `;
    document.head.appendChild(highlightStyle);

    // Wire up the new chat modal
    function wireNewChatModal() {
        const newChatBtn = document.getElementById('newChatBtn');
        const newChatModal = document.getElementById('newChatModal');
        const newChatClose = document.getElementById('newChatClose');
        const newChatCancel = document.getElementById('newChatCancel');
        const newChatForm = document.getElementById('newChatForm');
        
        if (!newChatBtn || !newChatModal || !newChatForm) return;

        newChatBtn.addEventListener('click', () => {
            newChatModal.classList.add('show');
        });

        [newChatClose, newChatCancel].forEach(btn => {
            if (btn) btn.addEventListener('click', () => {
                newChatModal.classList.remove('show');
                newChatForm.reset();
            });
        });

        newChatModal.addEventListener('click', (e) => {
            if (e.target === newChatModal) {
                newChatModal.classList.remove('show');
                newChatForm.reset();
            }
        });

        newChatForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const recipientIdentifier = document.getElementById('newChatRecipient').value.trim();
            const message = document.getElementById('newChatMessage').value.trim();

            if (!recipientIdentifier || !message) return;

            try {
                // Resolve recipient first so we can open the thread reliably after sending
                const user = await resolveRecipient(recipientIdentifier);
                if (!user) {
                    window.showToast('المستخدم غير موجود', { type: 'error' });
                    return;
                }

                await sendDirectMessage(recipientIdentifier, message);

                // Ensure messages modal is visible and refresh conversations to show new message
                const modal = ensureModal();
                modal.classList.add('show'); 
                document.body.classList.add('modal-open');
                
                // Refresh conversations list to show the new message immediately
                await renderConversations();
                
                // Open thread for the recipient after a short delay to ensure data is loaded
                setTimeout(async () => {
                    try { 
                        await openThreadForSender({ _id: user._id, name: user.name, username: user.username, avatarUrl: user.avatarUrl, isAdmin: user.isAdmin }); 
                    } catch(e) {
                        console.error('Error opening thread:', e);
                    }
                }, 300);

                window.showToast('تم إرسال الرسالة بنجاح', { type: 'success' });
                newChatModal.classList.remove('show');
                newChatForm.reset();
            } catch (err) {
                console.error('Error sending message:', err);
                const msg = (err && err.message) ? err.message : (typeof err === 'string' ? err : 'فشل إرسال الرسالة');
                window.showToast(msg, { type: 'error' });
            }
        });
    }

    // Wire up reply buttons
    document.addEventListener('click', async (e) => {
        if (e.target.matches('.reply-btn')) {
            e.preventDefault();
            const messageId = e.target.dataset.id;
            if (messageId) {
                await handleReplyClick(messageId);
            }
        }
    });

        // Preload notification sound
    // sound preloading disabled by request
    
    // Show "Under Development" modal
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
                    <h2>نظام الرسائل تحت التطوير</h2>
                    <p>نعمل حالياً على تحسين نظام الرسائل لتقديم تجربة أفضل. سيتم تفعيله قريباً!</p>
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

    // create header button wiring
    function wireHeaderButtons(){
        // Select specifically the messages button in the header
        const messageButtons = document.querySelectorAll('button.action-btn[title="الرسائل"]');
        console.log('Found message buttons:', messageButtons.length);
        
        messageButtons.forEach(button => {
            console.log('Setting up click handler for message button');
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Message button clicked');
                
                // Show "Under Development" modal instead of messages
                showMessagesUnderDevelopmentModal();
            });
            
            // Add hover effect
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'scale(1.05)';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'scale(1)';
            });
        });
    }

    // Add messages button to navbar
    function addMessagesButton() {
        const navbar = document.querySelector('.navbar-nav');
        if (navbar) {
            const messagesBtn = document.createElement('button');
            messagesBtn.className = 'nav-link messages-btn';
            messagesBtn.innerHTML = `
                <i class="fas fa-envelope"></i>
                <span class="messages-badge" style="display: none">0</span>
            `;
            messagesBtn.style.cssText = `
                background: none;
                border: none;
                padding: 8px 12px;
                cursor: pointer;
                position: relative;
                color: inherit;
                transition: all 0.2s ease;
            `;
            
            // Add badge styles
            const style = document.createElement('style');
            style.textContent = `
                .messages-badge {
                    position: absolute;
                    top: 0;
                    right: 0;
                    background: var(--primary-color, #4f46e5);
                    color: white;
                    border-radius: 12px;
                    padding: 2px 6px;
                    font-size: 0.75rem;
                    font-weight: 500;
                    transform: translate(25%, -25%);
                }
                
                .messages-btn:hover {
                    opacity: 0.8;
                }
                
                @media (prefers-color-scheme: dark) {
                    .messages-btn {
                        color: #fff;
                    }
                }
            `;
            document.head.appendChild(style);
            
            messagesBtn.addEventListener('click', async () => {
                // Show "Under Development" modal instead of messages
                showMessagesUnderDevelopmentModal();
            });
            
            navbar.appendChild(messagesBtn);
        }
    }

    // Check for new messages periodically
    async function checkNewMessages() {
        const currentUser = getCurrentUserId();
        if (!currentUser) return;
        
        try {
            const inbox = await fetchInbox();
            const unreadCount = inbox.filter(m => !m.read).length;
            updateHeaderBadge(unreadCount);

            // Show notifications for any new messages
            const lastCheck = localStorage.getItem('lastMessageCheck');
            const now = new Date().toISOString();

            if (lastCheck) {
                const newMessages = inbox.filter(m => 
                    !m.read && 
                    new Date(m.createdAt) > new Date(lastCheck)
                );
                newMessages.forEach(message => {
                    // Notifications disabled
                    // showNotification(message, message.sender);
                    // showNativeNotification(message, message.sender);
                });
            } else {
                // First run: show notifications for unread messages (limit to avoid spam)
                const unreadMessages = inbox.filter(m => !m.read);
                const toShow = unreadMessages.slice(0, 3); // cap to 3 notifications
                toShow.forEach(message => {
                    // Notifications disabled
                    // showNotification(message, message.sender);
                    // showNativeNotification(message, message.sender);
                });
            }

            // (No modal observer here - attached by ensureModal when the modal is created)
        } catch (err) {
            console.error('Error checking new messages:', err);
        }
    }

    // init
    async function initializeMessaging() {
        console.log('Initializing messaging system...');
        
        try {
            // Ensure we have a user token
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('No auth token found - deferring initialization');
                return;
            }
            
            console.log('Creating modal...');
            const modal = ensureModal();
            
            console.log('Setting up message buttons...');
            wireHeaderButtons();
            
            // Connect socket if not already connected
            if (!socket) {
                connectSocket();
            }
            
            console.log('Fetching initial inbox...');
            const inbox = await fetchInbox();
            const unread = inbox.filter(m => !m.read).length;
            console.log(`Found ${unread} unread messages`);
            
            // Update all notification badges
            updateHeaderBadge(unread);
            
            // Set up periodic checks for new messages
            setInterval(checkNewMessages, 30000);
            
            // handle chat form submit if not already bound
            if (!document.getElementById('chatForm').dataset.bound) {
                document.getElementById('chatForm').addEventListener('submit', sendChatMessage);
                document.getElementById('chatForm').dataset.bound = 'true';
            }
            
            // Initialize new chat modal
            wireNewChatModal();
            
            console.log('Messaging system initialized successfully');
        } catch (err) {
            console.error('Error initializing messaging system:', err);
        }
    }

    // initialization is handled by startInitialization() above to avoid duplicates

    // Single initialization guard/launcher to prevent duplicate init calls
    (function startMessagesInit(){
        if (window._twm3_messages_initialized) return;
        window._twm3_messages_initialized = true;
        const run = () => { initializeMessaging().catch(e=>console.error('Error during messaging initialization:', e)); };
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
        // Reinitialize when token is set in another tab
        window.addEventListener('storage', (e) => { if (e.key === 'token' && e.newValue) { window._twm3_messages_initialized = false; run(); } });
    })();
})();
}
