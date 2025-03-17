document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    if (api.auth.isAuthenticated()) {
        const role = api.auth.getUserRole();
        if (role === 'it') {
            window.location.href = 'it_dashboard.html';
        } else {
            api.auth.logout(); // Log out if not IT role
        }
        return;
    }

    // Get form elements
    const registerForm = document.getElementById('register-form');
    const fullNameInput = document.getElementById('full-name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const departmentCodeInput = document.getElementById('department-code');
    const companyNameInput = document.getElementById('company-name');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');

    // Input validation functions
    function showInputError(input, message) {
        const group = input.closest('.input-group');
        group.classList.add('error');
        group.classList.remove('success');
        const feedback = group.querySelector('.input-feedback');
        if (feedback) {
            feedback.textContent = message;
        }
    }

    function showInputSuccess(input) {
        const group = input.closest('.input-group');
        group.classList.remove('error');
        group.classList.add('success');
        const feedback = group.querySelector('.input-feedback');
        if (feedback) {
            feedback.textContent = '';
        }
    }

    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Password visibility toggle
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', function() {
            const input = this.closest('.password-input-wrapper').querySelector('input');
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });

    // Real-time field validation
    if (emailInput) {
        emailInput.addEventListener('input', function() {
            const email = this.value.trim();
            if (email && !validateEmail(email)) {
                showInputError(this, 'Please enter a valid email address');
            } else {
                showInputSuccess(this);
            }
        });
    }

    if (fullNameInput) {
        fullNameInput.addEventListener('input', function() {
            const name = this.value.trim();
            if (name && name.length < 2) {
                showInputError(this, 'Name must be at least 2 characters');
            } else if (name) {
                showInputSuccess(this);
            } else {
                showInputError(this, '');
            }
        });
    }

    if (companyNameInput) {
        companyNameInput.addEventListener('input', function() {
            const company = this.value.trim();
            if (company && company.length < 2) {
                showInputError(this, 'Company name must be at least 2 characters');
            } else if (company) {
                showInputSuccess(this);
            } else {
                showInputError(this, '');
            }
        });
    }

    // Password strength meter
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            updatePasswordStrength(this.value);
            validatePasswordMatch();
        });
    }

    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', validatePasswordMatch);
    }

    function validatePasswordMatch() {
        if (confirmPasswordInput.value && passwordInput.value !== confirmPasswordInput.value) {
            showInputError(confirmPasswordInput, 'Passwords do not match');
        } else if (confirmPasswordInput.value) {
            showInputSuccess(confirmPasswordInput);
        }
    }

    function updatePasswordStrength(password) {
        const strengthMeter = document.getElementById('password-strength-meter');
        const strengthText = document.getElementById('password-strength-text');
        
        if (!strengthMeter || !strengthText) return;
        
        // Calculate password strength
        let strength = 0;
        
        // Length check
        if (password.length >= 8) strength += 1;
        
        // Character variety checks
        if (/[a-z]/.test(password)) strength += 1; // lowercase
        if (/[A-Z]/.test(password)) strength += 1; // uppercase
        if (/[0-9]/.test(password)) strength += 1; // numbers
        if (/[^a-zA-Z0-9]/.test(password)) strength += 1; // special characters
        
        // Update the strength meter
        strengthMeter.value = strength;
        
        // Update the strength text
        let strengthLabel = '';
        let strengthColor = '';
        
        switch (strength) {
            case 0:
            case 1:
                strengthLabel = 'Weak';
                strengthColor = '#ff3b30';
                break;
            case 2:
            case 3:
                strengthLabel = 'Moderate';
                strengthColor = '#ff9500';
                break;
            case 4:
            case 5:
                strengthLabel = 'Strong';
                strengthColor = '#34c759';
                break;
        }
        
        strengthText.textContent = strengthLabel;
        strengthText.style.color = strengthColor;
        
        // Show feedback on password field
        if (password && strength < 3) {
            showInputError(passwordInput, 'Password should be stronger (8+ chars, mixed case, numbers, symbols)');
        } else if (password) {
            showInputSuccess(passwordInput);
        }
    }

    // Add event listener for form submission
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Clear previous messages
            errorMessage.textContent = '';
            errorMessage.classList.remove('visible');
            successMessage.textContent = '';
            successMessage.classList.remove('visible');
            
            // Get form values
            const fullName = fullNameInput.value.trim();
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();
            const confirmPassword = confirmPasswordInput.value.trim();
            const departmentCode = departmentCodeInput.value.trim();
            const companyName = companyNameInput.value.trim();
            
            // Validate form
            let isValid = true;
            
            if (!fullName) {
                showInputError(fullNameInput, 'Full name is required');
                isValid = false;
            }
            
            if (!email) {
                showInputError(emailInput, 'Email is required');
                isValid = false;
            } else if (!validateEmail(email)) {
                showInputError(emailInput, 'Please enter a valid email address');
                isValid = false;
            }
            
            if (!password) {
                showInputError(passwordInput, 'Password is required');
                isValid = false;
            } else if (document.getElementById('password-strength-meter').value < 3) {
                showInputError(passwordInput, 'Password is too weak');
                isValid = false;
            }
            
            if (!confirmPassword) {
                showInputError(confirmPasswordInput, 'Please confirm your password');
                isValid = false;
            } else if (password !== confirmPassword) {
                showInputError(confirmPasswordInput, 'Passwords do not match');
                isValid = false;
            }
            
            if (!companyName) {
                showInputError(companyNameInput, 'Company name is required');
                isValid = false;
            }
            
            if (!departmentCode) {
                showInputError(departmentCodeInput, 'Department code is required');
                isValid = false;
            }
            
            if (!isValid) {
                return;
            }
            
            // Validate department code
            try {
                // Show loading state
                const submitButton = registerForm.querySelector('button[type="submit"]');
                submitButton.classList.add('loading');
                submitButton.disabled = true;
                
                const codeVerification = await api.auth.verifyDepartmentCode(departmentCode);
                if (!codeVerification.isValid) {
                    showInputError(departmentCodeInput, 'Invalid department code');
                    submitButton.classList.remove('loading');
                    submitButton.disabled = false;
                    return;
                }
                
                // Prepare registration data
                const registrationData = {
                    fullName,
                    email,
                    password,
                    role: 'it', // IT personnel registration
                    department: 'IT Department',
                    companyName,
                    departmentCode
                };
                
                // Call register API
                const response = await api.auth.register(registrationData);
                
                // Show success message
                successMessage.textContent = 'Account created successfully! Redirecting to login...';
                successMessage.classList.add('visible');
                
                // Redirect to login page after delay
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            } catch (error) {
                // Show error message
                errorMessage.textContent = error.message || 'Error creating account';
                errorMessage.classList.add('visible');
                
                // Reset button
                submitButton.classList.remove('loading');
                submitButton.disabled = false;
            }
        });
    }
}); 