document.addEventListener('DOMContentLoaded', function() {
  // Flag to prevent multiple form submissions
  let isSubmitting = false;
  
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
      
      // Prevent multiple submissions
      if (isSubmitting) {
        console.log('Form submission already in progress');
        return;
      }
      
      // Set submission flag
      isSubmitting = true;
      
      // Clear previous messages
      errorMessage.textContent = '';
      errorMessage.classList.remove('visible');
      successMessage.textContent = '';
      successMessage.classList.remove('visible');
      
      // Get form values
      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();
      const role = roleSelect.value.trim();
      
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
        isSubmitting = false;
        return;
      }
      
      try {
        // Show loading state
        const submitButton = loginForm.querySelector('button[type="submit"]');
        submitButton.classList.add('loading');
        submitButton.disabled = true;
        
        // Call login API with role
        const response = await api.auth.login(email, password, role);
        
        // Show success message
        successMessage.textContent = 'Login successful! Redirecting...';
        successMessage.classList.add('visible');
        
        // Create a safe redirect function with navigation count
        const safeRedirect = (url) => {
          console.log(`Redirecting to: ${url}`);
          // Use replace instead of href to avoid browser history issues
          window.location.replace(url);
        };
        
        // Check if first time login
        if (response.user && response.user.isFirstLogin) {
          // Store user data in localStorage for the welcome page
          localStorage.setItem('welcomeUser', JSON.stringify({
            name: response.user.firstName || response.user.name.split(' ')[0] || 'New Employee',
            role: response.user.role,
            isFirstLogin: true
          }));
          
          // Redirect to welcome page
          setTimeout(() => {
            safeRedirect('welcome.html');
          }, 1000);
        } else if (response.user && response.user.redirectUrl) {
          // Use the redirect URL provided by the server
          setTimeout(() => {
            safeRedirect(response.user.redirectUrl);
          }, 1000);
        } else {
          // Fallback to local role-based redirection
          setTimeout(() => {
            redirectBasedOnRole();
          }, 1000);
        }
      } catch (error) {
        // Show error message
        errorMessage.textContent = error.message || 'Invalid email or password';
        errorMessage.classList.add('visible');
        
        // Reset button
        const submitButton = loginForm.querySelector('button[type="submit"]');
        submitButton.classList.remove('loading');
        submitButton.disabled = false;
        
        // Reset submission flag
        isSubmitting = false;
      }
    });
  }
  
  // Function to redirect based on user role
  function redirectBasedOnRole() {
    const userData = api.auth.getUserData();
    const role = userData.role;
    
    // If server provided a redirect URL, use that
    if (userData.redirectUrl) {
      safeRedirect(userData.redirectUrl);
      return;
    }

    let targetUrl = 'index.html'; // Default fallback
    
    // Otherwise, determine based on role
    switch (role) {
      case 'it_admin':
        targetUrl = 'it_dashboard.html';
        break;
      case 'hr_admin':
        targetUrl = 'admin.html';
        break;
      case 'department_admin':
        targetUrl = 'admin.html';
        break;
      case 'employee':
        // Check onboarding status
        const onboardingStatus = userData.onboardingStatus;
        if (onboardingStatus === 'not_started' || onboardingStatus === 'in_progress') {
          targetUrl = 'onboarding.html';
        } else {
          targetUrl = 'emp_dashboard.html';
        }
        break;
      default:
        // If role is not recognized, log out and stay on login page
        api.auth.logout();
        targetUrl = 'index.html';
        break;
    }
    
    console.log(`Redirecting to: ${targetUrl} based on role: ${role}`);
    // Use replace instead of href to avoid browser history issues
    window.location.replace(targetUrl);
  }
  
  // Safe redirect function
  function safeRedirect(url) {
    console.log(`Redirecting to: ${url}`);
    // Use replace instead of href to avoid browser history issues
    window.location.replace(url);
  }
});
