/* filepath: /c:/Users/sujan/Desktop/OnboardX/Frontend/base/admin_dashboard.js */

// Add missing function definitions
function initializeOnboardingApprovals() {
    console.log('Onboarding approvals initialized');
    // Placeholder for onboarding approvals functionality
}

function initializeOnboardingTracker() {
    // Get references to the column elements using the correct IDs from the HTML
    const toStartColumn = document.querySelector('#toStart');
    const inProgressColumn = document.querySelector('#inProgress');
    const completedColumn = document.querySelector('#completed');
    
    // Add null checks to prevent errors if elements don't exist
    if (!toStartColumn || !inProgressColumn || !completedColumn) {
        console.error('One or more onboarding columns not found in the DOM', {
            toStartExists: !!toStartColumn,
            inProgressExists: !!inProgressColumn,
            completedExists: !!completedColumn
        });
        return; // Exit the function if elements don't exist
    }
    
    // Show loading spinners with improved styling
    const loadingHTML = '<div class="d-flex justify-content-center align-items-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="ms-2 mb-0">Loading...</p></div>';
    toStartColumn.innerHTML = loadingHTML;
    inProgressColumn.innerHTML = loadingHTML;
    completedColumn.innerHTML = loadingHTML;

    // Fetch employees from API based on onboarding status
    const token = localStorage.getItem('token');
    fetch('/api/employees?onboardingStatus=all', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            console.error('Error fetching employees', response.status);
            throw new Error('Failed to fetch employees');
        }
        return response.json();
    })
    .then(data => {
        console.log('Onboarding data response:', data);
        
        // Clear loading spinners
        toStartColumn.innerHTML = '';
        inProgressColumn.innerHTML = '';
        completedColumn.innerHTML = '';
        
        // Check if employees data exists
        if (!data.employees || !Array.isArray(data.employees)) {
            console.error('No employees found in the response or different response format:', data);
            const noDataHTML = '<div class="text-center py-4"><i class="fas fa-users text-muted mb-2" style="font-size: 2rem;"></i><p class="mb-0">No employees found</p></div>';
            toStartColumn.innerHTML = noDataHTML;
            inProgressColumn.innerHTML = noDataHTML;
            completedColumn.innerHTML = noDataHTML;
            return;
        }
        
        // Filter employees by onboarding status
        const notStartedEmployees = data.employees.filter(emp => 
            !emp.onboarding || emp.onboarding.status === 'not_started');
        const inProgressEmployees = data.employees.filter(emp => 
            emp.onboarding && emp.onboarding.status === 'in_progress');
        const completedEmployees = data.employees.filter(emp => 
            emp.onboarding && emp.onboarding.status === 'completed');
        
        console.log(`To Start: ${notStartedEmployees.length}, In Progress: ${inProgressEmployees.length}, Completed: ${completedEmployees.length}`);
        
        // Populate each column with improved empty state
        if (notStartedEmployees.length === 0) {
            toStartColumn.innerHTML = '<div class="text-center py-4"><i class="fas fa-hourglass-start text-muted mb-2" style="font-size: 2rem;"></i><p class="mb-0">No employees in this status</p></div>';
        } else {
            notStartedEmployees.forEach(employee => {
                const card = createEmployeeCard(employee, 'not_started');
                toStartColumn.appendChild(card);
            });
        }
        
        if (inProgressEmployees.length === 0) {
            inProgressColumn.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner text-muted mb-2" style="font-size: 2rem;"></i><p class="mb-0">No employees in this status</p></div>';
        } else {
            inProgressEmployees.forEach(employee => {
                const card = createEmployeeCard(employee, 'in_progress');
                inProgressColumn.appendChild(card);
            });
        }
        
        if (completedEmployees.length === 0) {
            completedColumn.innerHTML = '<div class="text-center py-4"><i class="fas fa-check-circle text-muted mb-2" style="font-size: 2rem;"></i><p class="mb-0">No employees in this status</p></div>';
        } else {
            completedEmployees.forEach(employee => {
                const card = createEmployeeCard(employee, 'completed');
                completedColumn.appendChild(card);
            });
        }
        
        // Initialize drag and drop
        initializeDragAndDrop();
    })
    .catch(error => {
        console.error('Error loading onboarding employees:', error);
        // Display error message in all columns with improved styling
        const errorHTML = `<div class="alert alert-danger m-3"><i class="fas fa-exclamation-triangle me-2"></i>Error loading employees: ${error.message}</div>`;
        toStartColumn.innerHTML = errorHTML;
        inProgressColumn.innerHTML = errorHTML;
        completedColumn.innerHTML = errorHTML;
    });
}

function createEmployeeCard(employee, statusColumn) {
    const card = document.createElement('div');
    card.className = 'employee-card mb-3 p-3 bg-white rounded shadow-sm';
    card.setAttribute('draggable', 'true');
    card.setAttribute('data-employee-id', employee._id);
    card.setAttribute('data-status', statusColumn);
    
    // Get employee name, display proper formatted name if available
    const fullName = employee.firstName && employee.lastName 
        ? `${employee.firstName} ${employee.lastName}`
        : employee.name || 'Unnamed Employee';
    
    // Generate appropriate status badge
    let statusBadge = '';
    if (statusColumn === 'completed') {
        statusBadge = '<span class="badge bg-success ms-2">Completed</span>';
    } else if (statusColumn === 'in_progress') {
        statusBadge = '<span class="badge bg-warning ms-2">In Progress</span>';
    } else {
        statusBadge = '<span class="badge bg-secondary ms-2">To Start</span>';
    }
    
    // Format date if available
    let dateInfo = '';
    if (employee.onboarding && employee.onboarding.updatedAt) {
        const date = new Date(employee.onboarding.updatedAt);
        const formattedDate = date.toLocaleDateString();
        dateInfo = `<small class="text-muted d-block">Updated: ${formattedDate}</small>`;
    } else if (employee.createdAt) {
        const date = new Date(employee.createdAt);
        const formattedDate = date.toLocaleDateString();
        dateInfo = `<small class="text-muted d-block">Created: ${formattedDate}</small>`;
    }
    
    // Add action button based on status
    let actionButton = '';
    if (statusColumn === 'completed') {
        actionButton = `<button class="btn btn-sm btn-primary mt-2 view-details-btn w-100" data-employee-id="${employee._id}">Review</button>`;
    } else {
        actionButton = `<button class="btn btn-sm btn-outline-secondary mt-2 view-details-btn w-100" data-employee-id="${employee._id}">View Details</button>`;
    }
    
    // Build card content with improved styling
    card.innerHTML = `
        <div>
            <h6 class="mb-0 fw-bold text-primary">${fullName}</h6>
            <div class="d-flex align-items-center mt-1 mb-2">
                ${statusBadge}
            </div>
            <div class="text-muted mb-2 small">${employee.email || 'No email'}</div>
            <div class="d-flex justify-content-between align-items-center mb-2 small">
                <span>${employee.department || 'No department'}</span>
                <span>${employee.position || 'No position'}</span>
            </div>
            ${dateInfo}
            ${actionButton}
        </div>
    `;
    
    // Add drag events
    card.addEventListener('dragstart', handleDragStart);
    
    // Add click event for view details button
    card.querySelector('.view-details-btn').addEventListener('click', function() {
        viewEmployeeDetails(employee._id, statusColumn);
    });
    
    return card;
}

