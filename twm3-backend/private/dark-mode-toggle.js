/* Dark Mode Toggle */
(function() {
  // Dark mode toggle functionality
  console.log('Dark mode toggle loaded');
  
  // This functionality might already exist in the main dashboard
  // Adding a simple implementation if needed
  
  if (!window.toggleDarkMode) {
    window.toggleDarkMode = function() {
      document.body.classList.toggle('dark');
      const isDark = document.body.classList.contains('dark');
      localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
    };
    
    // Initialize dark mode from localStorage
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'enabled') {
      document.body.classList.add('dark');
    }
  }
})();
