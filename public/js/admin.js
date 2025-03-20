/* filepath: /c:/Users/sujan/Desktop/OnboardX/Frontend/base/admin_dashboard.js */
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
        // Notifications are disabled
        console.log('Notifications are disabled');
        
        // Keep only the send reminder button functionality if it exists
        const sendReminderBtn = document.querySelector('.send-reminder');
        if (sendReminderBtn) {
            sendReminderBtn.addEventListener('click', function() {
                this.classList.add('loading');
                
                setTimeout(() => {
                    this.classList.remove('loading');
                    // Use showNotification instead of addNotification for in-app notifications only
                    showNotification('Reminders sent successfully to all pending employees!', 'success');
                }, 1500);
            });
        }
        
        // Remove existing notification feed if it exists
        const existingFeed = document.getElementById('notification-feed');
        if (existingFeed) {
            existingFeed.remove();
        }
        
        // No sample notifications will be added
    }

    function addNotification(message) {
        // This function is now disabled
        console.log('Notification suppressed:', message);
        // No notifications will be displayed
    }

    function initializeTaskManagement() {
        const taskLists = document.querySelectorAll('.task-list');
        
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
                    const actionRequired = document.querySelector('#reject-form input').value;
                    
                    if (!reason || !actionRequired) {
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
                            notes: `Rejected: ${reason}. Action required: ${actionRequired}`
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
});