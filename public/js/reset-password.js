document.addEventListener('DOMContentLoaded', function() {
    const resetForm = document.getElementById('reset-password-form');
    const loadingContainer = document.getElementById('loading-container');
    const tokenError = document.getElementById('token-error');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const resetTokenInput = document.getElementById('reset-token');
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    
    // Get token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (!token) {
        // No token provided, show error
        loadingContainer.style.display = 'none';
        tokenError.style.display = 'block';
        return;
    }
    
    // Set token in hidden input
    resetTokenInput.value = token;
    
    // Verify token
    verifyToken(token);
    
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
    
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.add('visible');
        successMessage.classList.remove('visible');
    }
    
    function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.classList.add('visible');
        errorMessage.classList.remove('visible');
    }
    
    async function verifyToken(token) {
        try {
            const response = await fetch(`/api/auth/reset-password/${token}`);
            const data = await response.json();
            
            loadingContainer.style.display = 'none';
            
            if (response.ok) {
                // Token is valid, show form
                resetForm.style.display = 'block';
                emailInput.value = data.email;
            } else {
                // Token is invalid, show error
                tokenError.style.display = 'block';
            }
        } catch (error) {
            console.error('Token verification error:', error);
            loadingContainer.style.display = 'none';
            tokenError.style.display = 'block';
        }
    }
    
    // Password visibility toggle
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
    
    // Form submission
    if (resetForm) {
        resetForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Clear previous messages
            errorMessage.textContent = '';
            errorMessage.classList.remove('visible');
            successMessage.textContent = '';
            successMessage.classList.remove('visible');
            
            // Get form values
            const password = passwordInput.value.trim();
            const confirmPassword = confirmPasswordInput.value.trim();
            
            // Validate form
            let isValid = true;
            
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
            
            if (!isValid) {
                return;
            }
            
            // Show loading state
            const submitBtn = resetForm.querySelector('button[type="submit"]');
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
            
            try {
                // Call reset password API
                const response = await fetch(`/api/auth/reset-password/${token}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        password,
                        confirmPassword
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Password reset successful
                    showSuccess('Your password has been reset successfully! Redirecting to login...');
                    
                    // Disable form
                    passwordInput.disabled = true;
                    confirmPasswordInput.disabled = true;
                    submitBtn.disabled = true;
                    
                    // Redirect to login page after delay
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 3000);
                } else {
                    throw new Error(data.message || 'Failed to reset password');
                }
            } catch (error) {
                console.error('Password reset error:', error);
                showError(error.message || 'An error occurred. Please try again later.');
                
                // Reset button state
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        });
    }
}); 