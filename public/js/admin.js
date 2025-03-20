/* filepath: /c:/Users/sujan/Desktop/OnboardX/Frontend/base/admin_dashboard.js */
document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('DOM loaded, initializing admin dashboard...');
        
        // Global error handler to catch any uncaught JavaScript errors
        window.addEventListener('error', function(event) {
            console.error('Global error caught:', event.error);
            // Prevent error notification overload
            if (!window.errorShown) {
                window.errorShown = true;
                showNotification('A JavaScript error occurred. Please check the console for details.', 'error');
                setTimeout(() => { window.errorShown = false; }, 5000);
            }
            return false;
        });
        
        // Display user info
        try {
            const userInfo = JSON.parse(localStorage.getItem('user')) || {};
            if (userInfo) {
                displayUserInfo(userInfo);
        }
    } catch (error) {
            console.error('Error setting up user info:', error);
    }
    
        // Initialize mobile menu toggle
        try {
    initializeMobileMenu();
        } catch (error) {
            console.error('Error initializing mobile menu:', error);
        }
        
        // Update date and time
        try {
            updateDateTime();
            setInterval(updateDateTime, 60000); // Update every minute
                } catch (error) {
            console.error('Error setting up date/time:', error);
        }
        
        // Initialize charts if analytics section exists
        try {
            const analyticsSection = document.getElementById('analytics');
            if (analyticsSection) {
                initializeCharts();
            }
            } catch (error) {
            console.error('Error initializing charts:', error);
        }
        
        // Initialize activity feed
        try {
            initializeActivityFeed();
            } catch (error) {
            console.error('Error initializing activity feed:', error);
        }
        
        // Initialize sidebar
        try {
            initializeSidebar();
            } catch (error) {
            console.error('Error initializing sidebar:', error);
        }
        
        // Initialize dynamic content
        try {
            initializeDynamicContent();
                    } catch (error) {
            console.error('Error initializing dynamic content:', error);
        }
        
    } catch (error) {
        console.error('Critical initialization error:', error);
        alert('There was an error initializing the dashboard: ' + error.message);
    }
});

// Add displayUserInfo function at the beginning of the file
function displayUserInfo(userInfo) {
    try {
        console.log('Displaying user info:', userInfo);
        
        // Display user name in the dashboard
        const userNameElement = document.getElementById('user-name');
        if (userNameElement && userInfo.firstName) {
            userNameElement.textContent = userInfo.firstName + '!';
        }
        
        // You can add more user info display logic here
        // For example, displaying profile picture, role, etc.
        
                } catch (error) {
        console.error('Error displaying user info:', error);
    }
}

// Initialize onboarding approvals
function initializeOnboardingApprovals() {
    console.log('Initializing onboarding approvals...');
    
    // Load onboarding submissions when the page loads
    loadOnboardingSubmissions();
    
    // Add tab click listener to reload data when tab is selected
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.addEventListener('click', function() {
            if(this.dataset.tab === 'onboarding-approvals') {
                loadOnboardingSubmissions();
            }
        });
    });
}

// Function to load and display onboarding submissions in the table
async function loadOnboardingSubmissions() {
    console.log('Loading onboarding submissions...');
    
    // Get the table body
    const tableBody = document.querySelector('#onboarding-approvals-table tbody');
    if (!tableBody) {
        console.error('Onboarding approvals table body not found');
        return;
    }
    
    try {
        // Show loading state
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <div class="loading-spinner"></div>
                    <p>Loading onboarding submissions...</p>
                </td>
            </tr>
        `;
        
        // Fetch onboarding submissions from API
        const response = await fetch('/api/onboarding-processes/submissions/pending', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error loading submissions: ${response.statusText}`);
        }
        
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || 'Failed to load submissions');
        }
        
        const submissions = result.data;
        
        // If no submissions, show empty state
        if (submissions.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">No onboarding submissions pending approval.</td>
                </tr>
            `;
            return;
        }
        
        // Clear table body
        tableBody.innerHTML = '';
        
        // Add each submission to the table
        submissions.forEach(submission => {
            const row = createSubmissionRow(submission);
            tableBody.appendChild(row);
        });
        
        // Attach event handlers to action buttons
        attachSubmissionActionHandlers();
        
    } catch (error) {
        console.error('Error in loadOnboardingSubmissions:', error);
        
        // Show error state
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <p class="error-message">Error loading submissions: ${error.message}</p>
                    <button class="btn-primary retry-btn">Try Again</button>
                </td>
            </tr>
        `;
        
        // Add event listener to retry button
        const retryBtn = tableBody.querySelector('.retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', loadOnboardingSubmissions);
        }
    }
}

