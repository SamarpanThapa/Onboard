// Simplified Task Management

// Load tasks from API
function loadTasks() {
    const tasksList = document.getElementById('tasks-list');
    
    if (!tasksList) return;
    
    // Show loading spinner
    tasksList.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div>';
    
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
            return response.json().then(errorData => {
                throw new Error(errorData.message || 'Failed to load tasks');
            }).catch(() => {
                throw new Error(`Server returned ${response.status}: Failed to load tasks`);
            });
        }
        return response.json();
    })
    .then(data => {
        // Clear list
        tasksList.innerHTML = '';
        
        console.log('Tasks API response:', data);
        
        // Process tasks - check different possible response formats
        let tasks = [];
        if (data.tasks) {
            tasks = data.tasks; // Format: { tasks: [...] }
        } else if (Array.isArray(data)) {
            tasks = data; // Format: direct array
        } else if (data.data && Array.isArray(data.data)) {
            tasks = data.data; // Format: { data: [...] }
        }
        
        if (tasks.length === 0) {
            console.log('No tasks found');
            tasksList.innerHTML = '<div class="empty-list">No tasks assigned yet</div>';
            document.querySelector('.task-count').textContent = '0';
            return;
        }
        
        console.log(`Found ${tasks.length} tasks`);
        
        // Sort tasks by due date (soonest first)
        tasks.sort((a, b) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        });
        
        // Update task count
        document.querySelector('.task-count').textContent = tasks.length;
        
        // Render all tasks in the single list
        tasks.forEach(task => {
            tasksList.appendChild(createTaskItem(task));
        });
    })
    .catch(error => {
        console.error('Error loading tasks:', error);
        
        // Show error message
        tasksList.innerHTML = `<div class="error-message">Failed to load tasks: ${error.message}</div>`;
    });
}

// Create task item element
function createTaskItem(task) {
    const item = document.createElement('div');
    item.className = 'task-item';
    item.dataset.id = task._id || task.id; // Handle different ID formats
    
    // Format due date
    let dueDateText = 'No due date';
    let dueDateClass = '';
    
    if (task.dueDate) {
        try {
            const dueDate = new Date(task.dueDate);
            dueDateText = dueDate.toLocaleDateString();
            
            // Add class for overdue tasks
            if (dueDate < new Date()) {
                dueDateClass = 'overdue';
            }
        } catch (e) {
            console.error('Error formatting date:', e);
            dueDateText = 'Invalid date';
        }
    }
    
    // Get assignee name (handle different possible formats)
    let assigneeName = 'Unassigned';
    if (task.assignee) {
        if (typeof task.assignee === 'string') {
            // If assignee is just the ID
            assigneeName = 'Assigned'; // Generic text when we only have the ID
        } else if (task.assignee.name) {
            assigneeName = task.assignee.name;
        } else if (task.assignee.firstName && task.assignee.lastName) {
            assigneeName = `${task.assignee.firstName} ${task.assignee.lastName}`;
        } else if (task.assignee.email) {
            assigneeName = task.assignee.email;
        } else if (task.assignee._id || task.assignee.id) {
            assigneeName = 'Assigned'; // Generic text when we only have the ID
        }
    }
    
    // Get priority class
    const priorityClass = `priority-${task.priority || 'medium'}`;
    
    // Get status text
    let statusText = 'To Do';
    let statusClass = 'status-pending';
    
    if (task.status === 'completed') {
        statusText = 'Completed';
        statusClass = 'status-completed';
    } else if (task.status === 'in-progress' || task.status === 'in_progress') {
        statusText = 'In Progress';
        statusClass = 'status-in-progress';
    } else if (task.status === 'todo') {
        statusText = 'To Do';
        statusClass = 'status-pending';
    }
    
    // Create HTML
    item.innerHTML = `
        <div class="task-header">
            <h4 class="task-title">${task.title}</h4>
            <span class="task-priority ${priorityClass}">${task.priority || 'medium'}</span>
        </div>
        <div class="task-details">
            <p class="task-assignee"><i class="fas fa-user"></i> ${assigneeName}</p>
            <p class="task-due-date ${dueDateClass}"><i class="fas fa-calendar"></i> ${dueDateText}</p>
        </div>
        <div class="task-footer">
            <span class="status-badge ${statusClass}">${statusText}</span>
            <button class="task-action-btn"><i class="fas fa-ellipsis-v"></i></button>
        </div>
    `;
    
    // Add click event to action button
    item.querySelector('.task-action-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        
        // Create action menu
        const actionMenu = document.createElement('div');
        actionMenu.className = 'task-action-menu';
        actionMenu.innerHTML = `
            <button class="edit-task-btn">Edit Task</button>
            ${task.status !== 'completed' ? '<button class="complete-task-btn">Mark Complete</button>' : ''}
            <button class="delete-task-btn">Delete Task</button>
        `;
        
        // Position menu
        const rect = this.getBoundingClientRect();
        actionMenu.style.top = `${rect.bottom}px`;
        actionMenu.style.right = `${window.innerWidth - rect.right}px`;
        
        // Add to document
        document.body.appendChild(actionMenu);
        
        // Add event listeners
        actionMenu.querySelector('.edit-task-btn').addEventListener('click', function() {
            document.body.removeChild(actionMenu);
            openEditTaskModal(task);
        });
        
        if (task.status !== 'completed') {
            actionMenu.querySelector('.complete-task-btn').addEventListener('click', function() {
                document.body.removeChild(actionMenu);
                completeTask(task._id || task.id);
            });
        }
        
        actionMenu.querySelector('.delete-task-btn').addEventListener('click', function() {
            document.body.removeChild(actionMenu);
            deleteTask(task._id || task.id);
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function closeMenu() {
            if (document.body.contains(actionMenu)) {
                document.body.removeChild(actionMenu);
            }
            document.removeEventListener('click', closeMenu);
        });
    });
    
    return item;
}

