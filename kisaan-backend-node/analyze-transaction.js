// Comprehensive balance flow test
const axios = require('axios');

// Test configuration
const FARMER_ID = 57; // rk_farmer_2_837
const BUYER_ID = 4;   // buyer1_2_580
const SHOP_ID = 1;

let token;
let headers;

async function login() {
  console.log('🔐 LOGGING IN...');
  const username = process.env.DB_TEST_USER || 'REDACTED_USER';
  const password = process.env.DB_TEST_PASSWORD || 'REDACTED_PASSWORD';
  const login = await axios.post('http://localhost:8000/api/auth/login', {
    username,
    password
  });
  token = login.data.data.token;
  headers = { Authorization: `Bearer ${token}` };
  console.log('✅ Logged in successfully\n');
}

async function getBalance(userId, label) {
  const users = await axios.get('http://localhost:8000/api/users', { headers });
  const usersArray = users.data.data.users || users.data.data || users.data;
  const user = usersArray.find(u => u.id === userId.toString());
  const balance = user ? Number(user.balance) : 0;
  const cumulative = user ? Number(user.cumulative_value) : 0;
  console.log(`   ${label}: Balance = ₹${balance.toFixed(2)}, Cumulative = ₹${cumulative.toFixed(2)}`);
  return { balance, cumulative };
}

async function clearAllPayments(userId, userType) {
  console.log(`🗑️  CLEARING ALL PAYMENTS FOR ${userType.toUpperCase()} ${userId}...`);
  try {
    const endpoint = userType === 'farmer' 
      ? `http://localhost:8000/api/payments/farmers/${userId}`
      : `http://localhost:8000/api/payments/buyers/${userId}`;
    
    const paymentsResp = await axios.get(endpoint, { headers });
    const payments = paymentsResp.data.data.payments || [];
    
    console.log(`   Found ${payments.length} existing payments`);
    
    // Delete each payment (if delete endpoint exists) or skip
    console.log('   (Payments cleared - balance should reflect only unpaid transactions)\n');
  } catch (error) {
    console.log('   No payments to clear or endpoint not available\n');
  }
}

async function payAllBalance(userId, userType) {
  console.log(`💰 PAYING ALL BALANCE FOR ${userType.toUpperCase()} ${userId}...`);
  const balanceBefore = await getBalance(userId, 'Before payment');
  
  if (balanceBefore.balance <= 0) {
    console.log('   ℹ️  Balance already 0 or negative, no payment needed\n');
    return;
  }

  const paymentPayload = {
    payer_type: 'shop',
    payee_type: userType,
    amount: balanceBefore.balance,
    method: 'cash',
    status: 'PAID',
    notes: `Clear all balance for ${userType} ${userId}`,
    counterparty_id: userId,
    shop_id: SHOP_ID,
    payment_date: new Date().toISOString()
  };

  const paymentResp = await axios.post('http://localhost:8000/api/payments', paymentPayload, { headers });
  console.log(`   ✅ Payment created: ₹${balanceBefore.balance}`);
  
  const balanceAfter = await getBalance(userId, 'After payment');
  const expected = 0;
  const actual = balanceAfter.balance;
  
  if (Math.abs(actual - expected) < 0.01) {
    console.log(`   ✅ PASS: Balance correctly cleared (expected: ₹${expected}, actual: ₹${actual})\n`);
  } else {
    console.log(`   ❌ FAIL: Balance not cleared correctly (expected: ₹${expected}, actual: ₹${actual})\n`);
  }
}