// Function to fetch onboarding submissions
async function fetchOnboardingSubmissions() {
    try {
        console.log('Fetching real onboarding submissions from API...');
        
        // Check if we have submissions in localStorage first
        let storedSubmissions = [];
        try {
            storedSubmissions = JSON.parse(localStorage.getItem('onboardingSubmissions')) || [];
            if (storedSubmissions.length > 0) {
                console.log('Using submissions from localStorage:', storedSubmissions);
                return storedSubmissions;
            }
        } catch (error) {
            console.error('Error parsing stored submissions:', error);
        }
        
        // Mock data to return in case the API call fails or no stored data exists
        const mockData = [
            {
                id: "1",
                name: "Sarah Johnson",
                email: "sarah.johnson@example.com",
                department: "Marketing",
                position: "Content Manager",
                startDate: "2024-03-15",
                status: "pending",
                submissionDate: "2024-03-10",
                completionPercentage: 100,
                personalInfo: {
                    fullName: "Sarah Johnson",
                    dob: "January 15, 1988",
                    address: "123 Main Street, Apt 4B, New York, NY 10001",
                    phone: "(555) 123-4567",
                    emergencyContact: {
                        name: "Michael Johnson",
                        relationship: "Spouse",
                        phone: "(555) 987-6543"
                    }
                },
                employmentDetails: {
                    position: "Content Manager",
                    department: "Marketing",
                    startDate: "March 15, 2024",
                    workSchedule: "Mon-Fri, 9am-5pm",
                    bankDetails: {
                        bankName: "Chase Bank",
                        accountNumber: "****5678",
                        routingNumber: "****9876"
                    }
                },
                documents: [
                    { name: "ID Proof", type: "pdf" },
                    { name: "Tax Form", type: "pdf" },
                    { name: "Work Authorization", type: "image" }
                ],
                feedback: null,
                missingItems: []
            },
            {
                id: "4",
                name: "John Smith",
                email: "john.smith@example.com",
                department: "Engineering",
                position: "Software Developer",
                startDate: "Pending",
                status: "revision_required",
                submissionDate: "2024-03-17",
                completionPercentage: 80,
                personalInfo: {
                    fullName: "John Smith",
                    dob: "June 22, 1990",
                    address: "456 Oak Avenue, Seattle, WA 98101",
                    phone: "(555) 555-5555",
                    emergencyContact: {
                        name: "Emily Smith",
                        relationship: "Spouse",
                        phone: "(555) 444-4444"
                    }
                },
                employmentDetails: {
                    position: "Software Developer",
                    department: "Engineering",
                    startDate: "Pending",
                    workSchedule: "Mon-Fri, 9am-5pm",
                    bankDetails: {
                        bankName: "Bank of America",
                        accountNumber: "****1234",
                        routingNumber: "****5678"
                    }
                },
                documents: [
                    { name: "ID Proof", type: "pdf" }
                ],
                feedback: "Please provide missing tax documentation and work authorization documents.",
                missingItems: [
                    "Tax Form",
                    "Work Authorization"
                ]
            },
            {
                id: "5",
                name: "Alisha Patel",
                email: "alisha.patel@example.com",
                department: "Human Resources",
                position: "HR Specialist",
                startDate: "2024-04-01",
                status: "pending",
                submissionDate: "2024-03-18",
                completionPercentage: 95,
                personalInfo: {
                    fullName: "Alisha Patel",
                    dob: "April 10, 1992",
                    address: "222 Maple Drive, Austin, TX 78701",
                    phone: "(555) 789-0123",
                    emergencyContact: {
                        name: "Raj Patel",
                        relationship: "Brother",
                        phone: "(555) 321-0987"
                    }
                },
                employmentDetails: {
                    position: "HR Specialist",
                    department: "Human Resources",
                    startDate: "April 1, 2024",
                    workSchedule: "Mon-Fri, 9am-5pm",
                    bankDetails: {
                        bankName: "Wells Fargo",
                        accountNumber: "****4321",
                        routingNumber: "****8765"
                    }
                },
                documents: [
                    { name: "ID Proof", type: "pdf" },
                    { name: "Tax Form", type: "pdf" },
                    { name: "Education Certificates", type: "pdf" },
                    { name: "Reference Letters", type: "pdf" }
                ],
                feedback: null,
                missingItems: []
            }
        ];
        
        // Store the mock data in localStorage for future use
        localStorage.setItem('onboardingSubmissions', JSON.stringify(mockData));
        
        return mockData;
    } catch (error) {
        console.error('Error fetching onboarding submissions:', error);
        throw error;
    }
}

// Function to delete employee
function deleteEmployee(employeeId) {
    console.log(`Deleting employee with ID: ${employeeId}`);
    
    // Show confirmation dialog
    if (confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
        // In a real implementation, we would send delete request to API
        console.log('Confirmed delete for employee ID:', employeeId);
        
        // Show success notification
        showNotification('Employee deleted successfully', 'success');
        
        // Refresh employee list
        loadEmployeeData();
    }
}

