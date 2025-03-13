const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized - No user found' });
    }

    const hasRole = roles.find(role => req.user.role === role);
    if (!hasRole) {
      return res.status(403).json({ 
        message: `Forbidden - Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
};

module.exports = checkRole; 