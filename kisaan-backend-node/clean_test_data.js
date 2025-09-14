const { Pool } = require('pg');

const pool = new Pool({
  host: 'xxxxxxxx',
  database: 'kisaan_dev',
  user: 'postgres',
  password: 'xxxxxxxx',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

async function resetTestData() {
  try {
    console.log('🧹 CLEANING TEST DATA FOR CLEAN BALANCE TEST...\n');
    
    // 1. Delete all payments for test users
    console.log('1. Deleting all payments...');
    const deletePayments = await pool.query(`
      DELETE FROM kisaan_payments 
      WHERE counterparty_id IN (
        SELECT id FROM kisaan_users 
        WHERE username IN ('farmer_john', 'buyer_mary')
      )
    `);
    console.log(`   ✅ Deleted ${deletePayments.rowCount} payments`);
    
    // 2. Delete all payment allocations
    console.log('2. Deleting all payment allocations...');
    const deleteAllocations = await pool.query('DELETE FROM payment_allocations');
    console.log(`   ✅ Deleted ${deleteAllocations.rowCount} payment allocations`);
    
    // 3. Delete all transactions for test users
    console.log('3. Deleting all transactions...');
    const deleteTransactions = await pool.query(`
      DELETE FROM kisaan_transactions 
      WHERE farmer_id IN (
        SELECT id FROM kisaan_users 
        WHERE username IN ('farmer_john', 'buyer_mary')
      ) OR buyer_id IN (
        SELECT id FROM kisaan_users 
        WHERE username IN ('farmer_john', 'buyer_mary')
      )
    `);
    console.log(`   ✅ Deleted ${deleteTransactions.rowCount} transactions`);
    
    // 4. Delete balance snapshots for test users
    console.log('4. Deleting balance snapshots...');
    const deleteSnapshots = await pool.query(`
      DELETE FROM balance_snapshots 
      WHERE user_id IN (
        SELECT id FROM kisaan_users 
        WHERE username IN ('farmer_john', 'buyer_mary')
      )
    `);
    console.log(`   ✅ Deleted ${deleteSnapshots.rowCount} balance snapshots`);
    
    // 5. Reset balances and cumulative values for test users
    console.log('5. Resetting user balances and cumulative values...');
    const resetUsers = await pool.query(`
      UPDATE kisaan_users 
      SET balance = 0, cumulative_value = 0 
      WHERE username IN ('farmer_john', 'buyer_mary', 'owner_test_123')
    `);
    console.log(`   ✅ Reset ${resetUsers.rowCount} user balances`);
    
    // 6. Show current state
    console.log('\n📊 CURRENT TEST USER STATE:');
    console.log('============================');
    const users = await pool.query(`
      SELECT id, username, role, balance, cumulative_value 
      FROM kisaan_users 
      WHERE username IN ('farmer_john', 'buyer_mary', 'owner_test_123')
      ORDER BY role, username
    `);
    
    users.rows.forEach(user => {
      console.log(`${user.role.padEnd(6)} | ${user.username.padEnd(15)} | Balance: ${user.balance.padStart(8)} | Cumulative: ${user.cumulative_value}`);
    });
    
    console.log('\n🎉 TEST DATA CLEANED! Ready for clean balance testing.');
    
  } catch (error) {
    console.error('❌ Error cleaning test data:', error.message);
  } finally {
    await pool.end();
  }
}

resetTestData();
