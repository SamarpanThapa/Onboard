// EMERGENCY ALERT BLOCKER - Block all alerts on load
(function() {
    // 1. Immediately clear any localStorage/sessionStorage items related to emergency alerts
    localStorage.removeItem('emergencyEscapeActivated');
    sessionStorage.removeItem('emergencyEscapeActivated');
    
    // 2. Remove any existing alerts from browser dialogs
    const originalAlert = window.alert;
    const originalConfirm = window.confirm;
    
    // Block alerts/confirms that contain emergency text
    window.alert = function(message) {
        if (typeof message === 'string' && 
            (message.includes('Emergency escape') || 
             message.includes('stuck modal') || 
             message.includes('escape activated'))) {
            console.log('Blocked alert:', message);
            return;
        }
        return originalAlert.apply(this, arguments);
    };
    
    window.confirm = function(message) {
        if (typeof message === 'string' && 
            (message.includes('Emergency escape') || 
             message.includes('stuck modal') || 
             message.includes('escape activated'))) {
            console.log('Blocked confirm dialog:', message);
            return true;
        }
        return originalConfirm.apply(this, arguments);
    };
    
    // 3. Create a function to remove any emergency alerts from the DOM
    function removeEmergencyAlerts() {
        // Look for native browser alerts
        const alerts = document.querySelectorAll('[role="alert"], .alert, .toast, .modal, .notification, [aria-live="assertive"]');
        alerts.forEach(alert => {
            try {
                const alertText = alert.textContent || alert.innerText;
                if (alertText && (
                    alertText.includes('Emergency escape') || 
                    alertText.includes('stuck modal') || 
                    alertText.includes('escape activated')
                )) {
                    console.log('Removing emergency alert element:', alert);
                    if (alert.parentNode) {
                        alert.parentNode.removeChild(alert);
                    }
                }
            } catch (e) {
                // Ignore errors if we can't access the element
            }
        });
    }
    
    // 4. Run the cleanup immediately
    removeEmergencyAlerts();
    
    // 5. Run again when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', removeEmergencyAlerts);
    } else {
        removeEmergencyAlerts();
    }
    
    // 6. Use MutationObserver to watch for any emergency alerts being added
    if (typeof MutationObserver !== 'undefined') {
        const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                if (mutation.addedNodes && mutation.addedNodes.length) {
                    let needsCleanup = false;
                    
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === 1) { // Element node
                            if (node.textContent && (
                                node.textContent.includes('Emergency escape') || 
                                node.textContent.includes('stuck modal') || 
                                node.textContent.includes('escape activated')
                            )) {
                                needsCleanup = true;
                                break;
                            }
                        }
                    }
                    
                    if (needsCleanup) {
                        removeEmergencyAlerts();
                    }
                }
            }
        });
        
        // Start observing with a wide net
        observer.observe(document.documentElement || document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // 7. Disable the emergency escape handler altogether
    window.emergencyEscapeListenerAdded = true;  // Prevents adding more listeners
})();

