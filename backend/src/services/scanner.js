/**
 * S3 Scanner Service
 * Scans S3 objects for sensitive data patterns and generates compliance reports
 */

const { S3Client, ListBucketsCommand, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const { patterns, severityWeights, binaryExtensions } = require('../utils/patterns');
const logger = require('../utils/logger');

class ScannerService {
  constructor() {
    this.region = process.env.COGNITO_REGION || 'us-east-1';
  }

  /**
   * Get S3 client using session credentials
   */
  getS3Client(session) {
    if (!session || !session.awsCredentials) {
      throw new Error('Invalid session or missing credentials');
    }

    return new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: session.awsCredentials.accessKeyId,
        secretAccessKey: session.awsCredentials.secretAccessKey,
        sessionToken: session.awsCredentials.sessionToken
      }
    });
  }

  /**
   * Check if file should be skipped (binary files)
   */
  shouldSkipFile(key) {
    const extension = key.toLowerCase().substring(key.lastIndexOf('.'));
    return binaryExtensions.includes(extension);
  }

  /**
   * Scan text content for sensitive patterns
   */
  scanTextContent(text) {
    const matches = [];
    
    logger.debug(`Scanning text content of length: ${text.length}`);
    
    patterns.forEach(pattern => {
      const regex = new RegExp(pattern.regex.source, 'gi');
      const found = text.match(regex);
      
      if (found && found.length > 0) {
        logger.debug(`Pattern "${pattern.key}" found ${found.length} matches: ${found.slice(0, 2).join(', ')}`);
        matches.push({
          pattern: pattern.key,
          label: pattern.label,
          severity: pattern.severity,
          count: found.length,
          samples: found.slice(0, 3), // Limit samples to first 3
          description: pattern.description,
          recommendation: pattern.recommendation
        });
      }
    });

    logger.debug(`Total patterns matched: ${matches.length}`);
    return matches;
  }

  /**
   * Read object content (first 500KB)
   */
  async readObjectContent(s3Client, bucket, key) {
    try {
      logger.debug(`Attempting to read object: ${bucket}/${key}`);
      
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
        Range: 'bytes=0-512000' // First 500KB
      });

      const response = await s3Client.send(command);
      
      if (response.Body) {
        // Node.js: Body is a Readable stream; aggregate to UTF-8 string
        const chunks = [];
        for await (const chunk of response.Body) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        const content = Buffer.concat(chunks).toString('utf8');
        
        logger.debug(`Successfully read ${bucket}/${key}: ${content.length} characters`);
        logger.debug(`First 200 characters: ${content.substring(0, 200)}`);
        
        return content;
      }
      
      logger.debug(`No body in response for ${bucket}/${key}`);
      return '';
    } catch (error) {
      const code = error && (error.name || error.code || (error.$metadata && error.$metadata.httpStatusCode));
      logger.warn(`Failed to read object ${bucket}/${key}: ${error.message || 'Unknown error'} (${code || 'no-code'})`);
      if (code === 'AccessDenied' || code === 403) {
        logger.warn('AccessDenied when reading object. Ensure s3:GetObject on the bucket/key.');
      }
      if (error && error.message && error.message.includes('KMS')) {
        logger.warn('KMS error when reading object. Ensure kms:Decrypt permission for the object\'s KMS key.');
      }
      return '';
    }
  }

  /**
   * Scan a single S3 object
   */
  async scanObject(s3Client, bucket, key) {
    try {
      if (this.shouldSkipFile(key)) {
        logger.debug(`Skipping binary file: ${bucket}/${key}`);
        return null;
      }

      const content = await this.readObjectContent(s3Client, bucket, key);
      if (!content || content.trim().length === 0) {
        logger.debug(`Empty content in file: ${bucket}/${key}`);
        return null;
      }

      logger.debug(`Scanning file: ${bucket}/${key}, content length: ${content.length}`);
      
      const matches = this.scanTextContent(content);
      logger.debug(`Found ${matches.length} matches in ${bucket}/${key}`);
      
      if (matches.length === 0) {
        return null;
      }

      return {
        bucket,
        key,
        size: content.length,
        matches
      };
    } catch (error) {
      logger.error(`Error scanning object ${bucket}/${key}:`, error.message);
      return null;
    }
  }

  /**
   * List objects in a bucket (limited to 200)
   */
  async listBucketObjects(s3Client, bucketName) {
    try {
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        MaxKeys: 200
      });

      const response = await s3Client.send(command);
      return response.Contents || [];
    } catch (error) {
      logger.error(`Failed to list objects in bucket ${bucketName}:`, error.message);
      return [];
    }
  }

  /**
   * Run comprehensive S3 scan
   */
  async runScan(session) {
    const startTime = Date.now();
    const s3Client = this.getS3Client(session);
    
    try {
      logger.info('Starting S3 security scan...');
      
      // List all buckets
      const listBucketsCommand = new ListBucketsCommand({});
      const bucketsResponse = await s3Client.send(listBucketsCommand);
      const buckets = bucketsResponse.Buckets || [];
      
      logger.info(`Found ${buckets.length} buckets to scan`);
      
      if (buckets.length === 0) {
        logger.warn('No buckets found to scan');
        const scanDurationEmpty = Date.now() - startTime;
        return { summary: this.generateSummary([], scanDurationEmpty), findings: [] };
      }
      
      // Log bucket names for debugging
      logger.info('Buckets to scan:', buckets.map(b => b.Name).join(', '));
      
      // Check if we have access to buckets
      for (const bucket of buckets) {
        try {
          const testCommand = new ListObjectsV2Command({
            Bucket: bucket.Name,
            MaxKeys: 1
          });
          await s3Client.send(testCommand);
          logger.debug(`✅ Access confirmed for bucket: ${bucket.Name}`);
        } catch (error) {
          logger.warn(`❌ No access to bucket ${bucket.Name}: ${error.message}`);
        }
      }
      
      const allFindings = [];
      let totalObjects = 0;
      let scannedObjects = 0;
      
      // Scan each bucket
      for (const bucket of buckets) {
        const bucketName = bucket.Name;
        logger.info(`Scanning bucket: ${bucketName}`);
        
        const objects = await this.listBucketObjects(s3Client, bucketName);
        logger.info(`Found ${objects.length} objects in bucket ${bucketName}`);
        totalObjects += objects.length;
        
              // Scan objects in parallel (limit concurrency)
      const batchSize = 10;
      for (let i = 0; i < objects.length; i += batchSize) {
        const batch = objects.slice(i, i + batchSize);
        logger.debug(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(objects.length/batchSize)}`);
        
        const batchPromises = batch.map(async (obj) => {
          const result = await this.scanObject(s3Client, bucketName, obj.Key);
          if (result === null) {
            logger.debug(`No issues found in: ${bucketName}/${obj.Key}`);
          } else {
            logger.debug(`Issues found in: ${bucketName}/${obj.Key} - ${result.matches.length} patterns matched`);
          }
          return result;
        });
        
        const batchResults = await Promise.all(batchPromises);
        const validResults = batchResults.filter(result => result !== null);
        allFindings.push(...validResults);
        
        scannedObjects += batch.length;
        
        // Log progress
        if (scannedObjects % 50 === 0) {
          logger.info(`Scanned ${scannedObjects}/${totalObjects} objects...`);
        }
      }
      }
      
      const scanDuration = Date.now() - startTime;
      logger.info(`Scan completed in ${scanDuration}ms. Scanned ${scannedObjects} objects, found ${allFindings.length} objects with issues.`);
      
      // Generate summary and findings
      const summary = this.generateSummary(allFindings, scanDuration);
      const findings = this.convertToFindings(allFindings);
      
      return { summary, findings };
      
    } catch (error) {
      logger.error('Scan failed:', error.message);
      throw new Error(`Scan failed: ${error.message}`);
    }
  }

  /**
   * Generate scan summary with compliance metrics
   */
  generateSummary(findings, scanDuration) {
    const totalIssues = findings.reduce((sum, finding) => sum + finding.matches.length, 0);
    
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;
    
    findings.forEach(finding => {
      finding.matches.forEach(match => {
        switch (match.severity) {
          case 'High':
            highCount++;
            break;
          case 'Medium':
            mediumCount++;
            break;
          case 'Low':
            lowCount++;
            break;
        }
      });
    });
    
    // Calculate compliance score (100 - weighted penalty, minimum 50)
    const penalty = (highCount * severityWeights.High) + 
                   (mediumCount * severityWeights.Medium) + 
                   (lowCount * severityWeights.Low);
    const complianceScore = Math.max(50, 100 - penalty);
    
    // Calculate estimated savings
    const estSavings = (highCount * 20) + (mediumCount * 5) + (lowCount * 1);
    
    // Project status
    const now = new Date();
    const nextScan = new Date(now.getTime() + (22 * 60 * 60 * 1000)); // +22 hours
    
    return {
      totalIssues,
      high: highCount,
      medium: mediumCount,
      low: lowCount,
      complianceScore: Math.round(complianceScore * 100) / 100,
      estSavings,
      scanDuration,
      projectStatus: {
        lastScan: now.toISOString(),
        nextScan: nextScan.toISOString(),
        totalScans: 1 // This would be incremented in a real implementation
      }
    };
  }

  /**
   * Convert scan results to findings format
   */
  convertToFindings(scanResults) {
    return scanResults.map(result => {
      const resource = `${result.bucket}/${result.key}`;
      
      // Group matches by severity
      const highIssues = result.matches.filter(m => m.severity === 'High');
      const mediumIssues = result.matches.filter(m => m.severity === 'Medium');
      const lowIssues = result.matches.filter(m => m.severity === 'Low');
      
      const findings = [];
      
      // Add findings for each severity level
      if (highIssues.length > 0) {
        findings.push({
          resource,
          type: 'High Risk',
          severity: 'High',
          recommendation: 'Immediate action required',
          details: {
            rule: highIssues[0].label,
            count: highIssues.length,
            samples: highIssues.slice(0, 2).map(m => m.samples).flat()
          }
        });
      }
      
      if (mediumIssues.length > 0) {
        findings.push({
          resource,
          type: 'Medium Risk',
          severity: 'Medium',
          recommendation: 'Review and address soon',
          details: {
            rule: mediumIssues[0].label,
            count: mediumIssues.length,
            samples: mediumIssues.slice(0, 2).map(m => m.samples).flat()
          }
        });
      }
      
      if (lowIssues.length > 0) {
        findings.push({
          resource,
          type: 'Low Risk',
          severity: 'Low',
          recommendation: 'Monitor and review',
          details: {
            rule: lowIssues[0].label,
            count: lowIssues.length,
            samples: lowIssues.slice(0, 2).map(m => m.samples).flat()
          }
        });
      }
      
      return findings;
    }).flat();
  }
}

module.exports = new ScannerService();
