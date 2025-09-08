import axios from 'axios';
const API_BASE = 'http://localhost:3000/api';

describe('Credits Integration', () => {
  let adminToken: string;

  beforeAll(async () => {
    const res = await axios.post(`${API_BASE}/auth/login`, { username: 'superadmin', password: 'superadminpass' });
    adminToken = res.data.token;
  });

  it('should list all credits', async () => {
    const res = await axios.get(`${API_BASE}/credits`, { headers: { Authorization: `Bearer ${adminToken}` } });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data.data)).toBe(true);
  });

  it('should create a new credit', async () => {
    const credit = {
      user_id: 1,
      shop_id: 1,
      amount: 500.0,
      status: 'outstanding',
      record_status: 'active',
      address: 'Integration Test Address',
    };
    const res = await axios.post(`${API_BASE}/credits`, credit, { headers: { Authorization: `Bearer ${adminToken}` } });
    expect(res.status).toBe(201);
    expect(res.data.data.user_id).toBe(1);
  });

  it('should not create credit with invalid user', async () => {
    const credit = {
      user_id: 9999,
      shop_id: 1,
      amount: 500.0,
      status: 'outstanding',
      record_status: 'active',
      address: 'Integration Test Address',
    };
    try {
      await axios.post(`${API_BASE}/credits`, credit, { headers: { Authorization: `Bearer ${adminToken}` } });
      throw new Error('Should not allow invalid user');
    } catch (err: any) {
      expect(err.response.status).toBe(400);
    }
  });
});
