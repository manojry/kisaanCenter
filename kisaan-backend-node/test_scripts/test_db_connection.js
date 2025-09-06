const { Sequelize } = require('sequelize');
require('dotenv').config();

async function testConnection() {
  console.log('Testing database connection...');
  
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
      logging: console.log,
    }
  );

  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Check if SequelizeMeta table exists
    const [results] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'SequelizeMeta'"
    );
    
    console.log('SequelizeMeta table exists:', results.length > 0);
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
}

testConnection();
