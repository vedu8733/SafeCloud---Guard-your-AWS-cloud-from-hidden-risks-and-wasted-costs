/**
 * AWS Cognito Utility Functions
 * Handles OAuth2 flow, token exchange, and JWT validation
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const logger = require('./logger');

class CognitoService {
  constructor() {
    this.region = process.env.COGNITO_REGION;
    this.domain = process.env.COGNITO_DOMAIN;
    this.userPoolId = process.env.COGNITO_USER_POOL_ID;
    this.clientId = process.env.COGNITO_CLIENT_ID;
    this.clientSecret = process.env.COGNITO_CLIENT_SECRET;
    this.redirectUri = process.env.COGNITO_REDIRECT_URI;
    
    // Initialize JWKS client for token validation
    this.jwksClient = jwksClient({
      jwksUri: `https://cognito-idp.${this.region}.amazonaws.com/${this.userPoolId}/.well-known/jwks.json`,
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 600000, // 10 minutes
    });
  }

  /**
   * Generate Cognito Hosted UI login URL
   */
  generateLoginUrl(state = null) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'openid email profile',
      state: state || this.generateState()
       
    });

    const loginUrl = `${this.domain}/oauth2/authorize?${params.toString()}`;
    logger.info('Generated Cognito login URL', { loginUrl });
    
    return loginUrl;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code) {
    try {
      logger.info('Exchanging authorization code for tokens');
      
      const tokenEndpoint = `${this.domain}/oauth2/token`;
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        redirect_uri: this.redirectUri
      });

      const response = await axios.post(tokenEndpoint, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const tokens = response.data;
      logger.info('Successfully exchanged code for tokens', { 
        accessToken: !!tokens.access_token,
        idToken: !!tokens.id_token,
        refreshToken: !!tokens.refresh_token
      });

      return tokens;
    } catch (error) {
      logger.error('Failed to exchange code for tokens', { 
        error: error.message,
        status: error.response?.status
      });
      throw new Error(`Token exchange failed: ${error.message}`);
    }
  }

  /**
   * Validate Cognito ID token
   */
  async validateIdToken(idToken) {
    try {
      logger.debug('Validating ID token');
      
      // Decode token header to get key ID
      const decoded = jwt.decode(idToken, { complete: true });
      if (!decoded) {
        throw new Error('Invalid token format');
      }

      const { kid } = decoded.header;
      if (!kid) {
        throw new Error('Token missing key ID');
      }

      // Get public key from JWKS
      const key = await this.jwksClient.getSigningKey(kid);
      const publicKey = key.getPublicKey();

      // Verify token
      const verified = jwt.verify(idToken, publicKey, {
        algorithms: ['RS256'],
        issuer: `https://cognito-idp.${this.region}.amazonaws.com/${this.userPoolId}`,
        audience: this.clientId
      });

      logger.info('ID token validated successfully', { 
        sub: verified.sub,
        email: verified.email
      });

      return verified;
    } catch (error) {
      logger.error('ID token validation failed', { error: error.message });
      throw new Error(`Token validation failed: ${error.message}`);
    }
  }

  /**
   * Generate random state parameter for OAuth2
   */
  generateState() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Extract user information from ID token
   */
  extractUserInfo(idTokenPayload) {
    return {
      sub: idTokenPayload.sub,
      email: idTokenPayload.email,
      emailVerified: idTokenPayload.email_verified,
      name: idTokenPayload.name,
      username: idTokenPayload['cognito:username'],
      groups: idTokenPayload['cognito:groups'] || []
    };
  }
}

module.exports = new CognitoService();
