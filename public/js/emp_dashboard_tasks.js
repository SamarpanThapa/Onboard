// Initialize task functionality for employee dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Load assigned tasks when the page loads
    loadAssignedTasks();
});

// Fetch assigned tasks from API
async function loadAssignedTasks() {
    try {
        console.log('Loading assigned tasks for employee...');
        const response = await fetch('/api/tasks?assignedTo=me&status=not_started,in_progress,completed', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load tasks');
        }

        const data = await response.json();
        console.log('Employee tasks data received:', data);
        
        if (!data.tasks || data.tasks.length === 0) {
            console.log('No tasks assigned to employee');
        } else {
            console.log(`Found ${data.tasks.length} task(s) assigned to employee`);
        }
        
        renderTasks(data.tasks || []);
    } catch (error) {
        console.error('Error loading tasks:', error);
        showLoadingError();
    }
}

// Render tasks in the assigned tasks section
function renderTasks(tasks) {
    const taskList = document.getElementById('assigned-tasks');
    if (!taskList) return;

    // Clear loading placeholder
    taskList.innerHTML = '';

    if (tasks.length === 0) {
        taskList.innerHTML = `
            <div class="task-item empty-tasks">
                <p>No tasks assigned yet.</p>
            </div>
        `;
        return;
    }

    // Select just one task to display
    const task = tasks[0]; // Display only the first task as requested
    console.log('Displaying task:', task);

    // Create task element
    const taskItem = document.createElement('div');
    taskItem.className = 'task-item';
    taskItem.dataset.id = task._id;
    taskItem.dataset.category = task.category || 'other';

    // Format due date
    const dueDate = task.dueDate ? formatDueDate(new Date(task.dueDate)) : 'No due date';

    // Get category display
    const categoryDisplay = getCategoryDisplay(task.category);

    // Get proper checkbox state based on status
    const isChecked = task.status === 'completed';

    // Create task HTML
    taskItem.innerHTML = `
        <div class="task-checkbox">
            <input type="checkbox" id="task-${task._id}" ${isChecked ? 'checked' : ''}>
            <label for="task-${task._id}"></label>
        </div>
        <div class="task-content">
            <h4>${task.title}</h4>
            <p>Due: ${dueDate}</p>
            <span class="task-category ${getCategoryClass(task.category)}">${categoryDisplay}</span>
        </div>
    `;

    // Add event listener for checkbox
    const checkbox = taskItem.querySelector(`input[type="checkbox"]`);
    checkbox.addEventListener('change', function() {
        const newStatus = this.checked ? 'completed' : 'pending';
        console.log(`Updating task ${task._id} status to ${newStatus}`);
        updateTaskStatus(task._id, newStatus);
    });

    // Add the task item to the list
    taskList.appendChild(taskItem);
}

// Format due date to display
function formatDueDate(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const taskDate = new Date(date);
    taskDate.setHours(0, 0, 0, 0);
    
    if (taskDate.getTime() === today.getTime()) {
        return 'Today';
    } else if (taskDate.getTime() === tomorrow.getTime()) {
        return 'Tomorrow';
    } else if (taskDate < today) {
        const days = Math.ceil((today - taskDate) / (1000 * 60 * 60 * 24));
        return `${days} day${days > 1 ? 's' : ''} overdue`;
    } else {
        const days = Math.ceil((taskDate - today) / (1000 * 60 * 60 * 24));
        return `${days} day${days > 1 ? 's' : ''}`;
    }
}

// Get category display name
function getCategoryDisplay(category) {
    if (!category) return 'Other';
    return category.name || 'Other';
}

// Get CSS class for category
function getCategoryClass(category) {
    if (!category) return 'other';
    return (category.name || 'other').toLowerCase().replace(/\s+/g, '-');
}

// Update task status
async function updateTaskStatus(taskId, status) {
    try {
        console.log(`Sending status update for task ${taskId}: ${status}`);
        const response = await fetch(`/api/tasks/${taskId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to update task status: ${errorData.message || response.statusText}`);
        }
        
        console.log('Task status updated successfully');
        // Reload tasks to show the updated status
        loadAssignedTasks();
    } catch (error) {
        console.error('Error updating task status:', error);
        showErrorNotification('Failed to update task status');
    }
}

// Show error when loading tasks fails
function showLoadingError() {
    const taskList = document.getElementById('assigned-tasks');
    if (!taskList) return;

    taskList.innerHTML = `
        <div class="task-item error">
            <p><i class="fas fa-exclamation-triangle"></i> Could not load tasks. Please try again later.</p>
        </div>
    `;
}

// Show error notification
function showErrorNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.innerHTML = `
        <p><i class="fas fa-exclamation-circle"></i> ${message}</p>
        <button class="close-notification"><i class="fas fa-times"></i></button>
    `;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
    
    // Close button
    const closeButton = notification.querySelector('.close-notification');
    closeButton.addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
} 