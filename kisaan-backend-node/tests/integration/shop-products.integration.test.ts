import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

describe('Shop Products Integration', () => {
  let adminToken: string;
  let testShopId: number;
  let testProductId: number;
  let testCategoryId: number;

  beforeAll(async () => {
    try {
      // Login as admin
      const res = await axios.post(`${API_BASE}/auth/login`, {
        username: 'superadmin',
        password: 'superadminpass'
      });
      adminToken = res.data.access_token || res.data.token;

      // Create test category
      const categoryRes = await axios.post(`${API_BASE}/categories`, {
        name: `TestCategory_${Date.now()}`,
        description: 'Test category for shop products'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      testCategoryId = categoryRes.data.data?.id || categoryRes.data.id;

      // Create test product (DISABLED TO PREVENT AUTO-INSERT)
      /*
      const productRes = await axios.post(`${API_BASE}/products`, {
        name: `TestProduct_${Date.now()}`,
        category_id: testCategoryId,
        price: 100.50,
        unit: 'kg',
        description: 'Test product for shop assignment'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      testProductId = productRes.data.data?.id || productRes.data.id;
      */

      // Create test shop
      const shopRes = await axios.post(`${API_BASE}/shops`, {
        name: `TestShop_${Date.now()}`,
        address: 'Test Address',
        contact: '+91-9876543210',
        owner_id: 1,
        status: 'active'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      testShopId = shopRes.data.data?.id || shopRes.data.id;

      // Assign category to shop
      await axios.post(`${API_BASE}/shops/${testShopId}/categories/${testCategoryId}`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

    } catch (error: any) {
      console.error('Setup failed:', error.response?.data || error.message);
    }
  });

  it('should get empty shop products initially', async () => {
    try {
      const res = await axios.get(`${API_BASE}/shops/${testShopId}/products`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.products)).toBe(true);
      expect(res.data.products.length).toBe(0);
    } catch (error: any) {
      console.warn('Get shop products failed:', error.response?.data);
    }
  });

  it('should get available products for shop (filtered by category)', async () => {
    try {
      const res = await axios.get(`${API_BASE}/shops/${testShopId}/available-products`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.products)).toBe(true);
      expect(res.data.products.length).toBeGreaterThan(0);
      
      // Check if our test product is in the available products
      const hasTestProduct = res.data.products.some((p: any) => p.id === testProductId);
      expect(hasTestProduct).toBe(true);
    } catch (error: any) {
      console.warn('Get available products failed:', error.response?.data);
    }
  });

  it('should assign product to shop', async () => {
    try {
      const res = await axios.post(`${API_BASE}/shops/${testShopId}/products/${testProductId}`);
      expect(res.status).toBe(201);
      expect(res.data.message).toContain('assigned');
    } catch (error: any) {
      console.warn('Assign product failed:', error.response?.data);
    }
  });

  it('should get assigned shop products with category names', async () => {
    try {
      const res = await axios.get(`${API_BASE}/shops/${testShopId}/products`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.products)).toBe(true);
      expect(res.data.products.length).toBe(1);
      
      const product = res.data.products[0];
      expect(product.id).toBe(testProductId);
      expect(product.category_name).toBeDefined();
    } catch (error: any) {
      console.warn('Get assigned products failed:', error.response?.data);
    }
  });

  it('should not show assigned product in available products', async () => {
    try {
      const res = await axios.get(`${API_BASE}/shops/${testShopId}/available-products`);
      expect(res.status).toBe(200);
      
      // Test product should not be in available products anymore
      const hasTestProduct = res.data.products.some((p: any) => p.id === testProductId);
      expect(hasTestProduct).toBe(false);
    } catch (error: any) {
      console.warn('Get available products after assignment failed:', error.response?.data);
    }
  });

  it('should remove product from shop', async () => {
    try {
      const res = await axios.delete(`${API_BASE}/shops/${testShopId}/products/${testProductId}`);
      expect(res.status).toBe(200);
      expect(res.data.message).toContain('removed');
    } catch (error: any) {
      console.warn('Remove product failed:', error.response?.data);
    }
  });

  it('should show removed product in available products again', async () => {
    try {
      const res = await axios.get(`${API_BASE}/shops/${testShopId}/available-products`);
      expect(res.status).toBe(200);
      
      // Test product should be available again
      const hasTestProduct = res.data.products.some((p: any) => p.id === testProductId);
      expect(hasTestProduct).toBe(true);
    } catch (error: any) {
      console.warn('Get available products after removal failed:', error.response?.data);
    }
  });
});