/**
 * Scan Routes
 * API endpoints for security scanning operations
 */

const express = require('express');
const scanController = require('../controllers/scanController');
const logger = require('../utils/logger');

const router = express.Router();

// Middleware to log scan route requests
router.use((req, res, next) => {
  logger.info(`Scan route accessed: ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

/**
 * POST /scan/run
 * Trigger a new security scan
 */
router.post('/run', async (req, res) => {
  try {
    await scanController.runScanNow(req, res);
  } catch (error) {
    logger.error('Error in scan run route:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process scan request',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /scan/summary
 * Get scan summary and compliance metrics
 */
router.get('/summary', (req, res) => {
  try {
    scanController.getSummary(req, res);
  } catch (error) {
    logger.error('Error in scan summary route:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve scan summary',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /scan/findings
 * Get detailed scan findings
 */
router.get('/findings', (req, res) => {
  try {
    scanController.getFindings(req, res);
  } catch (error) {
    logger.error('Error in scan findings route:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve scan findings',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /scan/status
 * Get current scan status
 */
router.get('/status', (req, res) => {
  try {
    scanController.getStatus(req, res);
  } catch (error) {
    logger.error('Error in scan status route:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve scan status',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /scan/report.pdf
 * Download the latest scan report as a PDF
 */
router.get('/report.pdf', async (req, res) => {
  try {
    await scanController.downloadReport(req, res);
  } catch (error) {
    logger.error('Error in scan report route:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate report',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * DELETE /scan/cache
 * Clear cached scan results
 */
router.delete('/cache', (req, res) => {
  try {
    scanController.clearCache(req, res);
  } catch (error) {
    logger.error('Error in scan cache clear route:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to clear scan cache',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /scan/debug
 * Debug endpoint to check session data
 */
router.get('/debug', (req, res) => {
  try {
    const sessionData = {
      hasSession: !!req.session,
      sessionKeys: req.session ? Object.keys(req.session) : [],
      user: req.session?.user || null,
      awsCredentials: req.session?.awsCredentials ? {
        hasAccessKey: !!req.session.awsCredentials.accessKeyId,
        hasSecretKey: !!req.session.awsCredentials.secretAccessKey,
        hasSessionToken: !!req.session.awsCredentials.sessionToken,
        expiration: req.session.awsCredentials.expiration
      } : null,
      tokens: req.session?.tokens ? {
        hasAccessToken: !!req.session.tokens.accessToken,
        hasIdToken: !!req.session.tokens.idToken,
        hasRefreshToken: !!req.session.tokens.refreshToken
      } : null,
      timestamp: new Date().toISOString()
    };

    res.status(200).json(sessionData);
  } catch (error) {
    res.status(500).json({
      error: 'Debug failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /scan/test-permissions
 * Test S3 permissions to see what we can access
 */
router.get('/test-permissions', async (req, res) => {
  try {
    if (!req.session || !req.session.awsCredentials) {
      return res.status(401).json({ error: 'No AWS credentials found' });
    }

    const { S3Client, ListBucketsCommand, ListObjectsV2Command, STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-s3');
    const { STSClient: STSClientImport, GetCallerIdentityCommand: GetCallerIdentityCommandImport } = require('@aws-sdk/client-sts');
    
    // Get caller identity to see which role we're using
    const stsClient = new STSClientImport({
      region: req.session.awsCredentials.region,
      credentials: {
        accessKeyId: req.session.awsCredentials.accessKeyId,
        secretAccessKey: req.session.awsCredentials.secretAccessKey,
        sessionToken: req.session.awsCredentials.sessionToken
      }
    });

    let callerIdentity = null;
    try {
      const identityCommand = new GetCallerIdentityCommandImport({});
      const identityResponse = await stsClient.send(identityCommand);
      callerIdentity = {
        userId: identityResponse.UserId,
        account: identityResponse.Account,
        arn: identityResponse.Arn
      };
    } catch (error) {
      callerIdentity = { error: error.message };
    }
    
    const s3Client = new S3Client({
      region: req.session.awsCredentials.region,
      credentials: {
        accessKeyId: req.session.awsCredentials.accessKeyId,
        secretAccessKey: req.session.awsCredentials.secretAccessKey,
        sessionToken: req.session.awsCredentials.sessionToken
      }
    });

    // Test 1: List buckets
    const listBucketsCommand = new ListBucketsCommand({});
    const bucketsResponse = await s3Client.send(listBucketsCommand);
    const buckets = bucketsResponse.Buckets || [];
    
    // Test 2: Try to list objects in first bucket
    let bucketAccess = [];
    for (const bucket of buckets.slice(0, 3)) { // Test first 3 buckets
      try {
        const listObjectsCommand = new ListObjectsV2Command({
          Bucket: bucket.Name,
          MaxKeys: 5
        });
        const objectsResponse = await s3Client.send(listObjectsCommand);
        bucketAccess.push({
          bucket: bucket.Name,
          canList: true,
          objectCount: objectsResponse.Contents?.length || 0,
          sampleObjects: objectsResponse.Contents?.slice(0, 3).map(obj => obj.Key) || []
        });
      } catch (error) {
        bucketAccess.push({
          bucket: bucket.Name,
          canList: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      canListBuckets: true,
      bucketCount: buckets.length,
      bucketNames: buckets.map(b => b.Name),
      bucketAccess,
      callerIdentity
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to test permissions', 
      message: error.message,
      stack: error.stack
    });
  }
});

/**
 * GET /scan/health
 * Health check for scan service
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'Security Scanner',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /scan/run - Run security scan',
      'GET /scan/summary - Get scan summary',
      'GET /scan/findings - Get scan findings',
      'GET /scan/status - Get scan status',
      'DELETE /scan/cache - Clear scan cache',
      'GET /scan/debug - Debug session data',
      'GET /scan/test-permissions - Test S3 permissions'
    ]
  });
});

module.exports = router;