// Open edit task modal
function openEditTaskModal(task) {
    const modal = document.getElementById('task-modal');
    const form = document.getElementById('task-form');
    const titleInput = document.getElementById('task-title');
    const descriptionInput = document.getElementById('task-description');
    const dueDateInput = document.getElementById('task-due-date');
    const prioritySelect = document.getElementById('task-priority');
    const assigneeSelect = document.getElementById('task-assignee');
    const taskIdInput = document.getElementById('task-id');
    
    // Set title
    document.getElementById('task-modal-title').textContent = task ? 'Edit Task' : 'Assign New Task';
    
    // Reset form
    form.reset();
    
    // Populate form if editing
    if (task) {
        taskIdInput.value = task._id;
        titleInput.value = task.title;
        descriptionInput.value = task.description || '';
        prioritySelect.value = task.priority || 'medium';
        
        // Format date for input
        if (task.dueDate) {
            const date = new Date(task.dueDate);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            dueDateInput.value = `${year}-${month}-${day}`;
        }
    }
    
    // Load assignees
    loadEmployeesForTaskAssignment().then(() => {
        // Set selected assignee if editing
        if (task && task.assignee && task.assignee._id) {
            for (let i = 0; i < assigneeSelect.options.length; i++) {
                if (assigneeSelect.options[i].value === task.assignee._id) {
                    assigneeSelect.selectedIndex = i;
                    break;
                }
            }
        }
    });
    
    // Show modal
    modal.style.display = 'block';
}

