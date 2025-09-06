import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

async function testEndpoints() {
  console.log('🧪 Testing API Endpoints...\n');

  try {
    // Test login first
    console.log('1. Testing login...');
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      username: 'owner1',
      password: 'owner1pass'
    });
    
    if (loginRes.status === 200 && loginRes.data.token) {
      const token = loginRes.data.token;
      console.log('✅ Login successful');
      
      // Test products endpoint
      console.log('\n2. Testing GET /api/products...');
      try {
        const productsRes = await axios.get(`${API_BASE}/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('✅ Products endpoint working:', productsRes.data);
      } catch (error: any) {
        console.log('❌ Products endpoint failed:', error.response?.status, error.response?.data);
      }
      
      // Test shop details with users
      console.log('\n3. Testing GET /api/shops/1 (should include users)...');
      try {
        const shopRes = await axios.get(`${API_BASE}/shops/1`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('✅ Shop details:', shopRes.data);
        if (shopRes.data.shop && shopRes.data.shop.users) {
          console.log(`   Users count: ${shopRes.data.shop.users.length}`);
        } else {
          console.log('   ⚠️ No users property found in shop details');
        }
      } catch (error: any) {
        console.log('❌ Shop details failed:', error.response?.status, error.response?.data);
      }
      
      // Test shop products endpoint  
      console.log('\n4. Testing GET /api/shops/1/products...');
      try {
        const shopProductsRes = await axios.get(`${API_BASE}/shops/1/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('✅ Shop products endpoint working:', shopProductsRes.data);
      } catch (error: any) {
        console.log('❌ Shop products failed:', error.response?.status, error.response?.data);
      }
      
    } else {
      console.log('❌ Login failed');
    }
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
  }
}

testEndpoints();
