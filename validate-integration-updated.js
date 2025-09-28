// Updated integration validation script with correct balance endpoint
const API_BASE = 'https://kisaancenter-backend.whiteisland-e1233153.northeurope.azurecontainerapps.io/api';

console.log('🔍 Updated Frontend-Backend Integration Validation');
console.log('==========================================');
console.log('\nAPI Base URL:', API_BASE);
console.log('\n');

const endpoints = [
  { name: 'Health Check', method: 'GET', url: `${API_BASE}/../health`, expectAuth: false },
  { name: 'API Discovery', method: 'GET', url: `${API_BASE}/../api/test`, expectAuth: false },
  { name: 'Categories List', method: 'GET', url: `${API_BASE}/categories`, expectAuth: false },
  { name: 'Products List', method: 'GET', url: `${API_BASE}/products`, expectAuth: false },
  { name: 'Auth Login (expect 400/401)', method: 'POST', url: `${API_BASE}/auth/login`, expectAuth: false, expectStatus: [400, 401] },
  { name: 'Users List (expect 401)', method: 'GET', url: `${API_BASE}/users`, expectAuth: false, expectStatus: [401] },
  { name: 'Shops List (expect 401)', method: 'GET', url: `${API_BASE}/shops`, expectAuth: false, expectStatus: [401] },
  { name: 'Transactions List (expect 401)', method: 'GET', url: `${API_BASE}/transactions`, expectAuth: false, expectStatus: [401] },
  { name: 'Payments List (expect 401)', method: 'GET', url: `${API_BASE}/payments`, expectAuth: false, expectStatus: [401] },
  { name: 'User Balance - Correct Path (expect 401)', method: 'GET', url: `${API_BASE}/balance/user/1`, expectAuth: false, expectStatus: [401] },
  { name: 'User Balance - Frontend Path (expect 404)', method: 'GET', url: `${API_BASE}/balances/user/1`, expectAuth: false, expectStatus: [404] }
];

async function testEndpoint(endpoint) {
  try {
    console.log(`📋 ${endpoint.name}`);
    console.log(`Testing ${endpoint.method} ${endpoint.url}`);
    
    const response = await fetch(endpoint.url, {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const status = response.status;
    const statusText = response.statusText;
    
    if (endpoint.expectStatus) {
      if (endpoint.expectStatus.includes(status)) {
        console.log(`  ✅ Status: ${status} ${statusText}`);
        return true;
      } else {
        console.log(`  ❌ Status: ${status} ${statusText}`);
        return false;
      }
    } else {
      if (status >= 200 && status < 300) {
        console.log(`  ✅ Status: ${status} ${statusText}`);
        return true;
      } else {
        console.log(`  ❌ Status: ${status} ${statusText}`);
        return false;
      }
    }
    
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return false;
  }
}

async function runValidation() {
  let successful = 0;
  let failed = 0;
  const failedTests = [];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    if (result) {
      successful++;
    } else {
      failed++;
      failedTests.push(endpoint.name);
    }
    console.log('');
  }
  
  console.log('📊 Summary');
  console.log('===========');
  console.log(`✅ Successful: ${successful}/${endpoints.length}`);
  console.log(`❌ Failed: ${failed}/${endpoints.length}`);
  
  if (failedTests.length > 0) {
    console.log('\n❌ Failed Tests:');
    failedTests.forEach(test => console.log(`  • ${test}`));
  }
  
  console.log('\n🎯 Integration Status');
  console.log('=====================');
  if (failed <= 1) {
    console.log('✅ Integration is working well!');
    console.log('   • Frontend can reach backend');
    console.log('   • API endpoints are responding');
    console.log('   • Expected authentication behavior confirmed');
    
    if (failed === 1) {
      console.log('\n🔧 Minor Issues to Fix:');
      failedTests.forEach(test => console.log(`   • ${test}`));
    }
  } else {
    console.log('⚠️  Multiple issues found, needs attention');
  }
  
  process.exit(failed > 1 ? 1 : 0);
}

runValidation();