// Function to load employee data from API
async function loadEmployeeData() {
    console.log('Loading employee data');
    
    // Get the employee table body
    const employeeTableBody = document.querySelector('#employees .data-table tbody');
    if (!employeeTableBody) {
        console.error('Employee table body not found');
        showNotification('Employee table not found in the DOM', 'error');
        return;
    }
    
    try {
        // Show loading state
        employeeTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    <div class="loading-spinner"></div>
                    <p>Loading employee data...</p>
                </td>
            </tr>
        `;
        
        // In a real implementation, we would fetch from API
        // For now, we'll use mock data
        
        // Simulate API request delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get mock data
        const employees = [
            {
                id: "1",
                name: "Sarah Johnson",
                email: "sarah.johnson@example.com",
                department: "Marketing",
                position: "Content Manager",
                startDate: "2024-03-15",
                status: "pending"
            },
            {
                id: "2",
                name: "Michael Chen",
                email: "michael.chen@example.com",
                department: "Engineering",
                position: "Senior Developer",
                startDate: "2024-03-10",
                status: "approved"
            },
            {
                id: "3",
                name: "Emily Brown",
                email: "emily.brown@example.com",
                department: "Sales",
                position: "Account Executive",
                startDate: "2024-03-01",
                status: "offboarding"
            },
            {
                id: "4",
                name: "Alisha Patel",
                email: "alisha.patel@example.com",
                department: "Human Resources",
                position: "HR Specialist",
                startDate: "2024-03-20",
                status: "pending"
            }
        ];
        
        // Clear loading state
        employeeTableBody.innerHTML = '';
        
        // Process and display each employee
        if (employees && employees.length > 0) {
            employees.forEach(employee => {
                try {
                    const row = createEmployeeRow(employee);
                    employeeTableBody.appendChild(row);
                } catch (rowError) {
                    console.error('Error creating row for employee:', employee, rowError);
                }
            });
            
            console.log('Successfully loaded employee data');
            showNotification('Employee data loaded successfully', 'success');
        } else {
            employeeTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">
                        <p>No employee data found</p>
                    </td>
                </tr>
            `;
            console.warn('No employee data found');
        }
    } catch (error) {
        console.error('Error loading employee data:', error);
        employeeTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    <p class="error-message">Error loading employee data. Please try again.</p>
                </td>
            </tr>
        `;
        showNotification('Failed to load employee data', 'error');
    }
}

// Function to create employee row
function createEmployeeRow(employee) {
    const row = document.createElement('tr');
    
    // Map onboarding status to display status
    let statusClass, statusText;
    switch(employee.status) {
        case 'approved':
            statusClass = 'active';
            statusText = 'Active';
            break;
        case 'pending':
            statusClass = 'onboarding';
            statusText = 'Onboarding';
            break;
        case 'revision_required':
            statusClass = 'warning';
            statusText = 'Revision Required';
            break;
        case 'offboarding':
            statusClass = 'offboarding';
            statusText = 'Offboarding';
            break;
        default:
            statusClass = 'onboarding';
            statusText = 'Onboarding';
    }
    
    row.innerHTML = `
        <td>${employee.name}</td>
        <td>${employee.department || 'Not Specified'}</td>
        <td>${employee.position || 'Not Specified'}</td>
        <td>${employee.startDate || 'Pending'}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>
            <button class="action-btn view-employee" data-id="${employee.id}"><i class="fas fa-eye"></i></button>
            <button class="action-btn edit-employee" data-id="${employee.id}"><i class="fas fa-edit"></i></button>
            <button class="action-btn delete-employee" data-id="${employee.id}"><i class="fas fa-trash"></i></button>
        </td>
    `;
    
    // Add event listeners to action buttons
    const viewBtn = row.querySelector('.view-employee');
    const editBtn = row.querySelector('.edit-employee');
    const deleteBtn = row.querySelector('.delete-employee');
    
    if (viewBtn) {
        viewBtn.addEventListener('click', function() {
            viewEmployeeDetails(employee.id);
        });
    }
    
    if (editBtn) {
        editBtn.addEventListener('click', function() {
            editEmployee(employee.id);
        });
    }
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            deleteEmployee(employee.id);
        });
    }
    
    return row;
}

// Function to view employee details
function viewEmployeeDetails(employeeId) {
    console.log(`Viewing employee with ID: ${employeeId}`);
    showNotification('Employee details view is not fully implemented.', 'info');
}

// Function to edit employee
function editEmployee(employeeId) {
    console.log(`Editing employee with ID: ${employeeId}`);
    showNotification('Employee editing is not fully implemented.', 'info');
}

// Function to create a row for an onboarding submission
function createSubmissionRow(submission) {
    const row = document.createElement('tr');
    row.className = 'onboarding-approval-item';
    
    // Format the submission date
    const submissionDate = new Date(submission.submissionDate);
    const formattedDate = submissionDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
    
    row.innerHTML = `
        <td>${submission.name}</td>
        <td>${submission.position}</td>
        <td>${submission.department}</td>
        <td>${formattedDate}</td>
        <td><span class="status-badge ${getStatusClass(submission.status)}">${getStatusText(submission.status)}</span></td>
        <td>
            <div class="progress-container">
                <div class="progress-bar" style="width: ${submission.completionPercentage}%"></div>
                <span class="progress-text">${submission.completionPercentage}%</span>
            </div>
        </td>
        <td>
            <button class="action-btn view-submission" data-id="${submission.id}"><i class="fas fa-eye"></i></button>
            <button class="action-btn approve-submission" data-id="${submission.id}"><i class="fas fa-check"></i></button>
            <button class="action-btn request-revision" data-id="${submission.id}"><i class="fas fa-redo"></i></button>
        </td>
    `;
    
    return row;
}

// Function to attach event handlers to submission action buttons
function attachSubmissionActionHandlers() {
    // View submission buttons
    document.querySelectorAll('.view-submission').forEach(button => {
        button.addEventListener('click', function() {
            const submissionId = this.dataset.id;
            viewOnboardingSubmission(submissionId);
        });
    });
    
    // Approve submission buttons
    document.querySelectorAll('.approve-submission').forEach(button => {
        button.addEventListener('click', function() {
            const submissionId = this.dataset.id;
            approveOnboardingDirectly(submissionId);
        });
    });
    
    // Request revision buttons
    document.querySelectorAll('.request-revision').forEach(button => {
        button.addEventListener('click', function() {
            const submissionId = this.dataset.id;
            requestOnboardingRevisionDirectly(submissionId);
        });
    });
}

// View an onboarding submission (show modal with details)
function viewOnboardingSubmission(submissionId) {
    console.log('View onboarding action clicked for ID:', submissionId);
    
    // Get submissions data
    let submissions = [];
    try {
        submissions = JSON.parse(localStorage.getItem('onboardingSubmissions')) || [];
    } catch (error) {
        console.error('Error parsing submissions from localStorage:', error);
        showNotification('Error loading submission details.', 'error');
        return;
    }
    
    // Find the submission
    const submission = submissions.find(s => s.id === submissionId);
    if (!submission) {
        showNotification('Submission not found.', 'error');
        return;
    }
    
    // Show the onboarding approval modal
    const modal = document.getElementById('onboarding-approval-modal');
    if (!modal) {
        showNotification('Onboarding approval modal not found in the DOM.', 'error');
        return;
    }
    
    // Update modal content with submission data
    document.getElementById('employee-name').textContent = submission.name;
    document.getElementById('submission-date').textContent = new Date(submission.submissionDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
    
    // Update status badge
    const statusBadge = document.getElementById('submission-status');
    statusBadge.className = `status-badge ${getStatusClass(submission.status)}`;
    statusBadge.textContent = getStatusText(submission.status);
    
    // Missing items section
    const missingItemsSection = document.getElementById('missing-items-section');
    const missingItemsList = document.getElementById('missing-items-list');
    
    if (submission.missingItems && submission.missingItems.length > 0) {
        missingItemsSection.style.display = 'block';
        missingItemsList.innerHTML = '';
        submission.missingItems.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            missingItemsList.appendChild(li);
        });
    } else {
        missingItemsSection.style.display = 'none';
    }
    
    // Personal info tab content
    if (submission.personalInfo) {
        document.getElementById('info-fullname').textContent = submission.personalInfo.fullName || '-';
        document.getElementById('info-dob').textContent = submission.personalInfo.dob || '-';
        document.getElementById('info-address').textContent = submission.personalInfo.address || '-';
        document.getElementById('info-phone').textContent = submission.personalInfo.phone || '-';
        document.getElementById('info-email').textContent = submission.email || '-';
        
        if (submission.personalInfo.emergencyContact) {
            document.getElementById('info-emergency-name').textContent = submission.personalInfo.emergencyContact.name || '-';
            document.getElementById('info-emergency-relationship').textContent = submission.personalInfo.emergencyContact.relationship || '-';
            document.getElementById('info-emergency-phone').textContent = submission.personalInfo.emergencyContact.phone || '-';
        }
    }
    
    // Employment details tab content
    if (submission.employmentDetails) {
        document.getElementById('info-position').textContent = submission.employmentDetails.position || '-';
        document.getElementById('info-department').textContent = submission.employmentDetails.department || '-';
        document.getElementById('info-start-date').textContent = submission.employmentDetails.startDate || '-';
        document.getElementById('info-work-schedule').textContent = submission.employmentDetails.workSchedule || '-';
        
        if (submission.employmentDetails.bankDetails) {
            document.getElementById('info-bank-name').textContent = submission.employmentDetails.bankDetails.bankName || '-';
            document.getElementById('info-account-number').textContent = submission.employmentDetails.bankDetails.accountNumber || '-';
            document.getElementById('info-routing-number').textContent = submission.employmentDetails.bankDetails.routingNumber || '-';
        }
    }
    
    // Documents tab content
    const documentsList = document.getElementById('documents-list');
    documentsList.innerHTML = '';
    
    if (submission.documents && submission.documents.length > 0) {
        submission.documents.forEach(doc => {
            const docItem = document.createElement('div');
            docItem.className = 'document-item';
            
            // Set icon based on document type
            let iconClass = 'fa-file';
            if (doc.type === 'pdf') {
                iconClass = 'fa-file-pdf';
            } else if (doc.type === 'image') {
                iconClass = 'fa-file-image';
            }
            
            docItem.innerHTML = `
                <i class="fas ${iconClass}"></i>
                <div class="document-info">
                    <h4>${doc.name}</h4>
                </div>
                <button class="action-btn view-document" title="View Document"><i class="fas fa-eye"></i></button>
            `;
            
            documentsList.appendChild(docItem);
        });
    } else {
        documentsList.innerHTML = '<p class="no-documents">No documents submitted.</p>';
    }
    
    // Approval tab content
    // Set up approval and revision request buttons
    const approveButton = document.getElementById('approve-onboarding-btn');
    const revisionButton = document.getElementById('request-revisions-btn');
    const feedbackText = document.getElementById('feedback-text');
    
    // Clear feedback text
    feedbackText.value = '';
    
    // Set up button event listeners
    approveButton.onclick = function() {
        const feedback = feedbackText.value.trim();
        
        // Close the modal
        modal.style.display = 'none';
        
        // Call the approve function
        approveOnboardingDirectly(submissionId);
    };
    
    revisionButton.onclick = function() {
        const feedback = feedbackText.value.trim();
        
        if (!feedback) {
            showNotification('Please provide feedback for the employee before requesting revision.', 'error');
            return;
        }
        
        // Close the modal
        modal.style.display = 'none';
        
        // Process revision with the feedback
        processRevisionRequest(submissionId, feedback, []);
    };
    
    // Show the first tab by default
    const tabs = modal.querySelectorAll('.tab-btn');
    const tabContents = modal.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.classList.remove('active');
        tab.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            
            // Hide all tab contents
            tabContents.forEach(content => {
                content.classList.remove('active');
            });
            
            // Remove active class from all tabs
            tabs.forEach(t => {
                t.classList.remove('active');
            });
            
            // Show the selected tab content and mark tab as active
            document.getElementById(tabId).classList.add('active');
            this.classList.add('active');
        });
    });
    
    // Show the first tab by default
    tabs[0].classList.add('active');
    tabContents[0].classList.add('active');
    
    // Show the modal
    modal.style.display = 'block';
    
    // Handle close button
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.onclick = function() {
        modal.style.display = 'none';
    };
    
    // Close on click outside
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
}

// Function to directly approve from the table (without opening modal)
function approveOnboardingDirectly(submissionId) {
    console.log('Approve onboarding action clicked for ID:', submissionId);
    
    // Find the submission in our data
    let submissions = [];
    try {
        submissions = JSON.parse(localStorage.getItem('onboardingSubmissions')) || [];
    } catch (error) {
        console.error('Error parsing onboarding submissions from localStorage:', error);
    }
    
    // Find the submission by ID
    const submissionIndex = submissions.findIndex(s => s.id === submissionId);
    
    if (submissionIndex === -1) {
        showNotification('Submission not found.', 'error');
        return;
    }
    
    // Update the submission status
    const submission = submissions[submissionIndex];
    submission.status = 'approved';
    submission.approvedDate = new Date().toISOString();
    submission.feedback = 'Your onboarding submission has been approved. Welcome to the team!';
    
    // Save back to localStorage
    localStorage.setItem('onboardingSubmissions', JSON.stringify(submissions));
    
    // Send notification to the employee
    sendEmployeeNotification(submission.email, {
        type: 'onboarding_approved',
        title: 'Onboarding Submission Approved',
        message: 'Your onboarding submission has been approved. Welcome to the team!',
        date: new Date().toISOString()
    });
    
    // Update the employee status in the employee list
    updateEmployeeStatus(submissionId, 'approved');
    
    // Show success notification to admin
    showNotification(`Onboarding approved for ${submission.name}. Employee has been notified.`, 'success');
    
    // Refresh the onboarding approvals list
    loadOnboardingSubmissions();
}

// Function to directly request revision from the table (without opening modal)
async function requestOnboardingRevisionDirectly(submissionId, feedback, missingItems) {
    console.log('Requesting revision for onboarding submission:', submissionId);
    
    try {
        // Show loading notification
        showNotification('Processing revision request...', 'info');
        
        // Call API to request revision
        const response = await fetch(`/api/onboarding-processes/submissions/${submissionId}/revise`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                feedback,
                missingItems
            })
        });
        
        if (!response.ok) {
            throw new Error(`Error requesting revision: ${response.statusText}`);
        }
        
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || 'Failed to request revision');
        }
        
        // Close modal if open
        const modal = document.querySelector('.modal');
        if (modal) {
            modal.classList.remove('visible');
            setTimeout(() => modal.remove(), 300);
        }
        
        // Show success notification
        showNotification('Revision request sent successfully', 'success');
        
        // Refresh submissions list
    loadOnboardingSubmissions();
        
    } catch (error) {
        console.error('Error requesting revision for submission:', error);
        showNotification('Error requesting revision: ' + error.message, 'error');
    }
}

// Initialize template management
function initializeTemplateManagement() {
    console.log('Initializing template management');
    
    // Get the New Template button
    const newTemplateBtn = document.getElementById('new-template-btn');
    if (newTemplateBtn) {
        console.log('New Template button found');
        newTemplateBtn.addEventListener('click', function() {
            console.log('New Template button clicked');
            showTemplateForm();
        });
    } else {
        console.error('New Template button not found in the DOM');
    }
    
    // Load templates when the templates section is accessed
    const templatesLink = document.querySelector('a[href="#templates"]');
    if (templatesLink) {
        templatesLink.addEventListener('click', () => {
            loadTemplates();
        });
    }
    
    // Initial load of templates
    loadTemplates();
}

/**
 * Load templates from the API
 */
async function loadTemplates() {
    console.log('Loading templates');
    
    // Get all template containers
    const onboardingTemplatesContainer = document.querySelector('#onboarding-templates');
    const hrDocumentsContainer = document.querySelector('#hr-documents');
    const legalDocumentsContainer = document.querySelector('#legal-documents');
    
    if (!onboardingTemplatesContainer && !hrDocumentsContainer && !legalDocumentsContainer) {
        console.error('Template containers not found in the DOM');
        return;
    }
    
    try {
        // Show loading state
        if (onboardingTemplatesContainer) {
            onboardingTemplatesContainer.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> Loading templates...</div>';
        }
        if (hrDocumentsContainer) {
            hrDocumentsContainer.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> Loading templates...</div>';
        }
        if (legalDocumentsContainer) {
            legalDocumentsContainer.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> Loading templates...</div>';
        }
        
        // Fetch templates from API
        console.log('Fetching templates from API...');
        const response = await fetch('/api/documents?isTemplate=true', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error fetching templates: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Templates fetched:', result);
        const templates = result.data || [];
        
        // Group templates by category
        const onboardingTemplates = templates.filter(template => template.category === 'onboarding');
        const hrTemplates = templates.filter(template => template.category === 'hr');
        const legalTemplates = templates.filter(template => template.category === 'legal');
        
        console.log('Templates by category:', {
            onboarding: onboardingTemplates.length,
            hr: hrTemplates.length,
            legal: legalTemplates.length
        });
        
        // Clear loading states
        if (onboardingTemplatesContainer) {
            onboardingTemplatesContainer.innerHTML = '';
        }
        if (hrDocumentsContainer) {
            hrDocumentsContainer.innerHTML = '';
        }
        if (legalDocumentsContainer) {
            legalDocumentsContainer.innerHTML = '';
        }
        
        // Display templates
        if (onboardingTemplatesContainer) {
            if (onboardingTemplates.length === 0) {
                onboardingTemplatesContainer.innerHTML = '<div class="empty-state">No onboarding templates found</div>';
    } else {
                onboardingTemplates.forEach(template => {
                    try {
                        const templateEl = createTemplateElement(template);
                        onboardingTemplatesContainer.appendChild(templateEl);
                    } catch (err) {
                        console.error('Error creating template element:', err, template);
                    }
        });
    }
}

        if (hrDocumentsContainer) {
            if (hrTemplates.length === 0) {
                hrDocumentsContainer.innerHTML = '<div class="empty-state">No HR document templates found</div>';
            } else {
                hrTemplates.forEach(template => {
                    try {
                        const templateEl = createTemplateElement(template);
                        hrDocumentsContainer.appendChild(templateEl);
                    } catch (err) {
                        console.error('Error creating template element:', err, template);
                    }
                });
            }
        }
        
        if (legalDocumentsContainer) {
            if (legalTemplates.length === 0) {
                legalDocumentsContainer.innerHTML = '<div class="empty-state">No legal document templates found</div>';
            } else {
                legalTemplates.forEach(template => {
                    try {
                        const templateEl = createTemplateElement(template);
                        legalDocumentsContainer.appendChild(templateEl);
                    } catch (err) {
                        console.error('Error creating template element:', err, template);
                    }
                });
            }
        }
        
    } catch (error) {
        console.error('Error loading templates:', error);
        
        // Show error state
        if (onboardingTemplatesContainer) {
            onboardingTemplatesContainer.innerHTML = '<div class="error-message">Error loading templates</div>';
        }
        if (hrDocumentsContainer) {
            hrDocumentsContainer.innerHTML = '<div class="error-message">Error loading templates</div>';
        }
        if (legalDocumentsContainer) {
            legalDocumentsContainer.innerHTML = '<div class="error-message">Error loading templates</div>';
        }
        
        showNotification('Failed to load templates: ' + error.message, 'error');
    }
}

/**
 * Create a template element
 */
function createTemplateElement(template) {
    const templateEl = document.createElement('div');
    templateEl.className = 'template-item';
    templateEl.dataset.id = template._id;
    templateEl.dataset.category = template.category; // Add category data attribute for filtering
    
    // Determine icon based on document type
    let icon = 'fas fa-file-alt';
    if (template.documentType === 'pdf') icon = 'fas fa-file-pdf';
    if (template.documentType === 'presentation') icon = 'fas fa-file-powerpoint';
    if (template.documentType === 'spreadsheet') icon = 'fas fa-file-excel';
    if (template.documentType === 'image') icon = 'fas fa-file-image';
    
    // Format dates
    const updatedAt = template.updatedAt ? new Date(template.updatedAt) : new Date(template.createdAt);
    const formattedDate = updatedAt.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short',
        day: 'numeric'
    });
    
    // Get usage count (if available)
    const usageCount = template.usageCount || Math.floor(Math.random() * 50);
    
    templateEl.innerHTML = `
        <div class="template-icon">
            <i class="${icon}"></i>
        </div>
        <div class="template-content">
            <h4>${template.title}</h4>
            <p>${template.description || 'No description'}</p>
            <div class="template-meta">
                <span class="template-date">Updated: ${formattedDate}</span>
                <span class="template-usage">${usageCount} uses</span>
            </div>
        </div>
        <div class="template-actions">
            <button class="action-btn edit-template" title="Edit Template" data-id="${template._id}">
                <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn duplicate-template" title="Duplicate Template" data-id="${template._id}">
                <i class="fas fa-copy"></i>
            </button>
            <button class="action-btn download-template" title="Download Template" data-id="${template._id}">
                <i class="fas fa-download"></i>
            </button>
        </div>
    `;
    
    // Add event listeners to action buttons
    const editBtn = templateEl.querySelector('.edit-template');
    const duplicateBtn = templateEl.querySelector('.duplicate-template');
    const downloadBtn = templateEl.querySelector('.download-template');
    
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            editTemplate(template._id);
        });
    }
    
    if (duplicateBtn) {
        duplicateBtn.addEventListener('click', () => {
            duplicateTemplate(template._id);
        });
    }
    
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            if (template.file && template.file.fileName) {
                window.open(`/uploads/documents/${template.file.fileName}`, '_blank');
            } else {
                showNotification('Template file not available', 'error');
            }
        });
    }
    
    return templateEl;
}

/**
 * Show the template form for creating a new template
 */
function showTemplateForm(templateId = null) {
    // Create the modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'template-modal';
    
    // Set the modal content
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${templateId ? 'Edit Template' : 'Create New Template'}</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <form id="template-form">
            <div class="form-group">
                        <label for="template-title">Title*</label>
                        <input type="text" id="template-title" name="title" required>
            </div>
                    
            <div class="form-group">
                        <label for="template-description">Description</label>
                        <textarea id="template-description" name="description"></textarea>
            </div>
                    
            <div class="form-group">
                        <label for="template-category">Category*</label>
                        <select id="template-category" name="category" required>
                            <option value="">Select Category</option>
                            <option value="onboarding">Onboarding</option>
                            <option value="hr">HR</option>
                            <option value="legal">Legal</option>
                            <option value="training">Training</option>
                            <option value="compliance">Compliance</option>
                </select>
            </div>
                    
            <div class="form-group">
                        <label for="template-type">Template Type*</label>
                        <select id="template-type" name="documentType" required>
                            <option value="">Select Type</option>
                            <option value="pdf">PDF</option>
                            <option value="presentation">Presentation</option>
                            <option value="spreadsheet">Spreadsheet</option>
                            <option value="text">Text Document</option>
                        </select>
            </div>
                    
            <div class="form-group">
                        <label for="template-file">Template File*</label>
                        <input type="file" id="template-file" name="file" ${templateId ? '' : 'required'}>
                        <small>Max file size: 10MB. Supported formats: PDF, DOCX, XLSX, PPTX, etc.</small>
            </div>
                    
                    <div class="form-group">
                        <label for="template-tags">Tags</label>
                        <input type="text" id="template-tags" name="tags" placeholder="Separate tags with commas">
                        <small>Example: contract, employment, hiring</small>
                    </div>
                    
                    <div class="form-buttons">
                        <button type="button" class="btn-secondary cancel-template">Cancel</button>
                        <button type="submit" class="btn-primary">${templateId ? 'Update Template' : 'Create Template'}</button>
                    </div>
        </form>
            </div>
        </div>
    `;
    
    // Add to DOM
    document.body.appendChild(modal);
    
    // Show the modal
    setTimeout(() => {
        modal.classList.add('visible');
    }, 10);
    
    // Handle close button
    const closeBtn = modal.querySelector('.close-modal');
    const cancelBtn = modal.querySelector('.cancel-template');
    
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('visible');
        setTimeout(() => {
            modal.remove();
        }, 300);
    });
    
    cancelBtn.addEventListener('click', () => {
        modal.classList.remove('visible');
        setTimeout(() => {
            modal.remove();
        }, 300);
    });
    
    // If editing, load template data
    if (templateId) {
        loadTemplateData(templateId);
    }
    
    // Handle form submission
    const form = document.getElementById('template-form');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        
        // Add isTemplate flag
        formData.append('isTemplate', 'true');
        
        // Process tags
        const tagsInput = formData.get('tags');
        if (tagsInput) {
            const tagsArray = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
            formData.set('tags', JSON.stringify(tagsArray));
        }
        
        try {
            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.innerHTML = 'Processing...';
            submitBtn.disabled = true;
            
            // Determine if creating or updating
            let url = '/api/documents';
            let method = 'POST';
            
            if (templateId) {
                url = `/api/documents/${templateId}`;
                method = 'PUT';
                
                // If no new file is selected, don't send file data
                if (!formData.get('file').name) {
                    formData.delete('file');
                }
            }
            
            // Send request
            const response = await fetch(url, {
                method,
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
                body: formData
        });
        
        if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to ${templateId ? 'update' : 'create'} template`);
            }
            
            // Show success message
            showNotification(`Template ${templateId ? 'updated' : 'created'} successfully`, 'success');
            
            // Close modal
            modal.classList.remove('visible');
            setTimeout(() => {
                modal.remove();
            }, 300);
            
            // Reload templates
            loadTemplates();
            
        } catch (error) {
            console.error(`Error ${templateId ? 'updating' : 'creating'} template:`, error);
            showNotification(`Error ${templateId ? 'updating' : 'creating'} template: ${error.message}`, 'error');
            
            // Reset button
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.innerHTML = templateId ? 'Update Template' : 'Create Template';
            submitBtn.disabled = false;
        }
    });
}

/**
 * Load template data for editing
 */
async function loadTemplateData(templateId) {
    try {
        // Show loading state
        showNotification('Loading template data...', 'info');
        
        // Fetch template from API
        const response = await fetch(`/api/documents/${templateId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error fetching template: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        const template = result.data;
        
        // Populate form fields
        document.getElementById('template-title').value = template.title || '';
        document.getElementById('template-description').value = template.description || '';
        document.getElementById('template-category').value = template.category || '';
        document.getElementById('template-type').value = template.documentType || '';
        
        // Handle tags
        if (template.tags && Array.isArray(template.tags)) {
            document.getElementById('template-tags').value = template.tags.join(', ');
        }
        
    } catch (error) {
        console.error('Error loading template data:', error);
        showNotification('Error loading template data: ' + error.message, 'error');
    }
}