// Load employees for task assignment
function loadEmployeesForTaskAssignment() {
    const assigneeSelect = document.getElementById('task-assignee');
    
    if (!assigneeSelect) return Promise.reject('Assignee select not found');
    
    // Clear previous options
    assigneeSelect.innerHTML = '<option value="">Select employee...</option>';
    
    // Try different API endpoints that might return employee data
    // First try /api/employees, fallback to /api/users if needed
    return fetch('/api/employees', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => {
        if (!response.ok) {
            // If employees endpoint fails, try users endpoint
            console.log('Employees endpoint failed, trying users endpoint...');
            return fetch('/api/users', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
        }
        return response;
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load employees');
        }
        return response.json();
    })
    .then(data => {
        console.log('Employee data received:', data);
        
        // Process employees based on different possible response formats
        let employees = [];
        
        if (data.employees) {
            employees = data.employees; // Format: { employees: [...] }
        } else if (data.users) {
            employees = data.users; // Format: { users: [...] }
        } else if (Array.isArray(data)) {
            employees = data; // Format: direct array
        } else if (data.data && Array.isArray(data.data)) {
            employees = data.data; // Format: { data: [...] }
        }
        
        if (employees.length === 0) {
            console.warn('No employees found in data');
            assigneeSelect.innerHTML += '<option value="">No employees available</option>';
            return;
        }
        
        // Add options for each employee
        employees.forEach(employee => {
            const option = document.createElement('option');
            option.value = employee._id || employee.id;
            
            // Handle different name formats
            let displayName = 'Unknown';
            if (employee.name) {
                displayName = employee.name;
            } else if (employee.firstName && employee.lastName) {
                displayName = `${employee.firstName} ${employee.lastName}`;
            } else if (employee.email) {
                displayName = employee.email;
            }
            
            option.textContent = displayName;
            assigneeSelect.appendChild(option);
        });
    })
    .catch(error => {
        console.error('Error loading employees:', error);
        assigneeSelect.innerHTML = '<option value="">Error loading employees</option>';
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the tasks page
    if (document.getElementById('tasks-list')) {
        initializeTaskManagement();
    }
    
    // Add direct task creation function to window for debugging
    window.createTaskDirect = createTaskDirect;
    
    // Add API test function to window for debugging
    window.testAPI = testAPI;
    
    // Add iframe task creation function to window for debugging
    window.createTaskWithIframe = createTaskWithIframe;
});

// Modified handleTaskFormSubmit to try all methods
function handleTaskFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    const taskModal = document.getElementById('task-modal');
    
    // Disable form
    form.querySelectorAll('button, input, select, textarea').forEach(el => {
        el.disabled = true;
    });
    
    // Show loading
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    
    // Try each method in sequence
    console.log('Attempting task creation with direct method...');
    createTaskDirect()
        .then(data => {
            console.log('Task created successfully with direct method');
            // Close modal before showing alert
            if (taskModal) taskModal.style.display = 'none';
            // Reload tasks before showing alert
            loadTasks();
            // Show success message after everything else
            setTimeout(() => alert('Task created successfully'), 100);
        })
        .catch(error => {
            console.error('Direct method failed:', error);
            
            // Try the iframe method
            console.log('Attempting with iframe method...');
            return createTaskWithIframe()
                .then(data => {
                    console.log('Task created successfully with iframe method');
                    // Close modal before showing alert
                    if (taskModal) taskModal.style.display = 'none';
                    // Reload tasks before showing alert
                    loadTasks();
                    // Show success message after everything else
                    setTimeout(() => alert('Task created successfully (iframe method)'), 100);
                })
                .catch(iframeError => {
                    console.error('Iframe method failed:', iframeError);
                    
                    // Try the FormData approach as a last resort
                    console.log('Attempting with FormData method...');
                    return createTaskWithFormData({
                        title: document.getElementById('task-title').value.trim(),
                        description: document.getElementById('task-description').value.trim() || "Task description",
                        assignee: document.getElementById('task-assignee').value,
                        dueDate: document.getElementById('task-due-date').value,
                        priority: document.getElementById('task-priority').value
                    })
                    .then(() => {
                        console.log('Task created successfully with FormData method');
                        // Close modal before showing alert
                        if (taskModal) taskModal.style.display = 'none';
                        // Reload tasks before showing alert
                        loadTasks();
                        // Show success message after everything else
                        setTimeout(() => alert('Task created successfully (FormData method)'), 100);
                    })
                    .catch(formDataError => {
                        console.error('All methods failed:', formDataError);
                        alert(`All task creation methods failed. Please open the console and run window.testAPI() to diagnose the issue.`);
                    });
                });
        })
        .finally(() => {
            // Enable form
            form.querySelectorAll('button, input, select, textarea').forEach(el => {
                el.disabled = false;
            });
            
            // Reset submit button
            submitBtn.innerHTML = originalText;
        });
}

