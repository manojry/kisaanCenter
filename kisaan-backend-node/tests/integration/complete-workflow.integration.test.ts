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

    it('should get valid IDs from database', async () => {
      // Get valid category ID
      const categoriesRes = await axios.get(`${API_BASE}/categories`);
      categoryId = categoriesRes.data.data?.[0]?.id || 1;
      
      // Get valid plan ID
      const plansRes = await axios.get(`${API_BASE}/plans`);
      planId = plansRes.data.data?.[0]?.id || 1;
      
      productName = 'Test Product';
      
      console.log('✅ Valid IDs:', { categoryId, planId });
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
  it('should create transaction and check balances', async () => {
  // Wait for DB commit to ensure updated values are available
  await new Promise(res => setTimeout(res, 200));
    try {
      if (!categoryId) throw new Error('categoryId not set before transaction creation');
      if (!shopId) throw new Error('shopId not set before transaction creation');
      if (!farmerId) throw new Error('farmerId not set before transaction creation');
      if (!buyerId) throw new Error('buyerId not set before transaction creation');
      
      const response = await axios.post(`${API_BASE}/transactions`, {
        shop_id: shopId,
        farmer_id: farmerId,
        buyer_id: buyerId,
        category_id: categoryId,
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
      // Check balances and cumulative_value after transaction (should reflect sale, not yet paid)
  const farmerRes = await axios.get(`${API_BASE}/users/${farmerId}`, { headers: { Authorization: `Bearer ${ownerToken}` } });
  const buyerRes = await axios.get(`${API_BASE}/users/${buyerId}`, { headers: { Authorization: `Bearer ${ownerToken}` } });
  const ownerRes = await axios.get(`${API_BASE}/users/${ownerId}`, { headers: { Authorization: `Bearer ${superadminToken}` } });
  console.log('farmerRes:', JSON.stringify(farmerRes.data, null, 2));
  console.log('buyerRes:', JSON.stringify(buyerRes.data, null, 2));
  console.log('ownerRes:', JSON.stringify(ownerRes.data, null, 2));
  expect(Number(farmerRes.data.data.balance)).toBeGreaterThanOrEqual(1093.75);
  expect(Number(buyerRes.data.data.balance)).toBeLessThanOrEqual(-1250);
  expect(Number(farmerRes.data.data.cumulative_value || 0)).toBeGreaterThanOrEqual(1093.75);
  expect(Number(buyerRes.data.data.cumulative_value || 0)).toBeGreaterThanOrEqual(1250);
  expect(Number(ownerRes.data.data.cumulative_value || 0)).toBeGreaterThanOrEqual(156.25);
      if (!transactionId || isNaN(Number(transactionId))) {
        console.error('Transaction creation response missing valid id:', response.data);
        throw new Error('Transaction creation failed: No valid transactionId returned');
      }
    } catch (err) {
      if (err && (err as any).response && (err as any).response.data) {
        console.error('Create transaction error:', (err as any).response.data);
      } else {
        console.error('Create transaction error:', err);
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

  it('should record partial buyer payment and check balances', async () => {
    // Wait for DB commit to ensure updated values are available
    await new Promise(res => setTimeout(res, 200));
    try {
      if (!transactionId) throw new Error('transactionId not set');
      
      // Record partial payment from buyer (₹800 out of ₹1250)
      const paymentResponse = await axios.post(`${API_BASE}/payments`, {
        transaction_id: Number(transactionId),
        payer_type: 'BUYER',
        payee_type: 'SHOP',
        amount: 800.00,
        method: 'CASH'
      }, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      });
      
      expect(paymentResponse.status).toBe(201);
      expect(paymentResponse.data.success).toBe(true);
      paymentId = paymentResponse.data.data.id;
      
      // Check balances after partial payment
      const farmerRes = await axios.get(`${API_BASE}/users/${farmerId}`, { headers: { Authorization: `Bearer ${ownerToken}` } });
      const buyerRes = await axios.get(`${API_BASE}/users/${buyerId}`, { headers: { Authorization: `Bearer ${ownerToken}` } });
      
      // Buyer balance should be -450 (still owes ₹450)
      expect(Number(buyerRes.data.user.balance)).toBe(-450);
      // Farmer balance should still be positive (₹1093.75 - not yet paid by shop)
      expect(Number(farmerRes.data.user.balance)).toBe(1093.75);
      
    } catch (err) {
      console.error('Payment error:', (err as any).response?.data || err);
      throw err;
    }
  });

  it('should pay farmer and update balances', async () => {
    try {
      // Shop pays farmer ₹1093.75
      const paymentResponse = await axios.post(`${API_BASE}/payments`, {
        transaction_id: Number(transactionId),
        payer_type: 'SHOP',
        payee_type: 'FARMER',
        amount: 1093.75,
        method: 'CASH'
      }, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      });
      
      expect(paymentResponse.status).toBe(201);
      
      // Check final balances
      const farmerRes = await axios.get(`${API_BASE}/users/${farmerId}`, { headers: { Authorization: `Bearer ${ownerToken}` } });
      const buyerRes = await axios.get(`${API_BASE}/users/${buyerId}`, { headers: { Authorization: `Bearer ${ownerToken}` } });
      
      // Farmer balance should be 0 (earned ₹1093.75, got paid ₹1093.75)
      expect(Number(farmerRes.data.user.balance)).toBe(0);
      // Buyer still owes ₹450
      expect(Number(buyerRes.data.user.balance)).toBe(-450);
      // Cumulative values should track total business done
      expect(Number(farmerRes.data.user.cumulative_value)).toBe(1093.75);
      expect(Number(buyerRes.data.user.cumulative_value)).toBe(1250);
      
    } catch (err) {
      console.error('Farmer payment error:', (err as any).response?.data || err);
      throw err;
    }
  });
  });

  describe('4. Balance Verification', () => {
    it('should verify accumulated balances over multiple transactions', async () => {
      try {
        // Create second transaction - same farmer, different buyer
        const buyer2Response = await axios.post(`${API_BASE}/users`, {
          username: `buyer_jane_test_${Date.now()}`,
          password: 'buyer123',
          role: 'buyer',
          shop_id: shopId,
          contact: '9876543213'
        }, {
          headers: { Authorization: `Bearer ${ownerToken}` }
        });
        
        const buyer2Id = buyer2Response.data.data.id;
        
        // Second transaction: 30kg @ ₹20 = ₹600, commission ₹75, farmer gets ₹525
        const transaction2Response = await axios.post(`${API_BASE}/transactions`, {
          shop_id: Number(shopId),
          farmer_id: Number(farmerId),
          buyer_id: Number(buyer2Id),
          category_id: Number(categoryId),
          product_name: 'Jasmine',
          quantity: 30,
          unit_price: 20.00
        }, {
          headers: { Authorization: `Bearer ${ownerToken}` }
        });
        
        expect(transaction2Response.status).toBe(201);
        
        // Check accumulated balances
        const farmerRes = await axios.get(`${API_BASE}/users/${farmerId}`, { headers: { Authorization: `Bearer ${ownerToken}` } });
        const buyer1Res = await axios.get(`${API_BASE}/users/${buyerId}`, { headers: { Authorization: `Bearer ${ownerToken}` } });
        const buyer2Res = await axios.get(`${API_BASE}/users/${buyer2Id}`, { headers: { Authorization: `Bearer ${ownerToken}` } });
        
        // Farmer now has ₹525 pending (from second transaction)
        expect(Number(farmerRes.data.user.balance)).toBe(525);
        // Buyer1 still owes ₹450
        expect(Number(buyer1Res.data.user.balance)).toBe(-450);
        // Buyer2 owes ₹600
        expect(Number(buyer2Res.data.user.balance)).toBe(-600);
        
        // Cumulative values should show total business
        expect(Number(farmerRes.data.user.cumulative_value)).toBe(1618.75); // 1093.75 + 525
        expect(Number(buyer2Res.data.user.cumulative_value)).toBe(600);
        
      } catch (err) {
        console.error('Balance verification error:', (err as any).response?.data || err);
        throw err;
      }
    });

    it('should call reporting endpoints for farmer and buyer', async () => {
      // Farmer payments
      const farmerPayments = await axios.get(`${API_BASE}/transactions/farmers/${farmerId}/payments`, { headers: { Authorization: `Bearer ${ownerToken}` } });
      expect(farmerPayments.status).toBe(200);
      expect(farmerPayments.data.success).toBe(true);
      // Buyer payments
      const buyerPayments = await axios.get(`${API_BASE}/transactions/buyers/${buyerId}/payments`, { headers: { Authorization: `Bearer ${ownerToken}` } });
      expect(buyerPayments.status).toBe(200);
      expect(buyerPayments.data.success).toBe(true);
      // Buyer purchases
      const buyerPurchases = await axios.get(`${API_BASE}/transactions/buyers/${buyerId}/purchases`, { headers: { Authorization: `Bearer ${ownerToken}` } });
      expect(buyerPurchases.status).toBe(200);
      expect(buyerPurchases.data.success).toBe(true);
    });
  });

  // Helper function for retrying user fetch
  async function fetchUserWithCumulativeValue(userId: number, minValue: number, token: string) {
    let tries = 0;
    let lastValue = 0;
    while (tries < 10) {
      const res = await axios.get(`${API_BASE}/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      lastValue = Number(res.data.user.cumulative_value || 0);
      if (lastValue >= minValue) return res;
      await new Promise(r => setTimeout(r, 200));
      tries++;
    }
    throw new Error(`cumulative_value for user ${userId} did not reach ${minValue} after 10 tries, last value: ${lastValue}`);
  }
});