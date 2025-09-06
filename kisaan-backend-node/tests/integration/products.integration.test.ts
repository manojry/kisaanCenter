import axios from 'axios';
const API_BASE = 'http://localhost:3000/api/v1';

describe('Products Integration', () => {
  let adminToken: string;

  beforeAll(async () => {
    const res = await axios.post(`${API_BASE}/auth/login`, { username: 'superadmin', password: 'superadminpass' });
    adminToken = res.data.token;
  });

  it('should list all products', async () => {
    const res = await axios.get(`${API_BASE}/products`, { headers: { Authorization: `Bearer ${adminToken}` } });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data.data)).toBe(true);
  });

  it('should create a new product', async () => {
    const product = { name: 'IntegrationTestProduct', description: 'Test product', category_id: 1, price: 99, shop_id: 1, record_status: 'active' };
    const res = await axios.post(`${API_BASE}/products`, product, { headers: { Authorization: `Bearer ${adminToken}` } });
    expect(res.status).toBe(201);
    expect(res.data.data.name).toBe('IntegrationTestProduct');
  });

  it('should not create duplicate product', async () => {
    const product = { name: 'IntegrationTestProduct', description: 'Duplicate', category_id: 1, price: 99, shop_id: 1, record_status: 'active' };
    try {
      await axios.post(`${API_BASE}/products`, product, { headers: { Authorization: `Bearer ${adminToken}` } });
      throw new Error('Should not allow duplicate');
    } catch (err: any) {
      expect(err.response.status).toBe(400);
    }
  });
});
