document.addEventListener('DOMContentLoaded', async function() {
    console.log('IT Dashboard loaded');

    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/index.html';
        return;
    }
    
    // Check if user has IT admin role
    if (api.auth.getUserRole() !== 'it_admin') {
        console.error('Access denied: User is not an IT admin');
        window.location.href = '/index.html';
        return;
    }
    
    // Log auth state for debugging
    logAuthenticationState();
    
    // Load user data
    try {
        const userData = await api.auth.getCurrentUser();
        if (userData) {
            displayUserInfo(userData);
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        showNotification('Failed to load user data', 'error');
    }

    initializeSections();
    initializeSidebar();
    initializeDateTime();
    initializeCharts();
    initializeInteractiveElements();
    initializeApprovalButtons();
    initializeDepartmentCodeManagement();
    initializeSearch();
    initializeFilters();
    initializeAccessManagement();
    
    // Add direct button handlers - First attempt on page load
    setTimeout(addDirectButtonHandlers, 500);
    
    // Pre-load active tab content if it's the account deactivation tab
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab && activeTab.getAttribute('data-tab') === 'account-deactivation') {
        loadAllUserAccounts();
    }
    
    // Create notification container if it doesn't exist
    if (!document.getElementById('notification-container')) {
        const container = document.createElement('div');
        container.id = 'notification-container';
        document.body.appendChild(container);
    }
    
    // Load active user count for dashboard stats
    updateActiveUserCount();
    
    // Welcome notification
    setTimeout(() => {
        showNotification('Welcome to your IT Dashboard!', 'success');
    }, 1000);

    // Initialize Communication Directory
    initializeCommunication();
});

/**
 * Display user information on the dashboard
 */
function displayUserInfo(user) {
    console.log('Displaying user info:', user);
    
    // Update welcome message with user's name
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        // Add defensive check for potentially missing properties
        let displayName = 'to your IT Dashboard';
        if (user) {
            // Use optional chaining to handle potentially undefined properties safely
            displayName = user.name || user.firstName || (user.email ? user.email.split('@')[0] : 'User');
        }
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
                console.log('Logout successful');
                // Redirect to login page
                window.location.href = '/login.html';
            } catch (error) {
                console.error('Logout error:', error);
                showNotification('Failed to logout. Using fallback method.', 'error');
                
                // Fallback logout if API fails (clear local storage and redirect)
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login.html';
            }
        });
    }
}

function initializeSections() {
    const sections = document.querySelectorAll('.dashboard-section');
    sections.forEach(section => {
        section.style.display = 'none';
        section.style.opacity = '0';
    });

    const dashboardSection = document.getElementById('dashboard');
    if (dashboardSection) {
        dashboardSection.style.display = 'block';
        dashboardSection.style.opacity = '1';
    }
}

function initializeSidebar() {
    console.log('Initializing sidebar');
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    const sidebarLinks = document.querySelectorAll('.sidebar a');
    sidebarLinks.forEach(link => {
        // Add initial active class to dashboard link
        if (link.getAttribute('href') === '#dashboard') {
            link.classList.add('active');
        }
        
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            console.log('Sidebar link clicked:', targetId);
            
            // Don't process logout link here
            if (this.id === 'logout-link') return;
            
            // Update active link
            sidebarLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            // Hide all sections with fade out
            const sections = document.querySelectorAll('.dashboard-section');
            sections.forEach(section => {
                section.style.opacity = '0';
                setTimeout(() => {
                    section.style.display = 'none';
                }, 300);
            });

            // Show target section with fade in
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                console.log('Showing section:', targetId);
                setTimeout(() => {
                    targetSection.style.display = 'block';
                    requestAnimationFrame(() => {
                        targetSection.style.opacity = '1';
                    });
                    
                    // If it's the settings section, ensure department code buttons work
                    if (targetId === 'settings') {
                        console.log('Settings section shown - adding direct button handlers');
                        // Add a slight delay to make sure the DOM is fully visible
                        setTimeout(addDirectButtonHandlers, 500);
                    }
                }, 300);
            }

            // Close mobile sidebar if necessary
            if (window.innerWidth <= 1024) {
                sidebar.classList.remove('active');
            }
        });
    });
}

function initializeDateTime() {
    function updateDateTime() {
        const dateElement = document.getElementById('current-date');
        const timeElement = document.getElementById('current-time');
        
        if (dateElement && timeElement) {
            const now = new Date();
            const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
            
            dateElement.textContent = now.toLocaleDateString('en-US', dateOptions);
            timeElement.textContent = now.toLocaleTimeString('en-US', timeOptions);
        }
    }

    updateDateTime();
    setInterval(updateDateTime, 1000);
}

function initializeCharts() {
    // Resource Utilization Chart
    const resourceCtx = document.getElementById('resourceUtilizationChart');
    if (resourceCtx) {
        new Chart(resourceCtx, {
            type: 'line',
            data: {
                labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
                datasets: [{
                    label: 'CPU Usage',
                    data: [25, 35, 45, 30, 38, 28],
                    borderColor: '#1db954',
                    tension: 0.4,
                    fill: false
                }, {
                    label: 'Memory Usage',
                    data: [45, 55, 65, 60, 58, 65],
                    borderColor: '#ffd700',
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
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: '#282828' },
                        ticks: { color: '#b3b3b3' }
                    },
                    x: {
                        grid: { color: '#282828' },
                        ticks: { color: '#b3b3b3' }
                    }
                }
            }
        });
    }

    // Network Performance Chart
    const networkCtx = document.getElementById('networkPerformanceChart');
    if (networkCtx) {
        new Chart(networkCtx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Bandwidth Usage (Mbps)',
                    data: [850, 750, 900, 800, 950, 700, 800],
                    borderColor: '#1db954',
                    tension: 0.4,
                    fill: false
                }, {
                    label: 'Latency (ms)',
                    data: [25, 30, 20, 35, 25, 30, 28],
                    borderColor: '#ffd700',
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
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: '#282828' },
                        ticks: { color: '#b3b3b3' }
                    },
                    x: {
                        grid: { color: '#282828' },
                        ticks: { color: '#b3b3b3' }
                    }
                }
            }
        });
    }

    // Performance Trend Chart
    const performanceCtx = document.getElementById('performanceTrendChart');
    if (performanceCtx) {
        new Chart(performanceCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'System Performance Score',
                    data: [88, 92, 90, 95, 89, 92],
                    borderColor: '#1db954',
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
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: '#282828' },
                        ticks: { color: '#b3b3b3' }
                    },
                    x: {
                        grid: { color: '#282828' },
                        ticks: { color: '#b3b3b3' }
                    }
                }
            }
        });
    }
}

function initializeInteractiveElements() {
    // Action buttons
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            if (!this.hasAttribute('data-approval-required')) {
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                }, 200);
            }
        });
    });
    
    // Form controls
    document.querySelectorAll('select, input[type="search"]').forEach(element => {
        element.addEventListener('change', function() {
            console.log('Filter/Search changed:', this.value);
        });
    });
    
    // Switches
    document.querySelectorAll('.switch input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            console.log('Switch toggled:', this.checked);
        });
    });
}