function createModal(title, content) {
    const modalElement = document.createElement('div');
    modalElement.className = 'modal fade';
    modalElement.id = 'employeeModal';
    modalElement.setAttribute('tabindex', '-1');
    modalElement.setAttribute('aria-labelledby', 'employeeModalLabel');
    modalElement.setAttribute('aria-hidden', 'true');
    
    modalElement.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header bg-light">
                    <h5 class="modal-title" id="employeeModalLabel">${title}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    `;
    
    return modalElement;
}

function viewEmployeeDetails(employeeId, statusColumn) {
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
        const employee = data.employee || data;
        
        if (!employee) {
            throw new Error('No employee data found in response');
        }
        
        console.log('Employee details:', employee);
        
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
            
            // Add onboarding details with timeline - safely check for nested properties
            modalContent += `
                <div class="mb-4">
                    <h5 class="border-bottom pb-2 text-primary">Onboarding Progress</h5>
                    <div class="progress mb-3">
                        <div class="progress-bar bg-success" role="progressbar" style="width: 100%" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100">100%</div>
                    </div>
                    <p><strong>Status:</strong> <span class="badge bg-success">Completed</span></p>
                    <p><strong>Completed On:</strong> ${employee.onboarding && employee.onboarding.updatedAt ? new Date(employee.onboarding.updatedAt).toLocaleString() : 'Unknown'}</p>
                    
                    <h6 class="mt-3 mb-2">Onboarding Timeline</h6>
                    <div class="timeline small">
                        ${employee.onboarding && employee.onboarding.completedSteps && employee.onboarding.completedSteps.length > 0 ? 
                            employee.onboarding.completedSteps.map(step => 
                                `<div class="timeline-item">
                                    <div class="timeline-marker bg-success"></div>
                                    <div class="timeline-content">
                                        <h6 class="timeline-title mb-0">${step.step.replace('step', 'Step ')}</h6>
                                        <p class="text-muted mb-2">${new Date(step.completedAt).toLocaleString()}</p>
                                    </div>
                                </div>`
                            ).join('') : 
                            '<p>No steps recorded</p>'
                        }
                    </div>
                </div>
            `;
            
            // Add approval/rejection actions
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
            // Basic profile details for non-completed employees
            modalTitle = statusColumn === 'in_progress' ? 
                `<i class="fas fa-clock text-warning me-2"></i>In Progress: ${employee.firstName || ''} ${employee.lastName || ''}` : 
                `<i class="fas fa-hourglass-start text-secondary me-2"></i>To Start: ${employee.firstName || ''} ${employee.lastName || ''}`;
            
            modalContent += `
                <div class="mb-4">
                    <h5 class="border-bottom pb-2 text-primary">Profile Information</h5>
                    <div class="row">
                        <div class="col-md-6">
                            <p><strong>Name:</strong> ${employee.firstName || ''} ${employee.lastName || ''}</p>
                            <p><strong>Email:</strong> ${employee.email || 'Not provided'}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Department:</strong> ${employee.department || 'Not assigned'}</p>
                            <p><strong>Position:</strong> ${employee.position || employee.jobTitle || 'Not specified'}</p>
                        </div>
                    </div>
                </div>
                
                <div class="mb-4">
                    <h5 class="border-bottom pb-2 text-primary">Onboarding Status</h5>
                    <p>
                        <span class="badge ${statusColumn === 'in_progress' ? 'bg-warning' : 'bg-secondary'}">
                            ${statusColumn === 'in_progress' ? 'In Progress' : 'To Start'}
                        </span>
                    </p>
                    <div class="progress mb-3">
                        <div class="progress-bar ${statusColumn === 'in_progress' ? 'bg-warning' : 'bg-secondary'}" 
                             role="progressbar" 
                             style="width: ${statusColumn === 'in_progress' ? '50%' : '0%'}" 
                             aria-valuenow="${statusColumn === 'in_progress' ? '50' : '0'}" 
                             aria-valuemin="0" 
                             aria-valuemax="100">
                            ${statusColumn === 'in_progress' ? '50%' : '0%'}
                        </div>
                    </div>
                    <p class="alert alert-info">
                        <i class="fas fa-info-circle me-1"></i>
                        ${statusColumn === 'in_progress' ? 
                            'Employee has started the onboarding process. You can track their progress here.' : 
                            'Employee has not yet started their onboarding process.'}
                    </p>
                </div>
                
                <div class="text-end">
                    <button class="btn btn-primary send-reminder-btn" data-employee-id="${employee._id}">
                        <i class="fas fa-paper-plane me-1"></i> Send Reminder
                    </button>
                </div>
            `;
        }
        
        // Create and show modal
        const modal = createModal(modalTitle, modalContent);
        document.body.appendChild(modal);
        
        // Initialize Bootstrap modal
        try {
            const bootstrapModal = new bootstrap.Modal(modal);
            bootstrapModal.show();
            
            // Add event listener for approval/rejection if in completed status
            if (statusColumn === 'completed') {
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
        } catch (error) {
            console.error('Bootstrap modal error:', error);
            // Fallback for missing Bootstrap
            if (typeof bootstrap === 'undefined') {
                // Bootstrap not loaded - create simpler modal
                modal.style.display = 'block';
                modal.style.position = 'fixed';
                modal.style.top = '0';
                modal.style.left = '0';
                modal.style.width = '100%';
                modal.style.height = '100%';
                modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
                modal.style.zIndex = '1050';
                
                // Close button event
                const closeButtons = modal.querySelectorAll('[data-bs-dismiss="modal"], .close-modal, .btn-close');
                closeButtons.forEach(button => {
                    button.addEventListener('click', function() {
                        document.body.removeChild(modal);
                    });
                });
            } else {
                // Bootstrap loaded but error occurred
                alert('Could not initialize modal. Bootstrap may not be loaded properly.');
                document.body.removeChild(modal);
            }
        }
    })
    .catch(error => {
        console.error('Error fetching employee details:', error);
        // Show error alert
        showAlert('danger', `Error fetching employee details: ${error.message}`);
    });
}

function approveOnboarding(employeeId, modal) {
    const token = localStorage.getItem('token');
    fetch(`/api/employees/${employeeId}/onboarding`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            status: 'approved',
            actionBy: 'hr' // This will be replaced by the actual user ID on the server
        })
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to approve onboarding');
        return response.json();
    })
    .then(data => {
        console.log('Onboarding approved:', data);
        modal.hide();
        showAlert('success', 'Onboarding approved successfully');
        // Refresh the onboarding tracker
        initializeOnboardingTracker();
    })
    .catch(error => {
        console.error('Error approving onboarding:', error);
        showAlert('danger', `Error approving onboarding: ${error.message}`);
    });
}

function rejectOnboarding(employeeId, reason, modal) {
    if (!reason || reason.trim() === '') {
        showAlert('warning', 'Please provide a reason for rejection');
        return;
    }
    
    const token = localStorage.getItem('token');
    fetch(`/api/employees/${employeeId}/onboarding`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            status: 'rejected',
            actionBy: 'hr', // This will be replaced by the actual user ID on the server
            rejectionReason: reason
        })
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to reject onboarding');
        return response.json();
    })
    .then(data => {
        console.log('Onboarding rejected:', data);
        modal.hide();
        showAlert('success', 'Onboarding rejected with feedback');
        // Refresh the onboarding tracker
        initializeOnboardingTracker();
    })
    .catch(error => {
        console.error('Error rejecting onboarding:', error);
        showAlert('danger', `Error rejecting onboarding: ${error.message}`);
    });
}

function initializeDragAndDrop() {
    const dropZones = document.querySelectorAll('.onboarding-content');
    
    // Add event listeners for drop zones
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', handleDragOver);
        zone.addEventListener('drop', handleDrop);
    });
}

function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', JSON.stringify({
        employeeId: e.target.getAttribute('data-employee-id'),
        currentStatus: e.target.getAttribute('data-status')
    }));
    e.target.classList.add('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e) {
    e.preventDefault();
    
    // Get the drop target (column)
    const dropTarget = e.target.closest('.onboarding-content');
    if (!dropTarget) return;
    
    // Get the target status from the column's parent ID
    const targetColumnId = dropTarget.parentElement.id;
    let targetStatus;
    
    if (targetColumnId === 'to-start-column') {
        targetStatus = 'not_started';
    } else if (targetColumnId === 'in-progress-column') {
        targetStatus = 'in_progress';
    } else if (targetColumnId === 'completed-column') {
        targetStatus = 'completed';
    } else {
        return; // Invalid drop target
    }
    
    // Get the dragged employee data
    try {
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        const employeeId = data.employeeId;
        const currentStatus = data.currentStatus;
        
        // Don't do anything if dropping to the same status
        if (currentStatus === targetStatus) return;
        
        // Update employee onboarding status in the database
        updateEmployeeOnboardingStatus(employeeId, targetStatus);
        
    } catch (error) {
        console.error('Error handling drop:', error);
    }
}

function updateEmployeeOnboardingStatus(employeeId, newStatus) {
    const token = localStorage.getItem('token');
    
    // Show loading indicator
    showAlert('info', 'Updating employee status...', 'status-update-alert');
    
    fetch(`/api/employees/${employeeId}/onboarding`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            status: newStatus
        })
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to update employee status');
        return response.json();
    })
    .then(data => {
        console.log('Status updated:', data);
        showAlert('success', 'Employee status updated successfully', 'status-update-alert');
        // Refresh the onboarding tracker
        initializeOnboardingTracker();
    })
    .catch(error => {
        console.error('Error updating status:', error);
        showAlert('danger', `Error updating status: ${error.message}`, 'status-update-alert');
    });
}

// Utility function to display alerts
function showAlert(type, message) {
  // Create alert container if it doesn't exist
  let alertContainer = document.getElementById('alertContainer');
  if (!alertContainer) {
    alertContainer = document.createElement('div');
    alertContainer.id = 'alertContainer';
    alertContainer.className = 'position-fixed top-0 end-0 p-3';
    alertContainer.style.zIndex = '9999';
    document.body.appendChild(alertContainer);
  }
  
  // Create alert element
  const alert = document.createElement('div');
  alert.className = `alert alert-${type} alert-dismissible fade show`;
  alert.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  // Add alert to container
  alertContainer.appendChild(alert);
  
  // Automatically remove after 5 seconds
  setTimeout(() => {
    alert.classList.remove('show');
    setTimeout(() => {
      alertContainer.removeChild(alert);
    }, 300);
  }, 5000);
}

function initializeDashboardCharts() {
    console.log('Dashboard charts initialized');
    // Placeholder for dashboard charts functionality
}

function initializeUserData() {
    console.log('User data initialized');
    // Placeholder for user data initialization
}

document.addEventListener('DOMContentLoaded', async function() {
    // Check if user is authenticated
    if (!api.auth.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }
    
    // Get user data
    const userData = api.auth.getUserData();
    const userRole = userData.role;
    
    // Check if user has admin privileges
    if (userRole !== 'hr_admin' && userRole !== 'department_admin') {
        console.error('Unauthorized access attempt: User role is ' + userRole);
        window.location.href = 'index.html';
        return;
    }
    
    // Create notification container if it doesn't exist
    if (!document.getElementById('notification-container')) {
        const container = document.createElement('div');
        container.id = 'notification-container';
        document.body.appendChild(container);
    }
    
    // Add global showNotification function
    window.showNotification = function(message, type = 'success') {
        console.log('Showing notification:', message, type);
        
        const container = document.getElementById('notification-container');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
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
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
        
        container.appendChild(notification);
        
        // Auto show
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
        
        return notification;
    };
    
    // Display stored user data immediately
    displayUserInfo(userData);
    
    // Then try to load fresh user data
    try {
        const freshUserData = await api.auth.getCurrentUser();
        if (freshUserData) {
            displayUserInfo(freshUserData);
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        showNotification('Using cached user data', 'warning');
    }
    
    // Initialize mobile menu
    initializeMobileMenu();
    
    // Initialize date and time display
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // Initialize charts
    initializeCharts();
    
    // Initialize sidebar navigation
    initializeSidebar();
    
    // Initialize activity feed
    initializeActivityFeed();
    
    // Initialize dynamic content loading
    initializeDynamicContent();
    
    // Explicitly show the dashboard section
    showNotification('Welcome to the Admin Dashboard', 'success');
    loadSectionContent('dashboard');
    
    // Set the dashboard nav link as active
    const dashboardLink = document.querySelector('a[href="#dashboard"]');
    if (dashboardLink) {
        const allLinks = document.querySelectorAll('.sidebar a');
        allLinks.forEach(link => link.classList.remove('active'));
        dashboardLink.classList.add('active');
    }

    /**
     * Display user information on the dashboard
     */
    function displayUserInfo(user) {
        console.log('Displaying user info:', user);
        
        // Update welcome message with user's name
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            const displayName = user.name || user.firstName || (user.email ? user.email.split('@')[0] : 'Admin');
            userNameElement.textContent = displayName;
        }
        
        // Set up logout functionality
        const logoutLink = document.getElementById('logout-link');
        if (logoutLink) {
            logoutLink.addEventListener('click', async function(e) {
                e.preventDefault();
                
                // Show notification that logout is processing
                showNotification('Logging out...', 'info');
                
                try {
                    await api.auth.logout();
                    // Redirect to login page
                    window.location.href = 'index.html';
                } catch (error) {
                    console.error('Logout error:', error);
                    showNotification('Failed to logout. Please try again.', 'error');
                }
            });
        }
    }

    function initializeMobileMenu() {
        const menuToggle = document.getElementById('menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');

        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
                mainContent.classList.toggle('sidebar-active');
            });

            // Close sidebar when clicking outside
            document.addEventListener('click', (e) => {
                if (!sidebar.contains(e.target) && 
                    !menuToggle.contains(e.target) && 
                    sidebar.classList.contains('active')) {
                    sidebar.classList.remove('active');
                    mainContent.classList.remove('sidebar-active');
                }
            });
        }
    }

    function updateDateTime() {
        const now = new Date();
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const timeOptions = { hour: '2-digit', minute: '2-digit' };
        
        const dateEl = document.getElementById('current-date');
        const timeEl = document.getElementById('current-time');
        
        if (dateEl && timeEl) {
            dateEl.textContent = now.toLocaleDateString(undefined, dateOptions);
            timeEl.textContent = now.toLocaleTimeString(undefined, timeOptions);
        }
    }

    function initializeCharts() {
        // Employee Progress Chart (Area Chart)
        const employeeCtx = document.getElementById('employeeProgressChart')?.getContext('2d');
        if (employeeCtx) {
            const gradientFill = employeeCtx.createLinearGradient(0, 0, 0, 400);
            gradientFill.addColorStop(0, 'rgba(29, 185, 84, 0.3)');
            gradientFill.addColorStop(1, 'rgba(29, 185, 84, 0)');

            new Chart(employeeCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Completed',
                        data: [10, 15, 12, 25, 18, 30],
                        borderColor: '#1db954',
                        backgroundColor: gradientFill,
                        tension: 0.4,
                        fill: true
                    }, {
                        label: 'In Progress',
                        data: [5, 10, 8, 15, 12, 20],
                        borderColor: '#ffd700',
                        backgroundColor: 'transparent',
                        tension: 0.4,
                        fill: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: { color: '#fff' }
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: '#1e1e1e',
                            titleColor: '#fff',
                            bodyColor: '#b3b3b3',
                            borderColor: '#282828',
                            borderWidth: 1
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: '#282828'
                            },
                            ticks: {
                                color: '#fff',
                                callback: function(value) {
                                    return value + ' emp';
                                }
                            }
                        },
                        x: {
                            grid: {
                                color: '#282828'
                            },
                            ticks: {
                                color: '#fff'
                            }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    }
                }
            });
        }

        // Task Completion Chart (Bar Chart)
        const taskCtx = document.getElementById('taskCompletionChart')?.getContext('2d');
        if (taskCtx) {
            new Chart(taskCtx, {
                type: 'bar',
                data: {
                    labels: ['Documentation', 'IT Setup', 'Training', 'HR Tasks', 'Team Intro'],
                    datasets: [{
                        label: 'Completed',
                        data: [85, 70, 60, 90, 75],
                        backgroundColor: '#1db954',
                        borderRadius: 5
                    }, {
                        label: 'Pending',
                        data: [15, 30, 40, 10, 25],
                        backgroundColor: '#282828',
                        borderRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: { color: '#fff' }
                        }
                    },
                    scales: {
                        y: {
                            stacked: true,
                            beginAtZero: true,
                            max: 100,
                            grid: {
                                color: '#282828'
                            },
                            ticks: {
                                color: '#fff',
                                callback: function(value) {
                                    return value + '%';
                                }
                            }
                        },
                        x: {
                            stacked: true,
                            grid: {
                                display: false
                            },
                            ticks: {
                                color: '#fff'
                            }
                        }
                    }
                }
            });
        }
    }

    function initializeActivityFeed() {
        const activityList = document.querySelector('.activity-list');
        if (!activityList) return;

        const activities = [
            {
                icon: 'user-plus',
                text: 'New employee Sarah Johnson started onboarding process',
                time: '2 minutes ago',
                type: 'onboarding'
            },
            {
                icon: 'file-alt',
                text: 'IT Policy document updated by Admin',
                time: '15 minutes ago',
                type: 'document'
            },
            {
                icon: 'check-circle',
                text: 'Equipment setup completed for Mark Wilson',
                time: '1 hour ago',
                type: 'task'
            },
            {
                icon: 'calendar',
                text: 'Team introduction meeting scheduled for new hires',
                time: '2 hours ago',
                type: 'event'
            }
        ];

        activities.forEach((activity, index) => {
            setTimeout(() => {
                const activityItem = document.createElement('div');
                activityItem.className = 'activity-item';
                activityItem.innerHTML = `
                    <i class="fas fa-${activity.icon}"></i>
                    <div class="activity-content">
                        <p>${activity.text}</p>
                        <span class="activity-time">${activity.time}</span>
                    </div>
                `;
                activityList.appendChild(activityItem);
                
                // Trigger animation
                requestAnimationFrame(() => {
                    activityItem.style.opacity = '1';
                    activityItem.style.transform = 'translateX(0)';
                });
            }, index * 300);
        });
    }

    function initializeSidebar() {
        const navLinks = document.querySelectorAll('.sidebar a');
        
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                if (this.getAttribute('href') === 'index.html') return;
                
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                
                // Update active states
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                
                // Load section content
                loadSectionContent(targetId);

                // Close sidebar on mobile after navigation
                if (window.innerWidth <= 1024) {
                    const sidebar = document.querySelector('.sidebar');
                    const mainContent = document.querySelector('.main-content');
                    sidebar.classList.remove('active');
                    mainContent.classList.remove('sidebar-active');
                }
            });
        });
    }

    function initializeDynamicContent() {
        // Initialize search functionality
        initializeSearch();
        
        // Initialize notifications
        initializeNotifications();
        
        // Initialize task management 
        initializeTaskManagement();
        
        // Initialize document management
        initializeDocumentManagement();
        
        // Initialize tab navigation
        initializeTabNavigation();
        
        // Initialize compliance verification
        initializeComplianceVerification();
        
        // Initialize onboarding approvals
        initializeOnboardingApprovals();
        
        // Initialize onboarding tracker
        initializeOnboardingTracker();
        
        // Load real employee data
        loadEmployeeData();
    }

    function loadSectionContent(sectionId) {
        const sections = document.querySelectorAll('.dashboard-section');
        
        sections.forEach(section => {
            section.style.display = 'none';
            section.classList.remove('active');
        });
        
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
            // Trigger animation after display change
            requestAnimationFrame(() => {
                targetSection.classList.add('active');
            });
        }
    }

    function initializeSearch() {
        const searchInputs = document.querySelectorAll('input[type="search"]');
        searchInputs.forEach(input => {
            input.addEventListener('input', debounce(function(e) {
                const searchTerm = e.target.value.toLowerCase();
                const tableBody = input.closest('.dashboard-section').querySelector('tbody');
                if (!tableBody) return;

                const rows = tableBody.querySelectorAll('tr');
                rows.forEach(row => {
                    const text = row.textContent.toLowerCase();
                    const shouldShow = text.includes(searchTerm);
                    row.style.display = shouldShow ? '' : 'none';
                    
                    // Animate row visibility
                    row.style.opacity = shouldShow ? '1' : '0';
                    row.style.transform = shouldShow ? 'translateX(0)' : 'translateX(-20px)';
                });
            }, 300));
        });
    }

    function initializeNotifications() {
        console.log('Initializing notification center');
        
        // Get notification list container
        const notificationList = document.getElementById('notificationList');
        if (!notificationList) return;
        
        // Load notifications
        loadNotifications();
        
        // Filter buttons
        const filterButtons = document.querySelectorAll('#notifications .filter-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all buttons
                filterButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                this.classList.add('active');
                
                // Filter notifications based on button text
                const filter = this.textContent.trim().toLowerCase();
                loadNotifications(filter);
            });
        });
    }

    function addNotification(message) {
        // This function is now disabled
        console.log('Notification suppressed:', message);
        // No notifications will be displayed
    }

    function initializeTaskManagement() {
        const taskLists = document.querySelectorAll('.task-list');
        const addTaskBtn = document.getElementById('add-task-btn');
        const taskForm = document.getElementById('task-form');
        const taskModal = document.getElementById('task-modal');
        
        // Add event listener for the Add Task button
        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', function() {
                // Reset form fields
                if (taskForm) {
                    taskForm.reset();
                    document.getElementById('task-id').value = '';
                    document.getElementById('task-modal-title').textContent = 'Add New Task';
                }
                
                // Show the task modal
                if (taskModal) {
                    taskModal.style.display = 'block';
                }
                
                // Load employees for the assignee dropdown
                loadEmployeesForTaskAssignment();
            });
        }
        
        // Add event listener for the task form submission
        if (taskForm) {
            taskForm.addEventListener('submit', handleTaskFormSubmit);
        }
        
        // Add event listeners for modal close buttons
        const closeButtons = document.querySelectorAll('.close-modal');
        closeButtons.forEach(button => {
            button.addEventListener('click', function() {
                if (taskModal) {
                    taskModal.style.display = 'none';
                }
            });
        });
        
        // Load tasks
        loadTasks();
        
        // Check if Sortable is defined
        if (typeof Sortable === 'undefined') {
            console.warn('Sortable library not loaded. Task drag and drop disabled.');
            return;
        }
        
        taskLists.forEach(list => {
            try {
            new Sortable(list, {
                group: 'tasks',
                animation: 150,
                ghostClass: 'task-ghost',
                chosenClass: 'task-chosen',
                dragClass: 'task-drag',
                onEnd: function(evt) {
                    const item = evt.item;
                    const from = evt.from;
                    const to = evt.to;
                    
                        // Safely access task status and title elements
                        const statusElement = item.querySelector('.task-status');
                        const titleElement = item.querySelector('.task-title');
                        
                        if (statusElement && to) {
                    // Update task status based on new column
                    const status = to.id.replace('-tasks', '');
                            statusElement.textContent = status;
                    
                    // Add success notification
                            const title = titleElement ? titleElement.textContent : 'Task';
                            addNotification(`Task "${title}" moved to ${status}`);
                        }
                }
            });
            } catch (error) {
                console.error('Error initializing Sortable:', error);
            }
        });
    }

    function initializeDocumentManagement() {
        const uploadBtn = document.querySelector('.add-btn');
        const documentFilter = document.querySelector('.document-filters select');

        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => {
                showModal('Upload Document Template', `
                    <form id="upload-document-form">
                        <div class="form-group">
                            <label>Template Name</label>
                            <input type="text" required placeholder="Enter template name">
                        </div>
                        <div class="form-group">
                            <label>Document Type</label>
                            <select required>
                                <option value="">Select type</option>
                                <option value="onboarding">Onboarding</option>
                                <option value="policy">Policy</option>
                                <option value="contract">Contract</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Upload File</label>
                            <input type="file" required>
                        </div>
                        <button type="submit" class="submit-btn">Upload Template</button>
                    </form>
                `);
            });
        }

        if (documentFilter) {
            documentFilter.addEventListener('change', function() {
                const status = this.value;
                const rows = document.querySelectorAll('.document-table tbody tr');
                
                rows.forEach(row => {
                    const rowStatus = row.querySelector('.status').textContent;
                    const shouldShow = status === 'All Documents' || rowStatus === status;
                    
                    // Animate row visibility
                    row.style.opacity = shouldShow ? '1' : '0';
                    row.style.transform = shouldShow ? 'translateX(0)' : 'translateX(-20px)';
                    setTimeout(() => {
                        row.style.display = shouldShow ? '' : 'none';
                    }, 300);
                });
            });
        }
    }

    function showModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('visible'), 50);

        const closeBtn = modal.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('visible');
            setTimeout(() => modal.remove(), 300);
        });

        // Close modal on outside click
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                modal.classList.remove('visible');
                setTimeout(() => modal.remove(), 300);
            }
        });
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function initializeTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        if (tabButtons.length > 0) {
            tabButtons.forEach(button => {
                button.addEventListener('click', () => {
                    // Remove active class from all buttons and contents
                    tabButtons.forEach(btn => btn.classList.remove('active'));
                    tabContents.forEach(content => content.classList.remove('active'));
                    
                    // Add active class to clicked button
                    button.classList.add('active');
                    
                    // Show corresponding tab content
                    const tabId = button.dataset.tab;
                    const tabContent = document.getElementById(tabId);
                    if (tabContent) {
                        tabContent.classList.add('active');
                    }
                });
            });
        }
    }
    
    function initializeComplianceVerification() {
        // Get all verification and rejection buttons
        const verifyButtons = document.querySelectorAll('.verify-compliance');
        const rejectButtons = document.querySelectorAll('.reject-compliance');
        const addComplianceBtn = document.getElementById('add-compliance-btn');
        const complianceTable = document.querySelector('#compliance-verification .data-table tbody');

        // Load compliance items from API
        loadComplianceItems();

        // Function to load compliance items from API
        async function loadComplianceItems() {
            try {
                // Show loading state
                if (complianceTable) {
                    complianceTable.innerHTML = `
                        <tr>
                            <td colspan="6" class="text-center">
                                <div class="loading-spinner"></div>
                                <p>Loading compliance items...</p>
                            </td>
                        </tr>
                    `;
                }

                // Instead of trying to fetch from an API that might not exist,
                // let's use mock data instead for demonstration purposes
                const mockComplianceItems = [
                    {
                        id: "comp123",
                        employeeName: "Sarah Johnson",
                        employeeId: "emp001",
                        department: "Marketing",
                        type: "NDA Document",
                        submittedDate: "2024-03-15",
                        status: "pending"
                    },
                    {
                        id: "comp124",
                        employeeName: "Michael Chen",
                        employeeId: "emp002",
                        department: "Engineering",
                        type: "Tax Documentation",
                        submittedDate: "2024-03-14",
                        status: "pending"
                    },
                    {
                        id: "comp125",
                        employeeName: "Lisa Kim",
                        employeeId: "emp003",
                        department: "Design",
                        type: "Equipment Agreement",
                        submittedDate: "2024-03-16",
                        status: "verified"
                    }
                ];

                // Simulate API request delay
                await new Promise(resolve => setTimeout(resolve, 500));

                // Render mock compliance items
                renderComplianceItems(mockComplianceItems);
            } catch (error) {
                console.error('Error loading compliance items:', error);
                if (complianceTable) {
                    complianceTable.innerHTML = `
                        <tr>
                            <td colspan="6" class="text-center">
                                <p class="error-message">Error loading compliance items. Please try again.</p>
                            </td>
                        </tr>
                    `;
                }
            }
        }

        // Function to render compliance items
        function renderComplianceItems(items) {
            if (!complianceTable) return;

            complianceTable.innerHTML = '';

            items.forEach(item => {
                const statusClass = getStatusClass(item.status);
                const statusText = getStatusText(item.status);
                
                // Format date
                const submittedDate = new Date(item.submittedDate).toLocaleDateString();
                
                // Create row
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.employeeName}</td>
                    <td>${item.department}</td>
                    <td>${item.type}</td>
                    <td>${submittedDate}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td class="actions">
                        ${generateActionButtons(item)}
                    </td>
                `;
                
                // Add to table
                complianceTable.appendChild(row);
            });

            // Reattach event listeners
            attachActionListeners();
        }

        // Helper function to get status class
        function getStatusClass(status) {
            switch (status) {
                case 'pending': return 'warning';
                case 'completed': return 'active';
                case 'overdue': return 'danger';
                case 'in-progress': return 'info';
                default: return 'warning';
            }
        }

        // Helper function to get status text
        function getStatusText(status) {
            switch (status) {
                case 'pending': return 'Pending Verification';
                case 'completed': return 'Verified';
                case 'overdue': return 'Overdue';
                case 'in-progress': return 'In Progress';
                default: return 'Pending';
            }
        }

        // Helper function to generate action buttons
        function generateActionButtons(item) {
            if (item.status === 'completed') {
                return `<button class="action-btn" title="View Document" data-id="${item.id}"><i class="fas fa-eye"></i></button>`;
            }
            
            return `
                <button class="action-btn verify-compliance" data-task-id="${item.id}" title="Verify"><i class="fas fa-check"></i></button>
                <button class="action-btn reject-compliance" data-task-id="${item.id}" title="Reject"><i class="fas fa-times"></i></button>
                <button class="action-btn" title="View Document" data-id="${item.id}"><i class="fas fa-eye"></i></button>
            `;
        }

        // Function to attach event listeners to action buttons
        function attachActionListeners() {
            const verifyButtons = document.querySelectorAll('.verify-compliance');
            const rejectButtons = document.querySelectorAll('.reject-compliance');
            
            // Add event listeners to verify buttons
            verifyButtons.forEach(button => {
                button.addEventListener('click', handleVerify);
            });
            
            // Add event listeners to reject buttons
            rejectButtons.forEach(button => {
                button.addEventListener('click', handleReject);
            });
        }

        // Function to handle verify button click
        async function handleVerify() {
            const taskId = this.dataset.taskId;
            const row = this.closest('tr');
            const statusCell = row.querySelector('.status-badge');
            
            try {
                // Show loading state
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                this.disabled = true;
                
                // Call API to update compliance item
                await compliance.updateComplianceItem(taskId, {
                    status: 'completed'
                });
                
                // Update UI
                statusCell.textContent = 'Verified';
                statusCell.className = 'status-badge active';
                
                // Remove action buttons except view
                const actionCell = row.querySelector('td:last-child');
                const viewButton = actionCell.querySelector('[title="View Document"]');
                actionCell.innerHTML = '';
                actionCell.appendChild(viewButton);
                
                // Show notification
                addNotification(`Compliance item has been verified successfully`);
            } catch (error) {
                console.error('Error verifying compliance item:', error);
                addNotification('Error verifying compliance item', 'error');
                
                // Reset button
                this.innerHTML = '<i class="fas fa-check"></i>';
                this.disabled = false;
            }
        }
        
        // Function to handle reject button click
        function handleReject() {
            const taskId = this.dataset.taskId;
            const row = this.closest('tr');
            const statusCell = row.querySelector('.status-badge');
            
            // Show rejection modal
            showModal('Reject Compliance Item', `
                <form id="reject-form">
                    <div class="form-group">
                        <label>Reason for Rejection</label>
                        <textarea required placeholder="Please provide details..."></textarea>
                    </div>
                    <div class="form-group">
                        <label>Action Required</label>
                        <input type="text" required placeholder="What needs to be fixed?">
                    </div>
                    <button type="submit" class="submit-btn" id="confirm-reject" data-task-id="${taskId}">Submit Rejection</button>
                </form>
            `);
            
            // Add event listener to the form submission
            const confirmRejectBtn = document.getElementById('confirm-reject');
            if (confirmRejectBtn) {
                confirmRejectBtn.addEventListener('click', async function(e) {
                    e.preventDefault();
                    
                    const reason = document.querySelector('#reject-form textarea').value;
                    const feedback = document.querySelector('#reject-form input').value;
                    
                    if (!reason || !feedback) {
                        alert('Please fill in all fields');
                        return;
                    }
                    
                    try {
                        // Show loading state
                        this.innerHTML = 'Processing...';
                        this.disabled = true;
                        
                        // Call API to update compliance item
                        await compliance.updateComplianceItem(taskId, {
                            status: 'overdue',
                            notes: `Rejected: ${reason}. Action required: ${feedback}`
                        });
                        
                        // Update UI
                        statusCell.textContent = 'Rejected';
                        statusCell.className = 'status-badge danger';
                        
                        // Close the modal
                        const modal = this.closest('.modal');
                        modal.classList.remove('visible');
                        setTimeout(() => modal.remove(), 300);
                        
                        // Show notification
                        addNotification(`Compliance item has been rejected`);
                    } catch (error) {
                        console.error('Error rejecting compliance item:', error);
                        addNotification('Error rejecting compliance item', 'error');
                        
                        // Reset button
                        this.innerHTML = 'Submit Rejection';
                        this.disabled = false;
                    }
                });
            }
        }
        
        if (addComplianceBtn) {
            addComplianceBtn.addEventListener('click', function() {
                showModal('Add New Compliance Item', `
                    <form id="add-compliance-form">
                        <div class="form-group">
                            <label>Employee</label>
                            <select required id="employee-select">
                                <option value="">Select Employee</option>
                                <!-- Will be populated from API -->
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Compliance Type</label>
                            <select required name="complianceType">
                                <option value="">Select Type</option>
                                <option value="nda">Non-Disclosure Agreement</option>
                                <option value="i9">I-9 Form</option>
                                <option value="background-check">Background Check</option>
                                <option value="tax-form">Tax Documentation</option>
                                <option value="policy-acknowledgment">Company Policy Acknowledgment</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Title</label>
                            <input type="text" required name="title" placeholder="Compliance item title">
                        </div>
                        <div class="form-group">
                            <label>Description</label>
                            <textarea name="description" placeholder="Additional details about this compliance item..."></textarea>
                        </div>
                        <div class="form-group">
                            <label>Due Date</label>
                            <input type="date" required name="dueDate">
                        </div>
                        <div class="form-group">
                            <label>Document (Optional)</label>
                            <input type="file" name="document">
                        </div>
                        <button type="submit" class="submit-btn">Create Compliance Item</button>
                    </form>
                `);
                
                // Fetch employees for the dropdown
                fetchEmployees();
                
                // Add event listener to form submission
                const form = document.getElementById('add-compliance-form');
                if (form) {
                    form.addEventListener('submit', handleComplianceSubmit);
                }
            });
            
            // Function to fetch employees
            async function fetchEmployees() {
                try {
                    const employeeSelect = document.getElementById('employee-select');
                    if (!employeeSelect) return;
                    
                    // Show loading state
                    employeeSelect.innerHTML = '<option value="">Loading employees...</option>';
                    
                    // Fetch employees
                    const response = await employees.getEmployees();
                    
                    // Clear loading state
                    employeeSelect.innerHTML = '<option value="">Select Employee</option>';
                    
                    // Add employees to dropdown
                    response.data.forEach(employee => {
                        const option = document.createElement('option');
                        option.value = employee._id;
                        option.textContent = `${employee.fullName} - ${employee.department || 'No Department'}`;
                        employeeSelect.appendChild(option);
                    });
                } catch (error) {
                    console.error('Error fetching employees:', error);
                    const employeeSelect = document.getElementById('employee-select');
                    if (employeeSelect) {
                        employeeSelect.innerHTML = '<option value="">Error loading employees</option>';
                    }
                }
            }
            
            // Function to handle compliance form submission
            async function handleComplianceSubmit(e) {
                e.preventDefault();
                
                const form = this;
                const submitBtn = form.querySelector('.submit-btn');
                
                try {
                    // Show loading state
                    submitBtn.textContent = 'Creating...';
                    submitBtn.disabled = true;
                    
                    // Get form data
                    const formData = new FormData(form);
                    const employeeId = document.getElementById('employee-select').value;
                    
                    if (!employeeId) {
                        alert('Please select an employee');
                        submitBtn.textContent = 'Create Compliance Item';
                        submitBtn.disabled = false;
                        return;
                    }
                    
                    // Add employee ID to form data
                    formData.append('assignedTo', employeeId);
                    
                    // Create compliance item
                    await compliance.createComplianceItem(Object.fromEntries(formData));
                    
                    // Close modal
                    const modal = form.closest('.modal');
                    modal.classList.remove('visible');
                    setTimeout(() => modal.remove(), 300);
                    
                    // Show notification
                    addNotification('New compliance item created successfully');
                    
                    // Reload compliance items
                    loadComplianceItems();
                } catch (error) {
                    console.error('Error creating compliance item:', error);
                    alert('Error creating compliance item: ' + (error.message || 'Unknown error'));
                    
                    // Reset button
                    submitBtn.textContent = 'Create Compliance Item';
                    submitBtn.disabled = false;
                }
            }
        }
    }

    // Initialize onboarding approvals
    initializeOnboardingApprovals();

    /**
     * Initialize the offboarding management section
     */
    function initializeOffboardingManagement() {
        console.log('Initializing offboarding management...');
        
        // Try to load offboarding processes from API
        loadOffboardingKanbanBoard();
        
        // Add event listener for new offboarding button
        const newOffboardingBtn = document.querySelector('#offboarding .add-btn');
        if (newOffboardingBtn) {
            newOffboardingBtn.addEventListener('click', showNewOffboardingModal);
        }
        
        // Initialize search functionality
        const searchInput = document.querySelector('#offboarding .action-bar input[type="search"]');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase();
                const offboardingItems = document.querySelectorAll('#offboarding .kanban-item');
                
                offboardingItems.forEach(item => {
                    const employeeName = item.querySelector('h4').textContent.toLowerCase();
                    const position = item.querySelector('p').textContent.toLowerCase();
                    
                    if (employeeName.includes(searchTerm) || position.includes(searchTerm)) {
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        }
    }

    /**
     * Load offboarding processes for the kanban board
     */
    async function loadOffboardingKanbanBoard() {
        console.log('Loading offboarding kanban board...');
        
        // Show loading state
        const kanbanColumns = document.querySelectorAll('#offboarding .kanban-items');
        kanbanColumns.forEach(column => {
            column.innerHTML = '<div class="loading-spinner"></div><p>Loading offboarding processes...</p>';
        });
        
        try {
            // Fetch offboarding processes from API
            const response = await fetch('/api/offboarding-processes/kanban/board', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch offboarding processes');
            }
            
            const data = await response.json();
            console.log('Offboarding processes loaded:', data);
            
            // Get the column elements
            const initiatedColumn = document.querySelector('#offboarding .kanban-column:nth-child(1) .kanban-items');
            const inProgressColumn = document.querySelector('#offboarding .kanban-column:nth-child(2) .kanban-items');
            const completedColumn = document.querySelector('#offboarding .kanban-column:nth-child(3) .kanban-items');
            
            // Populate the columns with the processes
            populateOffboardingColumn(initiatedColumn, data.data.initiated);
            populateOffboardingColumn(inProgressColumn, data.data.in_progress);
            populateOffboardingColumn(completedColumn, data.data.completed);
            
            // Initialize drag and drop
            initializeOffboardingDragAndDrop();
        } catch (error) {
            console.error('Error loading offboarding kanban board:', error);
            
            // Show error message in columns
            const kanbanColumns = document.querySelectorAll('#offboarding .kanban-items');
            kanbanColumns.forEach(column => {
                column.innerHTML = `<p class="error-message">Error loading offboarding processes: ${error.message}</p>`;
            });
            
            // Load sample data as fallback
            loadSampleOffboardingData();
        }
    }

    /**
     * Populate an offboarding kanban column with process items
     */
    function populateOffboardingColumn(column, processes) {
        if (!processes || processes.length === 0) {
            column.innerHTML = '<p class="empty-message">No processes in this status</p>';
            return;
        }
        
        processes.forEach(process => {
            const employee = process.employee || {};
            const tasks = process.tasks || [];
            
            // Create kanban item
            const item = document.createElement('div');
            item.className = 'kanban-item';
            item.dataset.id = process._id;
            
            // Create employee info
            const name = document.createElement('h4');
            name.textContent = employee.name || 'Unknown Employee';
            
            const position = document.createElement('p');
            position.textContent = employee.position || 'Unknown Position';
            
            const date = document.createElement('span');
            date.className = 'date';
            if (process.status === 'completed') {
                date.textContent = `Completed: ${formatDate(process.keyDates?.completedDate || new Date())}`;
            } else {
                date.textContent = `Last Day: ${formatDate(process.exitDate || new Date())}`;
            }
            
            // Create checklist for tasks
            const checklist = document.createElement('div');
            checklist.className = 'checklist';
            
            // Add first two tasks to the checklist
            const displayTasks = tasks.slice(0, 2);
            displayTasks.forEach(task => {
                const checklistItem = document.createElement('div');
                checklistItem.className = `checklist-item${task.status === 'completed' ? ' completed' : ''}`;
                
                const icon = document.createElement('i');
                icon.className = task.status === 'completed' ? 'fas fa-check' : 'fas fa-clock';
                
                const span = document.createElement('span');
                span.textContent = task.title;
                
                checklistItem.appendChild(icon);
                checklistItem.appendChild(span);
                checklist.appendChild(checklistItem);
            });
            
            // Show progress bar for completed items
            if (process.status === 'completed') {
                const progressBar = document.createElement('div');
                progressBar.className = 'task-progress';
                
                const progressFill = document.createElement('div');
                progressFill.className = 'progress-bar';
                progressFill.style.width = '100%';
                
                progressBar.appendChild(progressFill);
                item.appendChild(name);
                item.appendChild(position);
                item.appendChild(date);
                item.appendChild(progressBar);
            } else {
                item.appendChild(name);
                item.appendChild(position);
                item.appendChild(date);
                item.appendChild(checklist);
            }
            
            // Add view/edit button
            const actionButton = document.createElement('button');
            actionButton.className = 'kanban-item-action';
            actionButton.innerHTML = '<i class="fas fa-ellipsis-v"></i>';
            actionButton.addEventListener('click', () => viewOffboardingProcess(process._id));
            
            item.appendChild(actionButton);
            column.appendChild(item);
        });
    }

    /**
     * Initialize drag and drop for offboarding kanban board
     */
    function initializeOffboardingDragAndDrop() {
        // Get all kanban columns
        const columns = document.querySelectorAll('#offboarding .kanban-items');
        
        // Initialize Sortable for each column
        columns.forEach((column, index) => {
            new Sortable(column, {
                group: 'offboardingProcesses',
                animation: 150,
                ghostClass: 'kanban-item-ghost',
                chosenClass: 'kanban-item-chosen',
                dragClass: 'kanban-item-drag',
                onEnd: function(evt) {
                    const processId = evt.item.dataset.id;
                    const newStatus = getStatusFromColumnIndex(index);
                    
                    // Update status on the server
                    updateOffboardingStatus(processId, newStatus);
                }
            });
        });
    }

    /**
     * Get status string from column index
     */
    function getStatusFromColumnIndex(index) {
        switch(index) {
            case 0: return 'initiated';
            case 1: return 'in_progress';
            case 2: return 'completed';
            default: return 'initiated';
        }
    }

    /**
     * Update offboarding process status
     */
    async function updateOffboardingStatus(processId, status) {
        try {
            // Show loading notification
            showNotification('Updating Status', 'Updating offboarding process status...', 'info');
            
            // Update via API
            const response = await fetch(`/api/offboarding-processes/${processId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update status');
            }
            
            const data = await response.json();
            console.log('Status updated successfully:', data);
            
            // Show success notification
            showNotification('Status Updated', `Offboarding process status changed to ${status.replace('_', ' ')}`, 'success');
            
            // If the process is completed, we should reload the kanban board after a short delay
            if (status === 'completed') {
                setTimeout(() => {
                    loadOffboardingKanbanBoard();
                }, 2000);
            }
        } catch (error) {
            console.error('Error updating offboarding status:', error);
            showNotification('Error', `Failed to update status: ${error.message}`, 'error');
            
            // Force reload of the kanban board to reset the UI state
            loadOffboardingKanbanBoard();
        }
    }

    /**
     * Show modal to create a new offboarding process
     */
    function showNewOffboardingModal() {
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'new-offboarding-modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-user-minus"></i> Start New Offboarding</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="offboarding-employee">Employee:</label>
                        <select id="offboarding-employee" required>
                            <option value="">Select an employee</option>
                            <!-- Will be populated from API -->
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="offboarding-reason">Reason:</label>
                        <select id="offboarding-reason" required>
                            <option value="">Select a reason</option>
                            <option value="new-opportunity">New Opportunity</option>
                            <option value="relocation">Relocation</option>
                            <option value="retirement">Retirement</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="offboarding-exit-date">Exit Date:</label>
                        <input type="date" id="offboarding-exit-date" required>
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="create-offboarding-btn" class="btn primary-btn">
                        <i class="fas fa-plus"></i> Create Offboarding Process
                    </button>
                    <button class="btn cancel-btn close-modal">Cancel</button>
                </div>
            </div>
        `;
        
        // Add modal to the page
        document.body.appendChild(modal);
        
        // Show modal
        setTimeout(() => {
            modal.classList.add('show');
            
            // Load active employees
            loadActiveEmployees();
            
            // Add event listeners
            const closeButtons = modal.querySelectorAll('.close-modal');
            closeButtons.forEach(button => {
                button.addEventListener('click', () => {
                    modal.classList.remove('show');
                    setTimeout(() => modal.remove(), 300);
                });
            });
            
            // Add create button event listener
            const createButton = modal.querySelector('#create-offboarding-btn');
            createButton.addEventListener('click', createOffboardingProcess);
            
        }, 100);
    }

    /**
     * Load active employees for the offboarding dropdown
     */
    async function loadActiveEmployees() {
        try {
            const response = await fetch('/api/users?isActive=true', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to load employees');
            }
            
            const { data } = await response.json();
            
            // Populate dropdown
            const dropdown = document.getElementById('offboarding-employee');
            if (dropdown) {
                data.forEach(employee => {
                    const option = document.createElement('option');
                    option.value = employee._id;
                    option.textContent = `${employee.name} - ${employee.position || employee.department || ''}`;
                    dropdown.appendChild(option);
                });
            }
            
        } catch (error) {
            console.error('Error loading employees:', error);
            showNotification('Error', `Failed to load employees: ${error.message}`, 'error');
        }
    }

    /**
     * Create a new offboarding process
     */
    async function createOffboardingProcess() {
        // Get form values
        const employeeId = document.getElementById('offboarding-employee').value;
        const reason = document.getElementById('offboarding-reason').value;
        const exitDate = document.getElementById('offboarding-exit-date').value;
        
        // Validate form
        if (!employeeId || !reason || !exitDate) {
            showNotification('Error', 'Please fill in all fields', 'error');
            return;
        }
        
        try {
            // Show loading state
            const button = document.getElementById('create-offboarding-btn');
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
            
            // Create offboarding process
            const response = await fetch('/api/offboarding-processes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    employeeId,
                    reason,
                    exitDate
                })
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to create offboarding process');
            }
            
            // Show success notification
            showNotification('Success', 'Offboarding process created successfully', 'success');
            
            // Close modal
            const modal = document.getElementById('new-offboarding-modal');
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
            
            // Reload kanban board
            loadOffboardingKanbanBoard();
            
        } catch (error) {
            console.error('Error creating offboarding process:', error);
            showNotification('Error', `Failed to create offboarding process: ${error.message}`, 'error');
            
            // Reset button
            const button = document.getElementById('create-offboarding-btn');
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-plus"></i> Create Offboarding Process';
        }
    }

    /**
     * View offboarding process details
     */
    async function viewOffboardingProcess(processId) {
        try {
            // Show loading notification
            showNotification('Loading', 'Fetching offboarding process details...', 'info');
            
            // Fetch process details
            const response = await fetch(`/api/offboarding-processes/${processId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch offboarding process details');
            }
            
            const { data: process } = await response.json();
            
            // Create modal with process details
            createOffboardingDetailsModal(process);
            
        } catch (error) {
            console.error('Error viewing offboarding process:', error);
            showNotification('Error', `Failed to load offboarding details: ${error.message}`, 'error');
        }
    }

    /**
     * Create a modal with offboarding process details
     */
    function createOffboardingDetailsModal(process) {
        const employee = process.employee || {};
        const tasks = process.tasks || [];
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'offboarding-details-modal';
        
        // Format dates
        const exitDate = formatDate(process.exitDate);
        const createdDate = formatDate(process.keyDates?.created);
        const completedDate = process.keyDates?.completedDate ? formatDate(process.keyDates.completedDate) : 'Not completed';
        
        // Get status badge class
        const statusClass = getStatusClass(process.status);
        const statusText = getStatusText(process.status);
        
        // Create task list HTML
        const tasksHtml = tasks.map((task, index) => {
            const taskStatusClass = task.status === 'completed' ? 'success' : 
                                   task.status === 'in_progress' ? 'warning' : 'danger';
            
            return `
                <div class="task-item">
                    <div class="task-details">
                        <h4>${task.title}</h4>
                        <span class="status-badge ${taskStatusClass}">${task.status.replace('_', ' ')}</span>
                    </div>
                    <div class="task-actions">
                        ${task.status !== 'completed' ? 
                            `<button class="action-btn complete-task-btn" data-task-index="${index}">
                                <i class="fas fa-check"></i> Mark Complete
                            </button>` : 
                            `<button class="action-btn reset-task-btn" data-task-index="${index}">
                                <i class="fas fa-undo"></i> Reset
                            </button>`
                        }
                    </div>
                </div>
            `;
        }).join('');
        
        // Generate assets list HTML
        const assetsHtml = (process.companyAssetsReturned || [])
            .filter(asset => asset.returnStatus !== 'not_applicable')
            .map(asset => {
                const statusBadgeClass = 
                    asset.returnStatus === 'returned' ? 'success' : 
                    asset.returnStatus === 'pending' ? 'warning' : 'danger';
                
                return `
                    <div class="asset-item">
                        <div class="asset-name">${asset.assetName}</div>
                        <div class="asset-status">
                            <span class="status-badge ${statusBadgeClass}">${asset.returnStatus}</span>
                        </div>
                    </div>
                `;
            }).join('') || '<p>No assets to return</p>';
        
        // Determine which action buttons to show based on status
        let actionButtonsHtml = '';
        if (process.status !== 'completed') {
            actionButtonsHtml = `
                <button id="complete-offboarding-btn" class="btn primary-btn" data-id="${process._id}">
                    <i class="fas fa-check-circle"></i> Complete Offboarding
                </button>
            `;
        }
        
        modal.innerHTML = `
            <div class="modal-content wider-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-user-minus"></i> Offboarding Details</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="offboarding-details-grid">
                        <div class="details-section">
                            <h4>Employee Information</h4>
                            <div class="details-row">
                                <strong>Name:</strong> <span>${employee.name || 'Unknown'}</span>
                            </div>
                            <div class="details-row">
                                <strong>Position:</strong> <span>${employee.position || 'Unknown'}</span>
                            </div>
                            <div class="details-row">
                                <strong>Department:</strong> <span>${employee.department || 'Unknown'}</span>
                            </div>
                            <div class="details-row">
                                <strong>Exit Date:</strong> <span>${exitDate}</span>
                            </div>
                            <div class="details-row">
                                <strong>Status:</strong> <span class="status-badge ${statusClass}">${statusText}</span>
                            </div>
                            <div class="details-row">
                                <strong>Reason:</strong> <span>${formatReason(process.reason)}</span>
                            </div>
                            <div class="details-row">
                                <strong>Process Started:</strong> <span>${createdDate}</span>
                            </div>
                            <div class="details-row">
                                <strong>Process Completed:</strong> <span>${completedDate}</span>
                            </div>
                        </div>
                        
                        <div class="details-section">
                            <h4>Tasks & Progress</h4>
                            <div class="progress-container">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${process.progress?.percentComplete || 0}%"></div>
                                </div>
                                <div class="progress-text">${process.progress?.percentComplete || 0}% Complete</div>
                            </div>
                            
                            <div class="tasks-container">
                                ${tasksHtml || '<p>No tasks found</p>'}
                            </div>
                        </div>
                        
                        <div class="details-section">
                            <h4>Asset Return</h4>
                            <div class="assets-container">
                                ${assetsHtml}
                            </div>
                        </div>
                        
                        ${process.feedback ? `
                            <div class="details-section full-width">
                                <h4>Exit Feedback</h4>
                                <div class="feedback-box">
                                    <p>${process.feedback}</p>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="modal-footer">
                    ${actionButtonsHtml}
                    <button class="btn secondary-btn close-modal">Close</button>
                </div>
            </div>
        `;
        
        // Add modal to page
        document.body.appendChild(modal);
        
        // Show modal
        setTimeout(() => {
            modal.classList.add('show');
            
            // Add event listeners
            const closeButtons = modal.querySelectorAll('.close-modal');
            closeButtons.forEach(button => {
                button.addEventListener('click', () => {
                    modal.classList.remove('show');
                    setTimeout(() => modal.remove(), 300);
                });
            });
            
            // Add task action buttons
            const completeTaskButtons = modal.querySelectorAll('.complete-task-btn');
            completeTaskButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const taskIndex = button.dataset.taskIndex;
                    updateOffboardingTaskStatus(process._id, taskIndex, 'completed');
                });
            });
            
            const resetTaskButtons = modal.querySelectorAll('.reset-task-btn');
            resetTaskButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const taskIndex = button.dataset.taskIndex;
                    updateOffboardingTaskStatus(process._id, taskIndex, 'not_started');
                });
            });
            
            // Add complete offboarding button
            const completeOffboardingBtn = modal.querySelector('#complete-offboarding-btn');
            if (completeOffboardingBtn) {
                completeOffboardingBtn.addEventListener('click', () => {
                    const processId = completeOffboardingBtn.dataset.id;
                    completeOffboardingProcess(processId);
                });
            }
            
        }, 100);
    }

    /**
     * Update task status for an offboarding process
     */
    async function updateOffboardingTaskStatus(processId, taskIndex, status) {
        try {
            // Show loading notification
            showNotification('Updating', 'Updating task status...', 'info');
            
            // Update task status
            const response = await fetch(`/api/offboarding-processes/${processId}/tasks/${taskIndex}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status })
            });
            
            if (!response.ok) {
                throw new Error('Failed to update task status');
            }
            
            // Show success notification
            showNotification('Success', 'Task status updated successfully', 'success');
            
            // Close and reopen the modal to refresh data
            const modal = document.getElementById('offboarding-details-modal');
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
                viewOffboardingProcess(processId);
            }, 300);
            
            // Reload kanban board in the background
            loadOffboardingKanbanBoard();
            
        } catch (error) {
            console.error('Error updating task status:', error);
            showNotification('Error', `Failed to update task status: ${error.message}`, 'error');
        }
    }

    /**
     * Complete an offboarding process
     */
    async function completeOffboardingProcess(processId) {
        if (!confirm('Are you sure you want to complete this offboarding process? This will deactivate the employee account.')) {
            return;
        }
        
        try {
            // Show loading notification
            showNotification('Processing', 'Completing offboarding process...', 'info');
            
            // Update process status
            const response = await fetch(`/api/offboarding-processes/${processId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status: 'completed' })
            });
            
            if (!response.ok) {
                throw new Error('Failed to complete offboarding process');
            }
            
            // Show success notification
            showNotification('Success', 'Offboarding process completed successfully', 'success');
            
            // Close the modal
            const modal = document.getElementById('offboarding-details-modal');
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
            
            // Reload kanban board
            loadOffboardingKanbanBoard();
            
        } catch (error) {
            console.error('Error completing offboarding process:', error);
            showNotification('Error', `Failed to complete offboarding process: ${error.message}`, 'error');
        }
    }

    /**
     * Format reason string for display
     */
    function formatReason(reason) {
        if (!reason) return 'Unknown';
        
        // Convert from slug to readable format
        return reason
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Load sample offboarding data for demonstration
     */
    function loadSampleOffboardingData() {
        console.log('Loading sample offboarding data...');
        
        // Sample data structure matching API response format
        const sampleData = {
            initiated: [
                {
                    _id: 'sample-1',
                    employee: {
                        name: 'Emily Brown',
                        position: 'Sales Executive'
                    },
                    exitDate: new Date('2024-04-15'),
                    reason: 'new-opportunity',
                    status: 'initiated',
                    tasks: [
                        { title: 'Exit Interview', status: 'not_started' },
                        { title: 'Asset Return', status: 'not_started' }
                    ]
                }
            ],
            in_progress: [
                {
                    _id: 'sample-2',
                    employee: {
                        name: 'John Smith',
                        position: 'IT Specialist'
                    },
                    exitDate: new Date('2024-04-01'),
                    reason: 'relocation',
                    status: 'in_progress',
                    tasks: [
                        { title: 'Knowledge Transfer', status: 'completed' },
                        { title: 'System Access Review', status: 'completed' },
                        { title: 'Exit Interview', status: 'not_started' }
                    ]
                }
            ],
            completed: [
                {
                    _id: 'sample-3',
                    employee: {
                        name: 'Lisa Anderson',
                        position: 'HR Manager'
                    },
                    exitDate: new Date('2024-03-30'),
                    reason: 'retirement',
                    status: 'completed',
                    tasks: [
                        { title: 'Exit Interview', status: 'completed' },
                        { title: 'Asset Return', status: 'completed' },
                        { title: 'Knowledge Transfer', status: 'completed' }
                    ]
                }
            ]
        };
        
        // Get the column elements
        const initiatedColumn = document.querySelector('#offboarding .kanban-column:nth-child(1) .kanban-items');
        const inProgressColumn = document.querySelector('#offboarding .kanban-column:nth-child(2) .kanban-items');
        const completedColumn = document.querySelector('#offboarding .kanban-column:nth-child(3) .kanban-items');
        
        // Populate the columns with the sample data
        populateOffboardingColumn(initiatedColumn, sampleData.initiated);
        populateOffboardingColumn(inProgressColumn, sampleData.in_progress);
        populateOffboardingColumn(completedColumn, sampleData.completed);
        
        // Initialize drag and drop
        initializeOffboardingDragAndDrop();
    }

    async function loadEmployeeData() {
        const employeeTable = document.querySelector('#employees tbody');
        if (!employeeTable) return;

        try {
            // Show loading state
            employeeTable.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">
                        <div class="loading-spinner"></div>
                        <p>Loading employees...</p>
                    </td>
                </tr>
            `;

            // Get user data for logging only
            const userData = api.auth.getUserData();
            console.log('Current user role:', userData?.role);
            
            // Fetch employees from API - don't include role parameter
            const response = await fetch('/api/employees', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch employees: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Employee data response:', data);
            
            // Clear loading state
            employeeTable.innerHTML = '';

            // Check if there are employees
            if (!data.employees && !data.data) {
                employeeTable.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center">
                            <p>No employees found</p>
                        </td>
                    </tr>
                `;
                return;
            }

            // Support both response formats
            const employees = data.employees || data.data || [];
            
            // Render each employee
            employees.forEach(employee => {
                const row = document.createElement('tr');
                
                // Format status and date
                const statusClass = getStatusClass(employee.onboarding?.status || 'active');
                const statusText = getStatusText(employee.onboarding?.status || 'active');
                const startDate = new Date(employee.startDate || Date.now()).toLocaleDateString();
                
                row.innerHTML = `
                    <td>${employee.name || `${employee.firstName || ''} ${employee.lastName || ''}`}</td>
                    <td>${employee.department?.name || employee.department || 'Not assigned'}</td>
                    <td>${employee.position || 'Not assigned'}</td>
                    <td>${startDate}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td class="actions">
                        <button class="action-btn edit-employee" data-id="${employee._id}" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-employee" data-id="${employee._id}" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                
                employeeTable.appendChild(row);
            });

            // Add event listeners to buttons
            const editButtons = document.querySelectorAll('.edit-employee');
            editButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const employeeId = this.dataset.id;
                    editEmployee(employeeId);
                });
            });

            const deleteButtons = document.querySelectorAll('.delete-employee');
            deleteButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const employeeId = this.dataset.id;
                    if (confirm('Are you sure you want to delete this employee?')) {
                        deleteEmployee(employeeId);
                    }
                });
            });

        } catch (error) {
            console.error('Error loading employees:', error);
            employeeTable.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">
                        <p class="error-message">Error loading employees: ${error.message}</p>
                    </td>
                </tr>
            `;
        }
    }

    // Helper function to get status class
    function getStatusClass(status) {
        switch (status) {
            case 'onboarding': return 'warning';
            case 'active': return 'success';
            case 'offboarding': return 'danger';
            default: return 'info';
        }
    }

    // Helper function to get status text
    function getStatusText(status) {
        switch (status) {
            case 'onboarding': return 'Onboarding';
            case 'active': return 'Active';
            case 'offboarding': return 'Offboarding';
            default: return status.charAt(0).toUpperCase() + status.slice(1);
        }
    }

    // Function to edit an employee
    async function editEmployee(employeeId) {
        try {
            // Fetch employee details
            const response = await fetch(`/api/employees/${employeeId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch employee details');
            }

            const { data: employee } = await response.json();

            // Show edit modal
            showModal('Edit Employee', `
                <form id="edit-employee-form">
                    <input type="hidden" id="employee-id" value="${employee._id}">
                    <div class="form-group">
                        <label for="employee-name">Name</label>
                        <input type="text" id="employee-name" value="${employee.name || `${employee.firstName} ${employee.lastName}`}" required>
                    </div>
                    <div class="form-group">
                        <label for="employee-email">Email</label>
                        <input type="email" id="employee-email" value="${employee.email}" required>
                    </div>
                    <div class="form-group">
                        <label for="employee-department">Department</label>
                        <input type="text" id="employee-department" value="${employee.department || ''}">
                    </div>
                    <div class="form-group">
                        <label for="employee-position">Position</label>
                        <input type="text" id="employee-position" value="${employee.position || ''}">
                    </div>
                    <div class="form-group">
                        <label for="employee-status">Status</label>
                        <select id="employee-status">
                            <option value="onboarding" ${employee.onboarding?.status === 'onboarding' ? 'selected' : ''}>Onboarding</option>
                            <option value="active" ${employee.onboarding?.status === 'active' ? 'selected' : ''}>Active</option>
                            <option value="offboarding" ${employee.onboarding?.status === 'offboarding' ? 'selected' : ''}>Offboarding</option>
                        </select>
                    </div>
                    <button type="submit" class="btn primary-btn">Update Employee</button>
                </form>
            `);

            // Add event listener to form
            const form = document.getElementById('edit-employee-form');
            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                try {
                    const id = document.getElementById('employee-id').value;
                    const name = document.getElementById('employee-name').value;
                    const email = document.getElementById('employee-email').value;
                    const department = document.getElementById('employee-department').value;
                    const position = document.getElementById('employee-position').value;
                    const status = document.getElementById('employee-status').value;
                    
                    // Update employee
                    const updateResponse = await fetch(`/api/employees/${id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({
                            name,
                            email,
                            department,
                            position,
                            onboarding: { status }
                        })
                    });
                    
                    if (!updateResponse.ok) {
                        throw new Error('Failed to update employee');
                    }
                    
                    // Close modal
                    const modal = document.querySelector('.modal');
                    modal.classList.remove('show');
                    setTimeout(() => modal.remove(), 300);
                    
                    // Show notification
                    showNotification('Employee updated successfully', 'success');
                    
                    // Reload employee data
                    loadEmployeeData();
                    
                } catch (error) {
                    console.error('Error updating employee:', error);
                    showNotification(`Error updating employee: ${error.message}`, 'error');
                }
            });
            
        } catch (error) {
            console.error('Error editing employee:', error);
            showNotification(`Error fetching employee details: ${error.message}`, 'error');
        }
    }

    // Function to delete an employee
    async function deleteEmployee(employeeId) {
        try {
            const response = await fetch(`/api/users/${employeeId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete employee');
            }
            
            showNotification('Employee deleted successfully', 'success');
            
            // Reload employee data
            loadEmployeeData();
            
        } catch (error) {
            console.error('Error deleting employee:', error);
            showNotification(`Error deleting employee: ${error.message}`, 'error');
        }
    }

    // Function to add a new employee
    function addEmployee() {
        showModal('Add New Employee', `
            <form id="add-employee-form">
                <div class="form-group">
                    <label for="new-employee-first-name">First Name</label>
                    <input type="text" id="new-employee-first-name" required>
                </div>
                <div class="form-group">
                    <label for="new-employee-last-name">Last Name</label>
                    <input type="text" id="new-employee-last-name" required>
                </div>
                <div class="form-group">
                    <label for="new-employee-email">Email</label>
                    <input type="email" id="new-employee-email" required>
                </div>
                <div class="form-group">
                    <label for="new-employee-department">Department</label>
                    <input type="text" id="new-employee-department">
                </div>
                <div class="form-group">
                    <label for="new-employee-position">Position</label>
                    <input type="text" id="new-employee-position">
                </div>
                <div class="form-group">
                    <label for="new-employee-start-date">Start Date</label>
                    <input type="date" id="new-employee-start-date" required>
                </div>
                <button type="submit" class="btn primary-btn">Add Employee</button>
            </form>
        `);
        
        // Add event listener to form
        const form = document.getElementById('add-employee-form');
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            try {
                const firstName = document.getElementById('new-employee-first-name').value;
                const lastName = document.getElementById('new-employee-last-name').value;
                const email = document.getElementById('new-employee-email').value;
                const department = document.getElementById('new-employee-department').value;
                const position = document.getElementById('new-employee-position').value;
                const startDate = document.getElementById('new-employee-start-date').value;
                
                // Create employee
                const response = await fetch('/api/users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        firstName,
                        lastName,
                        email,
                        department,
                        position,
                        startDate,
                        role: 'employee',
                        password: 'changeme123' // Default password
                    })
                });
                
                if (!response.ok) {
                    throw new Error('Failed to create employee');
                }
                
                // Close modal
                const modal = document.querySelector('.modal');
                modal.classList.remove('show');
                setTimeout(() => modal.remove(), 300);
                
                // Show notification
                showNotification('Employee added successfully', 'success');
                
                // Reload employee data
                loadEmployeeData();
                
            } catch (error) {
                console.error('Error adding employee:', error);
                showNotification(`Error: ${error.message}`, 'error');
            }
        });
    }

    // Add event listener to Add Employee button
    const addEmployeeBtn = document.querySelector('#employees .add-btn');
    if (addEmployeeBtn) {
        addEmployeeBtn.addEventListener('click', addEmployee);
    }
    
    // Load employee data initially
    loadEmployeeData();

    // Initialize admin dashboard
    document.addEventListener('DOMContentLoaded', function() {
        checkAuthentication();
        
        initializeSidebar();
        initializeDynamicContent();
        initializeUserData();
        initializeMobileMenu();
        updateDateTime();
        
        // Initialize section functionality
        initializeDashboardCharts();
        initializeTaskManagement();
        initializeDocumentManagement();
        initializeTabNavigation();
        initializeComplianceVerification();
        initializeOnboardingApprovals();
        initializeOnboardingTracker();
        initializeOffboardingManagement();
        
        // Initialize activity feed
        initializeActivityFeed();
    });

    // Initialize system after DOM loaded
    document.addEventListener('DOMContentLoaded', function() {
        // Check if user is authenticated
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/index.html';
            return;
        }

        // Your existing code...
        
        // Initialize Communication Directory
        initializeCommunication();
        
        // Your existing code...
    });

    /**
     * Initialize the communication section
     */
    async function initializeCommunication() {
        console.log('Initializing communication features...');
        
        // Load contacts for all sections
        loadEmployeeContacts();
        console.log('Loading HR and IT department contacts...');
        loadDepartmentContacts('hr');
        loadDepartmentContacts('it');
        
        // Setup employee contact dropdown change event
        const employeeDropdown = document.getElementById('employee-contact-list');
        if (employeeDropdown) {
            employeeDropdown.addEventListener('change', function() {
                const employeeId = this.value;
                displaySelectedEmployeeInfo(employeeId);
            });
        }
        
        // Toggle message panels for each contact type
        setupMessagePanelToggles();
        
        // Setup refresh button for contacts
        const refreshButton = document.querySelector('.communication-refresh-btn');
        if (refreshButton) {
            refreshButton.addEventListener('click', function() {
                refreshContacts();
            });
        }
        
        // Load users for message dropdowns
        loadUsersForDropdown('employees');
        loadUsersForDropdown('hr');
        loadUsersForDropdown('it');
        
        // Setup send message buttons
        setupSendMessageButtons();
    }

    /**
     * Setup the toggle functionality for message panels
     */
    function setupMessagePanelToggles() {
        // Get all communication items
        const commItems = document.querySelectorAll('.communication-item');
        
        commItems.forEach(item => {
            // Get the message button for this item
            const messageBtn = item.querySelector('.message-btn');
            if (!messageBtn) return;
            
            // Get the item type from the data attribute
            const itemType = messageBtn.getAttribute('data-type');
            if (!itemType) return;
            
            // Get the corresponding message panel
            const messagePanel = document.getElementById(`${itemType}-message-panel`);
            if (!messagePanel) return;
            
            // Add click event listener to toggle the message panel
            messageBtn.addEventListener('click', function() {
                // Hide all message panels first
                document.querySelectorAll('.message-panel').forEach(panel => {
                    panel.style.display = 'none';
                });
                
                // Show this message panel
                messagePanel.style.display = 'block';
                
                // Highlight the active communication item
                commItems.forEach(ci => ci.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }

    /**
     * Load employee contacts into the dropdown
     */
    async function loadEmployeeContacts() {
        const contactSelect = document.getElementById('employee-contact-list');
        if (!contactSelect) return;
        
        try {
            // Fetch all employees
            const response = await fetch('/api/users/directory/employees', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch employees');
            }
            
            const result = await response.json();
            const employees = result.data || [];
            
            // Filter out HR department staff (already visible in HR section)
            const filteredEmployees = employees.filter(emp => 
                (emp.department || '').toUpperCase() !== 'HR'
            );
            
            // Clear existing options except the first one
            while (contactSelect.options.length > 1) {
                contactSelect.remove(1);
            }
            
            // Add options for each employee
            if (filteredEmployees.length === 0) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No employees found';
                option.disabled = true;
                contactSelect.appendChild(option);
            } else {
                filteredEmployees.forEach(employee => {
                    const option = document.createElement('option');
                    option.value = employee._id;
                    option.textContent = employee.name;
                    option.setAttribute('data-email', employee.email || '');
                    option.setAttribute('data-position', employee.position || '');
                    option.setAttribute('data-department', employee.department || '');
                    contactSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading employee contacts:', error);
            contactSelect.innerHTML = '<option value="">Error loading employees</option>';
        }
    }

    /**
     * Display the selected employee's information
     */
    async function displaySelectedEmployeeInfo(employeeId) {
        const infoContainer = document.getElementById('selected-employee-info');
        if (!infoContainer) return;
        
        if (!employeeId) {
            infoContainer.innerHTML = '<p>Select an employee from the dropdown to view their contact details.</p>';
            return;
        }
        
        // Show loading state
        infoContainer.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Loading employee information...</p>';
        
        try {
            // Get the selected option data attributes
            const selectElement = document.getElementById('employee-contact-list');
            const selectedOption = selectElement.options[selectElement.selectedIndex];
            
            const name = selectedOption.text;
            const email = selectedOption.getAttribute('data-email');
            const position = selectedOption.getAttribute('data-position');
            const department = selectedOption.getAttribute('data-department');
            
            // Update info container with user details
            infoContainer.innerHTML = `
                <div class="contact-name">${name}</div>
                ${position ? `<div class="contact-role">${position}</div>` : ''}
                ${department ? `<div class="contact-department">${department}</div>` : ''}
                <p><i class="fas fa-envelope"></i> <a href="mailto:${email}">${email}</a></p>
            `;
        } catch (error) {
            console.error('Error displaying employee info:', error);
            infoContainer.innerHTML = '<p>Error loading employee information. Please try again.</p>';
        }
    }

    /**
     * Load department contacts (HR or IT)
     */
    async function loadDepartmentContacts(department) {
        const departmentId = department.toLowerCase();
        const dropdownId = `${departmentId}-contact-list`;
        const infoContainerId = `selected-${departmentId}-info`;
        
        console.log(`Attempting to load ${departmentId.toUpperCase()} department contacts...`);
        
        const dropdown = document.getElementById(dropdownId);
        const infoContainer = document.getElementById(infoContainerId);
        
        if (!dropdown || !infoContainer) {
            console.warn(`Dropdown ${dropdownId} or info container ${infoContainerId} not found for ${departmentId.toUpperCase()} department`);
            return;
        }
        
        try {
            // Fetch all users
            const response = await fetch('/api/users/directory/employees', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch employees');
            }
            
            const result = await response.json();
            const allUsers = result.data || [];
            
            // Filter users based on department
            let users = [];
            
            if (departmentId === 'hr') {
                // Filter for HR staff only
                users = allUsers.filter(user => 
                    (user.department || '').toUpperCase() === 'HR'
                );
                console.log(`Filtered ${allUsers.length} users to ${users.length} HR staff members`);
            } else if (departmentId === 'it') {
                // Filter for IT administrators specifically
                users = allUsers.filter(user => {
                    // Get department
                    const dept = (user.department || '').toUpperCase();
                    
                    // Check position for IT admin role
                    const pos = (user.position || '').toLowerCase();
                    const isAdmin = pos.includes('admin') || 
                                   pos.includes('support') || 
                                   pos.includes('specialist') || 
                                   pos.includes('tech') || 
                                   pos.includes('manager') ||
                                   pos.includes('helpdesk') ||
                                   pos.includes('developer');
                               
                    // Only include IT administrators           
                    return dept === 'IT' && isAdmin;
                });
                console.log(`Filtered ${allUsers.length} users to ${users.length} IT administrators`);
            }
            
            if (!users || users.length === 0) {
                console.log(`No ${departmentId.toUpperCase()} staff found, showing default message`);
                
                // For IT section, if no IT admins found, add a default IT admin
                if (departmentId === 'it') {
                    // Add a default IT admin
                    const option = document.createElement('option');
                    option.value = "it-admin";
                    option.text = "IT Administrator";
                    option.setAttribute('data-email', 'it-support@company.com');
                    option.setAttribute('data-position', 'IT Support Specialist');
                    dropdown.appendChild(option);
                    
                    // Select this option by default
                    dropdown.selectedIndex = 0;
                    
                    // Update info container with default IT admin details
                    infoContainer.innerHTML = `
                        <div class="contact-name">IT Administrator</div>
                        <div class="contact-role">IT Support Specialist</div>
                        <div class="contact-department">IT Department</div>
                        <p><i class="fas fa-envelope"></i> <a href="mailto:it-support@company.com">it-support@company.com</a></p>
                    `;
                    
                    return;
                }
                
                // For HR section, add a default HR contact if none found
                if (departmentId === 'hr') {
                    // Add a default HR admin
                    const option = document.createElement('option');
                    option.value = "hr-admin";
                    option.text = "HR Administrator";
                    option.setAttribute('data-email', 'hr@company.com');
                    option.setAttribute('data-position', 'HR Manager');
                    dropdown.appendChild(option);
                    
                    // Select this option by default
                    dropdown.selectedIndex = 0;
                    
                    // Update info container with default HR admin details
                    infoContainer.innerHTML = `
                        <div class="contact-name">HR Administrator</div>
                        <div class="contact-role">HR Manager</div>
                        <div class="contact-department">HR Department</div>
                        <p><i class="fas fa-envelope"></i> <a href="mailto:hr@company.com">hr@company.com</a></p>
                    `;
                    
                    return;
                }
                
                // If no default added, show a message
                infoContainer.innerHTML = `<p>No ${departmentId.toUpperCase()} staff contacts available.</p>`;
                return;
            }
            
            console.log(`Found ${users.length} ${departmentId.toUpperCase()} staff members`);
            
            // Clear existing dropdown options (except the first one)
            while (dropdown.options.length > 1) {
                dropdown.remove(1);
            }
            
            // Add each department contact to dropdown
            users.forEach(user => {
                console.log(`Adding ${departmentId.toUpperCase()} contact to dropdown: ${user.name}`);
                
                // Get user details
                const name = user.name || '';
                const position = user.position || '';
                const email = user.email || '';
                const userId = user._id || '';
                
                const option = document.createElement('option');
                option.value = userId;
                option.text = name;
                option.setAttribute('data-email', email);
                option.setAttribute('data-position', position);
                dropdown.appendChild(option);
            });
            
            // Add change event listener to the dropdown
            dropdown.addEventListener('change', function() {
                const selectedOption = this.options[this.selectedIndex];
                const userId = this.value;
                
                if (!userId) {
                    // No user selected, show default message
                    infoContainer.innerHTML = `<p>Select an ${departmentId.toUpperCase()} staff member from the dropdown to view their contact details.</p>`;
                    return;
                }
                
                const name = selectedOption.text;
                const email = selectedOption.getAttribute('data-email');
                const position = selectedOption.getAttribute('data-position');
                
                // Update info container with user details
                infoContainer.innerHTML = `
                    <div class="contact-name">${name}</div>
                    ${position ? `<div class="contact-role">${position}</div>` : ''}
                    <div class="contact-department">${departmentId.toUpperCase()} Department</div>
                    <p><i class="fas fa-envelope"></i> <a href="mailto:${email}">${email}</a></p>
                `;
            });
            
        } catch (error) {
            console.error(`Error loading ${departmentId.toUpperCase()} department contacts:`, error);
            infoContainer.innerHTML = `<p>Error loading ${departmentId.toUpperCase()} department contacts. Please try again.</p>`;
        }
    }

    /**
     * Load users for the message dropdown based on type
     * @param {string} type - Type of users to load (employees, hr, it)
     */
    async function loadUsersForDropdown(type) {
        const dropdownId = `${type}-select`;
        const dropdown = document.getElementById(dropdownId);
        if (!dropdown) return;
        
        try {
            // Clear existing options
            dropdown.innerHTML = '';
            
            // Add default option
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = `Select ${type === 'employees' ? 'an employee' : `a ${type.toUpperCase()} staff member`}`;
            defaultOption.selected = true;
            defaultOption.disabled = true;
            dropdown.appendChild(defaultOption);
            
            // Fetch all users
            const allUsers = await fetchUsers();
            let filteredUsers = [];
            
            // Filter users based on type
            if (type === 'employees') {
                // Show all employees except HR and IT
                filteredUsers = allUsers.filter(user => 
                    (user.department || '').toUpperCase() !== 'HR' && 
                    (user.department || '').toUpperCase() !== 'IT'
                );
            } else if (type === 'hr') {
                // Show only HR staff
                filteredUsers = allUsers.filter(user => 
                    (user.department || '').toUpperCase() === 'HR'
                );
            } else if (type === 'it') {
                // Show only IT staff
                filteredUsers = allUsers.filter(user => 
                    (user.department || '').toUpperCase() === 'IT'
                );
            }
            
            // Add users to dropdown
            if (filteredUsers.length === 0) {
                // If no users found, add a message
                const noUsersOption = document.createElement('option');
                noUsersOption.value = '';
                noUsersOption.textContent = `No ${type} found`;
                noUsersOption.disabled = true;
                dropdown.appendChild(noUsersOption);
                
                // For HR and IT, add default contacts if none found
                if (type === 'hr') {
                    const defaultHrOption = document.createElement('option');
                    defaultHrOption.value = 'hr@company.com';
                    defaultHrOption.textContent = 'HR Department';
                    dropdown.appendChild(defaultHrOption);
                } else if (type === 'it') {
                    const defaultItOption = document.createElement('option');
                    defaultItOption.value = 'it-support@company.com';
                    defaultItOption.textContent = 'IT Support';
                    dropdown.appendChild(defaultItOption);
                }
            } else {
                // Add each filtered user to the dropdown
                filteredUsers.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user.email || '';
                    option.textContent = user.name || '';
                    dropdown.appendChild(option);
                });
            }
        } catch (error) {
            console.error(`Error loading users for ${type} dropdown:`, error);
            // Add a fallback option
            const errorOption = document.createElement('option');
            errorOption.value = '';
            errorOption.textContent = 'Error loading contacts';
            errorOption.disabled = true;
            dropdown.appendChild(errorOption);
        }
    }

    /**
     * Setup the send message buttons for each contact type
     */
    function setupSendMessageButtons() {
        // Get all send message buttons
        const sendButtons = document.querySelectorAll('.send-message-btn');
        
        sendButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Get the type from the button's data attribute
                const type = this.getAttribute('data-type');
                if (!type) return;
                
                // Get the corresponding select and textarea
                const select = document.getElementById(`${type}-select`);
                const textarea = document.getElementById(`${type}-message`);
                
                if (!select || !textarea) return;
                
                // Get the selected contact email and message text
                const contactEmail = select.value;
                const messageText = textarea.value.trim();
                
                // Validate inputs
                if (!contactEmail) {
                    showToast('Please select a contact to message', 'error');
                    return;
                }
                
                if (!messageText) {
                    showToast('Please enter a message', 'error');
                    return;
                }
                
                // Send the message (in a real app, this would use an API)
                sendMessageToContact(contactEmail, messageText, type);
                
                // Clear the message textarea
                textarea.value = '';
            });
        });
    }

    /**
     * Send a message to a contact (this is a mock function)
     * @param {string} email - Contact email address
     * @param {string} message - Message text
     * @param {string} type - Type of contact (employees, hr, it)
     */
    function sendMessageToContact(email, message, type) {
        // In a real app, this would call an API to send the message
        console.log(`Sending message to ${type} contact:`, email, message);
        
        try {
            // For now, we'll open a mailto link
            const subject = `Message from HR Dashboard`;
            const body = message;
            
            // Create and open the mailto link
            const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.open(mailtoLink);
            
            // Show success message
            showToast(`Message to ${type === 'employees' ? 'employee' : `${type.toUpperCase()} staff`} prepared for sending`, 'success');
        } catch (error) {
            console.error('Error sending message:', error);
            showToast('Error sending message. Please try again.', 'error');
        }
    }

    /**
     * Refresh all contacts
     */
    function refreshContacts() {
        showToast('Refreshing contacts...', 'info');
        
        // Reload all contacts
        loadEmployeeContacts();
        loadDepartmentContacts('hr');
        loadDepartmentContacts('it');
        
        // Reload users for message dropdowns
        loadUsersForDropdown('employees');
        loadUsersForDropdown('hr');
        loadUsersForDropdown('it');
        
        showToast('Contacts refreshed', 'success');
    }

    /**
     * Fetch users from the API
     * @param {string} type - Optional type of users to fetch
     * @returns {Promise<Array>} Array of user objects
     */
    async function fetchUsers(type) {
        try {
            const endpoint = type === 'employees' ? '/api/users/directory/employees' : '/api/users/directory/employees';
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch users: ${response.status}`);
            }
            
            const result = await response.json();
            return result.data || [];
        } catch (error) {
            console.error('Error fetching users:', error);
            return [];
        }
    }
});

