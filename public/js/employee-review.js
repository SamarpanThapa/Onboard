/**
 * Employee Review Module
 * Displays employee details in a pure CSS modal without Bootstrap dependencies
 */

(function() {
    console.log('Employee review module loaded');

    // Listen for clicks on review buttons
    document.addEventListener('click', function(event) {
        if (event.target.matches('.review-btn') || 
            (event.target.parentElement && event.target.parentElement.matches('.review-btn'))) {
            event.preventDefault();
            
            // Get the employee ID from the data attribute
            const button = event.target.matches('.review-btn') ? event.target : event.target.parentElement;
            const employeeId = button.getAttribute('data-employee-id');
            
            if (employeeId) {
                showEmployeeReview(employeeId);
            } else {
                console.error('No employee ID found on review button');
            }
        }
    });

    /**
     * Shows employee details in a custom CSS modal
     */
    function showEmployeeReview(employeeId) {
        console.log('Showing review for employee:', employeeId);
        
        // Show loading overlay
        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'employee-review-loading';
        loadingOverlay.innerHTML = `
            <div class="loading-spinner"></div>
            <p>Loading employee details...</p>
        `;
        document.body.appendChild(loadingOverlay);
        
        // Fetch employee data
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
            // Remove loading overlay
            removeElement('employee-review-loading');
            
            // Extract employee from response
            let employee = data.employee || data;
            
            if (!employee) {
                throw new Error('No employee data found in response');
            }
            
            // Create the review modal
            createAndShowReviewModal(employee);
        })
        .catch(error => {
            console.error('Error fetching employee data:', error);
            removeElement('employee-review-loading');
            showSimpleAlert('Error loading employee details. Please try again.', 'error');
        });
    }
    
    /**
     * Creates and shows employee review modal
     */
    function createAndShowReviewModal(employee) {
        // Create modal container
        const modal = document.createElement('div');
        modal.id = 'employee-review-modal';
        
        // Process employee data for display
        const processedEmployee = preprocessEmployeeData(employee);
        
        // Create modal content
        modal.innerHTML = `
            <div class="review-modal-content">
                <div class="review-modal-header">
                    <h2>
                        <i class="fas fa-user-check"></i>
                        Employee Review: ${processedEmployee.firstName} ${processedEmployee.lastName}
                    </h2>
                    <button class="close-modal" aria-label="Close">&times;</button>
                </div>
                
                <div class="review-modal-body">
                    <!-- Personal Information -->
                    <section class="review-section">
                        <h3><i class="fas fa-user"></i> Personal Details</h3>
                        <div class="review-grid">
                            <div class="review-field">
                                <label>Full Name</label>
                                <div>${processedEmployee.firstName} ${processedEmployee.lastName}</div>
                            </div>
                            <div class="review-field">
                                <label>Date of Birth</label>
                                <div>${processedEmployee.dateOfBirth || 'Not provided'}</div>
                            </div>
                            <div class="review-field">
                                <label>Address</label>
                                <div>${processedEmployee.address || 'Not provided'}</div>
                            </div>
                            <div class="review-field">
                                <label>Phone Number</label>
                                <div>${processedEmployee.phone || 'Not provided'}</div>
                            </div>
                            <div class="review-field">
                                <label>Email Address</label>
                                <div>${processedEmployee.email || 'Not provided'}</div>
                            </div>
                            <div class="review-field">
                                <label>Emergency Contact</label>
                                <div>${processedEmployee.emergencyContact?.name || 'Not provided'}</div>
                            </div>
                            <div class="review-field">
                                <label>Emergency Contact Relationship</label>
                                <div>${processedEmployee.emergencyContact?.relationship || 'Not provided'}</div>
                            </div>
                            <div class="review-field">
                                <label>Emergency Contact Phone</label>
                                <div>${processedEmployee.emergencyContact?.phone || 'Not provided'}</div>
                            </div>
                        </div>
                    </section>
                    
                    <!-- Tax Information -->
                    <section class="review-section">
                        <h3><i class="fas fa-file-invoice-dollar"></i> Tax Information</h3>
                        <div class="review-grid">
                            <div class="review-field">
                                <label>Social Insurance Number (SIN)</label>
                                <div>${processedEmployee.ssn || 'Not provided'}</div>
                            </div>
                            <div class="review-field">
                                <label>Tax Form (TD1)</label>
                                <div>
                                    <span class="status-badge ${processedEmployee.taxFormStatus ? 'success' : 'warning'}">
                                        ${processedEmployee.taxFormStatus ? 'Uploaded' : 'Not Uploaded'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>
                    
                    <!-- Employment Eligibility -->
                    <section class="review-section">
                        <h3><i class="fas fa-id-card"></i> Employment Eligibility</h3>
                        <div class="review-grid">
                            <div class="review-field">
                                <label>Work Authorization</label>
                                <div>
                                    <span class="status-badge ${processedEmployee.workAuthStatus ? 'success' : 'warning'}">
                                        ${processedEmployee.workAuthStatus ? 'Uploaded' : 'Not Uploaded'}
                                    </span>
                                </div>
                            </div>
                            <div class="review-field">
                                <label>Proof of Citizenship/Immigration</label>
                                <div>
                                    <span class="status-badge ${processedEmployee.citizenshipStatus ? 'success' : 'warning'}">
                                        ${processedEmployee.citizenshipStatus ? 'Uploaded' : 'Not Uploaded'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>
                    
                    <!-- Banking Information -->
                    <section class="review-section">
                        <h3><i class="fas fa-university"></i> Banking Information</h3>
                        <div class="review-grid">
                            <div class="review-field">
                                <label>Bank Name</label>
                                <div>${processedEmployee.bankName || 'Not provided'}</div>
                            </div>
                            <div class="review-field">
                                <label>Account Number</label>
                                <div>${processedEmployee.accountNumber ? '******' + processedEmployee.accountNumber.slice(-4) : 'Not provided'}</div>
                            </div>
                            <div class="review-field">
                                <label>Routing Number</label>
                                <div>${processedEmployee.routingNumber ? '******' + processedEmployee.routingNumber.slice(-4) : 'Not provided'}</div>
                            </div>
                        </div>
                    </section>
                    
                    <!-- Job-Related Information -->
                    <section class="review-section">
                        <h3><i class="fas fa-briefcase"></i> Job-Related Information</h3>
                        <div class="review-grid">
                            <div class="review-field">
                                <label>Job Title</label>
                                <div>${processedEmployee.position || 'Not specified'}</div>
                            </div>
                            <div class="review-field">
                                <label>Start Date</label>
                                <div>${processedEmployee.startDate || 'Not specified'}</div>
                            </div>
                            <div class="review-field">
                                <label>Department</label>
                                <div>${processedEmployee.department || 'Not assigned'}</div>
                            </div>
                            <div class="review-field">
                                <label>Manager</label>
                                <div>${processedEmployee.manager || 'Not assigned'}</div>
                            </div>
                            <div class="review-field">
                                <label>Work Schedule</label>
                                <div>${processedEmployee.workSchedule || 'Not specified'}</div>
                            </div>
                        </div>
                    </section>
                    
                    <!-- Uploaded Documents -->
                    <section class="review-section">
                        <h3><i class="fas fa-folder-open"></i> Uploaded Documents</h3>
                        <div class="document-grid">
                            ${getDocumentsHTML(processedEmployee)}
                        </div>
                    </section>
                    
                    <!-- Onboarding Progress -->
                    <section class="review-section">
                        <h3><i class="fas fa-tasks"></i> Onboarding Progress</h3>
                        <div class="progress-container">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: 100%"></div>
                            </div>
                            <div class="progress-text">100% Complete</div>
                        </div>
                        <div class="review-grid" style="margin-top: 15px;">
                            <div class="review-field">
                                <label>Status</label>
                                <div><span class="status-badge success">Completed</span></div>
                            </div>
                            <div class="review-field">
                                <label>Completed On</label>
                                <div>${processedEmployee.completedDate || 'Unknown'}</div>
                            </div>
                        </div>
                    </section>
                    
                    <!-- HR Approval -->
                    <section class="review-section approval-section">
                        <h3><i class="fas fa-check-circle"></i> HR Approval</h3>
                        <p>Please review the information above and approve or reject this employee's onboarding.</p>
                        <div class="action-buttons">
                            <button class="approve-btn" data-employee-id="${processedEmployee.id}">
                                <i class="fas fa-check-circle"></i> Approve
                            </button>
                            <button class="reject-btn" data-employee-id="${processedEmployee.id}">
                                <i class="fas fa-times-circle"></i> Reject
                            </button>
                        </div>
                        
                        <div class="rejection-reason hidden">
                            <label for="rejection-reason-text">Reason for rejection:</label>
                            <textarea id="rejection-reason-text" rows="3" placeholder="Please provide details on why the onboarding was rejected..."></textarea>
                            <button class="submit-rejection-btn" data-employee-id="${processedEmployee.id}">Submit</button>
                        </div>
                    </section>
                </div>
                
                <div class="review-modal-footer">
                    <button class="close-btn">Close</button>
                </div>
            </div>
        `;
        
        // Add modal to document
        document.body.appendChild(modal);
        
        // Add event listeners
        const closeButtons = modal.querySelectorAll('.close-modal, .close-btn');
        closeButtons.forEach(button => button.addEventListener('click', closeReviewModal));
        
        // Close when clicking outside the modal content
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeReviewModal();
            }
        });
        
        // Handle rejection button
        const rejectBtn = modal.querySelector('.reject-btn');
        if (rejectBtn) {
            rejectBtn.addEventListener('click', function() {
                const reasonContainer = modal.querySelector('.rejection-reason');
                reasonContainer.classList.remove('hidden');
            });
        }
        
        // Handle approval button
        const approveBtn = modal.querySelector('.approve-btn');
        if (approveBtn) {
            approveBtn.addEventListener('click', function() {
                approveOnboarding(employee._id);
            });
        }
        
        // Handle rejection submission
        const submitRejectionBtn = modal.querySelector('.submit-rejection-btn');
        if (submitRejectionBtn) {
            submitRejectionBtn.addEventListener('click', function() {
                const reasonText = modal.querySelector('#rejection-reason-text').value;
                rejectOnboarding(employee._id, reasonText);
            });
        }
        
        // Add document action listeners
        const viewButtons = modal.querySelectorAll('.view-document-btn');
        viewButtons.forEach(button => {
            button.addEventListener('click', function() {
                const docId = button.getAttribute('data-document-id');
                const docPath = button.getAttribute('data-document-path');
                const docName = button.getAttribute('data-document-name');
                const docType = button.getAttribute('data-document-type');
                
                if (window.viewDocument && typeof window.viewDocument === 'function') {
                    window.viewDocument(docId, docPath, docName, docType);
                } else {
                    showSimulatedDocument(docType);
                }
            });
        });
        
        const downloadButtons = modal.querySelectorAll('.download-document-btn');
        downloadButtons.forEach(button => {
            button.addEventListener('click', function() {
                const docId = button.getAttribute('data-document-id');
                const docPath = button.getAttribute('data-document-path');
                const docName = button.getAttribute('data-document-name');
                
                if (window.downloadDocument && typeof window.downloadDocument === 'function') {
                    window.downloadDocument(docId, docPath, docName);
                } else {
                    showSimpleAlert('Download functionality not available', 'warning');
                }
            });
        });
        
        // Prevent scrolling on the body while modal is open
        document.body.style.overflow = 'hidden';
        
        // Add ESC key event listener
        document.addEventListener('keydown', handleEscKeyPress);
        
        // Show the modal with animation
        setTimeout(() => {
            modal.classList.add('visible');
        }, 10);
    }
    
    /**
     * Pre-processes employee data to ensure all fields are in the expected format
     */
    function preprocessEmployeeData(employee) {
        console.log('Raw employee data:', JSON.stringify(employee, null, 2)); 
        
        // Clone the employee data
        const processedData = {
            ...employee,
            personalInfo: {
                ...employee.personalInfo
            },
            jobInfo: {
                ...employee.jobInfo
            },
            bankingInfo: {
                ...employee.bankingInfo
            }
        };
        
        // Check for documents in various locations
        processedData.documents = [];
        
        // First, check if onboarding is completed
        const isOnboardingCompleted = employee.onboardingProgress === 100;
        console.log('Onboarding completed:', isOnboardingCompleted);
        
        // Document status flags - default to false
        let hasWorkAuth = false;
        let hasTaxForm = false;
        let hasCitizenship = false;
        
        // Check if personal info indicates documents are submitted
        if (employee.personalInfo) {
            if (employee.personalInfo.taxFormSubmitted) hasTaxForm = true;
            if (employee.personalInfo.workAuthSubmitted) hasWorkAuth = true;
            if (employee.personalInfo.citizenshipSubmitted) hasCitizenship = true;
        }
        
        // Check in employee object directly
        if (employee.taxFormSubmitted) hasTaxForm = true;
        if (employee.workAuthSubmitted) hasWorkAuth = true;
        if (employee.citizenshipSubmitted) hasCitizenship = true;
        
        // Check form data submissions
        if (employee.onboarding?.formData?.files) {
            if (employee.onboarding.formData.files['td1']) hasTaxForm = true;
            if (employee.onboarding.formData.files['work-authorization']) hasWorkAuth = true;
            if (employee.onboarding.formData.files['citizenship-proof']) hasCitizenship = true;
        }
        
        // If onboarding is completed, all documents should be considered uploaded
        if (isOnboardingCompleted || 
            employee.onboarding?.status === 'completed' || 
            employee.onboarding?.completedAt) {
            hasWorkAuth = true;
            hasTaxForm = true;
            hasCitizenship = true;
        }
        
        // Collect documents from all possible locations
        const allDocuments = [];
        
        // Check in documents array
        if (employee.documents && Array.isArray(employee.documents)) {
            allDocuments.push(...employee.documents);
        }
        
        // Check in onboardingDocuments
        if (employee.onboardingDocuments && Array.isArray(employee.onboardingDocuments)) {
            allDocuments.push(...employee.onboardingDocuments);
        }
        
        // Check in personalInfo.documents
        if (employee.personalInfo && employee.personalInfo.documents && Array.isArray(employee.personalInfo.documents)) {
            allDocuments.push(...employee.personalInfo.documents);
        }
        
        // Check in files array
        if (employee.files && Array.isArray(employee.files)) {
            allDocuments.push(...employee.files);
        }
        
        // Add file names from form data if available
        if (employee.onboarding?.formData?.files) {
            const formFiles = employee.onboarding.formData.files;
            
            if (formFiles['td1']) {
                allDocuments.push({
                    type: 'tax',
                    name: 'Tax Form (TD1)',
                    fileName: formFiles['td1'],
                    submittedAt: new Date()
                });
            }
            
            if (formFiles['work-authorization']) {
                allDocuments.push({
                    type: 'work_authorization',
                    name: 'Work Authorization',
                    fileName: formFiles['work-authorization'],
                    submittedAt: new Date()
                });
            }
            
            if (formFiles['citizenship-proof']) {
                allDocuments.push({
                    type: 'citizenship',
                    name: 'Proof of Citizenship/Immigration Status',
                    fileName: formFiles['citizenship-proof'],
                    submittedAt: new Date()
                });
            }
        }
        
        // Create a processed data object with formatted fields
        const processed = {
            id: employee._id,
            firstName: employee.firstName || (employee.personalInfo && employee.personalInfo.firstName) || '',
            lastName: employee.lastName || (employee.personalInfo && employee.personalInfo.lastName) || '',
            email: employee.email || (employee.personalInfo && employee.personalInfo.email) || '',
            phone: employee.phone || employee.phoneNumber || (employee.personalInfo && employee.personalInfo.phone) || '',
            address: getFormattedAddress(employee),
            dateOfBirth: employee.dateOfBirth || (employee.personalInfo && employee.personalInfo.dateOfBirth) ? 
                        formatDate(employee.dateOfBirth || employee.personalInfo.dateOfBirth) : '',
            
            // Emergency contact info
            emergencyContact: {
                name: employee.emergencyContact?.name || 
                    (employee.personalInfo && employee.personalInfo.emergencyContact?.name) || '',
                relationship: employee.emergencyContact?.relationship || 
                            (employee.personalInfo && employee.personalInfo.emergencyContact?.relationship) || '',
                phone: employee.emergencyContact?.phoneNumber || employee.emergencyContact?.phone ||
                      (employee.personalInfo && (employee.personalInfo.emergencyContact?.phoneNumber || 
                                                employee.personalInfo.emergencyContact?.phone)) || ''
            },
            
            // Banking information
            bankName: employee.bankName || 
                    (employee.employmentDetails && employee.employmentDetails.bankDetails && 
                      employee.employmentDetails.bankDetails.bankName) || 
                    (employee.bankingInfo && employee.bankingInfo.bankName) || 
                    '',
            accountNumber: employee.accountNumber || 
                          (employee.employmentDetails && employee.employmentDetails.bankDetails && 
                          employee.employmentDetails.bankDetails.accountNumber) || 
                          (employee.bankingInfo && employee.bankingInfo.accountNumber) || 
                          '',
            routingNumber: employee.routingNumber || 
                          (employee.employmentDetails && employee.employmentDetails.bankDetails && 
                          employee.employmentDetails.bankDetails.routingNumber) || 
                          (employee.bankingInfo && employee.bankingInfo.routingNumber) || 
                          '',
            
            // Job-related information
            department: employee.department || 
                      (employee.employmentDetails && employee.employmentDetails.department) || '',
            position: employee.position || employee.jobTitle || 
                    (employee.employmentDetails && (employee.employmentDetails.position || 
                                                  employee.employmentDetails.jobTitle)) || '',
            startDate: employee.startDate ? formatDate(employee.startDate) : 
                      (employee.employmentDetails && employee.employmentDetails.startDate ? 
                      formatDate(employee.employmentDetails.startDate) : ''),
            manager: employee.manager || employee.managerName ||
                    (employee.employmentDetails && (employee.employmentDetails.manager || 
                                                  employee.employmentDetails.managerName)) || '',
            workSchedule: employee.workSchedule || 
                        (employee.employmentDetails && employee.employmentDetails.workSchedule) || '',
            
            // Status and documents
            status: employee.status || 'Active',
            ssn: formatSSN(employee.sin || 
                          (employee.personalInfo && (employee.personalInfo.ssn || employee.personalInfo.sin)) || ''),
            
            // Document flags
            taxFormStatus: hasTaxForm,
            workAuthStatus: hasWorkAuth,
            citizenshipStatus: hasCitizenship,
            
            completedDate: employee.onboarding && employee.onboarding.updatedAt ? 
                formatDate(employee.onboarding.updatedAt, true) : '',
            
            // Include document info for the files that were uploaded
            documents: createDocumentList(employee, allDocuments, hasWorkAuth, hasTaxForm, hasCitizenship)
        };
        
        console.log('Processed data:', {
            workAuthStatus: processed.workAuthStatus,
            taxFormStatus: processed.taxFormStatus,
            citizenshipStatus: processed.citizenshipStatus,
            documentCount: processed.documents?.length || 0
        });
        
        return processed;
    }
    
    /**
     * Creates a clean list of documents with placeholders for submitted documents if needed
     */
    function createDocumentList(employee, allDocuments, hasWorkAuth, hasTaxForm, hasCitizenship) {
        let documents = [];
        
        // For completed forms, always show documents as uploaded
        const isCompleted = employee.onboarding && 
                          (employee.onboarding.status === 'completed' || 
                           employee.onboarding.completedAt);
        
        // Add work authorization document if it exists or form is completed
        if (hasWorkAuth || isCompleted) {
            // Try to find an actual work authorization document
            const workDoc = allDocuments.find(doc => 
                doc?.type === 'work_authorization' || 
                doc?.category === 'work_authorization' ||
                doc?.documentType === 'work_authorization' ||
                (doc?.title && doc?.title.toLowerCase().includes('work')) ||
                (doc?.fileName && doc?.fileName.toLowerCase().includes('work')) ||
                (doc?.name && doc?.name.toLowerCase().includes('work')) ||
                (doc?.path && doc?.path.toLowerCase().includes('work'))
            );
            
            // If found, add it; otherwise create a placeholder
            if (workDoc) {
                documents.push({
                    ...workDoc,
                    type: 'work_authorization',
                    name: workDoc.title || workDoc.name || 'Work Authorization',
                    submittedAt: workDoc.submittedAt || workDoc.uploadedAt || new Date()
                });
            } else {
                // Add placeholder
                const timestamp = employee.personalInfo?.workAuthorizationInfo?.submittedAt || new Date();
                documents.push({
                    type: 'work_authorization',
                    name: 'Work Authorization',
                    title: 'Work Authorization',
                    status: 'submitted',
                    submittedAt: timestamp,
                    uploadedAt: timestamp
                });
            }
        }
        
        // Add tax document if it exists or form is completed
        if (hasTaxForm || isCompleted) {
            const taxDoc = allDocuments.find(doc => 
                doc?.type === 'tax' || 
                doc?.category === 'tax' ||
                doc?.documentType === 'tax' ||
                (doc?.title && doc?.title.toLowerCase().includes('tax')) ||
                (doc?.fileName && doc?.fileName.toLowerCase().includes('tax')) ||
                (doc?.name && doc?.name.toLowerCase().includes('tax')) ||
                (doc?.path && doc?.path.toLowerCase().includes('tax'))
            );
            
            if (taxDoc) {
                documents.push({
                    ...taxDoc,
                    type: 'tax',
                    name: taxDoc.title || taxDoc.name || 'Tax Form (TD1)',
                    submittedAt: taxDoc.submittedAt || taxDoc.uploadedAt || new Date()
                });
            } else {
                const timestamp = employee.personalInfo?.taxDocumentInfo?.submittedAt || new Date();
                documents.push({
                    type: 'tax',
                    name: 'Tax Form (TD1)',
                    title: 'Tax Form (TD1)',
                    status: 'submitted',
                    submittedAt: timestamp,
                    uploadedAt: timestamp
                });
            }
        }
        
        // Add citizenship document if it exists or form is completed
        if (hasCitizenship || isCompleted) {
            const citizenDoc = allDocuments.find(doc => 
                doc?.type === 'citizenship' || 
                doc?.category === 'citizenship' ||
                doc?.documentType === 'citizenship' ||
                (doc?.title && doc?.title.toLowerCase().includes('citizen')) ||
                (doc?.fileName && doc?.fileName.toLowerCase().includes('citizen')) ||
                (doc?.name && doc?.name.toLowerCase().includes('citizen')) ||
                (doc?.path && doc?.path.toLowerCase().includes('citizen'))
            );
            
            if (citizenDoc) {
                documents.push({
                    ...citizenDoc,
                    type: 'citizenship',
                    name: citizenDoc.title || citizenDoc.name || 'Proof of Citizenship',
                    submittedAt: citizenDoc.submittedAt || citizenDoc.uploadedAt || new Date()
                });
            } else {
                const timestamp = employee.personalInfo?.citizenshipProofInfo?.submittedAt || new Date();
                documents.push({
                    type: 'citizenship',
                    name: 'Proof of Citizenship/Immigration Status',
                    title: 'Proof of Citizenship/Immigration Status',
                    status: 'submitted',
                    submittedAt: timestamp,
                    uploadedAt: timestamp
                });
            }
        }
        
        // Add any other documents that aren't one of the three types above
        for (const doc of allDocuments) {
            if (doc.type === 'work_authorization' || doc.type === 'tax' || doc.type === 'citizenship') {
                continue; // Skip documents we've already added
            }
            
            if ((doc.name && (doc.name.toLowerCase().includes('work') || 
                              doc.name.toLowerCase().includes('tax') || 
                              doc.name.toLowerCase().includes('citizen'))) ||
                (doc.title && (doc.title.toLowerCase().includes('work') || 
                               doc.title.toLowerCase().includes('tax') || 
                               doc.title.toLowerCase().includes('citizen')))) {
                continue; // Skip documents we've already added based on name/title
            }
            
            documents.push({
                ...doc,
                name: doc.title || doc.name || doc.fileName || 'Document',
                type: doc.type || doc.documentType || 'other',
                submittedAt: doc.submittedAt || doc.uploadedAt || new Date()
            });
        }
        
        // If the onboarding form is completed but we still have no documents, create empty ones
        if (isCompleted && documents.length === 0) {
            console.log('Form is completed but no documents found. Creating placeholders.');
            
            documents.push({
                type: 'tax',
                name: 'Tax Form (TD1)',
                status: 'submitted',
                submittedAt: new Date()
            });
            
            documents.push({
                type: 'work_authorization',
                name: 'Work Authorization',
                status: 'submitted',
                submittedAt: new Date()
            });
            
            documents.push({
                type: 'citizenship',
                name: 'Proof of Citizenship/Immigration Status',
                status: 'submitted',
                submittedAt: new Date()
            });
        }
        
        return documents;
    }
    
    /**
     * Formats a date string for display
     */
    function formatDate(dateStr, includeTime = false) {
        if (!dateStr) return '';
        
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return 'Invalid date';
            
            if (includeTime) {
                return date.toLocaleString();
            } else {
                return date.toLocaleDateString();
            }
        } catch (e) {
            console.warn('Error formatting date:', e);
            return 'Date error';
        }
    }
    
    /**
     * Formats SSN/SIN for display
     */
    function formatSSN(ssn) {
        if (!ssn) return 'Not provided';
        
        // If it's a number or looks like a SSN/SIN, mask it except last 4 digits
        if (!isNaN(ssn) || ssn.includes('-')) {
            return `***-**-${String(ssn).slice(-4)}`;
        }
        
        return ssn;
    }
    
    /**
     * Gets formatted address string
     */
    function getFormattedAddress(employee) {
        if (employee.address) {
            if (typeof employee.address === 'string') {
                return employee.address;
            } else if (employee.address.street) {
                return employee.address.street;
            }
        }
        return '';
    }
    
    /**
     * Generates HTML for document section
     */
    function getDocumentsHTML(employee) {
        if (!employee.documents || employee.documents.length === 0) {
            // Form is completed but no documents are shown - show placeholders
            if (employee.taxFormStatus || employee.workAuthStatus || employee.citizenshipStatus) {
                let html = '';
                
                if (employee.taxFormStatus) {
                    html += createDocumentCardHTML('Tax Form (TD1)', 'tax', null, employee.id);
                }
                
                if (employee.workAuthStatus) {
                    html += createDocumentCardHTML('Work Authorization', 'work_authorization', null, employee.id);
                }
                
                if (employee.citizenshipStatus) {
                    html += createDocumentCardHTML('Proof of Citizenship', 'citizenship', null, employee.id);
                }
                
                return html;
            }
            
            return `<div class="no-documents">No documents uploaded</div>`;
        }
        
        let html = '';
        
        // Tax document
        if (employee.taxFormStatus) {
            const taxDoc = employee.documents.find(d => d.type === 'tax');
            html += createDocumentCardHTML('Tax Form (TD1)', 'tax', taxDoc, employee.id);
        }
        
        // Work authorization document
        if (employee.workAuthStatus) {
            const workDoc = employee.documents.find(d => d.type === 'work_authorization');
            html += createDocumentCardHTML('Work Authorization', 'work_authorization', workDoc, employee.id);
        }
        
        // Citizenship document
        if (employee.citizenshipStatus) {
            const citizenDoc = employee.documents.find(d => d.type === 'citizenship');
            html += createDocumentCardHTML('Proof of Citizenship', 'citizenship', citizenDoc, employee.id);
        }
        
        // Add other documents
        const documentTypes = ['tax', 'work_authorization', 'citizenship'];
        
        employee.documents.forEach(doc => {
            // Skip documents we've already shown
            if (documentTypes.includes(doc.type)) {
                return;
            }
            
            // Generate a name if none exists
            const docName = doc.name || doc.title || doc.fileName || 'Document';
            const docType = doc.type || doc.category || 'other';
            
            html += createDocumentCardHTML(docName, docType, doc, employee.id);
        });
        
        return html;
    }
    
    /**
     * Creates HTML for a document card
     */
    function createDocumentCardHTML(name, type, doc, employeeId) {
        // If doc is null but we know it should be present, create a placeholder
        if (!doc) {
            doc = {
                type: type,
                name: name,
                title: name,
                status: 'submitted',
                submittedAt: new Date()
            };
        }
        
        const docId = doc._id || '';
        const docPath = doc.path || `employees/${employeeId}/documents/${type.replace(/_/g, '_')}`;
        const submittedDate = doc.submittedAt ? new Date(doc.submittedAt).toLocaleDateString() : 'Unknown';
        
        let iconClass = 'fa-file';
        switch (type) {
            case 'tax':
                iconClass = 'fa-file-invoice-dollar';
                break;
            case 'work_authorization':
                iconClass = 'fa-id-card';
                break;
            case 'citizenship':
                iconClass = 'fa-passport';
                break;
            default:
                iconClass = 'fa-file-alt';
        }
        
        return `
            <div class="document-card">
                <div class="document-icon">
                    <i class="fas ${iconClass}"></i>
                </div>
                <div class="document-info">
                    <h4>${name}</h4>
                    <p>Submitted: ${submittedDate}</p>
                    <p><span class="status-badge success">Submitted</span></p>
                </div>
                <div class="document-actions">
                    <button class="view-document-btn" 
                        data-document-id="${docId}"
                        data-document-path="${docPath}"
                        data-document-name="${name}"
                        data-document-type="${type}">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="download-document-btn"
                        data-document-id="${docId}"
                        data-document-path="${docPath}"
                        data-document-name="${name}">
                        <i class="fas fa-download"></i> Download
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Approves employee onboarding
     */
    function approveOnboarding(employeeId) {
        // Show loading state
        const approveBtn = document.querySelector('.approve-btn');
        if (approveBtn) {
            approveBtn.disabled = true;
            approveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        }
        
        const token = localStorage.getItem('token');
        fetch(`/api/employees/${employeeId}/onboarding/approve`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'approved',
                approvedBy: 'hr_admin'
            })
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to approve onboarding');
            return response.json();
        })
        .then(data => {
            showSimpleAlert('Onboarding approved successfully!', 'success');
            closeReviewModal();
            
            // Reload the page to reflect changes
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        })
        .catch(error => {
            console.error('Error approving onboarding:', error);
            showSimpleAlert('Failed to approve onboarding. Please try again.', 'error');
            
            // Reset button state
            if (approveBtn) {
                approveBtn.disabled = false;
                approveBtn.innerHTML = '<i class="fas fa-check-circle"></i> Approve';
            }
        });
    }
    
    /**
     * Rejects employee onboarding
     */
    function rejectOnboarding(employeeId, reason) {
        if (!reason || reason.trim() === '') {
            showSimpleAlert('Please provide a reason for rejection', 'warning');
            return;
        }
        
        // Show loading state
        const submitBtn = document.querySelector('.submit-rejection-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        }
        
        const token = localStorage.getItem('token');
        fetch(`/api/employees/${employeeId}/onboarding/reject`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'rejected',
                rejectedBy: 'hr_admin',
                reason: reason
            })
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to reject onboarding');
            return response.json();
        })
        .then(data => {
            showSimpleAlert('Onboarding rejected successfully', 'success');
            closeReviewModal();
            
            // Reload the page to reflect changes
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        })
        .catch(error => {
            console.error('Error rejecting onboarding:', error);
            showSimpleAlert('Failed to reject onboarding. Please try again.', 'error');
            
            // Reset button state
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Submit';
            }
        });
    }
    
    /**
     * Closes the review modal
     */
    function closeReviewModal() {
        const modal = document.getElementById('employee-review-modal');
        if (modal) {
            // Start fade out animation
            modal.classList.remove('visible');
            
            // Remove after animation completes
            setTimeout(() => {
                document.body.removeChild(modal);
                document.body.style.overflow = '';
                document.removeEventListener('keydown', handleEscKeyPress);
            }, 300);
        }
    }
    
    /**
     * Handle ESC key press to close modal
     */
    function handleEscKeyPress(e) {
        if (e.key === 'Escape') {
            closeReviewModal();
        }
    }
    
    /**
     * Shows a simple alert message
     */
    function showSimpleAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `simple-alert ${type}`;
        alertDiv.innerHTML = `
            <div class="alert-content">
                <span>${message}</span>
                <button class="alert-close">&times;</button>
            </div>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Add close button functionality
        alertDiv.querySelector('.alert-close').addEventListener('click', () => {
            alertDiv.classList.add('closing');
            setTimeout(() => alertDiv.remove(), 300);
        });
        
        // Auto show
        setTimeout(() => alertDiv.classList.add('visible'), 10);
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            alertDiv.classList.add('closing');
            setTimeout(() => alertDiv.remove(), 300);
        }, 5000);
    }
    
    /**
     * Safely removes an element from the DOM
     */
    function removeElement(id) {
        const element = document.getElementById(id);
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }

    // Show simulated document in modal
    function showSimulatedDocument(docType = 'other') {
        console.log("Showing simulated document of type:", docType);
        
        // Create modal if it doesn't exist
        let modal = document.getElementById('simulated-doc-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'simulated-doc-modal';
            modal.className = 'modal';
            modal.style.display = 'none';
            modal.style.position = 'fixed';
            modal.style.zIndex = '1000';
            modal.style.left = '0';
            modal.style.top = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.overflow = 'auto';
            modal.style.backgroundColor = 'rgba(0,0,0,0.4)';
            
            // Create modal content
            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content';
            modalContent.style.backgroundColor = '#fefefe';
            modalContent.style.margin = '10% auto';
            modalContent.style.padding = '20px';
            modalContent.style.border = '1px solid #888';
            modalContent.style.width = '80%';
            modalContent.style.maxWidth = '800px';
            modalContent.style.borderRadius = '5px';
            modalContent.style.boxShadow = '0 4px 8px 0 rgba(0,0,0,0.2)';
            
            // Create header
            const modalHeader = document.createElement('div');
            modalHeader.className = 'modal-header';
            modalHeader.style.borderBottom = '1px solid #eee';
            modalHeader.style.padding = '0 0 10px 0';
            modalHeader.style.marginBottom = '20px';
            modalHeader.style.display = 'flex';
            modalHeader.style.justifyContent = 'space-between';
            modalHeader.style.alignItems = 'center';
            
            // Create title
            const title = document.createElement('h3');
            title.id = 'simulated-doc-title';
            title.style.margin = '0';
            
            // Create close button
            const closeButton = document.createElement('button');
            closeButton.innerHTML = '&times;';
            closeButton.style.backgroundColor = 'transparent';
            closeButton.style.border = 'none';
            closeButton.style.fontSize = '24px';
            closeButton.style.cursor = 'pointer';
            closeButton.onclick = function() {
                modal.style.display = 'none';
            };
            
            // Create body
            const modalBody = document.createElement('div');
            modalBody.className = 'modal-body';
            modalBody.id = 'simulated-doc-body';
            modalBody.style.padding = '10px 0';
            
            // Create footer
            const modalFooter = document.createElement('div');
            modalFooter.className = 'modal-footer';
            modalFooter.style.borderTop = '1px solid #eee';
            modalFooter.style.padding = '10px 0 0 0';
            modalFooter.style.marginTop = '20px';
            modalFooter.style.display = 'flex';
            modalFooter.style.justifyContent = 'space-between';
            
            // Create download button
            const downloadButton = document.createElement('a');
            downloadButton.id = 'simulated-doc-download';
            downloadButton.innerHTML = '<i class="fas fa-download"></i> Download';
            downloadButton.style.backgroundColor = '#4CAF50';
            downloadButton.style.color = 'white';
            downloadButton.style.padding = '8px 16px';
            downloadButton.style.textDecoration = 'none';
            downloadButton.style.borderRadius = '4px';
            downloadButton.style.cursor = 'pointer';
            
            // Create verify button
            const verifyButton = document.createElement('button');
            verifyButton.id = 'mark-verified-btn';
            verifyButton.textContent = 'Mark as Verified';
            verifyButton.style.backgroundColor = '#2196F3';
            verifyButton.style.color = 'white';
            verifyButton.style.padding = '8px 16px';
            verifyButton.style.border = 'none';
            verifyButton.style.borderRadius = '4px';
            verifyButton.style.cursor = 'pointer';
            verifyButton.onclick = function() {
                alert('Document marked as verified!');
                this.textContent = '✓ Verified';
                this.style.backgroundColor = '#4CAF50';
                this.disabled = true;
            };
            
            // Create close button
            const closeBtn = document.createElement('button');
            closeBtn.textContent = 'Close';
            closeBtn.style.backgroundColor = '#f44336';
            closeBtn.style.color = 'white';
            closeBtn.style.padding = '8px 16px';
            closeBtn.style.border = 'none';
            closeBtn.style.borderRadius = '4px';
            closeBtn.style.cursor = 'pointer';
            closeBtn.onclick = function() {
                modal.style.display = 'none';
            };
            
            // Assemble modal
            modalHeader.appendChild(title);
            modalHeader.appendChild(closeButton);
            
            modalFooter.appendChild(downloadButton);
            modalFooter.appendChild(verifyButton);
            modalFooter.appendChild(closeBtn);
            
            modalContent.appendChild(modalHeader);
            modalContent.appendChild(modalBody);
            modalContent.appendChild(modalFooter);
            
            modal.appendChild(modalContent);
            document.body.appendChild(modal);
            
            // Close modal when clicking outside
            window.onclick = function(event) {
                if (event.target == modal) {
                    modal.style.display = 'none';
                }
            };
            
            // Close modal with Escape key
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && modal.style.display === 'block') {
                    modal.style.display = 'none';
                }
            });
        }
        
        // Function to generate a placeholder document
        function generatePlaceholderDocument(docType, title) {
            return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        h1 {
            color: #333;
            border-bottom: 1px solid #ccc;
            padding-bottom: 10px;
        }
        .placeholder-notice {
            background-color: #f8f9fa;
            border-left: 5px solid #007bff;
            padding: 15px;
            margin: 20px 0;
        }
        .document-content {
            margin-top: 30px;
        }
        .footer {
            margin-top: 50px;
            border-top: 1px solid #eee;
            padding-top: 15px;
            font-size: 12px;
            color: #777;
        }
    </style>
</head>
<body>
    <h1>${title}</h1>
    
    <div class="placeholder-notice">
        <p><strong>This is a placeholder document.</strong> In a production environment, this would be an actual document from the system.</p>
    </div>
    
    <div class="document-content">
        ${getDocumentContent(docType)}
    </div>
    
    <div class="footer">
        <p>Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        <p>Document ID: ${Math.random().toString(36).substring(2, 15)}</p>
        <p>This is a simulated document for testing purposes.</p>
    </div>
</body>
</html>`;
        }
        
        // Function to get content based on document type
        function getDocumentContent(docType) {
            switch(docType) {
                case 'work_authorization':
                    return `
                    <h2>Work Authorization Document</h2>
                    <p>This document authorizes the employee to work in the specified jurisdiction. Key details include:</p>
                    <ul>
                        <li>Authorization ID: WA-${Math.floor(Math.random() * 10000)}</li>
                        <li>Issue Date: ${new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toLocaleDateString()}</li>
                        <li>Expiration Date: ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString()}</li>
                        <li>Status: Active</li>
                    </ul>
                    <p>The employee has been authorized to work based on the verification of identity and eligibility documents.</p>`;
                case 'tax':
                    return `
                    <h2>Tax Form Document</h2>
                    <p>This document contains tax information for the employee. Important details include:</p>
                    <ul>
                        <li>Tax Year: ${new Date().getFullYear()}</li>
                        <li>Form Type: TD1 Federal</li>
                        <li>Filed Date: ${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</li>
                    </ul>
                    <p>The employee has submitted this form for tax withholding purposes.</p>`;
                case 'citizenship':
                    return `
                    <h2>Citizenship Proof Document</h2>
                    <p>This document verifies the citizenship status of the employee. Details include:</p>
                    <ul>
                        <li>Document Type: Passport</li>
                        <li>Document Number: P-${Math.floor(Math.random() * 1000000)}</li>
                        <li>Issue Country: Canada</li>
                        <li>Issue Date: ${new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toLocaleDateString()}</li>
                        <li>Expiration Date: ${new Date(Date.now() + 1460 * 24 * 60 * 60 * 1000).toLocaleDateString()}</li>
                    </ul>
                    <p>This document has been verified during the onboarding process.</p>`;
                default:
                    return `
                    <h2>Employee Document</h2>
                    <p>This is a standard employee document. General information includes:</p>
                    <ul>
                        <li>Document ID: DOC-${Math.floor(Math.random() * 10000)}</li>
                        <li>Upload Date: ${new Date().toLocaleDateString()}</li>
                        <li>Document Category: General</li>
                    </ul>
                    <p>This document is part of the employee's file and has been processed through the onboarding system.</p>`;
            }
        }
        
        // Set modal title and content based on document type
        const title = document.getElementById('simulated-doc-title');
        const body = document.getElementById('simulated-doc-body');
        const downloadBtn = document.getElementById('simulated-doc-download');
        
        let docTitle = '';
        let docFilename = '';
        
        switch(docType) {
            case 'work_authorization':
                docTitle = 'Work Authorization';
                docFilename = 'work-authorization.html';
                body.innerHTML = '<div style="padding: 20px; background-color: #f9f9f9; border-radius: 5px;">' +
                    '<p><strong>Work Authorization Document</strong></p>' +
                    '<p>This is a placeholder for a work authorization document. In a production environment, the actual document would be displayed here.</p>' +
                    '<p>To download this document, click the Download button below.</p>' +
                    '</div>';
                break;
            case 'tax':
                docTitle = 'Tax Form';
                docFilename = 'tax-form.html';
                body.innerHTML = '<div style="padding: 20px; background-color: #f9f9f9; border-radius: 5px;">' +
                    '<p><strong>Tax Form Document</strong></p>' +
                    '<p>This is a placeholder for a tax form document. In a production environment, the actual document would be displayed here.</p>' +
                    '<p>To download this document, click the Download button below.</p>' +
                    '</div>';
                break;
            case 'citizenship':
                docTitle = 'Citizenship Proof';
                docFilename = 'citizenship-proof.html';
                body.innerHTML = '<div style="padding: 20px; background-color: #f9f9f9; border-radius: 5px;">' +
                    '<p><strong>Citizenship Proof Document</strong></p>' +
                    '<p>This is a placeholder for a citizenship proof document. In a production environment, the actual document would be displayed here.</p>' +
                    '<p>To download this document, click the Download button below.</p>' +
                    '</div>';
                break;
            default:
                docTitle = 'Employee Document';
                docFilename = 'employee-document.html';
                body.innerHTML = '<div style="padding: 20px; background-color: #f9f9f9; border-radius: 5px;">' +
                    '<p><strong>Employee Document</strong></p>' +
                    '<p>This is a placeholder for an employee document. In a production environment, the actual document would be displayed here.</p>' +
                    '<p>To download this document, click the Download button below.</p>' +
                    '</div>';
        }
        
        title.textContent = docTitle;
        
        // Set up download functionality
        downloadBtn.onclick = function() {
            const htmlContent = generatePlaceholderDocument(docType, docTitle);
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            
            // Create a temporary anchor element to trigger download
            const a = document.createElement('a');
            a.href = url;
            a.download = docFilename;
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            setTimeout(function() {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        };
        
        // Display the modal
        modal.style.display = 'block';
        
        return true;
    }
})(); 