import request from 'supertest';
import app from '../src/app';
import { Plan, Category, Product, Shop, ShopCategory } from '../src/models';
import sequelize from '../src/config/database';

describe('Plan and Category Management Flow', () => {
  let createdPlan: any;
  let createdCategory: any;
  let createdProduct: any;
  let createdShop: any;

  beforeAll(async () => {
    // Ensure database connection and sync
    await sequelize.authenticate();
    await sequelize.sync({ force: false });
  });

  afterAll(async () => {
    // Clean up test data
    try {
      if (createdShop) {
        await ShopCategory.destroy({ where: { shop_id: createdShop.id } });
        await Shop.destroy({ where: { id: createdShop.id } });
      }
      if (createdProduct) {
        await Product.destroy({ where: { id: createdProduct.id } });
      }
      if (createdCategory) {
        await Category.destroy({ where: { id: createdCategory.id } });
      }
      if (createdPlan) {
        await Plan.destroy({ where: { id: createdPlan.id } });
      }
    } catch (error) {
      console.error('Error cleaning up test data:', error);
    }
    await sequelize.close();
  });

  describe('Plan Management', () => {
    test('POST /api/plans - Create a new plan', async () => {
      const planData = {
        name: 'Test Premium Plan',
        description: 'A test premium plan for shops',
        price: 99.99,
        billing_cycle: 'monthly',
        max_users: 10,
        max_products: 100,
        max_transactions: 1000,
        features: ['feature1', 'feature2', 'feature3'],
        is_active: true,
      };

      const response = await request(app)
        .post('/api/plans')
        .send(planData)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe(planData.name);
      expect(response.body.data.price).toBe(planData.price.toString());
      expect(response.body.data.billing_cycle).toBe(planData.billing_cycle);

      createdPlan = response.body.data;
    });

    test('GET /api/plans - Get all plans', async () => {
      const response = await request(app)
        .get('/api/plans')
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('GET /api/plans/:id - Get plan by ID', async () => {
      const response = await request(app)
        .get(`/api/plans/${createdPlan.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.id).toBe(createdPlan.id);
      expect(response.body.data.name).toBe(createdPlan.name);
    });

    test('PUT /api/plans/:id - Update plan', async () => {
      const updateData = {
        name: 'Updated Test Premium Plan',
        description: 'Updated description',
        price: 199.99,
      };

      const response = await request(app)
        .put(`/api/plans/${createdPlan.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe(updateData.description);
    });

    test('GET /api/plans/active - Get active plans', async () => {
      const response = await request(app)
        .get('/api/plans/active')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Category Management', () => {
    test('POST /api/categories - Create a new category', async () => {
      const categoryData = {
        name: 'Test Vegetables',
        description: 'Test category for vegetables',
        display_order: 1,
        is_active: true,
      };

      const response = await request(app)
        .post('/api/categories')
        .send(categoryData)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe(categoryData.name);
      expect(response.body.data.display_order).toBe(categoryData.display_order);

      createdCategory = response.body.data;
    });

    test('GET /api/categories - Get all categories', async () => {
      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('GET /api/categories/:id - Get category by ID', async () => {
      const response = await request(app)
        .get(`/api/categories/${createdCategory.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.id).toBe(createdCategory.id);
      expect(response.body.data.name).toBe(createdCategory.name);
    });

    test('PUT /api/categories/:id - Update category', async () => {
      const updateData = {
        name: 'Updated Test Vegetables',
        description: 'Updated description for vegetables',
        display_order: 2,
      };

      const response = await request(app)
        .put(`/api/categories/${createdCategory.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.display_order).toBe(updateData.display_order);
    });

    test('GET /api/categories/active - Get active categories', async () => {
      const response = await request(app)
        .get('/api/categories/active')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Shop Creation with Plan Assignment', () => {
    test('POST /api/shops - Create shop with plan assignment', async () => {
      const shopData = {
        name: 'Test Shop',
        owner_id: 'test_owner_123',
        plan_id: createdPlan.id,
        address: '123 Test Street',
        contact: '1234567890',
        status: 'active',
      };

      const response = await request(app)
        .post('/api/shops')
        .send(shopData)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('shop');
      expect(response.body.shop).toHaveProperty('id');
      expect(response.body.shop.name).toBe(shopData.name);
      expect(response.body.shop.plan_id).toBe(shopData.plan_id);

      createdShop = response.body.shop;
    });

    test('GET /api/shops/:id - Verify shop has plan assigned', async () => {
      const response = await request(app)
        .get(`/api/shops/${createdShop.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('shop');
      expect(response.body.shop.plan_id).toBe(createdPlan.id);
    });
  });

  describe('Shop-Category Assignment', () => {
    test('POST /api/shop-categories/assign - Assign categories to shop', async () => {
      const assignmentData = {
        shop_id: createdShop.id,
        category_ids: [createdCategory.id],
      };

      const response = await request(app)
        .post('/api/shop-categories/assign')
        .send(assignmentData)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('GET /api/shop-categories/shop/:shopId/categories - Get shop categories', async () => {
      const response = await request(app)
        .get(`/api/shop-categories/shop/${createdShop.id}/categories`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].id).toBe(createdCategory.id);
    });

    test('GET /api/shop-categories/category/:categoryId/shops - Get category shops', async () => {
      const response = await request(app)
        .get(`/api/shop-categories/category/${createdCategory.id}/shops`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].id).toBe(createdShop.id);
    });

    test('GET /api/shop-categories/check/:shopId/:categoryId - Check assignment', async () => {
      const response = await request(app)
        .get(`/api/shop-categories/check/${createdShop.id}/${createdCategory.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('is_assigned');
      expect(response.body.is_assigned).toBe(true);
    });

    test('GET /api/shop-categories/assignments - Get all assignments', async () => {
      const response = await request(app)
        .get('/api/shop-categories/assignments')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('POST /api/shop-categories/remove - Remove categories from shop', async () => {
      const removeData = {
        shop_id: createdShop.id,
        category_ids: [createdCategory.id],
      };

      const response = await request(app)
        .post('/api/shop-categories/remove')
        .send(removeData)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('removed_count');
      expect(response.body.removed_count).toBeGreaterThan(0);
    });

    test('GET /api/shop-categories/check/:shopId/:categoryId - Verify removal', async () => {
      const response = await request(app)
        .get(`/api/shop-categories/check/${createdShop.id}/${createdCategory.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('is_assigned');
      expect(response.body.is_assigned).toBe(false);
    });
  });

  describe('Validation Tests', () => {
    test('POST /api/plans - Should fail with invalid data', async () => {
      const invalidPlanData = {
        name: '', // Empty name should fail
        price: -100, // Negative price should fail
      };

      const response = await request(app)
        .post('/api/plans')
        .send(invalidPlanData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Validation failed');
    });

    test('POST /api/categories - Should fail with invalid data', async () => {
      const invalidCategoryData = {
        name: '', // Empty name should fail
        display_order: -1, // Negative display_order should fail
      };

      const response = await request(app)
        .post('/api/categories')
        .send(invalidCategoryData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Validation failed');
    });

    test('POST /api/shop-categories/assign - Should fail with invalid shop/category IDs', async () => {
      const invalidAssignmentData = {
        shop_id: 99999, // Non-existent shop
        category_ids: [99999], // Non-existent category
      };

      const response = await request(app)
        .post('/api/shop-categories/assign')
        .send(invalidAssignmentData)
        .expect(500); // Should fail with database error

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Error Handling', () => {
    test('GET /api/plans/99999 - Should return 404 for non-existent plan', async () => {
      const response = await request(app)
        .get('/api/plans/99999')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Plan not found');
    });

    test('GET /api/categories/99999 - Should return 404 for non-existent category', async () => {
      const response = await request(app)
        .get('/api/categories/99999')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Category not found');
    });

    test('GET /api/shop-categories/shop/99999/categories - Should return empty array for non-existent shop', async () => {
      const response = await request(app)
        .get('/api/shop-categories/shop/99999/categories')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(0);
    });
  });
});
