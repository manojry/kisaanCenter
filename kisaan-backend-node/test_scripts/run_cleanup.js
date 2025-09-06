const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function cleanupDatabase() {
  const client = new Client({
    host: 'manoj-test.dev.ea.mpi-internal.com',
    user: 'postgres',
    password: 'yd2A4TKG1d7J,yd2A',
    database: 'postgres',
    port: 5432,
    ssl: {
      require: true,
      rejectUnauthorized: false,
    }
  });

  try {
    console.log('🔄 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Read the cleanup SQL file
    const cleanupSQL = fs.readFileSync(path.join(__dirname, 'cleanup_database.sql'), 'utf8');
    
    console.log('🧹 Running cleanup script...');
    await client.query(cleanupSQL);
    console.log('✅ Database cleanup completed successfully!');

    await client.end();
    console.log('🎯 Ready for migrations!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    await client.end();
    process.exit(1);
  }
}

cleanupDatabase();
