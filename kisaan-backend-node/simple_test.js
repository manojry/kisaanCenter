console.log('Testing basic Node.js execution...');
console.log('Environment variables loaded:');
console.log('DB_HOST:', process.env.DB_HOST || 'Not found');
console.log('DB_NAME:', process.env.DB_NAME || 'Not found');
console.log('DB_USER:', process.env.DB_USER || 'Not found');

// Load dotenv
require('dotenv').config();

console.log('\nAfter dotenv:');
console.log('DB_HOST:', process.env.DB_HOST || 'Not found');
console.log('DB_NAME:', process.env.DB_NAME || 'Not found');
console.log('DB_USER:', process.env.DB_USER || 'Not found');

console.log('✅ Basic test completed');
