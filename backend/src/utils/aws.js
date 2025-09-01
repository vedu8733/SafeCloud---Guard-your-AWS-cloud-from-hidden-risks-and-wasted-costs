/**
 * AWS Utility Functions
 * Handles STS role assumption and S3 operations
 */

const { STSClient, AssumeRoleWithWebIdentityCommand } = require('@aws-sdk/client-sts');
const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');
const logger = require('./logger');

class AWSService {
  constructor() {
    this.region = process.env.COGNITO_REGION;
    this.assumeRoleArn = process.env.ASSUME_ROLE_ARN;
    this.sessionName = process.env.ASSUME_ROLE_SESSION_NAME;
    
    // Initialize STS client
    this.stsClient = new STSClient({ region: this.region });
  }

  /**
   * Assume IAM role using Web Identity token
   */
  async assumeRoleWithWebIdentity(idToken) {
    try {
      logger.info('Assuming IAM role with Web Identity token');
      
      const command = new AssumeRoleWithWebIdentityCommand({
        RoleArn: this.assumeRoleArn,
        RoleSessionName: this.sessionName,
        WebIdentityToken: idToken,
        DurationSeconds: 3600, // 1 hour
      });

      const response = await this.stsClient.send(command);
      
      logger.info('Successfully assumed IAM role', {
        roleArn: this.assumeRoleArn,
        sessionName: this.sessionName,
        expiration: response.Credentials.Expiration
      });

      return {
        accessKeyId: response.Credentials.AccessKeyId,
        secretAccessKey: response.Credentials.SecretAccessKey,
        sessionToken: response.Credentials.SessionToken,
        expiration: response.Credentials.Expiration,
        assumedRoleArn: response.AssumedRoleUser.Arn
      };
    } catch (error) {
      logger.error('Failed to assume IAM role', {
        error: error.message,
        roleArn: this.assumeRoleArn
      });
      throw new Error(`Role assumption failed: ${error.message}`);
    }
  }

  /**
   * List S3 buckets using assumed role credentials
   */
  async listS3Buckets(credentials) {
    try {
      logger.info('Listing S3 buckets with assumed role credentials');
      
      const s3Client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          sessionToken: credentials.sessionToken
        }
      });

      const command = new ListBucketsCommand({});
      const response = await s3Client.send(command);
      
      const buckets = response.Buckets.map(bucket => ({
        name: bucket.Name,
        creationDate: bucket.CreationDate
      }));

      logger.info(`Successfully listed ${buckets.length} S3 buckets`);
      
      return {
        buckets,
        count: buckets.length,
        owner: response.Owner
      };
    } catch (error) {
      logger.error('Failed to list S3 buckets', {
        error: error.message,
        credentials: !!credentials
      });
      throw new Error(`S3 operation failed: ${error.message}`);
    }
  }

  /**
   * Validate AWS credentials
   */
  validateCredentials(credentials) {
    if (!credentials || 
        !credentials.accessKeyId || 
        !credentials.secretAccessKey || 
        !credentials.sessionToken) {
      throw new Error('Invalid or missing AWS credentials');
    }

    // Check if credentials are expired
    if (new Date(credentials.expiration) <= new Date()) {
      throw new Error('AWS credentials have expired');
    }

    return true;
  }

  /**
   * Get AWS account ID from role ARN
   */
  getAccountIdFromRoleArn() {
    const match = this.assumeRoleArn.match(/arn:aws:iam::(\d+):role\/(.+)/);
    return match ? match[1] : null;
  }
}

module.exports = new AWSService();
