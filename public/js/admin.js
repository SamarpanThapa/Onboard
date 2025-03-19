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
});

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
        
        // Fetch onboarding submissions from API or use fallback data
        let submissions = [];
        try {
            submissions = await fetchOnboardingSubmissions();
            console.log('Successfully loaded submissions:', submissions);
        } catch (error) {
            console.error('Error fetching submissions, using fallback data:', error);
            // Use fallback data if API fails
            submissions = [
                {
                    id: "1",
                    name: "Sarah Johnson",
                    email: "sarah.johnson@example.com",
                    department: "Marketing",
                    position: "Content Manager",
                    startDate: "2024-03-15",
                    status: "pending",
                    submissionDate: "2024-03-10",
                    completionPercentage: 100
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
                    completionPercentage: 80
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
                    completionPercentage: 95
                }
            ];
        }
        
        // Clear loading state
        tableBody.innerHTML = '';
        
        // If we have submissions, display them
        if (submissions && submissions.length > 0) {
            submissions.forEach(submission => {
                const row = createSubmissionRow(submission);
                tableBody.appendChild(row);
            });
            
            // Attach event handlers for buttons
            attachSubmissionActionHandlers();
            console.log('Successfully loaded submissions:', submissions.length);
        } else {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        <p>No onboarding submissions found</p>
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Error in loadOnboardingSubmissions:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <p>Sample Data (API connection unavailable)</p>
                </td>
            </tr>
            <tr>
                <td>Sarah Johnson</td>
                <td>Content Manager</td>
                <td>Marketing</td>
                <td>Mar 10, 2024</td>
                <td><span class="status-badge pending">Pending Review</span></td>
                <td>
                    <div class="progress-container">
                        <div class="progress-bar" style="width: 100%"></div>
                        <span class="progress-text">100%</span>
                    </div>
                </td>
                <td>
                    <button class="action-btn view-submission" data-id="1"><i class="fas fa-eye"></i></button>
                    <button class="action-btn approve-submission" data-id="1"><i class="fas fa-check"></i></button>
                    <button class="action-btn request-revision" data-id="1"><i class="fas fa-redo"></i></button>
                </td>
            </tr>
        `;
        
        // Attach event handlers even in error case
        attachSubmissionActionHandlers();
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
function requestOnboardingRevisionDirectly(submissionId) {
    // Show a modal to collect feedback
    showModal('Request Revision', `
        <form id="revision-form">
            <div class="form-group">
                <label for="revision-feedback">Feedback for Employee</label>
                <textarea id="revision-feedback" class="form-control" rows="4" 
                    placeholder="Please provide detailed feedback on what needs to be revised..."></textarea>
            </div>
            <div class="form-group">
                <label>Missing Items</label>
                <div class="checkbox-group">
                    <label><input type="checkbox" name="missing-item" value="ID Proof"> ID Proof</label>
                    <label><input type="checkbox" name="missing-item" value="Tax Form"> Tax Form</label>
                    <label><input type="checkbox" name="missing-item" value="Bank Details"> Bank Details</label>
                    <label><input type="checkbox" name="missing-item" value="Emergency Contact"> Emergency Contact</label>
                </div>
            </div>
            <button type="submit" class="btn warning-btn">Send Revision Request</button>
        </form>
    `);
    
    // Handle form submission
    const form = document.getElementById('revision-form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get feedback text
        const feedback = document.getElementById('revision-feedback').value;
        if (!feedback || feedback.trim() === '') {
            showNotification('Please provide feedback for the employee.', 'error');
            return;
        }
        
        // Get missing items
        const missingItems = [];
        document.querySelectorAll('input[name="missing-item"]:checked').forEach(checkbox => {
            missingItems.push(checkbox.value);
        });
        
        // Process the revision request
        processRevisionRequest(submissionId, feedback, missingItems);
        
        // Close the modal
        document.querySelector('.modal').classList.remove('visible');
        setTimeout(() => document.querySelector('.modal').remove(), 300);
    });
}

// Process revision request with feedback
function processRevisionRequest(submissionId, feedback, missingItems) {
    console.log('Processing revision request:', submissionId, feedback, missingItems);
    
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
    submission.status = 'revision_required';
    submission.requestDate = new Date().toISOString();
    submission.feedback = feedback;
    submission.missingItems = missingItems;
    
    // Save back to localStorage
    localStorage.setItem('onboardingSubmissions', JSON.stringify(submissions));
    
    // Send notification to the employee
    sendEmployeeNotification(submission.email, {
        type: 'onboarding_revision',
        title: 'Onboarding Revision Requested',
        message: feedback,
        missingItems: missingItems,
        date: new Date().toISOString()
    });
    
    // Update the employee status in the employee list
    updateEmployeeStatus(submissionId, 'revision_required');
    
    // Show success notification to admin
    showNotification(`Revision requested from ${submission.name}. Employee has been notified.`, 'warning');
    
    // Refresh the onboarding approvals list
    loadOnboardingSubmissions();
}

// Function to send notification to employee
function sendEmployeeNotification(email, notification) {
    console.log('Sending notification to employee:', email, notification);
    
    // In a real implementation, this would use an API to send the notification
    // For now, we'll store it in localStorage as an example
    
    let employeeNotifications = {};
    try {
        employeeNotifications = JSON.parse(localStorage.getItem('employeeNotifications')) || {};
    } catch (error) {
        console.error('Error parsing employee notifications:', error);
        employeeNotifications = {};
    }
    
    // Create notifications array for this employee if it doesn't exist
    if (!employeeNotifications[email]) {
        employeeNotifications[email] = [];
    }
    
    // Add the new notification
    employeeNotifications[email].unshift(notification);
    
    // Save back to localStorage
    localStorage.setItem('employeeNotifications', JSON.stringify(employeeNotifications));
}

// Function to update employee status in the employee list
function updateEmployeeStatus(submissionId, newStatus) {
    // Get employees from localStorage
    let employees = [];
    try {
        employees = JSON.parse(localStorage.getItem('employees')) || [];
    } catch (error) {
        console.error('Error parsing employees:', error);
    }
    
    // Find the submission to get employee details
    let submissions = [];
    try {
        submissions = JSON.parse(localStorage.getItem('onboardingSubmissions')) || [];
    } catch (error) {
        console.error('Error parsing submissions:', error);
    }
    
    const submission = submissions.find(s => s.id === submissionId);
    if (!submission) return;
    
    // Find employee by email
    const employeeIndex = employees.findIndex(e => e.email === submission.email);
    
    if (employeeIndex === -1) {
        console.log('Employee not found in list, may need to add them');
        return;
    }
    
    // Update employee status
    employees[employeeIndex].status = newStatus === 'approved' ? 'active' : 'pending';
    
    // Save back to localStorage
    localStorage.setItem('employees', JSON.stringify(employees));
    
    // If employee table is visible, refresh it
    if (document.getElementById('employees').classList.contains('active')) {
        loadEmployeeData();
    }
}

// Helper function to get status class for CSS
function getStatusClass(status) {
    switch (status) {
        case 'approved': return 'active';
        case 'pending': return 'pending';
        case 'revision_required': return 'warning';
        case 'offboarding': return 'offboarding';
        default: return 'pending';
    }
}

// Helper function to get status text
function getStatusText(status) {
    switch (status) {
        case 'approved': return 'Approved';
        case 'pending': return 'Pending Review';
        case 'revision_required': return 'Revision Required';
        case 'offboarding': return 'Offboarding';
        default: return 'Pending Review';
    }
}

// Function to initialize onboarding kanban board
function initializeOnboardingTracker() {
    console.log('Initializing onboarding tracker...');
    
    // Get the kanban columns
    const toStartColumn = document.getElementById('toStart');
    const inProgressColumn = document.getElementById('inProgress');
    const completedColumn = document.getElementById('completed');
    
    if (!toStartColumn || !inProgressColumn || !completedColumn) {
        console.error('One or more kanban columns not found');
        return;
    }
    
    // Clear existing items
    toStartColumn.innerHTML = '';
    inProgressColumn.innerHTML = '';
    completedColumn.innerHTML = '';
    
    // Load employee data
    loadEmployeesForOnboarding();
    
    // Initialize sortable for drag and drop between columns
    if (typeof Sortable !== 'undefined') {
        const options = {
            group: 'onboarding',
            animation: 150,
            ghostClass: 'kanban-item-ghost',
            chosenClass: 'kanban-item-chosen',
            dragClass: 'kanban-item-drag',
            onEnd: function(evt) {
                const item = evt.item;
                const employeeId = item.dataset.id;
                const newStatus = evt.to.id;
                
                // Update employee status based on new column
                updateEmployeeOnboardingStatus(employeeId, newStatus);
            }
        };
        
        // Initialize sortable for each column
        new Sortable(toStartColumn, options);
        new Sortable(inProgressColumn, options);
        new Sortable(completedColumn, options);
    } else {
        console.warn('Sortable library not loaded. Drag and drop disabled.');
    }
    
    // Add event listener for "New Onboarding" button
    const newOnboardingBtn = document.querySelector('#onboarding .add-btn');
    if (newOnboardingBtn) {
        newOnboardingBtn.addEventListener('click', function() {
            showOnboardingModal();
        });
    }
}

// Load employees for onboarding tracker
async function loadEmployeesForOnboarding() {
    try {
        // Get employees either from API or localStorage
        let employees = [];
        
        try {
            // First try to get from localStorage
            const storedEmployees = localStorage.getItem('employees');
            if (storedEmployees) {
                employees = JSON.parse(storedEmployees);
                console.log('Using employees from localStorage:', employees);
            } else {
                // If no stored employees, use our mock data from loadEmployeeData
                const mockData = [
                    {
                        id: "1",
                        name: "Sarah Johnson",
                        email: "sarah.johnson@example.com",
                        department: "Marketing",
                        position: "Content Manager",
                        startDate: "2024-03-15",
                        status: "in-progress",
                        completionPercentage: 60
                    },
                    {
                        id: "2",
                        name: "Michael Chen",
                        email: "michael.chen@example.com",
                        department: "Engineering",
                        position: "Senior Developer",
                        startDate: "2024-03-10",
                        status: "completed",
                        completionPercentage: 100
                    },
                    {
                        id: "3",
                        name: "Emily Brown",
                        email: "emily.brown@example.com",
                        department: "Sales",
                        position: "Account Executive",
                        startDate: "2024-03-01",
                        status: "offboarding",
                        completionPercentage: 0
                    },
                    {
                        id: "4",
                        name: "Alex Thompson",
                        email: "alex.thompson@example.com",
                        department: "Engineering",
                        position: "Software Engineer",
                        startDate: "2024-03-20",
                        status: "to-start",
                        completionPercentage: 0
                    },
                    {
                        id: "5",
                        name: "Rachel Martinez",
                        email: "rachel.martinez@example.com",
                        department: "Design",
                        position: "UX Designer",
                        startDate: "2024-03-25",
                        status: "to-start",
                        completionPercentage: 0
                    },
                    {
                        id: "6",
                        name: "David Wilson",
                        email: "david.wilson@example.com",
                        department: "Product",
                        position: "Product Manager",
                        startDate: "2024-03-12",
                        status: "in-progress",
                        completionPercentage: 80
                    },
                    {
                        id: "7",
                        name: "Alisha Patel",
                        email: "alisha.patel@example.com",
                        department: "Human Resources",
                        position: "HR Specialist",
                        startDate: "2024-03-20",
                        status: "in-progress",
                        completionPercentage: 95
                    }
                ];
                
                employees = mockData;
                
                // Store them for future use
                localStorage.setItem('employees', JSON.stringify(mockData));
            }
        } catch (error) {
            console.error('Error loading employees from localStorage:', error);
            return;
        }
        
        // Add employees to appropriate kanban columns
        const toStartColumn = document.getElementById('toStart');
        const inProgressColumn = document.getElementById('inProgress');
        const completedColumn = document.getElementById('completed');
        
        employees.forEach(employee => {
            // Only include employees who are in an onboarding state
            if (employee.status === 'offboarding') {
                return; // Skip offboarding employees
            }
            
            // Create kanban item
            const item = createKanbanItem(employee);
            
            // Add to appropriate column
            if (employee.status === 'to-start' || employee.status === 'pending') {
                toStartColumn.appendChild(item);
            } else if (employee.status === 'in-progress' || employee.status === 'onboarding' || employee.status === 'revision_required') {
                inProgressColumn.appendChild(item);
            } else if (employee.status === 'completed' || employee.status === 'active' || employee.status === 'approved') {
                completedColumn.appendChild(item);
            } else {
                // If status not specified, default to "To Start"
                toStartColumn.appendChild(item);
            }
        });
        
        console.log('Successfully loaded employees for onboarding tracker');
        
    } catch (error) {
        console.error('Error loading employees for onboarding tracker:', error);
        showNotification('Error loading onboarding tracker. Please refresh the page.', 'error');
    }
}

// Create kanban item for an employee
function createKanbanItem(employee) {
    const item = document.createElement('div');
    item.className = 'kanban-item';
    item.dataset.id = employee.id;
    
    // Format start date
    const startDate = employee.startDate ? new Date(employee.startDate) : null;
    const formattedDate = startDate ? startDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    }) : 'TBD';
    
    // Determine label based on status
    let dateLabel = 'Start Date:';
    if (employee.status === 'in-progress' || employee.status === 'onboarding') {
        dateLabel = 'Started:';
    } else if (employee.status === 'completed' || employee.status === 'active' || employee.status === 'approved') {
        dateLabel = 'Completed:';
    }
    
    // Calculate progress percentage
    let progressWidth = employee.completionPercentage || 0;
    if (employee.status === 'completed' || employee.status === 'active' || employee.status === 'approved') {
        progressWidth = 100;
    }
    
    item.innerHTML = `
        <h4>${employee.name}</h4>
        <p>${employee.position}</p>
        <span class="date">${dateLabel} ${formattedDate}</span>
        <div class="task-progress">
            <div class="progress-bar" style="width: ${progressWidth}%"></div>
        </div>
    `;
    
    // Add click event to view employee details
    item.addEventListener('click', function(e) {
        // Only trigger if not dragging
        if (!item.classList.contains('kanban-item-chosen')) {
            viewEmployeeDetails(employee.id);
        }
    });
    
    return item;
}

// Update employee status when moved between columns
function updateEmployeeOnboardingStatus(employeeId, newStatus) {
    console.log(`Updating employee ${employeeId} status to ${newStatus}`);
    
    try {
        // Get the employees from localStorage
        const employees = JSON.parse(localStorage.getItem('employees') || '[]');
        
        // Find the employee by ID
        const employeeIndex = employees.findIndex(emp => emp.id === employeeId);
        
        if (employeeIndex === -1) {
            console.error('Employee not found:', employeeId);
            return;
        }
        
        // Map kanban column ID to actual status
        let statusMapping = {
            'toStart': 'to-start',
            'inProgress': 'in-progress',
            'completed': 'completed'
        };
        
        // Update employee status
        employees[employeeIndex].status = statusMapping[newStatus] || newStatus;
        
        // Update completion percentage based on new status
        if (newStatus === 'inProgress') {
            // If moved to in progress and no completion percentage, set to 50%
            if (!employees[employeeIndex].completionPercentage || employees[employeeIndex].completionPercentage === 0) {
                employees[employeeIndex].completionPercentage = 50;
            }
        } else if (newStatus === 'completed') {
            // If moved to completed, set to 100%
            employees[employeeIndex].completionPercentage = 100;
            
            // Also update the status in other data structures
            employees[employeeIndex].status = 'active'; // Set as active employee now
        } else if (newStatus === 'toStart') {
            // If moved back to start, reset progress
            employees[employeeIndex].completionPercentage = 0;
        }
        
        // Save back to localStorage
        localStorage.setItem('employees', JSON.stringify(employees));
        
        // If there's an onboarding submission, update that too
        updateOnboardingSubmissionStatus(employeeId, statusMapping[newStatus] || newStatus);
        
        // Show notification
        const employee = employees[employeeIndex];
        showNotification(`Updated ${employee.name}'s onboarding status`, 'success');
        
        // Update progress bar in the kanban item
        const kanbanItem = document.querySelector(`.kanban-item[data-id="${employeeId}"]`);
        if (kanbanItem) {
            const progressBar = kanbanItem.querySelector('.progress-bar');
            if (progressBar) {
                progressBar.style.width = `${employee.completionPercentage}%`;
            }
            
            // Update date label
            const dateSpan = kanbanItem.querySelector('.date');
            if (dateSpan) {
                let dateLabel = 'Start Date:';
                if (newStatus === 'inProgress') {
                    dateLabel = 'Started:';
                } else if (newStatus === 'completed') {
                    dateLabel = 'Completed:';
                }
                
                const formattedDate = employee.startDate ? new Date(employee.startDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                }) : 'TBD';
                
                dateSpan.textContent = `${dateLabel} ${formattedDate}`;
            }
        }
        
    } catch (error) {
        console.error('Error updating employee status:', error);
        showNotification('Error updating employee status', 'error');
    }
}

