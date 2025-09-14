const sequelize = require('./src/config/database').default;
require('dotenv').config();

async function createBalanceSnapshotsTable() {
  try {
    console.log('🔍 Checking database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    console.log('🔍 Checking if balance_snapshots table exists...');
    
    // Check if table exists
    const [results] = await sequelize.query(`
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'balance_snapshots'
        );
    `);
    
    if (results[0].exists) {
        console.log('✅ balance_snapshots table already exists');
        return;
    }
    
    console.log('📝 Creating balance_snapshots table...');
    
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS balance_snapshots (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            balance_type VARCHAR(20) NOT NULL CHECK (balance_type IN ('farmer', 'buyer')),
            previous_balance DECIMAL(12,2) DEFAULT 0.00,
            amount_change DECIMAL(12,2) NOT NULL,
            new_balance DECIMAL(12,2) NOT NULL,
            transaction_type VARCHAR(50) NOT NULL,
            reference_id INTEGER,
            reference_type VARCHAR(50),
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    
    await sequelize.query(createTableQuery);
    console.log('✅ balance_snapshots table created successfully');
    
    // Create indexes
    console.log('📇 Creating indexes...');
    
    const createIndexQueries = [
        'CREATE INDEX IF NOT EXISTS idx_balance_snapshots_user_id ON balance_snapshots(user_id);',
        'CREATE INDEX IF NOT EXISTS idx_balance_snapshots_balance_type ON balance_snapshots(balance_type);',
        'CREATE INDEX IF NOT EXISTS idx_balance_snapshots_reference ON balance_snapshots(reference_id, reference_type);',
        'CREATE INDEX IF NOT EXISTS idx_balance_snapshots_created_at ON balance_snapshots(created_at);'
    ];
    
    for (const query of createIndexQueries) {
        await sequelize.query(query);
    }
    
    console.log('✅ Indexes created successfully');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating balance_snapshots table:', err.message);
    process.exit(1);
  }
}

createBalanceSnapshotsTable();
