document.addEventListener('DOMContentLoaded', function() {
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const emailInput = document.getElementById('email');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const backToLoginLink = document.querySelector('.back-to-login-link');

    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function showInputError(input, message) {
        const group = input.closest('.input-group');
        group.classList.add('error');
        const feedback = group.querySelector('.input-feedback');
        if (feedback) {
            feedback.textContent = message;
        }
    }

    function showInputSuccess(input) {
        const group = input.closest('.input-group');
        group.classList.remove('error');
        const feedback = group.querySelector('.input-feedback');
        if (feedback) {
            feedback.textContent = '';
        }
    }

    // Back to login navigation
    if (backToLoginLink) {
        backToLoginLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'index.html';
        });
    }

    // Email validation on input
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

    // Create a preview link element
    function createPreviewLink(url) {
        // Create container
        const previewContainer = document.createElement('div');
        previewContainer.className = 'preview-container';
        previewContainer.style.marginTop = '15px';
        previewContainer.style.padding = '10px';
        previewContainer.style.backgroundColor = '#f0f8ff';
        previewContainer.style.borderRadius = '5px';
        previewContainer.style.borderLeft = '3px solid #1db954';
        
        // Create heading
        const heading = document.createElement('h4');
        heading.textContent = 'Development Mode';
        heading.style.margin = '0 0 10px 0';
        heading.style.color = '#333';
        
        // Create info text
        const infoText = document.createElement('p');
        infoText.textContent = 'View the password reset email at:';
        infoText.style.margin = '0 0 10px 0';
        infoText.style.fontSize = '14px';
        
        // Create link
        const link = document.createElement('a');
        link.href = url;
        link.textContent = 'Open Email Preview';
        link.target = '_blank';
        link.style.color = '#1db954';
        link.style.textDecoration = 'none';
        link.style.fontWeight = 'bold';
        link.style.display = 'inline-block';
        link.style.padding = '5px 10px';
        link.style.border = '1px solid #1db954';
        link.style.borderRadius = '3px';
        
        // Assemble the container
        previewContainer.appendChild(heading);
        previewContainer.appendChild(infoText);
        previewContainer.appendChild(link);
        
        return previewContainer;
    }

    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Clear previous messages
            if (errorMessage) {
                errorMessage.textContent = '';
                errorMessage.style.display = 'none';
            }
            if (successMessage) {
                successMessage.textContent = '';
                successMessage.style.display = 'none';
            }
            
            // Remove any existing preview link
            const existingPreview = document.querySelector('.preview-container');
            if (existingPreview) {
                existingPreview.remove();
            }
            
            const email = emailInput.value.trim();
            
            // Validate form
            let isValid = true;
            if (!email) {
                showInputError(emailInput, 'Email is required');
                isValid = false;
            } else if (!validateEmail(email)) {
                showInputError(emailInput, 'Please enter a valid email address');
                isValid = false;
            }
            
            if (!isValid) {
                return;
            }
            
            // Show loading state
            const submitButton = forgotPasswordForm.querySelector('button[type="submit"]');
            submitButton.classList.add('loading');
            submitButton.disabled = true;
            
            try {
                console.log('Sending password reset request for:', email);
                
                const response = await fetch('/api/auth/forgot-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email })
                });
                
                const data = await response.json();
                console.log('Forgot password response:', data);
                
                // Always remove loading state
                submitButton.classList.remove('loading');
                submitButton.disabled = false;
                
                if (!response.ok) {
                    // Show error message
                    if (errorMessage) {
                        errorMessage.textContent = data.message || 'Failed to send reset email. Please try again later.';
                        errorMessage.style.display = 'block';
                    }
                    return;
                }
                
                // Show success message
                if (successMessage) {
                    successMessage.textContent = 'Password reset link sent! Please check your email.';
                    successMessage.style.display = 'block';
                    
                    // If in development mode and there's a preview URL, add it
                    if (data.previewUrl) {
                        const previewLink = createPreviewLink(data.previewUrl);
                        successMessage.after(previewLink);
                    }
                }
                
                // Clear form
                emailInput.value = '';
                
            } catch (error) {
                console.error('Password reset error:', error);
                
                // Always remove loading state
                submitButton.classList.remove('loading');
                submitButton.disabled = false;
                
                // Show error message
                if (errorMessage) {
                    errorMessage.textContent = 'An error occurred. Please try again later.';
                    errorMessage.style.display = 'block';
                }
            }
        });
    }
}); 