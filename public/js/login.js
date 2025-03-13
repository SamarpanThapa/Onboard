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

  // Add event listener for form submission
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      // Clear previous messages
      errorMessage.textContent = '';
      errorMessage.style.display = 'none';
      successMessage.textContent = '';
      successMessage.style.display = 'none';
      
      // Get form values
      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();
      const role = roleSelect ? roleSelect.value : null;
      
      // Validate form
      if (!email || !password) {
        errorMessage.textContent = 'Please enter both email and password';
        errorMessage.style.display = 'block';
        return;
      }
      
      try {
        // Show loading state
        const submitButton = loginForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Logging in...';
        
        // Call login API
        const response = await api.auth.login(email, password);
        
        // Show success message
        successMessage.textContent = 'Login successful! Redirecting...';
        successMessage.style.display = 'block';
        
        // Redirect based on user role
        setTimeout(() => {
          redirectBasedOnRole();
        }, 1000);
      } catch (error) {
        // Show error message
        errorMessage.textContent = error.message || 'Invalid email or password';
        errorMessage.style.display = 'block';
        
        // Reset button
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
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
