/**
 * AWS Controller
 * Handles AWS operations using assumed role credentials
 */

const awsService = require('../utils/aws');
const logger = require('../utils/logger');

class AWSController {
  /**
   * Check AWS connection status and assumed role info
   * GET /aws/status
   */
  async getStatus(req, res) {
    try {
      // Check if user has valid AWS credentials in session
      if (!req.session || !req.session.awsCredentials) {
        return res.status(401).json({
          success: false,
          error: 'No AWS credentials',
          message: 'Please authenticate with AWS Cognito first',
          connected: false
        });
      }

      const credentials = req.session.awsCredentials;
      
      // Validate credentials
      try {
        awsService.validateCredentials(credentials);
      } catch (validationError) {
        logger.warn('AWS credentials validation failed', {
          userId: req.session.user?.sub,
          error: validationError.message
        });
        
        return res.status(401).json({
          success: false,
          error: 'Invalid AWS credentials',
          message: validationError.message,
          connected: false
        });
      }

      // Get account ID from role ARN
      const accountId = awsService.getAccountIdFromRoleArn();
      
      const status = {
        connected: true,
        user: req.session.user,
        aws: {
          region: process.env.COGNITO_REGION,
          accountId,
          roleArn: credentials.assumedRoleArn,
          sessionName: process.env.ASSUME_ROLE_SESSION_NAME,
          credentialsExpireAt: credentials.expiration,
          credentialsValid: true
        },
        timestamp: new Date().toISOString()
      };

      logger.info('AWS status retrieved successfully', {
        userId: req.session.user?.sub,
        accountId,
        roleArn: credentials.assumedRoleArn
      });

      res.json({
        success: true,
        ...status
      });
      
    } catch (error) {
      logger.error('Failed to get AWS status', {
        error: error.message,
        userId: req.session?.user?.sub
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to get AWS status',
        message: error.message,
        connected: false
      });
    }
  }

  /**
   * List S3 buckets using assumed role credentials
   * GET /aws/s3/list
   */
  async listS3Buckets(req, res) {
    try {
      // Check if user has valid AWS credentials in session
      if (!req.session || !req.session.awsCredentials) {
        return res.status(401).json({
          success: false,
          error: 'No AWS credentials',
          message: 'Please authenticate with AWS Cognito first'
        });
      }

      const credentials = req.session.awsCredentials;
      
      // Validate credentials
      try {
        awsService.validateCredentials(credentials);
      } catch (validationError) {
        logger.warn('AWS credentials validation failed for S3 operation', {
          userId: req.session.user?.sub,
          error: validationError.message
        });
        
        return res.status(401).json({
          success: false,
          error: 'Invalid AWS credentials',
          message: validationError.message
        });
      }

      // List S3 buckets
      const s3Result = await awsService.listS3Buckets(credentials);
      
      logger.info('S3 buckets listed successfully', {
        userId: req.session.user?.sub,
        bucketCount: s3Result.count
      });

      res.json({
        success: true,
        data: s3Result,
        message: `Successfully retrieved ${s3Result.count} S3 buckets`
      });
      
    } catch (error) {
      logger.error('Failed to list S3 buckets', {
        error: error.message,
        userId: req.session?.user?.sub
      });
      
      // Handle specific AWS errors
      if (error.message.includes('AccessDenied')) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You do not have permission to list S3 buckets'
        });
      }
      
      if (error.message.includes('InvalidAccessKeyId')) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          message: 'AWS credentials are invalid or expired'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to list S3 buckets',
        message: error.message
      });
    }
  }

  /**
   * Refresh AWS credentials if needed
   * POST /aws/refresh
   */
  async refreshCredentials(req, res) {
    try {
      // Check if user has valid session
      if (!req.session || !req.session.user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated',
          message: 'Please log in first'
        });
      }

      // Check if credentials need refresh (expire within 15 minutes)
      if (req.session.awsCredentials) {
        const expiresAt = new Date(req.session.awsCredentials.expiration);
        const now = new Date();
        const fifteenMinutes = 15 * 60 * 1000; // 15 minutes in milliseconds
        
        if (expiresAt.getTime() - now.getTime() > fifteenMinutes) {
          return res.json({
            success: true,
            message: 'Credentials are still valid',
            expiresAt: req.session.awsCredentials.expiration,
            needsRefresh: false
          });
        }
      }

      // For now, we'll just return that a new login is needed
      // In a real implementation, you might use refresh tokens or re-authenticate
      logger.info('Credentials refresh requested', {
        userId: req.session.user.sub
      });

      res.json({
        success: true,
        message: 'Credentials need refresh',
        needsRefresh: true,
        action: 'Please re-authenticate with AWS Cognito'
      });
      
    } catch (error) {
      logger.error('Failed to refresh credentials', {
        error: error.message,
        userId: req.session?.user?.sub
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to refresh credentials',
        message: error.message
      });
    }
  }
}

module.exports = new AWSController();
