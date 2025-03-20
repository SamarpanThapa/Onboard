const jwt = require('jsonwebtoken');

/**
 * Middleware to authenticate JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateToken = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

/**
 * Middleware to check if user has required role
 * @param {Array} roles - Array of allowed roles
 * @returns {Function} - Express middleware function
 */
const authorizeRoles = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        
        // Map frontend role to backend role if needed
        let userRole = req.user.role;
        
        // Support for frontend role names
        const roleMapping = {
            'hr_admin': 'hr',
            'department_admin': 'admin',
            'it_admin': 'manager'
        };
        
        // If the user has a frontend role, map it to the backend role
        if (roleMapping[userRole]) {
            userRole = roleMapping[userRole];
        }
        
        // Ensure roles is always an array
        const allowedRoles = Array.isArray(roles) ? roles : [roles];
        
        console.log(`Authorizing user role: ${req.user.role} (mapped to: ${userRole}), allowed roles: ${allowedRoles.join(', ')}`);
        
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ message: 'Access denied' });
        }
        next();
    };
};

// For backward compatibility
const auth = authenticateToken;
const requireRole = authorizeRoles;

module.exports = { 
    authenticateToken, 
    authorizeRoles,
    auth,  // backward compatibility
    requireRole  // backward compatibility
}; 