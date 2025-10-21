const axios = require('axios');

async function collect() {
  try {
    const login = await axios.post('http://localhost:8000/api/auth/login', { username: 'ramakanthreddy_0_107', password: 'reddy@123' });
    const token = login.data?.data?.token;
    if (!token) throw new Error('No token');
    const headers = { Authorization: `Bearer ${token}` };

    const urls = {
      txn171: 'http://localhost:8000/api/transactions/171',
      payments_txn171: 'http://localhost:8000/api/transactions/payments/transaction/171',
      payments_shop1: 'http://localhost:8000/api/transactions/payments/outstanding?shopId=1',
      analytics_shop1: 'http://localhost:8000/api/transactions/analytics?shop_id=1',
      debug_shop1: 'http://localhost:8000/api/transactions/analytics/debug?shop_id=1',
      payments_to_farmer57: 'http://localhost:8000/api/transactions/farmers/57/payments',
      payments_by_buyer4: 'http://localhost:8000/api/transactions/buyers/4/payments',
    };

    for (const [k, url] of Object.entries(urls)) {
      try {
        const r = await axios.get(url, { headers });
        console.log('\n====', k, 'status', r.status, '====');
        console.log(JSON.stringify(r.data, null, 2));
      } catch (e) {
        console.error('\n====', k, 'ERROR ====');
        if (e.response) {
          console.error(e.response.status, JSON.stringify(e.response.data, null, 2));
        } else {
          console.error(e.message);
        }
      }
    }
  } catch (err) {
    console.error('Fatal:', err.message || err);
  }
}

collect();
