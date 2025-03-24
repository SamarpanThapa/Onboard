document.addEventListener('DOMContentLoaded', async function() {
    console.log('Dashboard loaded');
    
    // Check if user is authenticated
    if (!api.auth.isAuthenticated()) {
        window.location.href = '/index.html';
        return;
    }
    
    // Load any stored employee contacts
    loadStoredEmployeeContacts();
    
    // First, use any data already in localStorage
    const storedUser = api.auth.getUserData();
    if (storedUser) {
        console.log('Using stored user data:', storedUser);
        
        // Get user name from stored user data
        let bestName = '';
        if (storedUser.name && storedUser.name.trim() !== '') {
            bestName = storedUser.name;
        } else if (storedUser.firstName && storedUser.firstName.trim() !== '') {
            bestName = storedUser.firstName + (storedUser.lastName ? ' ' + storedUser.lastName : '');
        } else if (storedUser.email) {
            bestName = storedUser.email.split('@')[0];
        } else {
            bestName = 'User';
        }
        
        // Always update with the latest user name
        console.log('Setting username in localStorage:', bestName);
        localStorage.setItem('username', bestName);
        
        // Display the user info
        displayUserInfo(storedUser);
    }
    
    // Immediately update the welcome banner with the best name we have
    updateWelcomeBanner();
    
    // Then attempt to load fresh user data from API
    try {
        const userData = await api.auth.getCurrentUser();
        if (userData) {
            const user = userData.user || userData;
            console.log('Fresh user data loaded:', user);
            
            // Update username in localStorage with fresh data
            let freshName = '';
            if (user.name && user.name.trim() !== '') {
                freshName = user.name;
            } else if (user.firstName && user.firstName.trim() !== '') {
                freshName = user.firstName + (user.lastName ? ' ' + user.lastName : '');
            } else if (user.email) {
                freshName = user.email.split('@')[0];
            } else {
                freshName = 'User';
            }
            
            console.log('Updating username with fresh data:', freshName);
            localStorage.setItem('username', freshName);
            
            // Update displays with fresh user data
            displayUserInfo(user);
            updateWelcomeBanner();
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        showNotification('Could not refresh user data', 'warning');
    }
    
    // Initialize dashboard components
    initializeNavigation();
    loadEmployeeTasks();
    loadResources();
    loadNotifications();
    initializeCommunication();
    initializeHelpButtons();
    initializeFeedback();
    initializeComplianceTracking();
    
    // Set up department contacts updater
    setupDepartmentContactsUpdater();
    
    // Force reload of department contacts after a short delay to ensure DOM is fully ready
    setTimeout(() => {
        console.log('Reloading department contacts after DOM is fully ready...');
        loadDepartmentContacts('hr');
        loadDepartmentContacts('it');
    }, 1000);
    
    // Create notification container if it doesn't exist
    if (!document.getElementById('notification-container')) {
        const container = document.createElement('div');
        container.id = 'notification-container';
        document.body.appendChild(container);
    }
    
    // Welcome notification - use the same consistent username
    setTimeout(() => {
        showNotification(`Welcome to your dashboard!`, 'success');
    }, 1000);
    
    // Check for onboarding status and notifications
    checkOnboardingStatus();
    
    // Initialize modal close buttons
    initializeModals();
    
    // Check for notifications
    checkForOnboardingNotifications();
    
    // Also set up periodic checking (e.g., every minute)
    setInterval(checkForOnboardingNotifications, 60000);

    // Initialize offboarding functionality
    initializeOffboarding();
});

/**
 * Update welcome banner with the best name we have
 */
function updateWelcomeBanner() {
    // Get the best name we have
    const username = localStorage.getItem('username') || 'User';
    console.log('Updating welcome banner with name:', username);
    
    // Update welcome message in the main banner
    const welcomeBanner = document.querySelector('.welcome-banner h2');
    if (welcomeBanner) {
        welcomeBanner.innerHTML = `Welcome ${username} to your dashboard!`;
    }
    
    // Also update the #user-name element which is used in the HTML
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        userNameElement.textContent = username;
    }
}

/**
 * Display user information on the dashboard
 */
function displayUserInfo(user) {
    console.log('Displaying user info:', user);
    
    // Ensure user object exists and has the expected properties
    if (!user) {
        console.error('User data is missing or invalid');
        // Try to get user data from localStorage as a fallback
        const storedUser = api.auth.getUserData();
        if (storedUser && Object.keys(storedUser).length > 0) {
            console.log('Using stored user data:', storedUser);
            user = storedUser;
        } else {
            return;
        }
    }
    
    // Extract actual name with fallbacks - prioritize full name over email parts
    let displayName;
    
    // First check if we have a full name stored in localStorage - this ensures consistency
    const storedUsername = localStorage.getItem('username');
    if (storedUsername && storedUsername.indexOf('@') === -1) {
        displayName = storedUsername;
        console.log('Using stored username from localStorage:', displayName);
    } else {
        // Extract best name available from user object
        if (user.name && user.name.trim() !== '') {
            displayName = user.name;
        } else if (user.firstName && user.firstName.trim() !== '') {
            displayName = user.firstName + (user.lastName ? ' ' + user.lastName : '');
        } else if (user.email) {
            // Don't use email parts if we have a real name
            displayName = user.email.split('@')[0];
        } else {
            displayName = 'User';
        }
        
        // Store this consistent name for future use
        localStorage.setItem('username', displayName);
        console.log('Set new username in localStorage:', displayName);
    }
    
    console.log('Final display name:', displayName);
    
    // Update welcome message with user's name
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        userNameElement.textContent = displayName;
    }
    
    // Update welcome message (backward compatibility)
    const welcomeMessage = document.querySelector('.welcome-message h2');
    if (welcomeMessage) {
        welcomeMessage.innerHTML = `Welcome <span class="highlight">${displayName}</span> to your dashboard!`;
    }
    
    // Update welcome banner if it exists - THIS IS THE MOST VISIBLE ELEMENT
    const welcomeBanner = document.querySelector('.welcome-banner h2, .banner-content h2');
    if (welcomeBanner) {
        welcomeBanner.innerHTML = `Welcome ${displayName} to your dashboard!`;
    }
    
    // Update profile info if it exists
    const profileName = document.querySelector('.profile-info .name');
    if (profileName) {
        const firstName = user.firstName || '';
        const lastName = user.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim();
        profileName.textContent = fullName || displayName;
    }
    
    const profileEmail = document.querySelector('.profile-info .email');
    if (profileEmail) {
        profileEmail.textContent = user.email || 'No email provided';
    }
    
    const profileDepartment = document.querySelector('.profile-info .department');
    if (profileDepartment) {
        const departmentName = user.department && user.department.name 
            ? user.department.name 
            : (typeof user.department === 'string' ? user.department : 'Not assigned');
        profileDepartment.textContent = departmentName;
    }
    
    // Update onboarding progress display with user data
    updateOnboardingProgressDisplay(user);
}

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
    
    // Handle logout link for all dashboards
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', async function(e) {
            e.preventDefault();
            
            // Show notification that logout is processing
            showNotification('Logging out...', 'info');
            
            try {
                await api.auth.logout();
                console.log('Logout successful');
                // Redirect to login page
                window.location.href = '/login.html';
            } catch (error) {
                console.error('Logout error:', error);
                showNotification('Failed to logout. Please try again.', 'error');
                
                // Fallback logout if API fails (clear local storage and redirect)
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login.html';
            }
        });
    }
}

/**
 * Load employee tasks from API
 */
async function loadEmployeeTasks() {
    const tasksContainer = document.querySelector('.tasks-list');
    if (!tasksContainer) return;
    
    try {
        // Show loading state
        tasksContainer.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> Loading your tasks...</div>';
        
        // Get current user's assigned tasks
        const tasks = await api.tasks.getTasks({ assignedTo: 'me', status: 'active' });
        
        if (tasks.length === 0) {
            tasksContainer.innerHTML = '<div class="empty-state"><i class="fas fa-check-circle"></i><p>No pending tasks. Great job!</p></div>';
            return;
        }
        
        // Clear loading indicator
        tasksContainer.innerHTML = '';
        
        // Add tasks to the container
        tasks.forEach(task => {
            const taskElement = createTaskElement(task);
            tasksContainer.appendChild(taskElement);
        });
        
        // Initialize task checkboxes
        initializeTaskCheckboxes();
        
    } catch (error) {
        console.error('Error loading tasks:', error);
        tasksContainer.innerHTML = '<div class="error-message"><i class="fas fa-exclamation-triangle"></i> Failed to load tasks. Please refresh the page.</div>';
    }
}

/**
 * Create task element
 */
function createTaskElement(task) {
    const taskItem = document.createElement('div');
    taskItem.className = 'task-item';
    taskItem.dataset.id = task._id;
    taskItem.dataset.category = task.category || 'default';
    
    // Parse due date
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const dueDateFormatted = dueDate ? dueDate.toLocaleDateString() : 'No deadline';
    
    // Calculate priority class
    let priorityClass = 'priority-normal';
    if (task.priority === 'high') priorityClass = 'priority-high';
    if (task.priority === 'low') priorityClass = 'priority-low';
    
    taskItem.innerHTML = `
        <div class="task-checkbox">
            <input type="checkbox" id="task-${task._id}" ${task.completed ? 'checked' : ''}>
            <label for="task-${task._id}"></label>
        </div>
        <div class="task-content">
            <h4>${task.title}</h4>
            <p>${task.description || ''}</p>
            <div class="task-meta">
                <span class="due-date"><i class="far fa-calendar-alt"></i> ${dueDateFormatted}</span>
                <span class="${priorityClass}"><i class="fas fa-flag"></i> ${task.priority || 'Normal'}</span>
            </div>
        </div>
    `;
    
    return taskItem;
}

