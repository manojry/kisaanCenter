import { sequelize } from './src/models/index';

async function testUserQuery() {
  try {
    console.log('Testing user query...');
    const [results] = await sequelize.query('SELECT * FROM kisaan_users WHERE shop_id = 1 AND status = \'active\'');
    console.log('Users found:', Array.isArray(results) ? results.length : 'Not array');
    console.log('Sample users:', Array.isArray(results) ? results.slice(0, 2) : results);
    
    // Also test the shop query with users
    console.log('\nTesting shop query with users...');
    const [userResults] = await sequelize.query(
      'SELECT * FROM kisaan_users WHERE shop_id = :shopId AND status = \'active\'',
      { replacements: { shopId: 1 } }
    );
    console.log('Users with replacements:', Array.isArray(userResults) ? userResults.length : 'Not array');
    
  } catch (error) {
    console.error('Query error:', error);
  }
  process.exit(0);
}

testUserQuery();
