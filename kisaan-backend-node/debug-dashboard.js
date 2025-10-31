// Debug Dashboard Payments
const axios = require('axios');

async function debugDashboard() {
  try {
    // Login
    const loginResp = await axios.post('http://localhost:8000/api/auth/login', {
      username: 'ramakanthreddy_0_107',
      password: 'reddy@123'
    });
    const token = loginResp.data.data.token;
    const headers = { 'Authorization': `Bearer ${token}` };

    console.log('=== DEBUGGING DASHBOARD CALCULATION ===\n');

    // Get all transactions
    const txnsResp = await axios.get('http://localhost:8000/api/transactions?shop_id=1', { headers });
    const transactions = txnsResp.data.data;
    
    console.log(`Total transactions: ${transactions.length}`);
    
    // Get all payments for shop 1
    const paymentsResp = await axios.get('http://localhost:8000/api/payments?shop_id=1', { headers });
    const allPayments = paymentsResp.data.data || [];
    
    console.log(`Total payments returned by API: ${allPayments.length}\n`);

    // Manually calculate farmer_payments_due
    let totalFarmerEarning = 0;
    let totalFarmerPaidViaTransactions = 0;
    let totalFarmerBookkeepingPayments = 0;

    console.log('Transaction Details:');
    for (const txn of transactions) {
      const txnDetail = await axios.get(`http://localhost:8000/api/transactions/${txn.id}`, { headers });
      const txnFull = txnDetail.data.data;
      const earning = Number(txnFull.farmer_earning || 0);
      totalFarmerEarning += earning;
      
      const farmerPayments = (txnFull.payments || []).filter(p => 
        p.payer_type === 'SHOP' && p.payee_type === 'FARMER'
      );
      
      const farmerPaid = farmerPayments
        .filter(p => p.status === 'PAID' || p.status === 'PENDING')
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);
      
      totalFarmerPaidViaTransactions += farmerPaid;
      
      console.log(`  Transaction ${txn.id}:`);
      console.log(`    Farmer earning: ₹${earning}`);
      console.log(`    Farmer paid: ₹${farmerPaid} (${farmerPayments.length} payments)`);
      console.log(`    Due: ₹${earning - farmerPaid}`);
    }

    console.log(`\nBookkeeping Payments (transaction_id = null):`);
    // We need to query the DB directly for bookkeeping payments
    // For now, let's calculate manually
    
    console.log('\n=== CALCULATED TOTALS ===');
    console.log(`Total Farmer Earnings: ₹${totalFarmerEarning}`);
    console.log(`Total Paid via Transaction Payments: ₹${totalFarmerPaidViaTransactions}`);
    console.log(`Expected Due (before bookkeeping): ₹${totalFarmerEarning - totalFarmerPaidViaTransactions}`);
    
    // Get dashboard
    const dashResp = await axios.get('http://localhost:8000/api/owner-dashboard/dashboard', { headers });
    const dash = dashResp.data;
    
    console.log('\n=== ACTUAL DASHBOARD ===');
    console.log(`Farmer Payments Due: ₹${dash.farmer_payments_due}`);
    console.log(`Buyer Payments Due: ₹${dash.buyer_payments_due}`);
    
    console.log('\n=== DISCREPANCY ANALYSIS ===');
    const expected = totalFarmerEarning - totalFarmerPaidViaTransactions;
    const actual = Number(dash.farmer_payments_due);
    const diff = expected - actual;
    
    if (Math.abs(diff) > 0.01) {
      console.log(`❌ MISMATCH: Expected ₹${expected}, Got ₹${actual}, Difference: ₹${diff}`);
      console.log(`This suggests bookkeeping payments of ₹${diff} were deducted`);
    } else {
      console.log(`✅ MATCH: Dashboard is correct`);
    }

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

debugDashboard();
