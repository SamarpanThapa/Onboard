document.addEventListener('DOMContentLoaded', async function() {
    console.log('Dashboard loaded');
    
    // Check if user is authenticated
    if (!api.auth.isAuthenticated()) {
        window.location.href = '/index.html';
        return;
    }
    
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
                    // Mark task as completed via API
                    await api.tasks.updateTask(taskId, { status: 'completed' });
                    
                    // Update UI
                    taskContent.style.textDecoration = 'line-through';
                    taskContent.style.opacity = '0.6';
                    
                    // Send notification to HR that task is completed
                    await api.notifications.createNotification({
                        title: 'Task Completed',
                        message: `Task "${taskTitle}" has been completed.`,
                        type: 'task',
                        recipients: ['hr_admin']
                    });
                    
                    // Show notification
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
    const sendMessageBtn = document.getElementById('send-message-btn');
    const messageInput = document.getElementById('message-input');
    const messagesContainer = document.querySelector('.messages-list');
    
    if (sendMessageBtn && messageInput) {
        sendMessageBtn.addEventListener('click', async function() {
            const message = messageInput.value.trim();
            if (!message) return;
            
            try {
                // Send message via API
                await api.messages.sendMessage({
                    message: message,
                    type: 'question',
                    category: 'onboarding'
                });
                
                // Add message to UI
                addMessageToUI('sent', message);
                
                // Clear input
                messageInput.value = '';
                
                // Send notification to HR and IT about the new message
                await api.notifications.createNotification({
                    title: 'New Message Received',
                    message: 'An employee has sent a new message that may require your attention.',
                    type: 'system',
                    recipients: ['hr_admin', 'it_admin']
                });
                
                // Show acknowledgment message
                setTimeout(() => {
                    addMessageToUI('received', 'Thank you for your message. An HR or IT team member will respond shortly.', 'System');
                }, 1000);
                
            } catch (error) {
                console.error('Error sending message:', error);
                showNotification('Failed to send message. Please try again.', 'error');
            }
        });
        
        // Enter key to send message
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessageBtn.click();
            }
        });
    }
    
    // Load past messages if container exists
    if (messagesContainer) {
        loadPastMessages(messagesContainer);
    }
}

/**
 * Load past messages from API
 */
async function loadPastMessages(container) {
    try {
        // Show loading state
        container.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> Loading messages...</div>';
        
        // Get messages from API
        const messages = await api.messages.getMessages();
        
        if (messages.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-comments"></i><p>No messages yet. Start a conversation!</p></div>';
            return;
        }
        
        // Clear loading indicator
        container.innerHTML = '';
        
        // Add messages to UI
        messages.forEach(msg => {
            const type = msg.sender._id === JSON.parse(localStorage.getItem('user') || '{}')._id ? 'sent' : 'received';
            const sender = type === 'received' ? `${msg.sender.firstName} ${msg.sender.lastName}` : null;
            addMessageToUI(type, msg.message, sender, new Date(msg.createdAt));
        });
        
        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
        
    } catch (error) {
        console.error('Error loading messages:', error);
        container.innerHTML = '<div class="error-message"><i class="fas fa-exclamation-triangle"></i> Failed to load messages. Please refresh the page.</div>';
    }
}

/**
 * Add a message to the UI
 */
function addMessageToUI(type, message, sender = null, timestamp = new Date()) {
    const container = document.querySelector('.messages-list');
    if (!container) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = `message message-${type}`;
    
    const formattedTime = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageElement.innerHTML = `
        <div class="message-content">
            ${sender ? `<div class="message-sender">${sender}</div>` : ''}
            <div class="message-text">${message}</div>
            <div class="message-time">${formattedTime}</div>
        </div>
    `;
    
    container.appendChild(messageElement);
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

/**
 * Initialize help buttons
 */
function initializeHelpButtons() {
    const helpButtons = document.querySelectorAll('.help-btn, .support-btn');
    
    helpButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            openSupportDialog();
        });
    });
}

/**
 * Open support dialog
 */