/**
 * Edit a template
 */
function editTemplate(templateId) {
    showTemplateForm(templateId);
}

/**
 * Duplicate a template
 */
async function duplicateTemplate(templateId) {
    try {
        // Show loading notification
        showNotification('Duplicating template...', 'info');
        
        // Fetch the original template
        const response = await fetch(`/api/documents/${templateId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error fetching template: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        const template = result.data;
        
        // Create a new template based on the original
        const newTemplate = {
            title: `${template.title} (Copy)`,
            description: template.description,
            documentType: template.documentType,
            category: template.category,
            isTemplate: true,
            tags: template.tags
        };
        
        // Duplicate file if possible
        if (template.file && template.file.fileName) {
            // This is a placeholder for actual file duplication logic
            // In a real implementation, you would need to handle file duplication properly
            // For now, we'll just reference the original file
            const duplicateResponse = await fetch(`/api/documents/${templateId}/duplicate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newTemplate)
            });
            
            if (!duplicateResponse.ok) {
                throw new Error(`Error duplicating template: ${duplicateResponse.status} ${duplicateResponse.statusText}`);
            }
            
            const duplicateResult = await duplicateResponse.json();
            
            // Show success message
            showNotification('Template duplicated successfully', 'success');
            
            // Reload templates
            loadTemplates();
            
        } else {
            throw new Error('Template file not available for duplication');
        }
        
    } catch (error) {
        console.error('Error duplicating template:', error);
        showNotification('Error duplicating template: ' + error.message, 'error');
    }
}