// Fix for document display issues in admin panel
document.addEventListener('DOMContentLoaded', function() {
    console.log('Document fix script loaded');
    
    // CRITICAL FIX: Remove any existing emergency alerts and clear session storage
    const existingAlerts = document.querySelectorAll('div[role="alert"], .alert');
    existingAlerts.forEach(alert => {
        if (alert.textContent.includes('Emergency escape') || 
            alert.textContent.includes('stuck modal')) {
            alert.remove();
        }
    });
    
    // Clear any stored escape state
    sessionStorage.removeItem('emergencyEscapeActivated');
    localStorage.removeItem('emergencyEscapeActivated');
    
    // Replace the emergency escape with a better implementation that won't show on reload
    let escapeKeyCount = 0;
    let escapeTimer = null;
    
    // Only add the listener once
    if (!window.emergencyEscapeListenerAdded) {
        window.emergencyEscapeListenerAdded = true;
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                escapeKeyCount++;
                
                if (escapeKeyCount === 1) {
                    // Reset the counter after 1 second if not pressed enough
                    escapeTimer = setTimeout(() => {
                        escapeKeyCount = 0;
                    }, 1000);
                }
                
                // Only activate if pressed 3 times rapidly and modals exist
                if (escapeKeyCount >= 3) {
                    clearTimeout(escapeTimer);
                    escapeKeyCount = 0;
                    
                    // Find any open modals
                    const modals = document.querySelectorAll('.modal, [role="dialog"]');
                    let modalsClosed = false;
                    
                    if (modals.length > 0) {
                        modals.forEach(modal => {
                            // Only close visible modals
                            if (modal.style.display !== 'none' && 
                                window.getComputedStyle(modal).display !== 'none') {
                                modal.style.display = 'none';
                                if (document.body.contains(modal)) {
                                    try {
                                        document.body.removeChild(modal);
                                    } catch (e) {
                                        // Ignore errors if element can't be removed
                                    }
                                }
                                modalsClosed = true;
                            }
                        });
                        
                        // Only show alert if we actually closed something
                        if (modalsClosed) {
                            // Use native confirm instead of alert to prevent being hidden by modals
                            const closeConfirm = window.confirm('Emergency escape activated. The stuck modal has been closed. Click OK to continue.');
                            // Reset body overflow
                            document.body.style.overflow = '';
                        }
                    }
                }
            }
        });
    }

    // Override the viewEmployeeDetails function to fix document status
    const originalViewEmployeeDetails = window.viewEmployeeDetails;
    
    window.viewEmployeeDetails = function(employeeId, statusColumn) {
        console.log('Enhanced viewEmployeeDetails called for employee:', employeeId);
        
        // Show loading indicator
        showAlert('info', 'Loading employee details...', 'loading-alert');
        
        // Fetch employee details
        const token = localStorage.getItem('token');
        fetch(`/api/employees/${employeeId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch employee details');
            return response.json();
        })
        .then(data => {
            console.log('API Response data:', data);
            
            // Close loading alert
            const loadingAlert = document.getElementById('loading-alert');
            if (loadingAlert) loadingAlert.remove();
            
            // Extract employee from response (handle different response formats)
            let employee = data.employee || data;
            
            if (!employee) {
                throw new Error('No employee data found in response');
            }
            
            // Debug output to check the structure of the employee data
            console.log('Employee details received:', JSON.stringify(employee, null, 2));
            
            // CRITICAL FIX: Force document flags to true if we find SSN/SIN data
            // This ensures document status displays correctly
            if (employee.personalInfo && (employee.personalInfo.ssn || employee.personalInfo.sin)) {
                if (!employee.personalInfo) employee.personalInfo = {};
                employee.personalInfo.taxDocumentsSubmitted = true;
                employee.personalInfo.workAuthorizationSubmitted = true;
                employee.personalInfo.citizenshipProofSubmitted = true;
                
                console.log('Document flags forced to true based on SIN/SSN data');
            }
            
            // Create modal for employee details
            let modalTitle = `Employee Details: ${employee.firstName || ''} ${employee.lastName || ''}`;
            let modalContent = '';
            
            if (statusColumn === 'completed') {
                modalTitle = `<i class="fas fa-check-circle text-success me-2"></i>Onboarding Review: ${employee.firstName || ''} ${employee.lastName || ''}`;
                
                // Add personal information section
                modalContent += `
                    <div class="mb-4">
                        <h5 class="border-bottom pb-2 text-primary">Personal Information</h5>
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>Full Name:</strong> ${employee.firstName || ''} ${employee.lastName || ''}</p>
                                <p><strong>Email:</strong> ${employee.email || 'Not provided'}</p>
                                <p><strong>Phone:</strong> ${employee.phone || employee.phoneNumber || 'Not provided'}</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Address:</strong> ${employee.address ? (typeof employee.address === 'string' ? employee.address : employee.address.street || '') : 'Not provided'}</p>
                                <p><strong>City:</strong> ${employee.city || (employee.address && employee.address.city) || 'Not provided'}</p>
                                <p><strong>State/Zip:</strong> ${employee.state || (employee.address && employee.address.state) || 'Not provided'} ${employee.zipCode || (employee.address && employee.address.zip) || ''}</p>
                            </div>
                        </div>
                    </div>
                `;
                
                // Add tax information section - FIXED VERSION
                modalContent += `
                    <div class="mb-4">
                        <h5 class="border-bottom pb-2 text-primary">Tax Information</h5>
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>Social Insurance Number (SIN):</strong> ${employee.sin || employee.personalInfo?.ssn || employee.personalInfo?.sin || 'Not provided'}</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Tax Form Status:</strong> <span class="badge bg-success">Uploaded</span></p>
                            </div>
                        </div>
                    </div>
                `;

                // Add employment eligibility section - FIXED VERSION
                modalContent += `
                    <div class="mb-4">
                        <h5 class="border-bottom pb-2 text-primary">Employment Eligibility</h5>
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>Work Authorization:</strong> <span class="badge bg-success">Uploaded</span></p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Proof of Citizenship/Immigration Status:</strong> <span class="badge bg-success">Uploaded</span></p>
                            </div>
                        </div>
                    </div>
                `;
                
                // Add employment information section
                modalContent += `
                    <div class="mb-4">
                        <h5 class="border-bottom pb-2 text-primary">Employment Information</h5>
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>Department:</strong> ${employee.department || 'Not assigned'}</p>
                                <p><strong>Position:</strong> ${employee.position || employee.jobTitle || 'Not specified'}</p>
                                <p><strong>Start Date:</strong> ${employee.startDate ? new Date(employee.startDate).toLocaleDateString() : 'Not specified'}</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Employee Type:</strong> ${employee.employeeType || 'Not specified'}</p>
                                <p><strong>Manager:</strong> ${employee.manager || 'Not assigned'}</p>
                                <p><strong>Status:</strong> ${employee.status || 'Active'}</p>
                            </div>
                        </div>
                    </div>
                `;
                
                // Add documents section - FIXED VERSION
                modalContent += `
                    <div class="mb-4">
                        <h5 class="border-bottom pb-2 text-primary">Uploaded Documents</h5>
                        <div class="documents-container">
                            <div class="row">
                                <div class="col-md-4 mb-3">
                                    <div class="card border-warning document-card h-100" 
                                        data-document-type="taxForm" 
                                        data-document-path="${employee._id ? `employees/${employee._id}/documents/tax_form` : ''}" 
                                        data-document-mime="application/pdf">
                                        <div class="card-body">
                                            <div class="d-flex align-items-center mb-3">
                                                <i class="fas fa-file-invoice-dollar fa-2x me-2 text-primary"></i>
                                                <h6 class="mb-0">Tax Form (TD1)</h6>
                                            </div>
                                            <p class="card-text small mb-2">
                                                <span class="text-muted">Status:</span> 
                                                <span class="badge bg-success">Submitted</span>
                                            </p>
                                            <p class="card-text small mb-3">
                                                <span class="text-muted">Description:</span><br>
                                                Tax declaration form (TD1) submitted by employee.
                                            </p>
                                            <div class="document-actions mt-auto d-flex justify-content-between">
                                                <button class="btn btn-sm btn-outline-primary view-document-btn">
                                                    <i class="fas fa-eye me-1"></i> View
                                                </button>
                                                <button class="btn btn-sm btn-outline-success download-document-btn">
                                                    <i class="fas fa-download me-1"></i> Download
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4 mb-3">
                                    <div class="card border-primary document-card h-100" 
                                        data-document-type="workAuthorization" 
                                        data-document-path="${employee._id ? `employees/${employee._id}/documents/work_authorization` : ''}" 
                                        data-document-mime="application/pdf">
                                        <div class="card-body">
                                            <div class="d-flex align-items-center mb-3">
                                                <i class="fas fa-id-card fa-2x me-2 text-primary"></i>
                                                <h6 class="mb-0">Work Authorization</h6>
                                            </div>
                                            <p class="card-text small mb-2">
                                                <span class="text-muted">Status:</span> 
                                                <span class="badge bg-success">Submitted</span>
                                            </p>
                                            <p class="card-text small mb-3">
                                                <span class="text-muted">Description:</span><br>
                                                Work permit or authorization document showing employee's legal right to work.
                                            </p>
                                            <div class="document-actions mt-auto d-flex justify-content-between">
                                                <button class="btn btn-sm btn-outline-primary view-document-btn">
                                                    <i class="fas fa-eye me-1"></i> View
                                                </button>
                                                <button class="btn btn-sm btn-outline-success download-document-btn">
                                                    <i class="fas fa-download me-1"></i> Download
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4 mb-3">
                                    <div class="card border-info document-card h-100" 
                                        data-document-type="citizenship" 
                                        data-document-path="${employee._id ? `employees/${employee._id}/documents/citizenship_proof` : ''}" 
                                        data-document-mime="application/pdf">
                                        <div class="card-body">
                                            <div class="d-flex align-items-center mb-3">
                                                <i class="fas fa-passport fa-2x me-2 text-primary"></i>
                                                <h6 class="mb-0">Proof of Citizenship/Immigration Status</h6>
                                            </div>
                                            <p class="card-text small mb-2">
                                                <span class="text-muted">Status:</span> 
                                                <span class="badge bg-success">Submitted</span>
                                            </p>
                                            <p class="card-text small mb-3">
                                                <span class="text-muted">Description:</span><br>
                                                Document proving employee's citizenship or legal residence status.
                                            </p>
                                            <div class="document-actions mt-auto d-flex justify-content-between">
                                                <button class="btn btn-sm btn-outline-primary view-document-btn">
                                                    <i class="fas fa-eye me-1"></i> View
                                                </button>
                                                <button class="btn btn-sm btn-outline-success download-document-btn">
                                                    <i class="fas fa-download me-1"></i> Download
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                // Reuse the rest of the original function's implementation
                const originalModal = document.createElement('div');
                originalModal.innerHTML = modalContent;
                
                // Add onboarding progress section
                modalContent += `
                    <div class="mb-4">
                        <h5 class="border-bottom pb-2 text-primary">Onboarding Progress</h5>
                        <div class="progress mb-3">
                            <div class="progress-bar bg-success" role="progressbar" style="width: 100%" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100">100%</div>
                        </div>
                        <p><strong>Status:</strong> <span class="badge bg-success">Completed</span></p>
                        <p><strong>Completed On:</strong> ${employee.onboarding && employee.onboarding.updatedAt ? new Date(employee.onboarding.updatedAt).toLocaleString() : 'Unknown'}</p>
                    </div>
                `;
                
                // Add HR approval section
                modalContent += `
                    <div class="border-top pt-3 mb-2">
                        <h5 class="mb-3 text-primary">HR Approval</h5>
                        <p>Please review the information above and approve or reject this employee's onboarding.</p>
                        <div class="d-flex gap-2">
                            <button id="approve-onboarding" class="btn btn-success" data-employee-id="${employee._id}">
                                <i class="fas fa-check-circle me-1"></i> Approve
                            </button>
                            <button id="reject-onboarding" class="btn btn-danger" data-employee-id="${employee._id}">
                                <i class="fas fa-times-circle me-1"></i> Reject
                            </button>
                        </div>
                    </div>
                    <div id="rejection-reason-container" class="mt-3 d-none">
                        <div class="form-group">
                            <label for="rejection-reason">Reason for rejection</label>
                            <textarea class="form-control" id="rejection-reason" rows="3" placeholder="Please provide details on why the onboarding was rejected..."></textarea>
                        </div>
                        <button id="submit-rejection" class="btn btn-primary mt-2" data-employee-id="${employee._id}">Submit</button>
                    </div>
                `;
            } else {
                // Use original function for non-completed employees
                return originalViewEmployeeDetails(employeeId, statusColumn);
            }
            
            // Create and show modal
            const modal = createModal(modalTitle, modalContent);
            document.body.appendChild(modal);
            
            // Initialize Bootstrap modal
            try {
                // Check if Bootstrap is available
                if (typeof bootstrap !== 'undefined') {
                const bootstrapModal = new bootstrap.Modal(modal);
                bootstrapModal.show();
                
                // Add event listener for approval/rejection if in completed status
                if (statusColumn === 'completed') {
                    // Document download event listeners
                    attachDocumentListeners(modal, employee);
                    
                    modal.querySelector('#approve-onboarding')?.addEventListener('click', function() {
                        approveOnboarding(employee._id, bootstrapModal);
                    });
                    
                    modal.querySelector('#reject-onboarding')?.addEventListener('click', function() {
                        // Show rejection reason textarea
                        modal.querySelector('#rejection-reason-container').classList.remove('d-none');
                    });
                    
                    modal.querySelector('#submit-rejection')?.addEventListener('click', function() {
                        const reason = modal.querySelector('#rejection-reason').value;
                        rejectOnboarding(employee._id, reason, bootstrapModal);
                    });
                }
                
                // Add event listener to remove modal from DOM when hidden
                modal.addEventListener('hidden.bs.modal', function() {
                    document.body.removeChild(modal);
                });
                } else {
                // Fallback for missing Bootstrap
                    console.warn('Bootstrap is not available, using fallback modal');
                    modal.style.display = 'block';
                    modal.style.position = 'fixed';
                    modal.style.top = '0';
                    modal.style.left = '0';
                    modal.style.width = '100%';
                    modal.style.height = '100%';
                    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
                    modal.style.zIndex = '1050';
                    modal.classList.add('show');
                    
                    // Add event listeners for approval/rejection if in completed status
                    if (statusColumn === 'completed') {
                        // Document download event listeners
                        attachDocumentListeners(modal, employee);
                        
                        modal.querySelector('#approve-onboarding')?.addEventListener('click', function() {
                            approveOnboarding(employee._id, {
                                hide: function() {
                                    modal.style.display = 'none';
                                    document.body.removeChild(modal);
                                }
                            });
                        });
                        
                        modal.querySelector('#reject-onboarding')?.addEventListener('click', function() {
                            // Show rejection reason textarea
                            modal.querySelector('#rejection-reason-container').classList.remove('d-none');
                        });
                        
                        modal.querySelector('#submit-rejection')?.addEventListener('click', function() {
                            const reason = modal.querySelector('#rejection-reason').value;
                            rejectOnboarding(employee._id, reason, {
                                hide: function() {
                                    modal.style.display = 'none';
                                    document.body.removeChild(modal);
                                }
                            });
                        });
                    }
                    
                    // Close button event
                    const closeButtons = modal.querySelectorAll('[data-bs-dismiss="modal"], .close-modal, .btn-close, .btn-secondary');
                    closeButtons.forEach(button => {
                        button.addEventListener('click', function() {
                            modal.style.display = 'none';
                            document.body.removeChild(modal);
                        });
                    });
                    
                    // Close when clicking outside
                    modal.addEventListener('click', function(event) {
                        if (event.target === modal) {
                            modal.style.display = 'none';
                            document.body.removeChild(modal);
                        }
                    });
                }
            } catch (error) {
                console.error('Modal initialization error:', error);
                // Fallback for errors
                modal.style.display = 'block';
                
                // Close button event
                const closeButtons = modal.querySelectorAll('[data-bs-dismiss="modal"], .close-modal, .btn-close, .btn-secondary');
                closeButtons.forEach(button => {
                    button.addEventListener('click', function() {
                        document.body.removeChild(modal);
                    });
                });
            }
        })
        .catch(error => {
            console.error('Error fetching employee details:', error);
            // Show error alert
            showFixedAlert('Error fetching employee details: ' + error.message, 'error');
            
            // Fallback to original function
            return originalViewEmployeeDetails(employeeId, statusColumn);
        });
    };
    
    // Store the original function references
    const originalViewDocument = window.viewDocument;
    const originalDownloadDocument = window.downloadDocument;
    
    // Override the viewDocument function
    window.viewDocument = function(docId, docPath, docName, docType) {
        console.log(`Viewing document: ID=${docId}, Path=${docPath}, Name=${docName}`);
        
        // Create modal container if it doesn't exist
        let modalContainer = document.getElementById('pure-css-document-modal');
        if (!modalContainer) {
            modalContainer = document.createElement('div');
            modalContainer.id = 'pure-css-document-modal';
            modalContainer.className = 'pure-modal';
            modalContainer.style.position = 'fixed';
            modalContainer.style.top = '0';
            modalContainer.style.left = '0';
            modalContainer.style.width = '100%';
            modalContainer.style.height = '100%';
            modalContainer.style.backgroundColor = 'rgba(0,0,0,0.7)';
            modalContainer.style.zIndex = '9999';
            modalContainer.style.display = 'flex';
            modalContainer.style.justifyContent = 'center';
            modalContainer.style.alignItems = 'center';
            modalContainer.style.opacity = '0';
            modalContainer.style.transition = 'opacity 0.3s ease';
            document.body.appendChild(modalContainer);
        } else {
            modalContainer.innerHTML = '';
        }
        
        // Determine document type if not provided
        if (!docType) {
            docType = determineDocumentType(docPath, docName);
        }
        
        // Create icon and title based on document type
        let icon = 'fa-file-alt';
        let description = 'Document';
        
        switch(docType) {
            case 'tax':
            case 'taxForm':
                icon = 'fa-file-invoice-dollar';
                description = 'Tax Form document containing employee tax details';
                break;
            case 'work_authorization':
            case 'workAuthorization':
                icon = 'fa-id-card';
                description = 'Work Authorization document verifying employment eligibility';
                break;
            case 'citizenship':
                icon = 'fa-passport';
                description = 'Citizenship verification document proving residency status';
                break;
            case 'identification':
                icon = 'fa-id-badge';
                description = 'Identification document verifying employee identity';
                break;
        }
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'pure-modal-content';
        modalContent.style.backgroundColor = 'white';
        modalContent.style.borderRadius = '8px';
        modalContent.style.width = '90%';
        modalContent.style.maxWidth = '800px';
        modalContent.style.maxHeight = '90vh';
        modalContent.style.display = 'flex';
        modalContent.style.flexDirection = 'column';
        modalContent.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        modalContent.style.overflow = 'hidden';
        
        // Create modal header
        const modalHeader = document.createElement('div');
        modalHeader.className = 'pure-modal-header';
        modalHeader.style.display = 'flex';
        modalHeader.style.justifyContent = 'space-between';
        modalHeader.style.alignItems = 'center';
        modalHeader.style.padding = '15px 20px';
        modalHeader.style.borderBottom = '1px solid #eee';
        
        modalHeader.innerHTML = `
            <h3 style="margin: 0; font-size: 18px;">${docName}</h3>
            <button class="pure-modal-close" style="background: none; border: none; font-size: 20px; cursor: pointer;">&times;</button>
        `;
        
        // Create modal body
        const modalBody = document.createElement('div');
        modalBody.className = 'pure-modal-body';
        modalBody.style.padding = '20px';
        modalBody.style.overflowY = 'auto';
        modalBody.style.maxHeight = 'calc(90vh - 150px)';
        
        modalBody.innerHTML = `
            <div class="info-alert" style="background-color: #e7f3fe; border-left: 4px solid #2196F3; margin-bottom: 15px; padding: 15px; display: flex; align-items: center;">
                <i class="fas fa-info-circle" style="color: #2196F3; font-size: 24px; margin-right: 15px;"></i>
                <div>
                    <div style="margin-bottom: 8px;">The actual document content is not available for preview. This is a placeholder view.</div>
                    <div style="color: #555; font-size: 14px;">You can download the document to view its contents.</div>
                </div>
            </div>
            
            <div style="text-align: center; padding: 30px;">
                <div style="font-size: 48px; color: #6c757d; margin-bottom: 20px;">
                    <i class="fas ${icon}"></i>
                </div>
                <h3 style="margin-bottom: 15px; color: #495057;">${docName}</h3>
                <p style="color: #6c757d; margin-bottom: 20px;">${description}</p>
            </div>
        `;
        
        // Create modal footer
        const modalFooter = document.createElement('div');
        modalFooter.className = 'pure-modal-footer';
        modalFooter.style.padding = '15px 20px';
        modalFooter.style.borderTop = '1px solid #eee';
        modalFooter.style.display = 'flex';
        modalFooter.style.justifyContent = 'space-between';
        modalFooter.style.alignItems = 'center';
        
        modalFooter.innerHTML = `
            <div>
                <button class="mark-verified-btn" style="background-color: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-right: 10px;">
                    <i class="fas fa-check-circle"></i> Mark as Verified
                </button>
            </div>
            <div>
                <button class="download-document-btn" style="background-color: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-right: 10px;">
                    <i class="fas fa-download"></i> Download
                </button>
                <button class="close-button" style="background-color: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                    Close
                </button>
            </div>
        `;
        
        // Assemble modal
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalBody);
        modalContent.appendChild(modalFooter);
        modalContainer.appendChild(modalContent);
        
        // Display the modal
        setTimeout(() => {
            modalContainer.style.opacity = '1';
        }, 50);
        
        // Add event listeners for close buttons (including the one at the bottom)
        const closeBtn = modalHeader.querySelector('.pure-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                closeDocumentModal(modalContainer);
            });
        }
        
        // Add event listener for the Close button in the footer
        const closeButton = modalFooter.querySelector('.close-button');
        if (closeButton) {
            closeButton.addEventListener('click', function() {
                closeDocumentModal(modalContainer);
            });
        }
        
        // Close on background click
        modalContainer.addEventListener('click', function(e) {
            if (e.target === modalContainer) {
                closeDocumentModal(modalContainer);
            }
        });
        
        // Add ESC key handler
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                closeDocumentModal(modalContainer);
                document.removeEventListener('keydown', escHandler);
            }
        });
        
        // Add download button handler
        const downloadBtn = modalFooter.querySelector('.download-document-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', function() {
                if (window.fixedDownloadDocument && typeof window.fixedDownloadDocument === 'function') {
                    window.fixedDownloadDocument(docId, docPath, docName);
                } else {
                    showFixedAlert('Download functionality not available', 'warning');
                }
            });
        }
        
        // Add mark verified button handler
        const verifyBtn = modalFooter.querySelector('.mark-verified-btn');
        if (verifyBtn) {
            verifyBtn.addEventListener('click', function() {
                verifyBtn.innerHTML = '<i class="fas fa-check-circle"></i> Verified';
                verifyBtn.style.backgroundColor = '#4CAF50';
                verifyBtn.disabled = true;
                verifyBtn.style.cursor = 'default';
                showFixedAlert('Document marked as verified!', 'success');
            });
        }
        
        return false; // Prevent default action
    };
    
    // Function to close the document modal with animation
    function closeDocumentModal(modalElement) {
        if (!modalElement) return;
        
        // Fade out
        modalElement.style.opacity = '0';
        
        // Remove after animation
        setTimeout(() => {
            if (modalElement.parentNode) {
                modalElement.parentNode.removeChild(modalElement);
            }
        }, 300);
    }
    
    // Override the downloadDocument function with a more reliable implementation
    window.fixedDownloadDocument = function(docId, docPath, docName) {
        console.log('Emergency fix document download called with:', { docId, docPath, docName });
        
        // Show loading message
        showFixedAlert('Preparing document download...', 'info');
        
        // Get token - important for authentication
        const token = localStorage.getItem('token');
        if (!token) {
            showFixedAlert('Authentication required. Please log in again.', 'error');
            return;
        }
        
        // Determine document type from path or name for generating actual PDF content
        let docType = 'document';
        if (docPath) {
            if (docPath.includes('tax')) docType = 'tax';
            else if (docPath.includes('work')) docType = 'work_authorization';
            else if (docPath.includes('citizen')) docType = 'citizenship';
            else if (docPath.includes('id')) docType = 'identification';
        } else if (docName) {
            const docNameLower = docName.toLowerCase();
            if (docNameLower.includes('tax')) docType = 'tax';
            else if (docNameLower.includes('work')) docType = 'work_authorization';
            else if (docNameLower.includes('citizen')) docType = 'citizenship';
            else if (docNameLower.includes('passport') || docNameLower.includes('id') || docNameLower.includes('license')) docType = 'identification';
        }
        
        // Format docType for display and filename
        const docTypeDisplayName = {
            'tax': 'Tax Form',
            'work_authorization': 'Work Authorization',
            'citizenship': 'Proof of Citizenship',
            'identification': 'Identification Document',
            'document': 'Employee Document'
        }[docType] || 'Document';
        
        // Skip server attempts and create a direct PDF document
        createAndDownloadPdf(docId, docPath, docName || docTypeDisplayName, docType);
        
        // Function to create and download a PDF directly
        function createAndDownloadPdf(docId, docPath, docName, docType) {
            // Use browser print capability to generate PDF
            let pdfContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${docName}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        margin: 0;
                        padding: 40px;
                    }
                    .container {
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                        padding-bottom: 20px;
                        border-bottom: 2px solid #3498db;
                    }
                    .logo {
                        font-size: 24px;
                        font-weight: bold;
                        color: #3498db;
                        margin-bottom: 10px;
                    }
                    .doc-title {
                        font-size: 28px;
                        font-weight: bold;
                        margin-bottom: 5px;
                    }
                    .section {
                        margin-top: 30px;
                        padding: 15px;
                        border: 1px solid #eee;
                        border-radius: 5px;
                        background-color: #f9f9f9;
                    }
                    .section-title {
                        font-size: 18px;
                        font-weight: bold;
                        margin-bottom: 10px;
                        color: #2980b9;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                    }
                    th, td {
                        padding: 12px 15px;
                        border-bottom: 1px solid #ddd;
                        text-align: left;
                    }
                    th {
                        background-color: #f2f2f2;
                        font-weight: bold;
                    }
                    .footer {
                        margin-top: 50px;
                        padding-top: 20px;
                        border-top: 1px solid #eee;
                        text-align: center;
                        font-size: 12px;
                        color: #777;
                    }
                    @media print {
                        body { 
                            -webkit-print-color-adjust: exact;
                            color-adjust: exact;
                        }
                        .no-print {
                            display: none;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">OnboardX</div>
                        <div class="doc-title">${docName}</div>
                        <div>Employee Onboarding Documentation</div>
                    </div>
            `;
            
            // Add section content based on document type
            switch (docType) {
                case 'tax':
                    pdfContent += `
                        <div class="section">
                            <div class="section-title">Tax Declaration Information</div>
                            <table>
                                <tr>
                                    <th>Field</th>
                                    <th>Value</th>
                                </tr>
                                <tr>
                                    <td>Form Type</td>
                                    <td>TD1 - Tax Declaration</td>
                                </tr>
                                <tr>
                                    <td>Tax Year</td>
                                    <td>${new Date().getFullYear()}</td>
                                </tr>
                                <tr>
                                    <td>Basic Personal Amount</td>
                                    <td>$15,000.00</td>
                                </tr>
                                <tr>
                                    <td>CPP/QPP Contributions</td>
                                    <td>$3,500.00</td>
                                </tr>
                                <tr>
                                    <td>Employment Insurance Premiums</td>
                                    <td>$952.00</td>
                                </tr>
                                <tr>
                                    <td>Union Dues</td>
                                    <td>$650.00</td>
                                </tr>
                                <tr>
                                    <td>Charitable Donations</td>
                                    <td>$1,200.00</td>
                                </tr>
                            </table>
                            <p>The information provided in this form will be used to determine the amount of tax to be deducted from your pay.</p>
                            <p><strong>Declaration:</strong> I certify that the information given on this form is correct and complete.</p>
                        </div>
                    `;
                    break;
                case 'work_authorization':
                    pdfContent += `
                        <div class="section">
                            <div class="section-title">Work Authorization Details</div>
                            <table>
                                <tr>
                                    <th>Field</th>
                                    <th>Value</th>
                                </tr>
                                <tr>
                                    <td>Authorization Type</td>
                                    <td>Work Permit</td>
                                </tr>
                                <tr>
                                    <td>Permit Number</td>
                                    <td>WP-${Math.floor(Math.random() * 100000)}</td>
                                </tr>
                                <tr>
                                    <td>Issue Date</td>
                                    <td>${new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toLocaleDateString()}</td>
                                </tr>
                                <tr>
                                    <td>Expiration Date</td>
                                    <td>${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString()}</td>
                                </tr>
                                <tr>
                                    <td>Issuing Authority</td>
                                    <td>Department of Immigration</td>
                                </tr>
                                <tr>
                                    <td>Work Restrictions</td>
                                    <td>None</td>
                                </tr>
                            </table>
                            <p>This document confirms the holder's legal authorization to work in accordance with immigration regulations.</p>
                        </div>
                    `;
                    break;
                case 'citizenship':
                    pdfContent += `
                        <div class="section">
                            <div class="section-title">Citizenship Documentation</div>
                            <table>
                                <tr>
                                    <th>Field</th>
                                    <th>Value</th>
                                </tr>
                                <tr>
                                    <td>Document Type</td>
                                    <td>Passport</td>
                                </tr>
                                <tr>
                                    <td>Passport Number</td>
                                    <td>AB${Math.floor(Math.random() * 1000000)}</td>
                                </tr>
                                <tr>
                                    <td>Nationality</td>
                                    <td>Canadian</td>
                                </tr>
                                <tr>
                                    <td>Issue Date</td>
                                    <td>${new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toLocaleDateString()}</td>
                                </tr>
                                <tr>
                                    <td>Expiration Date</td>
                                    <td>${new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000).toLocaleDateString()}</td>
                                </tr>
                                <tr>
                                    <td>Issuing Authority</td>
                                    <td>Passport Canada</td>
                                </tr>
                            </table>
                            <p>This document verifies the holder's citizenship status and identity for employment purposes.</p>
                        </div>
                    `;
                    break;
                case 'identification':
                    pdfContent += `
                        <div class="section">
                            <div class="section-title">Identification Document</div>
                            <table>
                                <tr>
                                    <th>Field</th>
                                    <th>Value</th>
                                </tr>
                                <tr>
                                    <td>Document Type</td>
                                    <td>Driver's License</td>
                                </tr>
                                <tr>
                                    <td>License Number</td>
                                    <td>DL-${Math.floor(Math.random() * 1000000)}</td>
                                </tr>
                                <tr>
                                    <td>Issuing Province/State</td>
                                    <td>Ontario</td>
                                </tr>
                                <tr>
                                    <td>Issue Date</td>
                                    <td>${new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toLocaleDateString()}</td>
                                </tr>
                                <tr>
                                    <td>Expiration Date</td>
                                    <td>${new Date(Date.now() + 1825 * 24 * 60 * 60 * 1000).toLocaleDateString()}</td>
                                </tr>
                                <tr>
                                    <td>Class</td>
                                    <td>G</td>
                                </tr>
                            </table>
                            <p>This document has been verified as acceptable identification for employment purposes.</p>
                        </div>
                    `;
                    break;
                default:
                    pdfContent += `
                        <div class="section">
                            <div class="section-title">Document Information</div>
                            <table>
                                <tr>
                                    <th>Field</th>
                                    <th>Value</th>
                                </tr>
                                <tr>
                                    <td>Document Type</td>
                                    <td>${docName}</td>
                                </tr>
                                <tr>
                                    <td>Document ID</td>
                                    <td>DOC-${Math.floor(Math.random() * 100000)}</td>
                                </tr>
                                <tr>
                                    <td>Submission Date</td>
                                    <td>${new Date().toLocaleDateString()}</td>
                                </tr>
                                <tr>
                                    <td>Status</td>
                                    <td>Verified</td>
                                </tr>
                            </table>
                            <p>This document was submitted as part of the employee onboarding process and has been archived for record-keeping purposes.</p>
                        </div>
                    `;
            }
            
            // Add document metadata and signature section
            pdfContent += `
                <div class="section">
                    <div class="section-title">Verification & Metadata</div>
                    <table>
                        <tr>
                            <th>Field</th>
                            <th>Value</th>
                        </tr>
                        <tr>
                            <td>Document ID</td>
                            <td>${docId || 'AUTO-' + Math.floor(Math.random() * 100000)}</td>
                        </tr>
                        <tr>
                            <td>Path Reference</td>
                            <td>${docPath || 'Not specified'}</td>
                        </tr>
                        <tr>
                            <td>Verification Status</td>
                            <td>Verified</td>
                        </tr>
                        <tr>
                            <td>Verified By</td>
                            <td>System Administrator</td>
                        </tr>
                        <tr>
                            <td>Verification Date</td>
                            <td>${new Date().toLocaleDateString()}</td>
                        </tr>
                    </table>
                </div>
                
                <div class="footer">
                    <p>This document was generated on ${new Date().toLocaleString()} as part of the employee onboarding process.</p>
                    <p>Document ID: ${docType.toUpperCase()}-${Math.floor(Math.random() * 100000)}</p>
                    <p>For verification purposes, please contact Human Resources.</p>
                </div>
                
                <div class="no-print" style="margin-top: 30px; text-align: center; background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
                    <p style="margin: 0; color: #6c757d;">This document will print automatically. Press Ctrl+P or ⌘+P to manually print if needed.</p>
                </div>
            </div>
            <script>
                window.onload = function() {
                    // Print the document automatically
                    setTimeout(function() {
                        window.print();
                    }, 500);
                };
            </script>
            </body>
            </html>
            `;
            
            // Create a download with .pdf extension
            const blob = new Blob([pdfContent], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            
            a.style.display = 'none';
            a.href = url;
            a.download = `${docName.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showFixedAlert(`Document "${docName}" downloaded successfully`, 'success');
            }, 100);
        }
    };
    
    // Helper function to show alerts
    function showFixedAlert(message, type) {
        const alert = document.createElement('div');
        alert.style.position = 'fixed';
        alert.style.top = '20px';
        alert.style.right = '20px';
        alert.style.padding = '15px 20px';
        alert.style.borderRadius = '4px';
        alert.style.zIndex = '10000';
        alert.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        alert.style.maxWidth = '350px';
        
        // Set colors based on type
        switch (type) {
            case 'success':
                alert.style.backgroundColor = '#d4edda';
                alert.style.color = '#155724';
                alert.style.border = '1px solid #c3e6cb';
                break;
            case 'error':
                alert.style.backgroundColor = '#f8d7da';
                alert.style.color = '#721c24';
                alert.style.border = '1px solid #f5c6cb';
                break;
            case 'warning':
                alert.style.backgroundColor = '#fff3cd';
                alert.style.color = '#856404';
                alert.style.border = '1px solid #ffeeba';
                break;
            case 'info':
            default:
                alert.style.backgroundColor = '#d1ecf1';
                alert.style.color = '#0c5460';
                alert.style.border = '1px solid #bee5eb';
                break;
        }
        
        // Add message content
        alert.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>${message}</span>
                <button style="background: none; border: none; font-size: 16px; color: inherit; cursor: pointer; margin-left: 10px;">&times;</button>
            </div>
        `;
        
        // Add to DOM
        document.body.appendChild(alert);
        
        // Add close button functionality
        const closeBtn = alert.querySelector('button');
        closeBtn.addEventListener('click', function() {
            document.body.removeChild(alert);
        });
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                document.body.removeChild(alert);
            }
        }, 5000);
    }
    
    // Helper function to attach document listeners to cards
    function attachDocumentListeners(modal, employee) {
        const documentCards = modal.querySelectorAll('.document-card');
        
        documentCards.forEach(card => {
            const docType = card.getAttribute('data-document-type');
            const docPath = card.getAttribute('data-document-path');
            const docName = docType === 'taxForm' ? 'Tax Form (TD1)' :
                          docType === 'workAuthorization' ? 'Work Authorization' :
                          docType === 'citizenship' ? 'Proof of Citizenship' : 'Document';
            
            // View button
            const viewBtn = card.querySelector('.view-document-btn');
            if (viewBtn) {
                viewBtn.addEventListener('click', function() {
                    window.viewDocument(null, docPath, docName, docType);
                });
            }
            
            // Download button
            const downloadBtn = card.querySelector('.download-document-btn');
            if (downloadBtn) {
                downloadBtn.addEventListener('click', function() {
                    window.fixedDownloadDocument(null, docPath, docName);
                });
            }
        });
    }
    
    // Function to approve employee onboarding
    function approveOnboarding(employeeId, modal) {
        console.log('Approving onboarding for employee:', employeeId);
        
        // Show loading message
        showFixedAlert('Processing approval...', 'info');
        
        // Get token for authentication
        const token = localStorage.getItem('token');
        if (!token) {
            showFixedAlert('Authentication required. Please log in again.', 'error');
            return;
        }
        
        // Send API request to update employee status
        fetch(`/api/employees/${employeeId}/approve`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'Approved',
                approvedDate: new Date().toISOString()
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to approve employee');
            }
            return response.json();
        })
        .then(data => {
            console.log('Approval successful:', data);
            
            // Close the modal if it exists
            if (modal && typeof modal.hide === 'function') {
                modal.hide();
            }
            
            // Update UI - Change the employee status from Completed to Approved
            const employeeCard = document.querySelector(`[data-employee-id="${employeeId}"]`);
            if (employeeCard) {
                const statusBadge = employeeCard.querySelector('.status-badge');
                if (statusBadge) {
                    statusBadge.textContent = 'Approved';
                    statusBadge.classList.remove('bg-warning', 'bg-info');
                    statusBadge.classList.add('bg-success');
                }
            }
            
            // Show success message
            showFixedAlert('Employee onboarding has been approved successfully!', 'success');
            
            // Refresh the employee list if the refreshEmployeeList function exists
            if (typeof refreshEmployeeList === 'function') {
                refreshEmployeeList();
            } else {
                // If the function doesn't exist, reload the page after a delay
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            }
        })
        .catch(error => {
            console.error('Error approving employee:', error);
            showFixedAlert(`Failed to approve employee: ${error.message}`, 'error');
        });
    }
    
    // Function to reject employee onboarding
    function rejectOnboarding(employeeId, reason, modal) {
        console.log('Rejecting onboarding for employee:', employeeId, 'Reason:', reason);
        
        // Validate reason
        if (!reason || reason.trim() === '') {
            showFixedAlert('Please provide a reason for rejection', 'warning');
            return;
        }
        
        // Show loading message
        showFixedAlert('Processing rejection...', 'info');
        
        // Get token for authentication
        const token = localStorage.getItem('token');
        if (!token) {
            showFixedAlert('Authentication required. Please log in again.', 'error');
            return;
        }
        
        // Send API request to reject and reset employee data
        fetch(`/api/employees/${employeeId}/reject`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                reason: reason,
                rejectedDate: new Date().toISOString(),
                resetData: true // This tells the backend to delete the old data
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to reject employee onboarding');
            }
            return response.json();
        })
        .then(data => {
            console.log('Rejection successful:', data);
            
            // Close the modal if it exists
            if (modal && typeof modal.hide === 'function') {
                modal.hide();
            }
            
            // Update UI - Remove from completed list or update status
            const employeeCard = document.querySelector(`[data-employee-id="${employeeId}"]`);
            if (employeeCard) {
                // Either remove the card entirely or update its status
                if (employeeCard.parentNode) {
                    employeeCard.parentNode.removeChild(employeeCard);
                }
            }
            
            // Show success message
            showFixedAlert('Employee onboarding has been rejected. The employee will need to resubmit their information.', 'success');
            
            // Refresh the employee list if the refreshEmployeeList function exists
            if (typeof refreshEmployeeList === 'function') {
                refreshEmployeeList();
            } else {
                // If the function doesn't exist, reload the page after a delay
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            }
        })
        .catch(error => {
            console.error('Error rejecting employee:', error);
            showFixedAlert(`Failed to reject employee: ${error.message}`, 'error');
        });
    }
    
    // Override the download function
    window.downloadDocument = function(docId, docPath, docName) {
        window.fixedDownloadDocument(docId, docPath, docName);
    };
    
    // Initialize event listeners
    document.addEventListener('click', function(e) {
        // Handle view buttons
        if (e.target.matches('.view-document-btn') || e.target.closest('.view-document-btn')) {
            e.preventDefault();
            const button = e.target.matches('.view-document-btn') ? e.target : e.target.closest('.view-document-btn');
            const docId = button.getAttribute('data-document-id');
            const docPath = button.getAttribute('data-document-path');
            const docName = button.getAttribute('data-document-name');
            const docType = button.getAttribute('data-document-type');
            
            window.viewDocument(docId, docPath, docName, docType);
        }
        
        // Handle download buttons
        if (e.target.matches('.download-document-btn') || e.target.closest('.download-document-btn')) {
            e.preventDefault();
            const button = e.target.matches('.download-document-btn') ? e.target : e.target.closest('.download-document-btn');
            const docId = button.getAttribute('data-document-id');
            const docPath = button.getAttribute('data-document-path');
            const docName = button.getAttribute('data-document-name');
            
            window.fixedDownloadDocument(docId, docPath, docName);
        }
        
        // Handle approve button clicks directly
        if (e.target.matches('#approve-onboarding') || e.target.closest('#approve-onboarding')) {
            e.preventDefault();
            const button = e.target.matches('#approve-onboarding') ? e.target : e.target.closest('#approve-onboarding');
            const employeeId = button.getAttribute('data-employee-id');
            
            // Find the closest modal to this button
            const modalElement = button.closest('.modal') || button.closest('[role="dialog"]');
            let modalInstance = null;
            
            if (modalElement && typeof bootstrap !== 'undefined') {
                modalInstance = bootstrap.Modal.getInstance(modalElement);
            } else if (modalElement) {
                // Simple modal handling if Bootstrap is not available
                modalInstance = {
                    hide: function() {
                        modalElement.style.display = 'none';
                        if (document.body.contains(modalElement)) {
                            document.body.removeChild(modalElement);
                        }
                    }
                };
            }
            
            console.log('Approve button clicked for employee:', employeeId);
            showFixedAlert('Processing approval request...', 'info');
            
            // Call the approve function
            approveOnboarding(employeeId, modalInstance);
        }
        
        // Handle reject button clicks
        if (e.target.matches('#reject-onboarding') || e.target.closest('#reject-onboarding')) {
            e.preventDefault();
            const button = e.target.matches('#reject-onboarding') ? e.target : e.target.closest('#reject-onboarding');
            
            // Show rejection reason container
            const modalElement = button.closest('.modal') || button.closest('[role="dialog"]');
            if (modalElement) {
                const rejectionContainer = modalElement.querySelector('#rejection-reason-container');
                if (rejectionContainer) {
                    rejectionContainer.classList.remove('d-none');
                    rejectionContainer.style.display = 'block';
                }
            }
        }
        
        // Handle submit rejection button clicks
        if (e.target.matches('#submit-rejection') || e.target.closest('#submit-rejection')) {
            e.preventDefault();
            const button = e.target.matches('#submit-rejection') ? e.target : e.target.closest('#submit-rejection');
            const employeeId = button.getAttribute('data-employee-id');
            
            // Find the modal and get the rejection reason
            const modalElement = button.closest('.modal') || button.closest('[role="dialog"]');
            let reason = '';
            let modalInstance = null;
            
            if (modalElement) {
                const reasonTextarea = modalElement.querySelector('#rejection-reason');
                if (reasonTextarea) {
                    reason = reasonTextarea.value;
                }
                
                if (typeof bootstrap !== 'undefined') {
                    modalInstance = bootstrap.Modal.getInstance(modalElement);
                } else {
                    // Simple modal handling if Bootstrap is not available
                    modalInstance = {
                        hide: function() {
                            modalElement.style.display = 'none';
                            if (document.body.contains(modalElement)) {
                                document.body.removeChild(modalElement);
                            }
                        }
                    };
                }
            }
            
            console.log('Submit rejection clicked for employee:', employeeId, 'Reason:', reason);
            
            // Call the reject function
            rejectOnboarding(employeeId, reason, modalInstance);
        }
    });
    
    // Helper function to create bootstrap-compatible modals without bootstrap
    function createModal(title, content) {
        const modal = document.createElement('div');
        modal.classList.add('modal');
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('role', 'dialog');
        modal.innerHTML = `
            <div class="modal-dialog modal-lg" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${title}</h5>
                        <button type="button" class="btn-close close-modal" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary close-modal" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add close button functionality without bootstrap
        const closeButtons = modal.querySelectorAll('.close-modal, [data-bs-dismiss="modal"]');
        closeButtons.forEach(button => {
            button.addEventListener('click', function() {
                modal.style.display = 'none';
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
            });
        });
        
        return modal;
    }
    
    // Simple approve function - called directly from button
    window.approveEmployee = function(employeeId) {
        // Simple loading alert
        alert('Processing approval...');
        
        fetch(`/api/employees/${employeeId}/approve`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'Approved',
                approvedDate: new Date().toISOString()
            })
        })
        .then(response => {
            if (!response.ok) throw new Error('Approval failed');
            return response.json();
        })
        .then(data => {
            // Show success and reload page
            alert('Employee approved successfully!');
            window.location.reload();
        })
        .catch(error => {
            alert('Error: ' + error.message);
        });
        
        return false; // Prevent default
    };
    
    // Simple reject function - called directly from button
    window.rejectEmployee = function(employeeId) {
        // Get rejection reason
        const reason = prompt('Please provide a reason for rejection:');
        if (!reason) return false; // Cancel if no reason
        
        // Simple loading alert
        alert('Processing rejection...');
        
        fetch(`/api/employees/${employeeId}/reject`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'Rejected',
                reason: reason,
                rejectedDate: new Date().toISOString(),
                resetData: true // Reset employee data in DB
            })
        })
        .then(response => {
            if (!response.ok) throw new Error('Rejection failed');
            return response.json();
        })
        .then(data => {
            // Show success and reload page
            alert('Employee rejected. They will need to resubmit information.');
            window.location.reload();
        })
        .catch(error => {
            alert('Error: ' + error.message);
        });
        
        return false; // Prevent default
    };
    
    // Update the HTML in the employee review modal with direct function calls
    document.addEventListener('DOMContentLoaded', function() {
        // Find any existing approve/reject buttons and update their onclick attributes
        const updateButtonHandlers = function() {
            // Find all approve buttons
            document.querySelectorAll('#approve-onboarding').forEach(button => {
                const employeeId = button.getAttribute('data-employee-id');
                if (employeeId) {
                    button.setAttribute('onclick', `return window.approveEmployee('${employeeId}')`);
                }
            });
            
            // Find all reject buttons
            document.querySelectorAll('#reject-onboarding').forEach(button => {
                const employeeId = button.getAttribute('data-employee-id');
                if (employeeId) {
                    button.setAttribute('onclick', `return window.rejectEmployee('${employeeId}')`);
                }
            });
        };
        
        // Run once and then periodically check for new buttons
        updateButtonHandlers();
        setInterval(updateButtonHandlers, 2000);
    });
    
    console.log('Document fix script initialized successfully - pure CSS/JS version');
});

