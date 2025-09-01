/**
 * Authentication Controller
 * Handles Cognito OAuth2 flow and session management
 */

const cognitoService = require('../utils/cognito');
const awsService = require('../utils/aws');
const logger = require('../utils/logger');

class AuthController {
  /**
   * Generate Cognito Hosted UI login URL
   * GET /auth/login-url
   */
  async generateLoginUrl(req, res) {
    try {
      const state = req.query.state || null;
      const loginUrl = cognitoService.generateLoginUrl(state);
      
      logger.info('Login URL generated', { 
        ip: req.ip,
        state: !!state 
      });
      
      res.json({
        success: true,
        loginUrl,
        state: state || 'auto-generated',
        message: 'Login URL generated successfully'
      });
    } catch (error) {
      logger.error('Failed to generate login URL', { 
        error: error.message,
        ip: req.ip 
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to generate login URL',
        message: error.message
      });
    }
  }

  /**
   * Handle Cognito OAuth2 callback
   * GET /auth/callback
   */
  async handleCallback(req, res) {
    try {
      const { code, state, error } = req.query;
      
      // Check for OAuth errors
      if (error) {
        logger.warn('OAuth callback error', { 
          error,
          state,
          ip: req.ip 
        });
        
        return res.status(400).json({
          success: false,
          error: 'OAuth error',
          message: error
        });
      }

      // Validate required parameters
      if (!code) {
        logger.warn('Missing authorization code in callback', { 
          query: req.query,
          ip: req.ip 
        });
        
        return res.status(400).json({
          success: false,
          error: 'Missing authorization code',
          message: 'Authorization code is required'
        });
      }

      logger.info('Processing OAuth callback', { 
        hasCode: !!code,
        hasState: !!state,
        ip: req.ip 
      });

      // Exchange code for tokens
      const tokens = await cognitoService.exchangeCodeForTokens(code);
      
      // Validate ID token
      const idTokenPayload = await cognitoService.validateIdToken(tokens.id_token);
      
      // Extract user information
      const userInfo = cognitoService.extractUserInfo(idTokenPayload);
      
      // Assume IAM role using Web Identity token
      const awsCredentials = await awsService.assumeRoleWithWebIdentity(tokens.id_token);
      
      // Store session data
      req.session.user = userInfo;
      req.session.tokens = {
        accessToken: tokens.access_token,
        idToken: tokens.id_token,
        refreshToken: tokens.refresh_token
      };
      req.session.awsCredentials = awsCredentials;
      req.session.expiresAt = awsCredentials.expiration;
      
      logger.info('User authenticated successfully', {
        userId: userInfo.sub,
        email: userInfo.email,
        ip: req.ip,
        roleArn: awsCredentials.assumedRoleArn
      });

      // Redirect to frontend or return success
      const redirectUrl = req.query.redirect_uri || 'http://localhost:3000/dashboard';
      
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        // API call - return JSON response
        res.json({
          success: true,
          message: 'Authentication successful',
          user: userInfo,
          awsCredentials: {
            accessKeyId: awsCredentials.accessKeyId,
            expiration: awsCredentials.expiration,
            assumedRoleArn: awsCredentials.assumedRoleArn
          },
          redirectUrl
        });
      } else {
        // Browser call - redirect
        res.redirect(redirectUrl);
      }
      
    } catch (error) {
      logger.error('OAuth callback processing failed', {
        error: error.message,
        query: req.query,
        ip: req.ip
      });
      
      // Clear any partial session data
      if (req.session) {
        req.session.destroy();
      }
      
      const errorMessage = error.message.includes('Token exchange failed') 
        ? 'Invalid or expired authorization code'
        : 'Authentication failed';
      
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        res.status(500).json({
          success: false,
          error: 'Authentication failed',
          message: errorMessage
        });
      } else {
        // Redirect to error page
        res.redirect(`/error?message=${encodeURIComponent(errorMessage)}`);
      }
    }
  }

  /**
   * Logout user and clear session
   * POST /auth/logout
   */
  async logout(req, res) {
    try {
      const userId = req.session?.user?.sub;
      
      // Clear session
      req.session.destroy((err) => {
        if (err) {
          logger.error('Session destruction error', { error: err.message });
        }
      });
      
      logger.info('User logged out', { userId, ip: req.ip });
      
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      logger.error('Logout error', { error: error.message, ip: req.ip });
      
      res.status(500).json({
        success: false,
        error: 'Logout failed',
        message: error.message
      });
    }
  }

  /**
   * Get current user session info
   * GET /auth/me
   */
  async getCurrentUser(req, res) {
    try {
      if (!req.session || !req.session.user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated',
          message: 'No active session found'
        });
      }

      const userInfo = {
        ...req.session.user,
        sessionExpiresAt: req.session.expiresAt,
        hasAwsCredentials: !!req.session.awsCredentials
      };

      // Don't expose sensitive AWS credential details
      if (req.session.awsCredentials) {
        userInfo.awsCredentials = {
          expiration: req.session.awsCredentials.expiration,
          assumedRoleArn: req.session.awsCredentials.assumedRoleArn
        };
      }

      res.json({
        success: true,
        user: userInfo
      });
    } catch (error) {
      logger.error('Get current user error', { error: error.message, ip: req.ip });
      
      res.status(500).json({
        success: false,
        error: 'Failed to get user info',
        message: error.message
      });
    }
  }
}

module.exports = new AuthController();
