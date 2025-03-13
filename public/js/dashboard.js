document.addEventListener('DOMContentLoaded', function() {
    console.log('Employee Dashboard loaded');
    
    // Initialize dashboard components
    initializeNavigation();
    initializeTaskCheckboxes();
    initializeResourceLinks();
    initializeCommunication();
    initializeHelpButtons();
    initializeFeedback();
    initializeComplianceTracking();
    
    // Create notification container if it doesn't exist
    if (!document.getElementById('notification-container')) {
        const container = document.createElement('div');
        container.id = 'notification-container';
        document.body.appendChild(container);
    }
    
    // Welcome notification
    setTimeout(() => {
        showNotification('Welcome to your dashboard!', 'success');
    }, 1000);
});

/**
 * Initialize navigation and mobile menu
 */
function initializeNavigation() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    
    if (mobileMenuToggle && mainNav) {
        mobileMenuToggle.addEventListener('click', function() {
            mainNav.classList.toggle('active');
            this.innerHTML = mainNav.classList.contains('active') 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
        });
    }
    
    // Handle help link
    const helpLink = document.getElementById('help-link');
    if (helpLink) {
        helpLink.addEventListener('click', function(e) {
            e.preventDefault();
            openSupportDialog();
        });
    }
}

/**
 * Initialize task checkboxes
 */
function initializeTaskCheckboxes() {
    const checkboxes = document.querySelectorAll('.task-checkbox input');
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const taskItem = this.closest('.task-item');
            const taskContent = taskItem.querySelector('.task-content h4');
            
            if (this.checked) {
                taskContent.style.textDecoration = 'line-through';
                taskContent.style.opacity = '0.6';
                
                // Save task state
                localStorage.setItem(`task-${taskItem.dataset.id}`, 'completed');
                
                // Show notification based on task category
                const category = taskItem.dataset.category;
                let message = 'Task marked as complete!';
                
                if (category === 'documentation') {
                    message = 'Documentation task completed!';
                } else if (category === 'compliance') {
                    message = 'Compliance task completed!';
                } else if (category === 'orientation') {
                    message = 'Orientation task completed!';
                }
                
                showNotification(message, 'success');
            } else {
                taskContent.style.textDecoration = 'none';
                taskContent.style.opacity = '1';
                
                // Remove task state
                localStorage.removeItem(`task-${taskItem.dataset.id}`);
            }
            
            // Update progress
            updateTaskProgress();
        });
        
        // Load saved task states
        const taskItem = checkbox.closest('.task-item');
        if (taskItem && localStorage.getItem(`task-${taskItem.dataset.id}`) === 'completed') {
            checkbox.checked = true;
            const taskContent = taskItem.querySelector('.task-content h4');
            taskContent.style.textDecoration = 'line-through';
            taskContent.style.opacity = '0.6';
        }
    });
    
    // Initial progress update
    updateTaskProgress();
}

/**
 * Update task progress counters
 */
function updateTaskProgress() {
    const totalTasks = document.querySelectorAll('.task-item').length;
    const completedTasks = document.querySelectorAll('.task-checkbox input:checked').length;
    const taskCounter = document.querySelector('.stat-card:first-child .stat-number');
    const progressPercentage = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.stat-card:nth-child(2) .stat-number');
    
    if (taskCounter) {
        taskCounter.textContent = totalTasks - completedTasks;
    }
    
    if (progressPercentage && progressText) {
        const percentage = Math.round((completedTasks / totalTasks) * 100);
        progressPercentage.style.width = `${percentage}%`;
        progressText.textContent = `${percentage}%`;
    }
}

/**
 * Initialize resource links
 */
function initializeResourceLinks() {
    const resourceLinks = document.querySelectorAll('.resource-item');
    
    resourceLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const resourceName = this.querySelector('h4').textContent;
            const resourceType = this.dataset.type;
            
            showNotification(`Downloading ${resourceName}...`, 'info');
            
            // Simulate download complete after delay
            setTimeout(() => {
                showNotification(`${resourceName} downloaded successfully!`, 'success');
                
                // Actually open the resource in a new tab
                window.open(this.href, '_blank');
            }, 1500);
        });
    });
}

/**
 * Initialize communication section
 */
function initializeCommunication() {
    const communicationItems = document.querySelectorAll('.communication-item');
    
    communicationItems.forEach(item => {
        item.addEventListener('click', function() {
            const contactName = this.querySelector('h4').textContent;
            const emailLink = this.querySelector('a');
            
            if (emailLink) {
                showNotification(`Opening email to ${contactName}...`, 'info');
            }
        });
    });
}