/**
 * Initialize task checkboxes
 */
function initializeTaskCheckboxes() {
    const checkboxes = document.querySelectorAll('.task-checkbox input');
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', async function() {
            const taskItem = this.closest('.task-item');
            const taskId = taskItem.dataset.id;
            const taskContent = taskItem.querySelector('.task-content h4');
            const taskTitle = taskContent.textContent;
            
            try {
                if (this.checked) {
                    // Get user info for the notification
                    const userInfo = api.auth.getUserData();
                    const userName = userInfo ? 
                        (userInfo.firstName && userInfo.lastName ? 
                            `${userInfo.firstName} ${userInfo.lastName}` : 
                            (userInfo.name || userInfo.email || localStorage.getItem('username') || 'Employee')) 
                        : 'Employee';
                    
                    // Mark task as completed via API
                    await api.tasks.updateTask(taskId, { 
                        status: 'completed',
                        completedDate: new Date()
                    });
                    
                    // Update UI
                    taskContent.style.textDecoration = 'line-through';
                    taskContent.style.opacity = '0.6';
                    
                    // Send notification to HR/Admin that task is completed
                    console.log(`Sending notification: ${userName} completed task "${taskTitle}"`);
                    
                    try {
                        await api.notifications.createNotification({
                            title: 'Task Completed',
                            message: `${userName} completed the task "${taskTitle}".`,
                            type: 'task',
                            recipients: ['admin', 'hr_admin'], // Send to admins and HR
                            priority: 'medium',
                            relatedTo: {
                                model: 'Task',
                                id: taskId
                            }
                        });
                        console.log('Notification sent successfully');
                    } catch (notificationError) {
                        console.warn('Could not send notification to admin/HR:', notificationError);
                        
                        // Even if API fails, still show success to user
                        // We'll handle this case on the backend later
                    }
                    
                    // Show notification to the employee
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
                    // Mark task as active via API
                    await api.tasks.updateTask(taskId, { status: 'active' });
                    
                    // Update UI
                    taskContent.style.textDecoration = 'none';
                    taskContent.style.opacity = '1';
                }
                
                // Update progress
                updateTaskProgress();
            } catch (error) {
                console.error('Error updating task status:', error);
                showNotification('Failed to update task. Please try again.', 'error');
                
                // Revert checkbox state
                this.checked = !this.checked;
            }
        });
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
        const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        progressPercentage.style.width = `${percentage}%`;
        progressText.textContent = `${percentage}%`;
    }
}

/**
 * Load resources from API
 */
async function loadResources() {
    const resourcesContainer = document.querySelector('.resources-list');
    if (!resourcesContainer) return;
    
    try {
        // Show loading state
        resourcesContainer.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> Loading resources...</div>';
        
        // Get resources (documents) for the employee with category=employee_resources
        const response = await fetch('/api/documents?category=employee_resources', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch resources: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        const documents = result.data || [];
        
        if (documents.length === 0) {
            resourcesContainer.innerHTML = '<div class="empty-state"><i class="fas fa-file-alt"></i><p>No resources available yet.</p></div>';
            return;
        }
        
        // Clear loading indicator
        resourcesContainer.innerHTML = '';
        
        // Add resources to the container
        documents.forEach(document => {
            const resourceElement = createResourceElement(document);
            resourcesContainer.appendChild(resourceElement);
        });
        
        // Initialize resource links
        initializeResourceLinks();
        
    } catch (error) {
        console.error('Error loading resources:', error);
        resourcesContainer.innerHTML = '<div class="error-message"><i class="fas fa-exclamation-triangle"></i> Failed to load resources. Please refresh the page.</div>';
    }
}

/**
 * Create resource element
 */
function createResourceElement(document) {
    const resourceItem = document.createElement('a');
    resourceItem.className = 'resource-item';
    resourceItem.href = document.file && document.file.filePath ? `/uploads/documents/${document.file.fileName}` : '#';
    resourceItem.dataset.id = document._id;
    resourceItem.dataset.type = document.documentType || 'document';
    
    // Determine icon based on document type
    let icon = 'fas fa-file-alt';
    if (document.documentType === 'video') icon = 'fas fa-video';
    if (document.documentType === 'pdf') icon = 'fas fa-file-pdf';
    if (document.documentType === 'presentation') icon = 'fas fa-file-powerpoint';
    if (document.documentType === 'spreadsheet') icon = 'fas fa-file-excel';
    if (document.documentType === 'image') icon = 'fas fa-file-image';
    
    const fileTypeDisplay = getFileTypeDisplay(document.documentType);
    
    resourceItem.innerHTML = `
        <div class="resource-icon">
            <i class="${icon}"></i>
        </div>
        <div class="resource-content">
            <h4>${document.title}</h4>
            <span class="resource-type">${fileTypeDisplay}</span>
        </div>
    `;
    
    return resourceItem;
}

/**
 * Get display name for file type
 */
function getFileTypeDisplay(documentType) {
    switch(documentType) {
        case 'pdf': return 'PDF Document';
        case 'presentation': return 'Presentation';
        case 'spreadsheet': return 'Spreadsheet';
        case 'text': return 'Text Document';
        case 'image': return 'Image';
        case 'video': return 'Video';
        case 'calendar': return 'Calendar File';
        default: return 'Document';
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
            const resourceId = this.dataset.id;
            
            showNotification(`Opening ${resourceName}...`, 'info');
            
            // Track resource access via API if we have an ID
            if (resourceId) {
                try {
                    // Create a notes entry for the document about accessing it
                    fetch(`/api/documents/${resourceId}/notes`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ text: 'Document accessed by employee' })
                    }).catch(err => console.error('Error logging document access:', err));
                } catch (error) {
                    console.error('Error tracking resource access:', error);
                }
            }
            
            // Open the resource in a new tab
            if (this.href && this.href !== '#') {
                window.open(this.href, '_blank');
            } else {
                showNotification('Resource cannot be accessed. Please contact IT support.', 'error');
            }
        });
    });
}

/**
 * Load notifications from API
 */
async function loadNotifications() {
    try {
        // Fetch notifications from API
        const notifications = await api.notifications.getNotifications({ status: 'unread' });
        
        // Update notification badge
        updateNotificationBadge(notifications.length);
        
        // Populate notifications dropdown if it exists
        const notificationsDropdown = document.querySelector('.notifications-dropdown-content');
        if (notificationsDropdown) {
            populateNotificationsDropdown(notificationsDropdown, notifications);
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

/**
 * Update notification badge count
 */
function updateNotificationBadge(count) {
    const badge = document.querySelector('.notification-badge');
    if (badge) {
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }
}

/**
 * Populate notifications dropdown
 */
function populateNotificationsDropdown(container, notifications) {
    // Clear existing notifications
    container.innerHTML = '';
    
    if (notifications.length === 0) {
        container.innerHTML = '<div class="empty-notification">No new notifications</div>';
        return;
    }
    
    // Add notifications to dropdown
    notifications.forEach(notification => {
        const notificationElement = document.createElement('div');
        notificationElement.className = 'notification-item';
        notificationElement.dataset.id = notification._id;
        
        // Format date
        const createdDate = new Date(notification.created.date);
        const formattedDate = createdDate.toLocaleString();
        
        notificationElement.innerHTML = `
            <div class="notification-content">
                <h4>${notification.title}</h4>
                <p>${notification.message}</p>
                <span class="notification-time">${formattedDate}</span>
            </div>
            <div class="notification-actions">
                <button class="mark-read-btn" title="Mark as read">
                    <i class="fas fa-check"></i>
                </button>
            </div>
        `;
        
        // Add event listener for mark as read button
        const markReadBtn = notificationElement.querySelector('.mark-read-btn');
        markReadBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            try {
                await api.notifications.markAsRead(notification._id);
                notificationElement.remove();
                updateNotificationBadge(document.querySelectorAll('.notification-item').length);
                
                if (document.querySelectorAll('.notification-item').length === 0) {
                    container.innerHTML = '<div class="empty-notification">No new notifications</div>';
                }
            } catch (error) {
                console.error('Error marking notification as read:', error);
                showNotification('Failed to mark notification as read', 'error');
            }
        });
        
        container.appendChild(notificationElement);
    });
    
    // Add "Mark all as read" button if there are notifications
    const markAllBtn = document.createElement('button');
    markAllBtn.className = 'mark-all-read-btn';
    markAllBtn.textContent = 'Mark all as read';
    markAllBtn.addEventListener('click', async () => {
        try {
            await api.notifications.markAllAsRead();
            container.innerHTML = '<div class="empty-notification">No new notifications</div>';
            updateNotificationBadge(0);
            showNotification('All notifications marked as read', 'success');
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            showNotification('Failed to mark all notifications as read', 'error');
        }
    });
    
    container.appendChild(markAllBtn);
}

/**
 * Initialize communication features
 */
function initializeCommunication() {
    console.log('Initializing communication features...');
    
    // Load employee contacts for the dropdown
    loadEmployeeContacts();
    
    // Load HR and IT department contacts
    console.log('Loading HR and IT department contacts...');
    loadDepartmentContacts('hr');
    loadDepartmentContacts('it');
    
    // Handle employee selection in the contact list
    const employeeContactList = document.getElementById('employee-contact-list');
    if (employeeContactList) {
        employeeContactList.addEventListener('change', function() {
            displaySelectedEmployeeInfo(this.value);
        });
    }
    
    // Handle HR selection in the contact list
    const hrContactList = document.getElementById('hr-contact-list');
    if (hrContactList) {
        console.log('Setting up HR contact list handler');
        // Event listener is set in loadDepartmentContacts
    }
    
    // Handle IT selection in the contact list
    const itContactList = document.getElementById('it-contact-list');
    if (itContactList) {
        console.log('Setting up IT contact list handler');
        // Event listener is set in loadDepartmentContacts
    }
    
    // Toggle message panels
    const messageToggleBtns = document.querySelectorAll('.message-toggle-btn');
    const messagePanels = document.querySelectorAll('.message-panel');
    
    // Add event listeners to toggle message panels
    messageToggleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            const panel = document.getElementById(`${type}-message-panel`);
            
            // Toggle panel visibility
            if (panel.style.display === 'none' || panel.style.display === '') {
                // Hide all panels first
                messagePanels.forEach(p => p.style.display = 'none');
                panel.style.display = 'block';
                
                // Load users for the dropdown based on type
                loadUsersForDropdown(type);
            } else {
                panel.style.display = 'none';
            }
        });
    });
    
    // Add event listeners to send message buttons
    const sendMessageBtns = document.querySelectorAll('.send-message-btn');
    sendMessageBtns.forEach(btn => {
        btn.addEventListener('click', async function() {
            const targetType = this.getAttribute('data-target');
            const selectEl = document.getElementById(`${targetType}-select`);
            const messageEl = document.getElementById(`${targetType}-message`);
            
            // Get selected recipient and message
            const recipientId = selectEl.value;
            const messageText = messageEl.value.trim();
            
            // Validate inputs
            if (!recipientId) {
                showMessageFeedback(targetType, 'Please select a recipient', 'error');
                return;
            }
            
            if (!messageText) {
                showMessageFeedback(targetType, 'Please enter a message', 'error');
                return;
            }
            
            try {
                // Send message via API
                await api.messages.sendMessage({
                    recipient: recipientId,
                    content: messageText,
                    subject: `Message from ${targetType === 'employee' ? 'colleague' : targetType === 'hr' ? 'HR department' : 'IT support'}`
                });
                
                // Show success message
                showMessageFeedback(targetType, 'Message sent successfully!', 'success');
                
                // Clear input
                messageEl.value = '';
                
                // Hide panel after 2 seconds
                setTimeout(() => {
                    document.getElementById(`${targetType}-message-panel`).style.display = 'none';
                }, 2000);
                
            } catch (error) {
                console.error('Error sending message:', error);
                showMessageFeedback(targetType, 'Failed to send message. Please try again.', 'error');
            }
        });
    });
    
    // Send message on Enter key (with Shift+Enter for new line)
    const messageInputs = document.querySelectorAll('.message-input');
    messageInputs.forEach(input => {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const targetType = this.id.split('-')[0];
                const sendBtn = document.querySelector(`.send-message-btn[data-target="${targetType}"]`);
                sendBtn.click();
            }
        });
    });
    
    // Load past messages if container exists
    const messagesContainer = document.querySelector('.messages-list');
    if (messagesContainer) {
        loadPastMessages(messagesContainer);
    }
}