function initializeApprovalButtons() {
    document.querySelectorAll('[data-approval="required"]').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const action = this.querySelector('i').className;
            const actionType = getActionType(action);
            
            // Show confirmation dialog
            if (confirm(`This action (${actionType}) requires admin approval. Proceed with request?`)) {
                // Here you would typically send this to your backend for approval
                console.log(`Approval requested for ${actionType}`);
                this.disabled = true;
                this.innerHTML += ' <span class="pending">Pending</span>';
            }
        });
    });
}

function getActionType(iconClass) {
    const actionTypes = {
        'fa-plus': 'Add Item',
        'fa-edit': 'Edit Item',
        'fa-ban': 'Block Access',
        'fa-unlock': 'Grant Access',
        'fa-share': 'Share Report',
        'fa-eye': 'View Details'
    };
    
    for (const [key, value] of Object.entries(actionTypes)) {
        if (iconClass.includes(key)) return value;
    }
    return 'Unknown Action';
}

function initializeDepartmentCodeManagement() {
    console.log('Initializing department code management');
    const codeInput = document.getElementById('department-code');
    const toggleButton = document.getElementById('toggle-code-visibility');
    const copyButton = document.getElementById('copy-code');
    const generateButton = document.getElementById('generate-new-code');
    const roleTabs = document.querySelectorAll('.role-tab');
    const codeRoleText = document.getElementById('code-role-text');
    const historyList = document.querySelector('.history-list');
    
    // Debug log for button initialization
    console.log('Department code buttons:', {
        codeInput: codeInput ? 'Found' : 'Missing',
        toggleButton: toggleButton ? 'Found' : 'Missing',
        copyButton: copyButton ? 'Found' : 'Missing',
        generateButton: generateButton ? 'Found' : 'Missing',
        roleTabs: roleTabs.length,
        codeRoleText: codeRoleText ? 'Found' : 'Missing'
    });

    // Current selected role
    let currentRole = 'it_admin';
    
    // Store codes for different roles
    const roleCodes = {
        it_admin: 'IT2024',
        hr_admin: 'HR2024',
        employee: 'EMP2024'
    };

    // Get the display name for a role
    function getRoleDisplayName(role) {
        const roleDisplayNames = {
            'it_admin': 'IT Admin',
            'hr_admin': 'HR Admin',
            'employee': 'Employee'
        };
        return roleDisplayNames[role] || role;
    }
    
    // Load initial codes from API or use defaults
    loadRoleCodes();
    
    // Handle role tab clicks
    if (roleTabs && roleTabs.length > 0) {
        console.log('Setting up role tabs click handlers:', roleTabs.length, 'tabs found');
        roleTabs.forEach(tab => {
            tab.removeEventListener('click', roleTabClickHandler); // Remove existing handler if any
            tab.addEventListener('click', roleTabClickHandler);
        });
    } else {
        console.warn('Role tabs not found in the document');
    }
    
    // Defined as a named function to avoid duplicates
    function roleTabClickHandler(event) {
        console.log('Tab clicked:', this.textContent);
        
        // Remove active class from all tabs
        roleTabs.forEach(t => t.classList.remove('active'));
        
        // Add active class to clicked tab
        this.classList.add('active');
        
        // Update current role
        currentRole = this.getAttribute('data-role');
        console.log('Role updated to:', currentRole);
        
        // Update displayed code
        if (codeInput) {
            codeInput.value = roleCodes[currentRole] || '';
        }
        
        // Update role text
        updateRoleText(currentRole);

        // Show default code history if API fails
        showDefaultCodeHistory(currentRole);
        
        // Try to load history for this role (but don't break UI if it fails)
        loadCodeHistory(currentRole).catch(error => {
            console.error('Failed to load code history, using default history:', error);
        });
    }
    
    // Function to update the role text
    function updateRoleText(role) {
        const roleDisplayNames = {
            it_admin: 'IT',
            hr_admin: 'HR',
            employee: 'Employee'
        };
        
        if (codeRoleText) {
            codeRoleText.textContent = roleDisplayNames[role] || 'IT';
        }
    }
    
    // Function to load all department codes
    async function loadRoleCodes() {
        try {
            // First, use the default codes
            if (codeInput) {
                codeInput.value = roleCodes[currentRole] || '';
            }
            
            // Try to get active codes from API
            const response = await api.departmentCodes.getActiveDepartmentCodes();
            
            if (response && response.success) {
                console.log('Loaded department codes:', response.data);

                // Loop through each code and update our role codes object
                if (response.data && Array.isArray(response.data)) {
                    response.data.forEach(code => {
                        if (code.allowedRoles && code.allowedRoles.length > 0) {
                            // A code might allow multiple roles, so set it for each allowed role
                            code.allowedRoles.forEach(role => {
                                if (roleCodes.hasOwnProperty(role)) {
                                    roleCodes[role] = code.code;
                                }
                            });
                        }
                    });
                    
                    // Update displayed code for current role
                    if (codeInput) {
                        codeInput.value = roleCodes[currentRole] || '';
                    }
                }
            }
        } catch (error) {
            console.error('Error loading department codes:', error);
            // Don't show notification here, just log the error and continue with defaults
            // The UI will still work with the default codes
        }
        
        // Show default code history for current role regardless of API success
        showDefaultCodeHistory(currentRole);
        
        // Try loading actual code history, but don't break UI if it fails
        try {
            await loadCodeHistory(currentRole);
        } catch (error) {
            console.error('Failed to load initial code history:', error);
        }
    }

    // Load the history of department codes for the selected role
    async function loadCodeHistory(role) {
        const historyList = document.getElementById('code-history-list');
        if (!historyList) return;
        
        // Show loading state
        historyList.innerHTML = '<li class="loading">Loading code history...</li>';
        
        try {
            console.log(`Attempting to load code history for role: ${role}`);
            console.log('Auth state before API call:');
            logAuthenticationState();
            
            // Make API call to get all department codes (including expired ones)
            const result = await api.departmentCodes.getDepartmentCodes();
            
            console.log('Department codes API response:', result);
            
            if (!result.success) {
                throw new Error(result.message || 'Failed to load department codes');
            }
            
            const allCodes = result.data;
            
            if (!Array.isArray(allCodes)) {
                console.error('Expected array of codes but got:', allCodes);
                throw new Error('Invalid data format returned from API');
            }
            
            // Filter codes for the selected role
            const rolePrefix = getRolePrefix(role);
            const roleCodes = allCodes.filter(code => code.code.startsWith(rolePrefix));
            
            console.log(`Found ${roleCodes.length} codes for role ${role} with prefix ${rolePrefix}`);
            
            // Sort codes by creation date (newest first)
            roleCodes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            // Clear loading state
            historyList.innerHTML = '';
            
            if (roleCodes.length === 0) {
                historyList.innerHTML = '<li class="no-data">No history available</li>';
                return;
            }
            
            // Add codes to the history list
            roleCodes.forEach(code => {
                const isActive = !code.expiresAt || new Date(code.expiresAt) > new Date();
                const expiryDate = code.expiresAt ? new Date(code.expiresAt).toLocaleDateString() : 'Never';
                
                const listItem = document.createElement('li');
                listItem.classList.add('history-item');
                if (isActive) listItem.classList.add('active');
                
                listItem.innerHTML = `
                    <div class="code-text">${code.code}</div>
                    <div class="code-info">
                        <span class="code-status ${isActive ? 'active' : 'expired'}">${isActive ? 'Active' : 'Expired'}</span>
                        <span class="code-expiry">Expires: ${expiryDate}</span>
                    </div>
                `;
                
                historyList.appendChild(listItem);
            });
        } catch (error) {
            console.error('Error loading code history:', error);
            
            // Enhanced error handling with more details
            if (error.status === 403) {
                console.error('Access Denied (403) - Authorization issue detected');
                console.log('Current token details:');
                const token = localStorage.getItem('token');
                if (token) {
                    try {
                        const payload = token.split('.')[1];
                        const decodedPayload = atob(payload);
                        console.log('Token payload:', JSON.parse(decodedPayload));
                    } catch (e) {
                        console.error('Error decoding token:', e);
                    }
                } else {
                    console.error('No token found in localStorage');
                }
            }
            
            // Show error in history list
            historyList.innerHTML = `
                <li class="error">
                    <div class="error-message">Error loading code history</div>
                    <div class="error-details">${error.message || 'Unknown error'}</div>
                    <div class="error-help">Please try refreshing the page or contact support.</div>
                </li>
            `;
            
            // Display a notification
            showNotification('Failed to load department code history. Please try again.', 'error');
            
            // Show default history if API fails
            showDefaultCodeHistory(role);
        }
    }

    // Helper function to get role prefix for department codes
    function getRolePrefix(role) {
        switch (role) {
            case 'it_admin':
                return 'IT';
            case 'hr_admin':
                return 'HR';
            case 'employee':
                return 'EMP';
            default:
                return '';
        }
    }

    // Show default history when API fails
    function showDefaultCodeHistory(role) {
        console.log('Showing default history for role:', role);
        const historyList = document.getElementById('code-history-list');
        if (!historyList) return;
        
        const prefix = getRolePrefix(role);
        const currentYear = new Date().getFullYear();
        
        historyList.innerHTML = `
            <li class="history-item active">
                <div class="code-text">${prefix}${currentYear}</div>
                <div class="code-info">
                    <span class="code-status active">Active (Local)</span>
                    <span class="code-expiry">Expires: Dec 31, ${currentYear}</span>
                </div>
            </li>
            <li class="note">
                <div class="note-text">Using fallback data due to API error</div>
            </li>
        `;
    }

    // Set up toggle button to show/hide the code
    if (toggleButton) {
        console.log('Setting up toggle button');
        toggleButton.removeEventListener('click', toggleCodeVisibility); // Remove existing handler if any
        toggleButton.addEventListener('click', toggleCodeVisibility);
    } else {
        console.warn('Toggle button not found');
    }
    
    function toggleCodeVisibility() {
        if (!codeInput) return;
            const type = codeInput.type === 'password' ? 'text' : 'password';
            codeInput.type = type;
        this.innerHTML = `<i class="fas fa-eye${type === 'password' ? '' : '-slash'}"></i>`;
    }

    // Set up copy button to copy the code to clipboard
    if (copyButton) {
        console.log('Setting up copy button');
        copyButton.removeEventListener('click', copyCodeToClipboard); // Remove existing handler if any
        copyButton.addEventListener('click', copyCodeToClipboard);
    } else {
        console.warn('Copy button not found');
    }
    
    async function copyCodeToClipboard() {
        if (!codeInput) return;
            try {
                await navigator.clipboard.writeText(codeInput.value);
                showNotification('Code copied to clipboard!', 'success');
            } catch (err) {
            console.error('Failed to copy code:', err);
                showNotification('Failed to copy code', 'error');
            }
    }

    // Set up generate button to create a new department code
    if (generateButton) {
        console.log('Setting up generate button');
        generateButton.removeEventListener('click', generateNewCode); // Remove existing handler if any
        generateButton.addEventListener('click', generateNewCode);
    } else {
        console.warn('Generate button not found');
    }
    
    async function generateNewCode() {
        const roleName = getRoleDisplayName(currentRole);
        
        if (confirm(`Generate new department code for ${roleName}? This will invalidate the current code.`)) {
            // Show loading state
            generateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
            generateButton.disabled = true;
            
            try {
                // Save the current code before generating a new one
                const currentCode = codeInput ? codeInput.value : '';
                
                // Generate a new code
                const newCode = generateDepartmentCode(currentRole);
                
                // Set up the code data to send to the API
                const codeData = {
                    code: newCode,
                    department: currentRole === 'hr_admin' ? 'HR' : 
                               currentRole === 'it_admin' ? 'IT' : 'General',
                    description: `${codeRoleText ? codeRoleText.textContent : 'Department'} Code`,
                    allowedRoles: [currentRole],
                    isActive: true,
                    expiresAt: null // Could set an expiration date if needed
                };
                
                // Send the new code to the API
                const response = await api.departmentCodes.createDepartmentCode(codeData);
                
                if (response && response.success) {
                    console.log('New code generated:', response.data);
                
                // Update the code display
                    if (codeInput) {
                codeInput.value = newCode;
                    }
                    roleCodes[currentRole] = newCode;
                    
                    // Update the history list
                    addToCodeHistory(newCode, currentRole);
                    
                    // Show success notification
                    showNotification(`New ${roleName} department code generated: ${newCode}`, 'success');
                    
                } else {
                    console.error('Failed to generate code:', response);
                    showNotification('Failed to generate new code', 'error');
                }
            } catch (error) {
                console.error('Error generating code:', error);
                showNotification('Failed to generate new code', 'error');
            } finally {
                // Reset button state
                generateButton.innerHTML = '<i class="fas fa-key"></i> Generate New Code';
                generateButton.disabled = false;
            }
        }
    }
    
    // Initialize the buttons again when they become visible (for example, when switching tabs)
    document.querySelectorAll('.sidebar a').forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#settings') {
                // Reinitialize department code management buttons after a short delay
                setTimeout(() => {
                    const toggleButtonRefresh = document.getElementById('toggle-code-visibility');
                    const copyButtonRefresh = document.getElementById('copy-code');
                    const generateButtonRefresh = document.getElementById('generate-new-code');
                    
                    if (toggleButtonRefresh) {
                        toggleButtonRefresh.removeEventListener('click', toggleCodeVisibility);
                        toggleButtonRefresh.addEventListener('click', toggleCodeVisibility);
                    }
                    
                    if (copyButtonRefresh) {
                        copyButtonRefresh.removeEventListener('click', copyCodeToClipboard);
                        copyButtonRefresh.addEventListener('click', copyCodeToClipboard);
                    }
                    
                    if (generateButtonRefresh) {
                        generateButtonRefresh.removeEventListener('click', generateNewCode);
                        generateButtonRefresh.addEventListener('click', generateNewCode);
                    }
                    
                    console.log('Department code buttons reinitialized');
                }, 500);
            }
        });
    });
}

