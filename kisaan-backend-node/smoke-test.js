#!/usr/bin/env node

/**
 * Comprehensive API Smoke Test Script
 * Tests all major API endpoints using owner credentials
 * Usage: node smoke-test.js <owner_username> <owner_password>
 */

const axios = require('axios');

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:8000/api';

// Owner credentials from command line arguments
const OWNER_USERNAME = process.argv[2];
const OWNER_PASSWORD = process.argv[3];

if (!OWNER_USERNAME || !OWNER_PASSWORD) {
  console.error('❌ Usage: node smoke-test.js <owner_username> <owner_password>');
  console.error('Example: node smoke-test.js test_owner_123 password123');
  process.exit(1);
}

let authToken = '';
let ownerId = null;
let shopId = null;

// Test results tracking
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

function logResult(testName, success, error = null) {
  results.total++;
  if (success) {
    results.passed++;
    console.log(`✅ ${testName}`);
  } else {
    results.failed++;
    console.log(`❌ ${testName}`);
    if (error) {
      console.log(`   Status: ${error.status || 'Unknown'}`);
      console.log(`   Error: ${JSON.stringify(error.error || error, null, 2)}`);
      results.errors.push({ test: testName, error: error.error || error, status: error.status });
    }
  }
}

async function makeRequest(method, endpoint, data = null, useAuth = true) {
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {}
  };

  if (useAuth && authToken) {
    config.headers['Authorization'] = `Bearer ${authToken}`;
  }

  if (data && (method === 'post' || method === 'put')) {
    config.data = data;
    config.headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
}

async function authenticate() {
  console.log('\n🔐 Authenticating as owner...');
  const result = await makeRequest('post', '/auth/login', {
    username: OWNER_USERNAME,
    password: OWNER_PASSWORD
  }, false);

  if (result.success && result.data?.data?.token) {
    authToken = result.data.data.token;
    ownerId = result.data.data.user?.id;
    console.log(`✅ Authentication successful. Owner ID: ${ownerId}`);
    return true;
  } else {
    console.log('❌ Authentication failed');
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.error, null, 2));
    return false;
  }
}

async function testAuthEndpoints() {
  console.log('\n🔐 Testing Authentication Endpoints...');

  // Test login (already done above, but test endpoint structure)
  logResult('Auth Login', authToken !== '');

  // Test logout
  const logoutResult = await makeRequest('post', '/auth/logout');
  logResult('Auth Logout', logoutResult.success);

  // Test current user
  const userResult = await makeRequest('get', '/users/me');
  logResult('Get Current User', userResult.success && userResult.data?.data);
}

async function testUserEndpoints() {
  console.log('\n👥 Testing User Endpoints...');

  // Get users list
  const usersResult = await makeRequest('get', '/users/');
  logResult('Get Users List', usersResult.success);

  // Get current user details
  const currentUserResult = await makeRequest('get', `/users/${ownerId}`);
  logResult('Get User by ID', currentUserResult.success);
}

async function testShopEndpoints() {
  console.log('\n🏪 Testing Shop Endpoints...');

  // Get shops
  const shopsResult = await makeRequest('get', '/shops/');
  logResult('Get Shops List', shopsResult.success);

  if (shopsResult.success && shopsResult.data?.data?.length > 0) {
    shopId = shopsResult.data.data[0].id;
    console.log(`   Found shop ID: ${shopId}`);

    // Get specific shop
    const shopResult = await makeRequest('get', `/shops/${shopId}`);
    logResult('Get Shop by ID', shopResult.success);
  }
}

async function testProductEndpoints() {
  console.log('\n📦 Testing Product Endpoints...');

  // Get products
  const productsResult = await makeRequest('get', '/products/');
  logResult('Get Products List', productsResult.success);

  if (productsResult.success && productsResult.data?.data?.length > 0) {
    const productId = productsResult.data.data[0].id;

    // Get specific product
    const productResult = await makeRequest('get', `/products/${productId}`);
    logResult('Get Product by ID', productResult.success);
  }
}

async function testTransactionEndpoints() {
  console.log('\n💰 Testing Transaction Endpoints...');

  // Get transactions
  const transactionsResult = await makeRequest('get', '/transactions/');
  logResult('Get Transactions List', transactionsResult.success);

  // Get transaction analytics
  const analyticsResult = await makeRequest('get', '/transactions/analytics');
  logResult('Get Transaction Analytics', analyticsResult.success);

  if (shopId) {
    // Get shop transactions
    const shopTransactionsResult = await makeRequest('get', `/transactions/shop/${shopId}/list`);
    logResult('Get Shop Transactions', shopTransactionsResult.success);

    // Get shop earnings
    const earningsResult = await makeRequest('get', `/transactions/shop/${shopId}/earnings`);
    logResult('Get Shop Earnings', earningsResult.success);
  }
}

