/**
 * Authentication Routes
 * Handles Cognito OAuth2 flow and session management
 */

const express = require('express');
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * GET /auth/login-url
 * Generate Cognito Hosted UI login URL
 * Query params:
 * - state: Optional state parameter for OAuth2
 */
router.get('/login-url', async (req, res) => {
  try {
    await authController.generateLoginUrl(req, res);
  } catch (error) {
    logger.error('Route error in /auth/login-url', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to generate login URL'
    });
  }
});

/**
 * GET /auth/callback
 * Handle Cognito OAuth2 callback
 * Query params:
 * - code: Authorization code from Cognito
 * - state: State parameter from OAuth2 flow
 * - error: OAuth error if any
 * - redirect_uri: Optional redirect URI after successful auth
 */
router.get('/callback', async (req, res) => {
  try {
    await authController.handleCallback(req, res);
  } catch (error) {
    logger.error('Route error in /auth/callback', { error: error.message });
    
    // Clear any partial session data
    if (req.session) {
      req.session.destroy();
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Authentication callback processing failed'
    });
  }
});

/**
 * POST /auth/logout
 * Logout user and clear session
 * Requires authentication
 */
router.post('/logout', requireAuth, async (req, res) => {
  try {
    await authController.logout(req, res);
  } catch (error) {
    logger.error('Route error in /auth/logout', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Logout failed'
    });
  }
});

/**
 * GET /auth/me
 * Get current user session information
 * Requires authentication
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    await authController.getCurrentUser(req, res);
  } catch (error) {
    logger.error('Route error in /auth/me', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get user information'
    });
  }
});

/**
 * GET /auth/status
 * Check authentication status (public endpoint)
 */
router.get('/status', (req, res) => {
  try {
    const isAuthenticated = req.session && req.session.user;
    const hasAwsCredentials = req.session && req.session.awsCredentials;
    
    res.json({
      success: true,
      authenticated: isAuthenticated,
      hasAwsCredentials,
      user: isAuthenticated ? {
        sub: req.session.user.sub,
        email: req.session.user.email,
        name: req.session.user.name
      } : null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Route error in /auth/status', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to check authentication status'
    });
  }
});

module.exports = router;
