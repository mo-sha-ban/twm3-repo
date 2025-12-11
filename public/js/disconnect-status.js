// Add disconnected status UI helpers
function showDisconnectedStatus() {
    // Create or get status element
    let statusEl = document.getElementById('connection-status');
    if (!statusEl) {
        statusEl = document.createElement('div');
        statusEl.id = 'connection-status';
        statusEl.className = 'connection-status';
        document.body.appendChild(statusEl);
    }
    
    statusEl.innerHTML = `
        <div class="connection-status-content">
            <i class="fas fa-exclamation-triangle"></i>
            انقطع الاتصال. جاري إعادة المحاولة...
        </div>
    `;
    requestAnimationFrame(() => statusEl.classList.add('show'));
}

function hideDisconnectedStatus() {
    const statusEl = document.getElementById('connection-status');
    if (statusEl) {
        statusEl.classList.remove('show');
        setTimeout(() => statusEl.remove(), 300);
    }
}

// Add styles
const style = document.createElement('style');
style.textContent = `
.connection-status {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: var(--error-color, #ef4444);
    color: white;
    padding: 8px;
    text-align: center;
    transform: translateY(-100%);
    transition: transform 0.3s ease;
    z-index: 9999;
}

.connection-status.show {
    transform: translateY(0);
}

.connection-status-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 0.9rem;
}

.connection-status i {
    font-size: 1rem;
}
`;
document.head.appendChild(style);