/**
 * Initialize help buttons
 */
function initializeHelpButtons() {
    // Contact HR
    const contactHrBtn = document.getElementById('contact-hr');
    if (contactHrBtn) {
        contactHrBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openContactHRDialog();
        });
    }
    
    // IT Support
    const itSupportBtn = document.getElementById('it-support');
    if (itSupportBtn) {
        itSupportBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showNotification('Opening IT support portal...', 'info');
            setTimeout(() => {
                window.open('/it-support', '_blank');
            }, 500);
        });
    }
}

/**
 * Initialize feedback functionality
 */
function initializeFeedback() {
    const feedbackBtn = document.getElementById('provide-feedback');
    
    if (feedbackBtn) {
        feedbackBtn.addEventListener('click', function() {
            openFeedbackDialog();
        });
    }
}

/**
 * Initialize compliance tracking
 */
function initializeComplianceTracking() {
    const complianceItems = document.querySelectorAll('.compliance-item');
    
    complianceItems.forEach(item => {
        item.addEventListener('click', function() {
            const complianceName = this.querySelector('h4').textContent;
            const status = this.querySelector('.compliance-status');
            
            if (status.classList.contains('pending')) {
                openComplianceDialog(complianceName);
            } else {
                showNotification(`${complianceName} is already completed.`, 'info');
            }
        });
    });
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    const container = document.getElementById('notification-container');
    if (container) {
        container.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

/**
 * Open HR contact dialog
 */
function openContactHRDialog() {
    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal-container';
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    // Add header
    const header = document.createElement('h3');
    header.innerHTML = '<i class="fas fa-users"></i> Contact HR';
    
    // Add message
    const message = document.createElement('p');
    message.textContent = 'Please describe your question or issue, and an HR representative will get back to you shortly.';
    message.style.marginBottom = '1.2rem';
    message.style.color = 'var(--text-secondary)';
    
    // Add form content
    const formContent = document.createElement('div');
    formContent.innerHTML = `
        <div class="form-group">
            <label for="hr-topic">Topic</label>
            <select id="hr-topic" style="width: 100%; padding: 0.8rem; background: rgba(0,0,0,0.2); border: 1px solid #333; border-radius: 6px; color: white;">
                <option value="">Select a topic</option>
                <option value="benefits">Benefits</option>
                <option value="payroll">Payroll</option>
                <option value="onboarding">Onboarding</option>
                <option value="other">Other</option>
            </select>
        </div>
        <div class="form-group">
            <label for="hr-message">Message</label>
            <textarea id="hr-message" rows="5" style="width: 100%; padding: 0.8rem; background: rgba(0,0,0,0.2); border: 1px solid #333; border-radius: 6px; color: white; resize: vertical; font-family: 'Roboto', sans-serif;" placeholder="How can HR help you?"></textarea>
        </div>
    `;
    
    // Add buttons
    const buttons = document.createElement('div');
    buttons.className = 'form-buttons';
    buttons.style.display = 'flex';
    buttons.style.justifyContent = 'flex-end';
    buttons.style.gap = '1rem';
    buttons.style.marginTop = '1.5rem';
    
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.style.padding = '0.6rem 1.2rem';
    cancelButton.style.borderRadius = '6px';
    cancelButton.style.background = 'rgba(255,255,255,0.1)';
    cancelButton.style.color = 'white';
    cancelButton.style.border = 'none';
    cancelButton.style.cursor = 'pointer';
    
    const submitButton = document.createElement('button');
    submitButton.textContent = 'Submit';
    submitButton.style.padding = '0.6rem 1.2rem';
    submitButton.style.borderRadius = '6px';
    submitButton.style.background = 'var(--primary-color, #1db954)';
    submitButton.style.color = 'white';
    submitButton.style.border = 'none';
    submitButton.style.cursor = 'pointer';
    
    buttons.appendChild(cancelButton);
    buttons.appendChild(submitButton);
    
    // Add to modal
    modalContent.appendChild(header);
    modalContent.appendChild(message);
    modalContent.appendChild(formContent);
    modalContent.appendChild(buttons);
    modalContainer.appendChild(modalContent);
    
    // Add to body
    document.body.appendChild(modalContainer);
    
    // Add event listeners
    cancelButton.addEventListener('click', function() {
        modalContainer.remove();
    });
    
    submitButton.addEventListener('click', function() {
        const topic = document.getElementById('hr-topic').value;
        const message = document.getElementById('hr-message').value;
        
        if (!topic) {
            showNotification('Please select a topic', 'error');
            return;
        }
        
        if (!message.trim()) {
            showNotification('Please enter a message', 'error');
            return;
        }
        
        showNotification('Message sent to HR!', 'success');
        modalContainer.remove();
    });
}

/**
 * Open feedback dialog
 */
function openFeedbackDialog() {
    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal-container';
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    // Add header
    const header = document.createElement('h3');
    header.innerHTML = '<i class="fas fa-comment-dots"></i> Provide Feedback';
    
    // Add message
    const message = document.createElement('p');
    message.textContent = 'Your feedback helps us improve our onboarding and offboarding processes.';
    message.style.marginBottom = '1.2rem';
    message.style.color = 'var(--text-secondary)';
    
    // Add form content
    const formContent = document.createElement('div');
    formContent.innerHTML = `
        <div class="form-group">
            <label for="feedback-type">Feedback Type</label>
            <select id="feedback-type" style="width: 100%; padding: 0.8rem; background: rgba(0,0,0,0.2); border: 1px solid #333; border-radius: 6px; color: white;">
                <option value="">Select feedback type</option>
                <option value="onboarding">Onboarding Process</option>
                <option value="offboarding">Offboarding Process</option>
                <option value="resources">Resources & Documentation</option>
                <option value="system">System Usability</option>
                <option value="other">Other</option>
            </select>
        </div>
        <div class="form-group">
            <label for="feedback-rating">Rating</label>
            <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
                <span class="rating-star" data-rating="1"><i class="far fa-star"></i></span>
                <span class="rating-star" data-rating="2"><i class="far fa-star"></i></span>
                <span class="rating-star" data-rating="3"><i class="far fa-star"></i></span>
                <span class="rating-star" data-rating="4"><i class="far fa-star"></i></span>
                <span class="rating-star" data-rating="5"><i class="far fa-star"></i></span>
            </div>
            <input type="hidden" id="feedback-rating-value" value="">
        </div>
        <div class="form-group">
            <label for="feedback-message">Your Feedback</label>
            <textarea id="feedback-message" rows="5" style="width: 100%; padding: 0.8rem; background: rgba(0,0,0,0.2); border: 1px solid #333; border-radius: 6px; color: white; resize: vertical; font-family: 'Roboto', sans-serif;" placeholder="Please share your thoughts and suggestions..."></textarea>
        </div>
    `;
    
    // Add buttons
    const buttons = document.createElement('div');
    buttons.className = 'form-buttons';
    buttons.style.display = 'flex';
    buttons.style.justifyContent = 'flex-end';
    buttons.style.gap = '1rem';
    buttons.style.marginTop = '1.5rem';
    
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.style.padding = '0.6rem 1.2rem';
    cancelButton.style.borderRadius = '6px';
    cancelButton.style.background = 'rgba(255,255,255,0.1)';
    cancelButton.style.color = 'white';
    cancelButton.style.border = 'none';
    cancelButton.style.cursor = 'pointer';
    
    const submitButton = document.createElement('button');
    submitButton.textContent = 'Submit Feedback';
    submitButton.style.padding = '0.6rem 1.2rem';
    submitButton.style.borderRadius = '6px';
    submitButton.style.background = 'var(--primary-color, #1db954)';
    submitButton.style.color = 'white';
    submitButton.style.border = 'none';
    submitButton.style.cursor = 'pointer';
    
    buttons.appendChild(cancelButton);
    buttons.appendChild(submitButton);
    
    // Add to modal
    modalContent.appendChild(header);
    modalContent.appendChild(message);
    modalContent.appendChild(formContent);
    modalContent.appendChild(buttons);
    modalContainer.appendChild(modalContent);
    
    // Add to body
    document.body.appendChild(modalContainer);
    
    // Initialize star rating
    const stars = modalContent.querySelectorAll('.rating-star');
    const ratingInput = modalContent.querySelector('#feedback-rating-value');
    
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = this.dataset.rating;
            ratingInput.value = rating;
            
            // Update stars
            stars.forEach(s => {
                const starRating = s.dataset.rating;
                if (starRating <= rating) {
                    s.innerHTML = '<i class="fas fa-star" style="color: #ffcc00;"></i>';
                } else {
                    s.innerHTML = '<i class="far fa-star"></i>';
                }
            });
        });
        
        star.addEventListener('mouseover', function() {
            const rating = this.dataset.rating;
            
            stars.forEach(s => {
                const starRating = s.dataset.rating;
                if (starRating <= rating) {
                    s.innerHTML = '<i class="fas fa-star" style="color: #ffcc00;"></i>';
                }
            });
        });
        
        star.addEventListener('mouseout', function() {
            const currentRating = ratingInput.value;
            
            stars.forEach(s => {
                const starRating = s.dataset.rating;
                if (currentRating && starRating <= currentRating) {
                    s.innerHTML = '<i class="fas fa-star" style="color: #ffcc00;"></i>';
                } else {
                    s.innerHTML = '<i class="far fa-star"></i>';
                }
            });
        });
    });
    
    // Add event listeners
    cancelButton.addEventListener('click', function() {
        modalContainer.remove();
    });
    
    submitButton.addEventListener('click', function() {
        const type = document.getElementById('feedback-type').value;
        const rating = document.getElementById('feedback-rating-value').value;
        const message = document.getElementById('feedback-message').value;
        
        if (!type) {
            showNotification('Please select a feedback type', 'error');
            return;
        }
        
        if (!rating) {
            showNotification('Please provide a rating', 'error');
            return;
        }
        
        if (!message.trim()) {
            showNotification('Please enter your feedback', 'error');
            return;
        }
        
        showNotification('Thank you for your feedback!', 'success');
        modalContainer.remove();
    });
}

