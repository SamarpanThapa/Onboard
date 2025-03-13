document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded');

    initializeSections();
    initializeSidebar();
    initializeDateTime();
    initializeCharts();
    initializeInteractiveElements();
    initializeApprovalButtons();
    initializeDepartmentCodeManagement();
    initializeSearch();
    initializeFilters();
});

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
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    const sidebarLinks = document.querySelectorAll('.sidebar a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            sidebarLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            const targetId = this.getAttribute('href').substring(1);
            const sections = document.querySelectorAll('.dashboard-section');
            
            sections.forEach(section => {
                section.style.opacity = '0';
                setTimeout(() => {
                    section.style.display = 'none';
                }, 300);
            });

            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                setTimeout(() => {
                    targetSection.style.display = 'block';
                    requestAnimationFrame(() => {
                        targetSection.style.opacity = '1';
                    });
                }, 300);
            }

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
    const codeInput = document.getElementById('department-code');
    const toggleButton = document.getElementById('toggle-code-visibility');
    const copyButton = document.getElementById('copy-code');
    const generateButton = document.getElementById('generate-new-code');

    if (toggleButton) {
        toggleButton.addEventListener('click', () => {
            const type = codeInput.type === 'password' ? 'text' : 'password';
            codeInput.type = type;
            toggleButton.innerHTML = `<i class="fas fa-eye${type === 'password' ? '' : '-slash'}"></i>`;
        });
    }

    if (copyButton) {
        copyButton.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(codeInput.value);
                showNotification('Code copied to clipboard!', 'success');
            } catch (err) {
                showNotification('Failed to copy code', 'error');
            }
        });
    }

    if (generateButton) {
        generateButton.addEventListener('click', () => {
            if (confirm('Generate new department code? This will invalidate the current code.')) {
                const newCode = generateDepartmentCode();
                const currentCode = codeInput.value;
                
                // Update the code display
                codeInput.value = newCode;
                
                // Add the old code to history
                addToCodeHistory(currentCode);
                
                showNotification('New department code generated!', 'success');
            }
        });
    }
}

function generateDepartmentCode() {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `IT${year}${random}`;
}

function addToCodeHistory(code) {
    const historyList = document.querySelector('.history-list');
    if (!historyList) return;

    // Move current code to history
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.innerHTML = `
        <span class="code-value">${code}</span>
        <span class="code-date">Expired: ${new Date().toLocaleDateString()}</span>
        <span class="code-status expired">Expired</span>
    `;

    // Add new history item at the top of the list
    historyList.insertBefore(historyItem, historyList.firstChild);
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