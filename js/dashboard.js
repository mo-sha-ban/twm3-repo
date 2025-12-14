// Dashboard JavaScript - Modern Design

// Global variables
let isDarkMode = false;
let currentSection = 'users';

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    initializeSidebar();
    initializeNavigation();
    loadUsers();
    setupEventListeners();
});
// Initialize simple theme (keeps backward compatibility)
function initializeTheme() {
    try {
        isDarkMode = localStorage.getItem('darkMode') === 'true';
        if (isDarkMode) document.documentElement.classList.add('dark');
    } catch (e) {
        // ignore
    }
}

// Sidebar initialization moved into its own function
function initializeSidebar() {
    hideLoading();
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (menuToggle) menuToggle.addEventListener('click', toggleSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);

    // Close sidebar when clicking outside
    document.addEventListener('click', function(e) {
        if (!sidebar || !menuToggle) return;
        try {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                closeSidebar();
            }
        } catch (err) {
            console.warn('Error while handling outside click for sidebar:', err);
        }
    });
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('open');
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
}

// Navigation Management
function initializeNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            showSection(section);
            
            // Update active menu item
            menuItems.forEach(mi => mi.classList.remove('active'));
            this.classList.add('active');
            
            // Close sidebar on mobile
            closeSidebar();
        });
    });
}

function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.remove('active'));
    
    // Show selected section
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
        currentSection = sectionName;
        
        // Load section data
        switch(sectionName) {
            case 'users':
                loadUsers();
                break;
            case 'courses':
                loadCourses();
                break;
            case 'products':
                loadProducts();
                break;
            case 'comments':
                loadComments();
                break;
        }
    }
}

// Event Listeners
function setupEventListeners() {
    // Add user button
    const addUserBtn = document.getElementById('add-user-btn');
    if (addUserBtn) addUserBtn.addEventListener('click', openAddModal);
    else console.warn('add-user-btn not found on page');

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
    else console.warn('logout-btn not found on page');

    // home button
    const homeBtn = document.getElementById('home-btn');
    if (homeBtn) homeBtn.addEventListener('click', goToHome);
    else console.warn('logout-btn not found on page');
    
    // Search functionality
    const searchInput = document.getElementById('search');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Filter functionality
    const filterSelect = document.getElementById('filter');
    if (filterSelect) {
        filterSelect.addEventListener('change', handleFilter);
    }
    
    // Form submissions
    const addUserForm = document.getElementById('addUserForm');
    if (addUserForm) {
        addUserForm.addEventListener('submit', handleAddUser);
    }
    
    const editUserForm = document.getElementById('editUserForm');
    if (editUserForm) {
        editUserForm.addEventListener('submit', handleEditUser);
    }
}

// User Management
async function loadUsers() {
    showLoading();
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/admin/users`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const responseData = await response.json();
        
        if (!response.ok) {
            if (responseData?.error === 'INVALID_TOKEN') {
                // Handle expired token
                showError('انتهت صلاحية الجلسة. يرجى إعادة تسجيل الدخول');
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 2000);
                return;
            }
            throw new Error(responseData?.message || 'فشل في جلب المستخدمين');
        }
        
        displayUsers(responseData);
    } catch (error) {
        console.error('Error loading users:', error);
        showError(error.message || 'فشل في جلب المستخدمين');
    } finally {
        hideLoading();
    }
}

function createUserModal(type, userId = null) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${type === 'add' ? 'إضافة مستخدم جديد' : 'تعديل المستخدم'}</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <form id="userForm">
                <div class="form-group">
                    <label for="userName">الاسم الكامل</label>
                    <input type="text" id="userName" name="name" required />
                </div>
                <div class="form-group">
                    <label for="userUsername">اسم المستخدم</label>
                    <input type="text" id="userUsername" name="username" required />
                </div>
                <div class="form-group">
                    <label for="userEmail">البريد الإلكتروني</label>
                    <input type="email" id="userEmail" name="email" required />
                </div>
                <div class="form-group">
                    <label for="userPhone">رقم الهاتف</label>
                    <input type="tel" id="userPhone" name="phone" />
                </div>
                ${type === 'add' ? `
                <div class="form-group">
                    <label for="userPassword">كلمة المرور</label>
                    <input type="password" id="userPassword" name="password" required />
                </div>
                ` : ''}
                <div class="form-group">
                    <label for="userIsAdmin">صلاحيات المدير</label>
                    <select id="userIsAdmin" name="isAdmin">
                        <option value="false">مستخدم عادي</option>
                        <option value="true">مدير</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">إلغاء</button>
                    <button type="submit" class="btn btn-primary">${type === 'add' ? 'إضافة' : 'حفظ التغييرات'}</button>
                </div>
            </form>
        </div>
    `;
    
    // Add form submission handler
    const form = modal.querySelector('#userForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleUserSubmit(e, type, userId);
    });
    
    // Load user data for editing
    if (type === 'edit' && userId) {
        loadUserForEditModal(userId, modal);
    }
    
    return modal;
}