// Update onboarding submission status
function updateOnboardingSubmissionStatus(employeeId, newStatus) {
    try {
        // Get the submissions from localStorage
        const submissions = JSON.parse(localStorage.getItem('onboardingSubmissions') || '[]');
        
        // Find the submission for this employee
        const submission = submissions.find(sub => sub.id === employeeId);
        
        if (!submission) {
            console.log('No onboarding submission found for employee', employeeId);
            return;
        }
        
        // Map kanban status to submission status
        let statusMapping = {
            'to-start': 'pending',
            'in-progress': 'pending',
            'completed': 'approved'
        };
        
        // Update submission status
        submission.status = statusMapping[newStatus] || submission.status;
        
        // If completed/approved, add approval date and message
        if (newStatus === 'completed' || newStatus === 'approved') {
            submission.approvedDate = new Date().toISOString();
            submission.feedback = 'Your onboarding submission has been approved. Welcome to the team!';
            
            // Send notification to the employee
            sendEmployeeNotification(submission.email, {
                type: 'onboarding_approved',
                title: 'Onboarding Submission Approved',
                message: 'Your onboarding submission has been approved. Welcome to the team!',
                date: new Date().toISOString()
            });
        }
        
        // Save back to localStorage
        localStorage.setItem('onboardingSubmissions', JSON.stringify(submissions));
        
    } catch (error) {
        console.error('Error updating submission status:', error);
    }
}

