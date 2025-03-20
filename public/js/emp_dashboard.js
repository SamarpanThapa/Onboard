// Initialize offboarding functionality
function initializeOffboarding() {
    console.log('Initializing offboarding functionality');
    
    const startOffboardingBtn = document.querySelector('.offboarding-section button.primary-button');
    const exitInterviewBtn = document.querySelector('.offboarding-section a[href="#exit-interview"]');
    const assetReturnBtn = document.querySelector('.offboarding-section a[href="#asset-return"]');
    const documentationBtn = document.querySelector('.offboarding-section a[href="#documentation"]');
    
    if (startOffboardingBtn) {
        startOffboardingBtn.addEventListener('click', function() {
            showOffboardingConfirmation();
        });
    }
    
    if (exitInterviewBtn) {
        exitInterviewBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showExitInterviewForm();
        });
    }
    
    if (assetReturnBtn) {
        assetReturnBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showAssetReturnForm();
        });
    }
    
    if (documentationBtn) {
        documentationBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showDocumentationForm();
        });
    }
    
    // Check if user has already started offboarding
    checkOffboardingStatus();
}

// Show confirmation modal before starting offboarding
function showOffboardingConfirmation() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Start Offboarding Process</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to start the offboarding process? This will notify HR and begin your exit procedures.</p>
                <div class="form-group">
                    <label for="offboarding-reason">Reason for leaving:</label>
                    <select id="offboarding-reason" required>
                        <option value="">Select a reason</option>
                        <option value="new-opportunity">New Job Opportunity</option>
                        <option value="relocation">Relocation</option>
                        <option value="retirement">Retirement</option>
                        <option value="personal">Personal Reasons</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="last-working-day">Last working day:</label>
                    <input type="date" id="last-working-day" required>
                </div>
            </div>
            <div class="modal-footer">
                <button class="secondary-button" id="cancel-offboarding">Cancel</button>
                <button class="primary-button" id="confirm-offboarding">Start Offboarding</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    // Handle modal close
    const closeBtn = modal.querySelector('.close');
    const cancelBtn = modal.querySelector('#cancel-offboarding');
    const confirmBtn = modal.querySelector('#confirm-offboarding');
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        modal.remove();
    });
    
    cancelBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        modal.remove();
    });
    
    confirmBtn.addEventListener('click', async () => {
        const reason = document.getElementById('offboarding-reason').value;
        const lastWorkingDay = document.getElementById('last-working-day').value;
        
        if (!reason || !lastWorkingDay) {
            alert('Please fill all required fields');
            return;
        }
        
        try {
            // Update user's offboarding status
            const userData = await getCurrentUser();
            const response = await fetch('/api/users/current', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    offboarding: {
                        status: 'in_progress',
                        reason: reason,
                        exitDate: lastWorkingDay
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to start offboarding process');
            }
            
            // Create notification for HR
            await fetch('/api/notifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    title: 'Offboarding Request',
                    message: `${userData.name} has initiated the offboarding process. Last working day: ${new Date(lastWorkingDay).toLocaleDateString()}`,
                    type: 'system',
                    category: 'offboarding',
                    recipients: ['hr_admin']
                })
            });
            
            // Close modal and show success message
            modal.style.display = 'none';
            modal.remove();
            
            // Show success message
            showNotification('Offboarding process started successfully', 'success');
            
            // Update UI to reflect status change
            checkOffboardingStatus();
            
        } catch (error) {
            console.error('Error starting offboarding:', error);
            alert('Error starting offboarding process. Please try again.');
        }
    });
}

