// API Test Utility
console.log('API Test Utility loaded');

// Function to test the roles API endpoints
async function testRolesAPI() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No token found');
        return;
    }

    const roles = ['employee', 'hr', 'it'];
    
    for (const role of roles) {
        try {
            console.log(`Testing API for role: ${role}`);
            
            const response = await fetch(`/api/users/role/${role}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            
            console.log(`API status for ${role}: ${response.status}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log(`API data for ${role}:`, data);
                console.log(`Found ${data.data?.length || 0} users with role ${role}`);
                
                if (data.data && data.data.length > 0) {
                    console.log(`First ${role} user:`, data.data[0]);
                }
            } else {
                const errorText = await response.text();
                console.error(`API error for ${role}: ${errorText}`);
            }
        } catch (error) {
            console.error(`Error testing ${role} API:`, error);
        }
    }
}

// Function to check authentication 
async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No token found');
        return null;
    }

    try {
        const response = await fetch('/api/auth/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Auth check status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Current user:', data);
            return data;
        } else {
            const errorText = await response.text();
            console.error('Auth error:', errorText);
            return null;
        }
    } catch (error) {
        console.error('Auth check error:', error);
        return null;
    }
}

// Function to test the IT roles API specifically
async function testITRolesAPI() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No token found');
        return;
    }

    try {
        console.log('Testing API for IT roles...');
        
        const response = await fetch(`/api/users/role/it`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log(`IT API status:`, response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log(`IT API data:`, data);
            
            if (data.data && data.data.length > 0) {
                console.log(`Found ${data.data.length} IT users. Roles breakdown:`);
                
                // Analyze the IT roles
                const roles = {};
                data.data.forEach(user => {
                    const roleName = user.role || 'unknown';
                    roles[roleName] = (roles[roleName] || 0) + 1;
                    console.log(`IT user: ${user.name || user.fullName}, Role: ${roleName}, Email: ${user.email}`);
                });
                
                console.log('IT roles distribution:', roles);
            } else {
                console.log('No IT users found');
            }
        } else {
            const errorText = await response.text();
            console.error(`IT API error:`, errorText);
        }
    } catch (error) {
        console.error(`Error testing IT API:`, error);
    }
}

// Run tests
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Running IT-focused API tests...');
    
    // Focus on testing IT users
    testITRolesAPI();
}); 