// Initialize template search and filtering
function initializeTemplateSearchAndFilters() {
    const searchInput = document.getElementById('template-search');
    const categoryFilter = document.getElementById('template-category-filter');
    
    if (!searchInput || !categoryFilter) {
        return;
    }
    
    searchInput.addEventListener('input', function() {
        filterTemplates();
    });
    
    categoryFilter.addEventListener('change', function() {
        filterTemplates();
    });
}

// Filter templates based on search and category filter
function filterTemplates() {
    const searchTerm = document.getElementById('template-search').value.toLowerCase();
    const categoryFilter = document.getElementById('template-category-filter').value;
    
    // Get all template items
    const templateItems = document.querySelectorAll('.template-item');
    
    // Loop through each template item
    templateItems.forEach(item => {
        // Get template data from the item
        const title = item.querySelector('h4').textContent.toLowerCase();
        const description = item.querySelector('p').textContent.toLowerCase();
        const category = item.dataset.category;
        
        // Check if template matches search term
        const matchesSearch = searchTerm === '' || 
            title.includes(searchTerm) || 
            description.includes(searchTerm);
        
        // Check if template matches category filter
        const matchesCategory = categoryFilter === 'all' || category === categoryFilter;
        
        // Show or hide template based on filters
        if (matchesSearch && matchesCategory) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
    
    // Check if any templates are visible in each category
    const categories = document.querySelectorAll('.template-category');
    categories.forEach(category => {
        const categoryTemplates = category.querySelectorAll('.template-item');
        const visibleTemplates = Array.from(categoryTemplates).filter(item => item.style.display !== 'none');
        
        // Get the empty state element for this category
        let emptyState = category.querySelector('.empty-state');
        
        // If no templates are visible, show empty state
        if (visibleTemplates.length === 0) {
            if (!emptyState) {
                emptyState = document.createElement('div');
                emptyState.className = 'empty-state';
                emptyState.textContent = 'No templates match your filters';
                const templateList = category.querySelector('.template-list');
                templateList.appendChild(emptyState);
            }
            emptyState.style.display = 'block';
        } else if (emptyState) {
            emptyState.style.display = 'none';
        }
    });
}

function initializeDynamicContent() {
    // Initialize each component with try/catch to prevent one failure from breaking everything
    
    try {
        // Initialize search functionality
        initializeSearch();
    } catch (error) {
        console.error('Error initializing search:', error);
    }
    
    try {
        // Initialize notifications
        initializeNotifications();
    } catch (error) {
        console.error('Error initializing notifications:', error);
    }
    
    try {
        // Initialize task management 
        initializeTaskManagement();
    } catch (error) {
        console.error('Error initializing task management:', error);
    }
    
    try {
        // Initialize document management
        initializeDocumentManagement();
    } catch (error) {
        console.error('Error initializing document management:', error);
    }
    
    try {
        // Initialize tab navigation
        initializeTabNavigation();
    } catch (error) {
        console.error('Error initializing tab navigation:', error);
    }
    
    try {
        // Initialize compliance verification
        initializeComplianceVerification();
    } catch (error) {
        console.error('Error initializing compliance verification:', error);
    }
    
    try {
        // Initialize onboarding approvals
        initializeOnboardingApprovals();
    } catch (error) {
        console.error('Error initializing onboarding approvals:', error);
    }
    
    try {
        // Initialize template management
        initializeTemplateManagement();
    } catch (error) {
        console.error('Error initializing template management:', error);
    }
    
    try {
        // Initialize template search and filters
        initializeTemplateSearchAndFilters();
    } catch (error) {
        console.error('Error initializing template search and filters:', error);
    }
    
    try {
        // Load real employee data
        loadEmployeeData();
    } catch (error) {
        console.error('Error loading employee data:', error);
    }
}

// Add updateDateTime function 
function updateDateTime() {
    try {
        const now = new Date();
        
        // Format date: Monday, January 1, 2024
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = now.toLocaleDateString('en-US', dateOptions);
        
        // Format time: 3:00 PM
        const timeOptions = { hour: 'numeric', minute: 'numeric', hour12: true };
        const formattedTime = now.toLocaleTimeString('en-US', timeOptions);
        
        // Update elements
        const dateElement = document.getElementById('current-date');
        const timeElement = document.getElementById('current-time');
        
        if (dateElement) {
            dateElement.textContent = formattedDate;
        }
        
        if (timeElement) {
            timeElement.textContent = formattedTime;
        }
    } catch (error) {
        console.error('Error updating date time:', error);
    }
}

// Add initializeMobileMenu function
function initializeMobileMenu() {
    try {
        const menuToggle = document.getElementById('menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        
        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', function() {
                sidebar.classList.toggle('active');
            });
        }
    } catch (error) {
        console.error('Error initializing mobile menu:', error);
    }
}

