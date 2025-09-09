import { Sequelize } from 'sequelize';
import sequelize from '../src/config/database';

const runMigration = async () => {
  try {
    console.log('🔄 Running migration...');
    
    const migration = require('../migrations/001_create_all_tables.js');
    await migration.up(sequelize.getQueryInterface(), Sequelize);
    
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
};

if (require.main === module) {
  runMigration().catch(console.error);
}

export { runMigration };