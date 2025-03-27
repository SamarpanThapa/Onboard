// Debug utility for communication section
console.log('Communication debug helper loaded');

// Function to check HTML elements exist
function checkElements() {
    const elements = [
        'employee-contact-list',
        'hr-contact-list',
        'it-contact-list',
        'selected-employee-info',
        'selected-hr-info',
        'selected-it-info'
    ];
    
    console.log('Checking if required elements exist:');
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        console.log(`Element ${id}: ${element ? 'Found' : 'NOT FOUND'}`);
    });
}

// Function to check the structure of user data
function checkUserData() {
    // Get sample user
    const users = {
        employee: getFallbackData('employee')[0],
        hr: getFallbackData('hr')[0],
        it: getFallbackData('it')[0]
    };
    
    console.log('Sample user data structure:');
    console.log(users);
}

// Function to simulate selection of a user
function simulateSelection() {
    setTimeout(() => {
        console.log('Simulating user selection...');
        
        const employeeSelect = document.getElementById('employee-contact-list');
        if (employeeSelect && employeeSelect.options.length > 1) {
            employeeSelect.selectedIndex = 1; // Select first actual user
            
            // Trigger change event
            const event = new Event('change');
            employeeSelect.dispatchEvent(event);
            
            console.log('Selection simulated for employee dropdown');
        } else {
            console.log('Could not simulate selection - dropdown not ready');
        }
    }, 2000); // Wait 2 seconds for data to load
}

// Run checks when page is loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        checkElements();
        
        // Check if we can access the helper function from communication.js
        if (typeof getFallbackData === 'function') {
            checkUserData();
        } else {
            console.log('getFallbackData function not found - communication.js may not be loaded correctly');
        }
        
        simulateSelection();
    }, 1000); // Wait a second for other scripts to load
}); 