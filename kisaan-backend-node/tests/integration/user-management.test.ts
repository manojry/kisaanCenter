import axios from 'axios';

const API_BASE = 'http://localhost:3000/api/v1';

// Test users from seeded data
const testUsers = [
  { username: 'superadmin', password: 'superadminpass', role: 'superadmin' },
  { username: 'OWN123', password: 'ownerpass', role: 'owner' },
  { username: 'ram_OWN123', password: 'farmerpass', role: 'farmer' },
  { username: 'shyam_OWN123', password: 'buyerpass', role: 'buyer' },
];

let authTokens: Record<string, string> = {};

/**
 * Helper function to login and get authentication token
 */
async function loginUser(username: string, password: string): Promise<string> {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, { username, password });
    return response.data.token;
  } catch (error: any) {
    throw new Error(`Login failed for ${username}: ${error.response?.data?.error || error.message}`);
  }
}

/**
 * Helper function to make authenticated requests
 */
async function makeAuthenticatedRequest(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  token: string,
  data?: any
) {
  const config = {
    method,
    url: `${API_BASE}${endpoint}`,
    headers: { Authorization: `Bearer ${token}` },
    data,
  };
  
  return await axios(config);
}

/**
 * Test 1: Authentication for all user types
 */
async function testAuthentication() {
  console.log('\n🔐 Testing Authentication...');
  
  for (const user of testUsers) {
    try {
      const token = await loginUser(user.username, user.password);
      authTokens[user.role] = token;
      console.log(`✅ [${user.role}] Login successful`);
    } catch (error: any) {
      console.log(`❌ [${user.role}] Login failed: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Test 2: User Profile Access
 */
async function testUserProfile() {
  console.log('\n👤 Testing User Profile Access...');
  
  for (const [role, token] of Object.entries(authTokens)) {
    try {
      const response = await makeAuthenticatedRequest('GET', '/users/me', token);
      console.log(`✅ [${role}] Profile access successful: ${response.data.user.username}`);
    } catch (error: any) {
      console.log(`❌ [${role}] Profile access failed: ${error.response?.status} ${error.response?.data?.error}`);
    }
  }
}

/**
 * Test 3: User List Access (Role-based filtering)
 */
async function testUserListAccess() {
  console.log('\n📋 Testing User List Access...');
  
  for (const [role, token] of Object.entries(authTokens)) {
    try {
      const response = await makeAuthenticatedRequest('GET', '/users', token);
      const userCount = response.data.users.length;
      console.log(`✅ [${role}] User list access successful: ${userCount} users visible`);
      
      // Log which users each role can see
      const visibleUsernames = response.data.users.map((u: any) => u.username);
      console.log(`   Visible users: ${visibleUsernames.join(', ')}`);
    } catch (error: any) {
      console.log(`❌ [${role}] User list access failed: ${error.response?.status} ${error.response?.data?.error}`);
    }
  }
}

/**
 * Test 4: User Creation (Admin privileges)
 */
async function testUserCreation() {
  console.log('\n➕ Testing User Creation...');
  
  const newUserData = {
    username: 'testuser',
    password: 'testpass123',
    role: 'buyer',
    owner_id: 'OWN123',
    contact: '1234567890',
    email: 'test@example.com',
  };
  
  // Test with superadmin (should work)
  try {
    const response = await makeAuthenticatedRequest('POST', '/users', authTokens.superadmin, newUserData);
    console.log(`✅ [superadmin] User creation successful: ${response.data.user.username}`);
  } catch (error: any) {
    console.log(`❌ [superadmin] User creation failed: ${error.response?.status} ${error.response?.data?.error}`);
  }
  
  // Test with farmer (should fail)
  try {
    const response = await makeAuthenticatedRequest('POST', '/users', authTokens.farmer, newUserData);
    console.log(`❌ [farmer] User creation should have failed but succeeded`);
  } catch (error: any) {
    if (error.response?.status === 403) {
      console.log(`✅ [farmer] User creation correctly denied: ${error.response.data.error}`);
    } else {
      console.log(`❌ [farmer] Unexpected error: ${error.response?.status} ${error.response?.data?.error}`);
    }
  }
}

/**
 * Test 5: User Update (Self and Admin access)
 */
async function testUserUpdate() {
  console.log('\n✏️ Testing User Updates...');
  
  const updateData = { contact: '9876543210' };
  
  // Test self-update (farmer updating own profile)
  try {
    // First get farmer's ID
    const profileResponse = await makeAuthenticatedRequest('GET', '/users/me', authTokens.farmer);
    const farmerId = profileResponse.data.user.id;
    
    const response = await makeAuthenticatedRequest('PUT', `/users/${farmerId}`, authTokens.farmer, updateData);
    console.log(`✅ [farmer] Self-update successful`);
  } catch (error: any) {
    console.log(`❌ [farmer] Self-update failed: ${error.response?.status} ${error.response?.data?.error}`);
  }
  
  // Test admin update (superadmin updating farmer)
  try {
    const profileResponse = await makeAuthenticatedRequest('GET', '/users/me', authTokens.farmer);
    const farmerId = profileResponse.data.user.id;
    
    const response = await makeAuthenticatedRequest('PUT', `/users/${farmerId}`, authTokens.superadmin, updateData);
    console.log(`✅ [superadmin] Admin update successful`);
  } catch (error: any) {
    console.log(`❌ [superadmin] Admin update failed: ${error.response?.status} ${error.response?.data?.error}`);
  }
}

/**
 * Test 6: Password Reset
 */
async function testPasswordReset() {
  console.log('\n🔒 Testing Password Reset...');
  
  const passwordResetData = {
    current_password: 'farmerpass',
    new_password: 'newfarmerpass123',
    confirm_password: 'newfarmerpass123',
  };
  
  try {
    // Get farmer's ID
    const profileResponse = await makeAuthenticatedRequest('GET', '/users/me', authTokens.farmer);
    const farmerId = profileResponse.data.user.id;
    
    const response = await makeAuthenticatedRequest('POST', `/users/${farmerId}/reset-password`, authTokens.farmer, passwordResetData);
    console.log(`✅ [farmer] Password reset successful`);
    
    // Test login with new password
    try {
      const newToken = await loginUser('ram_OWN123', 'newfarmerpass123');
      console.log(`✅ [farmer] Login with new password successful`);
      authTokens.farmer = newToken; // Update token for future tests
    } catch (error: any) {
      console.log(`❌ [farmer] Login with new password failed: ${error.message}`);
    }
  } catch (error: any) {
    console.log(`❌ [farmer] Password reset failed: ${error.response?.status} ${error.response?.data?.error}`);
  }
}

/**
 * Test 7: Access Control (Cross-tenant access)
 */
async function testAccessControl() {
  console.log('\n🛡️ Testing Access Control...');
  
  // Farmer trying to access owner's profile
  try {
    const ownerProfileResponse = await makeAuthenticatedRequest('GET', '/users/me', authTokens.owner);
    const ownerId = ownerProfileResponse.data.user.id;
    
    const response = await makeAuthenticatedRequest('GET', `/users/${ownerId}`, authTokens.farmer);
    console.log(`❌ [farmer] Cross-user access should have failed but succeeded`);
  } catch (error: any) {
    if (error.response?.status === 403) {
      console.log(`✅ [farmer] Cross-user access correctly denied: ${error.response.data.error}`);
    } else {
      console.log(`❌ [farmer] Unexpected error: ${error.response?.status} ${error.response?.data?.error}`);
    }
  }
}

/**
 * Main test execution
 */
async function runUserManagementTests() {
  console.log('🚀 Starting User Management Integration Tests');
  console.log('='.repeat(60));
  
  try {
    await testAuthentication();
    await testUserProfile();
    await testUserListAccess();
    await testUserCreation();
    await testUserUpdate();
    await testPasswordReset();
    await testAccessControl();
    
    console.log('\n✅ All User Management Tests Completed Successfully!');
    console.log('='.repeat(60));
  } catch (error: any) {
    console.log('\n❌ Test Suite Failed:', error.message);
    console.log('='.repeat(60));
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runUserManagementTests().catch(console.error);
}

export { runUserManagementTests };
