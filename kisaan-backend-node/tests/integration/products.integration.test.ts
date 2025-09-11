import axios from 'axios';
const API_BASE = 'http://localhost:3000/api';

describe('Products Integration', () => {
  let adminToken: string;
  let validCategoryId: number;

  beforeAll(async () => {
    const res = await axios.post(`${API_BASE}/auth/login`, { username: 'superadmin', password: 'superadminpass' });
    adminToken = res.data.access_token || res.data.token;
    
    // Get a valid category ID
    try {
      const categoriesRes = await axios.get(`${API_BASE}/categories`);
      if (categoriesRes.data.data && categoriesRes.data.data.length > 0) {
        validCategoryId = categoriesRes.data.data[0].id;
      } else {
        validCategoryId = 1; // fallback
      }
    } catch (err) {
      validCategoryId = 1; // fallback
    }
  });

  it('should list all products', async () => {
    const res = await axios.get(`${API_BASE}/products`, { headers: { Authorization: `Bearer ${adminToken}` } });
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(Array.isArray(res.data.data)).toBe(true);
  });

  it('should create a new product', async () => {
    const timestamp = Date.now();
    const product = { name: `TestProduct_${timestamp}`, description: 'Test product', category_id: validCategoryId, price: 99, record_status: 'active' };
    const res = await axios.post(`${API_BASE}/products`, product, { headers: { Authorization: `Bearer ${adminToken}` } });
    expect(res.status).toBe(201);
    expect(res.data.success).toBe(true);
    expect(res.data.data.name).toBe(`TestProduct_${timestamp}`);
  });

  it('should not create duplicate product', async () => {
    const product = { name: 'DuplicateTestProduct', description: 'Duplicate', category_id: 1, price: 99, shop_id: 1, record_status: 'active' };
    try {
      // First creation
      await axios.post(`${API_BASE}/products`, product, { headers: { Authorization: `Bearer ${adminToken}` } });
      // Second creation should fail
      await axios.post(`${API_BASE}/products`, product, { headers: { Authorization: `Bearer ${adminToken}` } });
      throw new Error('Should not allow duplicate');
    } catch (err: any) {
      if (err.message === 'Should not allow duplicate') {
        throw err;
      }
      expect([400, 409, 500].includes(err.response?.status)).toBe(true);
    }
  });
});
