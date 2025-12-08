// Simple in-app messaging client for users
(function(){
    async function fetchMessages(){
        try{
            const token = localStorage.getItem('token');
            const headers = token? { 'Authorization': 'Bearer ' + token } : {};
            const res = await fetch('/api/messages', { headers });
            if(!res.ok) throw new Error('Failed to load messages');
            const msgs = await res.json();
            renderMessages(msgs);
        }catch(err){
            console.error(err);
        }
    }

    function renderMessages(msgs){
        const container = document.getElementById('messagesList');
        if(!container) return;
        console.debug('renderMessages called, messages count:', Array.isArray(msgs)?msgs.length:0);
        container.innerHTML = '';
        if(!msgs || msgs.length===0){
            container.innerHTML = '<p>لا توجد رسائل</p>';
            return;
        }
        msgs.forEach((m, idx) => {
            const otherId = m.sender && m.sender._id ? m.sender._id : null;
            const senderIsAdmin = !!(m.sender && (m.sender.isAdmin || m.sender.role === 'admin'));
            const el = document.createElement('div');
            el.className = 'message-item';
            console.debug('renderMessages: creating message', idx, 'otherId=', otherId, 'id=', m._id);
            el.innerHTML = `
                <div class="message-header">
                    <div class="message-header-left"><strong>${m.sender && m.sender.name ? m.sender.name : 'admin'}</strong></div>
                    <div class="message-header-right">
                        <span class="msg-time">${new Date(m.createdAt).toLocaleString()}</span>
                        <div class="message-actions" data-other="${otherId}" data-sender-admin="${senderIsAdmin?1:0}">
                            <button class="message-actions-toggle" aria-label="خيارات الرسالة">\n                                <i class="fas fa-ellipsis-vertical"></i>\n                            </button>
                            <div class="message-actions-menu" aria-hidden="true">
                                <button class="message-action-item" data-action="block"> <i class="fas fa-ban"></i> حظر المستخدم</button>
                                <button class="message-action-item" data-action="unblock" style="display:none"> <i class="fas fa-user-check"></i> إلغاء الحظر</button>
                                <button class="message-action-item destructive" data-action="delete"> <i class="fas fa-trash-alt"></i> حذف المحادثة</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="message-body">${escapeHtml(m.body)}</div>
                <div class="message-actions-inline">
                    <button data-id="${m._id}" class="reply-btn">رد</button>
                    <button data-id="${m._id}" class="mark-read-btn">${m.read? 'مقروء':'وضع مقروء'}</button>
                </div>
                <div class="replies">${(m.replies||[]).map(r=>`<div class="reply"><small>${r.sender}</small> ${escapeHtml(r.body)}</div>`).join('')}</div>
            `;
            container.appendChild(el);
        });

        // wire buttons
    console.debug('renderMessages: wiring buttons and action menus');
        container.querySelectorAll('.reply-btn').forEach(b=> b.addEventListener('click', openReply));
        container.querySelectorAll('.mark-read-btn').forEach(b=> b.addEventListener('click', markRead));

        // wire per-message actions menu (block/delete)
        container.querySelectorAll('.message-actions').forEach(wrapper => {
            const toggle = wrapper.querySelector('.message-actions-toggle');
            const menu = wrapper.querySelector('.message-actions-menu');
            const otherId = wrapper.getAttribute('data-other');

            if (!toggle || !menu) return;

            console.debug('wiring action menu for otherId=', otherId);

            toggle.addEventListener('click', (ev) => {
                console.debug('message-actions toggle clicked for otherId=', otherId);
                ev.stopPropagation();
                // close other open menus
                document.querySelectorAll('.message-actions-menu.show').forEach(m => { if (m !== menu) m.classList.remove('show'); });

                // Before showing the menu, fetch block-status once (with auth if available)
                // This avoids doing that for every message during render and prevents repeated 401s
                if (otherId) {
                    const token = localStorage.getItem('token');
                    const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
                    fetch('/api/users/' + otherId + '/block-status', { headers }).then(res => {
                        if (!res.ok) throw new Error('status fetch failed');
                        return res.json();
                    }).then(js => {
                        const blockBtn = menu.querySelector('[data-action="block"]');
                        const unblockBtn = menu.querySelector('[data-action="unblock"]');
                        // If sender is admin or current user is admin, do not show block controls
                        const senderAdminAttr = wrapper.getAttribute('data-sender-admin');
                        const senderAdmin = senderAdminAttr === '1' || senderAdminAttr === 'true';
                        let currentUser = {};
                        try { currentUser = JSON.parse(localStorage.getItem('user')||'{}'); } catch(e) {}
                        const currentIsAdmin = !!(currentUser && (currentUser.isAdmin || currentUser.role === 'admin'));
                        if (senderAdmin || currentIsAdmin) {
                            if (blockBtn) blockBtn.style.display = 'none';
                            if (unblockBtn) unblockBtn.style.display = 'none';
                        } else if (js && js.theyBlockedMe) {
                            // they blocked me - hide both
                            if (blockBtn) blockBtn.style.display = 'none';
                            if (unblockBtn) unblockBtn.style.display = 'none';
                        } else if (js && js.iBlocked) {
                            if (blockBtn) blockBtn.style.display = 'none';
                            if (unblockBtn) unblockBtn.style.display = '';
                        } else {
                            if (blockBtn) blockBtn.style.display = '';
                            if (unblockBtn) unblockBtn.style.display = 'none';
                        }
                        // toggle menu after status resolved
                        menu.classList.toggle('show');
                        menu.setAttribute('aria-hidden', menu.classList.contains('show') ? 'false' : 'true');
                    }).catch(() => {
                        // if status fetch fails (unauthorized or network), still toggle menu but hide unblock
                        const unblockBtn = menu.querySelector('[data-action="unblock"]');
                        if (unblockBtn) unblockBtn.style.display = 'none';
                        menu.classList.toggle('show');
                        menu.setAttribute('aria-hidden', menu.classList.contains('show') ? 'false' : 'true');
                    });
                } else {
                    // no otherId available - just toggle
                    menu.classList.toggle('show');
                    menu.setAttribute('aria-hidden', menu.classList.contains('show') ? 'false' : 'true');
                }
            });

            // actions inside menu
            menu.querySelectorAll('.message-action-item').forEach(item => {
                item.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const action = item.getAttribute('data-action');
                        if (!otherId) { window.showToast('لا يوجد معرف المستخدم', {type:'error'}); return; }

                    if (action === 'block') {
                        try {
                            const res = await fetch('/api/users/' + otherId + '/block', { method: 'POST', headers: { 'Authorization': localStorage.getItem('token') ? 'Bearer ' + localStorage.getItem('token') : '' } });
                            if (res.ok) {
                                window.showToast('تم حظر المستخدم', {type:'success'});
                                menu.querySelector('[data-action="block"]').style.display = 'none';
                                menu.querySelector('[data-action="unblock"]').style.display = '';
                            } else { window.showToast('فشل الحظر', { type: 'error' }); }
                        } catch (err) { console.error(err); window.showToast('فشل الحظر', { type: 'error' }); }
                    }

                    if (action === 'unblock') {
                        try {
                            const res = await fetch('/api/users/' + otherId + '/unblock', { method: 'POST', headers: { 'Authorization': localStorage.getItem('token') ? 'Bearer ' + localStorage.getItem('token') : '' } });
                            if (res.ok) {
                                window.showToast('تم إلغاء الحظر', {type:'success'});
                                menu.querySelector('[data-action="block"]').style.display = '';
                                menu.querySelector('[data-action="unblock"]').style.display = 'none';
                            } else { window.showToast('فشل إلغاء الحظر', { type: 'error' }); }
                        } catch (err) { console.error(err); window.showToast('فشل إلغاء الحظر', { type: 'error' }); }
                    }

                    if (action === 'delete') {
                        try {
                            const confirmed = await window.showConfirm({ title: 'حذف المحادثة', message: 'هل أنت متأكد من حذف هذه المحادثة؟', confirmText: 'حذف', cancelText: 'إلغاء' });
                            if (!confirmed) return;
                            const res = await fetch('/api/messages/thread/' + otherId, { method: 'DELETE', headers: { 'Authorization': localStorage.getItem('token') ? 'Bearer ' + localStorage.getItem('token') : '' } });
                            if (res.ok) {
                                // refresh list
                                fetchMessages();
                                window.showToast('تم حذف المحادثة', {type:'success'});
                            } else { window.showToast('فشل حذف المحادثة', {type:'error'}); }
                        } catch (err) { console.error(err); window.showToast('فشل حذف المحادثة', {type:'error'}); }
                    }

                    menu.classList.remove('show');
                });
            });
        });

        // global outside-click to close any open message action menus
        document.addEventListener('click', (e) => {
            if (!e.target.closest || !document.querySelectorAll) return;
            if (!e.target.closest('.message-actions')) {
                document.querySelectorAll('.message-actions-menu.show').forEach(m => m.classList.remove('show'));
            }
        });
    }

    function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    function openReply(e){
        const id = e.currentTarget.getAttribute('data-id');
        const modal = document.getElementById('replyModal');
        if(!modal) return;
        modal.dataset.msgid = id;
        modal.classList.add('show');
        document.body.classList.add('modal-open');
    }

    async function sendReply(e){
        e.preventDefault();
        const modal = document.getElementById('replyModal');
        const id = modal.dataset.msgid;
        const body = document.getElementById('replyBody').value;
        try{
            const token = localStorage.getItem('token');
            const res = await fetch('/api/messages/' + id + '/reply', { method: 'POST', headers: { 'Content-Type':'application/json', 'Authorization': token? 'Bearer '+token : '' }, body: JSON.stringify({ body }) });
            if(!res.ok) throw new Error('Reply failed');
            modal.classList.remove('show'); document.body.classList.remove('modal-open');
            document.getElementById('replyBody').value = '';
            fetchMessages();
    }catch(err){ console.error(err); window.showToast('فشل الإرسال', { type: 'error' }); }
    }

    async function markRead(e){
        const id = e.currentTarget.getAttribute('data-id');
        try{
            const token = localStorage.getItem('token');
            const res = await fetch('/api/messages/' + id + '/read', { method: 'PUT', headers: { 'Authorization': token? 'Bearer '+token : '' } });
            if(!res.ok) throw new Error('Failed');
            fetchMessages();
        }catch(err){ console.error(err); }
    }

    document.addEventListener('DOMContentLoaded', ()=>{
        fetchMessages();
        const replyForm = document.getElementById('replyForm');
        if(replyForm) replyForm.addEventListener('submit', sendReply);
        const replyClose = document.getElementById('replyClose');
        if(replyClose) replyClose.addEventListener('click', ()=>{ document.getElementById('replyModal').classList.remove('show'); document.body.classList.remove('modal-open'); });
    });
})();
