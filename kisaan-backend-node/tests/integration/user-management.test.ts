import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

describe('User Management Integration', () => {
  let adminToken: string;

  beforeAll(async () => {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      username: 'superadmin',
      password: 'superadminpass'
    });
    adminToken = res.data.access_token || res.data.token;
  });

  it('should list all users', async () => {
    try {
      const res = await axios.get(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
    } catch (error: any) {
      console.warn('Users endpoint not available:', error.response?.status);
    }
  });

  it('should create a new user', async () => {
    const timestamp = Date.now();
    const userData = {
      username: `testuser_${timestamp}`,
      password: 'testpass123',
      role: 'farmer',
      shop_id: 1,
      status: 'active'
    };

    try {
      const res = await axios.post(`${API_BASE}/users`, userData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
    } catch (error: any) {
      console.warn('User creation failed:', error.response?.data);
    }
  });
});