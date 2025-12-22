/* Dashboard UI Controls - Sidebar, Menu Toggle, and Buttons */
(function() {
    console.log('Loading dashboard UI controls...');

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        console.log('Initializing dashboard UI controls...');
        
        // Setup menu toggle
        setupMenuToggle();
        
        // Setup sidebar menu
        setupSidebarMenu();
        
        // Setup header buttons
        setupHeaderButtons();
        
        // Setup sidebar overlay
        setupSidebarOverlay();
        
        console.log('Dashboard UI controls initialized successfully');
    }

    function setupMenuToggle() {
        const menuToggle = document.getElementById('menu-toggle');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        
        if (!menuToggle || !sidebar) {
            console.warn('Menu toggle or sidebar not found');
            return;
        }
        
        menuToggle.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Menu toggle clicked');
            
            sidebar.classList.toggle('active');
            if (overlay) {
                overlay.classList.toggle('active');
            }
            document.body.classList.toggle('sidebar-open');
        });
        
        console.log('Menu toggle setup complete');
    }

    function setupSidebarOverlay() {
        const overlay = document.getElementById('sidebar-overlay');
        const sidebar = document.getElementById('sidebar');
        
        if (!overlay || !sidebar) return;
        
        overlay.addEventListener('click', function() {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.classList.remove('sidebar-open');
        });
    }

    function setupSidebarMenu() {
        console.log('Setting up sidebar menu...');
        
        const menuItems = document.querySelectorAll('.menu-item');
        console.log('Found menu items:', menuItems.length);
        
        if (menuItems.length === 0) {
            console.error('No menu items found! Check HTML structure.');
            return;
        }
        
        menuItems.forEach((item, index) => {
            const sectionId = item.getAttribute('data-section') || item.getAttribute('href')?.replace('#', '');
            console.log(`Setting up menu item ${index}: ${sectionId}`);
            
            // Remove existing click handler if any
            item.onclick = null;
            
            // Add new click handler
            item.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const clickedSectionId = this.getAttribute('data-section') || this.getAttribute('href')?.replace('#', '');
                console.log('=== MENU ITEM CLICKED ===');
                console.log('Section ID:', clickedSectionId);
                
                if (!clickedSectionId) {
                    console.error('No section ID found for menu item');
                    return;
                }
                
                // Remove active class from all menu items
                menuItems.forEach(mi => mi.classList.remove('active'));
                
                // Add active class to clicked item
                this.classList.add('active');
                console.log('Active class added to:', clickedSectionId);
                
                // Switch section
                try {
                    switchSection(clickedSectionId);
                } catch (error) {
                    console.error('Error switching section:', error);
                }
                
                // Close sidebar on mobile
                const sidebar = document.getElementById('sidebar');
                const overlay = document.getElementById('sidebar-overlay');
                if (sidebar && window.innerWidth <= 768) {
                    sidebar.classList.remove('active');
                    if (overlay) overlay.classList.remove('active');
                    document.body.classList.remove('sidebar-open');
                    console.log('Sidebar closed (mobile)');
                }
            }, true); // Use capture phase
            
            console.log(`✓ Menu item ${index} (${sectionId}) setup complete`);
        });
        
        console.log('Sidebar menu setup complete');
    }

    function switchSection(sectionId) {
        console.log('=== SWITCHING SECTION ===');
        console.log('Target section:', sectionId);
        
        // Hide all sections
        const sections = document.querySelectorAll('.content-section');
        console.log('Total sections found:', sections.length);
        
        sections.forEach(section => {
            section.classList.remove('active');
            section.style.display = 'none';
        });
        console.log('All sections hidden');
        
        // Show target section
        const targetSection = document.getElementById(sectionId + '-section');
        console.log('Looking for section:', sectionId + '-section');
        
        if (targetSection) {
            targetSection.classList.add('active');
            targetSection.style.display = 'block';
            console.log('✓ Section displayed:', sectionId);
            
            // Load data for section if needed
            try {
                loadSectionData(sectionId);
            } catch (error) {
                console.error('Error loading section data:', error);
            }
        } else {
            console.error('❌ Section not found:', sectionId + '-section');
            console.log('Available sections:');
            sections.forEach(s => console.log('  -', s.id));
        }
        
        console.log('=== SECTION SWITCH COMPLETE ===');
    }

    function loadSectionData(sectionId) {
        switch(sectionId) {
            case 'users':
                if (typeof fetchUsers === 'function') {
                    fetchUsers();
                }
                break;
            case 'courses':
                if (window.Courses && typeof window.Courses.fetchCourses === 'function') {
                    window.Courses.fetchCourses();
                } else if (typeof fetchCourses === 'function') {
                    fetchCourses();
                }
                break;
            case 'products':
                if (typeof fetchProducts === 'function') {
                    fetchProducts();
                }
                break;
            case 'comments':
                if (typeof fetchComments === 'function') {
                    fetchComments(1, 'all', '');
                }
                break;
        }
    }

    function setupHeaderButtons() {
        console.log('Setting up header buttons...');
        
        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Logout button clicked');
                if (typeof logout === 'function') {
                    logout();
                } else {
                    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.href = '../../login.html';
                    }
                }
            });
            console.log('✓ Logout button setup');
        }
        
        // Home button
        const homeBtn = document.getElementById('home-btn');
        if (homeBtn) {
            homeBtn.addEventListener('click', function(e) {
                e.preventDefault();
                window.location.href = '../../index.html';
            });
            console.log('✓ Home button setup');
        }
        
        // Add user button in header
        const addUserBtnHeader = document.getElementById('add-user-btn');
        if (addUserBtnHeader) {
            addUserBtnHeader.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Add user button (header) clicked');
                if (typeof openAddModal === 'function') {
                    openAddModal();
                } else {
                    console.warn('openAddModal function not found');
                }
            });
            console.log('✓ Add user button (header) setup');
        }
        
        // Add user button in users section
        const addUserButton = document.getElementById('add-user-button');
        if (addUserButton) {
            addUserButton.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Add user button (section) clicked');
                if (typeof openAddModal === 'function') {
                    openAddModal();
                } else {
                    console.warn('openAddModal function not found');
                    // Fallback: try to open modal directly
                    const modal = document.getElementById('addUserModal');
                    if (modal) {
                        modal.style.display = 'flex';
                        modal.classList.add('show');
                        document.body.style.overflow = 'hidden';
                    }
                }
            });
            console.log('✓ Add user button (section) setup');
        } else {
            console.warn('add-user-button not found');
        }
        
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', function(e) {
                e.preventDefault();
                document.body.classList.toggle('dark');
                
                // Save preference
                const isDark = document.body.classList.contains('dark');
                localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
                
                // Update icon
                const icon = this.querySelector('i');
                if (icon) {
                    icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
                }
            });
            
            // Load saved theme
            const darkMode = localStorage.getItem('darkMode');
            if (darkMode === 'enabled') {
                document.body.classList.add('dark');
                const icon = themeToggle.querySelector('i');
                if (icon) icon.className = 'fas fa-sun';
            }
            console.log('✓ Theme toggle setup');
        }
        
        console.log('Header buttons setup complete');
    }

    // Expose switchSection globally
    window.switchSection = switchSection;
    
})();
