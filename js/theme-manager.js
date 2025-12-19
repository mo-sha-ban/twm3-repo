/**
 * Theme Manager
 * Unifies Dark/Light mode logic across the entire website.
 * Supports both 'dark-theme' class (Global) and 'data-theme="dark"' attribute (Profile).
 */

const ThemeManager = {
    storageKey: 'theme',
    
    init() {
        // 1. Resolve current theme preference
        // Migrate 'mode' (old key) to 'theme' (new key) if needed
        let theme = localStorage.getItem(this.storageKey);
        if (!theme) {
            const oldMode = localStorage.getItem('mode');
            if (oldMode) {
                theme = oldMode;
                localStorage.setItem(this.storageKey, theme);
                localStorage.removeItem('mode'); // Cleanup
            } else {
                // Default to light or check system preference
                 theme = 'light';
            }
        }
        
        // 2. Apply theme immediately
        this.applyTheme(theme);
        
        // 3. Setup event listeners
        document.addEventListener('DOMContentLoaded', () => {
            this.setupToggles();
            // Re-apply in case DOM took time and we need to update icons
            this.updateUI(theme);
        });
    },
    
    toggle() {
        const current = localStorage.getItem(this.storageKey) || 'light';
        const newTheme = current === 'dark' ? 'light' : 'dark';
        
        localStorage.setItem(this.storageKey, newTheme);
        this.applyTheme(newTheme);
    },
    
    applyTheme(theme) {
        const isDark = theme === 'dark';
        
        // METHOD 1: Class (Global styles - INVERTED LOGIC)
        // In style.css, the DEFAULT :root variables are DARK (#080321).
        // The class .dark-theme actually overrides them to be LIGHT (white)!
        // So:
        // Dark Mode requested -> REMOVE .dark-theme (use default dark :root)
        // Light Mode requested -> ADD .dark-theme (use light override)
        if (isDark) {
            document.body.classList.remove('dark-theme');
            document.body.classList.remove('dark');
        } else {
            document.body.classList.add('dark-theme');
            // document.body.classList.add('dark'); // Only add if needed, but 'dark-theme' seems to be the key one for style.css
        }
        
        // METHOD 2: Data Attribute (Profile styles - STANDARD LOGIC)
        // Profile uses standard: default is Light, [data-theme="dark"] is Dark.
        if (isDark) {
            document.body.setAttribute('data-theme', 'dark');
        } else {
            document.body.removeAttribute('data-theme');
        }
        
        this.updateUI(theme);
    },
    
    updateUI(theme) {
        const isDark = theme === 'dark';
        
        // 1. Global Header Toggle (#colorMode)
        // .active class usually moves the slider. 
        // If Default is Dark (no .active), then Light (switched) should be .active
        const globalToggle = document.getElementById('colorMode');
        if (globalToggle) {
            if (isDark) {
                globalToggle.classList.remove('active'); // Dark state (Default position)
            } else {
                globalToggle.classList.add('active'); // Light state (Switched position)
            }
        }
        
        // 2. Profile Sidebar Toggle (#theme-toggle)
        const profileToggleIcon = document.querySelector('#theme-toggle i');
        if (profileToggleIcon) {
            profileToggleIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        }
    },
    
    setupToggles() {
        // Global Toggle
        const globalToggle = document.getElementById('colorMode');
        if (globalToggle) {
            // Remove old listeners by cloning or just overwriting onclick
            globalToggle.onclick = (e) => {
                e.preventDefault();
                this.toggle();
            };
        }
        
        // Profile Toggle
        const profileToggle = document.getElementById('theme-toggle');
        if (profileToggle) {
            profileToggle.onclick = (e) => {
                e.preventDefault();
                this.toggle();
            };
        }
    }
};

// Auto-initialize
ThemeManager.init();

// Expose globally
window.ThemeManager = ThemeManager;
