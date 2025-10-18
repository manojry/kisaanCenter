// COMPREHENSIVE STEP-BY-STEP TRANSACTION FLOW TEST
// This will create a real scenario and trace through every step

const axios = require('axios');
const { Pool } = require('pg');

const BASE_URL = 'http://localhost:3000/api';
let authToken = null;

// Database connection
const pool = new Pool({
  host: 'xxxxxxx',
  database: 'kisaan_dev',
  user: 'postgres',
  password: 'yyyyyyy',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

async function makeRequest(method, url, data = null) {
  const config = {
    method,
    url: `${BASE_URL}${url}`,
    headers: { 
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` })
    }
  };
  
  if (data) config.data = data;
  
  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ ${method} ${url} failed:`, error.response?.data || error.message);
    throw error;
  }
}

async function queryDatabase(query, params = []) {
  try {
    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Database query failed:', error.message);
    throw error;
  }
}

async function checkUserBalance(userId, role) {
  const result = await queryDatabase('SELECT username, balance, cumulative_value FROM kisaan_users WHERE id = $1', [userId]);
  if (result.length > 0) {
    const user = result[0];
    console.log(`  ${role} (${user.username}): Balance=${user.balance}, Cumulative=${user.cumulative_value}`);
    return {
      balance: parseFloat(user.balance || 0),
      cumulative: parseFloat(user.cumulative_value || 0)
    };
  }
  return { balance: 0, cumulative: 0 };
}

async function checkTransactions() {
  const result = await queryDatabase(`
    SELECT id, shop_id, farmer_id, buyer_id, total_sale_value, shop_commission, farmer_earning 
    FROM kisaan_transactions 
    ORDER BY created_at DESC 
    LIMIT 5
  `);
  console.log('  Recent Transactions:');
  result.forEach(tx => {
    console.log(`    TX ${tx.id}: Sale=${tx.total_sale_value}, Commission=${tx.shop_commission}, FarmerEarning=${tx.farmer_earning}`);
  });
  return result;
}

async function checkPayments() {
  const result = await queryDatabase(`
    SELECT id, transaction_id, payer_type, payee_type, amount, counterparty_id 
    FROM kisaan_payments 
    ORDER BY created_at DESC 
    LIMIT 10
  `);
  console.log('  Recent Payments:');
  result.forEach(payment => {
    console.log(`    Payment ${payment.id}: ${payment.payer_type}→${payment.payee_type}, Amount=${payment.amount}, CounterpartyID=${payment.counterparty_id}`);
  });
  return result;
}

async function checkPaymentAllocations() {
  const result = await queryDatabase(`
    SELECT pa.id, pa.payment_id, pa.transaction_id, pa.allocated_amount,
           p.payer_type, p.payee_type, p.amount as payment_amount
    FROM kisaan_payment_allocations pa
    JOIN kisaan_payments p ON pa.payment_id = p.id
    ORDER BY pa.created_at DESC 
    LIMIT 10
  `);
  console.log('  Recent Payment Allocations:');
  result.forEach(alloc => {
    console.log(`    Allocation ${alloc.id}: Payment ${alloc.payment_id} (${alloc.payer_type}→${alloc.payee_type}) → TX ${alloc.transaction_id}, Allocated=${alloc.allocated_amount}/${alloc.payment_amount}`);
  });
  return result;
}

async function runStepByStepTest() {
  console.log('🔍 === COMPREHENSIVE STEP-BY-STEP TRANSACTION FLOW TEST ===\n');
  
  try {
    // Step 1: Setup - Login and get existing users
    console.log('📋 STEP 1: SETUP');
    const loginResponse = await makeRequest('POST', '/auth/login', {
      username: 'superadmin',
      password: 'superadminpass'
    });
    authToken = loginResponse.token;
    console.log('✅ Logged in as superadmin');
    
    // Get existing shop, farmer, buyer from database
    const shops = await queryDatabase('SELECT id, owner_id FROM kisaan_shops LIMIT 1');
    const farmers = await queryDatabase("SELECT id, username FROM kisaan_users WHERE role = 'farmer' LIMIT 1");
    const buyers = await queryDatabase("SELECT id, username FROM kisaan_users WHERE role = 'buyer' LIMIT 1");
    
    if (shops.length === 0 || farmers.length === 0 || buyers.length === 0) {
      throw new Error('Missing required entities. Please run setup first.');
    }
    
    const shopId = shops[0].id;
    const farmerId = farmers[0].id;
    const buyerId = buyers[0].id;
    
    console.log(`  Shop ID: ${shopId}`);
    console.log(`  Farmer ID: ${farmerId} (${farmers[0].username})`);
    console.log(`  Buyer ID: ${buyerId} (${buyers[0].username})`);
    
    // Step 2: Check initial state
    console.log('\n📊 STEP 2: INITIAL STATE');
    console.log('Before transaction:');
    const initialFarmerBalance = await checkUserBalance(farmerId, 'Farmer');
    const initialBuyerBalance = await checkUserBalance(buyerId, 'Buyer');
    
    // Step 3: Create transaction with partial payments
    console.log('\n🔄 STEP 3: CREATE TRANSACTION WITH PARTIAL PAYMENTS');
    const transactionPayload = {
      shop_id: shopId,
      farmer_id: farmerId,
      buyer_id: buyerId,
      category_id: 1,
      product_name: "Roses",
      quantity: 100,
      unit_price: 50,
      payments: [
        {
          payer_type: "BUYER",
          payee_type: "SHOP", 
          amount: 3000,  // Buyer pays 3000 out of 5000 total (60%)
          method: "CASH",
          status: "PAID"
        },
        {
          payer_type: "SHOP",
          payee_type: "FARMER",
          amount: 2000,  // Shop pays 2000 to farmer
          method: "CASH", 
          status: "PAID"
        }
      ]
    };
    
    console.log('Transaction payload:');
    console.log(JSON.stringify(transactionPayload, null, 2));
    
    // Expected calculations:
    console.log('\n🧮 Expected calculations:');
    console.log('  Total sale: 100 × 50 = 5000');
    console.log('  Commission (5%): 5000 × 0.05 = 250');
    console.log('  Farmer earning: 5000 - 250 = 4750');
    console.log('  Buyer payment: 3000 (60% of total)');
    console.log('  Farmer payment: 2000');
    
    // Create the transaction
    const transactionResponse = await makeRequest('POST', '/transactions', transactionPayload);
    const transactionId = transactionResponse.id || transactionResponse.data?.id;
    console.log(`✅ Transaction created with ID: ${transactionId}`);
    
    // Step 4: Check database state after transaction
    console.log('\n🗄️ STEP 4: DATABASE STATE AFTER TRANSACTION');
    await checkTransactions();
    await checkPayments();
    await checkPaymentAllocations();
    
    // Step 5: Check user balances after transaction
    console.log('\n💰 STEP 5: USER BALANCES AFTER TRANSACTION');
    console.log('After transaction creation:');
    const afterTxFarmerBalance = await checkUserBalance(farmerId, 'Farmer');
    const afterTxBuyerBalance = await checkUserBalance(buyerId, 'Buyer');
    
    // Step 6: Analysis of balance changes
    console.log('\n📈 STEP 6: BALANCE CHANGE ANALYSIS');
    console.log('Farmer balance changes:');
    console.log(`  Initial: ${initialFarmerBalance.balance}`);
    console.log(`  After TX: ${afterTxFarmerBalance.balance}`);
    console.log(`  Change: ${afterTxFarmerBalance.balance - initialFarmerBalance.balance}`);
    console.log(`  Expected: 4750 (earned) - 2000 (paid) = 2750`);
    
    console.log('\nBuyer balance changes:');
    console.log(`  Initial: ${initialBuyerBalance.balance}`);
    console.log(`  After TX: ${afterTxBuyerBalance.balance}`);
    console.log(`  Change: ${afterTxBuyerBalance.balance - initialBuyerBalance.balance}`);
    console.log(`  Expected: 5000 (owes) - 3000 (paid) = 2000`);
    
    // Step 7: Commission analysis
    console.log('\n💼 STEP 7: COMMISSION ANALYSIS');
    const commissionData = await queryDatabase(`
      SELECT 
        t.id as transaction_id,
        t.total_sale_value,
        t.shop_commission,
        COALESCE(SUM(CASE WHEN pa.allocated_amount IS NOT NULL THEN pa.allocated_amount ELSE 0 END), 0) as buyer_paid_allocated
      FROM kisaan_transactions t
      LEFT JOIN kisaan_payment_allocations pa ON t.id = pa.transaction_id
      WHERE t.id = $1
      GROUP BY t.id, t.total_sale_value, t.shop_commission
    `, [transactionId]);
    
    if (commissionData.length > 0) {
      const tx = commissionData[0];
      const realizedCommission = tx.total_sale_value > 0 ? 
        (tx.buyer_paid_allocated / tx.total_sale_value) * tx.shop_commission : 0;
      const commissionDue = tx.shop_commission - realizedCommission;
      
      console.log(`  Transaction ${tx.transaction_id}:`);
      console.log(`    Total sale: ${tx.total_sale_value}`);
      console.log(`    Total commission: ${tx.shop_commission}`);
      console.log(`    Buyer paid (allocated): ${tx.buyer_paid_allocated}`);
      console.log(`    Realized commission: ${realizedCommission.toFixed(2)}`);
      console.log(`    Commission due: ${commissionDue.toFixed(2)}`);
    }
    
    // Step 8: Make additional payment to test balance updates
    console.log('\n💳 STEP 8: ADDITIONAL PAYMENT TEST');
    console.log('Making additional farmer payment...');
    
    const additionalPayment = {
      amount: 1000,
      payer_type: 'SHOP',
      payee_type: 'FARMER',
      counterparty_id: farmerId,
      shop_id: shopId,
      method: 'BANK',
      notes: 'Additional payment to farmer'
    };
    
    await makeRequest('POST', '/payments', additionalPayment);
    console.log('✅ Additional payment created');
    
    // Check final balances
    console.log('\n🎯 STEP 9: FINAL BALANCE VERIFICATION');
    console.log('After additional payment:');
    const finalFarmerBalance = await checkUserBalance(farmerId, 'Farmer');
    const finalBuyerBalance = await checkUserBalance(buyerId, 'Buyer');
    
    console.log('\nFinal balance analysis:');
    console.log(`  Farmer should have: 4750 (earned) - 2000 (first payment) - 1000 (second payment) = 1750`);
    console.log(`  Farmer actual: ${finalFarmerBalance.balance}`);
    console.log(`  Match: ${Math.abs(finalFarmerBalance.balance - 1750) < 0.01 ? '✅ YES' : '❌ NO'}`);
    
    console.log(`  Buyer should have: 5000 (owes) - 3000 (paid) = 2000`);
    console.log(`  Buyer actual: ${finalBuyerBalance.balance}`);
    console.log(`  Match: ${Math.abs(finalBuyerBalance.balance - 2000) < 0.01 ? '✅ YES' : '❌ NO'}`);
    
    console.log('\n🎉 STEP-BY-STEP TEST COMPLETED');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

runStepByStepTest();