function initializeSearch() {
    const searchInputs = document.querySelectorAll('input[type="search"]');
    searchInputs.forEach(input => {
        input.addEventListener('input', debounce(function() {
            const searchTerm = this.value.toLowerCase();
            const section = this.closest('.dashboard-section');
            const table = section.querySelector('.data-table');
            
            if (table) {
                const rows = table.querySelectorAll('tbody tr');
                rows.forEach(row => {
                    const text = row.textContent.toLowerCase();
                    row.style.display = text.includes(searchTerm) ? '' : 'none';
                });
            }
        }, 300));
    });
}

function initializeFilters() {
    const filters = document.querySelectorAll('select.ticket-filter, select.equipment-filter, select.time-filter');
    filters.forEach(filter => {
        filter.addEventListener('change', function() {
            const value = this.value.toLowerCase();
            const section = this.closest('.dashboard-section');
            const items = section.querySelectorAll('.task-card, tbody tr');
            
            items.forEach(item => {
                if (value === 'all') {
                    item.style.display = '';
                } else {
                    const itemType = item.getAttribute('data-type') || 
                                   item.querySelector('.priority-badge')?.textContent.toLowerCase() ||
                                   item.querySelector('td:nth-child(2)')?.textContent.toLowerCase();
                    item.style.display = itemType === value ? '' : 'none';
                }
            });
        });
    });
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Initialize the access management section with tabs and handlers
 */
function initializeAccessManagement() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    if (tabButtons.length === 0 || tabContents.length === 0) return;
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and its content
            button.classList.add('active');
            document.getElementById(targetId).classList.add('active');
            
            // If the account deactivation tab is clicked, load user accounts
            if (targetId === 'account-deactivation') {
                loadAllUserAccounts();
            }
        });
    });
    
    // Mark returned asset functionality
    const returnButtons = document.querySelectorAll('.mark-returned');
    returnButtons.forEach(button => {
        button.addEventListener('click', async e => {
            e.preventDefault();
            const employee = button.getAttribute('data-employee');
            const assetId = button.getAttribute('data-asset');
            
            // Show a confirmation dialog
            if (confirm(`Mark asset ${assetId} as returned by ${employee}?`)) {
                showNotification(`Asset ${assetId} marked as returned`, 'success');
                
                // Simulate server call - in a real app, would call the API here
                button.closest('tr').querySelector('.status-badge').textContent = 'Returned';
                button.closest('tr').querySelector('.status-badge').className = 'status-badge active';
                
                // Disable the action buttons
                button.disabled = true;
                button.nextElementSibling.disabled = true;
            }
        });
    });
    
    // Deactivate account functionality
    const deactivateButtons = document.querySelectorAll('.deactivate-account');
    deactivateButtons.forEach(button => {
        button.addEventListener('click', e => {
            e.preventDefault();
            const employee = button.getAttribute('data-employee');
            
            // Show a confirmation dialog
            if (confirm(`Deactivate account for ${employee}?`)) {
                showNotification(`Account for ${employee} has been deactivated`, 'success');
                
                // Update the UI
                button.closest('tr').querySelector('.status-badge').textContent = 'Deactivated';
                button.closest('tr').querySelector('.status-badge').className = 'status-badge inactive';
                
                // Disable the deactivate button
                button.disabled = true;
            }
        });
    });
    
    // Initialize the account deactivation page if it's active by default
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab && activeTab.getAttribute('data-tab') === 'account-deactivation') {
        loadAllUserAccounts();
    }
}

