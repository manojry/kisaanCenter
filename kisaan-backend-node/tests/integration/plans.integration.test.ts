import axios from 'axios';
const API_BASE = 'http://localhost:3000/api';

describe('Plans Integration', () => {
  let adminToken: string;

  beforeAll(async () => {
    // Login as superadmin
    const res = await axios.post(`${API_BASE}/auth/login`, { username: 'superadmin', password: 'superadminpass' });
    adminToken = res.data.token;
  });

  it('should list all plans', async () => {
    const res = await axios.get(`${API_BASE}/plans`, { headers: { Authorization: `Bearer ${adminToken}` } });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data.data)).toBe(true);
  });

  it('should create a new plan', async () => {
    const plan = {
      name: 'IntegrationTestPlan',
      description: 'Test plan',
      monthly_price: 123,
      quarterly_price: 350,
      yearly_price: 1200,
      max_farmers: 10,
      max_buyers: 20,
      max_transactions: 30,
      data_retention_months: 12,
      features: ['integration'],
      status: 'active',
    };
    const res = await axios.post(`${API_BASE}/plans`, plan, { headers: { Authorization: `Bearer ${adminToken}` } });
    expect(res.status).toBe(201);
    expect(res.data.data.name).toBe('IntegrationTestPlan');
  });

  it('should not create duplicate plan', async () => {
    const plan = {
      name: 'IntegrationTestPlan',
      description: 'Duplicate',
      monthly_price: 123,
      quarterly_price: 350,
      yearly_price: 1200,
      max_farmers: 10,
      max_buyers: 20,
      max_transactions: 30,
      data_retention_months: 12,
      features: ['integration'],
      status: 'active',
    };
    try {
      await axios.post(`${API_BASE}/plans`, plan, { headers: { Authorization: `Bearer ${adminToken}` } });
      throw new Error('Should not allow duplicate');
    } catch (err: any) {
      expect(err.response.status).toBe(400);
    }
  });
});
