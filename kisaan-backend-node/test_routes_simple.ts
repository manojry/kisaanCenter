
import axios from 'axios';

const API_BASE = 'http://localhost:3000';

async function testRoutes() {
  console.log('🔍 Testing KisaanCenter API Routes');
  console.log('='.repeat(50));

  // Test health endpoint
  try {
    const response = await axios.get(`${API_BASE}/health`);
    console.log('✅ Health check:', response.data);
  } catch (error: any) {
    console.log('❌ Health check failed:', error.message);
    return;
  }

  // Test API test endpoint
  try {
    const response = await axios.get(`${API_BASE}/api/test`);
    console.log('✅ API test:', response.data);
  } catch (error: any) {
    console.log('❌ API test failed:', error.message);
  }

  // Test shop routes
  console.log('\n📋 Testing Shop Routes:');
  
  // Get all shops
  try {
    const response = await axios.get(`${API_BASE}/api/shops`);
    console.log('✅ GET /api/shops:', `Found ${response.data.shops?.length || 0} shops`);
  } catch (error: any) {
    console.log('❌ GET /api/shops failed:', error.response?.data?.error || error.message);
  }

  // Create a shop
  try {
    const shopData = {
      name: 'Test Shop Route',
      owner_id: 'TEST123',
      address: 'Test Address',
      contact: '1234567890'
    };
    
    const response = await axios.post(`${API_BASE}/api/shops`, shopData);
    console.log('✅ POST /api/shops:', response.data.message);
    
    const shopId = response.data.shop?.id;
    if (shopId) {
      // Test get by ID
      try {
        const getResponse = await axios.get(`${API_BASE}/api/shops/${shopId}`);
        console.log('✅ GET /api/shops/:id:', getResponse.data.shop.name);
      } catch (error: any) {
        console.log('❌ GET /api/shops/:id failed:', error.response?.data?.error || error.message);
      }

      // Test update
      try {
        const updateResponse = await axios.put(`${API_BASE}/api/shops/${shopId}`, {
          address: 'Updated Address'
        });
        console.log('✅ PUT /api/shops/:id:', updateResponse.data.message);
      } catch (error: any) {
        console.log('❌ PUT /api/shops/:id failed:', error.response?.data?.error || error.message);
      }

      // Test delete
      try {
        const deleteResponse = await axios.delete(`${API_BASE}/api/shops/${shopId}`);
        console.log('✅ DELETE /api/shops/:id:', deleteResponse.data.message);
      } catch (error: any) {
        console.log('❌ DELETE /api/shops/:id failed:', error.response?.data?.error || error.message);
      }
    }
  } catch (error: any) {
    console.log('❌ POST /api/shops failed:', error.response?.data?.error || error.message);
    console.log('Status:', error.response?.status);
    console.log('Available routes:', error.response?.data?.availableRoutes);
  }

  console.log('\n🎉 Route testing completed!');
}

if (require.main === module) {
  testRoutes().catch(console.error);
}
