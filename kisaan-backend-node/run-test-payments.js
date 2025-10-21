const axios = require('axios');

async function run() {
  try {
    console.log('Logging in...');
    const login = await axios.post('http://localhost:8000/api/auth/login', {
      username: 'ramakanthreddy_0_107',
      password: 'reddy@123'
    });
    console.log('Login status:', login.status);
    const token = login.data?.data?.token;
    if (!token) {
      console.error('No token returned in login response:', login.data);
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };

    console.log('\nCreating a partial payment (BUYER -> SHOP, ₹50)...');
    try {
      const create = await axios.post('http://localhost:8000/api/transactions/payments', {
        payer_type: 'BUYER',
        payee_type: 'SHOP',
        amount: 50,
        method: 'CASH',
        counterparty_id: 2,
        shop_id: 1,
        status: 'PAID',
        payment_date: new Date().toISOString()
      }, { headers });
      console.log('Create payment status:', create.status);
      console.log('Create payment response data:', create.data);
    } catch (e) {
      console.error('Create payment error:', e.response?.status, e.response?.data || e.message);
    }

    console.log('\nFetching analytics...');
    try {
      const analytics = await axios.get('http://localhost:8000/api/transactions/analytics', { headers });
      console.log('Analytics status:', analytics.status);
      console.log('Analytics payload keys:', Object.keys(analytics.data.data || {}));
      console.log('Analytics data:', analytics.data.data);
    } catch (e) {
      console.error('Analytics error:', e.response?.status, e.response?.data || e.message);
    }

    console.log('\nFetching outstanding payments...');
    try {
      const out = await axios.get('http://localhost:8000/api/transactions/payments/outstanding', { headers });
      console.log('Outstanding payments status:', out.status);
      console.log('Outstanding payments count/data:', out.data.data);
    } catch (e) {
      console.error('Outstanding payments error:', e.response?.status, e.response?.data || e.message);
    }

  } catch (err) {
    console.error('Fatal error:', err.message || err);
  }
}

run();
