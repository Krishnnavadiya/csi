const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const protect = (req, res, next) => {
  let token;
  
  // Check if token exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  // Check if token exists
  if (!token) {
    const error = new Error('Not authorized, no token provided');
    error.statusCode = 401;
    return next(error);
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user from payload to request object
    req.user = decoded;
    logger.info(`Authenticated user: ${req.user.id}`);
    next();
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);
    const err = new Error('Not authorized, token failed');
    err.statusCode = 401;
    next(err);
  }
};

// Middleware to restrict access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      const error = new Error(`Role ${req.user ? req.user.role : 'undefined'} is not authorized to access this resource`);
      error.statusCode = 403;
      return next(error);
    }
    next();
  };
};

module.exports = { protect, authorize };