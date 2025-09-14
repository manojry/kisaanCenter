const { Pool } = require('pg');

const pool = new Pool({
  host: 'xxxxxxxx',
  database: 'kisaan_dev',
  user: 'postgres',
  password: 'xxxxxxxx',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

async function createBalanceSnapshotsTable() {
  try {
    console.log('🔍 Checking if balance_snapshots table exists...');
    
    // Check if table exists
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'balance_snapshots'
      );
    `;
    
    const tableExists = await pool.query(tableExistsQuery);
    
    if (tableExists.rows[0].exists) {
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
    
    await pool.query(createTableQuery);
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
      await pool.query(query);
    }
    
    console.log('✅ Indexes created successfully');
    
    // Verify table creation
    console.log('🔍 Verifying table creation...');
    const verifyQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'balance_snapshots' 
      ORDER BY ordinal_position;
    `;
    
    const columns = await pool.query(verifyQuery);
    console.log('\n📊 TABLE STRUCTURE:');
    console.log('==================');
    columns.rows.forEach(col => {
      console.log(`${col.column_name.padEnd(20)} | ${col.data_type.padEnd(15)} | Nullable: ${col.is_nullable.padEnd(3)} | Default: ${col.column_default || 'NULL'}`);
    });
    
  } catch (error) {
    console.error('❌ Error creating balance_snapshots table:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

createBalanceSnapshotsTable()
  .then(() => {
    console.log('\n🎉 balance_snapshots table setup completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Failed to setup balance_snapshots table:', error);
    process.exit(1);
  });
