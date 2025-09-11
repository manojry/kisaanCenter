import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

describe('Missing Features Integration Tests', () => {
  let superadminToken: string;
  let planId: number;
  let categoryId: number;

  beforeAll(async () => {
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      username: 'superadmin',
      password: 'superadminpass'
    });
    superadminToken = loginResponse.data.access_token || loginResponse.data.token;
    
    // Get valid category ID
    const categoriesRes = await axios.get(`${API_BASE}/categories`);
    categoryId = categoriesRes.data.data?.[0]?.id || 1;
  });

  describe('Plans Management', () => {
    it('should get all plans', async () => {
      const response = await axios.get(`${API_BASE}/plans`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.data)).toBe(true);
    });
  });

  describe('Category Management', () => {
    it('should get all categories', async () => {
      const response = await axios.get(`${API_BASE}/categories`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should search categories', async () => {
      const response = await axios.get(`${API_BASE}/categories/search?q=Test`);
      expect(response.status).toBe(200);
    });
  });

  describe('Product Management', () => {
    it('should get all products', async () => {
      const response = await axios.get(`${API_BASE}/products`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should get products test endpoint', async () => {
      const response = await axios.get(`${API_BASE}/products/test`);
      expect(response.status).toBe(200);
    });
  });

  describe('Balance Management', () => {
    it('should get user balance', async () => {
      const response = await axios.get(`${API_BASE}/balance/user/1`, {
        headers: { Authorization: `Bearer ${superadminToken}` }
      });
      expect(response.status).toBe(200);
    });
  });

  describe('Commission Management', () => {
    it('should get all commissions', async () => {
      const response = await axios.get(`${API_BASE}/commissions`);
      expect(response.status).toBe(200);
    });

    it('should calculate commission', async () => {
      const response = await axios.post(`${API_BASE}/commissions/calculate`, {
        shop_id: 1,
        amount: 1000
      });
      expect(response.status).toBe(200);
    });
  });
});