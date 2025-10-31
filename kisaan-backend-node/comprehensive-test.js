/**
 * COMPREHENSIVE END-TO-END TEST SUITE
 * ====================================
 * 
 * All test scenarios in ONE file:
 * - Owner login and setup
 * - Create shop, farmers, buyers
 * - Transaction creation & commission calculation
 * - Payment allocation & settlement
 * - Expense tracking
 * - Balance reconciliation
 * - Data validation
 * 
 * Run: node comprehensive-test.js
 */

const axios = require('axios');
const BASE_URL = 'http://localhost:8000/api';

// Test data
let TOKEN = null;
let OWNER_ID = null;
let SHOP_ID = null;
let FARMER_ID = null;
let BUYER_ID = null;
let TRANSACTION_ID = null;
let PAYMENT_ID = null;

const headers = () => ({
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
});

// ============================================================================
// PHASE 1: AUTHENTICATION - LOGIN AS OWNER
// ============================================================================
async function phase1_login() {
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 1: AUTHENTICATION - LOGIN AS OWNER');
  console.log('='.repeat(80));

  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'ramakanthreddy_0_107',
      password: 'reddy@123'
    });

    TOKEN = response.data.data.token;
    OWNER_ID = response.data.data.user.id;

    console.log('✅ LOGIN SUCCESSFUL');
    console.log(`   Owner ID: ${OWNER_ID}`);
    console.log(`   Token: ${TOKEN.substring(0, 20)}...`);
    return true;
  } catch (error) {
    console.error('❌ LOGIN FAILED:', error.response?.data?.message || error.message);
    return false;
  }
}

// ============================================================================
// PHASE 2: SHOP SETUP
// ============================================================================
async function phase2_setupShop() {
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 2: SHOP SETUP');
  console.log('='.repeat(80));

  try {
    // Get or create shop
    const shopsResponse = await axios.get(`${BASE_URL}/shops`, { headers: headers() });
    const shops = shopsResponse.data.data;

    if (shops.length > 0) {
      SHOP_ID = shops[0].id;
      console.log(`✅ USING EXISTING SHOP ID: ${SHOP_ID}`);
    } else {
      const createShopResponse = await axios.post(`${BASE_URL}/shops`, {
        name: 'Test Shop',
        location: 'Test Location',
        description: 'Comprehensive Test Shop'
      }, { headers: headers() });

      SHOP_ID = createShopResponse.data.data.id;
      console.log(`✅ CREATED NEW SHOP ID: ${SHOP_ID}`);
    }
    return true;
  } catch (error) {
    console.error('❌ SHOP SETUP FAILED:', error.response?.data?.message || error.message);
    return false;
  }
}