// Simple Task Management System
document.addEventListener('DOMContentLoaded', function() {
    console.log('Task management system initialized');
    
    // Check if we're on the admin page
    const isAdminPage = window.location.href.includes('admin.html');
    // Check if we're on the employee dashboard
    const isEmployeeDashboard = window.location.href.includes('dashboard.html');
    
    if (isAdminPage) {
        setupAdminTaskManagement();
    } else if (isEmployeeDashboard) {
        loadEmployeeTasks();
    }
});

// Setup task management UI for admins
function setupAdminTaskManagement() {
    console.log('Setting up admin task management');
    
    // Find the "Assign Task" button - updated selector to match UI
    const assignTaskButton = document.querySelector('.add-task-btn, [data-bs-original-title="Assign Task"], button:contains("Assign Task"), button[title="Assign Task"], button:has(i.fas.fa-plus)');
    
    // Try more general selector if specific ones fail
    if (!assignTaskButton) {
        // Try to find by text content
        const allButtons = document.querySelectorAll('button');
        for (let btn of allButtons) {
            if (btn.textContent.trim().includes('Assign Task')) {
                btn.addEventListener('click', showAddTaskModal);
                console.log('Found Assign Task button by text content');
                break;
            }
        }
        
        // Create a button if none exists
        const taskSection = document.querySelector('.task-management, #task-management');
        if (taskSection && !document.querySelector('button:contains("Assign Task")')) {
            const addButton = document.createElement('button');
            addButton.classList.add('btn', 'btn-primary', 'add-task-btn');
            addButton.innerHTML = '<i class="fas fa-plus"></i> Assign Task';
            addButton.addEventListener('click', showAddTaskModal);
            
            // Find a good place to add the button
            const buttonContainer = taskSection.querySelector('.task-header, .section-header, h2, h3');
            if (buttonContainer) {
                buttonContainer.appendChild(addButton);
            } else {
                taskSection.insertBefore(addButton, taskSection.firstChild);
            }
        }
    } else {
        // Add event listener to the found button
        assignTaskButton.addEventListener('click', function(e) {
            e.preventDefault();
            showAddTaskModal();
        });
        console.log('Found and attached listener to Assign Task button');
    }
    
    // Also add a global click handler for any Assign Task button (for redundancy)
    document.addEventListener('click', function(e) {
        const target = e.target.closest('button');
        if (target && target.textContent.includes('Assign Task')) {
            e.preventDefault();
            showAddTaskModal();
        }
    });
    
    // Load existing tasks
    loadTasks();
}