// Show exit interview form
function showExitInterviewForm() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Exit Interview</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <p>Please share your feedback about your experience with the company.</p>
                <form id="exit-interview-form">
                    <div class="form-group">
                        <label for="overall-experience">How would you rate your overall experience?</label>
                        <div class="rating-container">
                            <div class="rating">
                                <input type="radio" id="star5" name="overallExperience" value="5" />
                                <label for="star5">5</label>
                                <input type="radio" id="star4" name="overallExperience" value="4" />
                                <label for="star4">4</label>
                                <input type="radio" id="star3" name="overallExperience" value="3" />
                                <label for="star3">3</label>
                                <input type="radio" id="star2" name="overallExperience" value="2" />
                                <label for="star2">2</label>
                                <input type="radio" id="star1" name="overallExperience" value="1" />
                                <label for="star1">1</label>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="reason-for-leaving">Primary reason for leaving:</label>
                        <select id="reason-for-leaving" name="reasonForLeaving" required>
                            <option value="">Select a reason</option>
                            <option value="new-opportunity">New Job Opportunity</option>
                            <option value="relocation">Relocation</option>
                            <option value="work-life-balance">Work-Life Balance</option>
                            <option value="career-growth">Career Growth</option>
                            <option value="compensation">Compensation</option>
                            <option value="company-culture">Company Culture</option>
                            <option value="management">Management Issues</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="management-feedback">Feedback about management:</label>
                        <textarea id="management-feedback" name="managementFeedback" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="work-environment">Feedback about work environment:</label>
                        <textarea id="work-environment" name="workEnvironment" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="what-did-you-like">What did you like most about working here?</label>
                        <textarea id="what-did-you-like" name="whatDidYouLike" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="what-could-improve">What could be improved?</label>
                        <textarea id="what-could-improve" name="whatCouldImprove" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="additional-comments">Additional comments:</label>
                        <textarea id="additional-comments" name="additionalComments" rows="3"></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="secondary-button" id="cancel-exit-interview">Cancel</button>
                <button class="primary-button" id="submit-exit-interview">Submit</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    // Handle modal close
    const closeBtn = modal.querySelector('.close');
    const cancelBtn = modal.querySelector('#cancel-exit-interview');
    const submitBtn = modal.querySelector('#submit-exit-interview');
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        modal.remove();
    });
    
    cancelBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        modal.remove();
    });
    
    submitBtn.addEventListener('click', async () => {
        const form = document.getElementById('exit-interview-form');
        const formData = new FormData(form);
        
        // Validate form
        const overallExperience = formData.get('overallExperience');
        const reasonForLeaving = formData.get('reasonForLeaving');
        
        if (!overallExperience || !reasonForLeaving) {
            alert('Please rate your experience and select a reason for leaving');
            return;
        }
        
        try {
            // Convert form data to JSON
            const exitInterviewData = {
                employeeId: getCurrentUserId(),
                overallExperience: parseInt(overallExperience),
                reasonForLeaving: reasonForLeaving,
                comments: JSON.stringify({
                    managementFeedback: formData.get('managementFeedback'),
                    workEnvironment: formData.get('workEnvironment'),
                    whatDidYouLike: formData.get('whatDidYouLike'),
                    whatCouldImprove: formData.get('whatCouldImprove'),
                    additionalComments: formData.get('additionalComments')
                })
            };
            
            // Submit exit interview
            const response = await fetch('/api/feedback/exit-interview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(exitInterviewData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to submit exit interview');
            }
            
            // Close modal and show success message
            modal.style.display = 'none';
            modal.remove();
            
            showNotification('Exit interview submitted successfully', 'success');
            
            // Mark exit interview as completed
            updateExitInterviewStatus(true);
            
        } catch (error) {
            console.error('Error submitting exit interview:', error);
            alert('Error submitting exit interview. Please try again.');
        }
    });
}

// Show asset return form
function showAssetReturnForm() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Asset Return</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <p>Please indicate which company assets you need to return.</p>
                <form id="asset-return-form">
                    <div class="form-group">
                        <label>Select assets to return:</label>
                        <div class="checkbox-group">
                            <div class="checkbox-item">
                                <input type="checkbox" id="laptop" name="laptop">
                                <label for="laptop">Laptop</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="mobile" name="mobile">
                                <label for="mobile">Mobile Phone</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="access-card" name="accessCard">
                                <label for="access-card">Access Card/Badge</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="other-equipment" name="otherEquipment">
                                <label for="other-equipment">Other Equipment</label>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="other-assets">Other assets (please specify):</label>
                        <textarea id="other-assets" name="otherAssets" rows="2"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="return-date">Planned return date:</label>
                        <input type="date" id="return-date" name="returnDate" required>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="secondary-button" id="cancel-asset-return">Cancel</button>
                <button class="primary-button" id="submit-asset-return">Submit</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    // Handle modal close
    const closeBtn = modal.querySelector('.close');
    const cancelBtn = modal.querySelector('#cancel-asset-return');
    const submitBtn = modal.querySelector('#submit-asset-return');
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        modal.remove();
    });
    
    cancelBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        modal.remove();
    });
    
    submitBtn.addEventListener('click', async () => {
        const form = document.getElementById('asset-return-form');
        const formData = new FormData(form);
        
        // Validate form
        const returnDate = formData.get('returnDate');
        if (!returnDate) {
            alert('Please select a return date');
            return;
        }
        
        try {
            // Get selected assets
            const assets = [];
            if (formData.get('laptop')) assets.push({ assetName: 'Laptop', returnStatus: 'pending' });
            if (formData.get('mobile')) assets.push({ assetName: 'Mobile Phone', returnStatus: 'pending' });
            if (formData.get('accessCard')) assets.push({ assetName: 'Access Card/Badge', returnStatus: 'pending' });
            if (formData.get('otherEquipment')) assets.push({ assetName: 'Other Equipment', returnStatus: 'pending' });
            
            const otherAssets = formData.get('otherAssets');
            if (otherAssets) {
                assets.push({ assetName: otherAssets, returnStatus: 'pending' });
            }
            
            // Update user's asset return status
            const response = await fetch('/api/users/current', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    offboarding: {
                        companyAssetsReturned: assets
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to submit asset return request');
            }
            
            // Create notification for IT
            const userData = await getCurrentUser();
            await fetch('/api/notifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    title: 'Asset Return Request',
                    message: `${userData.name} has submitted an asset return request for ${assets.length} items. Planned return date: ${new Date(returnDate).toLocaleDateString()}`,
                    type: 'system',
                    category: 'asset_return',
                    recipients: ['it_admin']
                })
            });
            
            // Close modal and show success message
            modal.style.display = 'none';
            modal.remove();
            
            showNotification('Asset return request submitted successfully', 'success');
            
        } catch (error) {
            console.error('Error submitting asset return request:', error);
            alert('Error submitting asset return request. Please try again.');
        }
    });
}