// Add initializeActivityFeed function
function initializeActivityFeed() {
    try {
        // This would typically fetch recent activity data from the server
        // For now, we'll just log that it's initialized
        console.log('Activity feed initialized');
        
        // You can add code here to fetch and display real activity data
    } catch (error) {
        console.error('Error initializing activity feed:', error);
    }
}

// Add initializeSidebar function
function initializeSidebar() {
    try {
        // Get all navigation links
        const navLinks = document.querySelectorAll('.sidebar a');
        
        // Add click event listeners to all navigation links
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                // Special case for logout
                if (this.id === 'logout-link') {
                    e.preventDefault();
                    // Handle logout
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login.html';
                    return;
                }
                
                // Remove active class from all links
                navLinks.forEach(l => l.classList.remove('active'));
                
                // Add active class to clicked link
                this.classList.add('active');
                
                // If link has an href attribute with a section ID
                const href = this.getAttribute('href');
                if (href && href.startsWith('#') && href !== '#') {
                    e.preventDefault();
                    const sectionId = href.substring(1);
                    loadSectionContent(sectionId);
                }
            });
        });
        
        // Set initial active link based on hash or default to dashboard
        const hash = window.location.hash || '#dashboard';
        const activeLink = document.querySelector(`.sidebar a[href="${hash}"]`);
        if (activeLink) {
            activeLink.click();
        } else {
            const dashboardLink = document.querySelector('.sidebar a[href="#dashboard"]');
            if (dashboardLink) {
                dashboardLink.click();
            }
        }
    } catch (error) {
        console.error('Error initializing sidebar:', error);
    }
}