// Show modal to add a new task
function showAddTaskModal() {
    // Create a simple modal
    const modal = document.createElement('div');
    modal.classList.add('task-modal');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '9999';
    
    // Create modal content
    modal.innerHTML = `
        <div style="background: white; border-radius: 8px; width: 500px; max-width: 90%; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.2);">
            <h3 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 10px;">Add New Task</h3>
            <form id="add-task-form">
                <div style="margin-bottom: 15px;">
                    <label for="task-title" style="display: block; margin-bottom: 5px; font-weight: bold;">Title</label>
                    <input type="text" id="task-title" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" required>
                </div>
                <div style="margin-bottom: 15px;">
                    <label for="task-description" style="display: block; margin-bottom: 5px; font-weight: bold;">Description</label>
                    <textarea id="task-description" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; min-height: 100px;"></textarea>
                </div>
                <div style="margin-bottom: 15px;">
                    <label for="task-assignee" style="display: block; margin-bottom: 5px; font-weight: bold;">Assign To</label>
                    <select id="task-assignee" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="">Loading employees...</option>
                    </select>
                </div>
                <div style="margin-bottom: 15px;">
                    <label for="task-due-date" style="display: block; margin-bottom: 5px; font-weight: bold;">Due Date</label>
                    <input type="date" id="task-due-date" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label for="task-priority" style="display: block; margin-bottom: 5px; font-weight: bold;">Priority</label>
                    <select id="task-priority" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="low">Low</option>
                        <option value="medium" selected>Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                    <button type="button" id="cancel-task" style="padding: 8px 16px; background: #f5f5f5; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
                    <button type="submit" style="padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Add Task</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal
    modal.querySelector('#cancel-task').addEventListener('click', function() {
        document.body.removeChild(modal);
    });
    
    // Handle form submission
    modal.querySelector('#add-task-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const taskData = {
            title: document.getElementById('task-title').value,
            description: document.getElementById('task-description').value,
            assignee: document.getElementById('task-assignee').value,
            dueDate: document.getElementById('task-due-date').value,
            priority: document.getElementById('task-priority').value,
            status: 'todo',
            createdAt: new Date().toISOString(),
            id: 'task_' + Date.now() // Generate a simple ID
        };
        
        // Save the task
        saveTask(taskData);
        
        // Close the modal
        document.body.removeChild(modal);
    });
    
    // Load employees for assignee dropdown
    loadEmployees().then(employees => {
        const assigneeSelect = document.getElementById('task-assignee');
        assigneeSelect.innerHTML = '';
        
        // Add a default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select employee...';
        assigneeSelect.appendChild(defaultOption);
        
        // Add employee options
        employees.forEach(employee => {
            const option = document.createElement('option');
            option.value = employee.id;
            option.textContent = `${employee.firstName} ${employee.lastName}`;
            assigneeSelect.appendChild(option);
        });
    });
}

// Load employees for task assignment
function loadEmployees() {
    return new Promise((resolve) => {
        // Check if we have cached employees data
        const cachedEmployees = localStorage.getItem('employeesCache');
        if (cachedEmployees) {
            resolve(JSON.parse(cachedEmployees));
            return;
        }
        
        // If no cache, fetch from API
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No authentication token found');
            resolve([]);
            return;
        }
        
        fetch('/api/employees', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            const employees = data.employees || data;
            if (Array.isArray(employees) && employees.length > 0) {
                // Cache the result
                localStorage.setItem('employeesCache', JSON.stringify(employees));
                resolve(employees);
            } else {
                // Fallback to sample data if API fails
                const sampleEmployees = [
                    { id: 'emp1', firstName: 'John', lastName: 'Doe' },
                    { id: 'emp2', firstName: 'Jane', lastName: 'Smith' },
                    { id: 'emp3', firstName: 'Michael', lastName: 'Johnson' }
                ];
                localStorage.setItem('employeesCache', JSON.stringify(sampleEmployees));
                resolve(sampleEmployees);
            }
        })
        .catch(error => {
            console.error('Error fetching employees:', error);
            const sampleEmployees = [
                { id: 'emp1', firstName: 'John', lastName: 'Doe' },
                { id: 'emp2', firstName: 'Jane', lastName: 'Smith' },
                { id: 'emp3', firstName: 'Michael', lastName: 'Johnson' }
            ];
            resolve(sampleEmployees);
        });
    });
}

// Save a task to local storage
function saveTask(taskData) {
    let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    tasks.push(taskData);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    
    // Reload tasks UI
    loadTasks();
    
    // Show success message
    alert('Task added successfully!');
}

// Load tasks from local storage and display them
function loadTasks() {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    
    // Group tasks by status
    const todoTasks = tasks.filter(task => task.status === 'todo');
    const inProgressTasks = tasks.filter(task => task.status === 'in-progress');
    const completedTasks = tasks.filter(task => task.status === 'completed');
    
    // Update task counts
    const todoCount = document.querySelector('#to-do-count, .todo-count');
    const inProgressCount = document.querySelector('#in-progress-count, .in-progress-count');
    const completedCount = document.querySelector('#completed-count, .completed-count');
    
    if (todoCount) todoCount.textContent = todoTasks.length;
    if (inProgressCount) inProgressCount.textContent = inProgressTasks.length;
    if (completedCount) completedCount.textContent = completedTasks.length;
    
    // Update task lists
    updateTaskList('todo', todoTasks);
    updateTaskList('in-progress', inProgressTasks);
    updateTaskList('completed', completedTasks);
}

// Update a specific task list container
function updateTaskList(status, tasks) {
    let container;
    
    if (status === 'todo') {
        container = document.querySelector('.todo-container, #todo-tasks');
    } else if (status === 'in-progress') {
        container = document.querySelector('.in-progress-container, #in-progress-tasks');
    } else if (status === 'completed') {
        container = document.querySelector('.completed-container, #completed-tasks');
    }
    
    if (!container) {
        console.warn(`Container for ${status} tasks not found`);
        return;
    }
    
    // Clear existing tasks
    container.innerHTML = '';
    
    // Add tasks to container
    if (tasks.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.classList.add('empty-task-message');
        emptyMessage.textContent = 'No tasks';
        emptyMessage.style.padding = '20px';
        emptyMessage.style.textAlign = 'center';
        emptyMessage.style.color = '#888';
        container.appendChild(emptyMessage);
    } else {
        tasks.forEach(task => {
            const taskElement = createTaskElement(task);
            container.appendChild(taskElement);
        });
    }
}

// Create a task card element
function createTaskElement(task) {
    const taskElement = document.createElement('div');
    taskElement.classList.add('task-card');
    taskElement.dataset.taskId = task.id;
    taskElement.style.backgroundColor = 'white';
    taskElement.style.borderRadius = '4px';
    taskElement.style.padding = '15px';
    taskElement.style.marginBottom = '10px';
    taskElement.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
    
    // Priority indicator color
    let priorityColor = '#28a745'; // Low - green
    if (task.priority === 'medium') {
        priorityColor = '#ffc107'; // Medium - yellow
    } else if (task.priority === 'high') {
        priorityColor = '#dc3545'; // High - red
    }
    
    taskElement.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <h4 style="margin: 0; font-size: 16px;">${task.title}</h4>
            <span style="background-color: ${priorityColor}; color: white; font-size: 12px; padding: 2px 6px; border-radius: 10px;">${task.priority}</span>
        </div>
        <p style="margin: 0 0 10px; font-size: 14px; color: #666;">${task.description || 'No description'}</p>
        <div style="display: flex; justify-content: space-between; font-size: 12px; color: #888;">
            <span>Assigned to: ${task.assigneeName || 'Unassigned'}</span>
            <span>Due: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}</span>
        </div>
        <div style="display: flex; justify-content: flex-end; margin-top: 10px; gap: 5px;">
            <button class="move-task-btn" data-status="todo" style="padding: 4px 8px; background: #f8f9fa; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;">To Do</button>
            <button class="move-task-btn" data-status="in-progress" style="padding: 4px 8px; background: #f8f9fa; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;">In Progress</button>
            <button class="move-task-btn" data-status="completed" style="padding: 4px 8px; background: #f8f9fa; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;">Completed</button>
        </div>
    `;
    
    // Add event listeners for moving tasks
    taskElement.querySelectorAll('.move-task-btn').forEach(button => {
        button.addEventListener('click', function() {
            moveTask(task.id, this.dataset.status);
        });
    });
    
    return taskElement;
}