async function handleUserSubmit(e, type, userId) {
    const formData = new FormData(e.target);
    const userData = Object.fromEntries(formData.entries());
    
    // Convert isAdmin to boolean and track if admin status is being changed
    const isAdminChange = type === 'edit' && (userData.isAdmin === 'true') !== window.currentEditingUser?.isAdmin;
    userData.isAdmin = userData.isAdmin === 'true';
    
    try {
        const token = localStorage.getItem('token');
        const url = type === 'add' ? '/api/admin/users' : `/api/admin/users/${userId}`;
        const method = type === 'add' ? 'POST' : 'PUT';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(userData)
        });
        
        const responseData = await response.json().catch(() => null);
        
        if (!response.ok) {
            let errorMessage;
            if (responseData?.error) {
                // Handle specific error cases with detailed messages
                switch(responseData.error) {
                    case 'INSUFFICIENT_PERMISSIONS':
                        errorMessage = 'ليس لديك الصلاحيات الكافية لتغيير صلاحيات المستخدم';
                        break;
                    case 'SELF_ADMIN_CHANGE':
                        errorMessage = 'لا يمكنك تغيير صلاحياتك الخاصة';
                        break;
                    case 'INVALID_TOKEN':
                        errorMessage = 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى';
                        break;
                    case 'USER_NOT_FOUND':
                        errorMessage = 'لم يتم العثور على المستخدم';
                        break;
                    default:
                        errorMessage = responseData.message || `فشل في ${type === 'add' ? 'إضافة' : 'تحديث'} المستخدم`;
                }
            } else {
                errorMessage = `فشل في ${type === 'add' ? 'إضافة' : 'تحديث'} المستخدم`;
            }
            throw new Error(errorMessage);
        }

        // Show appropriate success message based on the action
        let successMessage;
        if (type === 'add') {
            successMessage = 'تم إضافة المستخدم بنجاح';
        } else if (isAdminChange) {
            successMessage = userData.isAdmin ? 
                'تم منح صلاحيات الأدمن للمستخدم بنجاح' :
                'تم إلغاء صلاحيات الأدمن للمستخدم بنجاح';
        } else {
            successMessage = 'تم تحديث بيانات المستخدم بنجاح';
        }
        
        showSuccess(successMessage);
        e.target.closest('.modal').remove();
        
        // Automatically refresh the page after admin role changes
        if (isAdminChange) {
            setTimeout(() => {
                showSuccess('جاري تحديث الصفحة لتطبيق التغييرات...');
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            }, 1000);
        } else {
            loadUsers();
        }
    } catch (error) {
        showError(error.message);
    }
}

