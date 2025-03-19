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
  login: async (email, password, role) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, role }),
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

  // Get saved user data
  getUserData: () => {
    return JSON.parse(localStorage.getItem('user') || '{}');
  },

  // Set user data (update local storage)
  setUserData: (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
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

  // Send password reset link
  forgotPassword: async (email) => {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  // Verify reset token
  verifyResetToken: async (token) => {
    const response = await fetch(`${API_URL}/auth/reset-password/${token}`, {
      method: 'GET',
    });
    return handleResponse(response);
  },

  // Reset password using token
  resetPassword: async (token, password, confirmPassword) => {
    const response = await fetch(`${API_URL}/auth/reset-password/${token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password, confirmPassword }),
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

// Documents API
const documents = {
  // Get all documents
  getDocuments: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
    
    const response = await fetch(`${API_URL}/documents?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },

  // Get documents pending signature for current user
  getPendingSignatures: async () => {
    const response = await fetch(`${API_URL}/documents/pending-signatures`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },

  // Get a single document
  getDocument: async (id) => {
    const response = await fetch(`${API_URL}/documents/${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },

  // Create a new document
  createDocument: async (documentData) => {
    // Handle file uploads
    let body;
    let headers = {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    };

    if (documentData.file instanceof File) {
      // Use FormData for file uploads
      body = new FormData();
      
      // Add all other fields to FormData
      Object.entries(documentData).forEach(([key, value]) => {
        if (Array.isArray(value) && !value.some(item => item instanceof File)) {
          body.append(key, JSON.stringify(value));
        } else {
          body.append(key, value);
        }
      });
    } else {
      // Regular JSON request
      body = JSON.stringify(documentData);
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_URL}/documents`, {
      method: 'POST',
      headers,
      body,
    });
    return handleResponse(response);
  },

  // Update a document
  updateDocument: async (id, documentData) => {
    // Handle file uploads
    let body;
    let headers = {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    };

    if (documentData.file instanceof File) {
      // Use FormData for file uploads
      body = new FormData();
      
      // Add all other fields to FormData
      Object.entries(documentData).forEach(([key, value]) => {
        if (Array.isArray(value) && !value.some(item => item instanceof File)) {
          body.append(key, JSON.stringify(value));
        } else {
          body.append(key, value);
        }
      });
    } else {
      // Regular JSON request
      body = JSON.stringify(documentData);
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_URL}/documents/${id}`, {
      method: 'PUT',
      headers,
      body,
    });
    return handleResponse(response);
  },

  // Delete a document
  deleteDocument: async (id) => {
    const response = await fetch(`${API_URL}/documents/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },

  // Sign a document
  signDocument: async (id, status, comment = '') => {
    const response = await fetch(`${API_URL}/documents/${id}/sign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ status, comment }),
    });
    return handleResponse(response);
  },

  // Add a note to a document
  addNote: async (id, text) => {
    const response = await fetch(`${API_URL}/documents/${id}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ text }),
    });
    return handleResponse(response);
  },

  // Upload a document
  uploadDocument: async function(formData) {
    try {
      const response = await fetch(`${API_URL}/documents/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData // FormData already has the correct Content-Type header
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload document');
      }
      
      return data;
    } catch (error) {
      console.error('API Error - uploadDocument:', error);
      throw error;
    }
  },

  // Get documents by category
  getDocuments: async function(params = {}) {
    try {
      // Build query string from params
      const queryParams = new URLSearchParams();
      
      if (params.category) {
        queryParams.append('category', params.category);
      }
      
      if (params.limit) {
        queryParams.append('limit', params.limit);
      }
      
      if (params.page) {
        queryParams.append('page', params.page);
      }
      
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      
      const response = await fetch(`${API_URL}/documents${queryString}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get documents');
      }
      
      return data.data || [];
    } catch (error) {
      console.error('API Error - getDocuments:', error);
      return [];
    }
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
    try {
      const response = await fetch(`${API_URL}/department-codes`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        // Return a structured error response instead of throwing
        const errorData = await response.json().catch(() => ({}));
        console.error('Error getting department codes:', errorData.message || response.statusText);
        return {
          success: false,
          message: errorData.message || 'Failed to load department codes',
          status: response.status
        };
      }
      
      const data = await response.json();
      return { success: true, data: data.data || data };
    } catch (error) {
      console.error('Error in getDepartmentCodes:', error);
      return { 
        success: false, 
        message: error.message || 'Error fetching department codes',
        error
      };
    }
  },

  // Get active department codes (IT only)
  getActiveDepartmentCodes: async () => {
    try {
      const response = await fetch(`${API_URL}/department-codes/active`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        // Return a structured error response instead of throwing
        const errorData = await response.json().catch(() => ({}));
        console.error('Error getting active department codes:', errorData.message || response.statusText);
        return {
          success: false,
          message: errorData.message || 'Failed to load active department codes',
          status: response.status
        };
      }
      
      const data = await response.json();
      return { success: true, data: data.data || data };
    } catch (error) {
      console.error('Error in getActiveDepartmentCodes:', error);
      return { 
        success: false, 
        message: error.message || 'Error fetching active department codes',
        error
      };
    }
  },

  // Create a new department code (IT only)
  createDepartmentCode: async (codeData) => {
    try {
      const response = await fetch(`${API_URL}/department-codes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(codeData),
      });
      
      if (!response.ok) {
        // Return a structured error response instead of throwing
        const errorData = await response.json().catch(() => ({}));
        console.error('Error creating department code:', errorData.message || response.statusText);
        return {
          success: false,
          message: errorData.message || 'Failed to create department code',
          status: response.status
        };
      }
      
      const data = await response.json();
      return { success: true, data: data.data || data };
    } catch (error) {
      console.error('Error in createDepartmentCode:', error);
      return { 
        success: false, 
        message: error.message || 'Error creating department code',
        error
      };
    }
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

// Employees API
const employees = {
  // Get all employees (HR and IT only)
  getEmployees: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
    
    const response = await fetch(`${API_URL}/employees?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },

  // Get a single employee
  getEmployee: async (id) => {
    const response = await fetch(`${API_URL}/employees/${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },

  // Create a new employee (HR only)
  createEmployee: async (employeeData) => {
    const response = await fetch(`${API_URL}/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(employeeData),
    });
    return handleResponse(response);
  },

  // Update an employee
  updateEmployee: async (id, employeeData) => {
    const response = await fetch(`${API_URL}/employees/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(employeeData),
    });
    return handleResponse(response);
  },

  // Delete an employee (HR only)
  deleteEmployee: async (id) => {
    const response = await fetch(`${API_URL}/employees/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },
};

// Departments API
const departments = {
  // Get all departments
  getDepartments: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
    
    const response = await fetch(`${API_URL}/departments?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },

  // Get a single department
  getDepartment: async (id) => {
    const response = await fetch(`${API_URL}/departments/${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },

  // Create a new department
  createDepartment: async (departmentData) => {
    const response = await fetch(`${API_URL}/departments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(departmentData),
    });
    return handleResponse(response);
  },

  // Update a department
  updateDepartment: async (id, departmentData) => {
    const response = await fetch(`${API_URL}/departments/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(departmentData),
    });
    return handleResponse(response);
  },

  // Delete a department
  deleteDepartment: async (id) => {
    const response = await fetch(`${API_URL}/departments/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },

  // Get department stats
  getDepartmentStats: async (id) => {
    const response = await fetch(`${API_URL}/departments/${id}/stats`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },
};

// Onboarding Processes API
const onboardingProcesses = {
  // Get all onboarding processes
  getOnboardingProcesses: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
    
    const response = await fetch(`${API_URL}/onboarding-processes?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },

  // Get a single onboarding process
  getOnboardingProcess: async (id) => {
    const response = await fetch(`${API_URL}/onboarding-processes/${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },

  // Create a new onboarding process
  createOnboardingProcess: async (processData) => {
    const response = await fetch(`${API_URL}/onboarding-processes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(processData),
    });
    return handleResponse(response);
  },

  // Update an onboarding process
  updateOnboardingProcess: async (id, processData) => {
    const response = await fetch(`${API_URL}/onboarding-processes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(processData),
    });
    return handleResponse(response);
  },

  // Delete an onboarding process
  deleteOnboardingProcess: async (id) => {
    const response = await fetch(`${API_URL}/onboarding-processes/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },

  // Start an onboarding process for a user
  startOnboardingProcess: async (processId, userData) => {
    const response = await fetch(`${API_URL}/onboarding-processes/${processId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  // Get onboarding progress for a user
  getUserOnboardingProgress: async (userId) => {
    const response = await fetch(`${API_URL}/onboarding-processes/progress/${userId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },

  // Update task status in onboarding process
  updateTaskStatus: async (processId, taskId, status) => {
    const response = await fetch(`${API_URL}/onboarding-processes/${processId}/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ status }),
    });
    return handleResponse(response);
  },
};

// Notifications API
const notifications = {
  // Get notifications for current user
  getNotifications: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
    
    const response = await fetch(`${API_URL}/notifications?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },

  // Create a notification (Admin or HR only)
  createNotification: async (notificationData) => {
    const response = await fetch(`${API_URL}/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(notificationData),
    });
    return handleResponse(response);
  },

  // Mark a notification as read
  markAsRead: async (id) => {
    const response = await fetch(`${API_URL}/notifications/${id}/read`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await fetch(`${API_URL}/notifications/read-all`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },

  // Delete a notification
  deleteNotification: async (id) => {
    const response = await fetch(`${API_URL}/notifications/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },

  // Archive a notification
  archiveNotification: async (id) => {
    const response = await fetch(`${API_URL}/notifications/${id}/archive`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },
};

// Assets API
const assets = {
  // Get all assets
  getAssets: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
    
    const response = await fetch(`${API_URL}/assets?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },

  // Get a single asset
  getAsset: async (id) => {
    const response = await fetch(`${API_URL}/assets/${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },

  // Create a new asset
  createAsset: async (assetData) => {
    // Handle image uploads
    let body;
    let headers = {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    };

    if (assetData.image instanceof File) {
      // Use FormData for file uploads
      body = new FormData();
      
      // Add all other fields to FormData
      Object.entries(assetData).forEach(([key, value]) => {
        if (Array.isArray(value) && !value.some(item => item instanceof File)) {
          body.append(key, JSON.stringify(value));
        } else {
          body.append(key, value);
        }
      });
    } else {
      // Regular JSON request
      body = JSON.stringify(assetData);
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_URL}/assets`, {
      method: 'POST',
      headers,
      body,
    });
    return handleResponse(response);
  },

  // Update an asset
  updateAsset: async (id, assetData) => {
    // Handle image uploads
    let body;
    let headers = {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    };

    if (assetData.image instanceof File) {
      // Use FormData for file uploads
      body = new FormData();
      
      // Add all other fields to FormData
      Object.entries(assetData).forEach(([key, value]) => {
        if (Array.isArray(value) && !value.some(item => item instanceof File)) {
          body.append(key, JSON.stringify(value));
        } else {
          body.append(key, value);
        }
      });
    } else {
      // Regular JSON request
      body = JSON.stringify(assetData);
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_URL}/assets/${id}`, {
      method: 'PUT',
      headers,
      body,
    });
    return handleResponse(response);
  },

  // Delete an asset
  deleteAsset: async (id) => {
    const response = await fetch(`${API_URL}/assets/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },

  // Assign an asset to a user
  assignAsset: async (id, userId) => {
    const response = await fetch(`${API_URL}/assets/${id}/assign`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ userId }),
    });
    return handleResponse(response);
  },

  // Unassign an asset from a user
  unassignAsset: async (id) => {
    const response = await fetch(`${API_URL}/assets/${id}/unassign`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },

  // Report an asset issue
  reportIssue: async (id, issueData) => {
    const response = await fetch(`${API_URL}/assets/${id}/issues`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(issueData),
    });
    return handleResponse(response);
  },

  // Resolve an asset issue
  resolveIssue: async (assetId, issueId, resolutionData) => {
    const response = await fetch(`${API_URL}/assets/${assetId}/issues/${issueId}/resolve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(resolutionData),
    });
    return handleResponse(response);
  },
};

// Access Requests API
const accessRequests = {
  // Get all access requests
  getAccessRequests: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
    
    const response = await fetch(`${API_URL}/access-requests?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },

  // Get a single access request
  getAccessRequest: async (id) => {
    const response = await fetch(`${API_URL}/access-requests/${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },

  // Create a new access request
  createAccessRequest: async (requestData) => {
    const response = await fetch(`${API_URL}/access-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(requestData),
    });
    return handleResponse(response);
  },

  // Update an access request
  updateAccessRequest: async (id, requestData) => {
    const response = await fetch(`${API_URL}/access-requests/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(requestData),
    });
    return handleResponse(response);
  },

  // Delete an access request
  deleteAccessRequest: async (id) => {
    const response = await fetch(`${API_URL}/access-requests/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },

  // Approve an access request
  approveAccessRequest: async (id, approvalData = {}) => {
    const response = await fetch(`${API_URL}/access-requests/${id}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(approvalData),
    });
    return handleResponse(response);
  },

  // Deny an access request
  denyAccessRequest: async (id, denialReason = '') => {
    const response = await fetch(`${API_URL}/access-requests/${id}/deny`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ denialReason }),
    });
    return handleResponse(response);
  },
};

// Users API
const users = {
  // Get all users
  getUsers: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
    
    const response = await fetch(`${API_URL}/users?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },

  // Get current user profile
  getCurrentUser: async () => {
    const response = await fetch(`${API_URL}/users/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },

  // Update current user profile
  updateCurrentUser: async (userData) => {
    // Handle profile photo uploads
    let body;
    let headers = {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    };

    if (userData.profilePhoto instanceof File) {
      // Use FormData for file uploads
      body = new FormData();
      
      // Add all other fields to FormData
      Object.entries(userData).forEach(([key, value]) => {
        body.append(key, value);
      });
    } else {
      // Regular JSON request
      body = JSON.stringify(userData);
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_URL}/users/me`, {
      method: 'PUT',
      headers,
      body,
    });
    return handleResponse(response);
  },

  // Get a single user
  getUser: async (id) => {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },

  // Create a new user
  createUser: async (userData) => {
    // Handle profile photo uploads
    let body;
    let headers = {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    };

    if (userData.profilePhoto instanceof File) {
      // Use FormData for file uploads
      body = new FormData();
      
      // Add all other fields to FormData
      Object.entries(userData).forEach(([key, value]) => {
        body.append(key, value);
      });
    } else {
      // Regular JSON request
      body = JSON.stringify(userData);
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers,
      body,
    });
    return handleResponse(response);
  },

  // Update a user
  updateUser: async (id, userData) => {
    // Handle profile photo uploads
    let body;
    let headers = {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    };

    if (userData.profilePhoto instanceof File) {
      // Use FormData for file uploads
      body = new FormData();
      
      // Add all other fields to FormData
      Object.entries(userData).forEach(([key, value]) => {
        body.append(key, value);
      });
    } else {
      // Regular JSON request
      body = JSON.stringify(userData);
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers,
      body,
    });
    return handleResponse(response);
  },

  // Delete a user
  deleteUser: async (id) => {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },

  // Change user status (active/inactive)
  changeUserStatus: async (id, isActive) => {
    const response = await fetch(`${API_URL}/users/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ isActive }),
    });
    return handleResponse(response);
  },

  // Get user dashboard data
  getUserDashboard: async (id) => {
    const response = await fetch(`${API_URL}/users/${id}/dashboard`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },
};

