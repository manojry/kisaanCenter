import axios from 'axios';
const API_BASE = 'http://localhost:3000/api/v1';

describe('Categories Integration', () => {
  let adminToken: string;

  beforeAll(async () => {
    const res = await axios.post(`${API_BASE}/auth/login`, { username: 'superadmin', password: 'superadminpass' });
    adminToken = res.data.token;
  });

  it('should list all categories', async () => {
    const res = await axios.get(`${API_BASE}/categories`, { headers: { Authorization: `Bearer ${adminToken}` } });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data.data)).toBe(true);
  });

  it('should create a new category', async () => {
    const category = { name: 'IntegrationTestCategory', description: 'Test category', status: 'active' };
    const res = await axios.post(`${API_BASE}/categories`, category, { headers: { Authorization: `Bearer ${adminToken}` } });
    expect(res.status).toBe(201);
    expect(res.data.data.name).toBe('IntegrationTestCategory');
  });

  it('should not create duplicate category', async () => {
    const category = { name: 'IntegrationTestCategory', description: 'Duplicate', status: 'active' };
    try {
      await axios.post(`${API_BASE}/categories`, category, { headers: { Authorization: `Bearer ${adminToken}` } });
      throw new Error('Should not allow duplicate');
    } catch (err: any) {
      expect(err.response.status).toBe(400);
    }
  });
});
