// Modern Login/Signup Handler
(function() {
    'use strict';

    let isAnimating = false;

    // Setup form switching with animation
    function setupFormSwitching() {
        const showSignupBtn = document.getElementById('showSignup');
        const showLoginBtn = document.getElementById('showLogin');
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');

        if (showSignupBtn && loginForm && signupForm) {
            showSignupBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (isAnimating) return;
                switchToSignup();
            });
        }

        if (showLoginBtn && loginForm && signupForm) {
            showLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (isAnimating) return;
                switchToLogin();
            });
        }
    }

    function switchToSignup() {
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        
        if (!loginForm || !signupForm) return;
        
        isAnimating = true;
        
        // Exit animation for login form
        loginForm.classList.add('exit-right');
        
        setTimeout(() => {
            loginForm.classList.remove('active', 'exit-right');
            signupForm.classList.add('active');
            isAnimating = false;
        }, 300);
    }

    function switchToLogin() {
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        
        if (!loginForm || !signupForm) return;
        
        isAnimating = true;
        
        // Exit animation for signup form
        signupForm.classList.add('exit-left');
        
        setTimeout(() => {
            signupForm.classList.remove('active', 'exit-left');
            loginForm.classList.add('active');
            isAnimating = false;
        }, 300);
    }

    // Login Handler
    async function handleLogin(event) {
        if (event) event.preventDefault();
        
        const emailInput = document.getElementById('login-email');
        const passwordInput = document.getElementById('login-password');
        const submitBtn = document.getElementById('login-submit-btn');
        
        if (!emailInput || !passwordInput) {
            console.error('Login inputs not found');
            return;
        }
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        if (!email || !password) {
            if (window.showToast) {
                window.showToast('يرجى إدخال البريد الإلكتروني وكلمة المرور', {
                    type: 'warning',
                    timeout: 4000,
                    title: 'بيانات ناقصة',
                    icon: 'fas fa-exclamation-triangle'
                });
            } else {
                alert('يرجى إدخال البريد الإلكتروني وكلمة المرور');
            }
            return;
        }
        
        // Add loading state
        if (submitBtn) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
        }
        
        try {
            const response = await fetch(`${window.appConfig.API_BASE_URL}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                // Save token and user data
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Success state
                if (submitBtn) {
                    submitBtn.classList.remove('loading');
                    submitBtn.classList.add('success');
                }
                
                // Redirect after short delay
                setTimeout(() => {
                    window.location.href = '/profile.html';
                }, 500);
            } else {
                throw new Error((data && (data.message || data.error)) || 'فشل في تسجيل الدخول');
            }
        } catch (error) {
            console.error('خطأ في تسجيل الدخول:', error);
            if (window.showToast) {
                window.showToast(error.message || 'حدث خطأ أثناء تسجيل الدخول', {
                    type: 'error',
                    timeout: 5000,
                    title: 'فشل تسجيل الدخول',
                    icon: 'fas fa-times-circle'
                });
            } else {
                alert(error.message || 'حدث خطأ أثناء تسجيل الدخول');
            }
            
            // Remove loading state
            if (submitBtn) {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        }
    }

    // Signup Handler
    async function handleSignup(event) {
        if (event) event.preventDefault();
        
        const usernameInput = document.getElementById('username');
        const emailInput = document.getElementById('signup-email');
        const passwordInput = document.getElementById('signup-password');
        const repasswordInput = document.getElementById('repassword');
        const submitBtn = document.getElementById('signup-submit-btn');
        
        if (!usernameInput || !emailInput || !passwordInput || !repasswordInput) {
            console.error('Signup inputs not found');
            return;
        }
        
        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const repassword = repasswordInput.value;
        
        // Validation
        if (!username || !email || !password || !repassword) {
            if (window.showToast) {
                window.showToast('يرجى ملء جميع الحقول', {
                    type: 'warning',
                    timeout: 4000,
                    title: 'بيانات ناقصة',
                    icon: 'fas fa-exclamation-triangle'
                });
            } else {
                alert('يرجى ملء جميع الحقول');
            }
            return;
        }
        
        if (password !== repassword) {
            if (window.showToast) {
                window.showToast('كلمة المرور غير متطابقة', {
                    type: 'error',
                    timeout: 4000,
                    title: 'خطأ في كلمة المرور',
                    icon: 'fas fa-times-circle'
                });
            } else {
                alert('كلمة المرور غير متطابقة');
            }
            return;
        }
        
        if (password.length < 6) {
            if (window.showToast) {
                window.showToast('كلمة المرور يجب أن تكون 6 أحرف على الأقل', {
                    type: 'warning',
                    timeout: 4000,
                    title: 'كلمة مرور ضعيفة',
                    icon: 'fas fa-exclamation-triangle'
                });
            } else {
                alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
            }
            return;
        }
        
        // Add loading state
        if (submitBtn) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
        }
        
        try {
            const response = await fetch(`${window.appConfig.API_BASE_URL}/api/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    username, 
                    email, 
                    password,
                    name: username,
                    phone: ''
                })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                // Success state
                if (submitBtn) {
                    submitBtn.classList.remove('loading');
                    submitBtn.classList.add('success');
                }
                
                if (window.showToast) {
                    window.showToast('يمكنك الآن تسجيل الدخول', {
                        type: 'success',
                        timeout: 5000,
                        title: 'تم إنشاء الحساب بنجاح! 🎉',
                        icon: 'fas fa-check-circle'
                    });
                } else {
                    alert('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول');
                }
                
                // Switch to login form after delay
                setTimeout(() => {
                    switchToLogin();
                    
                    // Pre-fill email in login form
                    const loginEmailInput = document.getElementById('login-email');
                    if (loginEmailInput) {
                        loginEmailInput.value = email;
                    }
                    
                    // Reset signup form and button
                    if (submitBtn) {
                        submitBtn.classList.remove('success');
                        submitBtn.disabled = false;
                    }
                    
                    // Clear signup form
                    usernameInput.value = '';
                    emailInput.value = '';
                    passwordInput.value = '';
                    repasswordInput.value = '';
                }, 1500);
            } else {
                throw new Error((data && (data.message || data.error)) || 'فشل في إنشاء الحساب');
            }
        } catch (error) {
            console.error('خطأ في التسجيل:', error);
            if (window.showToast) {
                window.showToast(error.message || 'حدث خطأ أثناء إنشاء الحساب', {
                    type: 'error',
                    timeout: 5000,
                    title: 'فشل إنشاء الحساب',
                    icon: 'fas fa-times-circle'
                });
            } else {
                alert(error.message || 'حدث خطأ أثناء إنشاء الحساب');
            }
            
            // Remove loading state
            if (submitBtn) {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        }
    }

    // Setup event listeners
    function setupEventListeners() {
        const loginBtn = document.getElementById('login-submit-btn');
        const signupBtn = document.getElementById('signup-submit-btn');
        
        if (loginBtn) {
            loginBtn.addEventListener('click', handleLogin);
        }
        
        if (signupBtn) {
            signupBtn.addEventListener('click', handleSignup);
        }
        
        // Allow Enter key to submit
        const loginEmail = document.getElementById('login-email');
        const loginPassword = document.getElementById('login-password');
        
        if (loginEmail && loginPassword) {
            [loginEmail, loginPassword].forEach(input => {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        handleLogin(e);
                    }
                });
            });
        }
        
        const signupInputs = [
            document.getElementById('username'),
            document.getElementById('signup-email'),
            document.getElementById('signup-password'),
            document.getElementById('repassword')
        ].filter(Boolean);
        
        signupInputs.forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSignup(e);
                }
            });
        });
    }

    // Initialize when DOM is ready
    function init() {
        setupFormSwitching();
        setupEventListeners();
    }

    // Run init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Export functions for inline use if needed
    window.handleLogin = handleLogin;
    window.handleSignup = handleSignup;

})();