/**
 * Load employee contacts into the dropdown
 */
async function loadEmployeeContacts() {
    const contactSelect = document.getElementById('employee-contact-list');
    if (!contactSelect) return;
    
    try {
        // Get current user's data to determine their department
        const userData = JSON.parse(localStorage.getItem('userData')) || {};
        const userDepartment = userData.department || '';
        console.log(`Current user's department for employee contacts: ${userDepartment}`);
        
        // Fetch all employees first
        const allEmployees = await fetchUsers();
        console.log(`Fetched ${allEmployees.length} total employees`);
        
        // Filter employees - exclude HR department and IT administrators
        let employees = allEmployees.filter(emp => {
            const dept = (emp.department || '').toUpperCase();
            const position = (emp.position || '').toLowerCase();
            
            // Exclude HR department
            if (dept === 'HR') return false;
            
            // Exclude IT administrators
            if (dept === 'IT' && (
                position.includes('admin') || 
                position.includes('support') || 
                position.includes('specialist') || 
                position.includes('tech') || 
                position.includes('manager') ||
                position.includes('helpdesk') ||
                position.includes('developer')
            )) return false;
            
            return true;
        });
        
        console.log(`Filtered to ${employees.length} regular employees (excluding HR and IT admins)`);
        
        // Clear existing options except the first one
        while (contactSelect.options.length > 1) {
            contactSelect.remove(1);
        }
        
        // Add options for each employee
        if (employees.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No employees found';
            option.disabled = true;
            contactSelect.appendChild(option);
        } else {
            employees.forEach(employee => {
                const option = document.createElement('option');
                option.value = employee._id;
                option.textContent = employee.name; // Use the name field from the database
                option.setAttribute('data-email', employee.email || '');
                option.setAttribute('data-position', employee.position || '');
                option.setAttribute('data-department', employee.department || '');
                contactSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading employee contacts:', error);
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Error loading employees';
        option.disabled = true;
        contactSelect.appendChild(option);
    }
}

/**
 * Display the selected employee's information
 * @param {string} employeeId - The ID of the selected employee
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
        
        // If we can get the data from the option attributes, use that
        if (name && email) {
            infoContainer.innerHTML = `
                <div class="contact-name">${name}</div>
                ${position ? `<div class="contact-role">${position}</div>` : ''}
                ${department ? `<div class="contact-department">${department}</div>` : ''}
                <p><i class="fas fa-envelope"></i> <a href="mailto:${email}">${email}</a></p>
            `;
            return;
        }
        
        // Fallback to fetching the employee data from the API
        const response = await fetch(`/api/users/${employeeId}`);
        if (!response.ok) throw new Error('Failed to fetch employee data');
        
        const employee = await response.json();
        
        // Create HTML for the employee info
        infoContainer.innerHTML = `
            <div class="contact-name">${employee.name || 'Name not available'}</div>
            ${employee.position ? `<div class="contact-role">${employee.position}</div>` : ''}
            ${employee.department ? `<div class="contact-department">${employee.department}</div>` : ''}
            <p><i class="fas fa-envelope"></i> <a href="mailto:${employee.email}">${employee.email || 'Email not available'}</a></p>
        `;
        
        // Add click event to the message button
        const messageBtn = infoContainer.querySelector('.message-btn');
        if (messageBtn) {
            messageBtn.addEventListener('click', function() {
                // Show the message panel
                const panel = document.getElementById('employees-message-panel');
                if (panel) {
                    document.querySelectorAll('.message-panel').forEach(p => p.style.display = 'none');
                    panel.style.display = 'block';
                    
                    // Set the recipient in the dropdown
                    const employeeSelect = document.getElementById('employee-select');
                    if (employeeSelect) {
                        for (let i = 0; i < employeeSelect.options.length; i++) {
                            if (employeeSelect.options[i].value === employeeId) {
                                employeeSelect.selectedIndex = i;
                                break;
                            }
                        }
                    }
                    
                    // Focus on the message input
                    const messageInput = document.getElementById('employee-message');
                    if (messageInput) messageInput.focus();
                }
            });
        }
            } catch (error) {
        console.error('Error displaying employee info:', error);
        infoContainer.innerHTML = '<p>Error loading employee information. Please try again.</p>';
    }
}

/**
 * Initialize feedback system
 */
function initializeFeedback() {
    const feedbackBtn = document.getElementById('feedback-btn');
    
    if (feedbackBtn) {
        feedbackBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openFeedbackDialog();
        });
    }
}

/**
 * Open feedback dialog
 */
function openFeedbackDialog() {
    // Create modal if it doesn't exist
    if (!document.getElementById('feedback-modal')) {
        const modal = document.createElement('div');
        modal.id = 'feedback-modal';
        modal.className = 'modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Share Your Feedback</h3>
                    <button class="modal-close"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <p>How would you rate your onboarding experience so far?</p>
                    <div class="rating-container">
                        <div class="rating">
                            <input type="radio" name="rating" id="rating-5" value="5">
                            <label for="rating-5"><i class="fas fa-star"></i></label>
                            <input type="radio" name="rating" id="rating-4" value="4">
                            <label for="rating-4"><i class="fas fa-star"></i></label>
                            <input type="radio" name="rating" id="rating-3" value="3">
                            <label for="rating-3"><i class="fas fa-star"></i></label>
                            <input type="radio" name="rating" id="rating-2" value="2">
                            <label for="rating-2"><i class="fas fa-star"></i></label>
                            <input type="radio" name="rating" id="rating-1" value="1">
                            <label for="rating-1"><i class="fas fa-star"></i></label>
                        </div>
        </div>
        <div class="form-group">
                        <label for="feedback-comments">Comments (optional)</label>
                        <textarea id="feedback-comments" placeholder="Share any thoughts or suggestions"></textarea>
                    </div>
                    <button id="submit-feedback" class="btn-primary">Submit Feedback</button>
                </div>
        </div>
    `;
    
        document.body.appendChild(modal);
        
        // Close button
        const closeButton = modal.querySelector('.modal-close');
        closeButton.addEventListener('click', () => {
            modal.classList.remove('active');
        });
        
        // Submit feedback
        const submitButton = modal.querySelector('#submit-feedback');
        submitButton.addEventListener('click', async () => {
            const ratingInput = document.querySelector('input[name="rating"]:checked');
            
            if (!ratingInput) {
                showNotification('Please select a rating', 'error');
                return;
            }
        
            const rating = parseInt(ratingInput.value);
            const comments = document.getElementById('feedback-comments').value;
            
            try {
                // Send feedback via API
                const response = await api.feedback.createFeedback({
                    rating,
                    comments,
                    category: 'onboarding'
                });
                
                // Send notification to HR about the new feedback
                await api.notifications.createNotification({
                    title: 'New Feedback Received',
                    message: `An employee has submitted feedback with a rating of ${rating}/5.`,
                    type: 'feedback',
                    recipients: ['hr_admin']
                });
                
                showNotification('Thank you for your feedback!', 'success');
                modal.classList.remove('active');
                
                // Clear form
                document.getElementById('feedback-comments').value = '';
                document.querySelector('input[name="rating"]:checked').checked = false;
                
            } catch (error) {
                console.error('Error submitting feedback:', error);
                showNotification('Failed to submit feedback. Please try again.', 'error');
            }
        });
    }
    
    // Show modal
    const modal = document.getElementById('feedback-modal');
    modal.classList.add('active');
}

/**
 * Initialize compliance tracking
 */
function initializeComplianceTracking() {
    const complianceTasks = document.querySelectorAll('.task-item[data-category="compliance"]');
    
    if (complianceTasks.length > 0) {
        updateComplianceStatus(complianceTasks);
        
        // Update compliance status whenever a compliance task checkbox changes
        complianceTasks.forEach(task => {
            const checkbox = task.querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    updateComplianceStatus(complianceTasks);
                });
            }
        });
    }
}

/**
 * Update compliance status
 */
function updateComplianceStatus(complianceTasks) {
    const totalTasks = complianceTasks.length;
    const completedTasks = Array.from(complianceTasks).filter(task => 
        task.querySelector('input[type="checkbox"]')?.checked
    ).length;
    
    const complianceCard = document.querySelector('.stat-card:nth-child(3)');
    if (complianceCard) {
        const statNumber = complianceCard.querySelector('.stat-number');
        const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        statNumber.textContent = `${percentage}%`;
        
        // For each newly completed compliance task, send notification to HR for verification
        complianceTasks.forEach(async task => {
            const checkbox = task.querySelector('input[type="checkbox"]');
            const taskTitle = task.querySelector('.task-content h4')?.textContent || 'Compliance item';
            
            // If checkbox was just checked (completed), notify HR for verification
            if (checkbox && checkbox.checked && !task.hasAttribute('data-notified')) {
                // Mark this task as having sent a notification
                task.setAttribute('data-notified', 'true');
                
                // Send notification to HR for compliance verification
                try {
                    await api.notifications.createNotification({
                        title: 'Compliance Verification Required',
                        message: `Employee has completed "${taskTitle}" and needs verification.`,
                        type: 'compliance',
                        recipients: ['hr_admin']
                    });
                    
                    // Update task status with pending verification
                    await api.tasks.updateTask(task.dataset.id, { 
                        status: 'verification_pending',
                        notes: 'Completed by employee, pending HR verification'
                    });
                    
                    // Show notification to user
                    showNotification('Compliance item submitted for verification', 'info');
                } catch (error) {
                    console.error('Error requesting compliance verification:', error);
                }
            }
        });
        
        if (percentage === 100) {
            showNotification('Congratulations! You have completed all compliance tasks.', 'success');
            
            // Report compliance completion to API
            try {
                api.employees.updateStatus({ 
                    complianceStatus: 'verification_pending',
                    completedAt: new Date().toISOString()
                }).catch(err => console.error('Error updating compliance status:', err));
            } catch (error) {
                console.error('Error reporting compliance completion:', error);
            }
        }
    }
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) return;
    
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

// Add this function to update the onboarding progress display
function updateOnboardingProgressDisplay(userData) {
    try {
        // Check if user has completed onboarding
        const isOnboardingCompleted = 
            userData?.onboarding?.status === 'completed' || 
            userData?.onboardingStatus === 'completed';
        
        // Check for progress value
        let progressValue = 60; // Default value
        
        // Use explicit progress value if available
        if (userData?.onboarding?.progress) {
            progressValue = userData.onboarding.progress;
        } else if (userData?.progress?.percentComplete) {
            progressValue = userData.progress.percentComplete;
        } else if (isOnboardingCompleted) {
            progressValue = 100; // If completed, show 100%
        }
        
        // Update progress elements on dashboard
        const progressElement = document.querySelector('.progress-value, .onboarding-complete');
        if (progressElement) {
            progressElement.textContent = `${progressValue}%`;
        }
        
        // Update progress bar if it exists
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progressValue}%`;
        }
        
        // Update pending tasks based on completion
        const pendingTasks = document.querySelector('.tasks-pending');
        if (pendingTasks && isOnboardingCompleted) {
            pendingTasks.textContent = '0';
        }
        
        console.log(`Updated onboarding progress display to ${progressValue}%`);
    } catch (error) {
        console.error('Error updating onboarding progress display:', error);
    }
}