async function createFullyPaidTransaction() {
  console.log('📝 TEST 1: CREATE FULLY PAID TRANSACTION');
  console.log('   Transaction: 100 units × ₹100 = ₹10,000 (10% commission)');
  console.log('   Farmer earning: ₹9,000');
  console.log('   Buyer pays: ₹10,000 (FULL)');
  console.log('   Shop pays farmer: ₹9,000 (FULL)\n');

  const farmerBefore = await getBalance(FARMER_ID, 'Farmer BEFORE');
  const buyerBefore = await getBalance(BUYER_ID, 'Buyer BEFORE');

  const txnPayload = {
    shop_id: SHOP_ID,
    farmer_id: FARMER_ID,
    buyer_id: BUYER_ID,
    category_id: 1,
    product_name: 'Roses',
    quantity: 100,
    unit_price: 100,
    commission_rate: 10,
    payments: [
      {
        payer_type: 'buyer',
        payee_type: 'shop',
        amount: 10000,
        method: 'cash',
        status: 'PAID',
        payment_date: new Date().toISOString()
      },
      {
        payer_type: 'shop',
        payee_type: 'farmer',
        amount: 9000,
        method: 'cash',
        status: 'PAID',
        payment_date: new Date().toISOString()
      }
    ]
  };

  const txnResp = await axios.post('http://localhost:8000/api/transactions', txnPayload, { headers });
  const txn = txnResp.data.data;
  console.log(`   ✅ Transaction created: ID=${txn.id}\n`);

  const farmerAfter = await getBalance(FARMER_ID, 'Farmer AFTER');
  const buyerAfter = await getBalance(BUYER_ID, 'Buyer AFTER');

  // Expected changes
  const expectedFarmerBalanceChange = 0; // Fully paid, so balance should not change
  const expectedFarmerCumulativeChange = 9000; // Always increases
  const expectedBuyerBalanceChange = 0; // Fully paid
  const expectedBuyerCumulativeChange = 10000; // Always increases

  const actualFarmerBalanceChange = farmerAfter.balance - farmerBefore.balance;
  const actualFarmerCumulativeChange = farmerAfter.cumulative - farmerBefore.cumulative;
  const actualBuyerBalanceChange = buyerAfter.balance - buyerBefore.balance;
  const actualBuyerCumulativeChange = buyerAfter.cumulative - buyerBefore.cumulative;

  console.log('   📊 VERIFICATION:');
  console.log(`   Farmer balance change: ${actualFarmerBalanceChange} (expected: ${expectedFarmerBalanceChange})`);
  console.log(`   Farmer cumulative change: ${actualFarmerCumulativeChange} (expected: ${expectedFarmerCumulativeChange})`);
  console.log(`   Buyer balance change: ${actualBuyerBalanceChange} (expected: ${expectedBuyerBalanceChange})`);
  console.log(`   Buyer cumulative change: ${actualBuyerCumulativeChange} (expected: ${expectedBuyerCumulativeChange})`);

  if (Math.abs(actualFarmerBalanceChange - expectedFarmerBalanceChange) < 0.01 &&
      Math.abs(actualBuyerBalanceChange - expectedBuyerBalanceChange) < 0.01) {
    console.log('   ✅ PASS: Fully paid transaction does not change balances\n');
  } else {
    console.log('   ❌ FAIL: Fully paid transaction changed balances incorrectly\n');
  }

  return txn.id;
}

async function addExpense(userId, amount) {
  console.log(`📝 TEST 2: ADD EXPENSE`);
  console.log(`   Adding ₹${amount} expense for farmer ${userId}\n`);

  const farmerBefore = await getBalance(userId, 'Farmer BEFORE');

  const expensePayload = {
    user_id: userId,
    amount: amount,
    description: 'Test expense',
    shop_id: SHOP_ID
  };

  const expenseResp = await axios.post('http://localhost:8000/api/expenses', expensePayload, { headers });
  console.log(`   ✅ Expense created: ID=${expenseResp.data.data.id}\n`);

  const farmerAfter = await getBalance(userId, 'Farmer AFTER');

  const expectedBalanceChange = amount; // Expense increases farmer balance (farmer owes shop)
  const actualBalanceChange = farmerAfter.balance - farmerBefore.balance;

  console.log('   📊 VERIFICATION:');
  console.log(`   Farmer balance change: ${actualBalanceChange} (expected: ${expectedBalanceChange})`);

  if (Math.abs(actualBalanceChange - expectedBalanceChange) < 0.01) {
    console.log('   ✅ PASS: Expense correctly increased farmer balance\n');
  } else {
    console.log('   ❌ FAIL: Expense did not increase balance correctly\n');
  }

  return expenseResp.data.data.id;
}

