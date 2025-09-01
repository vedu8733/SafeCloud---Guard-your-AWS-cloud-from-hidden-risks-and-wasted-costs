/**
 * Test Setup Script
 * Verifies backend configuration and dependencies
 */

console.log('🔍 SafeCloud Backend Setup Verification\n');

// Check Node.js version
const nodeVersion = process.version;
const requiredVersion = '16.0.0';
console.log(`📋 Node.js Version: ${nodeVersion}`);

if (process.versions.node < requiredVersion) {
  console.log(`❌ Node.js ${requiredVersion}+ is required`);
  process.exit(1);
} else {
  console.log('✅ Node.js version is compatible');
}

// Check environment variables
console.log('\n🔧 Environment Variables Check:');
const requiredEnvVars = [
  'SESSION_SECRET',
  'COGNITO_REGION',
  'COGNITO_DOMAIN',
  'COGNITO_USER_POOL_ID',
  'COGNITO_CLIENT_ID',
  'COGNITO_CLIENT_SECRET',
  'COGNITO_REDIRECT_URI',
  'ASSUME_ROLE_ARN',
  'ASSUME_ROLE_SESSION_NAME'
];

let envCheckPassed = true;
requiredEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar}: Set`);
  } else {
    console.log(`❌ ${envVar}: Not set`);
    envCheckPassed = false;
  }
});

if (!envCheckPassed) {
  console.log('\n⚠️  Some environment variables are missing.');
  console.log('   Please copy env.example to .env and fill in the values.');
} else {
  console.log('\n✅ All required environment variables are set');
}

// Check package.json
console.log('\n📦 Package.json Check:');
try {
  const packageJson = require('./package.json');
  console.log(`✅ Package name: ${packageJson.name}`);
  console.log(`✅ Version: ${packageJson.version}`);
  console.log(`✅ Main entry: ${packageJson.main}`);
  
  const requiredDeps = [
    'express', 'express-session', 'aws-sdk', 
    '@aws-sdk/client-sts', '@aws-sdk/client-s3',
    'jsonwebtoken', 'jwks-rsa', 'winston'
  ];
  
  console.log('\n📚 Required Dependencies:');
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies[dep]) {
      console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
    } else {
      console.log(`❌ ${dep}: Missing`);
    }
  });
  
} catch (error) {
  console.log('❌ Could not read package.json:', error.message);
}

// Check directory structure
console.log('\n📁 Directory Structure Check:');
const fs = require('fs');
const path = require('path');

const requiredDirs = [
  'src',
  'src/controllers',
  'src/middleware', 
  'src/routes',
  'src/utils',
  'logs'
];

requiredDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`✅ ${dir}/`);
  } else {
    console.log(`❌ ${dir}/ (missing)`);
  }
});

// Check key files
console.log('\n📄 Key Files Check:');
const requiredFiles = [
  'server.js',
  'src/utils/logger.js',
  'src/utils/cognito.js',
  'src/utils/aws.js',
  'src/middleware/auth.js',
  'src/controllers/authController.js',
  'src/controllers/awsController.js',
  'src/routes/auth.js',
  'src/routes/aws.js'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} (missing)`);
  }
});

console.log('\n🎯 Setup Verification Complete!');
console.log('\n📖 Next Steps:');
console.log('1. Install dependencies: npm install');
console.log('2. Start the server: npm run dev');
console.log('3. Test endpoints: http://localhost:8000/health');
console.log('4. Check logs in the logs/ directory');

if (!envCheckPassed) {
  console.log('\n⚠️  IMPORTANT: Set up your .env file before starting the server!');
  process.exit(1);
}