// Check for onboarding status and notifications
function checkOnboardingStatus() {
    console.log('Checking onboarding status');
    
    // In a real implementation, we would fetch the status from the API
    // For this demo, we'll use local storage to simulate different states
    
    // 1. Check if we have a stored onboarding status
    const onboardingStatus = localStorage.getItem('onboardingStatus');
    
    // For demonstration, we'll use a random status if none exists
    if (!onboardingStatus) {
        // Generate a random status for demo purposes
        const statuses = ['pending', 'approved', 'revision_required'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        localStorage.setItem('onboardingStatus', randomStatus);
        
        // Also set a random feedback message for revision
        if (randomStatus === 'revision_required') {
            localStorage.setItem('onboardingFeedback', 'Please update your tax documentation and emergency contact information.');
            localStorage.setItem('onboardingMissingItems', JSON.stringify([
                'Missing tax documentation',
                'Incomplete emergency contact information'
            ]));
        } else if (randomStatus === 'approved') {
            localStorage.setItem('onboardingFeedback', 'Welcome to the team! Your onboarding documentation is complete and has been approved.');
        }
    }
    
    // Get the current status and display the appropriate notification
    const currentStatus = localStorage.getItem('onboardingStatus');
    console.log('Current onboarding status:', currentStatus);
    
    const notification = document.getElementById('onboarding-status-notification');
    if (notification) {
        // Common setup
        notification.style.display = 'block';
        const title = document.getElementById('onboarding-status-title');
        const message = document.getElementById('onboarding-status-message');
        const time = document.getElementById('onboarding-status-time');
        
        // Set the time to "Just now" for demo purposes
        if (time) time.textContent = 'Just now';
        
        if (currentStatus === 'approved') {
            // Show approved notification
            if (title) title.textContent = 'Onboarding Approved!';
            if (message) message.textContent = 'Your onboarding has been approved. Welcome to the team!';
            notification.onclick = showApprovalModal;
            notification.style.cursor = 'pointer';
            notification.querySelector('.notification-icon i').className = 'fas fa-check-circle';
            notification.style.borderLeft = '4px solid #28a745';
        } else if (currentStatus === 'revision_required') {
            // Show revision required notification
            if (title) title.textContent = 'Onboarding Revision Required';
            if (message) message.textContent = 'HR has requested revisions to your onboarding submission.';
            notification.onclick = showRevisionModal;
            notification.style.cursor = 'pointer';
            notification.querySelector('.notification-icon i').className = 'fas fa-exclamation-circle';
            notification.style.borderLeft = '4px solid #dc3545';
        } else {
            // Show pending notification
            if (title) title.textContent = 'Onboarding Status';
            if (message) message.textContent = 'Your onboarding submission is pending review.';
            notification.querySelector('.notification-icon i').className = 'fas fa-clock';
            notification.style.borderLeft = '4px solid #ffc107';
        }
    }
}

// Show the approval modal
function showApprovalModal() {
    console.log('Showing approval modal');
    
    const modal = document.getElementById('approval-modal');
    if (!modal) return;
    
    // Set the feedback text from storage
    const feedback = localStorage.getItem('onboardingFeedback') || 'Welcome to the team! Your onboarding documentation is complete and has been approved.';
    const feedbackElement = document.getElementById('approval-feedback');
    if (feedbackElement) feedbackElement.textContent = feedback;
    
    // Set a random orientation date for demo purposes
    const orientationDate = document.getElementById('orientation-date');
    if (orientationDate) {
        const dates = ['April 2nd, 2024', 'April 5th, 2024', 'April 10th, 2024'];
        orientationDate.textContent = dates[Math.floor(Math.random() * dates.length)];
    }
    
    // Show the modal
    modal.style.display = 'block';
    
    // Add event listener to close the modal
    const closeButtons = modal.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Add event listener for the "Go to Training" button
    const trainingBtn = document.getElementById('go-to-training-btn');
    if (trainingBtn) {
        trainingBtn.addEventListener('click', function() {
            alert('Training modules would open here in a real implementation.');
            modal.style.display = 'none';
        });
    }
}

// Show the revision modal
function showRevisionModal(feedback) {
    console.log('Showing revision modal');
    
    const modal = document.getElementById('revision-modal');
    if (!modal) return;
    
    // Set the feedback text from storage
    const feedbackElement = document.getElementById('revision-feedback');
    if (feedbackElement) feedbackElement.textContent = feedback;
    
    // Set the missing items from storage
    const missingItemsElement = document.getElementById('revision-items-list');
    if (missingItemsElement) {
        missingItemsElement.innerHTML = '';
        
        try {
            const missingItems = JSON.parse(localStorage.getItem('onboardingMissingItems') || '[]');
            missingItems.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                missingItemsElement.appendChild(li);
            });
        } catch (error) {
            console.error('Error parsing missing items:', error);
            
            // Add a default item
            const li = document.createElement('li');
            li.textContent = 'Please check your onboarding form for missing information';
            missingItemsElement.appendChild(li);
        }
    }
    
    // Show the modal
    modal.style.display = 'block';
    
    // Add event listener to close the modal
    const closeButtons = modal.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Add event listener for the "Update My Information" button
    const updateBtn = document.getElementById('update-onboarding-btn');
    if (updateBtn) {
        updateBtn.addEventListener('click', function() {
            window.location.href = 'onboarding.html';
        });
    }
}

