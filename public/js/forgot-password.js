document.addEventListener('DOMContentLoaded', function() {
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const emailInput = document.getElementById('email');
    const backToLoginLink = document.querySelector('.back-to-login-link');

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

    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
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

    // Back to login navigation
    if (backToLoginLink) {
        backToLoginLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'index.html';
        });
    }

    // Real-time email validation
    emailInput.addEventListener('input', function() {
        const email = this.value.trim();
        if (email && !validateEmail(email)) {
            showInputError(this, 'Please enter a valid email address');
        } else {
            showInputSuccess(this);
        }
    });

    // Form submission
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = emailInput.value.trim();
            
            // Validate email
            if (!email) {
                showInputError(emailInput, 'Email is required');
                return;
            }
            
            if (!validateEmail(email)) {
                showInputError(emailInput, 'Please enter a valid email address');
                return;
            }

            // Show loading state
            const submitBtn = forgotPasswordForm.querySelector('.login-btn');
            submitBtn.classList.add('loading');
            
            // Simulate API call
            setTimeout(() => {
                submitBtn.classList.remove('loading');
                showSuccess('Password reset instructions have been sent to your email address. Please check your inbox.');
                
                // Clear form
                emailInput.value = '';
                showInputSuccess(emailInput);
                
                // Disable form temporarily
                submitBtn.disabled = true;
                
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 3000);
            }, 1500);
        });
    }
}); 