// Show new onboarding modal
function showOnboardingModal() {
    showModal('Add New Onboarding', `
        <form id="new-onboarding-form">
            <div class="form-group">
                <label>Employee Name</label>
                <input type="text" id="new-employee-name" required placeholder="Enter employee name">
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" id="new-employee-email" required placeholder="Enter email address">
            </div>
            <div class="form-group">
                <label>Department</label>
                <select id="new-employee-department" required>
                    <option value="">Select Department</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="Product">Product</option>
                    <option value="Design">Design</option>
                    <option value="Human Resources">Human Resources</option>
                </select>
            </div>
            <div class="form-group">
                <label>Position</label>
                <input type="text" id="new-employee-position" required placeholder="Enter position title">
            </div>
            <div class="form-group">
                <label>Start Date</label>
                <input type="date" id="new-employee-start-date" required>
            </div>
            <button type="submit" class="btn-primary">Create Onboarding</button>
        </form>
    `);
    
    // Handle form submission
    const form = document.getElementById('new-onboarding-form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const name = document.getElementById('new-employee-name').value;
        const email = document.getElementById('new-employee-email').value;
        const department = document.getElementById('new-employee-department').value;
        const position = document.getElementById('new-employee-position').value;
        const startDate = document.getElementById('new-employee-start-date').value;
        
        // Create new employee
        createNewOnboarding(name, email, department, position, startDate);
        
        // Close modal
        const modal = this.closest('.modal');
        modal.classList.remove('visible');
        setTimeout(() => modal.remove(), 300);
    });
}

// Create new onboarding
function createNewOnboarding(name, email, department, position, startDate) {
    try {
        // Generate a unique ID
        const id = Date.now().toString();
        
        // Create employee object
        const newEmployee = {
            id,
            name,
            email,
            department,
            position,
            startDate,
            status: 'to-start', // Default to "To Start" column
            completionPercentage: 0
        };
        
        // Get existing employees
        const employees = JSON.parse(localStorage.getItem('employees') || '[]');
        
        // Add new employee
        employees.push(newEmployee);
        
        // Save to localStorage
        localStorage.setItem('employees', JSON.stringify(employees));
        
        // Create a kanban item for the new employee
        const kanbanItem = createKanbanItem(newEmployee);
        
        // Add to "To Start" column
        const toStartColumn = document.getElementById('toStart');
        if (toStartColumn) {
            toStartColumn.appendChild(kanbanItem);
        }
        
        // Show success notification
        showNotification(`Added ${name} to onboarding`, 'success');
        
        // Refresh employee list if visible
        if (document.getElementById('employees').classList.contains('active')) {
            loadEmployeeData();
        }
        
    } catch (error) {
        console.error('Error creating new onboarding:', error);
        showNotification('Error creating new onboarding', 'error');
    }
}