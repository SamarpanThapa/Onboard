document.addEventListener('DOMContentLoaded', function() {
    // Flag to prevent multiple submissions
    let isSubmitting = false;
    
    // Get DOM elements
    const form = document.getElementById('onboarding-form');
    const steps = Array.from(document.querySelectorAll('.form-step'));
    const progressLine = document.querySelector('.progress-line-fill');
    const backButton = document.getElementById('back-button');
    const nextButton = document.getElementById('next-button');
    const dashboardButton = document.getElementById('dashboard-button');
    const successMessage = document.getElementById('success-message');

    let currentStep = 0;
    const userData = api.auth.getUserData() || {};
    let employeeData = {
        personalInfo: {},
        employmentDetails: {},
        onboarding: {
            status: 'in_progress',
            completedSteps: []
        }
    };

    // Check if user is authenticated
    if (!api.auth.isAuthenticated()) {
        safeRedirect('index.html');
        return;
    }

    // Safe redirect function
    function safeRedirect(url) {
        console.log(`Redirecting to: ${url}`);
        try {
            // Use replace instead of href to avoid browser history issues
            window.location.replace(url);
        } catch (error) {
            console.error('Redirect error:', error);
            // Fallback
            window.location.href = url;
        }
    }

    // Check if we have existing data
    loadExistingData();

    // Initialize progress line
    updateProgress();

    // Event listeners for navigation buttons
    backButton.addEventListener('click', goToPreviousStep);
    nextButton.addEventListener('click', goToNextStep);
    dashboardButton.addEventListener('click', goToDashboard);

    // Handle form submission
    form.addEventListener('submit', handleSubmit);

    function goToDashboard() {
        const role = api.auth.getUserRole();
        let targetUrl = 'index.html'; // Default fallback
        
        switch (role) {
            case 'employee':
                targetUrl = 'emp_dashboard.html';
                break;
            case 'it':
                targetUrl = 'it_dashboard.html';
                break;
            case 'hr':
            case 'manager':
                targetUrl = 'admin.html';
                break;
        }
        
        safeRedirect(targetUrl);
    }

    function goToNextStep() {
        if (validateCurrentStep()) {
            // Save current step data
            saveCurrentStepData();
            
            if (currentStep < steps.length - 1) {
                steps[currentStep].classList.remove('active');
                currentStep++;
                steps[currentStep].classList.add('active');
                updateProgress();
                updateNavigationButtons();
            } else {
                handleSubmit();
            }
        }
    }

    function goToPreviousStep() {
        if (currentStep > 0) {
            // Save current step data
            saveCurrentStepData();
            
            steps[currentStep].classList.remove('active');
            currentStep--;
            steps[currentStep].classList.add('active');
            updateProgress();
            updateNavigationButtons();
        }
    }

    function updateProgress() {
        const progress = ((currentStep + 1) / steps.length) * 100;
        progressLine.style.width = `${progress}%`;

        // Update step indicators
        document.querySelectorAll('.step').forEach((step, index) => {
            if (index < currentStep) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else if (index === currentStep) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active', 'completed');
            }
        });
    }

    function updateNavigationButtons() {
        backButton.disabled = currentStep === 0;
        nextButton.textContent = currentStep === steps.length - 1 ? 'Submit' : 'Next';
        nextButton.innerHTML = currentStep === steps.length - 1 ? 
            '<i class="fas fa-check"></i> Submit' : 
            'Next <i class="fas fa-arrow-right"></i>';
    }

    function validateCurrentStep() {
        const currentStepElement = steps[currentStep];
        const inputs = currentStepElement.querySelectorAll('input, select, textarea');
        let isValid = true;

        inputs.forEach(input => {
            const errorMessage = input.closest('.row-card')?.querySelector('.error-message');
            if (input.hasAttribute('required') && !input.value.trim()) {
                isValid = false;
                input.classList.add('error');
                if (errorMessage) {
                    errorMessage.textContent = 'This field is required';
                    errorMessage.style.display = 'block';
                }
            } else if (input.type === 'email' && input.value && !validateEmail(input.value)) {
                isValid = false;
                input.classList.add('error');
                if (errorMessage) {
                    errorMessage.textContent = 'Please enter a valid email address';
                    errorMessage.style.display = 'block';
                }
            } else {
                input.classList.remove('error');
                if (errorMessage) {
                    errorMessage.style.display = 'none';
                }
            }

            input.addEventListener('input', function() {
                this.classList.remove('error');
                if (errorMessage) {
                    errorMessage.style.display = 'none';
                }
            });
        });

        return isValid;
    }

    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function saveCurrentStepData() {
        const step = currentStep + 1;
        const currentStepElement = steps[currentStep];
        
        // Check if step already completed
        const stepAlreadyCompleted = employeeData.onboarding.completedSteps
            .some(s => s.step === `step${step}`);
        
        if (!stepAlreadyCompleted) {
            employeeData.onboarding.completedSteps.push({
                step: `step${step}`,
                completedAt: new Date()
            });
        }
        
        // Get form data for current step
        switch(step) {
            case 1: // Personal Information
                employeeData.personalInfo = {
                    ...employeeData.personalInfo,
                    firstName: document.getElementById('full-name')?.value.split(' ')[0] || '',
                    lastName: document.getElementById('full-name')?.value.split(' ').slice(1).join(' ') || '',
                    dateOfBirth: document.getElementById('dob')?.value || '',
                    address: {
                        street: document.getElementById('address')?.value || '',
                    },
                    phoneNumber: document.getElementById('phone')?.value || '',
                    email: document.getElementById('email')?.value || userData.email || '',
                    emergencyContact: {
                        name: document.getElementById('emergency-contact')?.value || '',
                        relationship: document.getElementById('emergency-contact-relationship')?.value || '',
                        phoneNumber: document.getElementById('emergency-contact-phone')?.value || ''
                    }
                };
                break;
                
            case 2: // Tax Information
                employeeData.personalInfo = {
                    ...employeeData.personalInfo,
                    ssn: document.getElementById('sin')?.value || '',
                    taxDocumentsSubmitted: !!document.getElementById('td1')?.files.length
                };
                break;
                
            case 3: // Employment Eligibility
                employeeData.personalInfo = {
                    ...employeeData.personalInfo,
                    workAuthorizationSubmitted: !!document.getElementById('work-authorization')?.files.length,
                    citizenshipProofSubmitted: !!document.getElementById('citizenship-proof')?.files.length
                };
                break;
                
            case 4: // Banking Information
                employeeData.employmentDetails = {
                    ...employeeData.employmentDetails,
                    bankDetails: {
                        bankName: document.getElementById('bank-name')?.value || '',
                        accountNumber: document.getElementById('account-number')?.value || '',
                        routingNumber: document.getElementById('routing-number')?.value || ''
                    }
                };
                break;
                
            case 5: // Job-Related Information
                employeeData.employmentDetails = {
                    ...employeeData.employmentDetails,
                    jobTitle: document.getElementById('job-title')?.value || '',
                    startDate: document.getElementById('start-date')?.value || '',
                    department: document.getElementById('department')?.value || userData.department || '',
                    workSchedule: document.getElementById('work-schedule')?.value || '',
                    // Add salary object with default values to prevent validation errors
                    salary: {
                        amount: 0,
                        currency: 'USD',
                        payPeriod: 'annual'
                    }
                };
                
                // Manager will be handled differently - we'd need to look up manager's ID
                const managerName = document.getElementById('manager')?.value || '';
                if (managerName) {
                    employeeData.employmentDetails.managerName = managerName;
                }
                break;
        }
    }

    /**
     * Update onboarding progress in the UI to 100% when completed
     */
    function updateOnboardingProgress() {
        try {
            // Find progress elements in the DOM - this handles both dashboard and onboarding pages
            const progressElements = document.querySelectorAll('.progress-percentage, .onboarding-complete, .progress-value');
            progressElements.forEach(el => {
                if (el) {
                    // Update text-based elements
                    if (el.tagName === 'SPAN' || el.tagName === 'DIV') {
                        el.textContent = '100%';
                    }
                }
            });

            // Update the progress bar if it exists
            const progressBar = document.querySelector('.progress-bar, .progress-line-fill');
            if (progressBar) {
                progressBar.style.width = '100%';
            }

            // Update tasks counters if they exist
            const pendingTasks = document.querySelector('.tasks-pending, .pending-tasks');
            if (pendingTasks) {
                pendingTasks.textContent = '0';
            }

            console.log('Updated onboarding progress UI to 100%');
        } catch (error) {
            console.error('Error updating progress UI:', error);
        }
    }

    async function handleSubmit(e) {
        if (e) e.preventDefault();
        
        if (isSubmitting) return;
        isSubmitting = true;
        
        try {
            // Validate all steps before submission
            let isValid = true;
            for (let i = 0; i < steps.length; i++) {
                // Temporarily show the step to validate it
                const wasActive = steps[i].classList.contains('active');
                if (!wasActive) {
                    steps[currentStep].classList.remove('active');
                    steps[i].classList.add('active');
                }
                
                // Validate the step
                if (!validateCurrentStep()) {
                    isValid = false;
                    currentStep = i;
                    updateProgress();
                    updateNavigationButtons();
                    isSubmitting = false;
                    return;
                }
                
                // Restore original active state
                if (!wasActive) {
                    steps[i].classList.remove('active');
                    steps[currentStep].classList.add('active');
                }
            }
            
            // Save all steps data
            steps.forEach((_, i) => {
                currentStep = i;
            saveCurrentStepData();
            });
            
            // Restore current step
            currentStep = steps.length - 1;
            
            // Set status to completed
            employeeData.onboarding.status = 'completed';
            employeeData.onboarding.completedAt = new Date();
            
            console.log('Submitting onboarding data:', employeeData);
            
            // Show loading state
            nextButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
            nextButton.disabled = true;
            backButton.disabled = true;
            
            // Submit data to API
            const response = await submitOnboardingData(employeeData);
            
            // Handle successful submission
            if (response && response.success) {
                console.log('Onboarding data submitted successfully:', response);
                
                // Update onboarding progress to 100%
                updateOnboardingProgress();
                
                // Also update in localStorage to ensure dashboard shows 100% too
                const userData = api.auth.getUserData();
                if (userData) {
                    if (!userData.onboarding) userData.onboarding = {};
                    userData.onboarding.status = 'completed';
                    userData.onboarding.completedAt = new Date();
                    userData.onboarding.progress = 100;
                    localStorage.setItem('user', JSON.stringify(userData));
                }
                
                // Show success message
                form.style.display = 'none';
                successMessage.style.display = 'block';
                
                // Redirect to dashboard after delay
                setTimeout(() => {
                    goToDashboard();
                }, 3000);
                
                // Create notification for HR and IT departments
                await createDepartmentNotifications(employeeData);
                
            } else {
                console.error('Error submitting onboarding data:', response);
                showNotification('Failed to submit onboarding data. Please try again.', 'error');
                
                // Reset submission state
                nextButton.innerHTML = '<i class="fas fa-check"></i> Submit';
                nextButton.disabled = false;
                backButton.disabled = false;
            }
        } catch (error) {
            console.error('Error in submission:', error);
            showNotification('An error occurred. Please try again.', 'error');
            
            // Reset submission state
            nextButton.innerHTML = '<i class="fas fa-check"></i> Submit';
            nextButton.disabled = false;
            backButton.disabled = false;
        } finally {
            isSubmitting = false;
        }
    }
    
    /**
     * Handle file uploads for documents - simplified version that skips actual uploads for now
     */
    async function uploadFiles(data) {
        try {
            // Tax form upload
            const taxFormInput = document.getElementById('td1');
            if (taxFormInput && taxFormInput.files && taxFormInput.files.length > 0) {
                const taxForm = taxFormInput.files[0];
                console.log('Processing tax form:', taxForm.name);
                
                // Instead of uploading, just record that a document was submitted
                data.personalInfo.taxDocumentsSubmitted = true;
                data.personalInfo.taxDocumentInfo = {
                    fileName: taxForm.name,
                    fileSize: taxForm.size,
                    fileType: taxForm.type,
                    submittedAt: new Date()
                };
            }
            
            // Work authorization upload
            const workAuthInput = document.getElementById('work-authorization');
            if (workAuthInput && workAuthInput.files && workAuthInput.files.length > 0) {
                const workAuth = workAuthInput.files[0];
                console.log('Processing work authorization:', workAuth.name);
                
                // Instead of uploading, just record that a document was submitted
                data.personalInfo.workAuthorizationSubmitted = true;
                data.personalInfo.workAuthorizationInfo = {
                    fileName: workAuth.name,
                    fileSize: workAuth.size,
                    fileType: workAuth.type,
                    submittedAt: new Date()
                };
            }
            
            // Citizenship proof upload
            const citizenshipProofInput = document.getElementById('citizenship-proof');
            if (citizenshipProofInput && citizenshipProofInput.files && citizenshipProofInput.files.length > 0) {
                const citizenshipProof = citizenshipProofInput.files[0];
                console.log('Processing citizenship proof:', citizenshipProof.name);
                
                // Instead of uploading, just record that a document was submitted
                data.personalInfo.citizenshipProofSubmitted = true;
                data.personalInfo.citizenshipProofInfo = {
                    fileName: citizenshipProof.name,
                    fileSize: citizenshipProof.size,
                    fileType: citizenshipProof.type,
                    submittedAt: new Date()
                };
            }
            
            console.log('File information processed successfully');
            return true;
        } catch (error) {
            console.error('Error processing file information:', error);
            return false;
        }
    }

    /**
     * Submit onboarding data to API
     */
    async function submitOnboardingData(data) {
        try {
            // Process file information first
            const filesProcessed = await uploadFiles(data);
            if (!filesProcessed) {
                console.warn('There was an issue processing file information, but continuing with submission');
            }
            
            // Prepare a clean copy of the data without any File objects
            const cleanData = JSON.parse(JSON.stringify(data));
            
            console.log('Submitting clean data to API:', cleanData);
            
            // Submit the main data to create/update onboarding process
            const response = await fetch(`${api.baseUrl || '/api'}/onboarding-processes/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(cleanData)
            });
            
            const responseData = await response.json();
            
            // Update user data in localStorage
            if (response.ok) {
                const userData = api.auth.getUserData();
                if (userData) {
                    userData.onboarding = {
                        ...userData.onboarding,
                        status: 'completed',
                        completedAt: new Date()
                    };
                    localStorage.setItem('user', JSON.stringify(userData));
                }
                
                return { 
                    success: true, 
                    message: 'Onboarding data submitted successfully',
                    data: responseData.data || responseData
                };
            } else {
                throw new Error(responseData.message || 'Failed to submit onboarding data');
            }
        } catch (error) {
            console.error('Error submitting onboarding data:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Create notifications for IT and HR departments - simplified version
     */
    async function createDepartmentNotifications(employeeData) {
        try {
            const user = api.auth.getUserData();
            const userName = user.name || user.firstName || (user.email?.split('@')[0]);
            
            console.log(`Creating notifications for ${userName}'s onboarding completion`);
            
            // Instead of using the notifications API, we'll just log that this would happen
            // In a real implementation, we would send these notifications to the appropriate departments
            console.log('HR Notification would be sent with full data access');
            console.log('IT Notification would be sent with limited data access');
            
            // For demonstration purposes, we'll return success
            return true;
        } catch (error) {
            console.error('Error creating department notifications:', error);
            return false;
        }
    }

    /**
     * Load existing onboarding data if available
     */
    async function loadExistingData() {
        try {
            // Try to get existing onboarding process for the current user
            const response = await api.onboarding.getMyOnboardingProcess();
            
            if (response && response.success) {
                console.log('Onboarding data response:', response);
                
                // Check if there's actual data
                if (response.data) {
                    console.log('Loading existing onboarding data:', response.data);
                    
                    // If onboarding is already completed, disable the form and show message
                    if (response.data.status === 'completed') {
                        console.log('Onboarding already completed - disabling form');
                        
                        // Disable all form inputs
                        const allInputs = form.querySelectorAll('input, select, textarea, button');
                        allInputs.forEach(input => {
                            input.disabled = true;
                        });
                        
                        // Only enable the dashboard button
                        dashboardButton.disabled = false;
                        
                        // Create and show a message overlay
                        const formContainer = document.querySelector('.form-steps-container');
                        const overlay = document.createElement('div');
                        overlay.className = 'form-disabled-overlay';
                        overlay.innerHTML = `
                            <div class="completion-message">
                                <i class="fas fa-clipboard-check"></i>
                                <h3>Onboarding Form Completed</h3>
                                <p>You have already submitted your onboarding information and it is awaiting HR approval.</p>
                                <p>If you need to make changes, please contact your HR representative.</p>
                                <button type="button" class="dashboard-btn" onclick="window.location.href='/emp_dashboard.html'">
                                    <i class="fas fa-th-large"></i> Return to Dashboard
                                </button>
                            </div>
                        `;
                        
                        // Insert overlay after the form container
                        if (formContainer) {
                            formContainer.style.position = 'relative';
                            formContainer.appendChild(overlay);
                        }
                        
                        // Update progress to 100%
                        updateOnboardingProgress();
                        
                        // Show a notification
                        showNotification('Your onboarding process is already completed and awaiting HR approval.', 'info');
                        
                        return; // Exit early, no need to populate form
                    }
                    
                    // Otherwise, populate form with existing data
                    populateFormWithExistingData(response.data);
                } else {
                    console.log('No existing onboarding data found. Starting with a new form.');
                    // This is fine - user will start with a fresh form
                    // We can pre-populate with any data from their user profile
                    populateFormWithUserData();
                }
            } else {
                throw new Error(response.message || 'Failed to check for existing onboarding data');
            }
        } catch (error) {
            console.error('Error loading existing onboarding data:', error);
            // Continue with empty form - it's okay if there's no existing data
            populateFormWithUserData();
        }
    }

    /**
     * Populate form with existing data
     */
    function populateFormWithExistingData(processData) {
        // Process the data and set form values
        if (processData.employee.personalInfo) {
            const personalInfo = processData.employee.personalInfo;
            
            // Step 1: Personal Information
            if (personalInfo.firstName || personalInfo.lastName) {
                document.getElementById('full-name').value = `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim();
            }
            
            if (personalInfo.dateOfBirth) {
                document.getElementById('dob').value = new Date(personalInfo.dateOfBirth).toISOString().split('T')[0];
            }
            
            if (personalInfo.address && personalInfo.address.street) {
                document.getElementById('address').value = personalInfo.address.street;
            }
            
            if (personalInfo.phoneNumber) {
                document.getElementById('phone').value = personalInfo.phoneNumber;
            }
            
            if (personalInfo.email) {
                document.getElementById('email').value = personalInfo.email;
            }
            
            if (personalInfo.emergencyContact) {
                document.getElementById('emergency-contact').value = personalInfo.emergencyContact.name || '';
                document.getElementById('emergency-contact-relationship').value = personalInfo.emergencyContact.relationship || '';
                document.getElementById('emergency-contact-phone').value = personalInfo.emergencyContact.phoneNumber || '';
            }
            
            // Step 2: Tax Information
            if (personalInfo.ssn) {
                document.getElementById('sin').value = personalInfo.ssn;
            }
            
            // Step 4: Banking Information
            if (processData.employee.employmentDetails && processData.employee.employmentDetails.bankDetails) {
                const bankDetails = processData.employee.employmentDetails.bankDetails;
                document.getElementById('bank-name').value = bankDetails.bankName || '';
                document.getElementById('account-number').value = bankDetails.accountNumber || '';
                document.getElementById('routing-number').value = bankDetails.routingNumber || '';
            }
            
            // Step 5: Job-Related Information
            if (processData.employee.employmentDetails) {
                const employmentDetails = processData.employee.employmentDetails;
                document.getElementById('job-title').value = employmentDetails.jobTitle || '';
                
                if (employmentDetails.startDate) {
                    document.getElementById('start-date').value = new Date(employmentDetails.startDate).toISOString().split('T')[0];
                }
                
                document.getElementById('department').value = employmentDetails.department || '';
                document.getElementById('work-schedule').value = employmentDetails.workSchedule || '';
                
                if (employmentDetails.manager) {
                    if (typeof employmentDetails.manager === 'object' && employmentDetails.manager.name) {
                        document.getElementById('manager').value = employmentDetails.manager.name;
                    } else if (typeof employmentDetails.manager === 'string') {
                        document.getElementById('manager').value = employmentDetails.manager;
                    }
                }
            }
        }
    }

    /**
     * Populate form with data from user profile if available
     */
    function populateFormWithUserData() {
        try {
            const userData = api.auth.getUserData();
            if (!userData) return;
            
            console.log('Pre-populating form with user profile data:', userData);
            
            // Populate name and email if available
            if (userData.name) {
                document.getElementById('full-name').value = userData.name;
            } else if (userData.firstName || userData.lastName) {
                document.getElementById('full-name').value = 
                    `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
            }
            
            if (userData.email) {
                document.getElementById('email').value = userData.email;
            }
            
            // Populate department and position if available
            if (userData.department) {
                document.getElementById('department').value = 
                    typeof userData.department === 'object' && userData.department.name 
                    ? userData.department.name 
                    : userData.department;
            }
            
            if (userData.position) {
                document.getElementById('job-title').value = userData.position;
            }
            
            // Populate phone if available
            if (userData.phone) {
                document.getElementById('phone').value = userData.phone;
            }
        } catch (error) {
            console.error('Error pre-populating form:', error);
            // Continue with empty form
        }
    }

    /**
     * Show notification
     */
    function showNotification(message, type = 'info') {
        // Create notification container if it doesn't exist
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            document.body.appendChild(container);
        }
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        // Icon based on type
        let icon = 'fas fa-info-circle';
        if (type === 'success') icon = 'fas fa-check-circle';
        if (type === 'error') icon = 'fas fa-exclamation-circle';
        if (type === 'warning') icon = 'fas fa-exclamation-triangle';
        
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="${icon}"></i>
            </div>
            <div class="notification-content">
                <p>${message}</p>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
                        </button>
                    `;
                    
        // Add close button event listener
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
        
        // Add to container
        container.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.add('fade-out');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 5000);
    }
});