const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigrations() {
  console.log('🔄 Starting manual migrations...');
  
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
      logging: false,
    }
  );

  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Create SequelizeMeta table if it doesn't exist
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
        "name" VARCHAR(255) NOT NULL UNIQUE PRIMARY KEY
      );
    `);

    // Get migration files in order
    const migrationDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationDir)
      .filter(file => file.endsWith('.js'))
      .sort();

    console.log('Found migrations:', migrationFiles);

    for (const file of migrationFiles) {
      try {
        console.log(`\n📝 Running migration: ${file}`);
        
        // Check if already run
        const [results] = await sequelize.query(
          'SELECT name FROM "SequelizeMeta" WHERE name = ?',
          { replacements: [file] }
        );

        if (results.length > 0) {
          console.log(`⏭️ Skipping ${file} (already run)`);
          continue;
        }

        // Load and run migration
        const migrationPath = path.join(migrationDir, file);
        const migration = require(migrationPath);
        
        if (migration.up) {
          await migration.up(sequelize.getQueryInterface(), Sequelize);
          
          // Record migration as completed
          await sequelize.query(
            'INSERT INTO "SequelizeMeta" (name) VALUES (?)',
            { replacements: [file] }
          );
          
          console.log(`✅ Migration ${file} completed`);
        }
      } catch (error) {
        console.error(`❌ Error in migration ${file}:`, error.message);
        break;
      }
    }

    await sequelize.close();
    console.log('\n🎯 Migrations completed!');
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  }
}

runMigrations();
