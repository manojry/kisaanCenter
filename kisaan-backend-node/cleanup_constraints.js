const { Sequelize } = require('sequelize');
require('dotenv').config();

async function cleanupSpecificConstraints() {
    // Drop kisaan_products_name index if it exists
    try {
      await sequelize.query('DROP INDEX IF EXISTS kisaan_products_name CASCADE;');
      console.log('✅ Dropped index kisaan_products_name');
    } catch (error) {
      console.log('ℹ️ Index kisaan_products_name not found or already dropped');
    }
    // Drop kisaan_products table if it exists to ensure clean migration
    try {
      await sequelize.query('DROP TABLE IF EXISTS kisaan_products CASCADE;');
      console.log('✅ Dropped table kisaan_products');
    } catch (error) {
      console.log('ℹ️ Table kisaan_products not found or already dropped');
    }
    // Drop products_shop_id index if it exists
    try {
      await sequelize.query('DROP INDEX IF EXISTS products_shop_id CASCADE;');
      console.log('✅ Dropped index products_shop_id');
    } catch (error) {
      console.log('ℹ️ Index products_shop_id not found or already dropped');
    }
    // Drop kisaan_credits table if it exists to ensure clean migration
    try {
      await sequelize.query('DROP TABLE IF EXISTS kisaan_credits CASCADE;');
      console.log('✅ Dropped table kisaan_credits');
    } catch (error) {
      console.log('ℹ️ Table kisaan_credits not found or already dropped');
    }
  console.log('🧹 Cleaning up specific constraints causing migration issues...');
    const config = require('./config/config.js').development;
    const sequelize = new Sequelize(
      config.database,
      config.username,
      config.password,
      {
        host: config.host,
        port: config.port,
        dialect: config.dialect,
        dialectOptions: config.dialectOptions || {},
        logging: false,
      }
  );

  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Drop the specific constraint that's causing issues
    console.log('🔧 Dropping kisaan_credits_user_id constraint...');
    
    try {
      await sequelize.query('DROP INDEX IF EXISTS kisaan_credits_user_id CASCADE;');
      console.log('✅ Dropped index kisaan_credits_user_id');
    } catch (error) {
      console.log('ℹ️ Index kisaan_credits_user_id not found or already dropped');
    }

    // Drop any other potential constraints that might conflict
    const constraintsToRemove = [
      'kisaan_credits_shop_id',
      'credits_shop_id',
      'kisaan_credits_transaction_id',
      'kisaan_products_category_id',
      'kisaan_products_shop_id',
      'kisaan_shop_categories_shop_id',
      'kisaan_shop_categories_category_id',
      'kisaan_payments_transaction_id'
    ];

    for (const constraint of constraintsToRemove) {
      try {
        await sequelize.query(`DROP INDEX IF EXISTS ${constraint} CASCADE;`);
        console.log(`✅ Dropped index ${constraint}`);
      } catch (error) {
        console.log(`ℹ️ Index ${constraint} not found or already dropped`);
      }
    }

    // Also try to drop any foreign key constraints that might be lingering
    const fkConstraints = [
      'kisaan_credits_user_id_fkey',
      'kisaan_credits_shop_id_fkey',
      'kisaan_credits_transaction_id_fkey',
      'kisaan_products_category_id_fkey',
      'kisaan_products_shop_id_fkey',
      'kisaan_shop_categories_shop_id_fkey',
      'kisaan_shop_categories_category_id_fkey',
      'kisaan_payments_transaction_id_fkey'
    ];

    for (const fk of fkConstraints) {
      try {
        await sequelize.query(`ALTER TABLE IF EXISTS kisaan_credits DROP CONSTRAINT IF EXISTS ${fk} CASCADE;`);
        await sequelize.query(`ALTER TABLE IF EXISTS kisaan_products DROP CONSTRAINT IF EXISTS ${fk} CASCADE;`);
        await sequelize.query(`ALTER TABLE IF EXISTS kisaan_shop_categories DROP CONSTRAINT IF EXISTS ${fk} CASCADE;`);
        await sequelize.query(`ALTER TABLE IF EXISTS kisaan_payments DROP CONSTRAINT IF EXISTS ${fk} CASCADE;`);
      } catch (error) {
        // Ignore errors for non-existent constraints
      }
    }

    console.log('🎯 Constraint cleanup completed!');
    
  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
  } finally {
    await sequelize.close();
  }
}

cleanupSpecificConstraints();