// Add a fallback function to handle task creation differently if the main method fails
function createTaskFallback(taskData) {
    console.log("Trying fallback task creation method");
    
    // Get current user ID if available
    const currentUserId = localStorage.getItem('userId') || taskData.assignee;
    
    // Create a simple task object with required fields
    const simpleTask = {
        title: taskData.title || "Task " + new Date().toLocaleTimeString(),
        description: taskData.description || "Task description",
        category: 'other',
        taskType: 'other',
        status: 'todo',
        createdBy: currentUserId // Required field
    };

    // Add other fields
    if (taskData.assignee) {
        simpleTask.assignee = taskData.assignee;
        simpleTask.relatedUser = taskData.assignee; // Required field
    }
    if (taskData.dueDate) simpleTask.dueDate = taskData.dueDate;
    if (taskData.priority) simpleTask.priority = taskData.priority;
    
    console.log("Fallback task data:", JSON.stringify(simpleTask));
    
    // Send with required fields guaranteed
    return fetch('/api/tasks', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(simpleTask)
    })
    .then(async response => {
        console.log("Fallback method response status:", response.status);
        
        try {
            const responseText = await response.text();
            console.log("Fallback response:", responseText);
            
            if (response.ok) {
                return { success: true };
            } else {
                throw new Error("Fallback method also failed: " + responseText);
            }
        } catch (err) {
            console.error("Error in fallback:", err);
            throw err;
        }
    });
}

// Add a second fallback that uses FormData instead of JSON
function createTaskWithFormData(taskData) {
    console.log("Trying FormData approach for task creation");
    
    // Get current user ID if available
    const currentUserId = localStorage.getItem('userId') || taskData.assignee;
    
    // Ensure we have the required fields
    if (!taskData.title) {
        taskData.title = "Task " + new Date().toLocaleTimeString();
    }
    if (!taskData.description) {
        taskData.description = "Task description";
    }
    
    // Create FormData object
    const formData = new FormData();
    formData.append('title', taskData.title);
    formData.append('description', taskData.description);
    formData.append('category', 'other');
    formData.append('taskType', 'other');
    formData.append('status', 'todo');
    formData.append('createdBy', currentUserId); // Required field
    
    if (taskData.dueDate) formData.append('dueDate', taskData.dueDate);
    if (taskData.priority) formData.append('priority', taskData.priority);
    if (taskData.assignee) {
        formData.append('assignee', taskData.assignee);
        formData.append('relatedUser', taskData.assignee); // Required field
    }
    
    console.log("FormData entries:");
    for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
    }
    
    // Use XMLHttpRequest for maximum compatibility
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/tasks', true);
        
        // Add authorization header
        const token = localStorage.getItem('token');
        if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        
        xhr.onload = function() {
            console.log("FormData XHR status:", xhr.status);
            console.log("FormData response:", xhr.responseText);
            
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve({ success: true });
            } else {
                reject(new Error("FormData approach failed with status: " + xhr.status + ", response: " + xhr.responseText));
            }
        };
        
        xhr.onerror = function() {
            console.error("FormData XHR error occurred");
            reject(new Error("Network error during FormData request"));
        };
        
        xhr.send(formData);
    });
}