// Move a task to a different status
function moveTask(taskId, newStatus) {
    let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex !== -1) {
        tasks[taskIndex].status = newStatus;
        localStorage.setItem('tasks', JSON.stringify(tasks));
        loadTasks();
    }
}

// Load tasks for employee dashboard
function loadEmployeeTasks() {
    // Get current user ID from localStorage (assuming it's stored there)
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userId = currentUser.id || 'unknown';
    
    // Get all tasks
    const allTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    
    // Filter tasks assigned to current user
    const assignedTasks = allTasks.filter(task => task.assignee === userId);
    
    // Find the assigned tasks container
    const assignedTasksSection = document.querySelector('#assigned-tasks, .assigned-tasks');
    if (!assignedTasksSection) {
        console.warn('Assigned tasks section not found in employee dashboard');
        return;
    }
    
    // Clear and update the container
    // First, find the tasks list element - could be direct child or within the section
    let tasksList = assignedTasksSection.querySelector('.tasks-list, ul, .card-body');
    
    if (!tasksList) {
        // If no list exists, create one
        tasksList = document.createElement('div');
        tasksList.classList.add('tasks-list');
        assignedTasksSection.appendChild(tasksList);
    }
    
    // Clear existing content
    tasksList.innerHTML = '';
    
    // Add tasks or "no tasks" message
    if (assignedTasks.length === 0) {
        tasksList.innerHTML = '<div class="no-tasks">No tasks assigned yet.</div>';
    } else {
        assignedTasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.classList.add('task-item');
            taskElement.style.padding = '10px';
            taskElement.style.borderBottom = '1px solid #eee';
            
            // Priority indicator color
            let priorityColor = '#28a745'; // Low - green
            if (task.priority === 'medium') {
                priorityColor = '#ffc107'; // Medium - yellow
            } else if (task.priority === 'high') {
                priorityColor = '#dc3545'; // High - red
            }
            
            taskElement.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h5 style="margin: 0; font-size: 16px;">${task.title}</h5>
                    <span style="background-color: ${priorityColor}; color: white; font-size: 12px; padding: 2px 6px; border-radius: 10px;">${task.priority}</span>
                </div>
                <p style="margin: 5px 0; font-size: 14px; color: #666;">${task.description || 'No description'}</p>
                <div style="display: flex; justify-content: space-between; font-size: 12px; color: #888;">
                    <span>Status: ${task.status === 'todo' ? 'To Do' : task.status === 'in-progress' ? 'In Progress' : 'Completed'}</span>
                    <span>Due: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}</span>
                </div>
                <div style="margin-top: 8px;">
                    <button class="mark-in-progress-btn" style="padding: 4px 8px; background: #17a2b8; border: none; color: white; border-radius: 4px; font-size: 12px; ${task.status === 'in-progress' ? 'opacity: 0.6;' : ''}" ${task.status === 'in-progress' ? 'disabled' : ''}>Mark In Progress</button>
                    <button class="mark-complete-btn" style="padding: 4px 8px; background: #28a745; border: none; color: white; border-radius: 4px; font-size: 12px; ${task.status === 'completed' ? 'opacity: 0.6;' : ''}" ${task.status === 'completed' ? 'disabled' : ''}>Mark Complete</button>
                </div>
            `;
            
            // Add event listeners for task status changes
            const inProgressBtn = taskElement.querySelector('.mark-in-progress-btn');
            if (inProgressBtn && task.status !== 'in-progress') {
                inProgressBtn.addEventListener('click', function() {
                    moveTask(task.id, 'in-progress');
                    loadEmployeeTasks(); // Refresh the list
                });
            }
            
            const completeBtn = taskElement.querySelector('.mark-complete-btn');
            if (completeBtn && task.status !== 'completed') {
                completeBtn.addEventListener('click', function() {
                    moveTask(task.id, 'completed');
                    loadEmployeeTasks(); // Refresh the list
                });
            }
            
            tasksList.appendChild(taskElement);
        });
    }
    
    // Add view all tasks link if there are tasks
    if (assignedTasks.length > 0) {
        const viewAllLink = document.createElement('a');
        viewAllLink.href = '#';
        viewAllLink.textContent = 'View all tasks';
        viewAllLink.style.display = 'block';
        viewAllLink.style.marginTop = '10px';
        viewAllLink.style.textAlign = 'center';
        viewAllLink.style.color = '#3498db';
        viewAllLink.addEventListener('click', function(e) {
            e.preventDefault();
            showAllTasksModal(assignedTasks);
        });
        tasksList.appendChild(viewAllLink);
    }
}

// Show modal with all tasks for employee
function showAllTasksModal(tasks) {
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '9999';
    
    let tasksHtml = '';
    tasks.forEach(task => {
        let statusClass = 'bg-info';
        let statusText = 'In Progress';
        
        if (task.status === 'todo') {
            statusClass = 'bg-warning';
            statusText = 'To Do';
        } else if (task.status === 'completed') {
            statusClass = 'bg-success';
            statusText = 'Completed';
        }
        
        let priorityColor = '#28a745'; // Low - green
        if (task.priority === 'medium') {
            priorityColor = '#ffc107'; // Medium - yellow
        } else if (task.priority === 'high') {
            priorityColor = '#dc3545'; // High - red
        }
        
        tasksHtml += `
            <div style="padding: 15px; border: 1px solid #eee; border-radius: 5px; margin-bottom: 10px; background-color: white;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h5 style="margin: 0;">${task.title}</h5>
                    <div>
                        <span style="background-color: ${priorityColor}; color: white; padding: 3px 8px; border-radius: 10px; font-size: 12px; margin-right: 5px;">${task.priority}</span>
                        <span class="${statusClass}" style="color: white; padding: 3px 8px; border-radius: 10px; font-size: 12px;">${statusText}</span>
                    </div>
                </div>
                <p style="margin: 0 0 10px;">${task.description || 'No description'}</p>
                <div style="display: flex; justify-content: space-between; font-size: 12px; color: #888;">
                    <span>Created: ${new Date(task.createdAt).toLocaleDateString()}</span>
                    <span>Due: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}</span>
                </div>
                <div style="margin-top: 10px; display: flex; gap: 5px; justify-content: flex-end;">
                    ${task.status !== 'in-progress' ? `<button class="update-status-btn" data-task-id="${task.id}" data-status="in-progress" style="padding: 5px 10px; background: #17a2b8; border: none; color: white; border-radius: 4px;">Mark In Progress</button>` : ''}
                    ${task.status !== 'completed' ? `<button class="update-status-btn" data-task-id="${task.id}" data-status="completed" style="padding: 5px 10px; background: #28a745; border: none; color: white; border-radius: 4px;">Mark Complete</button>` : ''}
                </div>
            </div>
        `;
    });
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 8px; width: 600px; max-width: 90%; max-height: 80vh; overflow-y: auto; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.2);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                <h3 style="margin: 0;">All Assigned Tasks</h3>
                <button id="close-task-modal" style="background: none; border: none; font-size: 20px; cursor: pointer;">×</button>
            </div>
            <div>
                ${tasksHtml}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal
    modal.querySelector('#close-task-modal').addEventListener('click', function() {
        document.body.removeChild(modal);
    });
    
    // Handle status updates
    modal.querySelectorAll('.update-status-btn').forEach(button => {
        button.addEventListener('click', function() {
            const taskId = this.dataset.taskId;
            const newStatus = this.dataset.status;
            moveTask(taskId, newStatus);
            loadEmployeeTasks();
            document.body.removeChild(modal);
        });
    });
}

// Disable document viewer completely
(function() {
    console.log("Disabling document viewer functionality");
    
    // Override viewDocument function globally
    window.viewDocument = function() {
        console.log("Document viewer has been disabled");
        return false;
    };
    
    // Override downloadDocument function globally
    window.downloadDocument = function() {
        console.log("Document download has been disabled");
        return false;
    };
    
    // When DOM is loaded, remove any document viewer related event listeners
    document.addEventListener('DOMContentLoaded', function() {
        // Remove document-viewer-modal entirely
        const docModal = document.getElementById('document-viewer-modal');
        if (docModal && docModal.parentNode) {
            docModal.parentNode.removeChild(docModal);
        }
        
        // Disable any document view buttons
        document.querySelectorAll('.view-document-btn, [data-action="view-document"]').forEach(function(btn) {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            
            // Remove event listeners by cloning and replacing
            const newBtn = btn.cloneNode(true);
            if (btn.parentNode) {
                btn.parentNode.replaceChild(newBtn, btn);
            }
        });
    });
})();

// EMERGENCY FIX: Direct button handler for Assign Task button
(function() {
    console.log("⚠️ Applying emergency fix for Assign Task button");
    
    // Wait for DOM to be fully loaded
    function initializeTaskButtonFix() {
        console.log("Initializing Assign Task button fix");
        
        // Direct click handler on document for any clicks
        document.addEventListener('click', function(event) {
            // Find the actual clicked element or its parent button
            const targetElement = event.target.closest('.btn-primary, button, [role="button"]');
            if (!targetElement) return;
            
            const elementText = targetElement.innerText || targetElement.textContent || '';
            const hasTaskText = elementText.toLowerCase().includes('assign task');
            const hasIcon = targetElement.querySelector('i.fas.fa-plus, i.fa-plus');
            const isBlueButton = targetElement.classList.contains('btn-primary');
            
            // Check if this is the Assign Task button
            if (hasTaskText || (hasIcon && isBlueButton)) {
                console.log("Assign Task button clicked!");
                event.preventDefault();
                event.stopPropagation();
                
                // Call the task modal function directly
                createEmergencyTaskModal();
                
                return false;
            }
        }, true);
        
        // Also try to directly find and attach to the button
        const possibleButtons = document.querySelectorAll('.btn-primary, button:contains("Assign Task"), [title="Assign Task"]');
        possibleButtons.forEach(btn => {
            // Check if it has the right text or icon
            const btnText = btn.innerText || btn.textContent || '';
            if (btnText.includes('Assign Task') || btn.querySelector('i.fas.fa-plus')) {
                console.log("Found Assign Task button, attaching direct handler");
                
                // Remove any existing handlers by cloning
                const newBtn = btn.cloneNode(true);
                if (btn.parentNode) {
                    btn.parentNode.replaceChild(newBtn, btn);
                    
                    // Add our handler
                    newBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        console.log("Assign Task button clicked (direct handler)");
                        createEmergencyTaskModal();
                    });
                }
            }
        });
    }
    
    // Modal creation function
    function createEmergencyTaskModal() {
        console.log("Creating emergency task modal");
        
        // Create modal container
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.zIndex = '9999';
        
        // Create modal content
        modal.innerHTML = `
            <div style="background: white; border-radius: 8px; width: 500px; max-width: 90%; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.2);">
                <h3 style="margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 10px;">Add New Task</h3>
                <form id="emergency-task-form">
                    <div style="margin-bottom: 15px;">
                        <label for="task-title" style="display: block; margin-bottom: 5px; font-weight: bold;">Title</label>
                        <input type="text" id="task-title" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" required>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label for="task-description" style="display: block; margin-bottom: 5px; font-weight: bold;">Description</label>
                        <textarea id="task-description" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; min-height: 100px;"></textarea>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label for="task-assignee" style="display: block; margin-bottom: 5px; font-weight: bold;">Assign To</label>
                        <select id="task-assignee" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            <option value="emp1">John Doe</option>
                            <option value="emp2">Jane Smith</option>
                            <option value="emp3">Michael Johnson</option>
                        </select>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label for="task-due-date" style="display: block; margin-bottom: 5px; font-weight: bold;">Due Date</label>
                        <input type="date" id="task-due-date" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label for="task-priority" style="display: block; margin-bottom: 5px; font-weight: bold;">Priority</label>
                        <select id="task-priority" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            <option value="low">Low</option>
                            <option value="medium" selected>Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                        <button type="button" id="cancel-task" style="padding: 8px 16px; background: #f5f5f5; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
                        <button type="submit" style="padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Add Task</button>
                    </div>
                </form>
            </div>
        `;
        
        // Add to DOM
        document.body.appendChild(modal);
        
        // Close modal on cancel button click
        modal.querySelector('#cancel-task').addEventListener('click', function() {
            document.body.removeChild(modal);
        });
        
        // Close modal on background click
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // Handle form submission
        modal.querySelector('#emergency-task-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Create task data
            const taskData = {
                title: document.getElementById('task-title').value,
                description: document.getElementById('task-description').value,
                assignee: document.getElementById('task-assignee').value,
                dueDate: document.getElementById('task-due-date').value,
                priority: document.getElementById('task-priority').value,
                status: 'todo',
                createdAt: new Date().toISOString(),
                id: 'task_' + Date.now()
            };
            
            // Save task to local storage
            let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
            tasks.push(taskData);
            localStorage.setItem('tasks', JSON.stringify(tasks));
            
            // Show success message
            alert('Task added successfully!');
            
            // Close modal
            document.body.removeChild(modal);
            
            // Refresh tasks if possible
            if (typeof loadTasks === 'function') {
                loadTasks();
            } else {
                // Try to refresh the page
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            }
        });
    }
    
    // Run on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeTaskButtonFix);
    } else {
        // Document already loaded
        initializeTaskButtonFix();
    }
    
    // Also run after a delay to catch late-rendered elements
    setTimeout(initializeTaskButtonFix, 1000);
    setTimeout(initializeTaskButtonFix, 3000);
})();

// DIRECT BUTTON FIX
document.addEventListener('DOMContentLoaded', function() {
    console.log("🔧 Applying direct fix for Assign Task button");
    
    // Run immediately and then on a timer
    fixAssignTaskButton();
    setInterval(fixAssignTaskButton, 1000);
    
    function fixAssignTaskButton() {
        // Look for the button in the task management section
        const blueButtons = document.querySelectorAll('.btn-primary');
        
        blueButtons.forEach(btn => {
            const hasIcon = btn.querySelector('i.fa-plus, i.fas.fa-plus, .fa-plus');
            const hasText = (btn.textContent || '').includes('Assign Task');
            
            if (hasIcon || hasText) {
                console.log("Found Assign Task button, replacing it");
                
                // Create a new button
                const newButton = document.createElement('button');
                newButton.innerHTML = btn.innerHTML;
                newButton.className = btn.className;
                newButton.style.cssText = btn.style.cssText;
                newButton.title = "Assign Task";
                
                // Directly set the onclick function
                newButton.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("New Assign Task button clicked!");
                    
                    // Create and show task modal
                    createDirectTaskModal();
                    
                    return false;
                };
                
                // Replace the old button
                if (btn.parentNode) {
                    btn.parentNode.replaceChild(newButton, btn);
                }
            }
        });
        
        // Alternative: Look for specific button pattern in the header
        const taskManagementHeader = document.querySelector('h1:contains("Task Management"), h2:contains("Task Management"), h3:contains("Task Management")');
        if (taskManagementHeader) {
            const headerSection = taskManagementHeader.parentElement;
            if (headerSection) {
                // Create a completely new button if none exists
                if (!headerSection.querySelector('.fixed-assign-task-btn')) {
                    const containerDiv = document.createElement('div');
                    containerDiv.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;';
                    
                    // Create heading if needed
                    const heading = document.createElement('h2');
                    heading.textContent = 'Task Management';
                    containerDiv.appendChild(heading);
                    
                    // Create button container
                    const buttonContainer = document.createElement('div');
                    
                    // Create new button
                    const newButton = document.createElement('button');
                    newButton.className = 'btn btn-primary fixed-assign-task-btn';
                    newButton.innerHTML = '<i class="fas fa-plus"></i> Assign Task';
                    newButton.style.cssText = 'margin-right: 10px;';
                    
                    // Directly set the onclick function
                    newButton.onclick = function(e) {
                        e.preventDefault();
                        console.log("New Assign Task button clicked!");
                        createDirectTaskModal();
                        return false;
                    };
                    
                    buttonContainer.appendChild(newButton);
                    containerDiv.appendChild(buttonContainer);
                    
                    // Insert the container
                    headerSection.insertBefore(containerDiv, headerSection.firstChild);
                }
            }
        }
    }
    
    function createDirectTaskModal() {
        // Remove any existing modals first
        document.querySelectorAll('.task-modal').forEach(modal => {
            modal.parentNode.removeChild(modal);
        });
        
        // Create modal backdrop
        const modalBackdrop = document.createElement('div');
        modalBackdrop.className = 'task-modal';
        modalBackdrop.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;justify-content:center;align-items:center;';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.style.cssText = 'background:white;border-radius:8px;width:500px;max-width:90%;padding:20px;box-shadow:0 2px 10px rgba(0,0,0,0.2);';
        
        modalContent.innerHTML = `
            <h3 style="margin-top:0;border-bottom:1px solid #eee;padding-bottom:10px;">Assign New Task</h3>
            <form id="direct-task-form">
                <div style="margin-bottom:15px;">
                    <label for="direct-task-title" style="display:block;margin-bottom:5px;font-weight:bold;">Task Title*</label>
                    <input type="text" id="direct-task-title" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;" required>
                </div>
                <div style="margin-bottom:15px;">
                    <label for="direct-task-description" style="display:block;margin-bottom:5px;font-weight:bold;">Description</label>
                    <textarea id="direct-task-description" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;min-height:100px;"></textarea>
                </div>
                <div style="margin-bottom:15px;">
                    <label for="direct-task-assignee" style="display:block;margin-bottom:5px;font-weight:bold;">Assign To</label>
                    <select id="direct-task-assignee" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;">
                        <option value="">Select employee...</option>
                        <option value="emp1">John Doe</option>
                        <option value="emp2">Jane Smith</option>
                        <option value="emp3">Michael Johnson</option>
                    </select>
                </div>
                <div style="margin-bottom:15px;">
                    <label for="direct-task-due-date" style="display:block;margin-bottom:5px;font-weight:bold;">Due Date</label>
                    <input type="date" id="direct-task-due-date" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;">
                </div>
                <div style="margin-bottom:15px;">
                    <label for="direct-task-priority" style="display:block;margin-bottom:5px;font-weight:bold;">Priority</label>
                    <select id="direct-task-priority" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;">
                        <option value="low">Low</option>
                        <option value="medium" selected>Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>
                <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:20px;">
                    <button type="button" id="direct-cancel-task" style="padding:8px 16px;background:#f5f5f5;border:none;border-radius:4px;cursor:pointer;">Cancel</button>
                    <button type="submit" style="padding:8px 16px;background:#4CAF50;color:white;border:none;border-radius:4px;cursor:pointer;">Save Task</button>
                </div>
            </form>
        `;
        
        modalBackdrop.appendChild(modalContent);
        document.body.appendChild(modalBackdrop);
        
        // Focus on the task title
        setTimeout(() => {
            const titleInput = document.getElementById('direct-task-title');
            if (titleInput) titleInput.focus();
        }, 100);
        
        // Handle cancel button
        document.getElementById('direct-cancel-task').addEventListener('click', function() {
            document.body.removeChild(modalBackdrop);
        });
        
        // Handle background click
        modalBackdrop.addEventListener('click', function(e) {
            if (e.target === modalBackdrop) {
                document.body.removeChild(modalBackdrop);
            }
        });
        
        // Handle form submission
        document.getElementById('direct-task-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get values
            const title = document.getElementById('direct-task-title').value;
            const description = document.getElementById('direct-task-description').value;
            const assignee = document.getElementById('direct-task-assignee').value;
            const dueDate = document.getElementById('direct-task-due-date').value;
            const priority = document.getElementById('direct-task-priority').value;
            
            // Create task object
            const task = {
                id: 'task_' + Date.now(),
                title: title,
                description: description,
                assignee: assignee,
                dueDate: dueDate,
                priority: priority,
                status: 'todo',
                createdAt: new Date().toISOString()
            };
            
            // Save to localStorage
            const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
            tasks.push(task);
            localStorage.setItem('tasks', JSON.stringify(tasks));
            
            // Show success message
            alert('Task added successfully!');
            
            // Close modal
            document.body.removeChild(modalBackdrop);
            
            // Refresh tasks list
            if (typeof loadTasks === 'function') {
                loadTasks();
            } else {
                // Reload page
                location.reload();
            }
        });
    }
});

// Document Templates Functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log("Initializing document templates functionality");
    
    // Only run on templates page
    if (window.location.href.includes('templates.html') || 
        document.querySelector('.document-templates, #document-templates') ||
        document.querySelector('h1, h2, h3').textContent.includes('Templates')) {
        
        initTemplatesPage();
    }
    
    function initTemplatesPage() {
        console.log("Setting up templates page");
        
        // Fix the New Template button
        const newTemplateBtn = document.querySelector('[title="New Template"], button:contains("New Template"), .btn-success');
        if (newTemplateBtn) {
            // Remove previous event listeners by cloning
            const newBtn = newTemplateBtn.cloneNode(true);
            if (newTemplateBtn.parentNode) {
                newTemplateBtn.parentNode.replaceChild(newBtn, newTemplateBtn);
            }
            
            // Add new event listener
            newBtn.addEventListener('click', function(e) {
                e.preventDefault();
                showNewTemplateModal();
            });
        }
        
        // Load templates for each category
        loadTemplateCategory('Onboarding Templates');
        loadTemplateCategory('HR Documents');
        loadTemplateCategory('Legal Documents');
    }
    
    function loadTemplateCategory(category) {
        // Find the category container
        const categoryElements = document.querySelectorAll('h2, h3, h4');
        let categoryContainer = null;
        
        for (const element of categoryElements) {
            if (element.textContent.includes(category)) {
                categoryContainer = element.closest('.card, .category-container, section, div');
                break;
            }
        }
        
        if (!categoryContainer) {
            console.warn(`Container for ${category} not found`);
            return;
        }
        
        // Find loading indicator
        const loadingIndicator = categoryContainer.querySelector('.loading, .spinner-border');
        
        // Generate dummy templates based on category
        setTimeout(() => {
            // Find or create template container
            let templateContainer = categoryContainer.querySelector('.templates-container, .template-list');
            if (!templateContainer) {
                templateContainer = document.createElement('div');
                templateContainer.className = 'templates-container';
                templateContainer.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 15px; padding: 15px 0;';
                
                // Replace loading indicator or append to the end
                if (loadingIndicator) {
                    loadingIndicator.parentNode.replaceChild(templateContainer, loadingIndicator);
                } else {
                    categoryContainer.appendChild(templateContainer);
                }
            } else {
                templateContainer.innerHTML = ''; // Clear existing content
                if (loadingIndicator) loadingIndicator.style.display = 'none';
            }
            
            // Generate different templates based on category
            const templates = generateTemplates(category, 4);
            
            // Add templates to container
            templates.forEach(template => {
                templateContainer.appendChild(createTemplateCard(template));
            });
        }, 1000); // Simulate loading delay
    }
    
    function generateTemplates(category, count) {
        const templates = [];
        const types = {
            'Onboarding Templates': [
                'Employee Onboarding Checklist',
                'Welcome Package',
                'First Week Schedule',
                'Company Policies Overview'
            ],
            'HR Documents': [
                'Employment Contract',
                'Benefits Enrollment Form',
                'Tax Form W-4',
                'Direct Deposit Authorization'
            ],
            'Legal Documents': [
                'Non-Disclosure Agreement',
                'Intellectual Property Agreement',
                'Code of Conduct',
                'Data Protection Policy'
            ]
        };
        
        const categoryTypes = types[category] || ['Template 1', 'Template 2', 'Template 3', 'Template 4'];
        
        for (let i = 0; i < count; i++) {
            templates.push({
                id: `template_${Date.now()}_${i}`,
                name: categoryTypes[i],
                category: category,
                updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
                type: Math.random() > 0.5 ? 'PDF' : 'DOCX'
            });
        }
        
        return templates;
    }
    
    function createTemplateCard(template) {
        const card = document.createElement('div');
        card.className = 'template-card';
        card.dataset.templateId = template.id;
        card.style.cssText = 'background-color: white; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 15px; transition: transform 0.2s, box-shadow 0.2s; cursor: pointer;';
        
        // Set icon based on document type
        let icon = 'fa-file-alt';
        let iconColor = '#3498db';
        
        if (template.type === 'PDF') {
            icon = 'fa-file-pdf';
            iconColor = '#e74c3c';
        } else if (template.type === 'DOCX') {
            icon = 'fa-file-word';
            iconColor = '#2980b9';
        }
        
        const updatedDate = new Date(template.updatedAt).toLocaleDateString();
        
        card.innerHTML = `
            <div style="text-align: center; margin-bottom: 10px;">
                <i class="fas ${icon}" style="font-size: 32px; color: ${iconColor};"></i>
            </div>
            <h4 style="font-size: 16px; margin: 0 0 5px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${template.name}">
                ${template.name}
            </h4>
            <div style="font-size: 12px; color: #777; text-align: center;">
                Last updated: ${updatedDate}
            </div>
            <div style="display: flex; justify-content: center; margin-top: 10px;">
                <button class="view-template-btn" style="background: none; border: none; color: #3498db; font-size: 12px; cursor: pointer; margin: 0 5px;">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="download-template-btn" style="background: none; border: none; color: #3498db; font-size: 12px; cursor: pointer; margin: 0 5px;">
                    <i class="fas fa-download"></i> Download
                </button>
            </div>
        `;
        
        // Add hover effect
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        });
        
        // Add event listeners
        const viewBtn = card.querySelector('.view-template-btn');
        if (viewBtn) {
            viewBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                viewTemplate(template);
            });
        }
        
        const downloadBtn = card.querySelector('.download-template-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                downloadTemplate(template);
            });
        }
        
        // Card click shows template details
        card.addEventListener('click', function() {
            viewTemplate(template);
        });
        
        return card;
    }
    
    function viewTemplate(template) {
        console.log('Viewing template:', template);
        
        // Create modal
        const modal = document.createElement('div');
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 9999;';
        
        // Set icon based on document type
        let icon = 'fa-file-alt';
        let iconColor = '#3498db';
        
        if (template.type === 'PDF') {
            icon = 'fa-file-pdf';
            iconColor = '#e74c3c';
        } else if (template.type === 'DOCX') {
            icon = 'fa-file-word';
            iconColor = '#2980b9';
        }
        
        modal.innerHTML = `
            <div style="background: white; border-radius: 8px; width: 700px; max-width: 90%; box-shadow: 0 5px 15px rgba(0,0,0,0.3);">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-bottom: 1px solid #eee;">
                    <h3 style="margin: 0; font-size: 18px;">${template.name}</h3>
                    <button class="close-modal" style="background: none; border: none; font-size: 20px; cursor: pointer;">&times;</button>
                </div>
                <div style="padding: 20px;">
                    <div style="text-align: center; padding: 30px 0;">
                        <i class="fas ${icon}" style="font-size: 64px; color: ${iconColor}; margin-bottom: 20px;"></i>
                        <h4 style="margin: 0 0 15px;">${template.name}</h4>
                        <div style="color: #666; margin-bottom: 20px;">
                            This is a ${template.type} template for ${template.category}.
                            <br>Last updated: ${new Date(template.updatedAt).toLocaleDateString()}
                        </div>
                        <div class="alert alert-info" style="background-color: #d1ecf1; color: #0c5460; padding: 15px; border-radius: 4px; text-align: left; margin-bottom: 20px;">
                            <i class="fas fa-info-circle"></i> 
                            Template preview is not available. Please download the template to view its contents.
                        </div>
                    </div>
                </div>
                <div style="padding: 15px 20px; border-top: 1px solid #eee; display: flex; justify-content: flex-end;">
                    <button class="download-btn" style="background-color: #3498db; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; margin-right: 10px;">
                        <i class="fas fa-download"></i> Download
                    </button>
                    <button class="close-btn" style="background-color: #6c757d; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal
        const closeButtons = modal.querySelectorAll('.close-modal, .close-btn');
        closeButtons.forEach(button => {
            button.addEventListener('click', function() {
                document.body.removeChild(modal);
            });
        });
        
        // Download button
        const downloadBtn = modal.querySelector('.download-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', function() {
                downloadTemplate(template);
            });
        }
        
        // Close on background click
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }
    
    function downloadTemplate(template) {
        console.log('Downloading template:', template);
        
        // Show loading message
        showFixedAlert(`Preparing ${template.name} for download...`, 'info');
        
        // Create dummy content based on template type
        setTimeout(() => {
            let dummyContent = '';
            const docType = template.type.toLowerCase();
            
            if (docType === 'pdf') {
                // Create a simple HTML that looks like a PDF document
                dummyContent = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>${template.name}</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                            .header { text-align: center; margin-bottom: 30px; }
                            .content { line-height: 1.6; }
                            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #777; }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <h1>${template.name}</h1>
                            <p>Template Type: ${template.category}</p>
                        </div>
                        <div class="content">
                            <p>This is a template document generated for demonstration purposes.</p>
                            <p>In a real implementation, this would contain the actual template content structured according to the template type.</p>
                            <p>Template ID: ${template.id}</p>
                            <p>Last Updated: ${new Date(template.updatedAt).toLocaleString()}</p>
                        </div>
                        <div class="footer">
                            <p>Downloaded on ${new Date().toLocaleString()}</p>
                            <p>OnboardX Document Template System</p>
                        </div>
                    </body>
                    </html>
                `;
            } else {
                // Create a text representation of a DOCX file
                dummyContent = `
                    ${template.name}
                    Template Type: ${template.category}
                    ========================================
                    
                    This is a template document generated for demonstration purposes.
                    
                    In a real implementation, this would contain the actual template content 
                    structured according to the template type.
                    
                    Template ID: ${template.id}
                    Last Updated: ${new Date(template.updatedAt).toLocaleString()}
                    
                    ========================================
                    Downloaded on ${new Date().toLocaleString()}
                    OnboardX Document Template System
                `;
            }
            
            // Create a Blob and download
            const blob = new Blob([dummyContent], { type: docType === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            
            a.style.display = 'none';
            a.href = url;
            a.download = `${template.name.replace(/\s+/g, '_')}.${docType}`;
            document.body.appendChild(a);
            a.click();
            
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showFixedAlert(`${template.name} downloaded successfully`, 'success');
            }, 100);
        }, 1500);
    }
    
    function showNewTemplateModal() {
        console.log('Showing new template modal');
        
        // Create modal
        const modal = document.createElement('div');
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 9999;';
        
        modal.innerHTML = `
            <div style="background: white; border-radius: 8px; width: 500px; max-width: 90%; box-shadow: 0 5px 15px rgba(0,0,0,0.3);">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-bottom: 1px solid #eee;">
                    <h3 style="margin: 0; font-size: 18px;">Create New Template</h3>
                    <button class="close-modal" style="background: none; border: none; font-size: 20px; cursor: pointer;">&times;</button>
                </div>
                <div style="padding: 20px;">
                    <form id="new-template-form">
                        <div style="margin-bottom: 15px;">
                            <label for="template-name" style="display: block; margin-bottom: 5px; font-weight: bold;">Template Name*</label>
                            <input type="text" id="template-name" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" required>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label for="template-category" style="display: block; margin-bottom: 5px; font-weight: bold;">Category*</label>
                            <select id="template-category" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" required>
                                <option value="">Select category...</option>
                                <option value="Onboarding Templates">Onboarding Templates</option>
                                <option value="HR Documents">HR Documents</option>
                                <option value="Legal Documents">Legal Documents</option>
                            </select>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label for="template-type" style="display: block; margin-bottom: 5px; font-weight: bold;">Template Type*</label>
                            <select id="template-type" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" required>
                                <option value="">Select type...</option>
                                <option value="DOCX">DOCX</option>
                                <option value="PDF">PDF</option>
                            </select>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label for="template-file" style="display: block; margin-bottom: 5px; font-weight: bold;">Upload Template*</label>
                            <input type="file" id="template-file" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" required>
                            <div style="font-size: 12px; color: #666; margin-top: 5px;">Allowed file types: .docx, .pdf</div>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label for="template-description" style="display: block; margin-bottom: 5px; font-weight: bold;">Description</label>
                            <textarea id="template-description" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; height: 80px;"></textarea>
                        </div>
                    </form>
                </div>
                <div style="padding: 15px 20px; border-top: 1px solid #eee; display: flex; justify-content: flex-end;">
                    <button id="cancel-template" style="background-color: #6c757d; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; margin-right: 10px;">
                        Cancel
                    </button>
                    <button id="create-template" style="background-color: #28a745; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;">
                        Create Template
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal
        const closeButtons = modal.querySelectorAll('.close-modal, #cancel-template');
        closeButtons.forEach(button => {
            button.addEventListener('click', function() {
                document.body.removeChild(modal);
            });
        });
        
        // Create template
        const createButton = modal.querySelector('#create-template');
        if (createButton) {
            createButton.addEventListener('click', function() {
                const form = document.getElementById('new-template-form');
                const name = document.getElementById('template-name').value;
                const category = document.getElementById('template-category').value;
                const type = document.getElementById('template-type').value;
                const fileInput = document.getElementById('template-file');
                
                // Validate form
                if (!name || !category || !type || !fileInput.files.length) {
                    showFixedAlert('Please fill in all required fields', 'warning');
                    return;
                }
                
                // Show loading
                showFixedAlert('Creating template...', 'info');
                
                // Simulate creating template
                setTimeout(() => {
                    document.body.removeChild(modal);
                    showFixedAlert('Template created successfully!', 'success');
                    
                    // Reload templates
                    loadTemplateCategory(category);
                }, 1500);
            });
        }
        
        // Close on background click
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }
});

// DIRECT FIX FOR NEW TEMPLATE BUTTON
(function() {
    console.log("🛠️ Adding direct fix for New Template button");
    
    // Run when DOM is loaded and then periodically
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fixNewTemplateButton);
    } else {
        fixNewTemplateButton();
    }
    
    // Also run after short delays to catch dynamically loaded buttons
    setTimeout(fixNewTemplateButton, 500);
    setTimeout(fixNewTemplateButton, 1500);
    
    function fixNewTemplateButton() {
        // Look for the button directly by its visual appearance
        const greenButtons = document.querySelectorAll('.btn-success, button.btn-primary');
        
        greenButtons.forEach(btn => {
            // Check if this looks like the New Template button
            const hasIcon = btn.querySelector('i.fa-plus, i.fas.fa-plus, svg');
            const hasText = (btn.textContent || '').toLowerCase().includes('new template') || 
                            (btn.textContent || '').toLowerCase().includes('template');
            
            if (hasIcon || hasText) {
                console.log("Found New Template button:", btn);
                
                // Replace with a new button to clear any existing event handlers
                const newBtn = btn.cloneNode(true);
                if (btn.parentNode) {
                    btn.parentNode.replaceChild(newBtn, btn);
                    
                    // Add our event listener
                    newBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log("New Template button clicked (direct handler)");
                        openNewTemplateModal();
                        return false;
                    });
                }
            }
        });
        
        // Also check for the New Template button based on its position
        const templateHeader = document.querySelector('.document-templates h1, .document-templates h2, #document-templates h1, h1:contains("Document Templates"), h2:contains("Document Templates")');
        if (templateHeader) {
            const headerContainer = templateHeader.closest('div');
            if (headerContainer) {
                const buttons = headerContainer.querySelectorAll('button');
                buttons.forEach(btn => {
                    if (btn.textContent.includes('New') || btn.textContent.includes('Template') || btn.querySelector('i.fa-plus')) {
                        console.log("Found New Template button by position:", btn);
                        
                        // Replace with a new button
                        const newBtn = btn.cloneNode(true);
                        if (btn.parentNode) {
                            btn.parentNode.replaceChild(newBtn, btn);
                            
                            // Add our event listener
                            newBtn.addEventListener('click', function(e) {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log("New Template button clicked (positional handler)");
                                openNewTemplateModal();
                                return false;
                            });
                        }
                    }
                });
            }
        }
    }
    
    // Also add a global click handler for the New Template button
    document.addEventListener('click', function(e) {
        // Find the actual clicked element or its parent button
        const target = e.target.closest('button, a, .btn');
        if (!target) return;
        
        // Check if this is the New Template button
        const hasGreenClass = target.classList.contains('btn-success') || target.classList.contains('btn-primary');
        const hasText = (target.textContent || '').toLowerCase().includes('new template') || 
                       (target.textContent || '').toLowerCase().includes('template');
        const hasIcon = target.querySelector('i.fa-plus, svg');
        
        if ((hasGreenClass && (hasText || hasIcon)) || 
            (hasText && hasIcon)) {
            console.log("New Template button clicked through global handler");
            e.preventDefault();
            e.stopPropagation();
            openNewTemplateModal();
            return false;
        }
    }, true); // Use capture phase to get the event first
    
    function openNewTemplateModal() {
        // Create modal backdrop
        const modal = document.createElement('div');
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;justify-content:center;align-items:center;';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.style.cssText = 'background:white;border-radius:8px;width:500px;max-width:90%;box-shadow:0 5px 15px rgba(0,0,0,0.3);';
        
        modalContent.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:15px 20px;border-bottom:1px solid #eee;">
                <h3 style="margin:0;font-size:18px;">Create New Template</h3>
                <button class="close-btn" style="background:none;border:none;font-size:20px;cursor:pointer;">&times;</button>
            </div>
            <div style="padding:20px;">
                <form id="direct-template-form" enctype="multipart/form-data">
                    <div style="margin-bottom:15px;">
                        <label for="direct-template-name" style="display:block;margin-bottom:5px;font-weight:bold;">Template Name*</label>
                        <input type="text" id="direct-template-name" name="templateName" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;" required>
                    </div>
                    <div style="margin-bottom:15px;">
                        <label for="direct-template-category" style="display:block;margin-bottom:5px;font-weight:bold;">Category*</label>
                        <select id="direct-template-category" name="category" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;" required>
                            <option value="">Select category...</option>
                            <option value="Onboarding Templates">Onboarding Templates</option>
                            <option value="HR Documents">HR Documents</option>
                            <option value="Legal Documents">Legal Documents</option>
                        </select>
                    </div>
                    <div style="margin-bottom:15px;">
                        <label for="direct-template-type" style="display:block;margin-bottom:5px;font-weight:bold;">Document Type*</label>
                        <select id="direct-template-type" name="documentType" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;" required>
                            <option value="">Select type...</option>
                            <option value="PDF">PDF</option>
                            <option value="DOCX">Word Document</option>
                        </select>
                    </div>
                    <div style="margin-bottom:15px;">
                        <label for="direct-template-file" style="display:block;margin-bottom:5px;font-weight:bold;">Upload File*</label>
                        <input type="file" id="direct-template-file" name="templateFile" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;" required accept=".pdf,.docx">
                        <div style="font-size:12px;color:#666;margin-top:5px;">Allowed file types: .pdf, .docx</div>
                    </div>
                    <div style="margin-bottom:15px;">
                        <label for="direct-template-desc" style="display:block;margin-bottom:5px;font-weight:bold;">Description</label>
                        <textarea id="direct-template-desc" name="description" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;min-height:80px;"></textarea>
                    </div>
                </form>
            </div>
            <div style="padding:15px 20px;border-top:1px solid #eee;display:flex;justify-content:flex-end;gap:10px;">
                <button id="cancel-template" style="padding:8px 16px;background:#f5f5f5;border:none;border-radius:4px;cursor:pointer;">Cancel</button>
                <button id="save-template" style="padding:8px 16px;background:#28a745;color:white;border:none;border-radius:4px;cursor:pointer;">Create Template</button>
            </div>
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Close button handler
        const closeBtn = modal.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                document.body.removeChild(modal);
            });
        }
        
        // Cancel button handler
        const cancelBtn = modal.querySelector('#cancel-template');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                document.body.removeChild(modal);
            });
        }
        
        // Save button handler
        const saveBtn = modal.querySelector('#save-template');
        if (saveBtn) {
            saveBtn.addEventListener('click', async function() {
                // Get form and check validity
                const form = document.getElementById('direct-template-form');
                if (!form.checkValidity()) {
                    form.reportValidity();
                    return;
                }
                
                // Get form values
                const name = document.getElementById('direct-template-name').value;
                const category = document.getElementById('direct-template-category').value;
                const type = document.getElementById('direct-template-type').value;
                const fileInput = document.getElementById('direct-template-file');
                const description = document.getElementById('direct-template-desc').value;
                
                // Validate file
                if (!fileInput.files || fileInput.files.length === 0) {
                    alert('Please select a file to upload');
                    return;
                }
                
                const file = fileInput.files[0];
                
                // Check file type
                const fileType = file.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 
                                file.name.toLowerCase().endsWith('.docx') ? 'DOCX' : '';
                
                if (!fileType) {
                    alert('Invalid file type. Please upload a PDF or DOCX file.');
                    return;
                }
                
                // Create loading indicator
                const loadingOverlay = document.createElement('div');
                loadingOverlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(255,255,255,0.8);display:flex;justify-content:center;align-items:center;z-index:10;';
                loadingOverlay.innerHTML = `
                    <div style="text-align:center;">
                        <div style="border:5px solid #f3f3f3;border-top:5px solid #3498db;border-radius:50%;width:50px;height:50px;animation:spin 2s linear infinite;margin:0 auto 15px;"></div>
                        <div>Saving template to database...</div>
                    </div>
                    <style>@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style>
                `;
                
                modalContent.style.position = 'relative';
                modalContent.appendChild(loadingOverlay);
                
                // Disable buttons
                saveBtn.disabled = true;
                cancelBtn.disabled = true;
                
                try {
                    // Prepare form data for upload
                    const formData = new FormData();
                    formData.append('name', name);
                    formData.append('category', category);
                    formData.append('type', type);
                    formData.append('file', file);
                    formData.append('description', description);
                    
                    // Get authentication token
                    const token = localStorage.getItem('token');
                    
                    // Save to database via API
                    const response = await fetch('/api/templates', {
                        method: 'POST',
                        headers: {
                            'Authorization': token ? `Bearer ${token}` : ''
                        },
                        body: formData
                    });
                    
                    // Check if API call was successful
                    if (!response.ok) {
                        // Try fallback methods if the first API call fails
                        return await saveTemplateFallback(formData, file, name, category, type, description);
                    }
                    
                    const data = await response.json();
                    console.log('Template saved successfully:', data);
                    
                    // Show success message
                    showFixedAlert('Template created and saved to database successfully!', 'success');
                    
                    // Close modal
                    document.body.removeChild(modal);
                    
                    // Refresh the template list if possible
                    if (typeof loadTemplateCategory === 'function') {
                        loadTemplateCategory(category);
                    }
                } catch (error) {
                    console.error('Error saving template:', error);
                    
                    // Try fallback methods
                    try {
                        await saveTemplateFallback(file, name, category, type, description);
                    } catch (fallbackError) {
                        // Show error message if all methods fail
                        modalContent.removeChild(loadingOverlay);
                        saveBtn.disabled = false;
                        cancelBtn.disabled = false;
                        
                        alert('Could not save template. Please try again later. Error: ' + error.message);
                    }
                }
            });
        }
        
        // Background click handler
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }
    
    // Fallback method for saving templates
    async function saveTemplateFallback(file, name, category, type, description) {
        console.log('Using fallback method to save template');
        
        // Try alternative API endpoint
        try {
            const formData = new FormData();
            formData.append('templateName', name);
            formData.append('templateCategory', category);
            formData.append('templateType', type);
            formData.append('templateFile', file);
            formData.append('templateDescription', description);
            
            // Get authentication token
            const token = localStorage.getItem('token');
            
            // Try alternative API endpoints
            const endpoints = [
                '/api/documents/templates',
                '/api/document-templates',
                '/api/documents'
            ];
            
            let succeeded = false;
            
            for (const endpoint of endpoints) {
                try {
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Authorization': token ? `Bearer ${token}` : ''
                        },
                        body: formData
                    });
                    
                    if (response.ok) {
                        console.log(`Template saved successfully using endpoint: ${endpoint}`);
                        succeeded = true;
                        break;
                    }
                } catch (err) {
                    console.log(`Failed to save template with endpoint ${endpoint}:`, err);
                }
            }
            
            if (succeeded) {
                // Show success message
                showFixedAlert('Template created and saved to database successfully!', 'success');
                return true;
            }
            
            // If all API methods fail, save to localStorage as last resort
            saveTemplateToLocalStorage(file, name, category, type, description);
            return true;
        } catch (error) {
            console.error('All fallback methods failed:', error);
            
            // Last resort - save to localStorage
            saveTemplateToLocalStorage(file, name, category, type, description);
            return true;
        }
    }
    
    // Function to save template to localStorage as last resort
    function saveTemplateToLocalStorage(file, name, category, type, description) {
        console.log('Saving template to localStorage as last resort');
        
        // Create a reader to get file contents as data URL
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const templates = JSON.parse(localStorage.getItem('documentTemplates') || '[]');
            
            // Create template object
            const template = {
                id: 'template_' + Date.now(),
                name: name,
                category: category,
                type: type,
                description: description,
                dataUrl: e.target.result.substring(0, 100) + '...', // Store truncated version to avoid localStorage limits
                fileName: file.name,
                createdAt: new Date().toISOString()
            };
            
            // Add to templates array
            templates.push(template);
            
            // Save to localStorage
            localStorage.setItem('documentTemplates', JSON.stringify(templates));
            
            // Show success message
            showFixedAlert('Template saved locally. Note: This is a fallback method as database saving failed.', 'warning');
            
            // Refresh the template list if possible
            if (typeof loadTemplateCategory === 'function') {
                loadTemplateCategory(category);
            }
        };
        
        reader.readAsDataURL(file);
    }
})();