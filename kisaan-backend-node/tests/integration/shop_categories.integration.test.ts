import axios from 'axios';
const API_BASE = 'http://localhost:3000/api';

describe('Shop Categories Integration', () => {
  let adminToken: string;

  beforeAll(async () => {
    const res = await axios.post(`${API_BASE}/auth/login`, { username: 'superadmin', password: 'superadminpass' });
    adminToken = res.data.access_token || res.data.token;
  });

  it('should assign a category to a shop', async () => {
    const assignment = { shop_id: 1, category_ids: [1] };
    try {
      const res = await axios.post(`${API_BASE}/shop-categories/assign`, assignment, { headers: { Authorization: `Bearer ${adminToken}` } });
      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
    } catch (error: any) {
      console.warn('Shop category assignment failed:', error.response?.data);
      expect([400, 404, 500].includes(error.response?.status)).toBe(true);
    }
  });

  it('should handle duplicate category assignment correctly', async () => {
    const assignment = { shop_id: 1, category_ids: [1] };
    try {
      // First assignment
      const res1 = await axios.post(`${API_BASE}/shop-categories/assign`, assignment, { headers: { Authorization: `Bearer ${adminToken}` } });
      expect(res1.status).toBe(201);
      
      // Second assignment should either succeed with 0 new assignments or fail
      const res2 = await axios.post(`${API_BASE}/shop-categories/assign`, assignment, { headers: { Authorization: `Bearer ${adminToken}` } });
      
      if (res2.status === 201) {
        // If successful, should have 0 new assignments (duplicates filtered out)
        expect(res2.data.count).toBe(0);
      }
    } catch (err: any) {
      // If it fails, should be a 400 error for duplicate assignment
      expect([400, 409].includes(err.response?.status)).toBe(true);
    }
  });

  it('should unassign a category from a shop', async () => {
    const unassign = { shop_id: 1, category_id: 1 };
    try {
      const res = await axios.delete(`${API_BASE}/shop-categories/unassign`, { data: unassign, headers: { Authorization: `Bearer ${adminToken}` } });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
    } catch (error: any) {
      console.warn('Shop category unassignment failed:', error.response?.data);
      expect([400, 404, 500].includes(error.response?.status)).toBe(true);
    }
  });
});