/**
 * Open compliance dialog
 */
function openComplianceDialog(complianceName) {
    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal-container';
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    // Add header
    const header = document.createElement('h3');
    header.innerHTML = `<i class="fas fa-clipboard-check"></i> ${complianceName}`;
    
    // Add message
    const message = document.createElement('p');
    message.textContent = `Complete the ${complianceName} requirement by uploading the necessary documentation.`;
    message.style.marginBottom = '1.2rem';
    message.style.color = 'var(--text-secondary)';
    
    // Add form content
    const formContent = document.createElement('div');
    formContent.innerHTML = `
        <div class="form-group">
            <label for="compliance-file">Upload Document</label>
            <input type="file" id="compliance-file" style="width: 100%; padding: 0.8rem; background: rgba(0,0,0,0.2); border: 1px solid #333; border-radius: 6px; color: white;">
        </div>
        <div class="form-group">
            <label for="compliance-notes">Additional Notes</label>
            <textarea id="compliance-notes" rows="3" style="width: 100%; padding: 0.8rem; background: rgba(0,0,0,0.2); border: 1px solid #333; border-radius: 6px; color: white; resize: vertical; font-family: 'Roboto', sans-serif;" placeholder="Any additional information..."></textarea>
        </div>
    `;
    
    // Add buttons
    const buttons = document.createElement('div');
    buttons.className = 'form-buttons';
    buttons.style.display = 'flex';
    buttons.style.justifyContent = 'flex-end';
    buttons.style.gap = '1rem';
    buttons.style.marginTop = '1.5rem';
    
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.style.padding = '0.6rem 1.2rem';
    cancelButton.style.borderRadius = '6px';
    cancelButton.style.background = 'rgba(255,255,255,0.1)';
    cancelButton.style.color = 'white';
    cancelButton.style.border = 'none';
    cancelButton.style.cursor = 'pointer';
    
    const submitButton = document.createElement('button');
    submitButton.textContent = 'Submit';
    submitButton.style.padding = '0.6rem 1.2rem';
    submitButton.style.borderRadius = '6px';
    submitButton.style.background = 'var(--primary-color, #1db954)';
    submitButton.style.color = 'white';
    submitButton.style.border = 'none';
    submitButton.style.cursor = 'pointer';
    
    buttons.appendChild(cancelButton);
    buttons.appendChild(submitButton);
    
    // Add to modal
    modalContent.appendChild(header);
    modalContent.appendChild(message);
    modalContent.appendChild(formContent);
    modalContent.appendChild(buttons);
    modalContainer.appendChild(modalContent);
    
    // Add to body
    document.body.appendChild(modalContainer);
    
    // Add event listeners
    cancelButton.addEventListener('click', function() {
        modalContainer.remove();
    });
    
    submitButton.addEventListener('click', function() {
        const file = document.getElementById('compliance-file').files;
        
        if (!file || file.length === 0) {
            showNotification('Please upload a document', 'error');
            return;
        }
        
        showNotification(`${complianceName} document submitted successfully!`, 'success');
        modalContainer.remove();
        
        // Update the compliance item status
        const complianceItems = document.querySelectorAll('.compliance-item');
        complianceItems.forEach(item => {
            const itemName = item.querySelector('h4').textContent;
            if (itemName === complianceName) {
                const status = item.querySelector('.compliance-status');
                status.classList.remove('pending');
                status.classList.add('completed');
                status.innerHTML = '<i class="fas fa-check"></i>';
                
                const dateText = item.querySelector('p');
                const today = new Date();
                const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
                dateText.textContent = `Completed on: ${formattedDate}`;
            }
        });
    });
}