// For testing: Reset onboarding status (called on DOMContentLoaded for demo)
function resetOnboardingStatus() {
    // Comment this out in production, only for demo/testing
    localStorage.removeItem('onboardingStatus');
    localStorage.removeItem('onboardingFeedback');
    localStorage.removeItem('onboardingMissingItems');
}

// Initialize modal close buttons
function initializeModals() {
    const modals = document.querySelectorAll('.modal');
    
    modals.forEach(modal => {
        const closeButtons = modal.querySelectorAll('.close-modal');
        closeButtons.forEach(button => {
            button.addEventListener('click', function() {
                modal.style.display = 'none';
            });
        });
        
        // Close modal when clicking outside
        window.onclick = function(event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
    });
}

// Function to check for onboarding notifications
async function checkForOnboardingNotifications() {
    try {
        console.log('Checking for onboarding notifications...');
        
        // Get user data
        const userData = api.auth.getUserData();
        if (!userData) {
            console.log('No user data found');
            return;
        }
        
        // Try to get notifications from the API
        const response = await fetch('/api/notifications?type=onboarding', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            console.log('Failed to fetch notifications from API');
            return;
        }
        
        const data = await response.json();
        console.log('Received notification data:', data);
        
        // Process notifications if available
        if (data && data.notifications && data.notifications.length > 0) {
            // Sort by date (newest first)
            const notifications = data.notifications.sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
            );
            
            // Find the most recent onboarding status notification
            const onboardingNotification = notifications.find(n => 
                n.type === 'onboarding' && 
                (n.subtype === 'approval' || n.subtype === 'revision')
            );
            
            if (onboardingNotification) {
                console.log('Found onboarding notification:', onboardingNotification);
                
                // Process based on notification type
                if (onboardingNotification.subtype === 'revision') {
                    updateUIForRevisionRequest(onboardingNotification);
                } else if (onboardingNotification.subtype === 'approval') {
                    updateUIForApproval(onboardingNotification);
                }
                
                // Mark the notification as read after processing
                markNotificationAsRead(onboardingNotification.id);
            }
        }
    } catch (error) {
        console.error('Error checking for onboarding notifications:', error);
    }
}

// Function to mark a notification as read
async function markNotificationAsRead(notificationId) {
    try {
        const response = await fetch(`/api/notifications/${notificationId}/read`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            console.error('Failed to mark notification as read');
        }
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

// Function to update UI for revision request
function updateUIForRevisionRequest(notification) {
    // Show notification to the user
    showNotification('Your onboarding submission requires revisions', 'warning');
    
    // Update the onboarding progress UI
    const userData = api.auth.getUserData();
    if (userData) {
        if (!userData.onboarding) userData.onboarding = {};
        userData.onboarding.status = 'revision_required';
        userData.onboarding.feedback = notification.message;
        userData.onboarding.updatedAt = notification.createdAt;
        localStorage.setItem('user', JSON.stringify(userData));
    }
    
    // Update the progress display
    updateOnboardingProgressDisplay(userData);
    
    // Show the revision modal with the feedback
    showRevisionModal(notification.message);
}

// Function to update UI for approval
function updateUIForApproval(notification) {
    // Show notification to the user
    showNotification('Your onboarding submission has been approved!', 'success');
    
    // Update the onboarding progress UI
    const userData = api.auth.getUserData();
    if (userData) {
        if (!userData.onboarding) userData.onboarding = {};
        userData.onboarding.status = 'approved';
        userData.onboarding.progress = 100;
        userData.onboarding.completedAt = notification.createdAt;
        localStorage.setItem('user', JSON.stringify(userData));
    }
    
    // Update the progress display
    updateOnboardingProgressDisplay(userData);
    
    // Show the approval modal with a welcome message
    showApprovalModal();
}

// Function to check for and display notifications
function checkForNotifications(email) {
    // Get notifications from localStorage
    let employeeNotifications = {};
    try {
        employeeNotifications = JSON.parse(localStorage.getItem('employeeNotifications')) || {};
    } catch (error) {
        console.error('Error parsing notifications:', error);
        return;
    }
    
    // Get notifications for this employee
    const notifications = employeeNotifications[email] || [];
    
    // If there are notifications, display them
    if (notifications && notifications.length > 0) {
        // Create notifications container if it doesn't exist
        let notificationCenter = document.querySelector('.notification-center');
        if (!notificationCenter) {
            notificationCenter = document.createElement('div');
            notificationCenter.className = 'notification-center';
            document.body.appendChild(notificationCenter);
        }
        
        // Display the most recent notification automatically
        const recentNotification = notifications[0];
        showNotification(recentNotification);
        
        // Add notifications to the notification center
        updateNotificationCenter(notificationCenter, notifications);
    }
    
    // Check for onboarding status updates specifically
    checkOnboardingStatus(email);
}

// Function to display a notification
function showNotification(notification) {
    // Create notification element
    const notificationElement = document.createElement('div');
    notificationElement.className = `notification ${notification.type}`;
    
    // Set icon based on notification type
    let icon = 'info-circle';
    if (notification.type === 'onboarding_approved') {
        icon = 'check-circle';
    } else if (notification.type === 'onboarding_revision') {
        icon = 'exclamation-circle';
    }
    
    // Set content
    notificationElement.innerHTML = `
        <div class="notification-header">
            <i class="fas fa-${icon}"></i>
            <h4>${notification.title}</h4>
            <button class="close-btn">&times;</button>
        </div>
        <div class="notification-body">
            <p>${notification.message}</p>
            ${notification.missingItems && notification.missingItems.length > 0 ? 
                `<div class="missing-items">
                    <p><strong>Missing Items:</strong></p>
                    <ul>
                        ${notification.missingItems.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>` : ''}
            <span class="notification-time">${formatDate(new Date(notification.date))}</span>
        </div>
    `;
    
    // Add to DOM
    document.body.appendChild(notificationElement);
    
    // Show with animation
    setTimeout(() => {
        notificationElement.classList.add('show');
    }, 100);
    
    // Add close button functionality
    const closeBtn = notificationElement.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        notificationElement.classList.remove('show');
        setTimeout(() => {
            notificationElement.remove();
        }, 300);
    });
    
    // Auto hide after 8 seconds
    setTimeout(() => {
        if (document.body.contains(notificationElement)) {
            notificationElement.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notificationElement)) {
                    notificationElement.remove();
                }
            }, 300);
        }
    }, 8000);
}

// Function to update the notification center with all notifications
function updateNotificationCenter(notificationCenter, notifications) {
    // Clear existing notifications
    notificationCenter.innerHTML = `
        <div class="notification-header">
            <h3>Notifications</h3>
            <button class="close-btn">&times;</button>
        </div>
        <div class="notification-list"></div>
    `;
    
    const notificationList = notificationCenter.querySelector('.notification-list');
    
    // Add each notification
    notifications.forEach(notification => {
        const notificationItem = document.createElement('div');
        notificationItem.className = `notification-item ${notification.type}`;
        
        // Set icon based on notification type
        let icon = 'info-circle';
        if (notification.type === 'onboarding_approved') {
            icon = 'check-circle';
        } else if (notification.type === 'onboarding_revision') {
            icon = 'exclamation-circle';
        }
        
        notificationItem.innerHTML = `
            <div class="notification-item-header">
                <i class="fas fa-${icon}"></i>
                <h4>${notification.title}</h4>
            </div>
            <div class="notification-item-body">
                <p>${notification.message}</p>
                ${notification.missingItems && notification.missingItems.length > 0 ? 
                    `<div class="missing-items">
                        <p><strong>Missing Items:</strong></p>
                        <ul>
                            ${notification.missingItems.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>` : ''}
                <span class="notification-time">${formatDate(new Date(notification.date))}</span>
            </div>
        `;
        
        notificationList.appendChild(notificationItem);
    });
    
    // Add close button functionality
    const closeBtn = notificationCenter.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        notificationCenter.classList.remove('show');
    });
    
    // Add toggle button to header if it doesn't exist
    let toggleButton = document.querySelector('.notification-toggle');
    if (!toggleButton) {
        toggleButton = document.createElement('button');
        toggleButton.className = 'notification-toggle';
        toggleButton.innerHTML = `
            <i class="fas fa-bell"></i>
            <span class="notification-count">${notifications.length}</span>
        `;
        
        // Add to header
        const header = document.querySelector('.header') || document.querySelector('header');
        if (header) {
            header.appendChild(toggleButton);
        } else {
            document.body.appendChild(toggleButton);
        }
        
        // Add toggle functionality
        toggleButton.addEventListener('click', () => {
            notificationCenter.classList.toggle('show');
        });
    } else {
        // Update count
        toggleButton.querySelector('.notification-count').textContent = notifications.length;
    }
}

