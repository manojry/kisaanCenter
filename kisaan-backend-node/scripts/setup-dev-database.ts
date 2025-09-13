import { Sequelize } from 'sequelize';
import path from 'path';
import dotenv from 'dotenv';

// Load development environment
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const setupDevDatabase = async () => {
  console.log('🔄 Setting up development database...');
  
  // First connect to default postgres database to create our dev database
  const adminSequelize = new Sequelize(
    'postgres', // Connect to default postgres database
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
      dialect: 'postgres',
      logging: false,
      dialectOptions: process.env.DB_SSL_MODE === 'require' ? {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      } : {},
    }
  );

  try {
    // Test connection
    await adminSequelize.authenticate();
    console.log('✅ Connected to PostgreSQL server');

    // Create development database if it doesn't exist
    const devDbName = process.env.DB_NAME || 'kisaan_dev';
    try {
      await adminSequelize.query(`CREATE DATABASE "${devDbName}"`);
      console.log(`✅ Created database: ${devDbName}`);
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log(`✅ Database ${devDbName} already exists`);
      } else {
        throw error;
      }
    }

    await adminSequelize.close();

    // Now connect to the development database and run migrations
    const devSequelize = new Sequelize(
      devDbName,
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || '',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
        dialect: 'postgres',
        logging: false,
        dialectOptions: process.env.DB_SSL_MODE === 'require' ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        } : {},
      }
    );

    await devSequelize.authenticate();
    console.log(`✅ Connected to development database: ${devDbName}`);

    // Execute the migration
    const migration = require('../migrations/001_create_all_tables.js');
    await migration.up(devSequelize.getQueryInterface(), Sequelize);
    console.log('✅ Migration executed successfully');
    
    await devSequelize.close();
    console.log('✅ Development database setup complete!');
    
    console.log('\n🎯 Next steps:');
    console.log('1. Run: ts-node scripts/seed-global-data.ts');
    console.log('2. Run: ts-node scripts/seed-superadmin.ts');
    console.log('3. Start server: npm run dev');
    
  } catch (error) {
    console.error('❌ Error setting up development database:', error);
    throw error;
  }
};

if (require.main === module) {
  setupDevDatabase().catch(console.error);
}

export { setupDevDatabase };