// Comprehensive example: Farmer with expenses balance, transaction, and partial payment
const axios = require('axios');

async function demonstrateScenario() {
  try {
    console.log('=== KISAAN CENTER BUSINESS SCENARIO DEMONSTRATION ===\n');

    // Step 1: Login
    console.log('1. AUTHENTICATION');
    const login = await axios.post('http://localhost:8000/api/auth/login', {
      username: 'ramakanthreddy_0_107',
      password: 'reddy@123'
    });
    const token = login.data.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Logged in as owner\n');

    // Step 2: Check initial farmer balance and expenses
    console.log('2. INITIAL FARMER STATE');
    const farmerBalance = await axios.get('http://localhost:8000/api/balances/user/3', { headers });
    console.log('Farmer Balance API Response:');
    console.log(JSON.stringify(farmerBalance.data.data, null, 2));
    console.log('');

    // Step 3: Create transaction for 10,000
    console.log('3. TRANSACTION CREATION (₹10,000 goods sold)');
    const transactionData = {
      shop_id: 1,
      farmer_id: 3,
      buyer_id: 4,
      category_id: 1,
      product_name: 'High-value crops',
      quantity: 100,
      unit_price: 100, // 100 × 100 = 10,000
      transaction_date: new Date().toISOString(),
      notes: 'High-value crop transaction'
    };

    const transaction = await axios.post('http://localhost:8000/api/transactions', transactionData, { headers });
    console.log('Transaction Created:');
    console.log(`- ID: ${transaction.data.data.id}`);
    console.log(`- Total Amount: ₹${transaction.data.data.total_amount}`);
    console.log(`- Commission: ₹${transaction.data.data.commission_amount} (${transaction.data.data.commission_rate}%)`);
    console.log(`- Farmer Earning: ₹${transaction.data.data.farmer_earning}`);
    console.log(`- Status: ${transaction.data.data.status}`);
    console.log('');

    // Step 4: Check farmer balance after transaction
    console.log('4. FARMER BALANCE AFTER TRANSACTION');
    const farmerBalanceAfterTxn = await axios.get('http://localhost:8000/api/balances/user/3', { headers });
    console.log('Farmer Balance After Transaction:');
    console.log(JSON.stringify(farmerBalanceAfterTxn.data.data, null, 2));
    console.log('');

    // Step 5: Make partial payment of ₹5,000 to farmer
    console.log('5. PARTIAL PAYMENT (₹5,000 to farmer)');
    const paymentData = {
      farmer_id: 3,
      amount: 5000,
      description: 'Partial payment for high-value crops'
    };

    const payment = await axios.post('http://localhost:8000/api/balances/payment/farmer', paymentData, { headers });
    console.log('Payment Response:');
    console.log(JSON.stringify(payment.data.data, null, 2));
    console.log('');

    // Step 6: Check farmer balance after payment
    console.log('6. FARMER BALANCE AFTER PAYMENT');
    const farmerBalanceAfterPayment = await axios.get('http://localhost:8000/api/balances/user/3', { headers });
    console.log('Farmer Balance After Payment:');
    console.log(JSON.stringify(farmerBalanceAfterPayment.data.data, null, 2));
    console.log('');

    // Step 7: Check settlement information
    console.log('7. SETTLEMENT INFORMATION');
    const settlements = await axios.get('http://localhost:8000/api/settlements?shop_id=1&user_id=3&user_type=farmer', { headers });
    console.log('Settlements Data:');
    console.log(JSON.stringify(settlements.data.data, null, 2));
    console.log('');

    // Step 8: Check farmer net payable
    console.log('8. FARMER NET PAYABLE');
    const netPayable = await axios.get('http://localhost:8000/api/settlements/farmer-net-payable?shop_id=1&farmer_id=3', { headers });
    console.log('Net Payable Response:');
    console.log(JSON.stringify(netPayable.data.data, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.response ? error.response.data : error.message);
  }
}

demonstrateScenario();