/**
 * Load all user accounts for the account management section
 */
async function loadAllUserAccounts() {
    const accountDeactivationTab = document.getElementById('account-deactivation');
    if (!accountDeactivationTab) return;
    
    const tableBody = accountDeactivationTab.querySelector('tbody');
    if (!tableBody) return;
    
    // Show loading state
    tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="loading-row">
                <i class="fas fa-spinner fa-spin"></i> Loading user accounts...
            </td>
        </tr>
    `;
    
    try {
        // Load all users from the API with a high limit to get all users
        const usersResponse = await api.users.getUsers({
            limit: 100,  // Set a high limit to get more users
            page: 1
        });
        
        // Check if we need to load more pages
        let allUsers = usersResponse.data;
        const totalUsers = usersResponse.total;
        
        // If there are more users than the first page
        if (allUsers.length < totalUsers) {
            // Calculate how many more pages we need
            const totalPages = Math.ceil(totalUsers / 100);
            
            // Load remaining pages
            for (let page = 2; page <= totalPages; page++) {
                const nextPageResponse = await api.users.getUsers({
                    limit: 100,
                    page: page
                });
                
                // Add users from this page to our collection
                allUsers = [...allUsers, ...nextPageResponse.data];
            }
        }
        
        console.log(`Loaded ${allUsers.length} users from database`);
        
        // Store users in a global variable for filtering
        window.allUsers = allUsers;
        
        // Display the users
        displayUsers(allUsers);
        
        // Set up search and filters
        setupUserFilters();
        
    } catch (error) {
        console.error('Error loading user accounts:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="error-row">
                    <i class="fas fa-exclamation-triangle"></i> Failed to load user accounts: ${error.message}. Please try again.
                </td>
            </tr>
        `;
    }
}

/**
 * Display users in the table
 * @param {Array} users - The array of user objects to display
 */
