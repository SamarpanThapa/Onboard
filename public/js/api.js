/**
 * API Client for OnboardX
 * This file provides functions to interact with the backend API
 */

const API_URL = '/api';

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Something went wrong');
  }
  return response.json();
};

// Authentication API
const auth = {
  // Register a new user
  register: async (userData) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  // Login a user
  login: async (email, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse(response);
    
    // Store token in localStorage
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  },

  // Logout a user
  logout: async () => {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    
    // Remove token from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Get current user
  getCurrentUser: async () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Get user role
  getUserRole: () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.role || null;
  },

  // Verify department code
  verifyDepartmentCode: async (code) => {
    const response = await fetch(`${API_URL}/department-codes/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });
    return handleResponse(response);
  },
};

// Tasks API
const tasks = {
  // Get all tasks
  getTasks: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
    
    const response = await fetch(`${API_URL}/tasks?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },

  // Get a single task
  getTask: async (id) => {
    const response = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },

  // Create a new task
  createTask: async (taskData) => {
    // Handle file uploads
    let body;
    let headers = {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    };

    if (taskData.attachment instanceof File) {
      // Use FormData for file uploads
      body = new FormData();
      
      // Add all other fields to FormData
      Object.entries(taskData).forEach(([key, value]) => {
        body.append(key, value);
      });
    } else {
      // Regular JSON request
      body = JSON.stringify(taskData);
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers,
      body,
    });
    return handleResponse(response);
  },

  // Update a task
  updateTask: async (id, taskData) => {
    // Handle file uploads
    let body;
    let headers = {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    };

    if (taskData.attachment instanceof File) {
      // Use FormData for file uploads
      body = new FormData();
      
      // Add all other fields to FormData
      Object.entries(taskData).forEach(([key, value]) => {
        body.append(key, value);
      });
    } else {
      // Regular JSON request
      body = JSON.stringify(taskData);
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'PUT',
      headers,
      body,
    });
    return handleResponse(response);
  },

  // Delete a task
  deleteTask: async (id) => {
    const response = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },
};

// Resources API
const resources = {
  // Get all resources
  getResources: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
    
    const response = await fetch(`${API_URL}/resources?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },

  // Get a single resource
  getResource: async (id) => {
    const response = await fetch(`${API_URL}/resources/${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },

  // Create a new resource
  createResource: async (resourceData) => {
    // Handle file uploads
    let body;
    let headers = {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    };

    if (resourceData.file instanceof File) {
      // Use FormData for file uploads
      body = new FormData();
      
      // Add all other fields to FormData
      Object.entries(resourceData).forEach(([key, value]) => {
        body.append(key, value);
      });
    } else {
      // Regular JSON request
      body = JSON.stringify(resourceData);
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_URL}/resources`, {
      method: 'POST',
      headers,
      body,
    });
    return handleResponse(response);
  },

  // Update a resource
  updateResource: async (id, resourceData) => {
    // Handle file uploads
    let body;
    let headers = {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    };

    if (resourceData.file instanceof File) {
      // Use FormData for file uploads
      body = new FormData();
      
      // Add all other fields to FormData
      Object.entries(resourceData).forEach(([key, value]) => {
        body.append(key, value);
      });
    } else {
      // Regular JSON request
      body = JSON.stringify(resourceData);
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_URL}/resources/${id}`, {
      method: 'PUT',
      headers,
      body,
    });
    return handleResponse(response);
  },

  // Delete a resource
  deleteResource: async (id) => {
    const response = await fetch(`${API_URL}/resources/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },

  // Download a resource
  downloadResource: async (id) => {
    window.open(`${API_URL}/resources/${id}/download?token=${localStorage.getItem('token')}`, '_blank');
  },
};

// Feedback API
const feedback = {
  // Get all feedback (HR, IT only)
  getAllFeedback: async () => {
    const response = await fetch(`${API_URL}/feedback`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },

  // Get user's feedback
  getUserFeedback: async () => {
    const response = await fetch(`${API_URL}/feedback/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },

  // Get a single feedback
  getFeedback: async (id) => {
    const response = await fetch(`${API_URL}/feedback/${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },

  // Create a new feedback
  createFeedback: async (feedbackData) => {
    const response = await fetch(`${API_URL}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(feedbackData),
    });
    return handleResponse(response);
  },

  // Update a feedback (HR, IT only)
  updateFeedback: async (id, feedbackData) => {
    const response = await fetch(`${API_URL}/feedback/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(feedbackData),
    });
    return handleResponse(response);
  },

  // Delete a feedback
  deleteFeedback: async (id) => {
    const response = await fetch(`${API_URL}/feedback/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },
};

// Compliance API
const compliance = {
  // Get all compliance items
  getComplianceItems: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
    
    const response = await fetch(`${API_URL}/compliance?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },

  // Get a single compliance item
  getComplianceItem: async (id) => {
    const response = await fetch(`${API_URL}/compliance/${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },

  // Create a new compliance item
  createComplianceItem: async (complianceData) => {
    // Handle file uploads
    let body;
    let headers = {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    };

    if (complianceData.document instanceof File) {
      // Use FormData for file uploads
      body = new FormData();
      
      // Add all other fields to FormData
      Object.entries(complianceData).forEach(([key, value]) => {
        body.append(key, value);
      });
    } else {
      // Regular JSON request
      body = JSON.stringify(complianceData);
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_URL}/compliance`, {
      method: 'POST',
      headers,
      body,
    });
    return handleResponse(response);
  },

  // Update a compliance item
  updateComplianceItem: async (id, complianceData) => {
    // Handle file uploads
    let body;
    let headers = {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    };

    if (complianceData.document instanceof File) {
      // Use FormData for file uploads
      body = new FormData();
      
      // Add all other fields to FormData
      Object.entries(complianceData).forEach(([key, value]) => {
        body.append(key, value);
      });
    } else {
      // Regular JSON request
      body = JSON.stringify(complianceData);
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_URL}/compliance/${id}`, {
      method: 'PUT',
      headers,
      body,
    });
    return handleResponse(response);
  },

  // Delete a compliance item
  deleteComplianceItem: async (id) => {
    const response = await fetch(`${API_URL}/compliance/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },
};

// Department Codes API
const departmentCodes = {
  // Get all department codes (IT only)
  getDepartmentCodes: async () => {
    const response = await fetch(`${API_URL}/department-codes`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },

  // Get active department codes (IT only)
  getActiveDepartmentCodes: async () => {
    const response = await fetch(`${API_URL}/department-codes/active`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },

  // Create a new department code (IT only)
  createDepartmentCode: async (codeData) => {
    const response = await fetch(`${API_URL}/department-codes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(codeData),
    });
    return handleResponse(response);
  },

  // Update a department code (IT only)
  updateDepartmentCode: async (id, codeData) => {
    const response = await fetch(`${API_URL}/department-codes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(codeData),
    });
    return handleResponse(response);
  },

  // Delete a department code (IT only)
  deleteDepartmentCode: async (id) => {
    const response = await fetch(`${API_URL}/department-codes/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },
};

// Export the API client
const api = {
  auth,
  tasks,
  resources,
  feedback,
  compliance,
  departmentCodes,
};

// Make API available globally
window.api = api; 