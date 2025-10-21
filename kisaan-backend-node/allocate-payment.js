const axios = require('axios');

async function run() {
  try {
    const login = await axios.post('http://localhost:8000/api/auth/login', { username: 'ramakanthreddy_0_107', password: 'reddy@123' });
    const token = login.data?.data?.token;
    if (!token) throw new Error('No token');
    const headers = { Authorization: `Bearer ${token}` };

    const paymentId = 485; // from previous run (buyer partial payment)
    const txnId = 172;

    console.log('Dry-run allocation for payment', paymentId);
    try {
      const dry = await axios.post(`http://localhost:8000/api/transactions/payments/${paymentId}/allocate`, { allocations: [{ transaction_id: txnId, amount: 50 }], dryRun: true }, { headers });
      console.log('Dry-run result:', dry.status, dry.data);
    } catch (e) {
      console.error('Dry-run error:', e.response?.status, e.response?.data || e.message);
    }

    console.log('Applying allocation');
    try {
      const res = await axios.post(`http://localhost:8000/api/transactions/payments/${paymentId}/allocate`, { allocations: [{ transaction_id: txnId, amount: 50 }] }, { headers });
      console.log('Apply result:', res.status, res.data);
    } catch (e) {
      console.error('Apply error:', e.response?.status, e.response?.data || e.message);
    }

    console.log('Fetching allocations/payments for transaction', txnId);
    const payments = await axios.get(`http://localhost:8000/api/transactions/payments/transaction/${txnId}`, { headers });
    console.log('Payments for txn:', payments.status, payments.data.data || payments.data);
  } catch (err) {
    console.error('Fatal:', err.response?.status, err.response?.data || err.message);
  }
}

run();