async function loadUserForEditModal(userId, modal) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/admin/users`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('فشل في جلب بيانات المستخدم');
        }
        
        const users = await response.json();
        const user = users.find(u => u._id === userId);
        
        if (user) {
            modal.querySelector('#userName').value = user.name || '';
            modal.querySelector('#userUsername').value = user.username || '';
            modal.querySelector('#userEmail').value = user.email || '';
            modal.querySelector('#userPhone').value = user.phone || '';
            modal.querySelector('#userIsAdmin').value = user.isAdmin ? 'true' : 'false';
        }
    } catch (error) {
        showError('فشل في جلب بيانات المستخدم');
    }
}

async function deleteUser(userId) {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('فشل في حذف المستخدم');
        }
        
        showSuccess('تم حذف المستخدم بنجاح');
        loadUsers();
    } catch (error) {
        showError('فشل في حذف المستخدم');
    }
}

function editUser(userId) {
    // Reset the current editing user
    window.currentEditingUser = null;
    openEditUserModal(userId);
}

function displayUsers(users) {
    const tbody = document.getElementById('users-table');
    if (!tbody) return;
    
    if (!Array.isArray(users) || users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>لا يوجد مستخدمين</h3>
                    <p>لم يتم العثور على أي مستخدمين</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = users.map((user, index) => `
        <tr class="fade-in">
            <td>${index + 1}</td>
            <td>
                <img src="${user.avatarUrl || '/img/profile.png'}" 
                     alt="صورة المستخدم" 
                     class="user-avatar"
                     onerror="this.onerror=null; this.src='/img/profile.png'">
            </td>
            <td>${user.name || '---'}</td>
            <td>${user.username || '---'}</td>
            <td>${user.email || '---'}</td>
            <td>${user.phone || '---'}</td>
            <td>
                <span class="status-badge status-${user.isAdmin ? 'admin' : 'active'}">
                    ${user.isAdmin ? 'مدير' : 'نشط'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-secondary" onclick="editUser('${user._id}')" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteUser('${user._id}')" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Course Management
async function loadCourses() {
    // delegate to Courses module if available
    if (window.Courses && typeof window.Courses.fetchCourses === 'function') {
        window.Courses.fetchCourses();
        return;
    }
}

// Add Course Modal
function openAddCourseModal() {
    if (window.Courses && typeof window.Courses.openAddCourseModal === 'function') {
        return window.Courses.openAddCourseModal();
    }
}

function openEditCourseModal(courseId) {
    const modal = createCourseModal('edit', courseId);
    document.body.appendChild(modal);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

// Add ESC key handler to close modals
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const visibleModals = document.querySelectorAll('.modal.show');
        visibleModals.forEach(modal => closeModal(modal.id));
    }
});

// Add click outside modal handler
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        closeModal(e.target.id);
    }
});