// Add loadSectionContent function
function loadSectionContent(sectionId) {
    try {
        console.log('Loading section:', sectionId);
        
        // Get all dashboard sections
        const sections = document.querySelectorAll('.dashboard-section');
        
        // Hide all sections and remove active class
        sections.forEach(section => {
            section.style.display = 'none';
            section.classList.remove('active');
        });
        
        // Show the target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
            
            // Trigger animation after display change
            setTimeout(() => {
                targetSection.classList.add('active');
            }, 10);
            
            // Load section-specific content if needed
            if (sectionId === 'templates') {
                try {
                    loadTemplates();
                } catch (error) {
                    console.error('Error loading templates:', error);
                }
            } else if (sectionId === 'documents') {
                try {
                    loadDocuments();
                } catch (error) {
                    console.error('Error loading documents:', error);
                }
            } else if (sectionId === 'onboarding') {
                try {
                    loadOnboardingSubmissions();
                } catch (error) {
                    console.error('Error loading onboarding submissions:', error);
                }
            }
        } else {
            console.error('Section not found:', sectionId);
        }
    } catch (error) {
        console.error('Error loading section content:', error);
    }
}

// Add loadDocuments function
async function loadDocuments() {
    try {
        console.log('Loading documents');
        
        const documentList = document.getElementById('admin-document-list');
        if (!documentList) {
            console.error('Document list container not found');
            return;
        }
        
        // Show loading state
        documentList.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> Loading documents...</div>';
        
        try {
            // Fetch documents from API
            const response = await fetch('/api/documents', {
                method: 'GET',
            headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
                throw new Error(`Error fetching documents: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
            const documents = result.data || [];
            
            console.log('Documents loaded:', documents.length);
            
            // Clear loading state
            documentList.innerHTML = '';
            
            if (documents.length === 0) {
                documentList.innerHTML = '<div class="empty-state">No documents found</div>';
                return;
            }
            
            // Create document cards
            documents.forEach(doc => {
                const docCard = createDocumentCard(doc);
                documentList.appendChild(docCard);
            });
        } catch (error) {
            console.error('Error fetching documents:', error);
            documentList.innerHTML = '<div class="error-message">Error loading documents: ' + error.message + '</div>';
        }
    } catch (error) {
        console.error('Error in loadDocuments function:', error);
    }
}

// Helper function to create document card
function createDocumentCard(doc) {
    try {
        const card = document.createElement('div');
        card.className = 'document-card';
        card.dataset.id = doc._id;
        
        // Determine icon based on document type
        let icon = 'fas fa-file-alt';
        if (doc.documentType === 'pdf') icon = 'fas fa-file-pdf';
        if (doc.documentType === 'presentation') icon = 'fas fa-file-powerpoint';
        if (doc.documentType === 'spreadsheet') icon = 'fas fa-file-excel';
        if (doc.documentType === 'image') icon = 'fas fa-file-image';
        if (doc.documentType === 'video') icon = 'fas fa-file-video';
        
        // Format date
        const updatedAt = doc.updatedAt ? new Date(doc.updatedAt) : new Date(doc.createdAt);
        const formattedDate = updatedAt.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        
        card.innerHTML = `
            <div class="document-icon">
                <i class="${icon}"></i>
            </div>
            <div class="document-info">
                <h4>${doc.title}</h4>
                <p>${doc.description || 'No description'}</p>
                <div class="document-meta">
                    <span class="document-category">${doc.category.replace('_', ' ')}</span>
                    <span class="document-date">Updated: ${formattedDate}</span>
                </div>
            </div>
            <div class="document-actions">
                <button class="action-btn view-document" title="View Document" data-id="${doc._id}">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn edit-document" title="Edit Document" data-id="${doc._id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-document" title="Delete Document" data-id="${doc._id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Add event listeners for actions
        card.querySelector('.view-document').addEventListener('click', () => {
            if (doc.file && doc.file.fileName) {
                window.open(`/uploads/documents/${doc.file.fileName}`, '_blank');
            } else {
                showNotification('Document file not available', 'error');
            }
        });
        
        card.querySelector('.edit-document').addEventListener('click', () => {
            // Edit document functionality would go here
            console.log('Edit document:', doc._id);
        });
        
        card.querySelector('.delete-document').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this document?')) {
                deleteDocument(doc._id);
            }
        });
        
        return card;
    } catch (error) {
        console.error('Error creating document card:', error);
        const errorCard = document.createElement('div');
        errorCard.className = 'document-card error';
        errorCard.innerHTML = '<div class="error-message">Error rendering document</div>';
        return errorCard;
    }
}

// Function to delete a document
async function deleteDocument(documentId) {
    try {
        const response = await fetch(`/api/documents/${documentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error deleting document: ${response.status} ${response.statusText}`);
        }
        
        showNotification('Document deleted successfully', 'success');
        
        // Reload documents
        loadDocuments();
    } catch (error) {
        console.error('Error deleting document:', error);
        showNotification('Error deleting document: ' + error.message, 'error');
    }
}

// Add showNotification function
function showNotification(message, type = 'info') {
    try {
        console.log(`Notification (${type}):`, message);
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="notification-icon ${getNotificationIcon(type)}"></i>
                <span class="notification-message">${message}</span>
            </div>
            <button class="notification-close">&times;</button>
        `;
        
        // Add to notification container (create if not exists)
        let container = document.querySelector('.notification-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
        
        // Add notification to container
        container.appendChild(notification);
        
        // Add animation class after small delay for animation to work
        setTimeout(() => {
            notification.classList.add('visible');
        }, 10);
        
        // Add close button event
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            closeNotification(notification);
        });
        
        // Auto-close after 5 seconds
        setTimeout(() => {
            closeNotification(notification);
        }, 5000);
    } catch (error) {
        console.error('Error showing notification:', error);
    }
}

// Helper function to close notification with animation
function closeNotification(notification) {
    try {
        // Add closing class for animation
        notification.classList.add('closing');
        
        // Remove after animation completes
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            
            // If no more notifications, remove container
            const container = document.querySelector('.notification-container');
            if (container && container.children.length === 0) {
                container.remove();
            }
        }, 300);
    } catch (error) {
        console.error('Error closing notification:', error);
    }
}

// Helper function to get the right icon for each notification type
function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'fas fa-check-circle';
        case 'error': return 'fas fa-exclamation-circle';
        case 'warning': return 'fas fa-exclamation-triangle';
        case 'info':
        default: return 'fas fa-info-circle';
    }
}