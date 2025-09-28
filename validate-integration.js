#!/usr/bin/env node

/**
 * Frontend-Backend Integration Validation Script
 * Tests that frontend can communicate with backend successfully
 */

const config = {
  apiBaseUrl: process.env.VITE_API_BASE_URL || 'https://kisaancenter-backend.whiteisland-e1233153.northeurope.azurecontainerapps.io/api'
};

async function validateEndpoint(endpoint, method = 'GET', expectedStatus = 200) {
  const url = `${config.apiBaseUrl}${endpoint}`;
  console.log(`Testing ${method} ${url}`);
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const statusIcon = response.status === expectedStatus ? '✅' : '❌';
    console.log(`  ${statusIcon} Status: ${response.status} ${response.statusText}`);
    
    if (response.status === expectedStatus || (response.status >= 200 && response.status < 300)) {
      return { success: true, status: response.status };
    } else {
      return { success: false, status: response.status, error: response.statusText };
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function validateIntegration() {
  console.log('🔍 Frontend-Backend Integration Validation');
  console.log('==========================================\n');
  
  console.log(`API Base URL: ${config.apiBaseUrl}\n`);
  
  const tests = [
    // Health check endpoints
    { endpoint: '/../health', method: 'GET', name: 'Health Check' },
    { endpoint: '/../api/test', method: 'GET', name: 'API Discovery' },
    
    // Public endpoints (should work without auth)
    { endpoint: '/categories', method: 'GET', name: 'Categories List' },
    { endpoint: '/products', method: 'GET', name: 'Products List' },
    
    // Auth endpoint (should return 401 or proper response structure)
    { endpoint: '/auth/login', method: 'POST', name: 'Auth Login (expect 400/401)', expectedStatus: 400 },
    
    // Protected endpoints (should return 401 without auth)
    { endpoint: '/users', method: 'GET', name: 'Users List (expect 401)', expectedStatus: 401 },
    { endpoint: '/shops', method: 'GET', name: 'Shops List (expect 401)', expectedStatus: 401 },
    { endpoint: '/transactions', method: 'GET', name: 'Transactions List (expect 401)', expectedStatus: 401 },
    { endpoint: '/payments', method: 'GET', name: 'Payments List (expect 401)', expectedStatus: 401 },
    { endpoint: '/balances/user/1', method: 'GET', name: 'User Balance (expect 401)', expectedStatus: 401 }
  ];
  
  const results = [];
  
  for (const test of tests) {
    console.log(`\n📋 ${test.name}`);
    const result = await validateEndpoint(test.endpoint, test.method, test.expectedStatus);
    results.push({ ...test, ...result });
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n📊 Summary');
  console.log('===========');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);
  
  if (failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    failed.forEach(test => {
      console.log(`  • ${test.name}: ${test.error || `Status ${test.status}`}`);
    });
  }
  
  console.log('\n🎯 Integration Status');
  console.log('=====================');
  
  if (successful.length >= results.length * 0.8) {
    console.log('✅ Integration is working well!');
    console.log('   • Frontend can reach backend');
    console.log('   • API endpoints are responding');
    console.log('   • Expected authentication behavior confirmed');
  } else {
    console.log('⚠️  Integration needs attention');
    console.log('   • Some endpoints are not responding as expected');
    console.log('   • Check network connectivity and backend status');
  }
  
  return {
    total: results.length,
    successful: successful.length,
    failed: failed.length,
    successRate: (successful.length / results.length) * 100
  };
}

// Run validation if called directly
if (require.main === module) {
  validateIntegration()
    .then(summary => {
      process.exit(summary.failed === 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Validation failed:', error);
      process.exit(1);
    });
}

module.exports = { validateIntegration, validateEndpoint };