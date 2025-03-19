document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    if (api.auth.isAuthenticated()) {
        const role = api.auth.getUserRole();
        if (role === 'it_admin') {
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
    const userRoleSelect = document.getElementById('user-role');
    const registerButton = document.getElementById('register-btn');
    const registerTitle = document.getElementById('register-title');
    const registerSubtitle = document.getElementById('register-subtitle');
    const registrationTagline = document.getElementById('registration-tagline');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');

    // Role specific UI updates
    if (userRoleSelect) {
        userRoleSelect.addEventListener('change', function() {
            updateFormForRole(this.value);
        });
    }

    // Check URL parameters for pre-selected role
    function checkUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const role = urlParams.get('role');
        
        if (role && userRoleSelect) {
            // Set the value if it exists in the options
            const options = userRoleSelect.options;
            for (let i = 0; i < options.length; i++) {
                if (options[i].value === role) {
                    userRoleSelect.value = role;
                    updateFormForRole(role);
                    break;
                }
            }
        }
    }
    
    // Call on page load
    checkUrlParameters();

    function updateFormForRole(role) {
        // Update title and subtitle based on role
        if (registerTitle && registerSubtitle && registrationTagline) {
            switch (role) {
                case 'it_admin':
                    registerTitle.textContent = 'Create IT Admin Account';
                    registerSubtitle.textContent = 'Register as an IT administrator to manage company systems';
                    registrationTagline.textContent = 'IT Department Registration';
                    registerButton.querySelector('.btn-text').textContent = 'Create IT Admin Account';
                    registerButton.querySelector('i').className = 'fas fa-user-shield';
                    break;
                case 'hr_admin':
                    registerTitle.textContent = 'Create HR Admin Account';
                    registerSubtitle.textContent = 'Register as an HR administrator to manage company onboarding';
                    registrationTagline.textContent = 'HR Department Registration';
                    registerButton.querySelector('.btn-text').textContent = 'Create HR Admin Account';
                    registerButton.querySelector('i').className = 'fas fa-user-tie';
                    break;
                case 'employee':
                    registerTitle.textContent = 'Create Employee Account';
                    registerSubtitle.textContent = 'Register as an employee to access company systems';
                    registrationTagline.textContent = 'Employee Registration';
                    registerButton.querySelector('.btn-text').textContent = 'Create Employee Account';
                    registerButton.querySelector('i').className = 'fas fa-user';
                    break;
                default:
                    registerTitle.textContent = 'Create Account';
                    registerSubtitle.textContent = 'Register to access the company\'s onboarding system';
                    registrationTagline.textContent = 'Account Registration';
                    registerButton.querySelector('.btn-text').textContent = 'Create Account';
                    registerButton.querySelector('i').className = 'fas fa-user-plus';
            }
        }
    }

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
            if (errorMessage) {
                errorMessage.textContent = '';
                errorMessage.style.display = 'none';
            }
            if (successMessage) {
                successMessage.textContent = '';
                successMessage.style.display = 'none';
            }
            
            // Get form values
            const fullName = fullNameInput.value.trim();
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();
            const confirmPassword = confirmPasswordInput.value.trim();
            const departmentCode = departmentCodeInput.value.trim();
            const companyName = companyNameInput.value.trim();
            const role = userRoleSelect.value;
            
            console.log('Selected role:', role);
            
            // Set default department and position based on role
            let department, position;
            switch (role) {
                case 'it_admin':
                    department = 'IT';
                    position = 'IT Administrator';
                    break;
                case 'hr_admin':
                    department = 'HR';
                    position = 'HR Administrator';
                    break;
                case 'employee':
                    department = 'General';
                    position = 'Employee';
                    break;
                default:
                    department = 'General';
                    position = 'User';
            }
            
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
            
            if (!role) {
                showInputError(userRoleSelect, 'Please select a role');
                isValid = false;
            }
            
            if (!departmentCode) {
                showInputError(departmentCodeInput, 'Department code is required');
                isValid = false;
            }
            
            if (!isValid) {
                return;
            }
            
            // Show loading state
            const submitButton = registerForm.querySelector('button[type="submit"]');
            submitButton.classList.add('loading');
            submitButton.disabled = true;
            
            try {
                // 1. First verify the department code
                console.log('Verifying department code:', departmentCode);
                const codeResponse = await api.auth.verifyDepartmentCode(departmentCode);
                
                console.log('Department code verification result:', codeResponse);
                
                if (!codeResponse || !codeResponse.isValid) {
                    const errorMsg = codeResponse?.message || 'Invalid department code. Please check and try again.';
                    showInputError(departmentCodeInput, errorMsg);
                    submitButton.classList.remove('loading');
                    submitButton.disabled = false;
                    return;
                }
                
                // Check if the role is allowed for this department code
                if (codeResponse.allowedRoles && codeResponse.allowedRoles.length > 0) {
                    if (!codeResponse.allowedRoles.includes(role)) {
                        // This is an important validation - the code is valid but not for this role
                        const allowedRoles = codeResponse.allowedRoles.map(r => 
                            r === 'it_admin' ? 'IT Admin' : 
                            r === 'hr_admin' ? 'HR Admin' : 
                            r === 'employee' ? 'Employee' : r
                        ).join(', ');
                        
                        showInputError(departmentCodeInput, 
                            `This code is only valid for: ${allowedRoles}. Please select a valid role or use the correct code.`);
                        submitButton.classList.remove('loading');
                        submitButton.disabled = false;
                        return;
                    }
                }
                
                // If department was provided in code verification response, use it
                if (codeResponse.department) {
                    department = codeResponse.department;
                    console.log('Using department from code verification:', department);
                }
                
                // 2. Now register the user
                console.log('Registering user with department:', department);
                
                // Create the registration data
                const registrationData = {
                    name: fullName,
                    email: email,
                    password: password,
                    role: role,
                    department: department,
                    position: position,
                    departmentCode: departmentCode,
                    companyName: companyName
                };
                
                console.log('Full registration data:', JSON.stringify(registrationData));
                
                const registerResponse = await fetch(`/api/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(registrationData)
                });
                
                console.log('Register response status:', registerResponse.status);
                
                // Check if response is ok before parsing JSON (in case of connection errors)
                if (!registerResponse.ok) {
                    const registerData = await registerResponse.json();
                    console.error('Registration error response:', registerData);
                    
                    let errorMsg = registerData.message || 'Error registering account';
                    
                    // Check if it's an email uniqueness error
                    if (errorMsg === 'User already exists') {
                        errorMsg = 'An account with this email already exists. Please login or use a different email.';
                        showInputError(emailInput, errorMsg);
                    }
                    
                    if (errorMessage) {
                        errorMessage.textContent = errorMsg;
                        errorMessage.style.display = 'block';
                    }
                    
                    submitButton.classList.remove('loading');
                    submitButton.disabled = false;
                    return;
                }
                
                const registerData = await registerResponse.json();
                console.log('Registration success response:', registerData);
                
                // Success - show message and redirect
                if (successMessage) {
                    successMessage.textContent = 'Account created successfully! Redirecting to login...';
                    successMessage.style.display = 'block';
                }
                
                // Remove loading state from button
                submitButton.classList.remove('loading');
                submitButton.disabled = false;
                
                // Redirect to login page after delay
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
                
            } catch (error) {
                console.error('Registration error:', error);
                
                // Provide more detailed error message
                let errorMsg = 'Error during registration process. ';
                if (error.message) {
                    errorMsg += error.message;
                } else {
                    errorMsg += 'Please check your network connection and try again.';
                }
                
                if (errorMessage) {
                    errorMessage.textContent = errorMsg;
                    errorMessage.style.display = 'block';
                }
                
                submitButton.classList.remove('loading');
                submitButton.disabled = false;
            }
        });
    }
}); 