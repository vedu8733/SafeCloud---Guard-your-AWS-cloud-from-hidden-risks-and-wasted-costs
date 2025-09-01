/**
 * AWS Routes
 * Handles AWS operations using assumed role credentials
 */

const express = require('express');
const awsController = require('../controllers/awsController');
const { requireAuth } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * GET /aws/status
 * Check AWS connection status and assumed role info
 * Requires authentication
 */
router.get('/status', requireAuth, async (req, res) => {
  try {
    await awsController.getStatus(req, res);
  } catch (error) {
    logger.error('Route error in /aws/status', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get AWS status'
    });
  }
});

/**
 * GET /aws/s3/list
 * List all S3 buckets using assumed role credentials
 * Requires authentication
 */
router.get('/s3/list', requireAuth, async (req, res) => {
  try {
    await awsController.listS3Buckets(req, res);
  } catch (error) {
    logger.error('Route error in /aws/s3/list', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to list S3 buckets'
    });
  }
});

/**
 * POST /aws/refresh
 * Refresh AWS credentials if needed
 * Requires authentication
 */
router.post('/refresh', requireAuth, async (req, res) => {
  try {
    await awsController.refreshCredentials(req, res);
  } catch (error) {
    logger.error('Route error in /aws/refresh', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to refresh credentials'
    });
  }
});

/**
 * GET /aws/health
 * Basic AWS service health check (public endpoint)
 */
router.get('/health', (req, res) => {
  try {
    res.json({
      success: true,
      service: 'AWS Backend',
      status: 'operational',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      region: process.env.COGNITO_REGION,
      features: {
        cognito: true,
        sts: true,
        s3: true
      }
    });
  } catch (error) {
    logger.error('Route error in /aws/health', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to check AWS service health'
    });
  }
});

module.exports = router;