function openSupportDialog() {
    // Create modal if it doesn't exist
    if (!document.getElementById('support-modal')) {
        const modal = document.createElement('div');
        modal.id = 'support-modal';
        modal.className = 'modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Need Help?</h3>
                    <button class="modal-close"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <p>Select a category for your help request:</p>
                    <div class="help-categories">
                        <button class="help-category" data-category="it">
                            <i class="fas fa-laptop"></i>
                            <span>IT Support</span>
                        </button>
                        <button class="help-category" data-category="hr">
                            <i class="fas fa-users"></i>
                            <span>HR Questions</span>
                        </button>
                        <button class="help-category" data-category="onboarding">
                            <i class="fas fa-clipboard-list"></i>
                            <span>Onboarding Process</span>
                        </button>
                        <button class="help-category" data-category="other">
                            <i class="fas fa-question-circle"></i>
                            <span>Other</span>
                        </button>
                    </div>
                    <div class="help-form" style="display: none;">
                        <input type="hidden" id="help-category">
        <div class="form-group">
                            <label for="help-subject">Subject</label>
                            <input type="text" id="help-subject" placeholder="Brief description of your issue">
        </div>
        <div class="form-group">
                            <label for="help-description">Description</label>
                            <textarea id="help-description" placeholder="Please provide details about your issue"></textarea>
        </div>
        <div class="form-group">
                            <label>Priority</label>
                            <div class="priority-options">
                                <label class="priority-option">
                                    <input type="radio" name="priority" value="low" checked>
                                    <span>Low</span>
                                </label>
                                <label class="priority-option">
                                    <input type="radio" name="priority" value="medium">
                                    <span>Medium</span>
                                </label>
                                <label class="priority-option">
                                    <input type="radio" name="priority" value="high">
                                    <span>High</span>
                                </label>
                            </div>
                        </div>
                        <button id="submit-help-request" class="btn-primary">Submit Request</button>
                        <button class="btn-secondary back-to-categories">Back to Categories</button>
                    </div>
                </div>
        </div>
    `;
    
        document.body.appendChild(modal);
        
        // Close button
        const closeButton = modal.querySelector('.modal-close');
        closeButton.addEventListener('click', () => {
            modal.classList.remove('active');
        });
        
        // Category selection
        const categories = modal.querySelectorAll('.help-category');
        const helpForm = modal.querySelector('.help-form');
        const categoriesContainer = modal.querySelector('.help-categories');
        const helpCategoryInput = document.getElementById('help-category');
        
        categories.forEach(category => {
            category.addEventListener('click', () => {
                const categoryType = category.dataset.category;
                helpCategoryInput.value = categoryType;
                categoriesContainer.style.display = 'none';
                helpForm.style.display = 'block';
            });
        });
        
        // Back button
        const backButton = modal.querySelector('.back-to-categories');
        backButton.addEventListener('click', () => {
            helpForm.style.display = 'none';
            categoriesContainer.style.display = 'flex';
        });
        
        // Submit help request
        const submitButton = modal.querySelector('#submit-help-request');
        submitButton.addEventListener('click', async () => {
            const category = document.getElementById('help-category').value;
            const subject = document.getElementById('help-subject').value;
            const description = document.getElementById('help-description').value;
            const priority = document.querySelector('input[name="priority"]:checked').value;
            
            if (!subject || !description) {
                showNotification('Please fill in all required fields', 'error');
                return;
            }
        
            try {
                // Send support ticket via API
                await api.supportTickets.createTicket({
                    category,
                    title: subject,
                    description,
                    priority
                });
                
                // Determine recipient based on category
                let recipient = 'hr_admin'; // Default
                
                if (category === 'it' || category === 'other') {
                    recipient = 'it_admin';
                }
                
                // Send notification to appropriate department
                await api.notifications.createNotification({
                    title: 'New Support Ticket',
                    message: `A new ${priority} priority support ticket has been created: ${subject}`,
                    type: 'system',
                    recipients: [recipient]
                });
                
                showNotification('Support request submitted successfully!', 'success');
                modal.classList.remove('active');
                
                // Clear form
                document.getElementById('help-subject').value = '';
                document.getElementById('help-description').value = '';
                document.querySelector('input[name="priority"][value="low"]').checked = true;
                
            } catch (error) {
                console.error('Error submitting support request:', error);
                showNotification('Failed to submit support request. Please try again.', 'error');
            }
        });
    }
    
    // Show modal
    const modal = document.getElementById('support-modal');
    modal.classList.add('active');
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

