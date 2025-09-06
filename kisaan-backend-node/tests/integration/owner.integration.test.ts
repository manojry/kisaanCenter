import axios from 'axios';

describe('Owner End-to-End Integration Flow', () => {
  const baseUrl = 'http://localhost:8000/api/v1';
  const ownerCreds = { username: 'reddy', password: 'reddy@123' };
  let token: string;
  let shopId: number | string;
  let userId: number | string;

  it('should authenticate as owner', async () => {
    const res = await axios.post(`${baseUrl}/users/auth/login`, ownerCreds);
    expect(res.status).toBe(200);
    expect(res.data.success).toBeTruthy();
    token = res.data.data.access_token;
    shopId = res.data.data.shop_id;
    userId = res.data.data.user_id || res.data.data.id;
    expect(token).toBeDefined();
    expect(shopId).toBeDefined();
    expect(userId).toBeDefined();
  });

  it('should fetch shop analytics', async () => {
    const res = await axios.get(`${baseUrl}/owner-admin/shops/${shopId}/analytics`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    expect(res.data.success).toBeTruthy();
    expect(res.data.data).toBeDefined();
  });

  it('should fetch shop users and filter by role', async () => {
    const res = await axios.get(`${baseUrl}/owner-admin/shops/${shopId}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    expect(res.data.success).toBeTruthy();
    expect(res.data.data).toBeDefined();
    // Test role filter
    for (const role of ['farmer', 'buyer', 'employee']) {
      const roleRes = await axios.get(`${baseUrl}/owner-admin/shops/${shopId}/users?role=${role}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(roleRes.status).toBe(200);
      expect(roleRes.data.success).toBeTruthy();
    }
  });

  it('should fetch shop products', async () => {
    const res = await axios.get(`${baseUrl}/owner-admin/shops/${shopId}/products`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    expect(res.data.success).toBeTruthy();
    expect(res.data.data).toBeDefined();
  });

  it('should create a new farmer user', async () => {
    const timestamp = Date.now();
    const userData = [{
      username: `testfarmer_${timestamp}`,
      password: 'testpass123',
      role: 'farmer',
      shop_id: shopId,
      contact: '+91-9876543210',
      credit_limit: 5000.0,
    }];
    const res = await axios.post(`${baseUrl}/owner-admin/shops/${shopId}/users`, userData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    expect(res.data.success).toBeTruthy();
    expect(res.data.data).toBeDefined();
  });

  it('should create a transaction for a buyer and product', async () => {
    // Get buyers
    const usersRes = await axios.get(`${baseUrl}/owner-admin/shops/${shopId}/users?role=buyer`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const buyers = usersRes.data.data;
    expect(Array.isArray(buyers)).toBeTruthy();
    expect(buyers.length).toBeGreaterThan(0);
    const buyerId = buyers[0].id;
    // Get products
    const productsRes = await axios.get(`${baseUrl}/owner-admin/shops/${shopId}/products`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const products = productsRes.data.data;
    expect(Array.isArray(products)).toBeTruthy();
    expect(products.length).toBeGreaterThan(0);
    const productId = products[0].id;
    // Create transaction
    const txnData = {
      buyer_user_id: buyerId,
      type: 'sale',
      commission_rate: 5.0,
      date: new Date().toISOString().slice(0, 10),
      items: [{ product_id: productId, quantity: 2.0, price_per_unit: 100.0 }],
      farmer_paid_amount: 0,
      commission_confirmed: false,
      buyer_paid_amount: 0,
      shop_id: shopId,
    };
    const txnRes = await axios.post(`${baseUrl}/transactions`, txnData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 201]).toContain(txnRes.status);
    expect(txnRes.data.success).toBeTruthy();
    expect(txnRes.data.data).toBeDefined();
    expect(txnRes.data.data.id).toBeDefined();
  });

  it('should fetch today\'s transactions', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const res = await axios.get(`${baseUrl}/transactions?shop_id=${shopId}&date_from=${today}&date_to=${today}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    expect(res.data.success).toBeTruthy();
    expect(Array.isArray(res.data.data)).toBeTruthy();
  });
});