function createCourseModal(type, courseId = null) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${type === 'add' ? 'إضافة كورس جديد' : 'تعديل الكورس'}</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <form id="courseForm">
                <div class="form-group">
                    <label for="courseTitle">عنوان الكورس</label>
                    <input type="text" id="courseTitle" name="title" required />
                </div>
                <div class="form-group">
                    <label for="courseDescription">وصف الكورس</label>
                    <textarea id="courseDescription" name="description" rows="3" required></textarea>
                </div>
                <div class="form-group">
                    <label for="courseInstructor">المدرب</label>
                    <input type="text" id="courseInstructor" name="instructor" required />
                </div>
                <div class="form-group">
                    <label for="courseDuration">المدة (بالساعات)</label>
                    <input type="number" id="courseDuration" name="duration" min="1" required />
                </div>
                <div class="form-group">
                    <label for="coursePrice">السعر</label>
                    <input type="number" id="coursePrice" name="price" min="0" step="0.01" required />
                </div>
                <div class="form-group">
                    <div id="categories-container">
                        <label>التصنيفات</label>
                        <div class="categories-list">
                            <label class="category-checkbox">
                                <input type="checkbox" name="categories" value="programming" class="category-input">
                                <span class="category-label">برمجة</span>
                            </label>
                            <label class="category-checkbox">
                                <input type="checkbox" name="categories" value="ethical-hacking" class="category-input">
                                <span class="category-label">اختراق أخلاقي</span>
                            </label>
                            <label class="category-checkbox">
                                <input type="checkbox" name="categories" value="cybersecurity" class="category-input">
                                <span class="category-label">سايبر سكيورتي</span>
                            </label>
                            <label class="category-checkbox">
                                <input type="checkbox" name="categories" value="mobile-development" class="category-input">
                                <span class="category-label">تطوير تطبيقات</span>
                            </label>
                            <label class="category-checkbox">
                                <input type="checkbox" name="categories" value="web-development" class="category-input">
                                <span class="category-label">تطوير مواقع</span>
                            </label>
                            <label class="category-checkbox">
                                <input type="checkbox" name="categories" value="video-editing" class="category-input">
                                <span class="category-label">مونتاج</span>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">إلغاء</button>
                    <button type="submit" class="btn btn-primary">${type === 'add' ? 'إضافة' : 'حفظ التغييرات'}</button>
                </div>
            </form>
        </div>
    `;
    
    // Add form submission handler
    const form = modal.querySelector('#courseForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleCourseSubmit(e, type, courseId);
    });
    
    // Load course data for editing
    if (type === 'edit' && courseId) {
        loadCourseForEdit(courseId, modal);
    }
    
    return modal;
}

async function handleCourseSubmit(e, type, courseId) {
    // delegate to Courses module
    if (window.Courses && typeof window.Courses.handleAddCourseSubmit === 'function') {
        return window.Courses.handleAddCourseSubmit(e);
    }
}

async function loadCourseForEdit(courseId, modal) {
    // If a local modal was provided, populate it directly so the local
    // form submission will have window.editingCourseId set and use PUT.
    if (modal && modal.querySelector) {
        try {
            const token = localStorage.getItem('token');
            const resp = await fetch(`/api/courses/${courseId}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (!resp.ok) throw new Error('فشل في جلب بيانات الكورس');
            const course = await resp.json();

            // Populate fields inside the provided modal (fall back to global IDs)
            const getEl = (selector) => modal.querySelector(selector) || document.getElementById(selector.replace(/^#/, ''));
            const titleEl = getEl('#courseTitle'); if (titleEl) titleEl.value = course.title || '';
            const descEl = getEl('#courseDescription'); if (descEl) descEl.value = course.description || '';
            const instrEl = getEl('#courseInstructor'); if (instrEl) instrEl.value = course.instructor || '';
            const durEl = getEl('#courseDuration'); if (durEl) durEl.value = course.duration || 1;
            const priceEl = getEl('#coursePrice'); if (priceEl) priceEl.value = course.price || 0;
            // categories: check matching inputs inside modal
            try {
                const catInputs = modal.querySelectorAll('.category-input');
                if (catInputs && catInputs.length) {
                    catInputs.forEach(inp => {
                        try { inp.checked = (course.categories || []).some(c => c.mainCategory === inp.value); } catch(e){}
                    });
                }
            } catch(e){}
            const tagsEl = getEl('#courseTags'); if (tagsEl) tagsEl.value = (course.tags || []).join(', ');
            const iconEl = getEl('#courseIcon'); if (iconEl) iconEl.value = course.icon || '';

            // Ensure global editingCourseId is set so Courses handler will use PUT
            try { window.editingCourseId = courseId; } catch(e) { /* ignore */ }

            // If the modal has a form, ensure it contains a hidden id input
            try {
                const formEl = modal.querySelector('form#courseForm');
                if (formEl) {
                    let hid = formEl.querySelector('input[name="id"]');
                    if (!hid) {
                        hid = document.createElement('input');
                        hid.type = 'hidden';
                        hid.name = 'id';
                        hid.id = 'courseId';
                        formEl.appendChild(hid);
                    }
                    hid.value = courseId;
                    formEl.dataset.courseId = courseId;
                }
            } catch(e) { console.warn('Failed to add hidden id to local modal', e); }

            return course;
        } catch (err) {
            console.error('Error loading course for edit (local modal):', err);
            // fall back to module if available
        }
    }

    // delegate editing/loading to Courses module if available
    if (window.Courses && typeof window.Courses.openEditCourse === 'function') {
        return window.Courses.openEditCourse(courseId);
    }
}

async function deleteCourse(courseId) {
    if (window.Courses && typeof window.Courses.deleteCourse === 'function') {
        return window.Courses.deleteCourse(courseId);
    }
}

function editCourse(courseId) {
    if (window.Courses && typeof window.Courses.openEditCourse === 'function') {
        return window.Courses.openEditCourse(courseId);
    }
}

