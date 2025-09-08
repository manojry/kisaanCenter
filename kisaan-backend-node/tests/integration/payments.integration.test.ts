import axios from 'axios';
const API_BASE = 'http://localhost:3000/api';

describe('Payments Integration', () => {
  let adminToken: string;

  beforeAll(async () => {
    const res = await axios.post(`${API_BASE}/auth/login`, { username: 'superadmin', password: 'superadminpass' });
    adminToken = res.data.token;
  });

  it('should list all payments', async () => {
    const res = await axios.get(`${API_BASE}/payments`, { headers: { Authorization: `Bearer ${adminToken}` } });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data.data)).toBe(true);
  });

  it('should create a new payment', async () => {
    const payment = {
      transaction_id: 1,
      amount: 100.0,
      payment_method_id: 1,
      type: 'full_payment',
      record_status: 'active',
    };
    const res = await axios.post(`${API_BASE}/payments`, payment, { headers: { Authorization: `Bearer ${adminToken}` } });
    expect(res.status).toBe(201);
    expect(res.data.data.transaction_id).toBe(1);
  });

  it('should not create payment with invalid transaction', async () => {
    const payment = {
      transaction_id: 9999,
      amount: 100.0,
      payment_method_id: 1,
      type: 'full_payment',
      record_status: 'active',
    };
    try {
      await axios.post(`${API_BASE}/payments`, payment, { headers: { Authorization: `Bearer ${adminToken}` } });
      throw new Error('Should not allow invalid transaction');
    } catch (err: any) {
      expect(err.response.status).toBe(400);
    }
  });
});
