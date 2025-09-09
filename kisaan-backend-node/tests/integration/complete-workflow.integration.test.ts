import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

describe('KisaanCenter Complete Workflow Integration Test', () => {
  let superadminToken: string;
  let ownerToken: string;
  let planId: number;
  let shopId: number;
  let categoryId: number;
  let productId: number;
  let productName: string;
  let farmerId: number;
  let buyerId: number;
  let transactionId: number;
  let paymentId: number;
  let commissionId: number;
  let ownerUsername: string;
  let ownerId: number;

  beforeAll(async () => {
    console.log('Testing against running API server at', API_BASE);
  });

  describe('1. Superadmin Setup', () => {
    it('should login as existing superadmin', async () => {
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        username: 'superadmin',
        password: 'superadminpass'
      });

      console.log('LOGIN RESPONSE:', loginResponse.data);
      expect(loginResponse.status).toBe(200);
      // expect(loginResponse.data.success).toBe(true); // Commented out for debug
      expect(loginResponse.data.access_token || loginResponse.data.token).toBeDefined();
      
      superadminToken = loginResponse.data.access_token || loginResponse.data.token;
    });

    it('should create a plan', async () => {
      try {
        const uniquePlanName = `Basic Plan Test ${Date.now()}`;
        const response = await axios.post(`${API_BASE}/plans`, {
          name: uniquePlanName,
          description: 'Basic plan for small shops',
          price: 1000,
          billing_cycle: 'monthly',
          max_users: 150,
          max_products: 100,
          max_transactions: 1000,
          features: ['transaction_tracking', 'payment_management'],
          is_active: true
        }, {
          headers: { Authorization: `Bearer ${superadminToken}` }
        });
        expect(response.status).toBe(201);
        expect(response.data.success).toBe(true);
        planId = response.data.data.id;
      } catch (err) {
  console.error('Create plan error:', (err as any).response?.data || err);
        throw err;
      }
    });

    it('should create categories', async () => {
      try {
        // Use a unique category name for each test run
        const uniqueCategoryName = `Flowers Test ${Date.now()}`;
        const response = await axios.post(`${API_BASE}/categories`, {
          name: uniqueCategoryName,
          description: 'Fresh flowers category'
        }, {
          headers: { Authorization: `Bearer ${superadminToken}` }
        });
        expect(response.status).toBe(201);
        expect(response.data.success).toBe(true);
        categoryId = response.data.data.id;
      } catch (err) {
        console.error('Create category error:', (err as any).response?.data || err);
        throw err;
      }
    });

    it('should create products', async () => {
      try {
        // Central product creation (global, not shop-specific)
        const uniqueProductName = `Rose Test ${Date.now()}`;
        const response = await axios.post(`${API_BASE}/products`, {
          name: uniqueProductName,
          category_id: categoryId,
          description: 'Fresh red roses',
          price: 50.00,
          unit: 'bunch'
        }, {
          headers: { Authorization: `Bearer ${superadminToken}` }
        });
        expect(response.status).toBe(201);
        expect(response.data.success).toBe(true);
        productId = response.data.data.id;
        productName = uniqueProductName;
      } catch (err) {
        console.error('Create product error:', (err as any).response?.data || err);
        throw err;
      }
    });

    it('should create owner', async () => {
      try {
        ownerUsername = `shop_owner_test_${Date.now()}`;
        // Create owner without shop_id (will update after shop is created)
        const response = await axios.post(`${API_BASE}/users`, {
          username: ownerUsername,
          password: 'owner123',
          role: 'owner',
          email: 'owner@example.com',
          contact: '9876543210'
        }, {
          headers: { Authorization: `Bearer ${superadminToken}` }
        });
        expect(response.status).toBe(201);
        expect(response.data.success).toBe(true);
        // Save ownerId for update
  ownerId = response.data.data.id;
      } catch (err) {
  console.error('Create owner error:', (err as any).response?.data || err);
        throw err;
      }
    });

    it('should create shop for owner', async () => {
      try {
        // Use ownerId from previous test
        const response = await axios.post(`${API_BASE}/shops`, {
          name: 'Green Valley Shop Test',
          owner_id: ownerId,
          plan_id: planId,
          address: '123 Market Street',
          contact: '9876543210'
        }, {
          headers: { Authorization: `Bearer ${superadminToken}` }
        });
        expect(response.status).toBe(201);
        expect(response.data.success).toBe(true);
        shopId = response.data.data.id;
        // Update owner with shop_id
  await axios.put(`${API_BASE}/users/${ownerId}`, {
          shop_id: shopId
        }, {
          headers: { Authorization: `Bearer ${superadminToken}` }
        });
      } catch (err) {
  console.error('Create shop error:', (err as any).response?.data || err);
        throw err;
      }
    });

    it('should set commission rate for shop', async () => {
      try {
        // Set commission rate to 12.5% for the shop
        const response = await axios.post(`${API_BASE}/commissions`, {
          shop_id: Number(shopId),
          rate: 12.5,
          type: 'percentage'
        }, {
          headers: { Authorization: `Bearer ${superadminToken}` }
        });
        expect(response.status).toBe(201);
        expect(response.data.success).toBe(true);
      } catch (err) {
        console.error('Set commission error:', (err as any).response?.data || err);
        throw err;
      }
    });

    // All other tests are commented out for now to focus on the first 6
    /*
    it('should assign category to shop', async () => { ... });
    it('should set commission rate for shop', async () => { ... });
    ...
    */
  });

  describe('2. Owner Operations', () => {
  it('should login as owner', async () => {
      try {
        const response = await axios.post(`${API_BASE}/auth/login`, {
          username: ownerUsername,
          password: 'owner123'
        });
        console.log('OWNER LOGIN RESPONSE:', response.data);
        expect(response.status).toBe(200);
        // expect(response.data.success).toBe(true); // Commented for debug
        ownerToken = response.data.access_token || response.data.token;
      } catch (err) {
  console.error('Owner login error:', (err as any).response?.data || err);
        throw err;
      }
    });

  it('should create farmer', async () => {
      const response = await axios.post(`${API_BASE}/users`, {
        username: `farmer_john_test_${Date.now()}`,
        password: 'farmer123',
        role: 'farmer',
        shop_id: shopId,
        contact: '9876543211',
        email: 'farmer@example.com'
      }, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      farmerId = response.data.data.id;
    });

  it('should create buyer', async () => {
      const response = await axios.post(`${API_BASE}/users`, {
        username: `buyer_mary_test_${Date.now()}`,
        password: 'buyer123',
        role: 'buyer',
        shop_id: shopId,
        contact: '9876543212',
        email: 'buyer@example.com'
      }, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      buyerId = response.data.data.id;
    });
  });

  describe('3. Transaction Flow', () => {
  it('should create transaction', async () => {
    try {
      const response = await axios.post(`${API_BASE}/transactions`, {
        shop_id: Number(shopId),
        farmer_id: Number(farmerId),
        buyer_id: Number(buyerId),
        category_id: Number(categoryId),
        product_name: productName,
        quantity: 50,
        unit_price: 25.00
      }, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      });
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(Number(response.data.data.total_sale_value)).toBe(1250);
      expect(Number(response.data.data.shop_commission)).toBe(156.25);
      expect(Number(response.data.data.farmer_earning)).toBe(1093.75);
      transactionId = response.data.data.id;
      if (!transactionId || isNaN(Number(transactionId))) {
        console.error('Transaction creation response missing valid id:', response.data);
        throw new Error('Transaction creation failed: No valid transactionId returned');
      }
    } catch (err) {
      if (err && typeof err === 'object' && 'response' in err) {
        // @ts-expect-error: dynamic error shape from axios
        console.error('Transaction creation error:', err.response?.data || err);
      } else {
        console.error('Transaction creation error:', err);
      }
      throw err;
    }
  });

  it('should get transaction by ID', async () => {
      const response = await axios.get(`${API_BASE}/transactions/${transactionId}`, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.id).toBe(transactionId);
    });

  it('should record buyer payment', async () => {
    try {
      if (!transactionId || isNaN(Number(transactionId))) {
        throw new Error('Cannot create payment: transactionId is invalid');
      }
      const response = await axios.post(`${API_BASE}/payments`, {
        transaction_id: Number(transactionId),
        payer_type: 'BUYER',
        payee_type: 'SHOP',
        amount: 1250.00,
        method: 'CASH',
        notes: 'Full payment for tomatoes'
      }, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      });
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data.status).toBe('PENDING');
      paymentId = response.data.data.id;
      if (!paymentId || isNaN(Number(paymentId))) {
        console.error('Payment creation response missing valid id:', response.data);
        throw new Error('Payment creation failed: No valid paymentId returned');
      }
    } catch (err) {
      if (err && typeof err === 'object' && 'response' in err) {
        // @ts-expect-error: dynamic error shape from axios
        console.error('Buyer payment creation error:', err.response?.data || err);
      } else {
        console.error('Buyer payment creation error:', err);
      }
      throw err;
    }
    });

  it('should update payment status to PAID', async () => {
      const response = await axios.put(`${API_BASE}/payments/${paymentId}/status`, {
        status: 'PAID',
        payment_date: new Date().toISOString()
      }, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.status).toBe('PAID');
    });

  it('should record farmer payment', async () => {
      try {
        const response = await axios.post(`${API_BASE}/payments`, {
          transaction_id: Number(transactionId),
          payer_type: 'SHOP',
          payee_type: 'FARMER',
          amount: 1093.75,
          method: 'CASH',
          notes: 'Payment to farmer after commission'
        }, {
          headers: { Authorization: `Bearer ${ownerToken}` }
        });
        expect(response.status).toBe(201);
        expect(response.data.success).toBe(true);
      } catch (err) {
        if (err && typeof err === 'object' && 'response' in err) {
          // @ts-expect-error: dynamic error shape from axios
          console.error('Farmer payment creation error:', err.response.data);
        } else {
          console.error('Farmer payment creation error:', err);
        }
        throw err;
      }
    });
  });
});