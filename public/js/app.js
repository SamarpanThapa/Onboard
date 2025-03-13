document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const togglePasswordBtn = document.querySelector('.toggle-password');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');
    const inputs = loginForm.querySelectorAll('input, select');

    // Form validation feedback
    function showInputError(input, message) {
        const group = input.closest('.input-group');
        group.classList.add('error');
        group.classList.remove('success');
        const feedback = group.querySelector('.input-feedback');
        feedback.textContent = message;
    }

    function showInputSuccess(input) {
        const group = input.closest('.input-group');
        group.classList.remove('error');
        group.classList.add('success');
        const feedback = group.querySelector('.input-feedback');
        feedback.textContent = '';
    }

    function validateInput(input) {
        const value = input.value.trim();
        
        if (input.required && !value) {
            showInputError(input, 'This field is required');
            return false;
        }

        if (input.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                showInputError(input, 'Please enter a valid email address');
                return false;
            }
        }

        if (input.id === 'password' && value) {
            if (value.length < 6) {
                showInputError(input, 'Password must be at least 6 characters');
                return false;
            }
        }

        showInputSuccess(input);
        return true;
    }

    // Real-time validation
    inputs.forEach(input => {
        input.addEventListener('blur', () => validateInput(input));
        input.addEventListener('input', () => {
            if (input.closest('.input-group').classList.contains('error')) {
                validateInput(input);
            }
        });
    });

    // Toggle password visibility
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            const icon = this.querySelector('i');
            icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
        });
    }

    // Navigation links
    const forgotPasswordLink = document.querySelector('.forgot-password-link');
    const createAccountLink = document.querySelector('.create-account-link');

    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'forgot_pw.html';
        });
    }

    if (createAccountLink) {
        createAccountLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'register.html';
        });
    }

    // Form submission
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate all inputs
            let isValid = true;
            inputs.forEach(input => {
                if (!validateInput(input)) {
                    isValid = false;
                }
            });

            if (!isValid) {
                return;
            }

            // Show loading state
            const submitBtn = loginForm.querySelector('.login-btn');
            submitBtn.classList.add('loading');
            
            const role = document.getElementById('role').value;
            
            // Simulate API call delay
            setTimeout(() => {
                submitBtn.classList.remove('loading');
                
                // Navigate based on role
                switch(role) {
                    case 'admin':
                        window.location.href = 'admin_dashboard.html';
                        break;
                    case 'it':
                        window.location.href = 'it_dashboard.html';
                        break;
                    case 'employee':
                        window.location.href = 'emp_dashboard.html';
                        break;
                    default:
                        window.location.href = 'emp_dashboard.html';
                }
            }, 1500);
        });
    }

    // Add smooth transitions when showing error messages
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.add('visible');
        setTimeout(() => {
            errorMessage.classList.remove('visible');
        }, 5000);
    }

    // Add focus effects for input groups
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.closest('.input-group').classList.add('focused');
        });
        
        input.addEventListener('blur', () => {
            input.closest('.input-group').classList.remove('focused');
        });
    });
}); 