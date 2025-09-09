import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

describe('KisaanCenter Complete Workflow Integration Test', () => {
  let superadminToken: string;
  let ownerToken: string;
  let planId: number;
  let shopId: number;
  let categoryId: number;
  let productId: number;
  let farmerId: number;
  let buyerId: number;
  let transactionId: number;
  let paymentId: number;
  let commissionId: number;

  beforeAll(async () => {
    console.log('Testing against running API server at', API_BASE);
  });

  describe('1. Superadmin Setup', () => {
    it('should login as existing superadmin', async () => {
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        username: 'superadmin',
        password: 'superadminpass'
      });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.data.success).toBe(true);
      expect(loginResponse.data.access_token || loginResponse.data.token).toBeDefined();
      
      superadminToken = loginResponse.data.access_token || loginResponse.data.token;
    });

    it('should create a plan', async () => {
      const response = await axios.post(`${API_BASE}/plans`, {
        name: 'Basic Plan Test',
        description: 'Basic plan for small shops',
        monthly_price: 1000,
        max_farmers: 100,
        max_buyers: 50,
        max_transactions: 1000,
        features: '["transaction_tracking", "payment_management"]'
      }, {
        headers: { Authorization: `Bearer ${superadminToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      planId = response.data.data.id;
    });

    it('should create categories', async () => {
      const response = await axios.post(`${API_BASE}/categories`, {
        name: 'Vegetables Test',
        description: 'Fresh vegetables category'
      }, {
        headers: { Authorization: `Bearer ${superadminToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      categoryId = response.data.data.id;
    });

    it('should create products', async () => {
      const response = await axios.post(`${API_BASE}/products`, {
        name: 'Tomatoes Test',
        category_id: categoryId,
        description: 'Fresh red tomatoes',
        price: 25.00,
        unit: 'kg'
      }, {
        headers: { Authorization: `Bearer ${superadminToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      productId = response.data.data.id;
    });

    it('should create owner', async () => {
      const response = await axios.post(`${API_BASE}/users`, {
        username: 'shop_owner_test',
        password: 'owner123',
        role: 'owner',
        email: 'owner@example.com',
        contact: '9876543210'
      }, {
        headers: { Authorization: `Bearer ${superadminToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
    });

    it('should create shop for owner', async () => {
      const ownerResponse = await axios.get(`${API_BASE}/users?role=owner`, {
        headers: { Authorization: `Bearer ${superadminToken}` }
      });

      const ownerId = ownerResponse.data.data[0].id;

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
    });

    it('should assign category to shop', async () => {
      const response = await axios.post(`${API_BASE}/shop-categories`, {
        shop_id: shopId,
        category_id: categoryId
      }, {
        headers: { Authorization: `Bearer ${superadminToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
    });

    it('should set commission rate for shop', async () => {
      const response = await axios.post(`${API_BASE}/commissions`, {
        shop_id: shopId,
        rate: 12.5,
        type: 'percentage'
      }, {
        headers: { Authorization: `Bearer ${superadminToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      commissionId = response.data.data.id;
    });
  });

  describe('2. Owner Operations', () => {
    it('should login as owner', async () => {
      const response = await axios.post(`${API_BASE}/auth/login`, {
        username: 'shop_owner_test',
        password: 'owner123'
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      ownerToken = response.data.access_token || response.data.token;
    });

    it('should create farmer', async () => {
      const response = await axios.post(`${API_BASE}/users`, {
        username: 'farmer_john_test',
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
        username: 'buyer_mary_test',
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
      const response = await axios.post(`${API_BASE}/transactions`, {
        shop_id: shopId,
        farmer_id: farmerId,
        buyer_id: buyerId,
        category_id: categoryId,
        product_name: 'Tomatoes',
        quantity: 50,
        unit_price: 25.00
      }, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data.total_sale_value).toBe(1250);
      expect(response.data.data.shop_commission).toBe(156.25);
      expect(response.data.data.farmer_earning).toBe(1093.75);
      
      transactionId = response.data.data.id;
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
      const response = await axios.post(`${API_BASE}/payments`, {
        transaction_id: transactionId,
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
      const response = await axios.post(`${API_BASE}/payments`, {
        transaction_id: transactionId,
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
    });
  });
});