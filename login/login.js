document.addEventListener('DOMContentLoaded', function () {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginForm = document.getElementById('loginForm');
    const showPasswordToggle = document.getElementById('showPasswordToggle');
    const rememberMeCheckbox = document.getElementById('rememberMe');
    const errorMsg = document.getElementById('errorMsg');
    const spinner = document.getElementById('spinner');
    const homeButton = document.getElementById('homeButton');
    const roleButtons = document.querySelectorAll('.role-btn');
    let selectedRole = 'user'; // Default role

    // Add home button functionality
    if (homeButton) {
        homeButton.addEventListener('click', function () {
            window.location.href = '/';
        });
    }

    // Guard: If any element is missing, do not proceed
    if (!emailInput || !passwordInput || !loginForm || !showPasswordToggle || !rememberMeCheckbox || !errorMsg || !spinner) {
        console.error('One or more login elements are missing in the HTML.');
        return;
    }

    // Load saved email if Remember Me was checked
    if (localStorage.getItem('rememberMe') === 'true') {
        emailInput.value = localStorage.getItem('savedEmail') || '';
        rememberMeCheckbox.checked = true;
    }

    // Role button functionality
    roleButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            roleButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.style.background = btn.dataset.role === 'admin' ? '#23272f' : 
                                      btn.dataset.role === 'mechanic' ? '#20c997' : '#23272f';
                btn.style.color = btn.dataset.role === 'admin' ? '#bfaaff' : 
                                 btn.dataset.role === 'mechanic' ? '#fff' : '#bfaaff';
            });
            
            // Add active class to clicked button
            this.classList.add('active');
            this.style.background = 'linear-gradient(90deg,#7e57c2 0%,#20c997 100%)';
            this.style.color = '#fff';
            
            // Update selected role
            selectedRole = this.dataset.role;
        });
    });


    // ===== USER LOGIN =====
    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        errorMsg.textContent = '';
        let valid = true;

        const email = emailInput.value.trim();
        const password = passwordInput.value;
        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            errorMsg.textContent = 'Please enter a valid email address.';
            valid = false;
        } else if (password.length < 6) {
            errorMsg.textContent = 'Password must be at least 6 characters.';
            valid = false;
        }

        if (!valid) return;

        // Remember Me
        if (rememberMeCheckbox.checked) {
            localStorage.setItem('rememberMe', 'true');
            localStorage.setItem('savedEmail', email);
        } else {
            localStorage.removeItem('rememberMe');
            localStorage.removeItem('savedEmail');
        }

        spinner.style.display = 'block';

        fetch('http://127.0.0.1:5000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username: email, password: password, role: selectedRole })
        })
        .then(response => response.json().then(data => ({status: response.status, body: data})))
        .then(({status, body}) => {
            spinner.style.display = 'none';
            if (body.success) {
                // Redirect based on role
                let redirectUrl = '/';
                if (selectedRole === 'admin') {
                    redirectUrl = '/admin_dashboard.html';
                } else if (selectedRole === 'mechanic') {
                    redirectUrl = '/mechanic_dashboard.html';
                }
                setTimeout(() => {
                    window.location.href = redirectUrl;
                }, 500);
            } else {
                errorMsg.textContent = body.message || 'Login failed.';
            }
        })
        .catch(() => {
            spinner.style.display = 'none';
            errorMsg.textContent = 'Server error. Please try again later.';
        });
    });

    // ===== USER SIGNUP =====
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        const signupFormElement = signupForm.querySelector('form');
        if (signupFormElement) {
            signupFormElement.addEventListener('submit', function (e) {
                e.preventDefault();
                errorMsg.textContent = '';

                const inputs = signupFormElement.querySelectorAll('input');
                const fullName = inputs[0]?.value.trim();
                const email = inputs[1]?.value.trim();
                const password = inputs[2]?.value;

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

                fetch('http://127.0.0.1:5000/signup', {
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
                .then(response => response.json().then(data => ({status: response.status, body: data})))
                .then(({status, body}) => {
                    spinner.style.display = 'none';
                    if (body.success) {
                        errorMsg.textContent = 'Account created! Redirecting...';
                        errorMsg.style.color = '#20c997';
                        setTimeout(() => {
                            window.location.href = '/';
                        }, 1000);
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
    }

    // ===== ADMIN LOGIN =====
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
        const adminFormElement = adminLoginForm.querySelector('form');
        if (adminFormElement) {
            adminFormElement.addEventListener('submit', function (e) {
                e.preventDefault();
                errorMsg.textContent = '';

                const inputs = adminFormElement.querySelectorAll('input');
                const email = inputs[0]?.value.trim();
                const password = inputs[1]?.value;

                if (!email || !password) {
                    errorMsg.textContent = 'Email and password are required!';
                    return;
                }

                spinner.style.display = 'block';

                fetch('http://127.0.0.1:5000/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ username: email, password: password, role: 'admin' })
                })
                .then(response => response.json().then(data => ({status: response.status, body: data})))
                .then(({status, body}) => {
                    spinner.style.display = 'none';
                    if (body.success) {
                        // Redirect to admin dashboard
                        setTimeout(() => {
                            window.location.href = '/admin_dashboard.html';
                        }, 500);
                    } else {
                        errorMsg.textContent = body.message || 'Login failed.';
                    }
                })
                .catch(() => {
                    spinner.style.display = 'none';
                    errorMsg.textContent = 'Server error. Please try again later.';
                });
            });
        }
    }

    // ===== MECHANIC LOGIN =====
    const mechanicLoginForm = document.getElementById('mechanicLoginForm');
    if (mechanicLoginForm) {
        const mechanicFormElement = mechanicLoginForm.querySelector('form');
        if (mechanicFormElement) {
            mechanicFormElement.addEventListener('submit', function (e) {
                e.preventDefault();
                errorMsg.textContent = '';

                const inputs = mechanicFormElement.querySelectorAll('input');
                const email = inputs[0]?.value.trim();
                const password = inputs[1]?.value;

                if (!email || !password) {
                    errorMsg.textContent = 'Email and password are required!';
                    return;
                }

                spinner.style.display = 'block';

                fetch('http://127.0.0.1:5000/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ username: email, password: password, role: 'mechanic' })
                })
                .then(response => response.json().then(data => ({status: response.status, body: data})))
                .then(({status, body}) => {
                    spinner.style.display = 'none';
                    if (body.success) {
                        setTimeout(() => {
                            window.location.href = '/mechanic_dashboard_full.html';
                        }, 500);
                    } else {
                        errorMsg.textContent = body.message || 'Login failed.';
                    }
                })
                .catch(() => {
                    spinner.style.display = 'none';
                    errorMsg.textContent = 'Server error. Please try again later.';
                });
            });
        }
    }

    // ===== MECHANIC SIGNUP =====
    const mechanicSignupForm = document.getElementById('mechanicSignupForm');
    if (mechanicSignupForm) {
        const mechanicFormElement = mechanicSignupForm.querySelector('form');
        if (mechanicFormElement) {
            mechanicFormElement.addEventListener('submit', function (e) {
                e.preventDefault();
                errorMsg.textContent = '';

                const inputs = mechanicFormElement.querySelectorAll('input');
                const fullName = inputs[0]?.value.trim();
                const workshopName = inputs[1]?.value.trim();
                const email = inputs[2]?.value.trim();
                const password = inputs[3]?.value;

                if (!fullName || !workshopName || !email || !password) {
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

                fetch('http://127.0.0.1:5000/mechanic/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        username: email,
                        email: email,
                        password: password,
                        full_name: fullName,
                        workshop_name: workshopName
                    })
                })
                .then(response => response.json().then(data => ({status: response.status, body: data})))
                .then(({status, body}) => {
                    spinner.style.display = 'none';
                    if (body.success) {
                        errorMsg.textContent = 'Workshop registered! Redirecting...';
                        errorMsg.style.color = '#20c997';
                        setTimeout(() => {
                            window.location.href = '/login/mechanic_dashboard.html';
                        }, 1000);
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
    }

    // Password toggle for all forms
    document.querySelectorAll('.auth-eye').forEach(eye => {
        eye.onclick = function() {
            const input = eye.previousElementSibling;
            if (input && input.type === 'password') {
                input.type = 'text';
                eye.textContent = '�';
            } else if (input) {
                input.type = 'password';
                eye.textContent = '👁️';
            }
        };
    });
});