// Function to check onboarding status and update UI accordingly
function checkOnboardingStatus(email) {
    // Get onboarding submissions
    let submissions = [];
    try {
        submissions = JSON.parse(localStorage.getItem('onboardingSubmissions')) || [];
    } catch (error) {
        console.error('Error parsing submissions:', error);
        return;
    }
    
    // Find this employee's submission
    const submission = submissions.find(s => s.email === email);
    if (!submission) return;
    
    // Update UI based on status
    const onboardingStatus = document.querySelector('#onboarding-status');
    if (onboardingStatus) {
        let statusText = '';
        let statusClass = '';
        
        switch(submission.status) {
            case 'pending':
                statusText = 'Pending HR Review';
                statusClass = 'pending';
                break;
            case 'approved':
                statusText = 'Approved';
                statusClass = 'approved';
                break;
            case 'revision_required':
                statusText = 'Revision Required';
                statusClass = 'warning';
                break;
            default:
                statusText = 'Pending Submission';
                statusClass = 'pending';
        }
        
        onboardingStatus.innerHTML = `
            <span class="status-badge ${statusClass}">${statusText}</span>
        `;
        
        // If revision required, show feedback
        if (submission.status === 'revision_required' && submission.feedback) {
            const feedbackContainer = document.querySelector('#feedback-container') || document.createElement('div');
            feedbackContainer.id = 'feedback-container';
            feedbackContainer.innerHTML = `
                <div class="alert warning">
                    <h4>Feedback from HR</h4>
                    <p>${submission.feedback}</p>
                    ${submission.missingItems && submission.missingItems.length > 0 ? 
                        `<div class="missing-items">
                            <p><strong>Missing Items:</strong></p>
                            <ul>
                                ${submission.missingItems.map(item => `<li>${item}</li>`).join('')}
                            </ul>
                        </div>` : ''}
                    <button class="btn primary-btn" onclick="window.location.href='onboarding.html'">Update Submission</button>
                </div>
            `;
            
            // Add to page if not already there
            if (!document.querySelector('#feedback-container')) {
                const dashboardContent = document.querySelector('.dashboard-content');
                if (dashboardContent) {
                    dashboardContent.insertBefore(feedbackContainer, dashboardContent.firstChild);
                } else {
                    document.body.appendChild(feedbackContainer);
                }
            }
        }
    }
}

// Helper function to format date
function formatDate(date) {
    const now = new Date();
    const diff = now - date;
    
    // If less than 24 hours, show relative time
    if (diff < 24 * 60 * 60 * 1000) {
        if (diff < 60 * 1000) {
            return 'Just now';
        } else if (diff < 60 * 60 * 1000) {
            const minutes = Math.floor(diff / (60 * 1000));
            return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        } else {
            const hours = Math.floor(diff / (60 * 60 * 1000));
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        }
    } else {
        // Otherwise show actual date
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    }
}

/**
 * Initialize offboarding functionality
 */
