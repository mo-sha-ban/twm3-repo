// Profile edit modal and save (PUT /api/user)
document.addEventListener('DOMContentLoaded', function() {
    const editBtn = document.getElementById('edit-profile-btn');
    if (!editBtn) return;
    editBtn.addEventListener('click', openEditProfileModal);
});

function openEditProfileModal() {
    // Use currentUser from profile.js if available
    const user = window.currentUser || JSON.parse(localStorage.getItem('user') || '{}');

    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'editProfileModal';
    modal.innerHTML = `
        <div class="modal-content modal-profile-edit" role="dialog" aria-modal="true" aria-labelledby="ep-title">
            <style>
                /* Scoped modal styles - responsive and theme-aware */
                .modal-profile-edit{width:100%;max-width:560px;border-radius:12px;padding:18px;box-sizing:border-box;font-family:inherit}
                .modal-profile-edit .modal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
                .modal-profile-edit h3{margin:0;font-size:1.05rem}
                .modal-profile-edit .modal-close{background:transparent;border:0;font-size:1.25rem;cursor:pointer;padding:6px;border-radius:8px}
                .modal-profile-edit form{display:flex;flex-direction:column;gap:12px}
                .modal-profile-edit .form-row{display:flex;gap:12px}
                .modal-profile-edit .form-group{display:flex;flex-direction:column;gap:6px;flex:1}
                .modal-profile-edit label{font-size:0.9rem;color:var(--ep-label,#334155)}
                .modal-profile-edit input[type="text"],
                .modal-profile-edit input[type="tel"]{width:100%;padding:10px 12px;border-radius:10px;border:1px solid var(--ep-border,#e6eef8);background:var(--ep-bg,#fbfdff);color:var(--ep-fg,#0f172a);outline:none}
                .modal-profile-edit input[disabled]{opacity:0.7;cursor:not-allowed}
                .modal-profile-edit .form-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:6px}
                .modal-profile-edit .btn{padding:8px 14px;border-radius:10px;font-weight:600;cursor:pointer;border:1px solid transparent}
                .modal-profile-edit .btn-primary{background:#0b5ed7;color:#fff;border-color:#0b5ed7}
                .modal-profile-edit .btn-outline{background:transparent;color:var(--ep-fg,#0f172a);border:1px solid rgba(15,23,42,0.06)}
                @media (max-width:520px){ .modal-profile-edit{padding:14px;border-radius:10px} .modal-profile-edit .form-row{flex-direction:column} }
                /* Dark theme overrides (works with body[data-theme="dark"]) */
                body[data-theme="dark"] .modal-profile-edit{--ep-bg:#0b1220;--ep-border:#22303f;--ep-fg:#e6eef8;--ep-label:#cbd5e1}
            </style>

            <div class="modal-header">
                <h3 id="ep-title">تعديل الملف الشخصي</h3>
                <button class="modal-close" aria-label="إغلاق">&times;</button>
            </div>

            <form id="editProfileForm" novalidate>
                <div class="form-row">
                    <div class="form-group">
                        <label for="ep-name">الاسم الكامل</label>
                        <input id="ep-name" name="name" type="text" value="${escapeHtml(user.name || '')}" required autocomplete="name" />
                    </div>
                    <div class="form-group">
                        <label for="ep-username">اسم المستخدم</label>
                        <input id="ep-username" type="text" value="${escapeHtml(user.username || '')}" disabled aria-disabled="true" />
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="ep-phone">رقم الهاتف</label>
                        <input id="ep-phone" name="phone" type="tel" value="${escapeHtml(user.phone || '')}" inputmode="tel" autocomplete="tel" placeholder="مثال: 01012345678" />
                    </div>
                    <div class="form-group">
                        <label for="ep-email">البريد الإلكتروني</label>
                        <input id="ep-email" type="text" value="${escapeHtml(user.email || '') || ''}" disabled aria-disabled="true" />
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-outline" id="ep-cancel">إلغاء</button>
                    <button type="submit" class="btn btn-primary">حفظ التغييرات</button>
                </div>
            </form>
        </div>
    `;

    // close handlers
    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    modal.querySelector('#ep-cancel').addEventListener('click', () => modal.remove());

    // submit handler
    const form = modal.querySelector('#editProfileForm');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    // Ensure username/email are not sent (disabled inputs won't be submitted, but be defensive)
    if (payload.username !== undefined) delete payload.username;
    if (payload.email !== undefined) delete payload.email;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = 'login.html';
                return;
            }

            const res = await fetch('/api/user', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json().catch(()=>({ error: 'فشل في الحفظ' }));
                throw new Error(err.error || err.message || 'فشل في حفظ التغييرات');
            }

            const updated = await res.json();
            // update local currentUser and UI
            window.currentUser = updated;
            localStorage.setItem('user', JSON.stringify(updated));

            // Prefer reloading user data from server if helper exists (keeps consistency)
            if (typeof loadUserData === 'function') {
                try {
                    await loadUserData();
                } catch (e) {
                    // fallback to local update
                    if (typeof displayUserData === 'function') displayUserData();
                    if (typeof displayIdentityInfo === 'function') displayIdentityInfo();
                }
            } else {
                if (typeof displayUserData === 'function') displayUserData();
                if (typeof displayIdentityInfo === 'function') displayIdentityInfo();
            }

            // Refresh related sections if those functions exist
            if (typeof loadUserComments === 'function') {
                try { loadUserComments(); } catch(e){}
            }
            if (typeof loadUserCourses === 'function') {
                try { loadUserCourses(); } catch(e){}
            }

            showToast('نجح', 'تم تحديث الملف الشخصي بنجاح', 'success');
            modal.remove();
        } catch (err) {
            console.error('Update profile failed', err);
            showToast('خطأ', err.message || 'فشل في حفظ التغييرات', 'error');
        }
    });

    // close on backdrop click
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.body.appendChild(modal);
}

// Small helper to prevent XSS in injected values
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
