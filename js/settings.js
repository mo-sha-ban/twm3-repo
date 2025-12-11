// Settings Page JavaScript

const API_BASE = 'http://localhost:5000/api';
let currentUser = null;

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    await initializePage();
    setupEventListeners();
});

async function initializePage() {
    // Get current user
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const userResponse = await fetch(`${API_BASE}/auth/me`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (!userResponse.ok) {
            window.location.href = 'login.html';
            return;
        }

        currentUser = await userResponse.json();
        loadUserProgress();
        loadAccountInfo();
    } catch (error) {
        console.error('Error loading user:', error);
        showToast('حدث خطأ في تحميل البيانات', 'error');
    }
}

// Load user progress data
async function loadUserProgress() {
    try {
        const response = await fetch(`${API_BASE}/progress/user/${currentUser._id}`);
        const data = await response.json();

        if (data.success) {
            const progressList = data.progress || [];
            updateProgressStats(progressList);
            displayProgressList(progressList);
        }
    } catch (error) {
        console.error('Error loading progress:', error);
    }
}

// Update progress statistics
function updateProgressStats(progressList) {
    const inProgress = progressList.filter(p => p.status !== 'completed').length;
    const completed = progressList.filter(p => p.status === 'completed').length;

    const totalPercentage = progressList.length > 0
        ? Math.round(progressList.reduce((sum, p) => sum + p.percentageComplete, 0) / progressList.length)
        : 0;

    document.getElementById('courses-in-progress').textContent = inProgress;
    document.getElementById('courses-completed').textContent = completed;
    document.getElementById('average-progress').textContent = totalPercentage + '%';
}

// Display progress list
function displayProgressList(progressList) {
    const progressListEl = document.getElementById('progress-list');

    if (progressList.length === 0) {
        progressListEl.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>لم تبدأ أي دورات بعد</p>
            </div>
        `;
        return;
    }

    progressListEl.innerHTML = progressList.map(progress => {
        const course = progress.course || {};
        const courseName = course.name || 'دورة بدون اسم';
        const percentage = progress.percentageComplete || 0;
        const lessonsCompleted = progress.lessonsCompleted || 0;
        const totalLessons = progress.totalLessons || 0;

        return `
            <div class="progress-item">
                <div class="progress-item-info">
                    <h4 class="progress-item-name">${courseName}</h4>
                    <div class="progress-item-details">
                        <span>${lessonsCompleted} / ${totalLessons} درس</span>
                        <span>${percentage}% مكتمل</span>
                    </div>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

// Load account information
function loadAccountInfo() {
    const email = currentUser.email || '--';
    const joinedDate = new Date(currentUser.createdAt).toLocaleDateString('ar-SA');

    document.getElementById('account-email').textContent = email;
    document.getElementById('account-joined').textContent = joinedDate;
}

// Setup event listeners
function setupEventListeners() {
    // Section navigation
    const navButtons = document.querySelectorAll('.settings-nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            switchSection(section);

            // Update active state
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Reset progress button
    document.getElementById('reset-progress-btn').addEventListener('click', () => {
        showResetModal();
    });

    // Modal controls
    document.getElementById('modal-close').addEventListener('click', hideResetModal);
    document.getElementById('cancel-reset').addEventListener('click', hideResetModal);
    document.getElementById('confirm-reset').addEventListener('click', confirmReset);

    // Modal overlay click
    document.getElementById('reset-confirm-modal').addEventListener('click', (e) => {
        if (e.target.id === 'reset-confirm-modal') {
            hideResetModal();
        }
    });
}

// Switch between sections
function switchSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.settings-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    const sectionId = sectionName.replace('-', '-') + '-section';
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
    }
}

// Show reset confirmation modal
function showResetModal() {
    const modal = document.getElementById('reset-confirm-modal');
    modal.classList.add('active');
}

// Hide reset confirmation modal
function hideResetModal() {
    const modal = document.getElementById('reset-confirm-modal');
    modal.classList.remove('active');
}

// Confirm and execute reset
async function confirmReset() {
    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/progress/user/${currentUser._id}/reset`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            hideResetModal();
            showToast('تم حذف التقدم بنجاح ✓', 'success');

            // Reload progress after 1 second
            setTimeout(() => {
                loadUserProgress();
            }, 1000);
        } else {
            showToast('فشل حذف التقدم', 'error');
        }
    } catch (error) {
        console.error('Error resetting progress:', error);
        showToast('حدث خطأ أثناء حذف التقدم', 'error');
    }
}

// Toast notification system
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'fas fa-info-circle';
    if (type === 'success') icon = 'fas fa-check-circle';
    if (type === 'warning') icon = 'fas fa-exclamation-circle';
    if (type === 'error') icon = 'fas fa-times-circle';

    toast.innerHTML = `
        <div class="toast-icon">
            <i class="${icon}"></i>
        </div>
        <div class="toast-message">
            <p>${message}</p>
        </div>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;

    container.appendChild(toast);

    // Close button functionality
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        toast.remove();
    });

    // Auto-remove after 5 seconds
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 5000);
}
