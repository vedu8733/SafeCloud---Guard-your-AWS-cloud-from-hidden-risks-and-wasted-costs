/**
 * Custom Error Handler Utility
 * Provides consistent error handling and response formatting
 */

const logger = require('./logger');

class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Create operational errors
 */
const createOperationalError = (message, statusCode = 500) => {
  return new AppError(message, statusCode, true);
};

/**
 * Create programming errors
 */
const createProgrammingError = (message, statusCode = 500) => {
  return new AppError(message, statusCode, false);
};

/**
 * Handle AWS-specific errors
 */
const handleAWSError = (error) => {
  if (error.name === 'AccessDenied') {
    return createOperationalError('Access denied to AWS resource', 403);
  }
  
  if (error.name === 'InvalidAccessKeyId' || error.name === 'InvalidToken') {
    return createOperationalError('Invalid AWS credentials', 401);
  }
  
  if (error.name === 'ExpiredTokenException') {
    return createOperationalError('AWS credentials have expired', 401);
  }
  
  if (error.name === 'MalformedPolicyDocument') {
    return createOperationalError('Invalid IAM policy configuration', 400);
  }
  
  // Default AWS error
  return createOperationalError(`AWS operation failed: ${error.message}`, 500);
};

/**
 * Handle Cognito-specific errors
 */
const handleCognitoError = (error) => {
  if (error.message.includes('Invalid authorization code')) {
    return createOperationalError('Invalid or expired authorization code', 400);
  }
  
  if (error.message.includes('Token exchange failed')) {
    return createOperationalError('Failed to exchange authorization code for tokens', 400);
  }
  
  if (error.message.includes('Token validation failed')) {
    return createOperationalError('Invalid or expired token', 401);
  }
  
  // Default Cognito error
  return createOperationalError(`Cognito operation failed: ${error.message}`, 500);
};

/**
 * Handle JWT-specific errors
 */
const handleJWTError = (error) => {
  if (error.name === 'JsonWebTokenError') {
    return createOperationalError('Invalid token format', 401);
  }
  
  if (error.name === 'TokenExpiredError') {
    return createOperationalError('Token has expired', 401);
  }
  
  if (error.name === 'NotBeforeError') {
    return createOperationalError('Token not yet valid', 401);
  }
  
  // Default JWT error
  return createOperationalError(`JWT validation failed: ${error.message}`, 401);
};

/**
 * Central error handler
 */
const handleError = (error, req, res, next) => {
  let appError = error;
  
  // Convert known error types to AppError
  if (error.name && error.name.includes('AWS')) {
    appError = handleAWSError(error);
  } else if (error.message && error.message.includes('Cognito')) {
    appError = handleCognitoError(error);
  } else if (error.name && error.name.includes('JsonWebToken')) {
    appError = handleJWTError(error);
  } else if (!(error instanceof AppError)) {
    // Convert unknown errors to operational errors
    appError = createOperationalError(error.message || 'Internal server error', 500);
  }
  
  // Log error
  if (appError.isOperational) {
    logger.warn('Operational error occurred', {
      message: appError.message,
      statusCode: appError.statusCode,
      path: req.path,
      method: req.method,
      ip: req.ip
    });
  } else {
    logger.error('Programming error occurred', {
      message: appError.message,
      statusCode: appError.statusCode,
      stack: appError.stack,
      path: req.path,
      method: req.method,
      ip: req.ip
    });
  }
  
  // Send error response
  res.status(appError.statusCode).json({
    success: false,
    error: appError.status,
    message: appError.message,
    ...(process.env.NODE_ENV === 'development' && { stack: appError.stack })
  });
};

/**
 * Async error wrapper for route handlers
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  AppError,
  createOperationalError,
  createProgrammingError,
  handleAWSError,
  handleCognitoError,
  handleJWTError,
  handleError,
  asyncHandler
};