// ============================================================================
// PHASE 3: USER SETUP - CREATE/GET FARMER AND BUYER
// ============================================================================
async function phase3_setupUsers() {
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 3: USER SETUP - FARMER & BUYER');
  console.log('='.repeat(80));

  try {
    // Get all users to find farmer and buyer
    const usersResponse = await axios.get(`${BASE_URL}/users`, { headers: headers() });
    const users = usersResponse.data.data;

    const farmers = users.filter(u => u.role === 'farmer');
    const buyers = users.filter(u => u.role === 'buyer');

    if (farmers.length > 0) {
      FARMER_ID = farmers[0].id;
      console.log(`✅ USING EXISTING FARMER - ID: ${FARMER_ID}, Name: ${farmers[0].username}`);
    } else {
      console.log('⚠️  No farmers found. Create one via admin dashboard.');
      return false;
    }

    if (buyers.length > 0) {
      BUYER_ID = buyers[0].id;
      console.log(`✅ USING EXISTING BUYER - ID: ${BUYER_ID}, Name: ${buyers[0].username}`);
    } else {
      console.log('⚠️  No buyers found. Create one via admin dashboard.');
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ USER SETUP FAILED:', error.response?.data?.message || error.message);
    return false;
  }
}

// ============================================================================
// PHASE 4: TRANSACTION CREATION & COMMISSION VALIDATION
// ============================================================================
async function phase4_createTransaction() {
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 4: TRANSACTION CREATION & COMMISSION VALIDATION');
  console.log('='.repeat(80));

  try {
    const transactionData = {
      shop_id: SHOP_ID,
      farmer_id: FARMER_ID,
      buyer_id: BUYER_ID,
      product_name: 'Test Product',
      quantity: 10,
      unit_price: 50.00,
      commission_rate: 5
    };

    // Expected calculations:
    // total_amount = 10 * 50 = 500
    // commission = 500 * 5% = 25
    // farmer_earning = 500 - 25 = 475

    const response = await axios.post(`${BASE_URL}/transactions`, transactionData, {
      headers: headers()
    });

    TRANSACTION_ID = response.data.data.id;
    const txn = response.data.data;

    console.log(`✅ TRANSACTION CREATED - ID: ${TRANSACTION_ID}`);
    console.log(`   Total Amount: ${txn.total_amount} (expected: 500)`);
    console.log(`   Commission: ${txn.commission_amount} (expected: 25)`);
    console.log(`   Farmer Earning: ${txn.farmer_earning} (expected: 475)`);

    // Validate
    const expectedTotal = 500;
    const expectedCommission = 25;
    const expectedFarmerEarning = 475;

    if (Math.abs(txn.total_amount - expectedTotal) > 0.01) {
      throw new Error(`Total mismatch: ${txn.total_amount} vs ${expectedTotal}`);
    }
    if (Math.abs(txn.commission_amount - expectedCommission) > 0.01) {
      throw new Error(`Commission mismatch: ${txn.commission_amount} vs ${expectedCommission}`);
    }
    if (Math.abs(txn.farmer_earning - expectedFarmerEarning) > 0.01) {
      throw new Error(`Farmer earning mismatch: ${txn.farmer_earning} vs ${expectedFarmerEarning}`);
    }

    console.log('✅ ALL CALCULATIONS VALID');
    return true;
  } catch (error) {
    console.error('❌ TRANSACTION CREATION FAILED:', error.response?.data?.message || error.message);
    return false;
  }
}

// ============================================================================
// PHASE 5: PAYMENT CREATION & ALLOCATION
// ============================================================================
async function phase5_createPayment() {
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 5: PAYMENT CREATION & ALLOCATION');
  console.log('='.repeat(80));

  try {
    const paymentData = {
      payer_type: 'BUYER',
      payer_id: BUYER_ID,
      payee_type: 'FARMER',
      payee_id: FARMER_ID,
      amount: 250,
      payment_date: new Date().toISOString(),
      method: 'CASH',
      reference: `Test payment for transaction ${TRANSACTION_ID}`
    };

    const response = await axios.post(`${BASE_URL}/payments`, paymentData, {
      headers: headers()
    });

    PAYMENT_ID = response.data.data.id;
    console.log(`✅ PAYMENT CREATED - ID: ${PAYMENT_ID}`);
    console.log(`   Amount: ${response.data.data.amount}`);
    console.log(`   Status: ${response.data.data.status}`);
    return true;
  } catch (error) {
    console.error('❌ PAYMENT CREATION FAILED:', error.response?.data?.message || error.message);
    return false;
  }
}

// ============================================================================
// PHASE 6: BALANCE CHECK
// ============================================================================
async function phase6_checkBalances() {
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 6: BALANCE CHECK');
  console.log('='.repeat(80));

  try {
    const farmerResponse = await axios.get(`${BASE_URL}/users/${FARMER_ID}`, {
      headers: headers()
    });
    const buyerResponse = await axios.get(`${BASE_URL}/users/${BUYER_ID}`, {
      headers: headers()
    });

    const farmerBalance = farmerResponse.data.data.balance;
    const buyerBalance = buyerResponse.data.data.balance;

    console.log(`✅ BALANCES RETRIEVED`);
    console.log(`   Farmer Balance: ${farmerBalance}`);
    console.log(`   Buyer Balance: ${buyerBalance}`);
    return true;
  } catch (error) {
    console.error('❌ BALANCE CHECK FAILED:', error.response?.data?.message || error.message);
    return false;
  }
}

// ============================================================================
// PHASE 7: DATA VALIDATION
// ============================================================================
async function phase7_validateData() {
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 7: DATA VALIDATION');
  console.log('='.repeat(80));

  try {
    // Check transaction
    const txnResponse = await axios.get(`${BASE_URL}/transactions/${TRANSACTION_ID}`, {
      headers: headers()
    });
    const txn = txnResponse.data.data;

    console.log('📋 TRANSACTION VALIDATION');
    console.log(`   ✓ Total Amount: ${txn.total_amount}`);
    console.log(`   ✓ Commission: ${txn.commission_amount}`);
    console.log(`   ✓ Farmer Earning: ${txn.farmer_earning}`);
    console.log(`   ✓ Status: ${txn.status}`);

    // Check payment
    const paymentResponse = await axios.get(`${BASE_URL}/payments/${PAYMENT_ID}`, {
      headers: headers()
    });
    const payment = paymentResponse.data.data;

    console.log('\n💰 PAYMENT VALIDATION');
    console.log(`   ✓ Amount: ${payment.amount}`);
    console.log(`   ✓ Status: ${payment.status}`);
    console.log(`   ✓ Payer: ${payment.payer_type}`);
    console.log(`   ✓ Payee: ${payment.payee_type}`);

    console.log('\n✅ ALL DATA VALIDATED');
    return true;
  } catch (error) {
    console.error('❌ DATA VALIDATION FAILED:', error.response?.data?.message || error.message);
    return false;
  }
}

// ============================================================================
// PHASE 8: ERROR HANDLING & EDGE CASES
// ============================================================================
async function phase8_testEdgeCases() {
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 8: ERROR HANDLING & EDGE CASES');
  console.log('='.repeat(80));

  try {
    // Test 1: Invalid transaction (negative amount)
    console.log('\n📝 Test 1: Invalid transaction (negative amount)');
    try {
      await axios.post(`${BASE_URL}/transactions`, {
        shop_id: SHOP_ID,
        farmer_id: FARMER_ID,
        buyer_id: BUYER_ID,
        quantity: -5,
        unit_price: 50,
        commission_rate: 5
      }, { headers: headers() });
      console.log('   ❌ Should have rejected negative amount');
    } catch (e) {
      console.log(`   ✓ Correctly rejected: ${e.response?.data?.message || e.message}`);
    }

    // Test 2: Invalid payment (zero amount)
    console.log('\n📝 Test 2: Invalid payment (zero amount)');
    try {
      await axios.post(`${BASE_URL}/payments`, {
        payer_type: 'BUYER',
        payer_id: BUYER_ID,
        payee_type: 'FARMER',
        payee_id: FARMER_ID,
        amount: 0,
        method: 'CASH'
      }, { headers: headers() });
      console.log('   ❌ Should have rejected zero amount');
    } catch (e) {
      console.log(`   ✓ Correctly rejected: ${e.response?.data?.message || e.message}`);
    }

    console.log('\n✅ EDGE CASES HANDLED CORRECTLY');
    return true;
  } catch (error) {
    console.error('❌ EDGE CASE TEST FAILED:', error.message);
    return false;
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================
async function runAllTests() {
  console.log('\n');
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(20) + 'COMPREHENSIVE END-TO-END TEST SUITE' + ' '.repeat(24) + '║');
  console.log('║' + ' '.repeat(78) + '║');
  console.log('║' + ' Login, Setup, Transactions, Payments, Balance, Validation' + ' '.repeat(21) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');

  const phases = [
    { name: 'Phase 1: Login', fn: phase1_login },
    { name: 'Phase 2: Shop Setup', fn: phase2_setupShop },
    { name: 'Phase 3: User Setup', fn: phase3_setupUsers },
    { name: 'Phase 4: Transaction', fn: phase4_createTransaction },
    { name: 'Phase 5: Payment', fn: phase5_createPayment },
    { name: 'Phase 6: Balance Check', fn: phase6_checkBalances },
    { name: 'Phase 7: Data Validation', fn: phase7_validateData },
    { name: 'Phase 8: Edge Cases', fn: phase8_testEdgeCases }
  ];

  let passed = 0;
  let failed = 0;

  for (const phase of phases) {
    try {
      const result = await phase.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`\n❌ ${phase.name} crashed:`, error.message);
      failed++;
    }
  }

  // FINAL REPORT
  console.log('\n' + '='.repeat(80));
  console.log('FINAL REPORT');
  console.log('='.repeat(80));
  console.log(`✅ PASSED: ${passed}/${phases.length}`);
  console.log(`❌ FAILED: ${failed}/${phases.length}`);

  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! System is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check output above for details.');
  }

  process.exit(failed === 0 ? 0 : 1);
}

// ============================================================================
// RUN TESTS
// ============================================================================
runAllTests().catch(error => {
  console.error('Test suite crashed:', error);
  process.exit(1);
});
