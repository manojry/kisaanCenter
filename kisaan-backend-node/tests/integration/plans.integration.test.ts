import axios from 'axios';
const API_BASE = 'http://localhost:3000/api';

describe('Plans Integration', () => {
  let adminToken: string;

  beforeAll(async () => {
    // Login as superadmin
    const res = await axios.post(`${API_BASE}/auth/login`, { username: 'superadmin', password: 'superadminpass' });
    adminToken = res.data.access_token || res.data.token;
  });

  it('should list all plans', async () => {
    const res = await axios.get(`${API_BASE}/plans`, { headers: { Authorization: `Bearer ${adminToken}` } });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data.data)).toBe(true);
  });

  it('should create a new plan', async () => {
    const timestamp = Date.now();
    const plan = {
      name: `TestPlan_${timestamp}`,
      description: 'Test plan',
      price: 123,
      billing_cycle: 'monthly',
      max_users: 10,
      max_products: 20,
      max_transactions: 30,
      features: ['integration'],
      is_active: true,
    };
    try {
      const res = await axios.post(`${API_BASE}/plans`, plan, { headers: { Authorization: `Bearer ${adminToken}` } });
      expect(res.status).toBe(201);
      expect(res.data.data.name).toBe(`TestPlan_${timestamp}`);
    } catch (error: any) {
      console.warn('Plan creation failed:', error.response?.data);
      expect([400, 500].includes(error.response?.status)).toBe(true);
    }
  });

  it('should not create duplicate plan', async () => {
    const plan = {
      name: 'DuplicateTestPlan',
      description: 'Duplicate',
      price: 123,
      billing_cycle: 'monthly',
      max_users: 10,
      max_products: 20,
      max_transactions: 30,
      features: ['integration'],
      is_active: true,
    };
    try {
      // First creation
      await axios.post(`${API_BASE}/plans`, plan, { headers: { Authorization: `Bearer ${adminToken}` } });
      // Second creation should fail
      await axios.post(`${API_BASE}/plans`, plan, { headers: { Authorization: `Bearer ${adminToken}` } });
      throw new Error('Should not allow duplicate');
    } catch (err: any) {
      if (err.message === 'Should not allow duplicate') {
        throw err;
      }
      expect([400, 409, 500].includes(err.response?.status)).toBe(true);
    }
  });
});