function displayUsers(users) {
    const tableBody = document.querySelector('#account-deactivation tbody');
    if (!tableBody) return;
    
    // Clear existing content
    tableBody.innerHTML = '';
    
    if (!users || users.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-row">
                    No user accounts found matching your criteria.
                </td>
            </tr>
        `;
        return;
    }
    
    // Add each user to the table
    users.forEach(user => {
        if (!user) return; // Skip if user object is null or undefined
        
        const row = document.createElement('tr');
        
        // Format creation date safely
        let formattedDate = 'N/A';
        if (user.createdAt) {
            const createdDate = new Date(user.createdAt);
            formattedDate = createdDate.toLocaleDateString();
        }
        
        // Determine status class
        const statusClass = user.isActive ? 'active' : 'inactive';
        const statusText = user.isActive ? 'Active' : 'Inactive';
        
        row.innerHTML = `
            <td>${user.name || 'N/A'}</td>
            <td>${user.department || 'N/A'}</td>
            <td>${user.role || 'N/A'}</td>
            <td>${formattedDate}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <button class="action-btn ${user.isActive ? 'deactivate-account' : 'activate-account'}" 
                        title="${user.isActive ? 'Deactivate Account' : 'Activate Account'}" 
                        data-user-id="${user._id}" 
                        data-user-name="${user.name || user.email || 'User'}">
                    <i class="fas ${user.isActive ? 'fa-user-slash' : 'fa-user-check'}"></i>
                </button>
                <button class="action-btn delete-account" 
                        title="Delete Account" 
                        data-user-id="${user._id}" 
                        data-user-name="${user.name || user.email || 'User'}">
                    <i class="fas fa-trash-alt"></i>
                </button>
                <button class="action-btn view-user" 
                        title="View Details" 
                        data-user-id="${user._id}">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to the action buttons
    initializeUserActionButtons();
}

/**
 * Set up search and filter functionality for users
 */
function setupUserFilters() {
    const searchInput = document.getElementById('account-search');
    const statusFilter = document.getElementById('account-status-filter');
    const roleFilter = document.getElementById('account-role-filter');
    
    if (!searchInput || !statusFilter || !roleFilter) return;
    
    // Function to apply all filters
    const applyFilters = () => {
        if (!window.allUsers) return;
        
        const searchTerm = searchInput.value.toLowerCase().trim();
        const statusValue = statusFilter.value;
        const roleValue = roleFilter.value;
        
        // Filter users based on criteria
        const filteredUsers = window.allUsers.filter(user => {
            // Check search term
            const nameMatch = (user.name && user.name.toLowerCase().includes(searchTerm)) || 
                             (user.email && user.email.toLowerCase().includes(searchTerm));
            
            // Check status
            const statusMatch = statusValue === 'all' || 
                              (statusValue === 'active' && user.isActive) || 
                              (statusValue === 'inactive' && !user.isActive);
            
            // Check role
            const roleMatch = roleValue === 'all' || (user.role && user.role === roleValue);
            
            return nameMatch && statusMatch && roleMatch;
        });
        
        // Display filtered users
        displayUsers(filteredUsers);
    };
    
    // Set up event listeners
    searchInput.addEventListener('input', applyFilters);
    statusFilter.addEventListener('change', applyFilters);
    roleFilter.addEventListener('change', applyFilters);
}

/**
 * Initialize event listeners for user action buttons
 */
function initializeUserActionButtons() {
    // Deactivate/Activate account buttons
    const statusToggleButtons = document.querySelectorAll('.deactivate-account, .activate-account');
    statusToggleButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            const userId = button.getAttribute('data-user-id');
            const userName = button.getAttribute('data-user-name');
            const isDeactivating = button.classList.contains('deactivate-account');
            
            // Show a confirmation dialog
            const actionText = isDeactivating ? 'deactivate' : 'activate';
            if (confirm(`Are you sure you want to ${actionText} the account for ${userName}?`)) {
                try {
                    // Call the API to change the user status
                    await api.users.changeUserStatus(userId, !isDeactivating);
                    
                    // Update the UI
                    const row = button.closest('tr');
                    const statusBadge = row.querySelector('.status-badge');
                    
                    if (isDeactivating) {
                        // User was active, now inactive
                        statusBadge.textContent = 'Inactive';
                        statusBadge.className = 'status-badge inactive';
                        button.title = 'Activate Account';
                        button.classList.remove('deactivate-account');
                        button.classList.add('activate-account');
                        button.querySelector('i').classList.remove('fa-user-slash');
                        button.querySelector('i').classList.add('fa-user-check');
                    } else {
                        // User was inactive, now active
                        statusBadge.textContent = 'Active';
                        statusBadge.className = 'status-badge active';
                        button.title = 'Deactivate Account';
                        button.classList.remove('activate-account');
                        button.classList.add('deactivate-account');
                        button.querySelector('i').classList.remove('fa-user-check');
                        button.querySelector('i').classList.add('fa-user-slash');
                    }
                    
                    showNotification(`Account for ${userName} has been ${isDeactivating ? 'deactivated' : 'activated'}`, 'success');
                } catch (error) {
                    console.error(`Error ${actionText}ing user account:`, error);
                    showNotification(`Failed to ${actionText} account for ${userName}. Please try again.`, 'error');
                }
            }
        });
    });
    
    // Delete account buttons
    const deleteButtons = document.querySelectorAll('.delete-account');
    deleteButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            const userId = button.getAttribute('data-user-id');
            const userName = button.getAttribute('data-user-name');
            
            // Show a confirmation dialog
            if (confirm(`Are you sure you want to permanently delete the account for ${userName}? This action cannot be undone.`)) {
                try {
                    // Call the API to delete the user
                    await api.users.deleteUser(userId);
                    
                    // Remove the row from the table
                    button.closest('tr').remove();
                    
                    showNotification(`Account for ${userName} has been deleted`, 'success');
                    
                    // If no users left, show empty message
                    const tableBody = document.querySelector('#account-deactivation tbody');
                    if (tableBody && tableBody.children.length === 0) {
                        tableBody.innerHTML = `
                            <tr>
                                <td colspan="6" class="empty-row">
                                    No user accounts found.
                                </td>
                            </tr>
                        `;
                    }
                } catch (error) {
                    console.error('Error deleting user account:', error);
                    showNotification(`Failed to delete account for ${userName}. Please try again.`, 'error');
                }
            }
        });
    });
    
    // View user details buttons
    const viewButtons = document.querySelectorAll('.view-user');
    viewButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            const userId = button.getAttribute('data-user-id');
            
            try {
                // Get user details
                const userData = await api.users.getUser(userId);
                
                // Display user details in a modal
                displayUserDetailsModal(userData.data);
            } catch (error) {
                console.error('Error fetching user details:', error);
                showNotification('Failed to load user details. Please try again.', 'error');
            }
        });
    });
}

/**
 * Display a modal with user details
 */