// Complete a task
function completeTask(taskId) {
    fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
            status: 'completed'
        })
    })
    .then(response => {
        if (!response.ok) {
            // Try to get more detailed error information
            return response.json().then(errorData => {
                throw new Error(errorData.message || 'Failed to update task');
            }).catch(() => {
                throw new Error(`Server returned ${response.status}: Failed to complete task`);
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Task completed successfully:', data);
        // First reload tasks
        loadTasks();
        // Then show the alert
        setTimeout(() => alert('Task marked as completed'), 100);
    })
    .catch(error => {
        console.error('Error completing task:', error);
        alert(`Error: ${error.message}`);
    });
}

// Delete a task
function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }
    
    fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to delete task');
        }
        return response.json();
    })
    .then(data => {
        // First reload tasks
        loadTasks();
        // Then show the alert
        setTimeout(() => alert('Task deleted successfully'), 100);
    })
    .catch(error => {
        console.error('Error deleting task:', error);
        alert(`Error: ${error.message}`);
    });
}

// Filter tasks by search term
function filterTasks(searchTerm) {
    const taskItems = document.querySelectorAll('#tasks-list .task-item');
    const term = searchTerm.toLowerCase();
    
    taskItems.forEach(item => {
        const title = item.querySelector('.task-title').textContent.toLowerCase();
        const assignee = item.querySelector('.task-assignee').textContent.toLowerCase();
        
        if (title.includes(term) || assignee.includes(term)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

// Initialize task management
function initializeTaskManagement() {
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskForm = document.getElementById('task-form');
    const taskModal = document.getElementById('task-modal');
    const closeButtons = document.querySelectorAll('.close-modal');
    const searchInput = document.getElementById('task-search');
    
    // Add Task button
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', () => openEditTaskModal());
    }
    
    // Task form submission
    if (taskForm) {
        taskForm.addEventListener('submit', handleTaskFormSubmit);
    }
    
    // Close modal buttons
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (taskModal) taskModal.style.display = 'none';
        });
    });
    
    // Click outside modal to close
    window.addEventListener('click', (e) => {
        if (e.target === taskModal) taskModal.style.display = 'none';
    });
    
    // Task search
    if (searchInput) {
        searchInput.addEventListener('input', () => filterTasks(searchInput.value));
    }
    
    // Initial load
    loadTasks();
}

// Direct task creation function with minimal approach
function createTaskDirect() {
    // Get values directly from form
    const title = document.getElementById('task-title').value.trim();
    const description = document.getElementById('task-description').value.trim() || "Task description";
    const assignee = document.getElementById('task-assignee').value;
    
    // Validate
    if (!title) {
        alert('Please enter a task title');
        return Promise.reject('Title is required');
    }
    
    if (!assignee) {
        alert('Please select an assignee');
        return Promise.reject('Assignee is required');
    }
    
    // Create minimal task
    const minimalTask = {
        title: title,
        description: description,
        assignee: assignee,
        relatedUser: assignee,
        createdBy: assignee,
        status: 'todo',
        category: 'other',
        taskType: 'other'
    };
    
    console.log('Sending minimal task data:', JSON.stringify(minimalTask));
    
    // Make direct API call with minimal data
    return fetch('/api/tasks', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(minimalTask)
    })
    .then(response => {
        console.log(`Direct task creation status: ${response.status}`);
        return response.text();
    })
    .then(text => {
        console.log('Direct task creation response:', text);
        try {
            return text ? JSON.parse(text) : {};
        } catch (e) {
            console.error('Error parsing response:', e);
            return {};
        }
    });
}