// Add CSS for timeline styling
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = `
        .timeline {
            position: relative;
            padding-left: 30px;
        }
        .timeline-item {
            position: relative;
            padding-bottom: 15px;
        }
        .timeline-marker {
            position: absolute;
            left: -30px;
            top: 0;
            width: 12px;
            height: 12px;
            border-radius: 50%;
        }
        .timeline-item:not(:last-child):before {
            content: '';
            position: absolute;
            left: -24px;
            top: 12px;
            height: calc(100% - 12px);
            width: 2px;
            background-color: #e9ecef;
        }
        .employee-card {
            transition: all 0.2s ease;
            border-left: 3px solid transparent;
        }
        .employee-card[data-status="not_started"] {
            border-left-color: #6c757d;
        }
        .employee-card[data-status="in_progress"] {
            border-left-color: #ffc107;
        }
        .employee-card[data-status="completed"] {
            border-left-color: #28a745;
        }
        .employee-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 .5rem 1rem rgba(0,0,0,.15) !important;
        }
        .dragging {
            opacity: 0.5;
        }
    `;
    document.head.appendChild(style);
});

// Add document template loading functionality
function loadDocumentTemplates() {
  // Show loading spinners in each template category
  document.querySelectorAll('.loading-templates').forEach(spinner => {
    spinner.style.display = 'flex';
  });
  document.querySelectorAll('.templates-container').forEach(container => {
    container.innerHTML = '';
  });

  // Get authentication token
  const token = localStorage.getItem('token');
  
  // Fetch templates from the API with proper authentication
  fetch('/api/documents?isTemplate=true', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to fetch templates: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('Templates data:', data); // Debug log
      // Hide all spinners
      document.querySelectorAll('.loading-templates').forEach(spinner => {
        spinner.style.display = 'none';
      });

      // Process templates
      if (data.success && data.data && data.data.length > 0) {
        const templates = data.data;
        
        // Group templates by category
        const onboardingTemplates = templates.filter(t => 
          t.category === 'Onboarding' || t.category === 'General' || 
          t.category === 'onboarding' || t.category === 'general');
          
        const hrTemplates = templates.filter(t => 
          t.category === 'HR' || t.category === 'Finance' || 
          t.category === 'hr' || t.category === 'finance');
          
        const legalTemplates = templates.filter(t => 
          t.category === 'Legal' || t.category === 'legal');
        
        // Render templates by category
        renderTemplates('toStart', onboardingTemplates);
        renderTemplates('inProgress', hrTemplates);
        renderTemplates('completed', legalTemplates);
      } else {
        // No templates found
        document.querySelectorAll('.templates-container').forEach(container => {
          container.innerHTML = '<div class="no-templates">No templates available</div>';
        });
      }
    })
    .catch(error => {
      console.error('Error loading templates:', error);
      document.querySelectorAll('.loading-templates').forEach(spinner => {
        spinner.style.display = 'none';
      });
      document.querySelectorAll('.templates-container').forEach(container => {
        container.innerHTML = `<div class="error-message">Failed to load templates: ${error.message}</div>`;
      });
    });
}

