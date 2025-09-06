import axios from 'axios';

async function testProductsRoutes() {
  try {
    console.log('🧪 Testing products routes...');
    
    // Test the simple test route
    console.log('\n1. Testing GET /api/products/test...');
    try {
      const testRes = await axios.get('http://localhost:3000/api/products/test');
      console.log('✅ Test route working:', testRes.data);
    } catch (error: any) {
      console.log('❌ Test route failed:', error.response?.status, error.response?.data);
    }
    
    // Test login and get products
    console.log('\n2. Testing login and GET /api/products...');
    const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
      username: 'owner1',
      password: 'owner1pass'
    });
    
    if (loginRes.status === 200 && loginRes.data.token) {
      const token = loginRes.data.token;
      
      try {
        const productsRes = await axios.get('http://localhost:3000/api/products', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('✅ Products endpoint working:', productsRes.data);
      } catch (error: any) {
        console.log('❌ Products endpoint failed:', error.response?.status, error.response?.data);
      }
    }
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
  }
}

testProductsRoutes();
