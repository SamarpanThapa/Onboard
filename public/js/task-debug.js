// Task API Debug Script
// You can run this in the browser console to help diagnose task API issues

// Function to test direct task creation with different formats
async function testTaskCreation() {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.error("No authentication token found in localStorage");
    return;
  }
  
  // Basic task data
  const taskData = {
    title: "Test task " + new Date().toLocaleTimeString(),
    description: "Created from debug script",
    status: "pending",
    priority: "medium",
    dueDate: new Date().toISOString().split('T')[0]
  };
  
  console.log("Starting task creation tests with token:", token);
  
  // Test 1: Basic task without assignee
  try {
    console.log("Test 1: Creating task without assignee");
    const response1 = await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(taskData)
    });
    
    const responseText1 = await response1.text();
    console.log(`Test 1 result: Status ${response1.status}`, responseText1);
  } catch (error) {
    console.error("Test 1 error:", error);
  }
  
  // Test 2: Get all tasks to see the structure
  try {
    console.log("Test 2: Getting existing tasks to analyze structure");
    const response2 = await fetch('/api/tasks', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const tasks = await response2.json();
    console.log("Test 2 result: Existing tasks", tasks);
    
    // If we found tasks, analyze the first one
    if (tasks && tasks.length > 0) {
      console.log("Analyzing task structure from existing task:", tasks[0]);
      
      // Create a new task with exact same structure
      if (tasks[0]) {
        console.log("Test 3: Creating task with same structure as existing task");
        
        // Create a copy of the first task, but with a new title
        const templateTask = JSON.parse(JSON.stringify(tasks[0]));
        delete templateTask._id; // Remove the ID
        delete templateTask.id;  // Also try with lowercase id
        delete templateTask.createdAt;
        delete templateTask.updatedAt;
        templateTask.title = "Copy of task " + new Date().toLocaleTimeString();
        
        console.log("Template task data:", templateTask);
        
        const response3 = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(templateTask)
        });
        
        const responseText3 = await response3.text();
        console.log(`Test 3 result: Status ${response3.status}`, responseText3);
      }
    }
  } catch (error) {
    console.error("Test 2/3 error:", error);
  }
  
  // Test 4: Get employees to find valid assignees
  try {
    console.log("Test 4: Getting users/employees for assignee");
    const response4 = await fetch('/api/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const users = await response4.json();
    console.log("Available users:", users);
    
    if (users && users.length > 0) {
      const userId = users[0]._id || users[0].id;
      console.log("Test 5: Creating task with user ID as assignee:", userId);
      
      const taskWithAssignee = {
        ...taskData,
        assignee: userId
      };
      
      const response5 = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(taskWithAssignee)
      });
      
      const responseText5 = await response5.text();
      console.log(`Test 5 result: Status ${response5.status}`, responseText5);
    }
  } catch (error) {
    console.error("Test 4/5 error:", error);
  }
}

// Function to examine API structure
async function examineAPI() {
  const token = localStorage.getItem('token');
  
  // Test various API endpoint paths that might exist
  const endpoints = [
    '/api',
    '/api/tasks',
    '/api/users',
    '/api/employees',
    '/api/status'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing endpoint: ${endpoint}`);
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const responseText = await response.text();
      console.log(`${endpoint} status: ${response.status}`, responseText.slice(0, 100) + '...');
    } catch (error) {
      console.error(`Error with ${endpoint}:`, error);
    }
  }
}

// Make functions available in the global scope
window.testTaskCreation = testTaskCreation;
window.examineAPI = examineAPI;

// Instructions for use
console.log("DEBUG TOOLS LOADED");
console.log("To test task creation, run: testTaskCreation()");
console.log("To examine API endpoints, run: examineAPI()"); 