// Show documentation form
function showDocumentationForm() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Offboarding Documentation</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <p>Please upload any required documentation for your offboarding process.</p>
                <form id="documentation-form">
                    <div class="form-group">
                        <label for="handover-doc">Knowledge Transfer/Handover Document:</label>
                        <input type="file" id="handover-doc" name="handoverDoc">
                    </div>
                    <div class="form-group">
                        <label for="exit-checklist">Exit Checklist:</label>
                        <input type="file" id="exit-checklist" name="exitChecklist">
                    </div>
                    <div class="form-group">
                        <label for="final-timesheet">Final Timesheet (if applicable):</label>
                        <input type="file" id="final-timesheet" name="finalTimesheet">
                    </div>
                    <div class="form-group">
                        <label for="doc-notes">Additional notes:</label>
                        <textarea id="doc-notes" name="docNotes" rows="3"></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="secondary-button" id="cancel-documentation">Cancel</button>
                <button class="primary-button" id="submit-documentation">Submit</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    // Handle modal close
    const closeBtn = modal.querySelector('.close');
    const cancelBtn = modal.querySelector('#cancel-documentation');
    const submitBtn = modal.querySelector('#submit-documentation');
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        modal.remove();
    });
    
    cancelBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        modal.remove();
    });
    
    submitBtn.addEventListener('click', async () => {
        const form = document.getElementById('documentation-form');
        const formData = new FormData(form);
        
        try {
            // Upload documents
            const response = await fetch('/api/documents/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('Failed to upload documentation');
            }
            
            // Create notification for HR
            const userData = await getCurrentUser();
            await fetch('/api/notifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    title: 'Offboarding Documentation Submitted',
                    message: `${userData.name} has submitted offboarding documentation.`,
                    type: 'system',
                    category: 'document',
                    recipients: ['hr_admin']
                })
            });
            
            // Close modal and show success message
            modal.style.display = 'none';
            modal.remove();
            
            showNotification('Documentation submitted successfully', 'success');
            
        } catch (error) {
            console.error('Error submitting documentation:', error);
            alert('Error submitting documentation. Please try again.');
        }
    });
}

// Check if user has already started offboarding
async function checkOffboardingStatus() {
    try {
        const userData = await getCurrentUser();
        
        if (userData.offboarding && userData.offboarding.status) {
            const offboardingSection = document.querySelector('.offboarding-section');
            const startOffboardingBtn = document.querySelector('.offboarding-section button.primary-button');
            
            // Update UI based on offboarding status
            if (offboardingSection) {
                if (userData.offboarding.status === 'in_progress') {
                    // Show status badge
                    const statusBadge = document.createElement('div');
                    statusBadge.className = 'status-badge in-progress';
                    statusBadge.textContent = 'In Progress';
                    offboardingSection.querySelector('h2').appendChild(statusBadge);
                    
                    // Update button text
                    if (startOffboardingBtn) {
                        startOffboardingBtn.textContent = 'Continue Offboarding';
                    }
                } else if (userData.offboarding.status === 'completed') {
                    // Show completed status
                    const statusBadge = document.createElement('div');
                    statusBadge.className = 'status-badge completed';
                    statusBadge.textContent = 'Completed';
                    offboardingSection.querySelector('h2').appendChild(statusBadge);
                    
                    // Disable button
                    if (startOffboardingBtn) {
                        startOffboardingBtn.disabled = true;
                        startOffboardingBtn.textContent = 'Offboarding Completed';
                    }
                }
            }
            
            // Check exit interview status
            if (userData.offboarding.exitInterviewCompleted) {
                updateExitInterviewStatus(true);
            }
        }
    } catch (error) {
        console.error('Error checking offboarding status:', error);
    }
}

// Update exit interview status in UI
function updateExitInterviewStatus(completed) {
    const exitInterviewLink = document.querySelector('.offboarding-section a[href="#exit-interview"]');
    if (exitInterviewLink) {
        if (completed) {
            exitInterviewLink.innerHTML = '<i class="fas fa-check-circle completed"></i> Exit Interview (Completed)';
            exitInterviewLink.classList.add('completed');
        }
    }
}

