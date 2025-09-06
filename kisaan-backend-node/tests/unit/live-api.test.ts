
import request from 'supertest';
import app from '../../src/app';
import { clearTestData } from '../testUtils';

describe('Plan and Category API - Live Data Test', () => {
  beforeAll(async () => {
    await clearTestData();
  });

  afterAll(async () => {
    await clearTestData();
  });
  describe('Plan Endpoints with Real Data', () => {
    test('GET /api/plans - Should return all plans', async () => {
      const response = await request(app)
        .get('/api/plans')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      // Check first plan structure
      const firstPlan = response.body.data[0];
      expect(firstPlan).toHaveProperty('id');
      expect(firstPlan).toHaveProperty('name');
      expect(firstPlan).toHaveProperty('price');
      expect(firstPlan).toHaveProperty('billing_cycle');
    });

    test('GET /api/plans/active - Should return only active plans', async () => {
      const response = await request(app)
        .get('/api/plans/active')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // All plans should be active
      response.body.data.forEach((plan: any) => {
        expect(plan.is_active).toBe(true);
      });
    });

    test('GET /api/plans/:id - Should return specific plan', async () => {
      const response = await request(app)
        .get('/api/plans/1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', 1);
      expect(response.body.data).toHaveProperty('name', 'Basic Plan');
    });

    test('POST /api/plans - Should create new plan', async () => {
      const newPlan = {
        name: 'Test Plan',
        description: 'A plan for testing',
        max_users: 10,
        max_products: 500,
        max_transactions: 5000,
        price: 49.99,
        billing_cycle: 'monthly',
        features: JSON.stringify(['Test feature 1', 'Test feature 2']),
        is_active: true
      };

      const response = await request(app)
        .post('/api/plans')
        .send(newPlan)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('name', 'Test Plan');
      expect(response.body.data).toHaveProperty('price', 49.99);
    });
  });

  describe('Category Endpoints with Real Data', () => {
    test('GET /api/categories - Should return all categories', async () => {
      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      // Check first category structure
      const firstCategory = response.body.data[0];
      expect(firstCategory).toHaveProperty('id');
      expect(firstCategory).toHaveProperty('name');
      expect(firstCategory).toHaveProperty('display_order');
    });

    test('GET /api/categories/active - Should return only active categories', async () => {
      const response = await request(app)
        .get('/api/categories/active')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // All categories should be active
      response.body.data.forEach((category: any) => {
        expect(category.is_active).toBe(true);
      });
    });

    test('GET /api/categories/:id - Should return specific category', async () => {
      const response = await request(app)
        .get('/api/categories/1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', 1);
      expect(response.body.data).toHaveProperty('name', 'Electronics');
    });

    test('POST /api/categories - Should create new category', async () => {
      const newCategory = {
        name: 'Test Category',
        description: 'A category for testing',
        display_order: 10,
        is_active: true
      };

      const response = await request(app)
        .post('/api/categories')
        .send(newCategory)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('name', 'Test Category');
      expect(response.body.data).toHaveProperty('display_order', 10);
    });
  });

  describe('Shop-Category Assignment Endpoints', () => {
    test('POST /api/shop-categories/assign - Should assign categories to shop', async () => {
      const assignment = {
        shop_id: 1, // Assuming shop with ID 1 exists
        category_ids: [1, 2, 3] // Electronics, Clothing, Grocery
      };

      const response = await request(app)
        .post('/api/shop-categories/assign')
        .send(assignment)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(3);
    });

    test('GET /api/shop-categories/assignments - Should get all assignments', async () => {
      const response = await request(app)
        .get('/api/shop-categories/assignments')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/shop-categories/shop/:shopId - Should get categories for specific shop', async () => {
      const response = await request(app)
        .get('/api/shop-categories/shop/1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('DELETE /api/shop-categories/unassign - Should unassign category from shop', async () => {
      const unassignment = {
        shop_id: 1,
        category_id: 3 // Unassign Grocery category
      };

      const response = await request(app)
        .delete('/api/shop-categories/unassign')
        .send(unassignment)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Complete Business Flow Test', () => {
    test('Create plan, assign to shop, create categories, assign to shop', async () => {
      // 1. Create a new plan
      const planResponse = await request(app)
        .post('/api/plans')
        .send({
          name: 'Flow Test Plan',
          description: 'Plan for testing complete flow',
          max_users: 15,
          max_products: 750,
          max_transactions: 7500,
          price: 69.99,
          billing_cycle: 'monthly',
          features: JSON.stringify(['Flow test feature']),
          is_active: true
        })
        .expect(201);

      const planId = planResponse.body.data.id;
      expect(planId).toBeDefined();

      // 2. Create a new category
      const categoryResponse = await request(app)
        .post('/api/categories')
        .send({
          name: 'Flow Test Category',
          description: 'Category for testing complete flow',
          display_order: 99,
          is_active: true
        })
        .expect(201);

      const categoryId = categoryResponse.body.data.id;
      expect(categoryId).toBeDefined();

      // 3. Assign category to shop
      const assignmentResponse = await request(app)
        .post('/api/shop-categories/assign')
        .send({
          shop_id: 1,
          category_ids: [categoryId]
        })
        .expect(201);

      expect(assignmentResponse.body.data).toHaveLength(1);
      expect(assignmentResponse.body.data[0]).toHaveProperty('category_id', categoryId);

      // 4. Verify the assignment exists
      const verifyResponse = await request(app)
        .get('/api/shop-categories/shop/1')
        .expect(200);

      const hasAssignment = verifyResponse.body.data.some(
        (assignment: any) => assignment.category_id === categoryId
      );
      expect(hasAssignment).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('GET /api/plans/999 - Should handle non-existent plan', async () => {
      const response = await request(app)
        .get('/api/plans/999')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Plan not found');
    });

    test('POST /api/plans - Should validate required fields', async () => {
      const response = await request(app)
        .post('/api/plans')
        .send({}) // Empty data
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
      expect(response.body).toHaveProperty('details');
    });

    test('POST /api/shop-categories/assign - Should validate shop and category existence', async () => {
      const response = await request(app)
        .post('/api/shop-categories/assign')
        .send({
          shop_id: 999, // Non-existent shop
          category_ids: [1]
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});
