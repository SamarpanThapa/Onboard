document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const form = document.getElementById('onboarding-form');
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
    dashboardButton.addEventListener('click', () => window.location.href = '/admin');

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
        const inputs = currentStepElement.querySelectorAll('input, select, textarea');
        let isValid = true;

        inputs.forEach(input => {
            const errorMessage = input.parentElement.querySelector('.error-message');
            if (input.hasAttribute('required') && !input.value.trim()) {
                isValid = false;
                input.classList.add('error');
                if (errorMessage) {
                    errorMessage.textContent = 'This field is required';
                    errorMessage.classList.add('visible');
                }
            } else if (input.type === 'email' && input.value && !validateEmail(input.value)) {
                isValid = false;
                input.classList.add('error');
                if (errorMessage) {
                    errorMessage.textContent = 'Please enter a valid email address';
                    errorMessage.classList.add('visible');
                }
            } else {
                input.classList.remove('error');
                if (errorMessage) {
                    errorMessage.classList.remove('visible');
                }
            }

            input.addEventListener('input', function() {
                this.classList.remove('error');
                if (errorMessage) {
                    errorMessage.classList.remove('visible');
                }
            });
        });

        return isValid;
    }

    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function handleSubmit(e) {
        if (e) e.preventDefault();
        
        if (validateCurrentStep()) {
            // Show loading state
            nextButton.classList.add('loading');
            nextButton.disabled = true;

            // Simulate API call
            setTimeout(() => {
                // Hide the form and show success message
                form.querySelector('.form-steps-container').style.display = 'none';
                form.querySelector('.progress-indicator').style.display = 'none';
                successMessage.style.display = 'block';

                // Reset form state
                nextButton.classList.remove('loading');
                nextButton.disabled = false;
            }, 1500);
        }
    }
});