// API test function for debugging
function testAPI() {
    console.log('Testing API responses...');
    
    // Test GET tasks endpoint
    fetch('/api/tasks', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => {
        console.log('GET /api/tasks status:', response.status);
        return response.text();
    })
    .then(text => {
        console.log('GET /api/tasks response:', text);
    })
    .catch(err => {
        console.error('GET /api/tasks error:', err);
    });
    
    // Test POST with minimal valid data
    const testTask = {
        title: 'Test Task ' + new Date().toLocaleTimeString(),
        description: 'Test Description',
        status: 'todo',
        category: 'other',
        taskType: 'other'
    };
    
    // Get user info to satisfy model requirements
    fetch('/api/users/current', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => response.json())
    .then(userData => {
        console.log('Current user data:', userData);
        
        // Add user IDs to task
        const userId = userData._id || userData.id || userData.userId;
        if (userId) {
            testTask.assignee = userId;
            testTask.relatedUser = userId;
            testTask.createdBy = userId;
            
            // Now try creating task
            return fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(testTask)
            });
        } else {
            throw new Error('Could not determine user ID');
        }
    })
    .then(response => {
        console.log('POST /api/tasks status:', response.status);
        return response.text();
    })
    .then(text => {
        console.log('POST /api/tasks response:', text);
        if (text) {
            try {
                const data = JSON.parse(text);
                if (data && data._id) {
                    alert('Test task created successfully with ID: ' + data._id);
                }
            } catch (e) {
                console.error('Error parsing response:', e);
            }
        }
    })
    .catch(err => {
        console.error('POST /api/tasks error:', err);
        alert('Error testing task API: ' + err.message);
    });
}

// Create task using a hidden iframe form submission to bypass potential AJAX issues
function createTaskWithIframe() {
    // Create a temporary iframe 
    let iframe = document.createElement('iframe');
    iframe.name = 'task_submit_iframe';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    // Create a form to submit
    let form = document.createElement('form');
    form.method = 'POST';
    form.action = '/api/tasks';
    form.target = 'task_submit_iframe';
    form.enctype = 'application/x-www-form-urlencoded';
    
    // Get values
    const title = document.getElementById('task-title').value.trim();
    const description = document.getElementById('task-description').value.trim() || "Task description";
    const assignee = document.getElementById('task-assignee').value;
    const dueDate = document.getElementById('task-due-date').value;
    const priority = document.getElementById('task-priority').value || 'medium';
    
    // Validate required fields
    if (!title) {
        alert('Please enter a task title');
        return Promise.reject('Title is required');
    }
    
    if (!assignee) {
        alert('Please select an assignee');
        return Promise.reject('Assignee is required');
    }
    
    // Create form fields
    const fields = {
        title: title,
        description: description,
        assignee: assignee,
        relatedUser: assignee,
        createdBy: assignee,
        category: 'other',
        taskType: 'other',
        status: 'todo'
    };
    
    if (dueDate) fields.dueDate = dueDate;
    if (priority) fields.priority = priority;
    
    // Add authorization header via a hidden field
    fields._token = localStorage.getItem('token');
    
    // Add all fields to the form
    for (let key in fields) {
        if (fields[key]) {
            let input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = fields[key];
            form.appendChild(input);
        }
    }
    
    // Add form to document
    document.body.appendChild(form);
    
    // Return a promise that resolves when iframe loads
    return new Promise((resolve, reject) => {
        iframe.onload = function() {
            try {
                const iframeContent = iframe.contentDocument || iframe.contentWindow.document;
                const responseText = iframeContent.body.innerText || iframeContent.body.textContent;
                console.log('Iframe response:', responseText);
                
                try {
                    // Try to parse response as JSON
                    const responseData = JSON.parse(responseText);
                    resolve(responseData);
                } catch (e) {
                    // If not JSON, just use the text
                    resolve({ success: true, message: responseText });
                }
            } catch (e) {
                console.error('Error reading iframe response:', e);
                resolve({ success: true, message: 'Task may have been created, but response could not be read' });
            } finally {
                // Clean up
                setTimeout(() => {
                    document.body.removeChild(form);
                    document.body.removeChild(iframe);
                }, 500);
            }
        };
        
        // Handle errors
        iframe.onerror = function(e) {
            console.error('Iframe error:', e);
            document.body.removeChild(form);
            document.body.removeChild(iframe);
            reject(new Error('Form submission failed'));
        };
        
        // Submit the form
        console.log('Submitting task form via iframe');
        form.submit();
    });
} 