/**
 * Open support dialog
 */
function openSupportDialog() {
    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal-container';
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    // Add header
    const header = document.createElement('h3');
    header.innerHTML = '<i class="fas fa-question-circle"></i> Help & Support';
    
    // Add content
    const content = document.createElement('div');
    content.innerHTML = `
        <p style="margin-bottom: 1.5rem; color: var(--text-secondary, #b3b3b3);">
            How can we help you today? Choose one of the options below:
        </p>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
            <button class="support-option" data-type="hr" style="background: rgba(0,0,0,0.2); border: none; color: white; padding: 1rem; border-radius: 8px; cursor: pointer; text-align: center;">
                <i class="fas fa-users" style="font-size: 2rem; color: var(--primary-color, #1db954); margin-bottom: 0.5rem; display: block;"></i>
                Contact HR
            </button>
            
            <button class="support-option" data-type="it" style="background: rgba(0,0,0,0.2); border: none; color: white; padding: 1rem; border-radius: 8px; cursor: pointer; text-align: center;">
                <i class="fas fa-laptop-medical" style="font-size: 2rem; color: var(--primary-color, #1db954); margin-bottom: 0.5rem; display: block;"></i>
                IT Support
            </button>
            
            <button class="support-option" data-type="training" style="background: rgba(0,0,0,0.2); border: none; color: white; padding: 1rem; border-radius: 8px; cursor: pointer; text-align: center;">
                <i class="fas fa-graduation-cap" style="font-size: 2rem; color: var(--primary-color, #1db954); margin-bottom: 0.5rem; display: block;"></i>
                Training
            </button>
            
            <button class="support-option" data-type="faq" style="background: rgba(0,0,0,0.2); border: none; color: white; padding: 1rem; border-radius: 8px; cursor: pointer; text-align: center;">
                <i class="fas fa-book" style="font-size: 2rem; color: var(--primary-color, #1db954); margin-bottom: 0.5rem; display: block;"></i>
                FAQ
            </button>
        </div>
    `;
    
    // Add cancel button
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Close';
    cancelButton.style.padding = '0.6rem 1.2rem';
    cancelButton.style.borderRadius = '6px';
    cancelButton.style.background = 'rgba(255,255,255,0.1)';
    cancelButton.style.color = 'white';
    cancelButton.style.border = 'none';
    cancelButton.style.cursor = 'pointer';
    cancelButton.style.display = 'block';
    cancelButton.style.marginLeft = 'auto';
    
    // Add to modal
    modalContent.appendChild(header);
    modalContent.appendChild(content);
    modalContent.appendChild(cancelButton);
    modalContainer.appendChild(modalContent);
    
    // Add to body
    document.body.appendChild(modalContainer);
    
    // Add event listeners
    cancelButton.addEventListener('click', function() {
        modalContainer.remove();
    });
    
    // Support options
    const supportOptions = modalContent.querySelectorAll('.support-option');
    supportOptions.forEach(option => {
        option.addEventListener('click', function() {
            const type = this.dataset.type;
            modalContainer.remove();
            
            switch(type) {
                case 'hr':
                    openContactHRDialog();
                    break;
                case 'it':
                    showNotification('Opening IT support portal...', 'info');
                    setTimeout(() => {
                        window.open('/it-support', '_blank');
                    }, 500);
                    break;
                case 'training':
                    showNotification('Opening training portal...', 'info');
                    setTimeout(() => {
                        window.open('/training', '_blank');
                    }, 500);
                    break;
                case 'faq':
                    showNotification('Opening FAQ page...', 'info');
                    setTimeout(() => {
                        window.open('/faq', '_blank');
                    }, 500);
                    break;
            }
        });
    });
}