async function initializeOffboarding() {
    console.log('Initializing offboarding section...');
    
    // Check if user already has an offboarding process
    try {
        const response = await fetch('/api/offboarding-processes/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const startOffboardingBtn = document.querySelector('a[href="offboarding.html"]');
        
        if (response.ok) {
            const process = await response.json();
            console.log('Existing offboarding process found:', process);
            
            // User already has an offboarding process, update the button
            if (startOffboardingBtn) {
                startOffboardingBtn.textContent = 'View Offboarding Status';
                startOffboardingBtn.classList.add('view-status');
                
                // Add status indicator next to button
                const statusIndicator = document.createElement('div');
                statusIndicator.className = `status-badge ${process.data.status}`;
                statusIndicator.textContent = process.data.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                startOffboardingBtn.parentNode.insertBefore(statusIndicator, startOffboardingBtn.nextSibling);
            }
        } else if (response.status !== 404) {
            // Some error other than "not found"
            console.error('Error checking offboarding status:', await response.text());
        } else {
            // No offboarding process exists yet - this is normal
            console.log('No existing offboarding process found.');
            
            // Make sure the button says "Start Offboarding"
            if (startOffboardingBtn) {
                startOffboardingBtn.textContent = 'Start Offboarding';
                startOffboardingBtn.classList.remove('view-status');
            }
        }
    } catch (error) {
        console.error('Error checking offboarding status:', error);
    }
}

/**
 * Fetch users from the server
 * @param {Object} filters - Filters to apply to the user list
 * @returns {Promise<Array>} - A promise that resolves to an array of users
 */
async function fetchUsers(filters = {}) {
    try {
        // Try to load from the employee directory endpoint first (accessible to all users)
        try {
            const response = await fetch('/api/users/directory/employees', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && Array.isArray(data.data)) {
                    console.log(`Fetched ${data.data.length} employees from directory API`);
                    
                    // Apply any filters client-side
                    return filterEmployees(data.data, filters);
                }
            }
            
            throw new Error('Employee directory API returned invalid data');
        } catch (directoryError) {
            console.warn('Could not fetch from employee directory API:', directoryError);
            
            // If user has permission, try the regular users API
            try {
                // Build query string from filters
                const queryParams = new URLSearchParams();
                
                if (filters.department) {
                    queryParams.append('department', filters.department);
                }
                
                if (filters.position) {
                    queryParams.append('position', filters.position);
                }
                
                if (filters.search) {
                    queryParams.append('search', filters.search);
                }
                
                // Add pagination if needed
                queryParams.append('limit', '50'); // Get up to 50 users at once
                
                const response = await fetch(`/api/users?${queryParams.toString()}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const responseData = await response.json();
                    if (responseData.success && Array.isArray(responseData.data)) {
                        console.log(`Fetched ${responseData.data.length} employees from users API`);
                        return responseData.data;
                    }
                }
                
                throw new Error('Users API returned invalid data');
            } catch (usersError) {
                console.warn('Could not fetch from users API:', usersError);
                
                // Try using stored contacts from localStorage
                const storedContacts = localStorage.getItem('employeeContacts');
                if (storedContacts) {
                    try {
                        const contacts = JSON.parse(storedContacts);
                        if (Array.isArray(contacts) && contacts.length > 0) {
                            console.log(`Using ${contacts.length} stored employee contacts`);
                            return filterEmployees(contacts, filters);
                        }
                    } catch (parseError) {
                        console.error('Error parsing stored contacts:', parseError);
                    }
                }
                
                // As a last resort, fall back to mock data
                const mockEmployees = getMockEmployeeData();
                console.log('Using mock employee data as fallback');
                return filterEmployees(mockEmployees, filters);
            }
        }
    } catch (error) {
        console.error('Error fetching users from database:', error);
        // Show notification to user
        showNotification('Failed to load employee data', 'error');
        return [];
    }
}

/**
 * Filter employees based on provided filters
 * @param {Array} employees - Array of employee objects
 * @param {Object} filters - Filters to apply
 * @returns {Array} - Filtered array of employees
 */
function filterEmployees(employees, filters = {}) {
    console.log(`Filtering ${employees.length} employees with filters:`, filters);
    
    if (filters.department) {
        console.log(`Looking for employees with department matching "${filters.department}" (case-insensitive)`);
    }
    
    const filtered = employees.filter(employee => {
        // Debug each employee's department
        const employeeDept = (employee.department || '').toUpperCase();
        const matchesDepartment = !filters.department || employeeDept === filters.department.toUpperCase();
        
        // Department filter - case insensitive comparison
        if (filters.department && !matchesDepartment) {
            return false;
        }
        
        // Position/role filter
        if (filters.position && employee.position !== filters.position) {
            return false;
        }
        
        // Search filter 
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            const employeeName = employee.name ? employee.name.toLowerCase() : '';
            const employeeEmail = employee.email ? employee.email.toLowerCase() : '';
            const employeePosition = employee.position ? employee.position.toLowerCase() : '';
            const employeeDepartment = employee.department ? employee.department.toLowerCase() : '';
            
            if (!employeeName.includes(searchTerm) && 
                !employeeEmail.includes(searchTerm) && 
                !employeePosition.includes(searchTerm) && 
                !employeeDepartment.includes(searchTerm)) {
                return false;
            }
        }
        
        return true;
    });
    
    console.log(`Filter result: ${filtered.length} employees match the criteria`);
    return filtered;
}

/**
 * Get mock employee data as a fallback
 * @returns {Array} - Array of mock employee objects
 */
function getMockEmployeeData() {
    // Check if there are stored employees first
    const stored = localStorage.getItem('recentEmployees');
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        } catch (e) {}
    }
    
    return [
        { 
            _id: 'user1', 
            name: 'John Doe',
            email: 'john.doe@company.com',
            department: 'Engineering', 
            position: 'Software Engineer'
        },
        { 
            _id: 'user2', 
            name: 'Jane Smith',
            email: 'jane.smith@company.com',
            department: 'HR', 
            position: 'HR Specialist'
        },
        { 
            _id: 'user3', 
            name: 'Bob Johnson',
            email: 'bob.johnson@company.com',
            department: 'IT', 
            position: 'IT Support'
        },
        { 
            _id: 'user4', 
            name: 'Alice Williams',
            email: 'alice.williams@company.com',
            department: 'Marketing', 
            position: 'Marketing Manager'
        },
        { 
            _id: 'user5', 
            name: 'Charlie Brown',
            email: 'charlie.brown@company.com',
            department: 'Sales', 
            position: 'Sales Representative'
        }
    ];
}

/**
 * Load users for the dropdown based on type
 * @param {string} type - The type of users to load ('employees', 'hr', or 'it')
 */
async function loadUsersForDropdown(type) {
    const selectId = type === 'employees' ? 'employee-select' : 
                     type === 'hr' ? 'hr-select' : 'it-select';
    const selectEl = document.getElementById(selectId);
    
    if (!selectEl) return;
    
    // Clear options except the first one
    while (selectEl.options.length > 1) {
        selectEl.remove(1);
    }
    
    // Add loading option
    const loadingOption = document.createElement('option');
    loadingOption.textContent = 'Loading...';
    loadingOption.disabled = true;
    selectEl.appendChild(loadingOption);
    
    try {
        // Fetch users based on type
        let users = [];
        const filters = {};
        
        if (type === 'hr') {
            filters.department = 'HR';
        } else if (type === 'it') {
            filters.department = 'IT';
        }
        
        // Fetch users from API
        users = await fetchUsers(filters);
        
        // Remove loading option
        selectEl.remove(selectEl.options.length - 1);
        
        // Add options for each user
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user._id;
            option.textContent = `${user.name} (${user.position || user.department})`;
            
            // Store email as data attribute for message functionality
            option.setAttribute('data-email', user.email);
            
            selectEl.appendChild(option);
        });
        
        if (users.length === 0) {
            const noUsersOption = document.createElement('option');
            noUsersOption.value = '';
            noUsersOption.textContent = `No ${type} available`;
            noUsersOption.disabled = true;
            selectEl.appendChild(noUsersOption);
        }
        
    } catch (error) {
        console.error(`Error loading ${type}:`, error);
        
        // Remove loading option
        selectEl.remove(selectEl.options.length - 1);
        
        // Add error option
        const errorOption = document.createElement('option');
        errorOption.value = '';
        errorOption.textContent = 'Error loading users';
        errorOption.disabled = true;
        selectEl.appendChild(errorOption);
    }
}

// Listen for employee creation events via localStorage
window.addEventListener('storage', function(event) {
    // Check if the event is for new employee creation
    if (event.key === 'newEmployeeCreated') {
        try {
            // Parse the new employee data
            const newEmployee = JSON.parse(event.newValue);
            
            // If it's a valid employee object, add it to stored employee contacts
            if (newEmployee && newEmployee._id && newEmployee.name) {
                updateStoredEmployeeContacts(newEmployee);
                
                // Refresh the contacts dropdown
                loadEmployeeContacts();
                
                console.log('Added new employee to contacts:', newEmployee.name);
            }
        } catch (error) {
            console.error('Error processing new employee event:', error);
        }
    }
});

/**
 * Update stored employee contacts with a new employee
 * @param {Object} newEmployee - The new employee to add to stored contacts
 */
function updateStoredEmployeeContacts(newEmployee) {
    try {
        // Get existing stored contacts
        let storedContacts = [];
        const stored = localStorage.getItem('employeeContacts');
        if (stored) {
            try {
                storedContacts = JSON.parse(stored);
                if (!Array.isArray(storedContacts)) {
                    storedContacts = [];
                }
            } catch (e) {
                storedContacts = [];
            }
        }
        
        // Check if employee already exists by ID
        const existingIndex = storedContacts.findIndex(emp => emp._id === newEmployee._id);
        
        if (existingIndex >= 0) {
            // Update existing employee
            storedContacts[existingIndex] = {...storedContacts[existingIndex], ...newEmployee};
        } else {
            // Add new employee
            storedContacts.push(newEmployee);
        }
        
        // Save back to localStorage
        localStorage.setItem('employeeContacts', JSON.stringify(storedContacts));
        
        // Also update recent employees
        updateRecentEmployees(newEmployee);
    } catch (error) {
        console.error('Error updating stored employee contacts:', error);
    }
}

/**
 * Update recent employees list
 * @param {Object} employee - The employee to add to recent list
 */
function updateRecentEmployees(employee) {
    try {
        // Get existing recent employees
        let recentEmployees = [];
        const stored = localStorage.getItem('recentEmployees');
        if (stored) {
            try {
                recentEmployees = JSON.parse(stored);
                if (!Array.isArray(recentEmployees)) {
                    recentEmployees = [];
                }
            } catch (e) {
                recentEmployees = [];
            }
        }
        
        // Remove employee if already in list
        recentEmployees = recentEmployees.filter(emp => emp._id !== employee._id);
        
        // Add to beginning of list
        recentEmployees.unshift(employee);
        
        // Limit to 20 recent employees
        if (recentEmployees.length > 20) {
            recentEmployees = recentEmployees.slice(0, 20);
        }
        
        // Save back to localStorage
        localStorage.setItem('recentEmployees', JSON.stringify(recentEmployees));
    } catch (error) {
        console.error('Error updating recent employees:', error);
    }
}

/**
 * Load any stored employee contacts from localStorage
 * This is used to ensure employee contacts are available even when API access is restricted
 */
function loadStoredEmployeeContacts() {
    try {
        // Try to load from API first using our new endpoint that's accessible to all users
        fetch('/api/users/directory/employees', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Failed to load employee directory');
        })
        .then(data => {
            if (data.success && Array.isArray(data.data)) {
                // Store the employee data in localStorage
                localStorage.setItem('employeeContacts', JSON.stringify(data.data));
                console.log(`Loaded ${data.data.length} employees from API`);
                
                // Refresh the employee contacts dropdown immediately
                loadEmployeeContacts();
            }
        })
        .catch(error => {
            console.warn('Could not load employee directory from API, using stored contacts:', error);
            
            // Try using stored contacts if available
            const storedContacts = localStorage.getItem('employeeContacts');
            if (storedContacts) {
                try {
                    const contacts = JSON.parse(storedContacts);
                    if (Array.isArray(contacts) && contacts.length > 0) {
                        console.log(`Using ${contacts.length} stored employee contacts`);
                        return;
                    }
                } catch (e) {
                    console.error('Error parsing stored contacts:', e);
                }
            }
            
            // Fall back to mock data if needed
            const mockEmployees = getMockEmployeeData();
            if (mockEmployees.length > 0) {
                localStorage.setItem('employeeContacts', JSON.stringify(mockEmployees));
                console.log(`Added ${mockEmployees.length} mock employees as fallback`);
                
                // Refresh the employee contacts dropdown with mock data
                loadEmployeeContacts();
            }
        });
    } catch (error) {
        console.error('Error loading stored employee contacts:', error);
    }
}

/**
 * Add an employee to the recent contacts list
 * @param {Object} employee - The employee object to add
 */
function addRecentEmployee(employee) {
    if (!employee || !employee.name || !employee.email) {
        console.warn('Invalid employee data provided to addRecentEmployee');
        return;
    }
    
    try {
        // Get existing recent employees
        let recentEmployees = getRecentEmployees();
        
        // Check if this employee is already in the list
        const existingIndex = recentEmployees.findIndex(e => e.email === employee.email);
        if (existingIndex !== -1) {
            // Remove the existing entry so we can move it to the top
            recentEmployees.splice(existingIndex, 1);
        }
        
        // Make sure we have the essential fields
        const essentialEmployee = {
            name: employee.name,
            email: employee.email,
            department: employee.department || '',
            position: employee.position || '',
            phone: employee.phone || ''
        };
        
        // Add to the beginning of the array
        recentEmployees.unshift(essentialEmployee);
        
        // Keep only the last 10 recent contacts
        if (recentEmployees.length > 10) {
            recentEmployees = recentEmployees.slice(0, 10);
        }
        
        // Save back to localStorage
        localStorage.setItem('recentEmployees', JSON.stringify(recentEmployees));
        
        // Update UI if needed
        updateRecentContactsUI();
        
        // Also make sure this employee is in the employeeContacts list
        let employeeContacts = getStoredEmployeeContacts();
        if (!employeeContacts.some(e => e.email === employee.email)) {
            employeeContacts.push(essentialEmployee);
            localStorage.setItem('employeeContacts', JSON.stringify(employeeContacts));
        }
    } catch (error) {
        console.error('Error adding recent employee:', error);
    }
}

/**
 * Get stored employee contacts from localStorage
 * @returns {Array} - Array of employee objects
 */
function getStoredEmployeeContacts() {
    try {
        const storedContacts = localStorage.getItem('employeeContacts');
        if (storedContacts) {
            const contacts = JSON.parse(storedContacts);
            if (Array.isArray(contacts)) {
                return contacts;
            }
        }
    } catch (error) {
        console.error('Error retrieving stored employee contacts:', error);
    }
    return [];
}

/**
 * Get recent employees from localStorage
 * @returns {Array} - Array of recent employee objects
 */
function getRecentEmployees() {
    try {
        const recentEmployees = localStorage.getItem('recentEmployees');
        if (recentEmployees) {
            const employees = JSON.parse(recentEmployees);
            if (Array.isArray(employees)) {
                return employees;
            }
        }
    } catch (error) {
        console.error('Error retrieving recent employees:', error);
    }
    return [];
}

/**
 * Update the recent contacts UI in the dashboard
 */
function updateRecentContactsUI() {
    const recentContactsContainer = document.getElementById('recentContactsContainer');
    if (!recentContactsContainer) return;
    
    const recentEmployees = getRecentEmployees();
    
    // Clear existing content
    recentContactsContainer.innerHTML = '';
    
    if (recentEmployees.length === 0) {
        recentContactsContainer.innerHTML = '<p class="text-muted">No recent contacts</p>';
        return;
    }
    
    // Create a list of recent contacts
    const list = document.createElement('ul');
    list.className = 'list-unstyled';
    
    recentEmployees.forEach(employee => {
        const item = document.createElement('li');
        item.className = 'mb-2';
        
        const contactLink = document.createElement('a');
        contactLink.href = '#';
        contactLink.className = 'd-flex align-items-center text-decoration-none';
        contactLink.onclick = (e) => {
            e.preventDefault();
            initiateEmployeeContact(employee);
        };
        
        // Create avatar or initials
        const avatar = document.createElement('div');
        avatar.className = 'avatar-sm me-2 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center';
        avatar.style.width = '32px';
        avatar.style.height = '32px';
        
        // Get initials from name
        const initials = employee.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
        
        avatar.textContent = initials;
        
        // Employee info
        const info = document.createElement('div');
        info.className = 'flex-grow-1';
        
        const name = document.createElement('div');
        name.className = 'fw-bold';
        name.textContent = employee.name;
        
        const position = document.createElement('div');
        position.className = 'small text-muted';
        position.textContent = employee.position || employee.department || '';
        
        info.appendChild(name);
        info.appendChild(position);
        
        contactLink.appendChild(avatar);
        contactLink.appendChild(info);
        item.appendChild(contactLink);
        list.appendChild(item);
    });
    
    recentContactsContainer.appendChild(list);
}

/**
 * Load stored employee contacts when the dashboard loads
 * This ensures we have employee data even if API access is restricted
 */
async function loadStoredEmployeeContacts() {
    console.log('Loading stored employee contacts...');
    
    try {
        // Try to fetch from the employee directory API first
        const response = await fetch('/api/users/directory/employees', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && Array.isArray(data.data)) {
                console.log(`Loaded ${data.data.length} employee contacts from directory API`);
                
                // Store the contacts in localStorage for future use
                localStorage.setItem('employeeContacts', JSON.stringify(data.data));
                
                // If we have any recent employees, make sure they're using the updated data
                updateRecentEmployeesData(data.data);
                
                return data.data;
            } else {
                console.warn('Employee directory API returned invalid data format');
            }
        } else {
            console.warn(`Failed to load employee contacts from API: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        console.warn('Error fetching employee contacts from API:', error);
    }
    
    // If API call failed, check if we have stored contacts
    const storedContacts = localStorage.getItem('employeeContacts');
    if (storedContacts) {
        try {
            const contacts = JSON.parse(storedContacts);
            if (Array.isArray(contacts) && contacts.length > 0) {
                console.log(`Using ${contacts.length} stored employee contacts from localStorage`);
                return contacts;
            }
        } catch (parseError) {
            console.error('Error parsing stored contacts:', parseError);
        }
    }
    
    // If no stored contacts or invalid format, add mock employees as fallback
    console.log('No stored employee contacts found, adding mock data as fallback');
    const mockEmployees = getMockEmployeeData();
    localStorage.setItem('employeeContacts', JSON.stringify(mockEmployees));
    return mockEmployees;
}

/**
 * Update recent employees data with fresh information
 * @param {Array} currentEmployees - Current employee data from API
 */
function updateRecentEmployeesData(currentEmployees) {
    try {
        const recentEmployees = getRecentEmployees();
        if (recentEmployees.length === 0) return;
        
        let updated = false;
        
        // Update recent employees with fresh data
        for (let i = 0; i < recentEmployees.length; i++) {
            const recent = recentEmployees[i];
            const current = currentEmployees.find(e => e.email === recent.email);
            
            if (current) {
                // Update with fresh data
                recentEmployees[i] = {
                    ...recentEmployees[i],
                    name: current.name,
                    department: current.department || recentEmployees[i].department,
                    position: current.position || recentEmployees[i].position,
                    phone: current.phone || recentEmployees[i].phone
                };
                updated = true;
            }
        }
        
        if (updated) {
            localStorage.setItem('recentEmployees', JSON.stringify(recentEmployees));
            updateRecentContactsUI();
        }
    } catch (error) {
        console.error('Error updating recent employees data:', error);
    }
}

/**
 * Initiate contact with an employee
 * @param {Object} employee - The employee to contact
 */
function initiateEmployeeContact(employee) {
    if (!employee || !employee.email) {
        console.warn('Invalid employee data for contact');
        return;
    }
    
    // Add to recent contacts
    addRecentEmployee(employee);
    
    // Populate the communication form with employee details
    const communicationModal = document.getElementById('communicationModal');
    if (communicationModal) {
        // Find form elements
        const recipientInput = communicationModal.querySelector('#communicationRecipient');
        const recipientNameDisplay = communicationModal.querySelector('#recipientName');
        const recipientInfoDisplay = communicationModal.querySelector('#recipientInfo');
        
        if (recipientInput) {
            recipientInput.value = employee.email;
        }
        
        if (recipientNameDisplay) {
            recipientNameDisplay.textContent = employee.name;
        }
        
        if (recipientInfoDisplay) {
            const info = [];
            if (employee.position) info.push(employee.position);
            if (employee.department) info.push(employee.department);
            recipientInfoDisplay.textContent = info.join(' • ');
        }
        
        // Show the modal
        const bsModal = new bootstrap.Modal(communicationModal);
        bsModal.show();
    } else {
        console.warn('Communication modal not found in the DOM');
        
        // As a fallback, open mailto link
        window.location.href = `mailto:${employee.email}?subject=Message from Dashboard`;
    }
}

/**
 * Load department contacts (HR or IT)
 * @param {string} department - The department to load ('hr' or 'it')
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
        // Get current user's data to determine their department
        const userData = JSON.parse(localStorage.getItem('userData')) || {};
        const userDepartment = userData.department || '';
        console.log(`Current user's department: ${userDepartment}`);
        
        // Fetch all users first
        console.log(`Fetching ${departmentId.toUpperCase()} users from directory API...`);
        const allUsers = await fetchUsers();
        
        // Debug: Print all user departments to console
        console.log('All users and their departments:');
        allUsers.forEach(user => {
            console.log(`${user.name}: ${user.department || 'No department'} (${user.email})`);
        });
        
        // Explicitly filter for the specific department - use strict comparison
        let users = [];
        if (departmentId === 'hr') {
            // Filter for HR staff only
            users = allUsers.filter(user => 
                (user.department || '').toUpperCase() === 'HR'
            );
            console.log(`Filtered ${allUsers.length} users to ${users.length} HR staff members`);
        } else if (departmentId === 'it') {
            // Filter for IT staff only - much stricter filtering
            users = allUsers.filter(user => {
                // Check department is IT
                const isITDept = (user.department || '').toUpperCase() === 'IT';
                
                // Check position indicates an IT admin role (not just a regular employee)
                const pos = (user.position || '').toLowerCase();
                const isAdmin = pos.includes('admin') || 
                               pos.includes('support') || 
                               pos.includes('specialist') || 
                               pos.includes('tech') || 
                               pos.includes('manager') ||
                               pos.includes('helpdesk') ||
                               pos.includes('developer');
                
                // For debugging - add more details about the filtering
                console.log(`IT check: ${user.name} - Dept:${isITDept}, Admin:${isAdmin}, Position:"${pos}"`);
                
                // Only include if both conditions are met
                return isITDept && isAdmin;
            });
            console.log(`Filtered ${allUsers.length} users to ${users.length} IT administrators`);
        } else {
            users = [];
        }
        
        if (!users || users.length === 0) {
            console.log(`No ${departmentId.toUpperCase()} staff found, showing default message`);
            
            // For IT section, if no IT admins found, add a default IT admin
            if (departmentId === 'it') {
                console.log("Adding default IT administrator contact");
                
                // Clear dropdown options
                while (dropdown.options.length > 0) {
                    dropdown.remove(0);
                }
                
                // Add default IT admin option
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
                
                // Add click event to message button
                const messageBtn = infoContainer.querySelector('.message-btn');
                if (messageBtn) {
                    messageBtn.addEventListener('click', function() {
                        // Open email
                        window.location.href = 'mailto:it-support@company.com?subject=IT Support Request';
                    });
                }
                
                return;
            }
            
            // If no users found, show a message
            infoContainer.innerHTML = `<p>No ${departmentId.toUpperCase()} staff contacts available.</p>`;
            return;
        }
        
        console.log(`Found ${users.length} ${departmentId.toUpperCase()} staff members`);
        
        // For IT section, ensure there's at least one IT admin contact
        if (departmentId === 'it' && users.length === 0) {
            // Add a default IT administrator contact
            users = [{
                _id: 'it-admin',
                name: 'IT Administrator',
                email: 'it-support@company.com',
                position: 'IT Support Specialist',
                department: 'IT'
            }];
            console.log('Added default IT administrator contact');
        }
        
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
            
            // Add click event to message button
            const messageBtn = infoContainer.querySelector('.message-btn');
            if (messageBtn) {
                messageBtn.addEventListener('click', function() {
                    const email = this.getAttribute('data-email');
                    const name = this.getAttribute('data-name');
                    
                    // Open communication modal or directly open message panel
                    const messagePanel = document.getElementById(`${departmentId}-message-panel`);
                    if (messagePanel) {
                        // Show message panel
                        document.querySelectorAll('.message-panel').forEach(p => p.style.display = 'none');
                        messagePanel.style.display = 'block';
                        
                        // If there's a dropdown for selecting the recipient, select this user
                        const selectEl = document.getElementById(`${departmentId}-select`);
                        if (selectEl) {
                            // Find option with matching email
                            for (let i = 0; i < selectEl.options.length; i++) {
                                const option = selectEl.options[i];
                                if (option.getAttribute('data-email') === email) {
                                    selectEl.selectedIndex = i;
                                    break;
                                }
                            }
                        }
                        
                        // Set focus to message textarea
                        const messageInput = document.getElementById(`${departmentId}-message`);
                        if (messageInput) {
                            messageInput.focus();
                        }
                    } else {
                        // Fallback to mailto
                        window.location.href = `mailto:${email}?subject=Message for ${departmentId.toUpperCase()} Department`;
                    }
                });
            }
        });
        
        // Also populate the message dropdown
        const messageSelect = document.getElementById(`${departmentId}-select`);
        if (messageSelect) {
            // Clear existing options (except the first one)
            while (messageSelect.options.length > 1) {
                messageSelect.remove(1);
            }
            
            // Add users to the message dropdown
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user._id || '';
                option.text = user.name || '';
                option.setAttribute('data-email', user.email || '');
                messageSelect.appendChild(option);
            });
        }
        
    } catch (error) {
        console.error(`Error loading ${departmentId.toUpperCase()} department contacts:`, error);
    }
}

/**
 * Listen for changes in employee data and update department contacts if needed
 */
function setupDepartmentContactsUpdater() {
    // Listen for storage events for new employee creation
    window.addEventListener('storage', function(event) {
        if (event.key === 'newEmployeeCreated') {
            try {
                const newEmployee = JSON.parse(event.newValue);
                if (newEmployee && newEmployee.department) {
                    // If it's an HR or IT staff member, update the relevant department contacts
                    const dept = newEmployee.department.toUpperCase();
                    if (dept === 'HR') {
                        loadDepartmentContacts('hr');
                    } else if (dept === 'IT') {
                        loadDepartmentContacts('it');
                    }
                }
            } catch (error) {
                console.error('Error processing new employee event for departments:', error);
            }
        }
    });
}

