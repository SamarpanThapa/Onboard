document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const form = document.getElementById('offboarding-form');
    const steps = Array.from(document.querySelectorAll('.form-step'));
    const progressLine = document.querySelector('.progress-line-fill');
    const backButton = document.getElementById('back-button');
    const nextButton = document.getElementById('next-button');
    const dashboardButton = document.getElementById('dashboard-button');
    const successMessage = document.getElementById('success-message');

    let currentStep = 0;

    // Initialize progress line
    updateProgress();

    // Event listeners for navigation buttons
    backButton.addEventListener('click', goToPreviousStep);
    nextButton.addEventListener('click', goToNextStep);
    dashboardButton.addEventListener('click', () => window.location.href = '/emp_dashboard.html');

    // Handle form submission
    form.addEventListener('submit', handleSubmit);

    function goToNextStep() {
        if (validateCurrentStep()) {
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
        steps.forEach((step, index) => {
            const stepIndicator = document.querySelector(`.step[data-step="${index + 1}"]`);
            if (index < currentStep) {
                stepIndicator.classList.add('completed');
            } else if (index === currentStep) {
                stepIndicator.classList.add('active');
            } else {
                stepIndicator.classList.remove('active', 'completed');
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
        let isValid = true;

        // Validate select fields
        const selects = currentStepElement.querySelectorAll('select[required]');
        selects.forEach(select => {
            const errorMessage = select.parentElement.querySelector('.error-message');
            if (!select.value) {
                isValid = false;
                select.classList.add('error');
                if (errorMessage) {
                    errorMessage.textContent = 'Please select an option';
                    errorMessage.classList.add('visible');
                }
            } else {
                select.classList.remove('error');
                if (errorMessage) {
                    errorMessage.classList.remove('visible');
                }
            }
        });

        // Validate textareas
        const textareas = currentStepElement.querySelectorAll('textarea[required]');
        textareas.forEach(textarea => {
            const errorMessage = textarea.parentElement.querySelector('.error-message');
            if (!textarea.value.trim()) {
                isValid = false;
                textarea.classList.add('error');
                if (errorMessage) {
                    errorMessage.textContent = 'This field is required';
                    errorMessage.classList.add('visible');
                }
            } else {
                textarea.classList.remove('error');
                if (errorMessage) {
                    errorMessage.classList.remove('visible');
                }
            }
        });

        // Validate checkboxes
        const checkboxGroups = currentStepElement.querySelectorAll('.checkbox-group');
        checkboxGroups.forEach(group => {
            const checkboxes = group.querySelectorAll('input[type="checkbox"][required]');
            const errorMessage = group.parentElement.querySelector('.error-message');
            let checked = false;

            checkboxes.forEach(checkbox => {
                if (checkbox.checked) checked = true;
            });

            if (!checked && checkboxes.length > 0) {
                isValid = false;
                if (errorMessage) {
                    errorMessage.textContent = 'Please select at least one option';
                    errorMessage.classList.add('visible');
                }
            } else if (errorMessage) {
                errorMessage.classList.remove('visible');
            }
        });

        // Validate date inputs
        const dateInputs = currentStepElement.querySelectorAll('input[type="date"][required]');
        dateInputs.forEach(input => {
            const errorMessage = input.parentElement.querySelector('.error-message');
            if (!input.value) {
                isValid = false;
                input.classList.add('error');
                if (errorMessage) {
                    errorMessage.textContent = 'Please select a date';
                    errorMessage.classList.add('visible');
                }
            } else {
                input.classList.remove('error');
                if (errorMessage) {
                    errorMessage.classList.remove('visible');
                }
            }
        });

        // Validate file inputs
        const fileInputs = currentStepElement.querySelectorAll('input[type="file"][required]');
        fileInputs.forEach(input => {
            const errorMessage = input.parentElement.querySelector('.error-message');
            if (!input.files || !input.files.length) {
                isValid = false;
                input.classList.add('error');
                if (errorMessage) {
                    errorMessage.textContent = 'Please upload a file';
                    errorMessage.classList.add('visible');
                }
            } else {
                input.classList.remove('error');
                if (errorMessage) {
                    errorMessage.classList.remove('visible');
                }
            }
        });

        return isValid;
    }

    async function handleSubmit(e) {
        if (e) e.preventDefault();
        
        if (validateCurrentStep()) {
            // Show loading state
            nextButton.classList.add('loading');
            nextButton.disabled = true;

            // Gather form data
            const offboardingData = {
                reason: document.getElementById('reason').value,
                feedback: document.getElementById('feedback').value,
                exitDate: document.getElementById('last-day').value,
                companyAssetsReturned: [
                    {
                        assetName: 'Laptop',
                        returnStatus: document.getElementById('laptop').checked ? 'pending' : 'not_applicable',
                    },
                    {
                        assetName: 'Phone',
                        returnStatus: document.getElementById('phone').checked ? 'pending' : 'not_applicable',
                    },
                    {
                        assetName: 'Access Card',
                        returnStatus: document.getElementById('access-card').checked ? 'pending' : 'not_applicable',
                    }
                ],
                accountDeactivation: {
                    status: false, // Will be updated by IT
                    requested: document.getElementById('email-deactivation').checked || 
                              document.getElementById('systems-deactivation').checked
                },
                complianceAcknowledged: document.getElementById('confidentiality').checked && 
                                       document.getElementById('ip-agreement').checked && 
                                       document.getElementById('final-confirmation').checked
            };

            try {
                // Get file data if uploaded
                const handoverDoc = document.getElementById('handover-doc').files[0];
                if (handoverDoc) {
                    // In a real implementation, we'd upload this file to the server
                    offboardingData.finalDocumentation = {
                        status: 'in_progress',
                        documents: [{
                            title: handoverDoc.name,
                            status: 'pending',
                            uploadedDate: new Date()
                        }]
                    };
                }

                // Submit offboarding data to API
                const response = await fetch('/api/offboarding-processes/submit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(offboardingData)
                });

                const result = await response.json();

                if (response.ok) {
                    console.log('Offboarding data submitted successfully:', result);
                    
                    // Update user status in local storage
                    const user = JSON.parse(localStorage.getItem('user')) || {};
                    user.offboarding = {
                        status: 'in_progress',
                        reason: offboardingData.reason,
                        exitDate: offboardingData.exitDate
                    };
                    localStorage.setItem('user', JSON.stringify(user));
                    
                    // Show success message
                    form.style.display = 'none';
                    successMessage.style.display = 'block';
                    
                    // Redirect after a delay
                    setTimeout(() => {
                        window.location.href = '/emp_dashboard.html';
                    }, 3000);
                } else {
                    throw new Error(result.message || 'Error submitting offboarding request');
                }
            } catch (error) {
                console.error('Error submitting offboarding request:', error);
                
                // Remove loading state
                nextButton.classList.remove('loading');
                nextButton.disabled = false;
                
                // Show error message
                alert(`Failed to submit offboarding request: ${error.message}`);
            }
        }
    }

    // Upload handler for file input
    document.getElementById('handover-doc').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const label = this.nextElementSibling;
            if (label && label.tagName === 'LABEL') {
                label.textContent = file.name;
            }
        }
    });
});