async function createPartiallyPaidTransaction() {
  console.log('📝 TEST 3: CREATE PARTIALLY PAID TRANSACTION');
  console.log('   Transaction: 50 units × ₹100 = ₹5,000 (10% commission)');
  console.log('   Farmer earning: ₹4,500');
  console.log('   Buyer pays: ₹3,000 (PARTIAL - 60%)');
  console.log('   Shop pays farmer: ₹2,000 (PARTIAL - 44%)\n');

  const farmerBefore = await getBalance(FARMER_ID, 'Farmer BEFORE');
  const buyerBefore = await getBalance(BUYER_ID, 'Buyer BEFORE');

  const txnPayload = {
    shop_id: SHOP_ID,
    farmer_id: FARMER_ID,
    buyer_id: BUYER_ID,
    category_id: 1,
    product_name: 'Roses',
    quantity: 50,
    unit_price: 100,
    commission_rate: 10,
    payments: [
      {
        payer_type: 'buyer',
        payee_type: 'shop',
        amount: 3000,
        method: 'cash',
        status: 'PAID',
        payment_date: new Date().toISOString()
      },
      {
        payer_type: 'shop',
        payee_type: 'farmer',
        amount: 2000,
        method: 'cash',
        status: 'PAID',
        payment_date: new Date().toISOString()
      }
    ]
  };

  const txnResp = await axios.post('http://localhost:8000/api/transactions', txnPayload, { headers });
  const txn = txnResp.data.data;
  console.log(`   ✅ Transaction created: ID=${txn.id}\n`);

  const farmerAfter = await getBalance(FARMER_ID, 'Farmer AFTER');
  const buyerAfter = await getBalance(BUYER_ID, 'Buyer AFTER');

  // Expected changes
  const expectedFarmerBalanceChange = 4500 - 2000; // Earned 4500, paid 2000, so balance increases by 2500
  const expectedFarmerCumulativeChange = 4500;
  const expectedBuyerBalanceChange = 5000 - 3000; // Owes 5000, paid 3000, so balance increases by 2000
  const expectedBuyerCumulativeChange = 5000;

  const actualFarmerBalanceChange = farmerAfter.balance - farmerBefore.balance;
  const actualFarmerCumulativeChange = farmerAfter.cumulative - farmerBefore.cumulative;
  const actualBuyerBalanceChange = buyerAfter.balance - buyerBefore.balance;
  const actualBuyerCumulativeChange = buyerAfter.cumulative - buyerBefore.cumulative;

  console.log('   📊 VERIFICATION:');
  console.log(`   Farmer balance change: ${actualFarmerBalanceChange} (expected: ${expectedFarmerBalanceChange})`);
  console.log(`   Farmer cumulative change: ${actualFarmerCumulativeChange} (expected: ${expectedFarmerCumulativeChange})`);
  console.log(`   Buyer balance change: ${actualBuyerBalanceChange} (expected: ${expectedBuyerBalanceChange})`);
  console.log(`   Buyer cumulative change: ${actualBuyerCumulativeChange} (expected: ${expectedBuyerCumulativeChange})`);

  if (Math.abs(actualFarmerBalanceChange - expectedFarmerBalanceChange) < 0.01 &&
      Math.abs(actualBuyerBalanceChange - expectedBuyerBalanceChange) < 0.01) {
    console.log('   ✅ PASS: Partial payment transaction correctly updated balances\n');
  } else {
    console.log('   ❌ FAIL: Partial payment transaction balance calculation incorrect\n');
  }

  return txn.id;
}

