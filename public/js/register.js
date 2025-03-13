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

    // Password visibility toggle
    const togglePassword = document.querySelectorAll('.toggle-password');
    togglePassword.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            this.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        });
    });

    // Password strength meter
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            updatePasswordStrength(this.value);
        });
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
        strengthMeter.style.accentColor = strengthColor;
    }

    // Add event listener for form submission
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Clear previous messages
            errorMessage.textContent = '';
            errorMessage.style.display = 'none';
            successMessage.textContent = '';
            successMessage.style.display = 'none';
            
            // Get form values
            const fullName = fullNameInput.value.trim();
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();
            const confirmPassword = confirmPasswordInput.value.trim();
            const departmentCode = departmentCodeInput.value.trim();
            const companyName = companyNameInput.value.trim();
            
            // Validate form
            if (!fullName || !email || !password || !confirmPassword || !departmentCode || !companyName) {
                errorMessage.textContent = 'Please fill in all required fields';
                errorMessage.style.display = 'block';
                return;
            }
            
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                errorMessage.textContent = 'Please enter a valid email address';
                errorMessage.style.display = 'block';
                return;
            }
            
            // Validate password match
            if (password !== confirmPassword) {
                errorMessage.textContent = 'Passwords do not match';
                errorMessage.style.display = 'block';
                return;
            }
            
            // Validate password strength
            const passwordStrength = document.getElementById('password-strength-meter').value;
            if (passwordStrength < 3) {
                errorMessage.textContent = 'Password is too weak. Please use a stronger password.';
                errorMessage.style.display = 'block';
                return;
            }
            
            // Validate department code
            try {
                const codeVerification = await api.auth.verifyDepartmentCode(departmentCode);
                if (!codeVerification.isValid) {
                    errorMessage.textContent = 'Invalid department code';
                    errorMessage.style.display = 'block';
                    return;
                }
            } catch (error) {
                errorMessage.textContent = error.message || 'Error verifying department code';
                errorMessage.style.display = 'block';
                return;
            }
            
            try {
                // Show loading state
                const submitButton = registerForm.querySelector('button[type="submit"]');
                const originalButtonText = submitButton.textContent;
                submitButton.disabled = true;
                submitButton.textContent = 'Creating Account...';
                
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
                successMessage.style.display = 'block';
                
                // Redirect to login page after delay
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            } catch (error) {
                // Show error message
                errorMessage.textContent = error.message || 'Error creating account';
                errorMessage.style.display = 'block';
                
                // Reset button
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
        });
    }
}); 