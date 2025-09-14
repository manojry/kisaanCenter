const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB_NAME || 'kisaan_center', process.env.DB_USER || 'postgres', process.env.DB_PASSWORD || 'root', {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  dialect: 'postgres',
  logging: console.log
});

async function createBalanceSnapshotsTable() {
  try {
    // Drop table if it exists
    await sequelize.query('DROP TABLE IF EXISTS balance_snapshots CASCADE;');
    console.log('Dropped existing balance_snapshots table if it existed');

    // Create table
    await sequelize.query(`
      CREATE TABLE balance_snapshots (
        id SERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES kisaan_users(id) ON DELETE CASCADE,
        balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        snapshot_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Add indexes
    await sequelize.query('CREATE INDEX idx_balance_snapshots_user_id ON balance_snapshots (user_id);');
    await sequelize.query('CREATE INDEX idx_balance_snapshots_date ON balance_snapshots (snapshot_date);');
    await sequelize.query('CREATE INDEX idx_balance_snapshots_user_date ON balance_snapshots (user_id, snapshot_date);');
    
    console.log('✅ balance_snapshots table created successfully with indexes');
    
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating balance_snapshots table:', err.message);
    await sequelize.close();
    process.exit(1);
  }
}

createBalanceSnapshotsTable();
