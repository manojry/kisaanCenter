import axios from 'axios';
const API_BASE = 'http://localhost:3000/api/v1';

describe('Transactions Integration', () => {
  let adminToken: string;

  beforeAll(async () => {
    const res = await axios.post(`${API_BASE}/auth/login`, { username: 'superadmin', password: 'superadminpass' });
    adminToken = res.data.token;
  });

  it('should list all transactions', async () => {
    const res = await axios.get(`${API_BASE}/transactions`, { headers: { Authorization: `Bearer ${adminToken}` } });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data.data)).toBe(true);
  });

  it('should create a new transaction', async () => {
    const transaction = {
      shop_id: 1,
      buyer_id: 1,
      type: 'sale',
      status: 'pending',
      commission_rate: 5.0,
      commission_amount: 10.0,
      payment_status: 'pending',
      buyer_paid_amount: 100.0,
      farmer_paid_amount: 90.0,
      commission_confirmed: false,
      completion_status: 'incomplete',
      date: new Date().toISOString().slice(0, 10),
      record_status: 'active',
    };
    const res = await axios.post(`${API_BASE}/transactions`, transaction, { headers: { Authorization: `Bearer ${adminToken}` } });
    expect(res.status).toBe(201);
    expect(res.data.data.shop_id).toBe(1);
  });

  it('should not create transaction with invalid shop', async () => {
    const transaction = {
      shop_id: 9999,
      buyer_id: 1,
      type: 'sale',
      status: 'pending',
      commission_rate: 5.0,
      commission_amount: 10.0,
      payment_status: 'pending',
      buyer_paid_amount: 100.0,
      farmer_paid_amount: 90.0,
      commission_confirmed: false,
      completion_status: 'incomplete',
      date: new Date().toISOString().slice(0, 10),
      record_status: 'active',
    };
    try {
      await axios.post(`${API_BASE}/transactions`, transaction, { headers: { Authorization: `Bearer ${adminToken}` } });
      throw new Error('Should not allow invalid shop');
    } catch (err: any) {
      expect(err.response.status).toBe(400);
    }
  });
});
