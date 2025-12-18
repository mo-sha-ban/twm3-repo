(function(){
    // Professional Liquid Glass Toast System with Confirm Modal
    // Exposes window.showToast(message, {type:'info'|'success'|'error'|'warning', timeout, title, icon})
    // and window.showConfirm({title, message, confirmText, cancelText}) -> Promise<boolean>

    const css = `
    /* Liquid Glass Toast Container */
    .twm3-toast-container {
        position: fixed;
        bottom: 120px;
        left: 28px;
        z-index: 100001;
        display: flex;
        flex-direction: column;
        gap: 14px;
        pointer-events: none;
    }

    /* Liquid Glass Toast Base */
    .twm3-toast {
        min-width: 320px;
        max-width: 480px;
        padding: 18px 22px;
        border-radius: 16px;
        box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.12),
            0 2px 8px rgba(0, 0, 0, 0.08),
            inset 0 1px 1px rgba(255, 255, 255, 0.1);
        color: #fff;
        font-weight: 600;
        font-size: 15px;
        display: flex;
        align-items: flex-start;
        gap: 14px;
        opacity: 0;
        transform: translateX(-20px) scale(0.95);
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        border: 1px solid rgba(255, 255, 255, 0.18);
        pointer-events: auto;
        position: relative;
        overflow: hidden;
    }

    /* Glass shimmer effect */
    .twm3-toast::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            transparent
        );
        transition: left 0.5s;
    }

    .twm3-toast:hover::before {
        left: 100%;
    }

    .twm3-toast.show {
        opacity: 1;
        transform: translateX(0) scale(1);
    }

    /* Toast Types with Liquid Glass Effect */
    .twm3-toast.success {
        background: linear-gradient(
            135deg,
            rgba(34, 197, 94, 0.85) 0%,
            rgba(22, 163, 74, 0.90) 100%
        );
        border-color: rgba(134, 239, 172, 0.3);
    }

    .twm3-toast.error {
        background: linear-gradient(
            135deg,
            rgba(239, 68, 68, 0.85) 0%,
            rgba(220, 38, 38, 0.90) 100%
        );
        border-color: rgba(252, 165, 165, 0.3);
    }

    .twm3-toast.warning {
        background: linear-gradient(
            135deg,
            rgba(251, 146, 60, 0.85) 0%,
            rgba(249, 115, 22, 0.90) 100%
        );
        border-color: rgba(253, 186, 116, 0.3);
    }

    .twm3-toast.info {
        background: linear-gradient(
            135deg,
            rgba(59, 130, 246, 0.85) 0%,
            rgba(37, 99, 235, 0.90) 100%
        );
        border-color: rgba(147, 197, 253, 0.3);
    }

    /* Dark mode support */
    body.dark .twm3-toast,
    :root.dark-theme .twm3-toast {
        box-shadow:
            0 12px 40px rgba(0, 0, 0, 0.4),
            0 4px 12px rgba(0, 0, 0, 0.3),
            inset 0 1px 1px rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.12);
    }

    /* Toast Icon */
    .twm3-toast-icon {
        width: 42px;
        height: 42px;
        min-width: 42px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        font-size: 20px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.25);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    /* Toast Content */
    .twm3-toast-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding-top: 2px;
    }

    .twm3-toast-title {
        font-weight: 800;
        font-size: 16px;
        line-height: 1.3;
        margin-bottom: 2px;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .twm3-toast-body {
        font-weight: 500;
        font-size: 14px;
        line-height: 1.5;
        opacity: 0.95;
    }

    /* Toast Close Button */
    .twm3-toast-close {
        width: 32px;
        height: 32px;
        min-width: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        color: inherit;
        cursor: pointer;
        font-weight: 700;
        font-size: 18px;
        opacity: 0.8;
        transition: all 0.2s ease;
        backdrop-filter: blur(10px);
    }

    .twm3-toast-close:hover {
        opacity: 1;
        background: rgba(255, 255, 255, 0.25);
        transform: scale(1.05);
    }

    /* Confirm Modal with Liquid Glass - Warning Style */
    .twm3-confirm-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100000;
        animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    .twm3-confirm {
        width: min(92vw, 440px);
        background: linear-gradient(
            135deg,
            rgba(251, 146, 60, 0.95) 0%,
            rgba(249, 115, 22, 0.90) 100%
        );
        color: #fff;
        border-radius: 20px;
        padding: 28px;
        box-shadow:
            0 20px 60px rgba(0, 0, 0, 0.3),
            0 8px 20px rgba(0, 0, 0, 0.2),
            inset 0 1px 1px rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        border: 1px solid rgba(253, 186, 116, 0.3);
        animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        position: relative;
        overflow: hidden;
    }

    .twm3-confirm::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            transparent
        );
        animation: shimmer 2s infinite;
    }

    @keyframes shimmer {
        0% { left: -100%; }
        100% { left: 100%; }
    }

    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }

    body.dark .twm3-confirm,
    :root.dark-theme .twm3-confirm {
        background: linear-gradient(
            135deg,
            rgba(251, 146, 60, 0.95) 0%,
            rgba(249, 115, 22, 0.90) 100%
        );
        border-color: rgba(253, 186, 116, 0.2);
        box-shadow:
            0 20px 60px rgba(0, 0, 0, 0.6),
            0 8px 20px rgba(0, 0, 0, 0.4);
    }

    .twm3-confirm h3 {
        margin: 0 0 12px 0;
        font-size: 1.25rem;
        font-weight: 800;
        color: inherit;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .twm3-confirm p {
        margin: 0 0 24px 0;
        font-size: 0.95rem;
        line-height: 1.6;
        opacity: 0.95;
    }

    .twm3-confirm .actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
    }

    .twm3-confirm .btn {
        padding: 12px 24px;
        border-radius: 12px;
        border: none;
        cursor: pointer;
        font-weight: 600;
        font-size: 14px;
        transition: all 0.2s ease;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .twm3-confirm .btn.cancel {
        background: rgba(255, 255, 255, 0.2);
        color: inherit;
        border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .twm3-confirm .btn.cancel:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-1px);
    }

    .twm3-confirm .btn.confirm {
        background: linear-gradient(135deg, #fff, rgba(255, 255, 255, 0.9));
        color: #f97316;
        box-shadow: 0 4px 12px rgba(255, 255, 255, 0.3);
    }

    .twm3-confirm .btn.confirm:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(255, 255, 255, 0.4);
    }

    /* Confirm Icon */
    .twm3-confirm-icon {
        width: 56px;
        height: 56px;
        margin: 0 auto 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 16px;
        font-size: 28px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.25);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    /* Responsive */
    @media (max-width: 640px) {
        .twm3-toast-container {
            left: 16px;
            right: 16px;
            bottom: 140px;
        }

        .twm3-toast {
            min-width: auto;
            max-width: 100%;
        }

        .twm3-confirm {
            width: min(95vw, 400px);
            padding: 24px;
        }
    }
    `;

    const style = document.createElement('style');
    style.setAttribute('data-src','ui-toast');
    style.textContent = css;
    document.head.appendChild(style);

    const container = document.createElement('div');
    container.className = 'twm3-toast-container';
    document.body.appendChild(container);

    // Icon mapping for different toast types
    const iconMap = {
        success: 'fas fa-check-circle',
        error: 'fas fa-times-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };

    window.showToast = function(message, opts = {}) {
        if (message && typeof message !== 'string') {
            try { message = JSON.stringify(message, null, 2); }
            catch(e) { message = String(message); }
        }

        const {
            type = 'info',
            timeout = 5000,
            title = '',
            icon = iconMap[type] || 'fas fa-bell'
        } = opts;

        const el = document.createElement('div');
        el.className = 'twm3-toast ' + (type || 'info');

        let contentHtml = '';
        if (title) {
            contentHtml = `
                <div class="twm3-toast-content">
                    <div class="twm3-toast-title">${escapeHtml(title)}</div>
                    <div class="twm3-toast-body">${escapeHtml(message)}</div>
                </div>
            `;
        } else {
            contentHtml = `
                <div class="twm3-toast-content">
                    <div class="twm3-toast-body">${escapeHtml(message)}</div>
                </div>
            `;
        }

        el.innerHTML = `
            <div class="twm3-toast-icon">
                <i class="${icon}"></i>
            </div>
            ${contentHtml}
            <button class="twm3-toast-close" aria-label="close">×</button>
        `;

        const closeBtn = el.querySelector('.twm3-toast-close');
        closeBtn.addEventListener('click', () => { hide(); });

        function hide() {
            el.classList.remove('show');
            setTimeout(() => el.remove(), 400);
        }

        container.appendChild(el);
        requestAnimationFrame(() => el.classList.add('show'));

        if (timeout > 0) setTimeout(hide, timeout);

        return { hide };

        function escapeHtml(t) {
            const d = document.createElement('div');
            d.textContent = t;
            return d.innerHTML;
        }
    };

    // Helper function to replace window.alert
    window.showAlert = function(message, type = 'info') {
        return window.showToast(message, { type, timeout: 4000 });
    };

    window.showConfirm = function(opts = {}) {
        const {
            title = 'تأكيد الحذف',
            message = 'هل أنت متأكد من هذا الإجراء؟',
            confirmText = 'نعم، احذف',
            cancelText = 'إلغاء'
        } = opts;

        return new Promise((resolve) => {
            const backdrop = document.createElement('div');
            backdrop.className = 'twm3-confirm-backdrop';

            const box = document.createElement('div');
            box.className = 'twm3-confirm';
            box.innerHTML = `
                <div class="twm3-confirm-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>${title}</h3>
                <p>${message}</p>
            `;

            const actions = document.createElement('div');
            actions.className = 'actions';

            const btnCancel = document.createElement('button');
            btnCancel.className = 'btn cancel';
            btnCancel.textContent = cancelText;

            const btnConfirm = document.createElement('button');
            btnConfirm.className = 'btn confirm';
            btnConfirm.textContent = confirmText;

            actions.appendChild(btnCancel);
            actions.appendChild(btnConfirm);
            box.appendChild(actions);
            backdrop.appendChild(box);
            document.body.appendChild(backdrop);

            function cleanup() { backdrop.remove(); }

            btnCancel.addEventListener('click', () => { cleanup(); resolve(false); });
            btnConfirm.addEventListener('click', () => { cleanup(); resolve(true); });
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) { cleanup(); resolve(false); }
            });

            function onKey(e) {
                if (e.key === 'Escape') { cleanup(); resolve(false); }
            }
            document.addEventListener('keydown', onKey);

            const origCleanup = cleanup;
            cleanup = function() {
                document.removeEventListener('keydown', onKey);
                origCleanup();
            };
        });
    };

})();