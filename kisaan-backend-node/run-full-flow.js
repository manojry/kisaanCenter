const axios = require('axios');

async function runFullFlow() {
  try {
    console.log('1) Logging in...');
    const login = await axios.post('http://localhost:8000/api/auth/login', { username: 'ramakanthreddy_0_107', password: 'reddy@123' });
    const token = login.data?.data?.token;
    if (!token) throw new Error('No token from login');
    const headers = { Authorization: `Bearer ${token}` };
    console.log('-> Logged in, token acquired');

    console.log('\n2) Running provided test script endpoints (transactions list, analytics, shop list, earnings)');
    try {
      const testScript = await require('./test-transaction-endpoints');
      // test-transaction-endpoints.js self-executes; we just required it to run earlier if needed
    } catch (e) {
      // ignore - the script runs when invoked directly; we'll call endpoints directly below as well
    }

    // 3) Discover buyer and farmer IDs from /api/users
    console.log('\n3) Fetching users to choose buyer/farmer');
    const usersResp = await axios.get('http://localhost:8000/api/users', { headers });
    const users = usersResp.data.data || [];
    let buyer = users.find(u => u.role === 'buyer' || u.role === 'BUYER');
    let farmer = users.find(u => u.role === 'farmer' || u.role === 'FARMER');
    if (!buyer) buyer = users[0];
    if (!farmer) farmer = users[1] || users[0];
    console.log('-> Selected buyer id:', buyer?.id, 'farmer id:', farmer?.id);

    // 4) Create a quick transaction
    console.log('\n4) Creating quick transaction (shop_id=1)');
    const quick = await axios.post('http://localhost:8000/api/transactions/quick', {
      shop_id: 1,
      farmer_id: Number(farmer?.id || 3),
      buyer_id: Number(buyer?.id || 2),
      quantity: 1,
      unit_price: 200,
      product_name: 'TestProduct',
      category_id: 1
    }, { headers });
    console.log('-> Quick transaction created status:', quick.status);
    const txn = quick.data.data || quick.data;
    console.log('-> Transaction:', txn);
    const txnId = txn.id || (Array.isArray(txn) ? txn[0]?.id : undefined);
    if (!txnId) throw new Error('Could not determine transaction id from quick transaction response');

    // 5) Create a partial buyer payment linked to transaction (partial amount)
    console.log('\n5) Creating partial BUYER->SHOP payment (₹50) linked to transaction', txnId);
    try {
      const buyPay = await axios.post('http://localhost:8000/api/transactions/payments', {
        transaction_id: txnId,
        payer_type: 'BUYER',
        payee_type: 'SHOP',
        amount: 50,
        method: 'CASH',
        counterparty_id: buyer?.id,
        shop_id: 1,
        status: 'PAID',
        payment_date: new Date().toISOString()
      }, { headers });
      console.log('-> Buyer payment response:', buyPay.status, buyPay.data);
    } catch (e) {
      console.error('-> Buyer payment error:', e.response?.status, e.response?.data || e.message);
    }

    // 6) Create a partial SHOP->FARMER payment linked to transaction (pay farmer earning partially)
    console.log('\n6) Creating partial SHOP->FARMER payment (₹30) linked to transaction', txnId);
    try {
      const shopFarmerPay = await axios.post('http://localhost:8000/api/transactions/payments', {
        transaction_id: txnId,
        payer_type: 'SHOP',
        payee_type: 'FARMER',
        amount: 30,
        method: 'BANK_TRANSFER',
        counterparty_id: farmer?.id,
        shop_id: 1,
        status: 'PAID',
        payment_date: new Date().toISOString()
      }, { headers });
      console.log('-> Shop->Farmer payment response:', shopFarmerPay.status, shopFarmerPay.data);
    } catch (e) {
      console.error('-> Shop->Farmer payment error:', e.response?.status, e.response?.data || e.message);
    }

    // 7) Fetch analytics and debug views for shop 1
    console.log('\n7) Fetch analytics and debug for shop_id=1');
    const analytics = await axios.get('http://localhost:8000/api/transactions/analytics?shop_id=1', { headers });
    console.log('-> Analytics status:', analytics.status);
    console.log('-> Analytics payload:', analytics.data.data);

    const debug = await axios.get('http://localhost:8000/api/transactions/analytics/debug?shop_id=1', { headers });
    console.log('-> Debug analytics status:', debug.status);
    console.log('-> Debug rows count:', debug.data.data.rows.length, 'total_pending_to_farmer:', debug.data.data.total_pending_to_farmer);

    // 8) Fetch payments for transaction
    console.log('\n8) Fetch payments for transaction');
    const paymentsForTxn = await axios.get(`http://localhost:8000/api/transactions/payments/transaction/${txnId}`, { headers });
    console.log('-> Payments for txn:', paymentsForTxn.status, paymentsForTxn.data.data || paymentsForTxn.data);

  } catch (err) {
    console.error('Flow error:', err.response?.status, err.response?.data || err.message);
  }
}

runFullFlow();
