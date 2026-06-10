document.addEventListener('DOMContentLoaded', function () {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginForm = document.getElementById('loginForm');
    const showPasswordToggle = document.getElementById('showPasswordToggle');
    const rememberMeCheckbox = document.getElementById('rememberMe');
    const errorMsg = document.getElementById('errorMsg');
    const spinner = document.getElementById('spinner');
    const homeButton = document.getElementById('homeButton');
    const themeToggle = document.getElementById('pageThemeToggle');
    const menuToggle = document.getElementById('menuToggle');
    const menuClose = document.getElementById('menuClose');
    const menuBackdrop = document.getElementById('menuBackdrop');
    const authSideMenu = document.getElementById('authSideMenu');
    const roleButtons = document.querySelectorAll('.role-btn');
    let selectedRole = 'user';

    function toggleMenu(open) {
        if (!authSideMenu || !menuBackdrop) return;
        authSideMenu.classList.toggle('open', open);
        menuBackdrop.classList.toggle('visible', open);
    }

    if (menuToggle) {
        menuToggle.addEventListener('click', function () {
            toggleMenu(true);
        });
    }

    if (menuClose) {
        menuClose.addEventListener('click', function () {
            toggleMenu(false);
        });
    }

    if (menuBackdrop) {
        menuBackdrop.addEventListener('click', function () {
            toggleMenu(false);
        });
    }

    document.querySelectorAll('.menu-links a').forEach(link => {
        link.addEventListener('click', function () {
            toggleMenu(false);
        });
    });

    function applySavedTheme() {
        const savedTheme = localStorage.getItem('themeMode');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            if (themeToggle) themeToggle.textContent = '☀️ Light Mode';
        } else {
            document.body.classList.remove('dark-mode');
            if (themeToggle) themeToggle.textContent = '🌙 Dark Mode';
        }
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', function () {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('themeMode', isDark ? 'dark' : 'light');
            this.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
        });
    }

    if (homeButton) {
        homeButton.addEventListener('click', function () {
            window.location.href = '/';
        });
    }

    function updateRoleButtonStyles() {
        roleButtons.forEach(btn => {
            const active = btn.dataset.role === selectedRole;
            btn.classList.toggle('active', active);
            if (active) {
                btn.style.background = 'linear-gradient(90deg,#7e57c2 0%,#20c997 100%)';
                btn.style.color = '#fff';
            } else {
                btn.style.background = '#23272f';
                btn.style.color = '#bfaaff';
            }
        });
    }

    function showPanel(role) {
        const userPanel = document.getElementById('authFormPanelUser');
        const adminPanel = document.getElementById('authFormPanelAdmin');
        const mechanicPanel = document.getElementById('authFormPanelMechanic');
        const authSidePanel = document.getElementById('authSidePanel');

        if (userPanel) userPanel.style.display = role === 'user' ? '' : 'none';
        if (adminPanel) adminPanel.style.display = role === 'admin' ? '' : 'none';
        if (mechanicPanel) mechanicPanel.style.display = role === 'mechanic' ? '' : 'none';

        if (authSidePanel) {
            if (role === 'admin') {
                authSidePanel.style.background = 'linear-gradient(135deg,#23272f 60%,#7e57c2 100%)';
                authSidePanel.style.color = '#fff';
            } else if (role === 'mechanic') {
                authSidePanel.style.background = 'linear-gradient(135deg,#20c997 60%,#7e57c2 100%)';
                authSidePanel.style.color = '#fff';
            } else {
                authSidePanel.style.background = '';
                authSidePanel.style.color = '';
            }
        }

        updateRoleButtonStyles();
    }

    function syncLanguageSelector() {
        const languageSelect = document.getElementById('languageSelect');
        if (!languageSelect) return;
        if (window.i18n) {
            languageSelect.value = window.i18n.getLanguage();
        }
        languageSelect.addEventListener('change', function () {
            if (window.i18n) {
                window.i18n.setLanguage(this.value);
            }
        });
    }

    function showLoginForm() {
        selectedRole = 'user';
        showPanel(selectedRole);
        document.getElementById('loginPanel')?.classList.add('active');
        document.getElementById('signupPanel')?.classList.remove('active');
        document.getElementById('loginSide')?.style.setProperty('display', '');
        document.getElementById('signupSide')?.style.setProperty('display', 'none');
    }

    function showSignupForm() {
        selectedRole = 'user';
        showPanel(selectedRole);
        document.getElementById('loginPanel')?.classList.remove('active');
        document.getElementById('signupPanel')?.classList.add('active');
        document.getElementById('loginSide')?.style.setProperty('display', 'none');
        document.getElementById('signupSide')?.style.setProperty('display', '');
    }

    function maybeActivateSignupMode() {
        const pathname = window.location.pathname.toLowerCase();
        const query = window.location.search.toLowerCase();
        if (pathname.endsWith('/signup') || pathname.endsWith('/signup.html') || query.includes('mode=signup')) {
            selectedRole = 'user';
            showPanel(selectedRole);
            showSignupForm();
        }
    }

    roleButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (!this.dataset.role) return;
            selectedRole = this.dataset.role;
            showPanel(selectedRole);
        });
    });

    const showSignupBtn = document.getElementById('showSignup');
    const showLoginBtn = document.getElementById('showLogin');
    const mechanicSignupButton = document.getElementById('showMechanicSignup');
    const mechanicLoginButton = document.getElementById('showMechanicLogin');

    if (showSignupBtn) showSignupBtn.addEventListener('click', showSignupForm);
    if (showLoginBtn) showLoginBtn.addEventListener('click', showLoginForm);

    document.querySelectorAll('.side-nav-btn[data-target]').forEach(btn => {
        const target = btn.dataset.target;
        if (!target) return;
        btn.addEventListener('click', () => {
            if (target === 'login') {
                showLoginForm();
            } else if (target === 'signup') {
                showSignupForm();
            } else if (target === 'mechanic') {
                selectedRole = 'mechanic';
                showPanel('mechanic');
            } else if (target === 'admin') {
                selectedRole = 'admin';
                showPanel('admin');
            }
        });
    });

    const showSignupInlineButton = document.getElementById('showSignupInline');
    const showLoginFromSignupButton = document.getElementById('showLoginFromSignup');
    if (showSignupInlineButton) {
        showSignupInlineButton.addEventListener('click', function () {
            showSignupForm();
            selectedRole = 'user';
            showPanel(selectedRole);
        });
    }
    if (showLoginFromSignupButton) {
        showLoginFromSignupButton.addEventListener('click', function () {
            showLoginForm();
            selectedRole = 'user';
            showPanel(selectedRole);
        });
    }

    if (mechanicSignupButton && mechanicLoginButton) {
        mechanicSignupButton.addEventListener('click', function () {
            document.getElementById('mechanicPanel')?.classList.remove('active');
            document.getElementById('mechanicSignupForm')?.classList.add('active');
            this.style.display = 'none';
            mechanicLoginButton.style.display = '';
        });

        mechanicLoginButton.addEventListener('click', function () {
            document.getElementById('mechanicSignupForm')?.classList.remove('active');
            document.getElementById('mechanicPanel')?.classList.add('active');
            this.style.display = 'none';
            mechanicSignupButton.style.display = '';
        });
    }

    document.querySelectorAll('.auth-eye').forEach(eye => {
        eye.addEventListener('click', function () {
            const input = eye.previousElementSibling;
            if (!input) return;
            input.type = input.type === 'password' ? 'text' : 'password';
        });
    });

    applySavedTheme();
    showPanel(selectedRole);
    syncLanguageSelector();
    maybeActivateSignupMode();

    if (localStorage.getItem('rememberMe') === 'true') {
        emailInput.value = localStorage.getItem('savedEmail') || '';
        rememberMeCheckbox.checked = true;
    }

    const adminLoginForm = document.getElementById('adminLoginForm');
    const mechanicLoginForm = document.getElementById('mechanicLoginForm');

    function handleLoginSubmission(emailField, passwordField, role) {
        if (!errorMsg || !spinner) return;
        errorMsg.style.color = 'red';
        errorMsg.textContent = '';

        const email = emailField.value.trim();
        const password = passwordField.value;
        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            errorMsg.textContent = 'Please enter a valid email address.';
            return;
        }
        if (password.length < 6) {
            errorMsg.textContent = 'Password must be at least 6 characters.';
            return;
        }

        if (rememberMeCheckbox.checked) {
            localStorage.setItem('rememberMe', 'true');
            localStorage.setItem('savedEmail', email);
        } else {
            localStorage.removeItem('rememberMe');
            localStorage.removeItem('savedEmail');
        }

        spinner.style.display = 'block';
        fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username: email, password: password, role: role })
        })
            .then(response => response.json().then(data => ({ status: response.status, body: data })))
            .then(({ body }) => {
                spinner.style.display = 'none';
                if (body.success) {
                    let redirectUrl = '/';
                    if (role === 'admin') redirectUrl = '/admin_dashboard.html';
                    if (role === 'mechanic') redirectUrl = '/mechanic_dashboard.html';
                    setTimeout(() => { window.location.href = redirectUrl; }, 300);
                } else {
                    errorMsg.textContent = body.message || 'Login failed.';
                }
            })
            .catch(() => {
                spinner.style.display = 'none';
                errorMsg.textContent = 'Server error. Please try again later.';
            });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            handleLoginSubmission(emailInput, passwordInput, selectedRole);
        });
    }

    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const adminEmailInput = document.getElementById('adminEmail');
            const adminPasswordInput = document.getElementById('adminPassword');
            if (adminEmailInput && adminPasswordInput) {
                handleLoginSubmission(adminEmailInput, adminPasswordInput, 'admin');
            }
        });
    }

    if (mechanicLoginForm) {
        mechanicLoginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const mechanicEmailInput = document.getElementById('mechanicEmail');
            const mechanicPasswordInput = document.getElementById('mechanicPassword');
            if (mechanicEmailInput && mechanicPasswordInput) {
                handleLoginSubmission(mechanicEmailInput, mechanicPasswordInput, 'mechanic');
            }
        });
    }

    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!errorMsg || !spinner) return;
            errorMsg.style.color = 'red';
            errorMsg.textContent = '';

            const fullName = document.getElementById('signupFullName')?.value.trim();
            const email = document.getElementById('signupEmail')?.value.trim();
            const password = document.getElementById('signupPassword')?.value;

            if (!fullName || !email || !password) {
                errorMsg.textContent = 'All fields are required!';
                return;
            }
            if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                errorMsg.textContent = 'Please enter a valid email address.';
                return;
            }
            if (password.length < 6) {
                errorMsg.textContent = 'Password must be at least 6 characters.';
                return;
            }

            spinner.style.display = 'block';
            fetch('/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    username: email,
                    email: email,
                    password: password,
                    full_name: fullName
                })
            })
                .then(response => response.json().then(data => ({ status: response.status, body: data })))
                .then(({ body }) => {
                    spinner.style.display = 'none';
                    if (body.success) {
                        errorMsg.textContent = 'Account created! Redirecting...';
                        errorMsg.style.color = '#20c997';
                        setTimeout(() => { window.location.href = '/'; }, 1000);
                    } else {
                        errorMsg.textContent = body.message || 'Signup failed.';
                    }
                })
                .catch(() => {
                    spinner.style.display = 'none';
                    errorMsg.textContent = 'Server error. Please try again later.';
                });
        });
    }

});
