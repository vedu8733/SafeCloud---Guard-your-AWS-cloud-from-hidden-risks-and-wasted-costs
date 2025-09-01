# SafeCloud Backend

A Node.js backend service that integrates with AWS Cognito for authentication and AWS IAM for role assumption using Web Identity tokens.

## 🚀 Features

- **AWS Cognito Integration**: OAuth2 flow with hosted UI
- **IAM Role Assumption**: Uses `AssumeRoleWithWebIdentity` for secure AWS access
- **Session Management**: Secure session handling with express-session
- **JWT Validation**: Cognito ID token validation using JWKS
- **AWS SDK v3**: Modern AWS SDK for S3 operations
- **Structured Logging**: Winston-based logging with configurable levels
- **Security**: Helmet, CORS, and proper error handling

## 📁 Project Structure

```
backend/
├── src/
│   ├── controllers/     # Business logic handlers
│   ├── middleware/      # Authentication and validation middleware
│   ├── routes/          # Express route definitions
│   └── utils/           # Utility functions and services
├── .env.example         # Environment variables template
├── package.json         # Dependencies and scripts
├── server.js            # Main server file
└── README.md            # This file
```

## 🛠️ Prerequisites

- Node.js 16+ 
- npm or yarn
- AWS Account with Cognito User Pool
- IAM Role configured for Web Identity federation

## ⚙️ Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Copy the environment template and fill in your values:

```bash
cp env.example .env
```

Edit `.env` with your actual values:

```env
# Session Configuration
SESSION_SECRET=your_secure_session_secret_here

# AWS Cognito Configuration
COGNITO_REGION=ap-south-1
COGNITO_DOMAIN=https://your-domain.auth.region.amazoncognito.com
COGNITO_USER_POOL_ID=region_poolid
COGNITO_CLIENT_ID=your_client_id
COGNITO_CLIENT_SECRET=your_client_secret
COGNITO_REDIRECT_URI=http://localhost:8000/auth/callback

# AWS IAM Role Configuration
ASSUME_ROLE_ARN=arn:aws:iam::account:role/YourRoleName
ASSUME_ROLE_SESSION_NAME=safecloud-session

# Application Configuration
LOG_LEVEL=INFO
PORT=8000
NODE_ENV=development
```

### 3. Create Logs Directory

```bash
mkdir logs
```

### 4. Start the Server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:8000`

## 🔐 Authentication Flow

### 1. Get Login URL
```http
GET /auth/login-url
```

Returns a Cognito Hosted UI login URL.

### 2. User Authentication
User is redirected to Cognito Hosted UI for login.

### 3. OAuth2 Callback
```http
GET /auth/callback?code=AUTHORIZATION_CODE&state=STATE
```

Handles the OAuth2 callback, exchanges code for tokens, and assumes IAM role.

### 4. Session Management
User session is created with AWS credentials from assumed role.

## 📡 API Endpoints

### Authentication Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/auth/login-url` | Generate Cognito login URL | No |
| `GET` | `/auth/callback` | Handle OAuth2 callback | No |
| `POST` | `/auth/logout` | Logout user | Yes |
| `GET` | `/auth/me` | Get current user info | Yes |
| `GET` | `/auth/status` | Check auth status | No |

### AWS Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/aws/status` | Check AWS connection status | Yes |
| `GET` | `/aws/s3/list` | List S3 buckets | Yes |
| `POST` | `/aws/refresh` | Refresh AWS credentials | Yes |
| `GET` | `/aws/health` | AWS service health check | No |

### Utility Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/health` | Server health check | No |

## 🔧 Configuration

### Log Levels

Set `LOG_LEVEL` in your `.env` file:

- `ERROR`: Only error messages
- `WARN`: Warnings and errors
- `INFO`: Info, warnings, and errors (default)
- `HTTP`: HTTP requests, info, warnings, and errors
- `DEBUG`: All log levels

### CORS Configuration

CORS is configured to allow:
- Development: `http://localhost:3000`, `http://localhost:8000`
- Production: Configure in `server.js`

### Session Configuration

Sessions are configured with:
- 24-hour expiration
- Secure cookies in production
- HTTP-only cookies
- Configurable same-site policy

## 🚨 Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing control
- **Session Security**: Secure session configuration
- **JWT Validation**: Proper Cognito token validation
- **Input Validation**: Request parameter validation
- **Error Handling**: Secure error responses

## 📝 Usage Examples

### Frontend Integration

```javascript
// Get login URL
const response = await fetch('/auth/login-url');
const { loginUrl } = await response.json();

// Redirect user to Cognito
window.location.href = loginUrl;

// Check authentication status
const statusResponse = await fetch('/auth/status');
const { authenticated, user } = await statusResponse.json();

// List S3 buckets (requires authentication)
const s3Response = await fetch('/aws/s3/list', {
  credentials: 'include' // Include session cookies
});
const { data } = await s3Response.json();
```

### API Testing with cURL

```bash
# Check server health
curl http://localhost:8000/health

# Get login URL
curl http://localhost:8000/auth/login-url

# Check auth status
curl http://localhost:8000/auth/status

# Get AWS status (requires session cookie)
curl -b session_cookie.txt http://localhost:8000/aws/status
```

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**: Check CORS configuration in `server.js`
2. **Session Issues**: Verify `SESSION_SECRET` is set
3. **AWS Errors**: Check IAM role permissions and Cognito configuration
4. **Token Validation**: Ensure Cognito User Pool is properly configured

### Debug Mode

Set `LOG_LEVEL=DEBUG` in your `.env` file for detailed logging.

### Log Files

Check `logs/` directory for:
- `all.log`: All log messages
- `error.log`: Error messages only

## 🔄 Development

### Code Structure

- **Controllers**: Handle HTTP requests and responses
- **Services**: Business logic and external API calls
- **Middleware**: Request processing and validation
- **Routes**: URL endpoint definitions

### Adding New Features

1. Create controller methods in appropriate controller
2. Add routes in corresponding route file
3. Update middleware if needed
4. Add tests (recommended)

## 📚 Dependencies

### Core Dependencies
- `express`: Web framework
- `express-session`: Session management
- `aws-sdk`: AWS SDK v2 (for compatibility)
- `@aws-sdk/client-sts`: AWS STS client
- `@aws-sdk/client-s3`: AWS S3 client

### Security & Validation
- `helmet`: Security headers
- `cors`: CORS middleware
- `jsonwebtoken`: JWT handling
- `jwks-rsa`: JWKS client for token validation

### Utilities
- `winston`: Logging
- `dotenv`: Environment variable loading
- `axios`: HTTP client

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review logs for error details
3. Verify configuration values
4. Create an issue with detailed information
