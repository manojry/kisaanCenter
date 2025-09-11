import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

describe('KisaanCenter Complete Business Journey', () => {
  let superadminToken: string;
  let ownerToken: string;
  let planId: number;
  let shopId: number;
  let categoryId: number;
  let productId: number;
  let farmerId: number;
  let buyerId: number;
  let transactionId: number;
  let ownerId: number;

  beforeAll(async () => {
    console.log('🚀 Starting Business Journey Test');
  });

  describe('1. SUPERADMIN OPERATIONS', () => {
    it('should login as superadmin', async () => {
      const response = await axios.post(`${API_BASE}/auth/login`, {
        username: 'superadmin',
        password: 'superadminpass'
      });
      expect(response.status).toBe(200);
      superadminToken = response.data.access_token || response.data.token;
      console.log('✅ Superadmin logged in');
    });

    it('should use existing global data', async () => {
      // Fetch actual IDs from database
      const plansRes = await axios.get(`${API_BASE}/plans`);
      const categoriesRes = await axios.get(`${API_BASE}/categories`);
      const productsRes = await axios.get(`${API_BASE}/products`);
      
      planId = plansRes.data.data?.[0]?.id;
      categoryId = categoriesRes.data.data?.[0]?.id;
      productId = productsRes.data.data?.[0]?.id;
      
      if (!planId || !categoryId || !productId) {
        throw new Error(`Missing global data - Plan: ${planId}, Category: ${categoryId}, Product: ${productId}`);
      }
      
      console.log('✅ Using global data - Plan:', planId, 'Category:', categoryId, 'Product:', productId);
    });

    it('should create owner', async () => {
      const response = await axios.post(`${API_BASE}/users`, {
        username: `owner_${Date.now()}`,
        password: 'owner123',
        role: 'owner',
        email: 'owner@test.com',
        contact: '9876543210'
      }, {
        headers: { Authorization: `Bearer ${superadminToken}` }
      });
      expect(response.status).toBe(201);
      ownerId = response.data.data.id;
      console.log('✅ Owner created:', ownerId);
    });

    it('should create shop and assign to owner', async () => {
      try {
        const response = await axios.post(`${API_BASE}/shops`, {
          name: `Test Shop ${Date.now()}`,
          owner_id: ownerId,
          plan_id: planId,
          address: '123 Market Street',
          contact: '9876543210'
        }, {
          headers: { Authorization: `Bearer ${superadminToken}` }
        });
        expect(response.status).toBe(201);
        shopId = response.data.data.id;
        
        // Update owner with shop_id
        await axios.put(`${API_BASE}/users/${ownerId}`, {
          shop_id: shopId
        }, {
          headers: { Authorization: `Bearer ${superadminToken}` }
        });
        console.log('✅ Shop created and linked to owner:', shopId);
      } catch (error) {
        console.error('Shop creation error:', (error as any).response?.data || (error as any).message);
        throw error;
      }
    });

    it('should assign category to shop', async () => {
      const response = await axios.post(`${API_BASE}/shop-categories/assign`, {
        shop_id: shopId,
        category_ids: [categoryId]
      }, {
        headers: { Authorization: `Bearer ${superadminToken}` }
      });
      expect(response.status).toBe(201);
      console.log('✅ Category assigned to shop');
    });
  });

  describe('2. OWNER OPERATIONS', () => {
    it('should login as owner', async () => {
      const ownerUser = await axios.get(`${API_BASE}/users/${ownerId}`, {
        headers: { Authorization: `Bearer ${superadminToken}` }
      });
      const username = ownerUser.data.data?.username || ownerUser.data.user?.username;
      
      const response = await axios.post(`${API_BASE}/auth/login`, {
        username: username,
        password: 'owner123'
      });
      expect(response.status).toBe(200);
      ownerToken = response.data.access_token || response.data.token;
      console.log('✅ Owner logged in');
    });

    it('should set shop commission rate', async () => {
      const response = await axios.post(`${API_BASE}/commissions`, {
        shop_id: shopId,
        rate: 15.0,
        type: 'percentage'
      }, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      });
      expect(response.status).toBe(201);
      console.log('✅ Commission rate set: 15%');
    });

    it('should assign products to shop', async () => {
      const response = await axios.post(`${API_BASE}/shops/${shopId}/products/${productId}`, {}, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      });
      expect(response.status).toBe(201);
      console.log('✅ Product assigned to shop');
    });

    it('should create farmer', async () => {
      const response = await axios.post(`${API_BASE}/users`, {
        username: `farmer_${Date.now()}`,
        password: 'farmer123',
        role: 'farmer',
        shop_id: shopId,
        contact: '9876543211',
        email: 'farmer@test.com'
      }, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      });
      expect(response.status).toBe(201);
      farmerId = response.data.data.id;
      console.log('✅ Farmer created:', farmerId);
    });

    it('should create buyer', async () => {
      const response = await axios.post(`${API_BASE}/users`, {
        username: `buyer_${Date.now()}`,
        password: 'buyer123',
        role: 'buyer',
        shop_id: shopId,
        contact: '9876543212',
        email: 'buyer@test.com'
      }, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      });
      expect(response.status).toBe(201);
      buyerId = response.data.data.id;
      console.log('✅ Buyer created:', buyerId);
    });

    it('should get all farmers under shop', async () => {
      const response = await axios.get(`${API_BASE}/users?role=farmer&shop_id=${shopId}`, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      });
      expect(response.status).toBe(200);
      expect(response.data.data.length).toBeGreaterThan(0);
      console.log('✅ Retrieved farmers for shop');
    });

    it('should get all buyers under shop', async () => {
      const response = await axios.get(`${API_BASE}/users?role=buyer&shop_id=${shopId}`, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      });
      expect(response.status).toBe(200);
      expect(response.data.data.length).toBeGreaterThan(0);
      console.log('✅ Retrieved buyers for shop');
    });
  });

  describe('3. TRANSACTION FLOW', () => {
    it('should create transaction with automatic calculations', async () => {
      const response = await axios.post(`${API_BASE}/transactions`, {
        shop_id: shopId,
        farmer_id: farmerId,
        buyer_id: buyerId,
        category_id: categoryId,
        product_name: 'Tomato',
        quantity: 100,
        unit_price: 10.00
      }, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      });
      
      expect(response.status).toBe(201);
      expect(Number(response.data.data.total_sale_value)).toBe(1000);
      expect(Number(response.data.data.shop_commission)).toBe(150); // 15%
      expect(Number(response.data.data.farmer_earning)).toBe(850);
      
      transactionId = response.data.data.id;
      
      if (!transactionId || isNaN(Number(transactionId))) {
        console.error('Transaction creation response missing valid id:', response.data);
        throw new Error('Transaction creation failed: No valid transactionId returned');
      }
      
      console.log('✅ Transaction created with calculations, ID:', transactionId);
    });

    it('should verify balance updates after transaction', async () => {
      const farmerRes = await axios.get(`${API_BASE}/users/${farmerId}`, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      });
      const buyerRes = await axios.get(`${API_BASE}/users/${buyerId}`, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      });
      
      const farmerData = farmerRes.data.data || farmerRes.data.user;
      const buyerData = buyerRes.data.data || buyerRes.data.user;
      
      expect(Number(farmerData.balance)).toBe(850); // Farmer earning
      expect(Number(buyerData.balance)).toBe(-1000); // Buyer owes
      expect(Number(farmerData.cumulative_value)).toBe(850);
      expect(Number(buyerData.cumulative_value)).toBe(1000);
      
      console.log('✅ Balances updated correctly');
    });

    it('should record partial buyer payment', async () => {
      if (!transactionId) {
        throw new Error('transactionId not set before payment creation');
      }
      
      const response = await axios.post(`${API_BASE}/payments`, {
        transaction_id: transactionId,
        payer_type: 'BUYER',
        payee_type: 'SHOP',
        amount: 600.00,
        method: 'CASH'
      }, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      });
      
      expect(response.status).toBe(201);
      console.log('✅ Partial payment recorded');
    });

    it('should verify partial payment balance updates', async () => {
      const buyerRes = await axios.get(`${API_BASE}/users/${buyerId}`, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      });
      const buyerData = buyerRes.data.data || buyerRes.data.user;
      
      expect(Number(buyerData.balance)).toBe(-400); // Still owes 400
      console.log('✅ Partial payment balance verified');
    });

    it('should pay farmer full amount', async () => {
      if (!transactionId) {
        throw new Error('transactionId not set before payment creation');
      }
      
      const response = await axios.post(`${API_BASE}/payments`, {
        transaction_id: transactionId,
        payer_type: 'SHOP',
        payee_type: 'FARMER',
        amount: 850.00,
        method: 'CASH'
      }, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      });
      
      expect(response.status).toBe(201);
      console.log('✅ Farmer paid in full');
    });

    it('should verify final balances', async () => {
      const farmerRes = await axios.get(`${API_BASE}/users/${farmerId}`, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      });
      const buyerRes = await axios.get(`${API_BASE}/users/${buyerId}`, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      });
      
      const farmerData = farmerRes.data.data || farmerRes.data.user;
      const buyerData = buyerRes.data.data || buyerRes.data.user;
      
      expect(Number(farmerData.balance)).toBe(0); // Paid in full
      expect(Number(buyerData.balance)).toBe(-400); // Still owes 400
      
      console.log('✅ Final balances verified');
    });
  });

  describe('4. DAILY OPERATIONS', () => {
    it('should get today\'s transactions', async () => {
      const response = await axios.get(`${API_BASE}/transactions/shop/${shopId}`, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      });
      expect(response.status).toBe(200);
      expect(response.data.data.length).toBeGreaterThan(0);
      console.log('✅ Retrieved today\'s transactions');
    });

    it('should get shop earnings summary', async () => {
      const response = await axios.get(`${API_BASE}/transactions/shop/${shopId}/earnings`, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      });
      expect(response.status).toBe(200);
      expect(response.data.data.total_commission).toBe(150);
      console.log('✅ Shop earnings calculated');
    });

    it('should get farmer earnings', async () => {
      const response = await axios.get(`${API_BASE}/transactions/farmer/${farmerId}/earnings`, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      });
      expect(response.status).toBe(200);
      expect(response.data.data.totalEarnings).toBe(850);
      console.log('✅ Farmer earnings calculated');
    });

    it('should get outstanding payments', async () => {
      const response = await axios.get(`${API_BASE}/payments/outstanding`, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      });
      expect(response.status).toBe(200);
      console.log('✅ Outstanding payments retrieved');
    });
  });

  describe('5. SUPERADMIN MANAGEMENT', () => {
    it('should upgrade shop plan', async () => {
      // Create new plan
      const newPlanRes = await axios.post(`${API_BASE}/plans`, {
        name: `Premium Plan ${Date.now()}`,
        price: 1999.99,
        billing_cycle: 'monthly',
        max_users: 200,
        features: ['advanced_reports', 'analytics']
      }, {
        headers: { Authorization: `Bearer ${superadminToken}` }
      });
      
      const newPlanId = newPlanRes.data.data.id;
      
      // Update shop plan
      const response = await axios.put(`${API_BASE}/shops/${shopId}`, {
        plan_id: newPlanId
      }, {
        headers: { Authorization: `Bearer ${superadminToken}` }
      });
      
      expect(response.status).toBe(200);
      console.log('✅ Shop plan upgraded');
    });

    it('should deactivate and reactivate shop', async () => {
      // Deactivate
      await axios.put(`${API_BASE}/shops/${shopId}`, {
        status: 'inactive'
      }, {
        headers: { Authorization: `Bearer ${superadminToken}` }
      });
      
      // Reactivate
      const response = await axios.put(`${API_BASE}/shops/${shopId}`, {
        status: 'active'
      }, {
        headers: { Authorization: `Bearer ${superadminToken}` }
      });
      
      expect(response.status).toBe(200);
      console.log('✅ Shop deactivated and reactivated');
    });
  });

  describe('6. OWNER PASSWORD MANAGEMENT', () => {
    it('should allow owner to reset own password', async () => {
      const response = await axios.post(`${API_BASE}/users/${ownerId}/reset-password`, {
        currentPassword: 'owner123',
        newPassword: 'newowner123'
      }, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      });
      
      expect(response.status).toBe(200);
      console.log('✅ Owner password reset');
    });

    it('should login with new password', async () => {
      const ownerUser = await axios.get(`${API_BASE}/users/${ownerId}`, {
        headers: { Authorization: `Bearer ${superadminToken}` }
      });
      const username = ownerUser.data.data?.username || ownerUser.data.user?.username;
      
      const response = await axios.post(`${API_BASE}/auth/login`, {
        username: username,
        password: 'newowner123'
      });
      
      expect(response.status).toBe(200);
      console.log('✅ Login with new password successful');
    });
  });

  afterAll(() => {
    console.log('🎉 Business Journey Test Completed Successfully!');
  });
});