function displayCourses(courses) {
    const tbody = document.getElementById('courses-table');
    if (!tbody) return;
    
    if (!Array.isArray(courses) || courses.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <i class="fas fa-graduation-cap"></i>
                    <h3>لا يوجد كورسات</h3>
                    <p>لم يتم العثور على أي كورسات</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = courses.map((course, index) => `
        <tr class="fade-in">
            <td>${index + 1}</td>
            <td>${course.title || '---'}</td>
            <td>${course.description ? course.description.substring(0, 50) + '...' : '---'}</td>
            <td>${course.instructor || '---'}</td>
            <td>${course.duration ? course.duration + ' ساعة' : '---'}</td>
            <td>${course.price ? course.price + ' جنيه' : 'مجاني'}</td>
            <td>${course.category || '---'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-secondary" onclick="editCourse('${course._id}')" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCourse('${course._id}')" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Product Management
async function loadProducts() {
    // delegate to Products module if available
    if (window.Products && typeof window.Products.fetchProducts === 'function') {
        window.Products.fetchProducts();
        return;
    }
}

// Comment Management
async function loadComments() {
    showLoading();

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/comments', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('فشل في جلب التعليقات');
        }

        const comments = await response.json();
        displayComments(comments);
    } catch (error) {
        console.error('Error loading comments:', error);
        showError('فشل في جلب التعليقات');
    } finally {
        hideLoading();
    }
}

function displayComments(comments) {
    const tbody = document.getElementById('comments-table');
    if (!tbody) return;
    
    if (!Array.isArray(comments) || comments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <i class="fas fa-comments"></i>
                    <h3>لا يوجد تعليقات</h3>
                    <p>لم يتم العثور على أي تعليقات</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = comments.map((comment, index) => `
        <tr class="fade-in">
            <td>${index + 1}</td>
            <td>${comment.user?.name || comment.user?.username || 'مستخدم'}</td>
            <td>${comment.content ? comment.content.substring(0, 50) + '...' : '---'}</td>
            <td>${comment.blog?.title || '---'}</td>
            <td>${comment.createdAt ? new Date(comment.createdAt).toLocaleDateString('ar-EG') : '---'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-danger" onclick="deleteComment('${comment._id}')" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Modal Functions
function openAddModal() {
    const modal = document.getElementById('addUserModal');
    if (!modal) return console.warn('openAddModal: addUserModal not found');
    modal.classList.add('show');
}

function closeAddModal() {
    const modal = document.getElementById('addUserModal');
    if (!modal) return console.warn('closeAddModal: addUserModal not found');
    modal.classList.remove('show');
    const form = document.getElementById('addUserForm');
    if (form && typeof form.reset === 'function') form.reset();
}

function openEditModal(userId) {
    const modal = document.getElementById('editUserModal');
    if (!modal) return console.warn('openEditModal: editUserModal not found');
    modal.classList.add('show');
    // Load user data for editing
    if (typeof loadUserForEdit === 'function') loadUserForEdit(userId);
}

function closeEditModal() {
    const modal = document.getElementById('editUserModal');
    if (!modal) return console.warn('closeEditModal: editUserModal not found');
    modal.classList.remove('show');
    const form = document.getElementById('editUserForm');
    if (form && typeof form.reset === 'function') form.reset();
}

// Form Handlers
async function handleAddUser(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const userData = Object.fromEntries(formData.entries());
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/admin/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(userData)
        });
        
        if (!response.ok) {
            throw new Error('فشل في إضافة المستخدم');
        }
        
        showSuccess('تم إضافة المستخدم بنجاح');
        closeAddModal();
        loadUsers();
    } catch (error) {
        showError('فشل في إضافة المستخدم');
    }
}

async function handleEditUser(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const userData = Object.fromEntries(formData.entries());
    const userId = userData.id;
    // Map the legacy `role` field (user/admin) to the API's expected boolean `isAdmin`
    if (userData.role !== undefined) {
        userData.isAdmin = userData.role === 'admin';
        delete userData.role; // tidy up the payload
    }

    // Determine whether admin status actually changed (use stored currentEditingUser if available)
    const wasAdmin = window.currentEditingUser && window.currentEditingUser._id === userId
        ? !!window.currentEditingUser.isAdmin
        : undefined;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(userData)
        });

        const resData = await response.json().catch(() => ({}));

        if (!response.ok) {
            const msg = resData?.error || resData?.message || 'فشل في تحديث المستخدم';
            throw new Error(msg);
        }

        showSuccess('تم تحديث المستخدم بنجاح');
        closeEditModal();

        // If admin status changed, refresh the page to update permissions/UI; otherwise just reload list
        if (wasAdmin !== undefined && (wasAdmin !== !!resData.isAdmin)) {
            // small delay so user sees the message
            setTimeout(() => {
                window.location.reload();
            }, 900);
        } else {
            loadUsers();
        }
    } catch (error) {
        showError(error.message || 'فشل في تحديث المستخدم');
    }
}

// Action Functions
function editUser(userId) {
    openEditModal(userId);
}

async function deleteUser(userId) {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('فشل في حذف المستخدم');
        }
        
        showSuccess('تم حذف المستخدم بنجاح');
        loadUsers();
    } catch (error) {
        showError('فشل في حذف المستخدم');
    }
}

