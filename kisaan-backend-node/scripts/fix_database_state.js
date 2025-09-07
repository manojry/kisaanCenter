const { Sequelize } = require('sequelize');
const config = require('../config/config.js');

const sequelize = new Sequelize(config.development);

async function fixDatabaseState() {
  try {
    console.log('🔧 Checking database state...');
    
    // Check if SequelizeMeta table exists
    const metaExists = await sequelize.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'SequelizeMeta');"
    );
    
    if (!metaExists[0][0].exists) {
      console.log('📋 Creating SequelizeMeta table...');
      await sequelize.query(`
        CREATE TABLE "SequelizeMeta" (
          name VARCHAR(255) NOT NULL PRIMARY KEY
        );
      `);
    }
    
    // Mark base schema as migrated if tables exist
    const shopsExists = await sequelize.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'kisaan_shops');"
    );
    
    if (shopsExists[0][0].exists) {
      console.log('✅ Base schema detected, marking as migrated...');
      await sequelize.query(`
        INSERT INTO "SequelizeMeta" (name) 
        VALUES ('000_comprehensive_kisaan_schema.js')
        ON CONFLICT (name) DO NOTHING;
      `);
    }
    
    // Check current migration status
    const migrations = await sequelize.query('SELECT name FROM "SequelizeMeta" ORDER BY name;');
    console.log('📊 Current migrations:', migrations[0].map(m => m.name));
    
    console.log('✅ Database state fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing database state:', error);
  } finally {
    await sequelize.close();
  }
}

fixDatabaseState();