import { sequelize } from './src/models/index';

async function checkTables() {
  try {
    const [results] = await sequelize.query('SELECT tablename FROM pg_tables WHERE schemaname = \'public\'');
    console.log('Tables:', results);
    
    // Check user data
    const [users] = await sequelize.query('SELECT * FROM kisaan_users LIMIT 5');
    console.log('Sample Users:', users);
    
    // Check products data  
    const [products] = await sequelize.query('SELECT * FROM kisaan_products LIMIT 5');
    console.log('Sample Products:', products);
    
    // Check shop_products mapping
    const [shopProducts] = await sequelize.query('SELECT * FROM shop_products LIMIT 5');
    console.log('Sample Shop Products:', shopProducts);
    
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

checkTables();