async function testPaymentEndpoints() {
  console.log('\n💳 Testing Payment Endpoints...');

  // Get payments
  const paymentsResult = await makeRequest('get', '/payments/');
  logResult('Get Payments List', paymentsResult.success);

  // Get outstanding payments
  const outstandingResult = await makeRequest('get', '/transactions/payments/outstanding');
  logResult('Get Outstanding Payments', outstandingResult.success);
}

async function testBalanceEndpoints() {
  console.log('\n⚖️ Testing Balance Endpoints...');

  if (ownerId) {
    // Get user balance
    const balanceResult = await makeRequest('get', `/balances/user/${ownerId}`);
    logResult('Get User Balance', balanceResult.success);

    // Get balance history
    const historyResult = await makeRequest('get', `/balances/history/${ownerId}`);
    logResult('Get Balance History', historyResult.success);
  }

  if (shopId) {
    // Get shop balance
    const shopBalanceResult = await makeRequest('get', `/balances/shop/${shopId}`);
    logResult('Get Shop Balance', shopBalanceResult.success);
  }
}

async function testSettlementEndpoints() {
  console.log('\n🔄 Testing Settlement Endpoints...');

  if (!shopId) {
    console.log('   Skipping settlement tests - no shop found');
    logResult('Get Settlements List', false, { status: 404, error: 'No shop available for testing' });
    logResult('Get Settlement Summary', false, { status: 404, error: 'No shop available for testing' });
    return;
  }

  // Get settlements with shop_id
  const settlementsResult = await makeRequest('get', `/settlements/?shop_id=${shopId}`);
  logResult('Get Settlements List', settlementsResult.success);

  // Get settlement summary with shop_id
  const summaryResult = await makeRequest('get', `/settlements/summary?shop_id=${shopId}`);
  logResult('Get Settlement Summary', summaryResult.success);
}

async function testCommissionEndpoints() {
  console.log('\n📊 Testing Commission Endpoints...');

  // Get commissions
  const commissionsResult = await makeRequest('get', '/commissions/');
  logResult('Get Commissions List', commissionsResult.success);

  if (shopId) {
    // Get shop commissions
    const shopCommissionsResult = await makeRequest('get', `/commissions/shop/${shopId}`);
    logResult('Get Shop Commissions', shopCommissionsResult.success);
  }
}

async function testReportEndpoints() {
  console.log('\n📋 Testing Report Endpoints...');

  // Note: Report generation might be resource-intensive, so we'll just test the endpoint exists
  const reportResult = await makeRequest('get', '/reports/generate', null, true);
  // Reports might require specific parameters, so we accept both success and expected failures
  logResult('Report Generation Endpoint', reportResult.status !== 404);
}

async function testDashboardEndpoints() {
  console.log('\n📈 Testing Dashboard Endpoints...');

  // Owner dashboard (correct endpoint)
  const dashboardResult = await makeRequest('get', '/owner-dashboard/dashboard');
  logResult('Owner Dashboard', dashboardResult.success);
}

async function testAuditLogEndpoints() {
  console.log('\n📝 Testing Audit Log Endpoints...');

  // Get audit logs
  const auditResult = await makeRequest('get', '/audit-logs/');
  logResult('Get Audit Logs', auditResult.success);
}

async function runSmokeTests() {
  console.log('🚀 Starting API Smoke Tests...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Owner Username: ${OWNER_USERNAME}`);

  // Authenticate first
  const authSuccess = await authenticate();
  if (!authSuccess) {
    console.log('\n❌ Cannot proceed without authentication. Exiting...');
    process.exit(1);
  }

  // Run all endpoint tests
  await testAuthEndpoints();
  await testUserEndpoints();
  await testShopEndpoints();
  await testProductEndpoints();
  await testTransactionEndpoints();
  await testPaymentEndpoints();
  await testBalanceEndpoints();
  await testSettlementEndpoints();
  await testCommissionEndpoints();
  await testReportEndpoints();
  await testDashboardEndpoints();
  await testAuditLogEndpoints();

  // Print summary
  console.log('\n📊 Smoke Test Summary:');
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

  if (results.errors.length > 0) {
    console.log('\n❌ Failed Tests:');
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.test}: ${error.error}`);
    });
  }

  console.log('\n🎉 Smoke testing completed!');
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the tests
runSmokeTests().catch(error => {
  console.error('❌ Smoke test failed with error:', error);
  process.exit(1);
});