function renderTemplates(containerId, templates) {
  const container = document.querySelector(`#${containerId}`);
  if (!container) return;
  
  if (templates.length === 0) {
    container.innerHTML = '<div class="no-templates">No templates available</div>';
    return;
  }
  
  let html = '';
  templates.forEach(template => {
    html += createTemplateCard(template);
  });
  
  container.innerHTML = html;
  
  // Add event listeners to buttons
  templates.forEach(template => {
    const viewBtn = document.querySelector(`#view-${template._id}`);
    const downloadBtn = document.querySelector(`#download-${template._id}`);
    
    if (viewBtn) {
      viewBtn.addEventListener('click', () => viewTemplateDetails(template));
    }
    
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => downloadTemplate(template));
    }
  });
}

function createTemplateCard(template) {
  return `
    <div class="template-card">
      <div class="template-icon">
        <i class="${getTemplateIcon(template.documentType)}"></i>
      </div>
      <div class="template-info">
        <h3 class="template-title">${template.title}</h3>
        <p class="template-description">${template.description}</p>
        <div class="template-meta">
          <span class="document-type">${template.documentType}</span>
          <span class="document-category">${template.category}</span>
        </div>
      </div>
      <div class="template-actions">
        <button id="view-${template._id}" class="btn-circle btn-sm btn-outline-primary">
          <i class="fas fa-eye"></i>
        </button>
        <button id="download-${template._id}" class="btn-circle btn-sm btn-outline-success">
          <i class="fas fa-download"></i>
        </button>
      </div>
    </div>
  `;
}

