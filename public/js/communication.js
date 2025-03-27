document.addEventListener('DOMContentLoaded', function() {
    console.log('Communication module loaded');
    
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
        console.error('No authentication token found');
        showAllErrorMessages('Authentication error. Please log in again.');
        return;
    }

    // Load real users from the database with specific roles
    fetchUsersByRole('employee', 'employee-contact-list');
    fetchUsersByRole('hr', 'hr-contact-list');
    fetchUsersByRole('it', 'it-contact-list');

    // Add change event listeners to dropdowns
    setupContactInfoDisplay('employee-contact-list', 'selected-employee-info');
    setupContactInfoDisplay('hr-contact-list', 'selected-hr-info');
    setupContactInfoDisplay('it-contact-list', 'selected-it-info');
});

async function fetchUsersByRole(role, selectId) {
    try {
        console.log(`Fetching ${role} users...`);
        
        // First try the API endpoint with correct role
        const response = await fetch(`/api/users/role/${role}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        console.log(`${role} API response status:`, response.status);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch ${role} users: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`${role} data received:`, data);
        
        if (!data.success) {
            throw new Error(`API error for ${role}: ${data.message || 'Unknown error'}`);
        }
        
        const users = data.data || [];
        console.log(`Found ${users.length} ${role} users:`, users);
        
        // Log all users for debugging
        if (users.length > 0) {
            console.log(`${role} users details:`);
            users.forEach(user => {
                console.log(`- ${user.name || user.fullName} (${user.role}): ${user.email}`);
            });
            
            // Special handling for IT roles - should include both 'it' and 'it_admin'
            if (role === 'it') {
                const itAdmins = users.filter(user => 
                    user.role && (user.role.toLowerCase().includes('admin') || 
                                 user.role.toLowerCase().includes('it_admin')));
                
                const regularIt = users.filter(user => 
                    user.role && !user.role.toLowerCase().includes('admin'));
                
                console.log(`IT breakdown: ${regularIt.length} regular IT, ${itAdmins.length} IT admins`);
            }
            
            loadUsersIntoDropdown(role, selectId, users);
        } else {
            console.log(`No ${role} users found, using fallback data`);
            const fallbackData = getFallbackData(role);
            loadUsersIntoDropdown(role, selectId, fallbackData);
        }
    } catch (error) {
        console.error(`Error fetching ${role} users:`, error);
        
        // Fallback to mock data
        console.log(`Using fallback data for ${role} users`);
        const fallbackData = getFallbackData(role);
        loadUsersIntoDropdown(role, selectId, fallbackData);
    }
}

function getFallbackData(role) {
    // Fallback data in case the API fails
    const userData = {
        employee: [
            { _id: 'emp1', name: 'John Smith', fullName: 'John Smith', email: 'john.smith@company.com', department: 'Marketing' },
            { _id: 'emp2', name: 'Emily Johnson', fullName: 'Emily Johnson', email: 'emily.johnson@company.com', department: 'Finance' },
            { _id: 'emp3', name: 'Michael Brown', fullName: 'Michael Brown', email: 'michael.brown@company.com', department: 'Operations' }
        ],
        hr: [
            { _id: 'hr1', name: 'Sarah Williams', fullName: 'Sarah Williams', email: 'sarah.williams@company.com', department: 'Human Resources' },
            { _id: 'hr2', name: 'David Miller', fullName: 'David Miller', email: 'david.miller@company.com', department: 'Human Resources' }
        ],
        it: [
            { _id: 'it1', name: 'James Wilson', fullName: 'James Wilson', email: 'james.wilson@company.com', department: 'IT Support' },
            { _id: 'it2', name: 'Emma Taylor', fullName: 'Emma Taylor', email: 'emma.taylor@company.com', department: 'IT Support' }
        ]
    };
    
    return userData[role] || [];
}

function loadUsersIntoDropdown(role, selectId, users) {
    const select = document.getElementById(selectId);
    if (!select) {
        console.error(`Element with ID ${selectId} not found`);
        return;
    }
    
    // Clear existing options
    const roleLabel = role === 'hr' ? 'an HR' : role === 'it' ? 'an IT' : 'an employee';
    select.innerHTML = `<option value="">Select ${roleLabel} staff to view contact info...</option>`;
    
    // Add users to dropdown
    if (users.length === 0) {
        select.innerHTML += `<option value="" disabled>No ${role} users available</option>`;
        console.log(`No ${role} users available to populate dropdown`);
    } else {
        console.log(`Adding ${users.length} ${role} users to dropdown`);
        users.forEach(user => {
            // Handle different field names from the database
            const name = user.name || user.fullName || 'Unknown';
            const email = user.email || '';
            const department = user.department || '';
            
            // Get proper role display
            let userRole = user.role || role;
            
            // Special handling for IT roles
            if (role === 'it' && userRole) {
                if (userRole.toLowerCase().includes('admin')) {
                    userRole = 'IT Admin';
                } else {
                    userRole = 'IT Support';
                }
            }
            
            console.log(`Adding ${role} user: ${name}, ${email}, ${department}, ${userRole}`);
            
            const option = document.createElement('option');
            option.value = user._id;
            option.textContent = name;
            option.dataset.email = email;
            option.dataset.department = department;
            option.dataset.role = userRole;
            select.appendChild(option);
        });
    }
    
    // Remove any error styling
    select.classList.remove('error');
}

function setupContactInfoDisplay(selectId, infoContainerId) {
    const select = document.getElementById(selectId);
    const infoContainer = document.getElementById(infoContainerId);
    
    if (!select || !infoContainer) {
        console.error(`Element with ID ${selectId} or ${infoContainerId} not found`);
        return;
    }

    select.addEventListener('change', function() {
        if (this.selectedIndex < 0) return;
        
        const selectedOption = this.options[this.selectedIndex];
        
        if (this.value) {
            // Get user info from the option's dataset
            const name = selectedOption.textContent;
            const email = selectedOption.dataset.email;
            const department = selectedOption.dataset.department;
            const role = selectedOption.dataset.role || '';
            
            console.log(`Selected contact: ${name}, ${email}, ${department}, ${role}`);
            
            // Create role badge for display
            const roleBadge = role ? 
                `<span class="role-badge ${role.toLowerCase()}">${role}</span>` : '';
            
            // Display user info with clickable email
            infoContainer.innerHTML = `
                <div class="contact-details">
                    <div class="contact-header">
                        <span class="contact-name">${name}</span>
                        ${roleBadge}
                    </div>
                    <p><strong>Email:</strong> <a href="mailto:${email}" class="email-link">${email}</a></p>
                    ${department ? `<p><strong>Department:</strong> ${department}</p>` : ''}
                </div>
            `;
        } else {
            // Show default message
            infoContainer.innerHTML = `
                <p>Select a user from the dropdown to view their contact details.</p>
            `;
        }
    });
}

function showErrorMessage(selectId, message) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    select.innerHTML = `<option value="">${message}</option>`;
    select.classList.add('error');
}

function showAllErrorMessages(message) {
    showErrorMessage('employee-contact-list', message);
    showErrorMessage('hr-contact-list', message);
    showErrorMessage('it-contact-list', message);
} 