function displayUserDetailsModal(user) {
    // Create modal container if it doesn't exist
    let modal = document.getElementById('user-details-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'user-details-modal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }
    
    // Format dates safely
    const createdDate = user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A';
    const lastLogin = user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never';
    
    // Build modal content
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>User Details</h2>
                <button class="close-modal"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <div class="user-details-container">
                    <div class="user-profile-section">
                        <div class="user-avatar">
                            <i class="fas fa-user-circle"></i>
                        </div>
                        <div class="user-status ${user.isActive ? 'active' : 'inactive'}">
                            ${user.isActive ? 'Active' : 'Inactive'}
                        </div>
                    </div>
                    
                    <div class="user-info-section">
                        <h3>Basic Information</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Name:</label>
                                <span>${user.name || 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <label>Email:</label>
                                <span>${user.email || 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <label>Role:</label>
                                <span>${user.role || 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <label>Department:</label>
                                <span>${user.department || 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <label>Position:</label>
                                <span>${user.position || 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <label>Created:</label>
                                <span>${createdDate}</span>
                            </div>
                            <div class="info-item">
                                <label>Last Login:</label>
                                <span>${lastLogin}</span>
                            </div>
                            <div class="info-item">
                                <label>Onboarding Status:</label>
                                <span>${user.onboarding?.status || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="user-actions">
                        <button class="action-btn ${user.isActive ? 'deactivate-account' : 'activate-account'}"
                                data-user-id="${user._id}" 
                                data-user-name="${user.name || user.email || 'User'}">
                            <i class="fas ${user.isActive ? 'fa-user-slash' : 'fa-user-check'}"></i>
                            ${user.isActive ? 'Deactivate Account' : 'Activate Account'}
                        </button>
                        <button class="action-btn delete-account danger-btn"
                                data-user-id="${user._id}" 
                                data-user-name="${user.name || user.email || 'User'}">
                            <i class="fas fa-trash-alt"></i>
                            Delete Account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Show modal
    modal.classList.add('active');
    
    // Add event listener to close button
    const closeButton = modal.querySelector('.close-modal');
    closeButton.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    // Initialize action buttons in the modal
    const statusToggleButton = modal.querySelector('.deactivate-account, .activate-account');
    if (statusToggleButton) {
        statusToggleButton.addEventListener('click', async (e) => {
            e.preventDefault();
            const userId = statusToggleButton.getAttribute('data-user-id');
            const userName = statusToggleButton.getAttribute('data-user-name');
            const isDeactivating = statusToggleButton.classList.contains('deactivate-account');
            
            // Show a confirmation dialog
            const actionText = isDeactivating ? 'deactivate' : 'activate';
            if (confirm(`Are you sure you want to ${actionText} the account for ${userName}?`)) {
                try {
                    // Call the API to change the user status
                    await api.users.changeUserStatus(userId, !isDeactivating);
                    
                    // Close modal and reload the account list
                    modal.classList.remove('active');
                    loadAllUserAccounts();
                    
                    showNotification(`Account for ${userName} has been ${isDeactivating ? 'deactivated' : 'activated'}`, 'success');
                } catch (error) {
                    console.error(`Error ${actionText}ing user account:`, error);
                    showNotification(`Failed to ${actionText} account for ${userName}. Please try again.`, 'error');
                }
            }
        });
    }
    
    // Initialize delete button in the modal
    const deleteButton = modal.querySelector('.delete-account');
    if (deleteButton) {
        deleteButton.addEventListener('click', async (e) => {
            e.preventDefault();
            const userId = deleteButton.getAttribute('data-user-id');
            const userName = deleteButton.getAttribute('data-user-name');
            
            // Show a confirmation dialog
            if (confirm(`Are you sure you want to permanently delete the account for ${userName}? This action cannot be undone.`)) {
                try {
                    // Call the API to delete the user
                    await api.users.deleteUser(userId);
                    
                    // Close modal and reload the account list
                    modal.classList.remove('active');
                    loadAllUserAccounts();
                    
                    showNotification(`Account for ${userName} has been deleted`, 'success');
                } catch (error) {
                    console.error('Error deleting user account:', error);
                    showNotification(`Failed to delete account for ${userName}. Please try again.`, 'error');
                }
            }
        });
    }
}

/**
 * Fetch and update the active user count in the dashboard
 */
async function updateActiveUserCount() {
    try {
        // Fetch all users from the API with the isActive=true filter
        const response = await api.users.getUsers({ isActive: true });
        
        if (response && response.success) {
            // Get all stat cards in the dashboard
            const statCards = document.querySelectorAll('.stat-card');
            
            // For each stat card, check if it contains "Active Users" title
            statCards.forEach(card => {
                const titleElement = card.querySelector('.stat-content h3');
                if (titleElement && titleElement.textContent.trim() === 'Active Users') {
                    const countElement = card.querySelector('.stat-number');
                    if (countElement) {
                        countElement.textContent = response.total || 0;
                    }
                }
            });
            
            console.log('Active user count updated:', response.total);
        }
    } catch (error) {
        console.error('Error fetching active user count:', error);
    }
}

// Helper functions
function logAuthenticationState() {
    const token = localStorage.getItem('token');
    let tokenData = null;
    
    if (token) {
        try {
            // Parse token without verification (just for debugging)
            const payload = token.split('.')[1];
            const decodedPayload = atob(payload);
            tokenData = JSON.parse(decodedPayload);
            console.log('Token payload:', tokenData);
        } catch (error) {
            console.error('Error parsing token:', error);
        }
    }
    
    const role = api.auth.getUserRole();
    console.log('Current authentication state:', {
        isAuthenticated: api.auth.isAuthenticated(),
        token: token ? 'Present' : 'Missing',
        tokenExpiry: tokenData?.exp ? new Date(tokenData.exp * 1000).toLocaleString() : 'Unknown',
        userRole: role,
        userId: tokenData?.id || 'Unknown'
    });
    
    // Add to console a potential fetch call with headers
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : 'None'
    };
    
    console.log('Sample fetch headers that would be sent:', headers);
}

// Function to generate a new department code
function generateDepartmentCode(role) {
    const prefix = getRolePrefix(role);
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${year}${random}`;
}

// Helper function to add a new code to the history list
function addToCodeHistory(code, role) {
    console.log('Adding code to history:', code, 'for role:', role);
    const historyList = document.getElementById('code-history-list');
    if (!historyList) return;
    
    // Create new list item
    const listItem = document.createElement('li');
    listItem.classList.add('history-item', 'active');
    
    // Get role display name
    const roleDisplay = role === 'it_admin' ? 'IT Admin' : 
                       role === 'hr_admin' ? 'HR Admin' : 'Employee';
    
    // Set item content
    listItem.innerHTML = `
        <div class="code-text">${code}</div>
        <div class="code-info">
            <span class="code-status active">Active</span>
            <span class="code-expiry">Expires: Never</span>
        </div>
    `;
    
    // Add to the top of the list
    if (historyList.firstChild) {
        historyList.insertBefore(listItem, historyList.firstChild);
    } else {
        historyList.appendChild(listItem);
    }
    
    // Remove any "no data" messages
    const noDataItems = historyList.querySelectorAll('.no-data, .note');
    noDataItems.forEach(item => item.remove());
}

/**
 * IMPORTANT: This function directly adds event handlers to the department code buttons
 * This is a simplified approach that should work regardless of DOM structure
 */
function addDirectButtonHandlers() {
    console.log('Adding direct button handlers to department code buttons');
    
    // Find all the relevant elements
    const toggleButton = document.getElementById('toggle-code-visibility');
    const copyButton = document.getElementById('copy-code');
    const generateButton = document.getElementById('generate-new-code');
    const codeInput = document.getElementById('department-code');
    const roleTabs = document.querySelectorAll('.role-tab');
    
    console.log('Button elements found:', {
        toggleButton: toggleButton ? 'Found ✓' : 'Missing ✗',
        copyButton: copyButton ? 'Found ✓' : 'Missing ✗',
        generateButton: generateButton ? 'Found ✓' : 'Missing ✗',
        codeInput: codeInput ? 'Found ✓' : 'Missing ✗',
        roleTabs: roleTabs.length > 0 ? `Found ${roleTabs.length} tabs ✓` : 'Missing ✗'
    });
    
    // Track current role
    let currentRole = 'it_admin';
    roleTabs.forEach(tab => {
        if (tab.classList.contains('active')) {
            currentRole = tab.getAttribute('data-role') || 'it_admin';
        }
    });
    
    // 1. Toggle visibility button
    if (toggleButton) {
        // Remove existing click handlers (to prevent duplicates)
        toggleButton.removeEventListener('click', handleToggleClick);
        toggleButton.onclick = null;
        
        // Add new click handler
        toggleButton.addEventListener('click', handleToggleClick);
        console.log('Toggle button handler added ✓');
    }
    
    // 2. Copy code button
    if (copyButton) {
        // Remove existing click handlers (to prevent duplicates)
        copyButton.removeEventListener('click', handleCopyClick);
        copyButton.onclick = null;
        
        // Add new click handler
        copyButton.addEventListener('click', handleCopyClick);
        console.log('Copy button handler added ✓');
    }
    
    // 3. Generate new code button
    if (generateButton) {
        // Remove existing click handlers (to prevent duplicates)
        generateButton.removeEventListener('click', handleGenerateClick);
        generateButton.onclick = null;
        
        // Add new click handler
        generateButton.addEventListener('click', function(e) {
            handleGenerateClick.call(this, e, currentRole);
        });
        console.log('Generate button handler added ✓');
    }
    
    // 4. Role tabs
    roleTabs.forEach(tab => {
        // Remove existing click handlers (to prevent duplicates)
        tab.removeEventListener('click', handleRoleTabClick);
        
        // Add new click handler
        tab.addEventListener('click', handleRoleTabClick);
    });
    
    // Handler functions defined here to avoid scope issues
    function handleToggleClick(e) {
        console.log('Toggle button clicked');
        if (!codeInput) return;
        
        const type = codeInput.type === 'password' ? 'text' : 'password';
        codeInput.type = type;
        this.innerHTML = `<i class="fas fa-eye${type === 'password' ? '' : '-slash'}"></i>`;
    }
    
    function handleCopyClick(e) {
        console.log('Copy button clicked');
        if (!codeInput) return;
        
        navigator.clipboard.writeText(codeInput.value)
            .then(() => {
                showNotification('Code copied to clipboard!', 'success');
            })
            .catch(err => {
                console.error('Failed to copy code:', err);
                showNotification('Failed to copy code', 'error');
            });
    }
    
    function handleGenerateClick(e, role) {
        console.log('Generate button clicked for role:', role);
        
        // Find current role if not provided
        if (!role) {
            const activeTab = document.querySelector('.role-tab.active');
            role = activeTab ? activeTab.getAttribute('data-role') || 'it_admin' : 'it_admin';
        }
        
        // Get role display name
        const roleDisplayNames = {
            'it_admin': 'IT Admin',
            'hr_admin': 'HR Admin',
            'employee': 'Employee'
        };
        const roleName = roleDisplayNames[role] || role;
        
        if (confirm(`Generate new department code for ${roleName}? This will invalidate the current code.`)) {
            // Show loading state
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
            this.disabled = true;
            
            // Generate a new code
            const newCode = generateDepartmentCode(role);
            console.log('Generated new code:', newCode);
            
            // Set up the code data to send to the API
            const codeRoleText = document.getElementById('code-role-text');
            const codeData = {
                code: newCode,
                department: role === 'hr_admin' ? 'HR' : 
                          role === 'it_admin' ? 'IT' : 'General',
                description: `${codeRoleText ? codeRoleText.textContent : 'Department'} Code`,
                allowedRoles: [role],
                isActive: true,
                expiresAt: null
            };
            
            // Send the new code to the API
            api.departmentCodes.createDepartmentCode(codeData)
                .then(response => {
                    if (response && response.success) {
                        console.log('New code saved to API:', response.data);
                        
                        // Update the code input
                        if (codeInput) {
                            codeInput.value = newCode;
                        }
                        
                        // Update the history list
                        addToCodeHistory(newCode, role);
                        
                        // Show success notification
                        showNotification(`New ${roleName} department code generated: ${newCode}`, 'success');
                    } else {
                        throw new Error(response.message || 'Failed to generate code');
                    }
                })
                .catch(error => {
                    console.error('Error generating code:', error);
                    showNotification('Failed to generate new code', 'error');
                })
                .finally(() => {
                    // Reset button state
                    this.innerHTML = '<i class="fas fa-key"></i> Generate New Code';
                    this.disabled = false;
                });
        }
    }
    
    function handleRoleTabClick(e) {
        console.log('Role tab clicked directly:', this.textContent);
        
        // Get all tabs
        const tabs = document.querySelectorAll('.role-tab');
        
        // Remove active class from all tabs
        tabs.forEach(t => t.classList.remove('active'));
        
        // Add active class to clicked tab
        this.classList.add('active');
        
        // Update current role
        currentRole = this.getAttribute('data-role') || 'it_admin';
        
        // Update code display
        const codeInput = document.getElementById('department-code');
        const codeRoleText = document.getElementById('code-role-text');
        
        // Update code input and role text based on selected role
        if (currentRole === 'it_admin') {
            codeInput.value = 'IT2024';
            codeRoleText.textContent = 'IT';
        } else if (currentRole === 'hr_admin') {
            codeInput.value = 'HR2024';
            codeRoleText.textContent = 'HR';
        } else if (currentRole === 'employee') {
            codeInput.value = 'EMP2024';
            codeRoleText.textContent = 'Employee';
        }
        
        // Update the generate button's handler to use the new role
        const generateButton = document.getElementById('generate-new-code');
        if (generateButton) {
            generateButton.removeEventListener('click', handleGenerateClick);
            generateButton.onclick = null;
            
            // Add new click handler with updated role
            generateButton.addEventListener('click', function(e) {
                handleGenerateClick.call(this, e, currentRole);
            });
        }
    }
}

// IMPORTANT - Completely replace the setupDepartmentCodeButtons function
function setupDepartmentCodeButtons() {
    console.log('Setting up department code buttons - calling addDirectButtonHandlers');
    addDirectButtonHandlers();
}

// DIRECT GLOBAL FUNCTIONS FOR INLINE ONCLICK ATTRIBUTES
// These functions are called directly from the HTML using inline onclick attributes

/**
 * Toggles the visibility of the department code input field
 * Called directly from the HTML via onclick attribute
 */
function toggleCodeVisibilityDirect() {
    console.log('Toggle code visibility called directly from HTML');
    const codeInput = document.getElementById('department-code');
    const toggleButton = document.getElementById('toggle-code-visibility');
    
    if (!codeInput || !toggleButton) {
        console.error('Required elements not found');
        return;
    }
    
    const type = codeInput.type === 'password' ? 'text' : 'password';
    codeInput.type = type;
    toggleButton.innerHTML = `<i class="fas fa-eye${type === 'password' ? '' : '-slash'}"></i>`;
    
    // Show success notification
    showNotification('Code visibility toggled', 'info');
}

/**
 * Copies the department code to the clipboard
 * Called directly from the HTML via onclick attribute
 */
function copyCodeToClipboardDirect() {
    console.log('Copy code called directly from HTML');
    const codeInput = document.getElementById('department-code');
    
    if (!codeInput) {
        console.error('Code input element not found');
        return;
    }
    
    const codeValue = codeInput.value;
    
    // Use the clipboard API to copy the code
    navigator.clipboard.writeText(codeValue)
        .then(() => {
            console.log('Code copied successfully:', codeValue);
            showNotification('Code copied to clipboard!', 'success');
        })
        .catch(err => {
            console.error('Failed to copy code:', err);
            showNotification('Failed to copy code', 'error');
        });
}

/**
 * Switches the active role
 * Called directly from the HTML via onclick attribute
 * @param {string} role - The role to switch to
 * @param {HTMLElement} tabElement - The tab element that was clicked
 */
function switchRoleDirect(role, tabElement) {
    console.log('Switch role called directly from HTML:', role);
    
    // Get UI elements
    const tabs = document.querySelectorAll('.role-tab');
    const codeInput = document.getElementById('department-code');
    const codeRoleText = document.getElementById('code-role-text');
    
    if (!tabs.length || !codeInput || !codeRoleText) {
        console.error('Required elements not found');
        return;
    }
    
    // Remove active class from all tabs
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Add active class to the clicked tab
    tabElement.classList.add('active');
    
    // Update the code display based on the selected role
    if (role === 'it_admin') {
        codeInput.value = 'IT2024';
        codeRoleText.textContent = 'IT';
    } else if (role === 'hr_admin') {
        codeInput.value = 'HR2024';
        codeRoleText.textContent = 'HR';
    } else if (role === 'employee') {
        codeInput.value = 'EMP2024';
        codeRoleText.textContent = 'Employee';
    }
    
    // Try to load the code history for this role
    showDefaultCodeHistoryDirect(role);
}

/**
 * Generates a new department code
 * Called directly from the HTML via onclick attribute
 */
function generateNewCodeDirect() {
    console.log('Generate new code called directly from HTML');
    
    // Find active role tab
    const activeTab = document.querySelector('.role-tab.active');
    if (!activeTab) {
        console.error('No active role tab found');
        showNotification('Error: Role not selected', 'error');
        return;
    }
    
    const role = activeTab.getAttribute('data-role') || 'it_admin';
    const roleName = role === 'it_admin' ? 'IT Admin' : 
                    role === 'hr_admin' ? 'HR Admin' : 'Employee';
    
    // Get UI elements
    const codeInput = document.getElementById('department-code');
    const generateButton = document.getElementById('generate-new-code');
    const codeRoleText = document.getElementById('code-role-text');
    
    if (!codeInput || !generateButton) {
        console.error('Required elements not found');
        showNotification('Error: UI elements not found', 'error');
        return;
    }
    
    // Confirm with the user
    if (confirm(`Generate new department code for ${roleName}? This will invalidate the current code.`)) {
        // Show loading state
        generateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        generateButton.disabled = true;
        
        // Generate a new code
        const prefix = role === 'it_admin' ? 'IT' : 
                      role === 'hr_admin' ? 'HR' : 'EMP';
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const newCode = `${prefix}${year}${random}`;
        
        console.log('New code generated:', newCode);
        
        // Set up the code data to send to the API
        const codeData = {
            code: newCode,
            department: role === 'hr_admin' ? 'HR' : 
                       role === 'it_admin' ? 'IT' : 'General',
            description: `${codeRoleText ? codeRoleText.textContent : 'Department'} Code`,
            allowedRoles: [role],
            isActive: true,
            expiresAt: null
        };
        
        // Send the new code to the API
        api.departmentCodes.createDepartmentCode(codeData)
            .then(response => {
                if (response && response.success) {
                    console.log('New code saved to API:', response.data);
                    
                    // Update the code input
                    codeInput.value = newCode;
                    
                    // Update the history
                    addToCodeHistoryDirect(newCode, role);
                    
                    // Show success notification
                    showNotification(`New ${roleName} department code generated: ${newCode}`, 'success');
                } else {
                    throw new Error(response.message || 'Failed to generate code');
                }
            })
            .catch(error => {
                console.error('Error generating code:', error);
                showNotification('Failed to generate new code', 'error');
            })
            .finally(() => {
                // Reset button state
                generateButton.innerHTML = '<i class="fas fa-key"></i> Generate New Code';
                generateButton.disabled = false;
            });
    }
}

/**
 * Adds a new code to the history list
 * @param {string} code - The generated code
 * @param {string} role - The role the code was generated for
 */
function addToCodeHistoryDirect(code, role) {
    console.log('Adding code to history directly:', code, 'for role:', role);
    
    // Get the history list
    const historyList = document.querySelector('.history-list');
    if (!historyList) {
        console.error('History list element not found');
        return;
    }
    
    // Get role display name
    const roleDisplay = role === 'it_admin' ? 'IT Admin' : 
                       role === 'hr_admin' ? 'HR Admin' : 'Employee';
    
    // Create a new history item
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.innerHTML = `
        <span class="code-value">${code}</span>
        <span class="code-role">(${roleDisplay})</span>
        <span class="code-date">Current</span>
        <span class="code-status active">Active</span>
    `;
    
    // Mark any previous "Current" items as expired
    const existingItems = historyList.querySelectorAll('.history-item');
    existingItems.forEach(item => {
        const dateSpan = item.querySelector('.code-date');
        const statusSpan = item.querySelector('.code-status');
        
        if (dateSpan && dateSpan.textContent === 'Current') {
            const today = new Date();
            const formattedDate = `${(today.getMonth()+1).toString().padStart(2, '0')}/${today.getDate().toString().padStart(2, '0')}/${today.getFullYear()}`;
            dateSpan.textContent = `Expired: ${formattedDate}`;
            
            if (statusSpan) {
                statusSpan.textContent = 'Expired';
                statusSpan.className = 'code-status expired';
            }
        }
    });
    
    // Add the new item to the top of the list
    if (historyList.firstChild) {
        historyList.insertBefore(historyItem, historyList.firstChild);
    } else {
        historyList.appendChild(historyItem);
    }
}

/**
 * Shows default code history for a role
 * @param {string} role - The role to show history for
 */
function showDefaultCodeHistoryDirect(role) {
    console.log('Showing default code history directly for role:', role);
    
    // Get the prefix for the role
    const prefix = role === 'it_admin' ? 'IT' : 
                  role === 'hr_admin' ? 'HR' : 'EMP';
    
    // Get the current year
    const currentYear = new Date().getFullYear();
    
    // Get the history list
    const historyList = document.querySelector('.history-list');
    if (!historyList) {
        console.error('History list element not found');
        return;
    }
    
    // Clear existing history
    historyList.innerHTML = '';
    
    // Create a new history item for the current role
    const currentHistoryItem = document.createElement('div');
    currentHistoryItem.className = 'history-item';
    currentHistoryItem.innerHTML = `
        <span class="code-value">${prefix}${currentYear}</span>
        <span class="code-role">(${role === 'it_admin' ? 'IT Admin' : role === 'hr_admin' ? 'HR Admin' : 'Employee'})</span>
        <span class="code-date">Current</span>
        <span class="code-status active">Active</span>
    `;
    
    // Create a history item for the previous year
    const previousHistoryItem = document.createElement('div');
    previousHistoryItem.className = 'history-item';
    previousHistoryItem.innerHTML = `
        <span class="code-value">${prefix}${currentYear-1}</span>
        <span class="code-role">(${role === 'it_admin' ? 'IT Admin' : role === 'hr_admin' ? 'HR Admin' : 'Employee'})</span>
        <span class="code-date">Expired: 01/01/${currentYear}</span>
        <span class="code-status expired">Expired</span>
    `;
    
    // Add the items to the history list
    historyList.appendChild(currentHistoryItem);
    historyList.appendChild(previousHistoryItem);
}

/**
 * Initialize the communication section
 */
function initializeCommunication() {
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
        const subject = `Message from IT Dashboard`;
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
        
        // Filter out IT department staff (already visible in IT section)
        const filteredEmployees = employees.filter(emp => 
            (emp.department || '').toUpperCase() !== 'IT'
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