const { Pool } = require('pg');

const pool = new Pool({
  host: 'xxxxxxxx',
  database: 'kisaan_dev',
  user: 'postgres',
  password: 'xxxxxxxx',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

async function resetBalances() {
  try {
    console.log('🔄 Resetting all user balances to 0...');
    
    // Reset all user balances to 0
    await pool.query('UPDATE kisaan_users SET balance = 0 WHERE role IN (\'farmer\', \'buyer\')');
    
    console.log('✅ All user balances reset to 0');
    
    // Show current balances
    const users = await pool.query(`
      SELECT id, username, role, balance, cumulative_value 
      FROM kisaan_users 
      WHERE role IN ('farmer', 'buyer') 
      ORDER BY role, username
    `);
    
    console.log('\n📊 CURRENT USER BALANCES:');
    console.log('==========================');
    users.rows.forEach(user => {
      console.log(`${user.role.padEnd(6)} | ${user.username.padEnd(15)} | Balance: ${user.balance.padStart(8)} | Cumulative: ${user.cumulative_value}`);
    });
    
  } catch (error) {
    console.error('❌ Error resetting balances:', error.message);
  } finally {
    await pool.end();
  }
}

resetBalances();
