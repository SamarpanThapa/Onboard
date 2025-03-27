// API Debug Helper
(function() {
  console.log('API Debug Helper loaded');
  
  // Check if we have a token
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('No token found in localStorage');
    return;
  }
  
  // Test the auth endpoint
  testAuthEndpoint();
  
  // Test loading users by role
  testLoadUsersByRole('employee');
  testLoadUsersByRole('hr');
  testLoadUsersByRole('it');
  
  async function testAuthEndpoint() {
    try {
      console.log('Testing Auth Endpoint...');
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Auth Endpoint Status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Current User:', data);
      } else {
        console.error('Auth endpoint failed:', await response.text());
      }
    } catch (error) {
      console.error('Auth test error:', error);
    }
  }
  
  async function testLoadUsersByRole(role) {
    try {
      console.log(`Testing ${role} endpoint...`);
      const response = await fetch(`/api/auth/users/${role}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log(`${role} Endpoint Status:`, response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`${role} Users:`, data);
      } else {
        console.error(`${role} endpoint failed:`, await response.text());
      }
    } catch (error) {
      console.error(`${role} test error:`, error);
    }
  }
})(); 