// User Profile API
const user = {
  // Get user profile
  getProfile: async () => {
    const response = await fetch(`${API_URL}/users/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return handleResponse(response);
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await fetch(`${API_URL}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(profileData),
    });
    return handleResponse(response);
  },

  // Upload user document
  uploadDocument: async (documentData) => {
    const formData = new FormData();
    
    // Add file
    if (documentData.file) {
      formData.append('document', documentData.file);
    }
    
    // Add other metadata
    formData.append('type', documentData.type || 'other');
    formData.append('name', documentData.name || documentData.file.name);
    
    const response = await fetch(`${API_URL}/users/documents`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
    });
    return handleResponse(response);
  },
  
  // Get all user documents
  getDocuments: async () => {
    const response = await fetch(`${API_URL}/users/documents`, {
      method: 'GET',
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
  documents,
  departments,
  onboardingProcesses,
  notifications,
  assets,
  accessRequests,
  users,
  employees,
  user,
};

// Make API available globally
window.api = api;

// Add onboarding API methods to the existing api object
api.onboarding = {
    // Get current user's onboarding process
    getMyOnboardingProcess: async function() {
        try {
            const response = await fetch(`${API_URL}/onboarding-processes/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error - getMyOnboardingProcess:', error);
            return { 
                success: false, 
                message: error.message || 'Failed to get onboarding process' 
            };
        }
    },
    
    // Submit onboarding data
    submitOnboardingData: async function(data) {
        try {
            const response = await fetch(`${API_URL}/onboarding-processes/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(data)
            });
            
            const responseData = await response.json();
            
            if (!response.ok) {
                throw new Error(responseData.message || 'Failed to submit onboarding data');
            }
            
            return responseData;
        } catch (error) {
            console.error('API Error - submitOnboardingData:', error);
            throw error;
        }
    },
    
    // Get onboarding progress
    getOnboardingProgress: async function() {
        try {
            const response = await fetch(`${API_URL}/onboarding-processes/progress`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to get onboarding progress');
            }
            
            return data;
        } catch (error) {
            console.error('API Error - getOnboardingProgress:', error);
            return { 
                success: false, 
                message: error.message || 'Failed to get onboarding progress' 
            };
        }
    }
};

// Add or update document API methods
api.documents = api.documents || {
    // Upload a document
    uploadDocument: async function(formData) {
        try {
            const response = await fetch('/api/documents/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData // FormData already has the correct Content-Type header
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to upload document');
            }
            
            return data;
        } catch (error) {
            console.error('API Error - uploadDocument:', error);
            throw error;
        }
    },
    
    // Get documents by category
    getDocuments: async function(params = {}) {
        try {
            // Build query string from params
            const queryParams = new URLSearchParams();
            
            if (params.category) {
                queryParams.append('category', params.category);
            }
            
            if (params.limit) {
                queryParams.append('limit', params.limit);
            }
            
            if (params.page) {
                queryParams.append('page', params.page);
            }
            
            const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
            
            const response = await fetch(`/api/documents${queryString}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to get documents');
            }
            
            return data.data || [];
        } catch (error) {
            console.error('API Error - getDocuments:', error);
            return [];
        }
    },
    
    // Add a note to a document
    addNote: async function(documentId, noteData) {
        try {
            const response = await fetch(`/api/documents/${documentId}/notes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(noteData)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to add note to document');
            }
            
            return data;
        } catch (error) {
            console.error('API Error - addNote:', error);
            throw error;
        }
    }
}; 