/**
 * Authentication Middleware
 * Validates Cognito tokens and session authentication
 */

const cognitoService = require('../utils/cognito');
const logger = require('../utils/logger');

/**
 * Middleware to check if user is authenticated via session
 */
const requireAuth = (req, res, next) => {
  try {
    if (!req.session || !req.session.user) {
      logger.warn('Unauthorized access attempt', { 
        path: req.path,
        ip: req.ip 
      });
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please log in to access this resource'
      });
    }

    // Check if session has expired
    if (req.session.expiresAt && new Date() > new Date(req.session.expiresAt)) {
      logger.warn('Session expired', { 
        userId: req.session.user.sub,
        path: req.path 
      });
      
      // Clear expired session
      req.session.destroy();
      
      return res.status(401).json({ 
        error: 'Session expired',
        message: 'Your session has expired. Please log in again.'
      });
    }

    logger.debug('User authenticated', { 
      userId: req.session.user.sub,
      path: req.path 
    });
    
    next();
  } catch (error) {
    logger.error('Authentication middleware error', { error: error.message });
    res.status(500).json({ 
      error: 'Authentication error',
      message: 'An error occurred during authentication'
    });
  }
};

/**
 * Middleware to validate Cognito ID token from Authorization header
 */
const validateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Invalid authorization header',
        message: 'Bearer token required'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      // Validate the ID token
      const decodedToken = await cognitoService.validateIdToken(token);
      
      // Add user info to request
      req.user = cognitoService.extractUserInfo(decodedToken);
      req.token = token;
      
      logger.debug('Token validated successfully', { 
        userId: req.user.sub,
        path: req.path 
      });
      
      next();
    } catch (tokenError) {
      logger.warn('Invalid token provided', { 
        error: tokenError.message,
        path: req.path 
      });
      
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'The provided token is invalid or expired'
      });
    }
  } catch (error) {
    logger.error('Token validation middleware error', { error: error.message });
    res.status(500).json({ 
      error: 'Token validation error',
      message: 'An error occurred during token validation'
    });
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const decodedToken = await cognitoService.validateIdToken(token);
        req.user = cognitoService.extractUserInfo(decodedToken);
        req.token = token;
        
        logger.debug('Optional auth: token validated', { 
          userId: req.user.sub,
          path: req.path 
        });
      } catch (tokenError) {
        logger.debug('Optional auth: invalid token, continuing without auth', { 
          path: req.path 
        });
        // Continue without authentication
      }
    }
    
    next();
  } catch (error) {
    logger.error('Optional auth middleware error', { error: error.message });
    // Continue without authentication
    next();
  }
};

module.exports = {
  requireAuth,
  validateToken,
  optionalAuth
};
