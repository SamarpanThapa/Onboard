document.addEventListener('DOMContentLoaded', function() {
  // Check if user is already logged in
  if (api.auth.isAuthenticated()) {
    redirectBasedOnRole();
    return;
  }

  // Get form elements
  const loginForm = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const roleSelect = document.getElementById('role');
  const errorMessage = document.getElementById('error-message');
  const successMessage = document.getElementById('success-message');
  const togglePasswordButtons = document.querySelectorAll('.toggle-password');

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

  // Set up password toggle
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

  // Real-time email validation
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

  // Add event listener for form submission
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      // Clear previous messages
      errorMessage.textContent = '';
      errorMessage.classList.remove('visible');
      successMessage.textContent = '';
      successMessage.classList.remove('visible');
      
      // Get form values
      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();
      const role = roleSelect ? roleSelect.value : null;
      
      // Validate form
      let isValid = true;
      
      if (!email) {
        showInputError(emailInput, 'Email is required');
        isValid = false;
      } else if (!validateEmail(email)) {
        showInputError(emailInput, 'Please enter a valid email address');
        isValid = false;
      } else {
        showInputSuccess(emailInput);
      }
      
      if (!password) {
        showInputError(passwordInput, 'Password is required');
        isValid = false;
      } else {
        showInputSuccess(passwordInput);
      }
      
      if (!isValid) {
        return;
      }
      
      try {
        // Show loading state
        const submitButton = loginForm.querySelector('button[type="submit"]');
        submitButton.classList.add('loading');
        submitButton.disabled = true;
        
        // Call login API
        const response = await api.auth.login(email, password);
        
        // Show success message
        successMessage.textContent = 'Login successful! Redirecting...';
        successMessage.classList.add('visible');
        
        // Redirect based on user role
        setTimeout(() => {
          redirectBasedOnRole();
        }, 1000);
      } catch (error) {
        // Show error message
        errorMessage.textContent = error.message || 'Invalid email or password';
        errorMessage.classList.add('visible');
        
        // Reset button
        submitButton.classList.remove('loading');
        submitButton.disabled = false;
      }
    });
  }
  
  // Function to redirect based on user role
  function redirectBasedOnRole() {
    const role = api.auth.getUserRole();
    
    switch (role) {
      case 'it':
        window.location.href = 'it_dashboard.html';
        break;
      case 'hr':
        window.location.href = 'admin.html';
        break;
      case 'manager':
        window.location.href = 'admin.html';
        break;
      case 'employee':
        window.location.href = 'emp_dashboard.html';
        break;
      default:
        // If role is not recognized, log out and stay on login page
        api.auth.logout();
        break;
    }
  }
});