function getTemplateIcon(documentType) {
  switch (documentType.toLowerCase()) {
    case 'policy':
      return 'fas fa-clipboard-list';
    case 'form':
      return 'fas fa-file-alt';
    case 'guide':
      return 'fas fa-book';
    case 'contract':
      return 'fas fa-file-signature';
    default:
      return 'fas fa-file';
  }
}

function viewTemplateDetails(template) {
  // Create and display modal with template details
  const modal = document.createElement('div');
  modal.className = 'modal fade';
  modal.id = 'templateDetailsModal';
  modal.setAttribute('tabindex', '-1');
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-labelledby', 'templateDetailsModalLabel');
  modal.setAttribute('aria-hidden', 'true');
  
  modal.innerHTML = `
    <div class="modal-dialog modal-lg" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="templateDetailsModalLabel">${template.title}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="template-details">
            <p><strong>Description:</strong> ${template.description}</p>
            <p><strong>Document Type:</strong> ${template.documentType}</p>
            <p><strong>Category:</strong> ${template.category}</p>
            <p><strong>Version:</strong> ${template.version || '1.0'}</p>
            <p><strong>Created by:</strong> ${template.createdBy ? template.createdBy.name : 'System'}</p>
            <p><strong>Last Updated:</strong> ${new Date(template.updatedAt || template.createdAt).toLocaleString()}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          <button type="button" class="btn btn-success download-btn">Download</button>
          <button type="button" class="btn btn-primary duplicate-btn">Duplicate</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Initialize Bootstrap modal
  const modalInstance = new bootstrap.Modal(modal);
  modalInstance.show();
  
  // Add event listeners to modal buttons
  document.querySelector('.download-btn').addEventListener('click', () => {
    downloadTemplate(template);
  });
  
  document.querySelector('.duplicate-btn').addEventListener('click', () => {
    duplicateTemplate(template);
  });
  
  // Clean up when the modal is hidden
  modal.addEventListener('hidden.bs.modal', function() {
    document.body.removeChild(modal);
  });
}

function downloadTemplate(template) {
  if (!template.file || !template.file.filePath) {
    alert('No file available for this template');
    return;
  }
  
  // Create a download link
  const a = document.createElement('a');
  a.href = `/uploads/${template.file.filePath}`;
  a.download = template.file.fileName || template.title;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function duplicateTemplate(template) {
  // TODO: Implement template duplication
  alert('Template duplication feature coming soon!');
}

// Add event listener to New Template button
document.addEventListener('DOMContentLoaded', function() {
  // Initialize templates
  loadDocumentTemplates();
  
  // Add event listener to New Template button
  const newTemplateBtn = document.getElementById('newTemplateBtn');
  if (newTemplateBtn) {
    console.log("Found New Template button, adding click handler");
    newTemplateBtn.addEventListener('click', function() {
      console.log('New Template button clicked');
      // Use the toggleTemplateForm function instead of trying to show a modal
      toggleTemplateForm();
    });
  } else {
    console.error("New Template button not found!");
  }
});

// Function to toggle template form visibility
function toggleTemplateForm() {
  const formSection = document.getElementById('templateFormSection');
  if (formSection) {
    if (formSection.style.display === 'none') {
      formSection.style.display = 'block';
    } else {
      formSection.style.display = 'none';
    }
  }
}

// Document ready event handler
document.addEventListener('DOMContentLoaded', function() {
  // Initialize templates
  loadDocumentTemplates();
  
  // Handle file selection - simpler approach
  const fileInput = document.getElementById('templateFile');
  if (fileInput) {
    fileInput.addEventListener('change', function() {
      console.log('File selected:', fileInput.files[0]?.name);
    });
  }
  
  // Template upload form submission
  const uploadTemplateBtn = document.getElementById('uploadTemplateBtn');
  if (uploadTemplateBtn) {
    uploadTemplateBtn.addEventListener('click', uploadTemplate);
  }
  
  // New Template button click handler
  const newTemplateBtn = document.getElementById('newTemplateBtn');
  if (newTemplateBtn) {
    newTemplateBtn.addEventListener('click', function() {
      console.log('New Template button clicked');
      toggleTemplateForm();
    });
  }
  
  // Cancel button in template form
  const cancelTemplateBtn = document.getElementById('cancelTemplateBtn');
  if (cancelTemplateBtn) {
    cancelTemplateBtn.addEventListener('click', function(e) {
      e.preventDefault();
      toggleTemplateForm();
    });
  }
});

// Function to show alerts
function showAlert(type, message) {
  // Create alert element
  const alertElement = document.createElement('div');
  alertElement.className = `alert alert-${type} alert-dismissible fade show`;
  alertElement.role = 'alert';
  alertElement.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  // Find alert container
  const alertContainer = document.getElementById('alertContainer');
  if (alertContainer) {
    // Add alert to container
    alertContainer.appendChild(alertElement);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      alertElement.classList.remove('show');
      setTimeout(() => alertElement.remove(), 300);
    }, 5000);
  } else {
    console.error('Alert container not found');
  }
}

// Template upload function
function uploadTemplate() {
  const title = document.getElementById('templateTitle').value.trim();
  const description = document.getElementById('templateDescription').value.trim();
  const documentType = document.getElementById('templateType').value;
  const category = document.getElementById('templateCategory').value;
  const tags = document.getElementById('templateTags').value.trim();
  const file = document.getElementById('templateFile').files[0];

  // Form validation
  if (!title || !description || !documentType || !category || !file) {
    showAlert('danger', 'Please fill in all required fields and upload a file.');
    return;
  }

  // File size check
  if (file.size > 5 * 1024 * 1024) {
    showAlert('danger', 'File is too large. Maximum size is 5MB.');
    return;
  }

  // Create FormData object
  const formData = new FormData();
  formData.append('title', title);
  formData.append('description', description);
  formData.append('documentType', documentType);
  formData.append('category', category);
  formData.append('isTemplate', 'true');
  
  if (tags) {
    // Convert comma-separated tags to array
    const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    formData.append('tags', JSON.stringify(tagsArray));
  }
  
  formData.append('file', file);

  // Show loading state
  const uploadBtn = document.getElementById('uploadTemplateBtn');
  uploadBtn.disabled = true;
  uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

  // Get auth token
  const token = localStorage.getItem('token');

  // Send API request
  fetch('/api/templates', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  })
  .then(response => {
    if (!response.ok) throw new Error('Failed to upload template');
    return response.json();
  })
  .then(data => {
    // Reset form
    document.getElementById('templateUploadForm').reset();
    
    // Hide form section
    toggleTemplateForm();
    
    // Show success message
    showAlert('success', 'Template uploaded successfully!');
    
    // Reload templates
    loadDocumentTemplates();
  })
  .catch(error => {
    console.error('Error uploading template:', error);
    showAlert('danger', 'Failed to upload template. Please try again.');
  })
  .finally(() => {
    // Reset button state
    uploadBtn.disabled = false;
    uploadBtn.innerHTML = 'Upload Template';
  });
}

// Function to load notifications
async function loadNotifications(filter = 'all') {
  const notificationList = document.getElementById('notificationList');
  if (!notificationList) return;
  
  // Show loading state
  notificationList.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading notifications...</div>';
  
  try {
    // Fetch notifications from API with filter
    let url = '/api/notifications';
    if (filter && filter !== 'all') {
      url += `?status=${filter === 'unread' ? 'unread' : 'all'}&priority=${filter === 'important' ? 'high' : 'all'}`;
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to load notifications');
    }
    
    const data = await response.json();
    
    // Also fetch feedback for HR dashboard
    let feedbackData = [];
    
    if (['hr_admin', 'admin'].includes(getUserRole())) {
      const feedbackResponse = await fetch('/api/feedback?status=pending', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (feedbackResponse.ok) {
        const feedbackResult = await feedbackResponse.json();
        feedbackData = feedbackResult.data || [];
      }
    }
    
    // Clear loading spinner
    notificationList.innerHTML = '';
    
    // Check if there are any notifications or feedback
    if (data.data.length === 0 && feedbackData.length === 0) {
      notificationList.innerHTML = '<div class="empty-state">No notifications to display</div>';
      return;
    }
    
    // Display notifications
    data.data.forEach(notification => {
      const notificationItem = createNotificationItem(notification);
      notificationList.appendChild(notificationItem);
    });
    
    // Display feedback as notifications
    feedbackData.forEach(feedback => {
      const feedbackItem = createFeedbackItem(feedback);
      notificationList.appendChild(feedbackItem);
    });
    
  } catch (error) {
    console.error('Error loading notifications:', error);
    notificationList.innerHTML = '<div class="error-message">Failed to load notifications</div>';
  }
}

// Function to create a notification item
function createNotificationItem(notification) {
  const notificationItem = document.createElement('div');
  notificationItem.className = `notification-item ${notification.status === 'unread' ? 'unread' : ''}`;
  notificationItem.dataset.id = notification._id;
  
  // Format date
  const date = new Date(notification.createdAt);
  const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  
  // Set icon based on notification type
  let icon = 'info-circle';
  if (notification.type === 'task') icon = 'tasks';
  if (notification.type === 'document') icon = 'file-alt';
  if (notification.type === 'feedback') icon = 'comment-dots';
  if (notification.type === 'system') icon = 'cogs';
  if (notification.priority === 'high') icon = 'exclamation-circle';
  
  notificationItem.innerHTML = `
    <div class="notification-icon">
      <i class="fas fa-${icon}"></i>
    </div>
    <div class="notification-content">
      <div class="notification-header">
        <h4>${notification.title}</h4>
        <span class="notification-time">${formattedDate}</span>
      </div>
      <p>${notification.message}</p>
    </div>
    <div class="notification-actions">
      <button class="notification-action mark-read" title="Mark as ${notification.status === 'unread' ? 'read' : 'unread'}">
        <i class="fas fa-${notification.status === 'unread' ? 'envelope-open' : 'envelope'}"></i>
      </button>
      <button class="notification-action delete-notification" title="Delete">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `;
  
  // Add event listeners for action buttons
  const markReadBtn = notificationItem.querySelector('.mark-read');
  const deleteBtn = notificationItem.querySelector('.delete-notification');
  
  markReadBtn.addEventListener('click', async () => {
    try {
      const response = await fetch(`/api/notifications/${notification._id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        // Toggle unread class
        notificationItem.classList.toggle('unread');
        // Update icon
        markReadBtn.innerHTML = `<i class="fas fa-${notification.status === 'unread' ? 'envelope' : 'envelope-open'}"></i>`;
        markReadBtn.title = `Mark as ${notification.status === 'unread' ? 'unread' : 'read'}`;
        
        // Update notification status in memory
        notification.status = notification.status === 'unread' ? 'read' : 'unread';
      }
    } catch (error) {
      console.error('Error updating notification status:', error);
    }
  });
  
  deleteBtn.addEventListener('click', async () => {
    try {
      const response = await fetch(`/api/notifications/${notification._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        // Remove notification item from DOM
        notificationItem.remove();
        
        // Show empty state if there are no more notifications
        const notificationList = document.getElementById('notificationList');
        if (notificationList && notificationList.children.length === 0) {
          notificationList.innerHTML = '<div class="empty-state">No notifications to display</div>';
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  });
  
  return notificationItem;
}

// Function to create a feedback item from feedback data
function createFeedbackItem(feedback) {
  const feedbackItem = document.createElement('div');
  feedbackItem.className = 'notification-item feedback';
  feedbackItem.dataset.id = feedback._id;
  feedbackItem.dataset.type = 'feedback';
  
  // Format date
  const date = new Date(feedback.date);
  const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  
  // Create star rating HTML
  const rating = parseInt(feedback.rating);
  let starsHtml = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= rating) {
      starsHtml += '<i class="fas fa-star"></i>';
    } else {
      starsHtml += '<i class="far fa-star"></i>';
    }
  }
  
  feedbackItem.innerHTML = `
    <div class="notification-icon">
      <i class="fas fa-comment-dots"></i>
    </div>
    <div class="notification-content">
      <div class="notification-header">
        <h4>Feedback from ${feedback.user.name}</h4>
        <span class="notification-time">${formattedDate}</span>
      </div>
      <div class="feedback-rating">${starsHtml}</div>
      <p class="feedback-category"><strong>Category:</strong> ${feedback.category}</p>
      <p class="feedback-text">${feedback.comments}</p>
    </div>
    <div class="notification-actions">
      <button class="notification-action respond-feedback" title="Respond">
        <i class="fas fa-reply"></i>
      </button>
    </div>
  `;
  
  // Add event listener for respond button
  const respondBtn = feedbackItem.querySelector('.respond-feedback');
  respondBtn.addEventListener('click', () => {
    showFeedbackResponseModal(feedback);
  });
  
  return feedbackItem;
}

// Function to show feedback response modal
function showFeedbackResponseModal(feedback) {
  // Create modal element
  const modal = document.createElement('div');
  modal.className = 'modal';
  
  // Create star rating HTML
  const rating = parseInt(feedback.rating);
  let starsHtml = '';
  for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
          starsHtml += '<i class="fas fa-star"></i>';
      } else {
          starsHtml += '<i class="far fa-star"></i>';
      }
  }
  
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2><i class="fas fa-reply"></i> Respond to Feedback</h2>
        <span class="close">&times;</span>
      </div>
      <div class="modal-body">
        <div class="feedback-details">
          <div class="detail-row">
            <span class="detail-label"><i class="fas fa-user"></i> From:</span>
            <span class="detail-value">${feedback.user.name} (${feedback.user.email})</span>
          </div>
          <div class="detail-row">
            <span class="detail-label"><i class="fas fa-building"></i> Department:</span>
            <span class="detail-value">${feedback.user.department || 'Not specified'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label"><i class="fas fa-calendar-check"></i> Date:</span>
            <span class="detail-value">${new Date(feedback.date).toLocaleString()}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label"><i class="fas fa-tag"></i> Category:</span>
            <span class="detail-value">${feedback.category}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label"><i class="fas fa-star"></i> Rating:</span>
            <span class="detail-value feedback-stars">${starsHtml}</span>
          </div>
        </div>
        
        <div class="details-section">
          <h4><i class="fas fa-quote-left"></i> Feedback Message</h4>
          <div class="feedback-message">
            <p>${feedback.comments}</p>
          </div>
        </div>
        
        <div class="response-form">
          <h4><i class="fas fa-paper-plane"></i> Your Response</h4>
          <div class="form-group">
            <label for="feedback-response">Message:</label>
            <textarea id="feedback-response" rows="4" placeholder="Enter your response to this feedback..."></textarea>
          </div>
          
          <div class="form-group">
            <label for="feedback-status"><i class="fas fa-tag"></i> Set Status:</label>
            <select id="feedback-status">
              <option value="reviewed">Reviewed</option>
              <option value="archived">Archive</option>
            </select>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary cancel-response">Cancel</button>
        <button class="btn-primary send-response"><i class="fas fa-paper-plane"></i> Send Response</button>
      </div>
    </div>
  `;
  
  // Add modal to body
  document.body.appendChild(modal);
  
  // Show modal with animation
  setTimeout(() => {
    modal.classList.add('visible');
  }, 10);
  
  // Add event listener to close button
  const closeButton = modal.querySelector('.close');
  const cancelButton = modal.querySelector('.cancel-response');
  
  closeButton.addEventListener('click', closeModal);
  cancelButton.addEventListener('click', closeModal);
  
  function closeModal() {
    modal.classList.remove('visible');
    setTimeout(() => {
      modal.remove();
    }, 300);
  }
  
  // Add event listener to send button
  const sendButton = modal.querySelector('.send-response');
  
  sendButton.addEventListener('click', async () => {
    const responseText = modal.querySelector('#feedback-response').value.trim();
    const status = modal.querySelector('#feedback-status').value;
    
    if (!responseText) {
      showNotification('Please enter a response message', 'error');
      return;
    }
    
    // Show loading state
    sendButton.disabled = true;
    sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    
    try {
      // Send response to API
      const response = await fetch(`/api/feedback/${feedback._id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          responseMessage: responseText,
          status: status
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send response');
      }
      
      // Show success notification
      showNotification('Response sent successfully', 'success');
      
      // Close modal
      closeModal();
      
      // Reload feedback list
      loadFeedback(document.getElementById('feedback-filter').value, 
                   document.getElementById('feedback-time-filter').value);
      
    } catch (error) {
      console.error('Error sending response:', error);
      showNotification(`Error: ${error.message}`, 'error');
      
      // Reset button state
      sendButton.disabled = false;
      sendButton.innerHTML = '<i class="fas fa-paper-plane"></i> Send Response';
    }
  });
}

// Function to get user role from local storage
function getUserRole() {
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  return userData.role || '';
}

/**
 * Show a toast notification message
 * @param {string} message - The message to display
 * @param {string} type - The type of toast (success, error, info)
 */
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    // Add toast to container
    toastContainer.appendChild(toast);
    
    // Remove toast after a delay
    setTimeout(() => {
        toast.classList.add('toast-out');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Function to load and display feedback
async function loadFeedback(filter = 'all', timeFilter = 'all') {
    const feedbackList = document.getElementById('feedback-list');
    const loadingElement = document.querySelector('.loading-feedback');
    const emptyElement = document.querySelector('.empty-feedback-list');
    
    if (!feedbackList) return;
    
    // Show loading, hide empty state
    loadingElement.style.display = 'flex';
    emptyElement.style.display = 'none';
    feedbackList.innerHTML = '';
    
    try {
        // Build query parameters
        let queryParams = '';
        
        if (filter !== 'all') {
            queryParams += `status=${filter}&`;
        }
        
        // Add time filter
        if (timeFilter !== 'all') {
            const now = new Date();
            let startDate = new Date();
            
            if (timeFilter === '7days') {
                startDate.setDate(now.getDate() - 7);
            } else if (timeFilter === '30days') {
                startDate.setDate(now.getDate() - 30);
            }
            
            queryParams += `startDate=${startDate.toISOString()}&`;
        }
        
        // Fetch feedback from API
        const response = await fetch(`/api/feedback?${queryParams}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load feedback');
        }
        
        const data = await response.json();
        const feedbackItems = data.data || [];
        
        // Hide loading
        loadingElement.style.display = 'none';
        
        // Check if there are any feedback items
        if (feedbackItems.length === 0) {
            emptyElement.style.display = 'block';
            // Clear details panel when no items
            const detailsContainer = document.getElementById('feedback-details-container');
            if (detailsContainer) {
                detailsContainer.innerHTML = `
                    <div class="empty-selection">
                        <i class="fas fa-comment-dots feedback-icon"></i>
                        <p>No feedback items available</p>
                    </div>
                `;
            }
            return;
        }
        
        // Display feedback items
        feedbackItems.forEach((feedback, index) => {
            const feedbackItem = createFeedbackItem(feedback);
            feedbackList.appendChild(feedbackItem);
            
            // Auto-select the first item if none is selected
            if (index === 0) {
                setTimeout(() => {
                    // Dispatch a click event on the first item to show its details
                    feedbackItem.click();
                }, 100);
            }
        });
    } catch (error) {
        console.error('Error loading feedback:', error);
        loadingElement.style.display = 'none';
        emptyElement.style.display = 'block';
        emptyElement.innerHTML = `<p>Error loading feedback: ${error.message}</p>`;
    }
}

// Create a feedback item element
function createFeedbackItem(feedback) {
    const item = document.createElement('div');
    item.className = 'feedback-item';
    item.dataset.id = feedback._id;
    
    // Format date
    const feedbackDate = new Date(feedback.date);
    const formattedDate = feedbackDate.toLocaleDateString();
    
    // Get employee name
    const employeeName = feedback.user ? feedback.user.name : 'Unknown Employee';
    
    // Create star rating HTML
    const rating = parseInt(feedback.rating);
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            starsHtml += '<i class="fas fa-star"></i>';
        } else {
            starsHtml += '<i class="far fa-star"></i>';
        }
    }
    
    // Set status class and appropriate icon
    const statusClass = `status-${feedback.status || 'pending'}`;
    const statusIcon = feedback.status === 'reviewed' ? 'check-circle' : 
                      (feedback.status === 'archived' ? 'archive' : 'clock');
    
    item.innerHTML = `
        <div class="feedback-header">
            <div class="feedback-rating">${starsHtml}</div>
            <div class="feedback-date"><i class="far fa-calendar-alt"></i> ${formattedDate}</div>
        </div>
        <div class="feedback-body">
            <p class="feedback-employee"><i class="fas fa-user"></i> ${employeeName}</p>
            <p class="feedback-preview">${feedback.comments.substring(0, 60)}${feedback.comments.length > 60 ? '...' : ''}</p>
        </div>
        <div class="feedback-footer">
            <span class="feedback-category">${feedback.category}</span>
            <span class="feedback-status ${statusClass}">
                <i class="fas fa-${statusIcon}"></i> ${feedback.status || 'pending'}
            </span>
        </div>
    `;
    
    // Add click event to show feedback details - using onclick to ensure it's not overridden
    item.onclick = function(e) {
        e.preventDefault(); // Prevent any default action
        e.stopPropagation(); // Stop event from bubbling up
        
        console.log('Feedback item clicked, ID:', feedback._id);
        
        // Show visual feedback that item was clicked
        document.querySelectorAll('.feedback-item').forEach(el => {
            el.classList.remove('selected');
        });
        item.classList.add('selected');
        
        // Display the feedback details
        showFeedbackDetails(feedback);
        
        return false; // Prevent default behavior
    };
    
    return item;
}

// Show feedback details
function showFeedbackDetails(feedback) {
    console.log('Showing feedback details for ID:', feedback._id);
    
    const detailsContainer = document.getElementById('feedback-details-container');
    if (!detailsContainer) {
        console.error('Details container not found!');
        return;
    }
    
    try {
        // Format dates
        const submittedDate = new Date(feedback.date).toLocaleString();
        const expiryDate = new Date(feedback.expiryDate).toLocaleDateString();
        const reviewedDate = feedback.reviewedAt ? new Date(feedback.reviewedAt).toLocaleString() : 'N/A';
        
        // Get employee and reviewer names
        const employeeName = feedback.user ? feedback.user.name : 'Unknown Employee';
        const employeeDepartment = feedback.user ? feedback.user.department : 'Unknown';
        const reviewerName = feedback.reviewedBy ? feedback.reviewedBy.name : 'N/A';
        
        // Create star rating HTML
        const rating = parseInt(feedback.rating);
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                starsHtml += '<i class="fas fa-star"></i>';
            } else {
                starsHtml += '<i class="far fa-star"></i>';
            }
        }
        
        // Status with appropriate styling
        const statusClass = feedback.status || 'pending';
        const statusIcon = statusClass === 'reviewed' ? 'check-circle' : 
                          (statusClass === 'archived' ? 'archive' : 'clock');
        
        detailsContainer.innerHTML = `
            <div class="feedback-details">
                <h3><i class="fas fa-comment-dots"></i> Feedback Details</h3>
                
                <div class="details-section">
                    <h4><i class="fas fa-info-circle"></i> Basic Information</h4>
                    <div class="detail-row">
                        <span class="detail-label"><i class="fas fa-user"></i> From:</span>
                        <span class="detail-value">${employeeName}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label"><i class="fas fa-building"></i> Department:</span>
                        <span class="detail-value">${employeeDepartment}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label"><i class="fas fa-calendar-check"></i> Submitted:</span>
                        <span class="detail-value">${submittedDate}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label"><i class="fas fa-calendar-times"></i> Expires:</span>
                        <span class="detail-value">${expiryDate}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label"><i class="fas fa-tag"></i> Category:</span>
                        <span class="detail-value">${feedback.category}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label"><i class="fas fa-star"></i> Rating:</span>
                        <span class="detail-value feedback-stars">${starsHtml}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label"><i class="fas fa-${statusIcon}"></i> Status:</span>
                        <span class="detail-value"><span class="status-badge ${statusClass}">${feedback.status}</span></span>
                    </div>
                </div>
                
                <div class="details-section">
                    <h4><i class="fas fa-quote-left"></i> Feedback Message</h4>
                    <div class="feedback-message">
                        <p>${feedback.comments}</p>
                    </div>
                </div>
                
                <div class="details-section">
                    <h4><i class="fas fa-clipboard-check"></i> Review Information</h4>
                    <div class="detail-row">
                        <span class="detail-label"><i class="fas fa-user-check"></i> Reviewed By:</span>
                        <span class="detail-value">${reviewerName}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label"><i class="fas fa-clock"></i> Reviewed Date:</span>
                        <span class="detail-value">${reviewedDate}</span>
                    </div>
                    ${feedback.responseMessage ? `
                    <div class="detail-row">
                        <span class="detail-label"><i class="fas fa-reply"></i> Response:</span>
                        <span class="detail-value">${feedback.responseMessage}</span>
                    </div>
                    ` : ''}
                </div>
                
                <div class="details-section">
                    <h4><i class="fas fa-tasks"></i> Actions</h4>
                    <div class="feedback-actions">
                        <button class="btn-primary" id="btn-respond-feedback">
                            <i class="fas fa-reply"></i> Respond
                        </button>
                        <button class="btn-outline" id="btn-acknowledge-feedback">
                            <i class="fas fa-check"></i> Acknowledge
                        </button>
                        <button class="btn-danger" id="btn-delete-feedback">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        console.log('Details HTML added to container');
        
        // Add event listeners for the action buttons
        const respondBtn = document.getElementById('btn-respond-feedback');
        const acknowledgeBtn = document.getElementById('btn-acknowledge-feedback');
        const deleteBtn = document.getElementById('btn-delete-feedback');
        
        if (respondBtn) {
            respondBtn.addEventListener('click', () => {
                showFeedbackResponseModal(feedback);
            });
        }
        
        if (acknowledgeBtn) {
            acknowledgeBtn.addEventListener('click', async () => {
                try {
                    // Set loading state
                    setButtonLoading(acknowledgeBtn, true);
                    
                    // Update feedback status to reviewed/acknowledged
                    // Update feedback status to reviewed/acknowledged
                    const response = await fetch(`/api/feedback/${feedback._id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({
                            status: 'reviewed'
                        })
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to acknowledge feedback');
                    }
                    
                    // Show success notification
                    showNotification('Feedback acknowledged successfully', 'success');
                    
                    // Reload feedback to update the list
                    loadFeedback(document.getElementById('feedback-filter').value, 
                                document.getElementById('feedback-time-filter').value);
                                
                } catch (error) {
                    console.error('Error acknowledging feedback:', error);
                    showNotification(`Error: ${error.message}`, 'error');
                }
            });
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', async () => {
                // Show confirmation dialog
                if (!confirm('Are you sure you want to delete this feedback? This action cannot be undone.')) {
                    return;
                }
                
                try {
                    // Delete feedback
                    const response = await fetch(`/api/feedback/${feedback._id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to delete feedback');
                    }
                    
                    // Show success notification
                    showNotification('Feedback deleted successfully', 'success');
                    
                    // Clear the details panel
                    detailsContainer.innerHTML = `
                        <div class="empty-selection">
                            <i class="fas fa-comment-dots feedback-icon"></i>
                            <p>Select a feedback item to view details</p>
                        </div>
                    `;
                    
                    // Reload feedback to update the list
                    loadFeedback(document.getElementById('feedback-filter').value, 
                                document.getElementById('feedback-time-filter').value);
                                
                } catch (error) {
                    console.error('Error deleting feedback:', error);
                    showNotification(`Error: ${error.message}`, 'error');
                }
            });
        }
    } catch (error) {
        console.error('Error showing feedback details:', error);
        detailsContainer.innerHTML = `
            <div class="error-display">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error displaying feedback details.</p>
                <small>${error.message}</small>
            </div>
        `;
    }
}

// Initialize feedback section
function initFeedbackSection() {
    const feedbackFilter = document.getElementById('feedback-filter');
    const feedbackTimeFilter = document.getElementById('feedback-time-filter');
    const feedbackSearch = document.getElementById('feedback-search');
    
    if (feedbackFilter) {
        feedbackFilter.addEventListener('change', () => {
            loadFeedback(feedbackFilter.value, feedbackTimeFilter.value);
        });
    }
    
    if (feedbackTimeFilter) {
        feedbackTimeFilter.addEventListener('change', () => {
            loadFeedback(feedbackFilter.value, feedbackTimeFilter.value);
        });
    }
    
    if (feedbackSearch) {
        feedbackSearch.addEventListener('input', debounce(() => {
            searchFeedback(feedbackSearch.value);
        }, 300));
    }
    
    // Initial load of feedback
    loadFeedback();
}

// Function to search feedback
function searchFeedback(query) {
    const feedbackItems = document.querySelectorAll('.feedback-item');
    
    if (!query.trim()) {
        // If query is empty, show all items
        feedbackItems.forEach(item => {
            item.style.display = 'block';
        });
        return;
    }
    
    // Convert query to lowercase for case-insensitive search
    const lowercaseQuery = query.toLowerCase();
    
    feedbackItems.forEach(item => {
        const content = item.textContent.toLowerCase();
        
        if (content.includes(lowercaseQuery)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Helper function to debounce search input
function debounce(func, delay) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

// Add this to the initialization code
document.addEventListener('DOMContentLoaded', function() {
    // ... existing initialization code ...
    
    initFeedbackSection();
    
    // ... rest of initialization code ...
});

// Add a confirmation modal to the document
function addConfirmationModal() {
    const modalHTML = `
        <div id="confirm-modal" class="confirm-modal">
            <div class="confirm-modal-content">
                <div class="confirm-modal-title">
                    <i class="fas fa-exclamation-triangle"></i> Confirm Delete
                </div>
                <div class="confirm-modal-message">
                    Are you sure you want to delete this feedback? This action cannot be undone.
                </div>
                <div class="confirm-modal-actions">
                    <button class="cancel" id="confirm-cancel">Cancel</button>
                    <button class="confirm" id="confirm-delete">Delete</button>
                </div>
            </div>
        </div>
    `;
    
    // Add to document if it doesn't exist
    if (!document.getElementById('confirm-modal')) {
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Add event handlers for cancel button
        document.getElementById('confirm-cancel').addEventListener('click', () => {
            hideConfirmModal();
        });
        
        // Click outside to cancel
        document.getElementById('confirm-modal').addEventListener('click', (e) => {
            if (e.target.id === 'confirm-modal') {
                hideConfirmModal();
            }
        });
        
        // Escape key to cancel
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('confirm-modal').classList.contains('show')) {
                hideConfirmModal();
            }
        });
    }
}

// Show confirmation modal and return a promise
function showConfirmModal(callback) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirm-modal');
        if (!modal) {
            addConfirmationModal();
        }
        
        // Show the modal
        document.getElementById('confirm-modal').classList.add('show');
        
        // Set up confirm button
        const confirmBtn = document.getElementById('confirm-delete');
        
        // Remove any existing listeners
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        // Add new listener
        newConfirmBtn.addEventListener('click', () => {
            hideConfirmModal();
            resolve(true);
        });
    });
}

// Hide confirmation modal
function hideConfirmModal() {
    const modal = document.getElementById('confirm-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// Set loading state for a button
function setButtonLoading(button, isLoading) {
    if (!button) return;
    
    if (isLoading) {
        const originalText = button.innerHTML;
        button.dataset.originalText = originalText;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        button.disabled = true;
        button.classList.add('loading');
    } else {
        if (button.dataset.originalText) {
            button.innerHTML = button.dataset.originalText;
            delete button.dataset.originalText;
        }
        button.disabled = false;
        button.classList.remove('loading');
    }
}

// Add tooltips to action buttons
function addTooltipsToButtons() {
    const buttons = document.querySelectorAll('.feedback-actions button');
    
    buttons.forEach(button => {
        const text = button.textContent.trim();
        if (text.includes('Respond')) {
            button.setAttribute('data-tooltip', 'Send a response to this feedback');
        } else if (text.includes('Acknowledge')) {
            button.setAttribute('data-tooltip', 'Mark as reviewed');
        } else if (text.includes('Delete')) {
            button.setAttribute('data-tooltip', 'Permanently delete feedback');
        }
    });
}

// Show feedback details with improved UX
function showFeedbackDetails(feedback) {
    console.log('Showing feedback details for ID:', feedback._id);
    
    const detailsContainer = document.getElementById('feedback-details-container');
    if (!detailsContainer) {
        console.error('Details container not found!');
        return;
    }
    
    try {
        // Show loading state
        detailsContainer.innerHTML = `
            <div class="loading-feedback">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading feedback details...</p>
            </div>
        `;
        
        // Format dates
        const submittedDate = new Date(feedback.date).toLocaleString();
        const expiryDate = new Date(feedback.expiryDate).toLocaleDateString();
        const reviewedDate = feedback.reviewedAt ? new Date(feedback.reviewedAt).toLocaleString() : 'N/A';
        
        // Get employee and reviewer names
        const employeeName = feedback.user ? feedback.user.name : 'Unknown Employee';
        const employeeDepartment = feedback.user ? feedback.user.department : 'Unknown';
        const reviewerName = feedback.reviewedBy ? feedback.reviewedBy.name : 'N/A';
        
        // Create star rating HTML
        const rating = parseInt(feedback.rating);
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                starsHtml += '<i class="fas fa-star"></i>';
            } else {
                starsHtml += '<i class="far fa-star"></i>';
            }
        }
        
        // Status with appropriate styling
        const statusClass = feedback.status || 'pending';
        const statusIcon = statusClass === 'reviewed' ? 'check-circle' : 
                          (statusClass === 'archived' ? 'archive' : 'clock');
        
        // Simulate loading delay for better UX
        setTimeout(() => {
            detailsContainer.innerHTML = `
                <div class="feedback-details">
                    <h3><i class="fas fa-comment-dots"></i> Feedback Details</h3>
                    
                    <div class="details-section">
                        <h4><i class="fas fa-info-circle"></i> Basic Information</h4>
                        <div class="detail-row">
                            <span class="detail-label"><i class="fas fa-user"></i> From:</span>
                            <span class="detail-value">${employeeName}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label"><i class="fas fa-building"></i> Department:</span>
                            <span class="detail-value">${employeeDepartment}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label"><i class="fas fa-calendar-check"></i> Submitted:</span>
                            <span class="detail-value">${submittedDate}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label"><i class="fas fa-calendar-times"></i> Expires:</span>
                            <span class="detail-value">${expiryDate}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label"><i class="fas fa-tag"></i> Category:</span>
                            <span class="detail-value">${feedback.category}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label"><i class="fas fa-star"></i> Rating:</span>
                            <span class="detail-value feedback-stars">${starsHtml}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label"><i class="fas fa-${statusIcon}"></i> Status:</span>
                            <span class="detail-value"><span class="status-badge ${statusClass}">${feedback.status}</span></span>
                        </div>
                    </div>
                    
                    <div class="details-section">
                        <h4><i class="fas fa-quote-left"></i> Feedback Message</h4>
                        <div class="feedback-message">
                            <p>${feedback.comments}</p>
                        </div>
                    </div>
                    
                    <div class="details-section">
                        <h4><i class="fas fa-clipboard-check"></i> Review Information</h4>
                        <div class="detail-row">
                            <span class="detail-label"><i class="fas fa-user-check"></i> Reviewed By:</span>
                            <span class="detail-value">${reviewerName}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label"><i class="fas fa-clock"></i> Reviewed Date:</span>
                            <span class="detail-value">${reviewedDate}</span>
                        </div>
                        ${feedback.responseMessage ? `
                        <div class="detail-row">
                            <span class="detail-label"><i class="fas fa-reply"></i> Response:</span>
                            <span class="detail-value">${feedback.responseMessage}</span>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="details-section">
                        <h4><i class="fas fa-tasks"></i> Actions</h4>
                        <div class="feedback-actions">
                            <button class="btn-primary" id="btn-respond-feedback">
                                <i class="fas fa-reply"></i> Respond
                            </button>
                            <button class="btn-outline" id="btn-acknowledge-feedback">
                                <i class="fas fa-check"></i> Acknowledge
                            </button>
                            <button class="btn-danger" id="btn-delete-feedback">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            console.log('Details HTML added to container');
            
            // Add tooltips to action buttons
            addTooltipsToButtons();
            
            // Add event listeners for the action buttons
            const respondBtn = document.getElementById('btn-respond-feedback');
            const acknowledgeBtn = document.getElementById('btn-acknowledge-feedback');
            const deleteBtn = document.getElementById('btn-delete-feedback');
            
            if (respondBtn) {
                respondBtn.addEventListener('click', () => {
                    showFeedbackResponseModal(feedback);
                });
            }
            
            if (acknowledgeBtn) {
                acknowledgeBtn.addEventListener('click', async () => {
                    try {
                        // Set loading state
                        setButtonLoading(acknowledgeBtn, true);
                        
                        // Update feedback status to reviewed/acknowledged
                        const response = await fetch(`/api/feedback/${feedback._id}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                            },
                            body: JSON.stringify({
                                status: 'reviewed'
                            })
                        });
                        
                        if (!response.ok) {
                            throw new Error('Failed to acknowledge feedback');
                        }
                        
                        // Clear loading state
                        setButtonLoading(acknowledgeBtn, false);
                        
                        // Show success notification
                        showNotification('Feedback acknowledged successfully', 'success');
                        
                        // Reload feedback to update the list
                        loadFeedback(document.getElementById('feedback-filter').value, 
                                     document.getElementById('feedback-time-filter').value);
                                    
                    } catch (error) {
                        // Clear loading state
                        setButtonLoading(acknowledgeBtn, false);
                        
                        console.error('Error acknowledging feedback:', error);
                        showNotification(`Error: ${error.message}`, 'error');
                    }
                });
            }
            
            if (deleteBtn) {
                deleteBtn.addEventListener('click', async () => {
                    // Add confirmation modal if not exists
                    addConfirmationModal();
                    
                    // Show confirmation modal
                    const confirmed = await showConfirmModal();
                    
                    if (!confirmed) {
                        return;
                    }
                    
                    try {
                        // Set loading state
                        setButtonLoading(deleteBtn, true);
                        
                        // Delete feedback
                        const response = await fetch(`/api/feedback/${feedback._id}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                            }
                        });
                        
                        if (!response.ok) {
                            throw new Error('Failed to delete feedback');
                        }
                        
                        // Clear loading state
                        setButtonLoading(deleteBtn, false);
                        
                        // Show success notification
                        showNotification('Feedback deleted successfully', 'success');
                        
                        // Clear the details panel with animation
                        detailsContainer.innerHTML = `
                            <div class="empty-selection">
                                <i class="fas fa-check-circle feedback-icon"></i>
                                <p>Feedback has been deleted successfully</p>
                                <small>Select another feedback item to view details</small>
                            </div>
                        `;
                        
                        // Reload feedback to update the list
                        loadFeedback(document.getElementById('feedback-filter').value, 
                                     document.getElementById('feedback-time-filter').value);
                                    
                    } catch (error) {
                        // Clear loading state
                        setButtonLoading(deleteBtn, false);
                        
                        console.error('Error deleting feedback:', error);
                        showNotification(`Error: ${error.message}`, 'error');
                    }
                });
            }
        }, 300); // Small delay for loading animation
        
    } catch (error) {
        console.error('Error showing feedback details:', error);
        detailsContainer.innerHTML = `
            <div class="error-display">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error displaying feedback details.</p>
                <small>${error.message}</small>
            </div>
        `;
    }
}

// Handle task form submission
async function handleTaskFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const taskTitle = document.getElementById('task-title').value;
    const taskDescription = document.getElementById('task-description').value;
    const taskPriority = document.getElementById('task-priority').value;
    const taskCategory = document.getElementById('task-category').value;
    const taskDueDate = document.getElementById('task-due-date').value;
    const taskStatus = document.getElementById('task-status').value || 'pending';
    const taskAssignee = document.getElementById('task-assignee').value;
    const taskId = document.getElementById('task-id').value;
    
    // Validate required fields
    if (!taskTitle || !taskDueDate || !taskAssignee) {
        showAlert('error', 'Please fill all required fields. Task must be assigned to an employee.', 'task-error-alert');
        return;
    }
    
    // Show loading
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    
    try {
        // Always set status to 'pending' for new tasks
        let mappedStatus = taskId ? taskStatus : 'pending';
        
        // For existing tasks, map status values if needed
        if (taskId && (taskStatus === 'pending' || taskStatus === 'not_started')) {
            mappedStatus = 'pending'; // Valid Task model value
        } else if (taskId && taskStatus === 'in_progress') {
            mappedStatus = 'in_progress';
        }
        
        // Prepare task data strictly adhering to Task model schema
        const taskData = {
            title: taskTitle,
            description: taskDescription,
            priority: taskPriority,
            category: 'other', // Valid enum value in Task model
            dueDate: taskDueDate,
            status: mappedStatus,
            assignee: taskAssignee, 
            relatedUser: taskAssignee, // Task is related to the same user it's assigned to
            taskType: 'other' // Valid enum value in Task model
        };
        
        console.log('Sending task data:', JSON.stringify(taskData));
        
        let response;
        
        // Update existing task or create new one
        if (taskId) {
            console.log(`Updating task with ID: ${taskId}`);
            response = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(taskData)
            });
        } else {
            console.log('Creating new task');
            response = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(taskData)
            });
            
            // Create a notification for the assignee
            try {
                console.log('Creating notification for assignee');
                const notificationResponse = await fetch('/api/notifications', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        title: 'New Task Assigned',
                        message: `You have been assigned a new task: ${taskTitle}`,
                        type: 'task',
                        recipient: taskAssignee,
                        isRead: false
                    })
                });
                
                if (!notificationResponse.ok) {
                    console.warn('Failed to create notification for task assignment');
                } else {
                    console.log('Notification created successfully');
                }
            } catch (notifError) {
                console.error('Error creating notification:', notifError);
            }
        }
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to save task: ${errorData.message || response.statusText}`);
        }
        
        // Parse response to get task data
        const responseData = await response.json();
        console.log('Task saved successfully:', responseData);
        
        // Close modal
        document.getElementById('task-modal').style.display = 'none';
        
        // Show success notification
        showAlert('success', taskId ? 'Task updated successfully' : 'Task created successfully', 'task-alert');
        
        // Reload tasks
        loadTasks();
        
    } catch (error) {
        console.error('Error saving task:', error);
        showAlert('error', `Error: ${error.message}`, 'task-error-alert');
    } finally {
        // Reset button
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
}

// Load employees for task assignment dropdown
function loadEmployeesForTaskAssignment() {
    const assigneeDropdown = document.getElementById('task-assignee');
    if (!assigneeDropdown) return;
    
    // Clear existing options except the first one
    while (assigneeDropdown.options.length > 1) {
        assigneeDropdown.remove(1);
    }
    
    // Show loading option
    const loadingOption = document.createElement('option');
    loadingOption.textContent = 'Loading employees...';
    loadingOption.disabled = true;
    assigneeDropdown.appendChild(loadingOption);
    
    // Fetch employees from API
    fetch('/api/users?role=employee', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load employees');
        }
        return response.json();
    })
    .then(data => {
        // Remove loading option
        assigneeDropdown.remove(assigneeDropdown.options.length - 1);
        
        // Add employee options
        if (data && data.data && Array.isArray(data.data)) {
            data.data.forEach(employee => {
                const option = document.createElement('option');
                option.value = employee._id;
                option.textContent = employee.name || `${employee.firstName || ''} ${employee.lastName || ''}`;
                assigneeDropdown.appendChild(option);
            });
        }
    })
    .catch(error => {
        console.error('Error loading employees:', error);
        // Remove loading option
        assigneeDropdown.remove(assigneeDropdown.options.length - 1);
        
        // Add error option
        const errorOption = document.createElement('option');
        errorOption.textContent = 'Error loading employees';
        errorOption.disabled = true;
        assigneeDropdown.appendChild(errorOption);
    });
}

