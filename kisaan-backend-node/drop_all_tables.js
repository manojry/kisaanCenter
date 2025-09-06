const { Sequelize } = require('sequelize');
require('dotenv').config();

async function dropAllTablesAndConstraints() {
  console.log('🧹 Dropping all tables and constraints for clean migration...');
  
  const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
      logging: console.log,
    }
  );

  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Drop all kisaan tables in reverse dependency order
    const tablesToDrop = [
      'kisaan_payments',
      'kisaan_shop_categories', 
      'kisaan_products',
      'kisaan_credits',
      'kisaan_transactions',
      'kisaan_plans',
      'kisaan_categories',
      'kisaan_shops',
      'kisaan_users'
    ];

    for (const table of tablesToDrop) {
      try {
        await sequelize.query(`DROP TABLE IF EXISTS ${table} CASCADE;`);
        console.log(`✅ Dropped table ${table}`);
      } catch (error) {
        console.log(`ℹ️ Table ${table} not found or already dropped`);
      }
    }

    // Drop any remaining indexes that might conflict
    const indexesToDrop = [
      'kisaan_credits_user_id',
      'kisaan_credits_shop_id', 
      'kisaan_credits_transaction_id',
      'kisaan_products_category_id',
      'kisaan_products_shop_id',
      'kisaan_shop_categories_shop_id',
      'kisaan_shop_categories_category_id',
      'kisaan_payments_transaction_id'
    ];

    for (const index of indexesToDrop) {
      try {
        await sequelize.query(`DROP INDEX IF EXISTS ${index} CASCADE;`);
        console.log(`✅ Dropped index ${index}`);
      } catch (error) {
        console.log(`ℹ️ Index ${index} not found or already dropped`);
      }
    }

    console.log('🎯 Complete cleanup finished! Ready for fresh migrations.');
    
  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
  } finally {
    await sequelize.close();
  }
}

dropAllTablesAndConstraints();
