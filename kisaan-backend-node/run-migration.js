require('dotenv').config({ path: './.env' });
const { Sequelize } = require('sequelize');

async function runMigration() {
  let sequelize;

  try {
    console.log('Connecting to database for migration...');

    sequelize = new Sequelize(
      process.env.DB_NAME || 'kisaan_dev',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || '',
      {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        dialect: 'postgres',
        logging: false,
        ...(process.env.DB_SSL_MODE === 'require' ? {
          dialectOptions: {
            ssl: {
              require: true,
              rejectUnauthorized: false
            }
          }
        } : {})
      }
    );

    // Test connection
    await sequelize.authenticate();
    console.log('Database connection successful.\n');

    console.log('Running migration to allow null transaction_id in kisaan_payments...\n');

    // Drop the existing foreign key constraint
    console.log('Dropping existing foreign key constraint...');
    await sequelize.query(`
      ALTER TABLE kisaan_payments DROP CONSTRAINT IF EXISTS kisaan_payments_transaction_id_fkey;
    `);

    // Make transaction_id nullable
    console.log('Making transaction_id nullable...');
    await sequelize.query(`
      ALTER TABLE kisaan_payments ALTER COLUMN transaction_id DROP NOT NULL;
    `);

    // Re-add the foreign key constraint allowing nulls
    console.log('Re-adding foreign key constraint with null support...');
    await sequelize.query(`
      ALTER TABLE kisaan_payments
      ADD CONSTRAINT kisaan_payments_transaction_id_fkey
      FOREIGN KEY (transaction_id)
      REFERENCES kisaan_transactions(id)
      ON DELETE SET NULL;
    `);

    console.log('Migration completed successfully!');

  } catch (e) {
    console.log('Migration failed:', e.message);
    console.log('Stack:', e.stack);
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
    process.exit(0);
  }
}

runMigration();