async function runComprehensiveTest() {
  try {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('   COMPREHENSIVE BALANCE CALCULATION TEST');
    console.log('═══════════════════════════════════════════════════════════\n');

    await login();

    console.log('📊 INITIAL STATE:');
    await getBalance(FARMER_ID, 'Farmer initial');
    await getBalance(BUYER_ID, 'Buyer initial');
    console.log('');

    // Step 1: Clear all existing balance
    console.log('═══════════════════════════════════════════════════════════');
    console.log('STEP 1: CLEAR ALL EXISTING BALANCES');
    console.log('═══════════════════════════════════════════════════════════\n');
    await payAllBalance(FARMER_ID, 'farmer');
    await payAllBalance(BUYER_ID, 'buyer');

    // Step 2: Create fully paid transaction
    console.log('═══════════════════════════════════════════════════════════');
    console.log('STEP 2: CREATE FULLY PAID TRANSACTION');
    console.log('═══════════════════════════════════════════════════════════\n');
    const txn1 = await createFullyPaidTransaction();

    // Step 3: Add expense
    console.log('═══════════════════════════════════════════════════════════');
    console.log('STEP 3: ADD EXPENSE');
    console.log('═══════════════════════════════════════════════════════════\n');
    const expense = await addExpense(FARMER_ID, 500);

    // Step 4: Pay expense
    console.log('═══════════════════════════════════════════════════════════');
    console.log('STEP 4: PAY THE EXPENSE');
    console.log('═══════════════════════════════════════════════════════════\n');
    await payAllBalance(FARMER_ID, 'farmer');

    // Step 5: Create partially paid transaction
    console.log('═══════════════════════════════════════════════════════════');
    console.log('STEP 5: CREATE PARTIALLY PAID TRANSACTION');
    console.log('═══════════════════════════════════════════════════════════\n');
    const txn2 = await createPartiallyPaidTransaction();

  // Step 6: Edge case - Farmer already has negative balance (advance taken)
  console.log('═══════════════════════════════════════════════════════════');
  console.log('STEP 6: FARMER NEGATIVE BALANCE EDGE CASE');
  console.log('═══════════════════════════════════════════════════════════\n');
  await testFarmerNegativeBalanceCase(FARMER_ID);

    console.log('═══════════════════════════════════════════════════════════');
    console.log('   TEST COMPLETE');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('📊 FINAL STATE:');
    await getBalance(FARMER_ID, 'Farmer final');
    await getBalance(BUYER_ID, 'Buyer final');

  } catch (error) {
    console.error('❌ ERROR:', error.response ? error.response.data : error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

async function testFarmerNegativeBalanceCase(userId) {
  console.log('🧪 EDGE CASE: Farmer negative balance scenario');
  const before = await getBalance(userId, 'Farmer BEFORE edge-case');

  if (before.balance >= 0) {
    console.log('   ℹ️  Farmer does not currently have a negative balance. To simulate the edge case, adding an expense of ₹200000 to push balance negative.');
    await addExpense(userId, 200000);
  }

  const before2 = await getBalance(userId, 'Farmer BEFORE payment attempt');

  // Owner/shop makes a standalone payment to farmer
  const paymentAmount = Math.min(100000, Math.abs(before2.balance));
  console.log(`   ➤ Attempting a SHOP -> FARMER standalone payment of ₹${paymentAmount}`);

  const paymentPayload = {
    payer_type: 'shop',
    payee_type: 'farmer',
    amount: paymentAmount,
    method: 'cash',
    status: 'PAID',
    counterparty_id: userId,
    shop_id: SHOP_ID,
    payment_date: new Date().toISOString()
  };

  try {
    const paymentResp = await axios.post('http://localhost:8000/api/payments', paymentPayload, { headers });
    console.log('   ✅ Payment created', paymentResp.data?.data || paymentResp.data || 'OK');
  } catch (err) {
    console.error('   ❌ Payment creation failed:', err.response ? err.response.data : err.message);
  }

  const after = await getBalance(userId, 'Farmer AFTER payment attempt');

  console.log('   📊 EDGE CASE VERIFICATION:');
  console.log(`   Balance BEFORE: ₹${before2.balance.toFixed(2)}`);
  console.log(`   Balance AFTER : ₹${after.balance.toFixed(2)}`);

  if (after.balance > before2.balance) {
    console.log('   ✅ PASS: Farmer balance moved toward zero (less negative) after owner payment');
  } else if (after.balance === before2.balance) {
    console.log('   ⚠️  NO-OP: Owner payment did not change stored balance (check FIFO/settlement behavior)');
  } else {
    console.log('   ❌ FAIL: Farmer balance became more negative after owner payment — this is undesirable');
  }
  console.log('');
}

runComprehensiveTest();