// Load tasks from API
function loadTasks() {
    const todoList = document.getElementById('todo-tasks');
    const inProgressList = document.getElementById('in-progress-tasks');
    const completedList = document.getElementById('completed-tasks');
    
    if (!todoList || !inProgressList || !completedList) return;
    
    // Show loading spinners
    todoList.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div>';
    inProgressList.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div>';
    completedList.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div>';
    
    console.log('Fetching tasks from API...');
    
    // Fetch tasks from API
    fetch('/api/tasks', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load tasks');
        }
        console.log('API response received, parsing JSON...');
        return response.json();
    })
    .then(data => {
        // Clear lists
        todoList.innerHTML = '';
        inProgressList.innerHTML = '';
        completedList.innerHTML = '';
        
        console.log('Task data received:', data);
        
        // Process tasks
        const tasks = data.tasks || [];
        
        if (tasks.length === 0) {
            console.log('No tasks found');
        } else {
            console.log('Raw tasks:', JSON.stringify(tasks));
        }
        
        // Filter tasks by status according to Task model schema
        const todoTasks = tasks.filter(task => {
            console.log(`Task ${task.title} has status: ${task.status}`);
            return task.status === 'pending';
        });
        const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
        const completedTasks = tasks.filter(task => task.status === 'completed');
        
        console.log(`Found tasks: Todo=${todoTasks.length}, InProgress=${inProgressTasks.length}, Completed=${completedTasks.length}`);
        
        // Update task counts
        document.querySelectorAll('.task-count')[0].textContent = todoTasks.length;
        document.querySelectorAll('.task-count')[1].textContent = inProgressTasks.length;
        document.querySelectorAll('.task-count')[2].textContent = completedTasks.length;
        
        // Render tasks
        todoTasks.forEach(task => {
            todoList.appendChild(createTaskItem(task));
        });
        
        inProgressTasks.forEach(task => {
            inProgressList.appendChild(createTaskItem(task));
        });
        
        completedTasks.forEach(task => {
            completedList.appendChild(createTaskItem(task));
        });
        
        // Show empty state if needed
        if (todoTasks.length === 0) {
            todoList.innerHTML = '<div class="empty-list">No tasks</div>';
        }
        
        if (inProgressTasks.length === 0) {
            inProgressList.innerHTML = '<div class="empty-list">No tasks</div>';
        }
        
        if (completedTasks.length === 0) {
            completedList.innerHTML = '<div class="empty-list">No tasks</div>';
        }
    })
    .catch(error => {
        console.error('Error loading tasks:', error);
        
        // Show error message
        todoList.innerHTML = '<div class="error-message">Failed to load tasks</div>';
        inProgressList.innerHTML = '<div class="error-message">Failed to load tasks</div>';
        completedList.innerHTML = '<div class="error-message">Failed to load tasks</div>';
    });
}

