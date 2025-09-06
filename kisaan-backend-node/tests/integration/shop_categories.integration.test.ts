import axios from 'axios';
const API_BASE = 'http://localhost:3000/api/v1';

describe('Shop Categories Integration', () => {
  let adminToken: string;

  beforeAll(async () => {
    const res = await axios.post(`${API_BASE}/auth/login`, { username: 'superadmin', password: 'superadminpass' });
    adminToken = res.data.token;
  });

  it('should assign a category to a shop', async () => {
    const assignment = { shop_id: 1, category_id: 1 };
    const res = await axios.post(`${API_BASE}/shop-categories/assign`, assignment, { headers: { Authorization: `Bearer ${adminToken}` } });
    expect(res.status).toBe(201);
    expect(res.data.success).toBe(true);
  });

  it('should not assign the same category twice', async () => {
    const assignment = { shop_id: 1, category_id: 1 };
    try {
      await axios.post(`${API_BASE}/shop-categories/assign`, assignment, { headers: { Authorization: `Bearer ${adminToken}` } });
      throw new Error('Should not allow duplicate assignment');
    } catch (err: any) {
      expect(err.response.status).toBe(400);
    }
  });

  it('should unassign a category from a shop', async () => {
    const unassign = { shop_id: 1, category_id: 1 };
    const res = await axios.delete(`${API_BASE}/shop-categories/unassign`, { data: unassign, headers: { Authorization: `Bearer ${adminToken}` } });
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
  });
});
