// Login page JavaScript functionality
document.addEventListener('DOMContentLoaded', function() {
    // Form switching functionality
    const showLoginBtn = document.getElementById('showLoginBtn');
    const showRegisterBtn = document.getElementById('showRegisterBtn');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    // Initially show login form
    loginForm.classList.add('active');

    // Switch to login form
    showLoginBtn.addEventListener('click', function() {
        showLoginBtn.classList.add('active');
        showRegisterBtn.classList.remove('active');
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
    });

    // Switch to register form
    showRegisterBtn.addEventListener('click', function() {
        showRegisterBtn.classList.add('active');
        showLoginBtn.classList.remove('active');
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
    });

    // Password toggle functionality
    const toggleLoginPassword = document.getElementById('toggleLoginPassword');
    const toggleRegisterPassword = document.getElementById('toggleRegisterPassword');
    const loginPassword = document.getElementById('loginPassword');
    const registerPassword = document.getElementById('registerPassword');

    toggleLoginPassword.addEventListener('click', function() {
        togglePasswordVisibility(loginPassword, this);
    });

    toggleRegisterPassword.addEventListener('click', function() {
        togglePasswordVisibility(registerPassword, this);
    });

    function togglePasswordVisibility(passwordField, toggleBtn) {
        if (passwordField.type === 'password') {
            passwordField.type = 'text';
            toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
        } else {
            passwordField.type = 'password';
            toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
        }
    }

    // Password strength indicator
    registerPassword.addEventListener('input', function() {
        updatePasswordStrength(this.value);
    });

    function updatePasswordStrength(password) {
        const container = document.getElementById('passwordStrengthContainer');
        if (!container) return;

        let strength = 0;
        let feedback = [];

        if (password.length >= 8) strength++;
        else feedback.push('At least 8 characters');

        if (/[a-z]/.test(password)) strength++;
        else feedback.push('Lowercase letter');

        if (/[A-Z]/.test(password)) strength++;
        else feedback.push('Uppercase letter');

        if (/[0-9]/.test(password)) strength++;
        else feedback.push('Number');

        if (/[^A-Za-z0-9]/.test(password)) strength++;
        else feedback.push('Special character');

        let strengthText = '';
        let strengthClass = '';
        let progressWidth = '0%';

        switch(strength) {
            case 0:
            case 1:
                strengthText = 'Very Weak';
                strengthClass = 'bg-danger';
                progressWidth = '20%';
                break;
            case 2:
                strengthText = 'Weak';
                strengthClass = 'bg-warning';
                progressWidth = '40%';
                break;
            case 3:
                strengthText = 'Fair';
                strengthClass = 'bg-info';
                progressWidth = '60%';
                break;
            case 4:
                strengthText = 'Good';
                strengthClass = 'bg-primary';
                progressWidth = '80%';
                break;
            case 5:
                strengthText = 'Strong';
                strengthClass = 'bg-success';
                progressWidth = '100%';
                break;
        }

        container.innerHTML = `
            <div class="password-strength">
                <small class="text-muted">Password Strength: <strong class="text-${strengthClass.split('-')[1]}">${strengthText}</strong></small>
                <div class="progress mt-1">
                    <div class="progress-bar ${strengthClass}" style="width: ${progressWidth}"></div>
                </div>
                ${feedback.length > 0 ? '<small class="text-muted">Missing: ' + feedback.join(', ') + '</small>' : ''}
            </div>
        `;
    }

    // Login functionality
    const loginBtn = document.getElementById('loginBtn');
    loginBtn.addEventListener('click', async function() {
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!username || !password) {
            showAlert('Please enter both username and password', 'danger');
            return;
        }

        try {
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Logging in...';

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                showAlert('Login successful! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = '/system/dashboard';
                }, 1000);
            } else {
                showAlert(data.error || 'Login failed', 'danger');
            }
        } catch (error) {
            console.error('Login error:', error);
            showAlert('Network error. Please try again.', 'danger');
        } finally {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i> Login';
        }
    });

    // Registration functionality
    const registerBtn = document.getElementById('registerBtn');
    registerBtn.addEventListener('click', async function() {
        const familyName = document.getElementById('familyName').value.trim();
        const headOfFamily = document.getElementById('headOfFamily').value.trim();
        const phoneNumber = document.getElementById('phoneNumber').value.trim();
        const email = document.getElementById('email').value.trim();
        const username = document.getElementById('registerUsername').value.trim();
        const password = document.getElementById('registerPassword').value;
        const location = document.getElementById('location').value;
        const agreeTerms = document.getElementById('agreeTerms').checked;

        // Validation
        if (!familyName || !headOfFamily || !phoneNumber || !username || !password || !location) {
            showAlert('Please fill in all required fields', 'danger');
            return;
        }

        if (!agreeTerms) {
            showAlert('Please agree to the Terms and Conditions', 'danger');
            return;
        }

        // Phone number validation (Rwanda format)
        const phoneRegex = /^(\+250|0)[7-9][0-9]{8}$/;
        if (!phoneRegex.test(phoneNumber)) {
            showAlert('Please enter a valid Rwanda phone number', 'danger');
            return;
        }

        // Username validation
        if (username.length < 3) {
            showAlert('Username must be at least 3 characters long', 'danger');
            return;
        }

        // Password strength validation
        if (password.length < 8) {
            showAlert('Password must be at least 8 characters long', 'danger');
            return;
        }

        try {
            registerBtn.disabled = true;
            registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Registering...';

            const response = await fetch('/api/families', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    family_name: familyName,
                    head_of_family: headOfFamily,
                    phone_number: phoneNumber,
                    email: email || null,
                    username: username,
                    password: password,
                    sector: location
                })
            });

            const data = await response.json();

            if (response.ok) {
                showAlert('Registration successful! You can now login.', 'success');
                // Switch to login form after successful registration
                setTimeout(() => {
                    showLoginBtn.click();
                    // Clear registration form
                    document.getElementById('familyName').value = '';
                    document.getElementById('headOfFamily').value = '';
                    document.getElementById('phoneNumber').value = '';
                    document.getElementById('email').value = '';
                    document.getElementById('registerUsername').value = '';
                    document.getElementById('registerPassword').value = '';
                    document.getElementById('location').value = '';
                    document.getElementById('agreeTerms').checked = false;
                }, 2000);
            } else {
                showAlert(data.error || 'Registration failed', 'danger');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showAlert('Network error. Please try again.', 'danger');
        } finally {
            registerBtn.disabled = false;
            registerBtn.innerHTML = '<i class="fas fa-user-plus me-2"></i> Register Family';
        }
    });

    // Enter key support for forms
    document.getElementById('loginUsername').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') document.getElementById('loginPassword').focus();
    });

    document.getElementById('loginPassword').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') loginBtn.click();
    });

    document.getElementById('registerPassword').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') registerBtn.click();
    });

    // Alert function
    function showAlert(message, type) {
        const alertContainer = document.getElementById('alertContainer');
        const alertClass = `alert alert-${type}`;
        alertContainer.innerHTML = `<div class="${alertClass}" role="alert">${message}</div>`;

        // Auto-hide success alerts after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                alertContainer.innerHTML = '';
            }, 5000);
        }
    }

    // Check URL parameters for form switching
    const urlParams = new URLSearchParams(window.location.search);
    const formType = urlParams.get('type');

    if (formType === 'register') {
        showRegisterBtn.click();
    }

    // Terms link handler
    const termsLink = document.getElementById('termsLink');
    if (termsLink) {
        termsLink.addEventListener('click', function(e) {
            e.preventDefault();
            showAlert('Terms and Conditions: By registering, you agree to participate in the Duhigure mu Miryango program and follow the family performance contract guidelines.', 'info');
        });
    }

    // Forgot password handler
    const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
    if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener('click', function() {
            showAlert('Password reset functionality will be available soon. Please contact your sector administrator for assistance.', 'info');
        });
    }
});
