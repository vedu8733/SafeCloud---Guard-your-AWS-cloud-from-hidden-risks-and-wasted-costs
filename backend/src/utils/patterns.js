/**
 * Sensitive Data Pattern Detectors
 * Regex patterns for identifying sensitive information in text content
 */

const patterns = [
  // Aadhaar Number (12 digits, may contain spaces or hyphens)
  {
    key: 'aadhaar',
    label: 'Aadhaar Number',
    severity: 'High',
    regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/,
    description: 'Indian Aadhaar identification number',
    recommendation: 'Remove or encrypt Aadhaar numbers. Use hashing for verification purposes.'
  },

  // PAN Card (10 alphanumeric characters)
  {
    key: 'pan',
    label: 'PAN Card Number',
    severity: 'High',
    regex: /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/,
    description: 'Indian Permanent Account Number',
    recommendation: 'Remove or encrypt PAN numbers. Use hashing for verification purposes.'
  },

  // Credit Card Numbers (13-19 digits, Luhn algorithm compatible)
  {
    key: 'credit_card',
    label: 'Credit Card Number',
    severity: 'High',
    regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})\b/,
    description: 'Credit card number (Visa, MasterCard, Amex, Discover, JCB, Diners Club)',
    recommendation: 'Never store credit card numbers in plain text. Use PCI-compliant tokenization.'
  },

  // Bank Account Numbers (10-18 digits)
  {
    key: 'bank_account',
    label: 'Bank Account Number',
    severity: 'Medium',
    regex: /\b\d{10,18}\b/,
    description: 'Bank account number',
    recommendation: 'Encrypt bank account numbers and implement access controls.'
  },

  // Indian Bank Account Numbers (specific format)
  {
    key: 'indian_bank_account',
    label: 'Indian Bank Account Number',
    severity: 'Medium',
    regex: /\b\d{9,18}\b/,
    description: 'Indian bank account number',
    recommendation: 'Encrypt bank account numbers and implement access controls.'
  },

  // IFSC Code (11 characters: 4 letters + 7 alphanumeric)
  {
    key: 'ifsc',
    label: 'IFSC Code',
    severity: 'Low',
    regex: /\b[A-Z]{4}0[A-Z0-9]{6}\b/,
    description: 'Indian Financial System Code',
    recommendation: 'IFSC codes are public information, but ensure they\'re not stored with sensitive account details.'
  },

  // UPI ID (username@provider format)
  {
    key: 'upi',
    label: 'UPI ID',
    severity: 'Low',
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
    description: 'Unified Payment Interface identifier',
    recommendation: 'UPI IDs are generally public, but avoid storing with sensitive financial data.'
  },

  // Email Addresses
  {
    key: 'email',
    label: 'Email Address',
    severity: 'Low',
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
    description: 'Email address',
    recommendation: 'Email addresses are generally low risk, but consider privacy implications in sensitive contexts.'
  },

  // AWS Access Key ID (20 characters)
  {
    key: 'aws_access_key',
    label: 'AWS Access Key ID',
    severity: 'High',
    regex: /\bAKIA[0-9A-Z]{16}\b/,
    description: 'AWS Access Key Identifier',
    recommendation: 'Immediately rotate compromised access keys. Use IAM roles instead of long-term access keys.'
  },

  // AWS Secret Access Key (40 characters)
  {
    key: 'aws_secret_key',
    label: 'AWS Secret Access Key',
    severity: 'High',
    regex: /\b[0-9a-zA-Z/+]{40}\b/,
    description: 'AWS Secret Access Key',
    recommendation: 'Immediately rotate compromised secret keys. Use IAM roles instead of long-term access keys.'
  },

  // Database Connection Strings
  {
    key: 'db_connection',
    label: 'Database Connection String',
    severity: 'High',
    regex: /\b(?:jdbc:|mongodb:|postgresql:|mysql:|redis:|sqlserver:)[^\s]+/i,
    description: 'Database connection string with credentials',
    recommendation: 'Remove hardcoded database credentials. Use environment variables or secret management services.'
  },

  // Strong Passwords (8+ chars, mixed case, numbers, symbols)
  {
    key: 'password',
    label: 'Password Pattern',
    severity: 'Medium',
    regex: /\b(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}\b/,
    description: 'Strong password pattern',
    recommendation: 'Avoid storing passwords in plain text. Use secure hashing algorithms like bcrypt.'
  },

  // API Keys (various formats)
  {
    key: 'api_key',
    label: 'API Key',
    severity: 'High',
    regex: /\b(?:sk_|pk_|key_|api_|token_)[A-Za-z0-9]{20,}\b/i,
    description: 'API key or token',
    recommendation: 'Rotate compromised API keys immediately. Store in environment variables or secret management services.'
  },

  // Private Keys (RSA, DSA, EC)
  {
    key: 'private_key',
    label: 'Private Key',
    severity: 'High',
    regex: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----[\s\S]*?-----END\s+(?:RSA\s+)?PRIVATE\s+KEY-----/,
    description: 'Private cryptographic key',
    recommendation: 'Never commit private keys to version control. Use secure key management services.'
  },

  // Social Security Numbers (US format)
  {
    key: 'ssn',
    label: 'Social Security Number',
    severity: 'High',
    regex: /\b\d{3}-\d{2}-\d{4}\b/,
    description: 'US Social Security Number',
    recommendation: 'Remove or encrypt SSNs. Use hashing for verification purposes.'
  },

  // Phone Numbers (various formats)
  {
    key: 'phone',
    label: 'Phone Number',
    severity: 'Medium',
    regex: /\b\d{10}\b/,
    description: 'Phone number in various formats',
    recommendation: 'Consider privacy implications. Use hashing for verification if needed.'
  },

  // Test Pattern for Debugging
  {
    key: 'test_pattern',
    label: 'Test Pattern',
    severity: 'Low',
    regex: /\b(?:alice|bob|rohit|priya|amit|neha|ajay)\b/i,
    description: 'Test pattern for debugging',
    recommendation: 'This is a test pattern to verify scanner functionality.'
  },

  // Simple Test Pattern - Should definitely match
  {
    key: 'simple_test',
    label: 'Simple Test Pattern',
    severity: 'Low',
    regex: /alice/i,
    description: 'Very simple test pattern',
    recommendation: 'This should definitely match if scanner is working.'
  }
];

// Severity weights for scoring
const severityWeights = {
  'High': 10,
  'Medium': 5,
  'Low': 1
};

// Binary file extensions to skip during scanning
const binaryExtensions = [
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.svg',
  '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.mp3', '.mp4', '.avi', '.mov', '.wmv', '.flv',
  '.exe', '.dll', '.so', '.dylib', '.bin',
  '.iso', '.img', '.vmdk', '.vhd', '.ova'
];

module.exports = {
  patterns,
  severityWeights,
  binaryExtensions
};