async function deleteComment(commentId) {
    if (!confirm('هل أنت متأكد من حذف هذا التعليق؟')) return;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/comments/${commentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('فشل في حذف التعليق');
        }
        
        showSuccess('تم حذف التعليق بنجاح');
        loadComments();
    } catch (error) {
        showError('فشل في حذف التعليق');
    }
}

// Search and Filter
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#users-table tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function handleFilter(e) {
    const filterValue = e.target.value;
    const rows = document.querySelectorAll('#users-table tr');
    
    rows.forEach(row => {
        if (filterValue === 'all') {
            row.style.display = '';
        } else {
            const statusCell = row.querySelector('.status-badge');
            if (statusCell) {
                const hasStatus = statusCell.classList.contains(`status-${filterValue}`);
                row.style.display = hasStatus ? '' : 'none';
            }
        }
    });
}

// Utility Functions
function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.add('show');
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.remove('show');
}

function showSuccess(message) {
    if (window.__TW_TOAST__) {
        window.__TW_TOAST__.show({
            title: 'نجح',
            desc: message,
            danger: false,
            durationMs: 3000
        });
    } else {
        alert(message);
    }
}

function showError(message) {
    if (window.__TW_TOAST__) {
        window.__TW_TOAST__.show({
            title: 'خطأ',
            desc: message,
            danger: true,
            durationMs: 4000
        });
    } else {
        alert(message);
    }
}

function showWarning(message) {
    if (window.__TW_TOAST__) {
        window.__TW_TOAST__.show({
            title: 'تنبيه',
            desc: message,
            warning: true,
            durationMs: 3000
        });
    } else {
        alert(message);
    }
}

// Global function to handle user session refresh
function handleSessionRefresh(message = 'جاري إعادة تحميل الصفحة...') {
    showSuccess(message);
    setTimeout(() => {
        window.location.reload();
    }, 1500);
}

// Store the currently editing user for comparison
window.currentEditingUser = null;

function logout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '../../login.html';
    }
}
function goToHome() {
        window.location.href = '../../index.html';
}

// Load user for editing with enhanced error handling and admin change warnings
async function loadUserForEdit(userId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/admin/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('فشل في جلب بيانات المستخدم');
        }
        
        const user = await response.json();
    // store for later comparison (wasAdmin checks)
    window.currentEditingUser = user;
        
        // Fill form with user data
        document.getElementById('editUserId').value = user._id;
        document.getElementById('editUserName').value = user.name || '';
        document.getElementById('editUserUsername').value = user.username || '';
        document.getElementById('editUserEmail').value = user.email || '';
        document.getElementById('editUserPhone').value = user.phone || '';
        document.getElementById('editUserRole').value = user.isAdmin ? 'admin' : 'user';
        
    } catch (error) {
        showError('فشل في جلب بيانات المستخدم');
    }
}

// Initialize all modal handlers and event listeners
function initializeDashboard() {
    // Wire up modal close handlers
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.show').forEach(modal => {
                closeModal(modal.id);
            });
        }
    });

    // Add Course button
    const addCourseButton = document.getElementById('add-course-button');
    if (addCourseButton) {
        // Remove old handlers by cloning
        const newBtn = addCourseButton.cloneNode(true);
        addCourseButton.parentNode.replaceChild(newBtn, addCourseButton);
        newBtn.addEventListener('click', openAddCourseModal);
    }

    // Other buttons
    const addUserButton = document.getElementById('add-user-button');
    if (addUserButton) {
        addUserButton.addEventListener('click', () => {
            // Use openAddUserModal from dash.js (now available globally)
            if (typeof window.openAddUserModal === 'function') {
                window.openAddUserModal();
            } else if (typeof openAddUserModal === 'function') {
                openAddUserModal();
            } else if (typeof openAddModal === 'function') {
                openAddModal();
            } else {
                const modal = document.getElementById('addUserModal');
                if (modal) {
                    modal.classList.add('show');
                    modal.style.display = 'flex';
                }
            }
        });
    }
    
    const addBlogButton = document.getElementById('add-blog-button');
    if (addBlogButton) {
        addBlogButton.addEventListener('click', () => {
            // Blog functionality removed, so do nothing or show message
            console.warn('Blog functionality has been removed');
        });
    }
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initializeDashboard);