// Create task item element
function createTaskItem(task) {
    const item = document.createElement('div');
    item.className = 'task-item';
    item.dataset.id = task._id;
    
    // Format due date
    let dueDateText = 'No due date';
    if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        dueDateText = dueDate.toLocaleDateString();
    }
    
    // Get assignee name
    const assigneeName = task.assignee ? 
        (task.assignee.firstName && task.assignee.lastName ? 
            `${task.assignee.firstName} ${task.assignee.lastName}` : 
            task.assignee.email || 'Unassigned') : 
        'Unassigned';
    
    // Get priority class
    const priorityClass = `priority-${task.priority || 'medium'}`;
    
    // Create HTML
    item.innerHTML = `
        <div class="task-header">
            <h4 class="task-title">${task.title}</h4>
            <span class="task-priority ${priorityClass}">${task.priority || 'medium'}</span>
        </div>
        <div class="task-details">
            <p class="task-assignee"><i class="fas fa-user"></i> ${assigneeName}</p>
            <p class="task-due-date"><i class="fas fa-calendar"></i> ${dueDateText}</p>
        </div>
        <div class="task-footer">
            <span class="task-category">${task.category || 'Other'}</span>
            <span class="task-status">${task.status || 'pending'}</span>
        </div>
    `;
    
    // Add click event to edit task
    item.addEventListener('click', function() {
        openEditTaskModal(task);
    });
    
    return item;
}

// Open edit task modal
function openEditTaskModal(task) {
    // Populate form fields
    document.getElementById('task-id').value = task._id;
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-description').value = task.description || '';
    document.getElementById('task-priority').value = task.priority || 'medium';
    document.getElementById('task-category').value = task.category || 'other';
    document.getElementById('task-status').value = task.status || 'pending';
    
    // Format due date for input field (YYYY-MM-DD)
    if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const formattedDate = dueDate.toISOString().split('T')[0];
        document.getElementById('task-due-date').value = formattedDate;
    } else {
        document.getElementById('task-due-date').value = '';
    }
    
    // Set assignee if available
    if (task.assignee && task.assignee._id) {
        const assigneeDropdown = document.getElementById('task-assignee');
        
        // Load employees first
        loadEmployeesForTaskAssignment().then(() => {
            // Find and select the option
            for (let i = 0; i < assigneeDropdown.options.length; i++) {
                if (assigneeDropdown.options[i].value === task.assignee._id) {
                    assigneeDropdown.selectedIndex = i;
                    break;
                }
            }
        });
    }
    
    // Update modal title
    document.getElementById('task-modal-title').textContent = 'Edit Task';
    
    // Show modal
    document.getElementById('task-modal').style.display = 'block';
}