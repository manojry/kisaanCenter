// FOCUSED TEST: Transaction with Partial Payments - Step by Step Analysis
// This will trace the exact logic flow and database updates

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

async function queryDB(query, params = []) {
  try {
    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Database query failed:', error.message);
    throw error;
  }
}

async function checkUserState(userId, username) {
  const result = await queryDB('SELECT id, username, balance, cumulative_value FROM kisaan_users WHERE id = $1', [userId]);
  if (result.length > 0) {
    const user = result[0];
    console.log(`    ${username}: balance=${user.balance}, cumulative=${user.cumulative_value}`);
    return user;
  }
  return null;
}

async function testTransactionFlow() {
  console.log('🔍 === FOCUSED TRANSACTION FLOW TEST ===\n');
  
  try {
    // Login
    console.log('🔐 STEP 1: LOGIN');
    const loginResponse = await makeRequest('POST', '/auth/login', {
      username: 'superadmin',
      password: 'superadminpass'
    });
    authToken = loginResponse.token;
    console.log('✅ Logged in successfully');
    
    // Get existing entities
    console.log('\n📋 STEP 2: GET EXISTING ENTITIES');
    const shops = await queryDB('SELECT id FROM kisaan_shops LIMIT 1');
    const farmers = await queryDB("SELECT id, username FROM kisaan_users WHERE role = 'farmer' LIMIT 1");
    const buyers = await queryDB("SELECT id, username FROM kisaan_users WHERE role = 'buyer' LIMIT 1");
    
    if (shops.length === 0 || farmers.length === 0 || buyers.length === 0) {
      throw new Error('Missing required entities. Run setup first.');
    }
    
    const shopId = shops[0].id;
    const farmerId = farmers[0].id;
    const buyerId = buyers[0].id;
    const farmerUsername = farmers[0].username;
    const buyerUsername = buyers[0].username;
    
    console.log(`  Shop ID: ${shopId}`);
    console.log(`  Farmer: ${farmerId} (${farmerUsername})`);
    console.log(`  Buyer: ${buyerId} (${buyerUsername})`);
    
    // Get commission rate
    const commissions = await queryDB('SELECT rate FROM kisaan_commissions WHERE shop_id = $1', [shopId]);
    const commissionRate = commissions.length > 0 ? commissions[0].rate : 5;
    console.log(`  Commission rate: ${commissionRate}%`);
    
    // Check initial state
    console.log('\n💰 STEP 3: INITIAL USER STATE');
    const initialFarmer = await checkUserState(farmerId, farmerUsername);
    const initialBuyer = await checkUserState(buyerId, buyerUsername);
    
    // Define our test transaction
    console.log('\n🔄 STEP 4: PREPARE TRANSACTION');
    const quantity = 100;
    const unitPrice = 50;
    const totalSale = quantity * unitPrice; // 5000
    const commission = (totalSale * commissionRate) / 100; // 250 (5%)
    const farmerEarning = totalSale - commission; // 4750
    
    console.log(`  Quantity: ${quantity}`);
    console.log(`  Unit Price: ${unitPrice}`);
    console.log(`  Total Sale: ${totalSale}`);
    console.log(`  Commission (${commissionRate}%): ${commission}`);
    console.log(`  Farmer Earning: ${farmerEarning}`);
    
    const buyerPayment = 3000; // Partial payment (60%)
    const farmerPayment = 2000; // Partial payment to farmer
    
    console.log(`  Buyer Payment: ${buyerPayment} (${(buyerPayment/totalSale*100).toFixed(1)}% of total)`);
    console.log(`  Farmer Payment: ${farmerPayment}`);
    
    const transactionPayload = {
      shop_id: shopId,
      farmer_id: farmerId,
      buyer_id: buyerId,
      category_id: 1,
      product_name: "Roses",
      quantity: quantity,
      unit_price: unitPrice,
      payments: [
        {
          payer_type: "BUYER",
          payee_type: "SHOP", 
          amount: buyerPayment,
          method: "CASH",
          status: "PAID"
        },
        {
          payer_type: "SHOP",
          payee_type: "FARMER",
          amount: farmerPayment,
          method: "CASH", 
          status: "PAID"
        }
      ]
    };
    
    console.log('\n📤 STEP 5: SEND TRANSACTION TO API');
    console.log('Transaction payload:');
    console.log(JSON.stringify(transactionPayload, null, 2));
    
    // Create transaction
    const transactionResponse = await makeRequest('POST', '/transactions', transactionPayload);
    const transactionId = transactionResponse.id || transactionResponse.data?.id;
    console.log(`✅ Transaction created with ID: ${transactionId}`);
    
    // Check database state after transaction
    console.log('\n🗄️ STEP 6: DATABASE STATE AFTER TRANSACTION');
    
    // Check transaction record
    const txRecords = await queryDB('SELECT * FROM kisaan_transactions WHERE id = $1', [transactionId]);
    if (txRecords.length > 0) {
      const tx = txRecords[0];
      console.log('  Transaction record:');
      console.log(`    total_sale_value: ${tx.total_sale_value}`);
      console.log(`    shop_commission: ${tx.shop_commission}`);
      console.log(`    farmer_earning: ${tx.farmer_earning}`);
    }
    
    // Check payment records
    const paymentRecords = await queryDB('SELECT * FROM kisaan_payments WHERE transaction_id = $1', [transactionId]);
    console.log('  Payment records:');
    paymentRecords.forEach(payment => {
      console.log(`    ${payment.payer_type} → ${payment.payee_type}: ${payment.amount} (counterparty: ${payment.counterparty_id})`);
    });
    
    // Check payment allocations
    const allocations = await queryDB('SELECT * FROM kisaan_payment_allocations WHERE transaction_id = $1', [transactionId]);
    console.log('  Payment allocations:');
    allocations.forEach(alloc => {
      console.log(`    Payment ${alloc.payment_id} → Transaction ${alloc.transaction_id}: ${alloc.allocated_amount}`);
    });
    
    // Check user balances after transaction
    console.log('\n💰 STEP 7: USER BALANCES AFTER TRANSACTION');
    const afterTxFarmer = await checkUserState(farmerId, farmerUsername);
    const afterTxBuyer = await checkUserState(buyerId, buyerUsername);
    
    // Calculate expected vs actual
    console.log('\n🧮 STEP 8: EXPECTED VS ACTUAL ANALYSIS');
    
    // Expected farmer balance calculation
    const expectedFarmerBalance = farmerEarning - farmerPayment; // 4750 - 2000 = 2750
    const actualFarmerBalance = parseFloat(afterTxFarmer.balance);
    
    console.log('  Farmer balance analysis:');
    console.log(`    Expected: ${farmerEarning} (earned) - ${farmerPayment} (paid) = ${expectedFarmerBalance}`);
    console.log(`    Actual: ${actualFarmerBalance}`);
    console.log(`    Match: ${Math.abs(actualFarmerBalance - expectedFarmerBalance) < 0.01 ? '✅ YES' : '❌ NO'}`);
    
    // Expected buyer balance calculation  
    const expectedBuyerBalance = totalSale - buyerPayment; // 5000 - 3000 = 2000
    const actualBuyerBalance = parseFloat(afterTxBuyer.balance);
    
    console.log('  Buyer balance analysis:');
    console.log(`    Expected: ${totalSale} (owes) - ${buyerPayment} (paid) = ${expectedBuyerBalance}`);
    console.log(`    Actual: ${actualBuyerBalance}`);
    console.log(`    Match: ${Math.abs(actualBuyerBalance - expectedBuyerBalance) < 0.01 ? '✅ YES' : '❌ NO'}`);
    
    // Commission realization check
    console.log('\n💼 STEP 9: COMMISSION REALIZATION CHECK');
    const totalAllocated = allocations.reduce((sum, alloc) => sum + parseFloat(alloc.allocated_amount), 0);
    const realizedCommission = (totalAllocated / totalSale) * commission;
    const commissionDue = commission - realizedCommission;
    
    console.log(`  Total allocated to transaction: ${totalAllocated}`);
    console.log(`  Realized commission: (${totalAllocated}/${totalSale}) × ${commission} = ${realizedCommission.toFixed(2)}`);
    console.log(`  Commission due: ${commission} - ${realizedCommission.toFixed(2)} = ${commissionDue.toFixed(2)}`);
    
    // Test additional payment
    console.log('\n💳 STEP 10: ADDITIONAL PAYMENT TEST');
    const additionalPayment = {
      amount: 1000,
      payer_type: 'SHOP',
      payee_type: 'FARMER',
      counterparty_id: farmerId,
      shop_id: shopId,
      method: 'BANK',
      notes: 'Additional payment test'
    };
    
    console.log('Creating additional payment:', JSON.stringify(additionalPayment, null, 2));
    await makeRequest('POST', '/payments', additionalPayment);
    
    console.log('\n💰 STEP 11: FINAL BALANCE CHECK');
    const finalFarmer = await checkUserState(farmerId, farmerUsername);
    const finalBuyer = await checkUserState(buyerId, buyerUsername);
    
    const expectedFinalFarmerBalance = expectedFarmerBalance - 1000; // 2750 - 1000 = 1750
    const actualFinalFarmerBalance = parseFloat(finalFarmer.balance);
    
    console.log('  Final farmer balance analysis:');
    console.log(`    Expected: ${expectedFarmerBalance} - 1000 = ${expectedFinalFarmerBalance}`);
    console.log(`    Actual: ${actualFinalFarmerBalance}`);
    console.log(`    Match: ${Math.abs(actualFinalFarmerBalance - expectedFinalFarmerBalance) < 0.01 ? '✅ YES' : '❌ NO'}`);
    
    console.log('\n🎯 STEP 12: CONCLUSIONS');
    const farmerBalanceCorrect = Math.abs(actualFinalFarmerBalance - expectedFinalFarmerBalance) < 0.01;
    const buyerBalanceCorrect = Math.abs(actualBuyerBalance - expectedBuyerBalance) < 0.01;
    
    if (farmerBalanceCorrect && buyerBalanceCorrect) {
      console.log('✅ SUCCESS: All balance calculations are working correctly!');
    } else {
      console.log('❌ ISSUES FOUND:');
      if (!farmerBalanceCorrect) console.log('  - Farmer balance calculation incorrect');
      if (!buyerBalanceCorrect) console.log('  - Buyer balance calculation incorrect');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testTransactionFlow();