// Helper function to get current user ID
function getCurrentUserId() {
    const userData = JSON.parse(localStorage.getItem('user'));
    return userData ? userData._id : null;
}

// Get current user data
async function getCurrentUser() {
    try {
        // First try to get from localStorage
        const userData = JSON.parse(localStorage.getItem('user')) || {};
        
        // If we have the cached user data, return it
        if (userData && userData.name) {
            return userData;
        }
        
        // Otherwise, fetch from API
        const response = await fetch('/api/users/current', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }
        
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error getting user data:', error);
        // Return minimal user data from localStorage as fallback
        return JSON.parse(localStorage.getItem('user')) || {};
    }
}

// Initialize feedback functionality
function initializeFeedback() {
    console.log('Initializing feedback functionality');
    
    const provideFeedbackBtn = document.getElementById('provide-feedback');
    
    if (provideFeedbackBtn) {
        provideFeedbackBtn.addEventListener('click', function() {
            showFeedbackForm();
        });
    }
}

// Show feedback form modal
function showFeedbackForm() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Provide Feedback</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <p>Your feedback helps us improve our onboarding experience. Please share your thoughts.</p>
                <form id="feedback-form">
                    <div class="form-group">
                        <label for="feedback-rating">Overall experience rating:</label>
                        <div class="rating-container">
                            <div class="rating">
                                <input type="radio" id="star5" name="rating" value="5" />
                                <label for="star5">5</label>
                                <input type="radio" id="star4" name="rating" value="4" />
                                <label for="star4">4</label>
                                <input type="radio" id="star3" name="rating" value="3" />
                                <label for="star3">3</label>
                                <input type="radio" id="star2" name="rating" value="2" />
                                <label for="star2">2</label>
                                <input type="radio" id="star1" name="rating" value="1" />
                                <label for="star1">1</label>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="feedback-category">Feedback category:</label>
                        <select id="feedback-category" name="category" required>
                            <option value="onboarding">Onboarding Process</option>
                            <option value="system">System Usability</option>
                            <option value="support">Support Services</option>
                            <option value="documentation">Documentation</option>
                            <option value="general">General</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="feedback-comments">Your feedback:</label>
                        <textarea id="feedback-comments" name="comments" rows="5" placeholder="Please share your experience, suggestions, or concerns..." required></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="secondary-button" id="cancel-feedback">Cancel</button>
                <button class="primary-button" id="submit-feedback">Submit Feedback</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    // Handle modal close
    const closeBtn = modal.querySelector('.close');
    const cancelBtn = modal.querySelector('#cancel-feedback');
    const submitBtn = modal.querySelector('#submit-feedback');
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        modal.remove();
    });
    
    cancelBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        modal.remove();
    });
    
    submitBtn.addEventListener('click', async () => {
        const form = document.getElementById('feedback-form');
        const rating = form.querySelector('input[name="rating"]:checked')?.value;
        const category = document.getElementById('feedback-category').value;
        const comments = document.getElementById('feedback-comments').value;
        
        if (!rating || !comments) {
            alert('Please provide a rating and your feedback');
            return;
        }
        
        try {
            // Show loading state
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
            submitBtn.disabled = true;
            
            // Get user data for the notification
            const userData = await getCurrentUser();
            
            // Submit feedback
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    rating: parseInt(rating),
                    category,
                    comments
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to submit feedback');
            }
            
            console.log('Feedback submitted successfully');
            
            // Close modal and show success message
            modal.style.display = 'none';
            modal.remove();
            
            // Show success message
            showNotification('Thank you for your feedback! Your input helps us improve.', 'success');
            
        } catch (error) {
            console.error('Error submitting feedback:', error);
            showNotification('Error submitting feedback: ' + error.message, 'error');
        } finally {
            // Reset button state
            submitBtn.innerHTML = 'Submit Feedback';
            submitBtn.disabled = false;
        }
    });
}

// Show notification
function showNotification(message, type = 'info') {
    const notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
        // Create notification container if it doesn't exist
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'notification-container';
        document.body.appendChild(container);
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Set icon based on type
    let iconClass = 'fa-info-circle';
    if (type === 'success') iconClass = 'fa-check-circle';
    if (type === 'error') iconClass = 'fa-exclamation-circle';
    if (type === 'warning') iconClass = 'fa-exclamation-triangle';
    
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas ${iconClass}"></i>
        </div>
        <div class="notification-content">
            <p>${message}</p>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    });
    
    // Add to container
    document.getElementById('notification-container').appendChild(notification);
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Initialize offboarding when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // ... existing code ...
    
    // Initialize feedback functionality
    initializeFeedback();
    
    // Initialize offboarding functionality
    initializeOffboarding();
}); 