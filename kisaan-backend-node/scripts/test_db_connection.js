const sequelize = require('../src/config/database').default;

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connection successful!');
    process.exit(0);
  } catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
}

testConnection();
