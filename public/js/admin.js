/* filepath: /c:/Users/sujan/Desktop/OnboardX/Frontend/base/admin_dashboard.js */
document.addEventListener('DOMContentLoaded', function() {
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

        // Show dashboard by default
        const dashboardSection = document.getElementById('dashboard');
        if (dashboardSection) {
            dashboardSection.classList.add('active');
        }
    }

    function initializeDynamicContent() {
        // Initialize any dynamic content that should be loaded immediately
        const dashboardSection = document.getElementById('dashboard');
        if (dashboardSection) {
            dashboardSection.style.display = 'block';
            dashboardSection.style.opacity = '1';
        }
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
        const notificationFeed = document.getElementById('notification-feed');
        const sendReminderBtn = document.querySelector('.send-reminder');

        if (sendReminderBtn) {
            sendReminderBtn.addEventListener('click', function() {
                this.classList.add('loading');
                
                setTimeout(() => {
                    this.classList.remove('loading');
                    addNotification('Reminders sent successfully to all pending employees!');
                }, 1500);
            });
        }

        // Sample notifications
        const notifications = [
            'New employee John Doe started onboarding process',
            'Document approval pending for Sarah Smith',
            'IT setup completed for new marketing team'
        ];

        notifications.forEach((message, index) => {
            setTimeout(() => {
                addNotification(message);
            }, index * 1000);
        });

    function addNotification(message) {
            if (!notificationFeed) return;

        const notification = document.createElement('div');
            notification.className = 'notification-item';
        notification.innerHTML = `
                <div class="notification-content">
            <p>${message}</p>
            <span class="timestamp">${new Date().toLocaleTimeString()}</span>
                </div>
                <button class="notification-close">
                    <i class="fas fa-times"></i>
                </button>
            `;

            // Add close button functionality
            const closeBtn = notification.querySelector('.notification-close');
            closeBtn.addEventListener('click', () => {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => notification.remove(), 300);
            });

            notificationFeed.insertBefore(notification, notificationFeed.firstChild);
            
            // Trigger animation
            setTimeout(() => {
                notification.classList.add('new');
            }, 50);
        }
    }

    function initializeTaskManagement() {
        const taskLists = document.querySelectorAll('.task-list');
        
        taskLists.forEach(list => {
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
                    
                    // Update task status based on new column
                    const status = to.id.replace('-tasks', '');
                    item.querySelector('.task-status').textContent = status;
                    
                    // Add success notification
                    addNotification(`Task "${item.querySelector('.task-title').textContent}" moved to ${status}`);
                }
            });
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
});