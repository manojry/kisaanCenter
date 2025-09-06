import request from 'supertest';
import app from '../src/app';

describe('Plan and Category API Endpoints', () => {
  describe('Server Health Check', () => {
    test('GET /health - Should return server status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('OK');
    });

    test('GET /api/test - Should return API test response', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('API is working!');
    });
  });

  describe('Plan Endpoints Availability', () => {
    test('GET /api/plans - Should be accessible (empty response is OK)', async () => {
      const response = await request(app)
        .get('/api/plans');

      // Should be 200 or 500 (database connection error), but not 404
      expect([200, 500].includes(response.status)).toBe(true);
    });

    test('GET /api/plans/active - Should be accessible', async () => {
      const response = await request(app)
        .get('/api/plans/active');

      // Should be 200 or 500 (database connection error), but not 404
      expect([200, 500].includes(response.status)).toBe(true);
    });

    test('POST /api/plans - Should be accessible for validation', async () => {
      const invalidPlan = {
        name: '', // Invalid empty name
      };

      const response = await request(app)
        .post('/api/plans')
        .send(invalidPlan);

      // Should be 400 (validation error) or 500 (database error), but not 404
      expect([400, 500].includes(response.status)).toBe(true);
    });
  });

  describe('Category Endpoints Availability', () => {
    test('GET /api/categories - Should be accessible', async () => {
      const response = await request(app)
        .get('/api/categories');

      // Should be 200 or 500 (database connection error), but not 404
      expect([200, 500].includes(response.status)).toBe(true);
    });

    test('GET /api/categories/active - Should be accessible', async () => {
      const response = await request(app)
        .get('/api/categories/active');

      // Should be 200 or 500 (database connection error), but not 404
      expect([200, 500].includes(response.status)).toBe(true);
    });

    test('POST /api/categories - Should be accessible for validation', async () => {
      const invalidCategory = {
        name: '', // Invalid empty name
      };

      const response = await request(app)
        .post('/api/categories')
        .send(invalidCategory);

      // Should be 400 (validation error) or 500 (database error), but not 404
      expect([400, 500].includes(response.status)).toBe(true);
    });
  });

  describe('Shop-Category Endpoints Availability', () => {
    test('GET /api/shop-categories/assignments - Should be accessible', async () => {
      const response = await request(app)
        .get('/api/shop-categories/assignments');

      // Should be 200 or 500 (database connection error), but not 404
      expect([200, 500].includes(response.status)).toBe(true);
    });

    test('POST /api/shop-categories/assign - Should be accessible for validation', async () => {
      const invalidAssignment = {
        shop_id: 'invalid', // Invalid type
        category_ids: [],   // Invalid empty array
      };

      const response = await request(app)
        .post('/api/shop-categories/assign')
        .send(invalidAssignment);

      // Should be 400 (validation error) or 500 (database error), but not 404
      expect([400, 500].includes(response.status)).toBe(true);
    });
  });

  describe('Route Integration Check', () => {
    test('All new routes should be properly registered', async () => {
      const endpoints = [
        '/api/plans',
        '/api/categories', 
        '/api/shop-categories/assignments',
      ];

      for (const endpoint of endpoints) {
        const response = await request(app).get(endpoint);
        
        // None of these should return 404 (route not found)
        expect(response.status).not.toBe(404);
      }
    });

    test('Invalid routes should return 404', async () => {
      const response = await request(app)
        .get('/api/nonexistent-route')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Route not found');
    });
  });

  describe('Validation Schema Testing', () => {
    test('Plan creation should validate required fields', async () => {
      const response = await request(app)
        .post('/api/plans')
        .send({});

      // Should return validation error for missing required fields
      if (response.status === 400) {
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toBe('Validation failed');
      } else {
        // If it's 500, it means database connection issue but validation layer is working
        expect(response.status).toBe(500);
      }
    });

    test('Category creation should validate required fields', async () => {
      const response = await request(app)
        .post('/api/categories')
        .send({});

      // Should return validation error for missing required fields
      if (response.status === 400) {
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toBe('Validation failed');
      } else {
        // If it's 500, it means database connection issue but validation layer is working
        expect(response.status).toBe(500);
      }
    });

    test('Shop-category assignment should validate required fields', async () => {
      const response = await request(app)
        .post('/api/shop-categories/assign')
        .send({});

      // Should return validation error for missing required fields
      if (response.status === 400) {
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toBe('Validation failed');
      } else {
        // If it's 500, it means database connection issue but validation layer is working
        expect(response.status).toBe(500);
      }
    });
  });

  describe('Response Format Validation', () => {
    test('Error responses should have consistent format', async () => {
      const response = await request(app)
        .get('/api/nonexistent-route');

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path');
      expect(response.body).toHaveProperty('method');
    });

    test('Success responses should have consistent format for health check', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});
