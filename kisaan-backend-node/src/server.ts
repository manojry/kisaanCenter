
import app from './app';
import { logger } from './shared/logging/logger';
import sequelize from './config/database';
import './models'; // Import models to ensure they're initialized
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.API_PORT || process.env.PORT || 8000;

async function startServer() {
  try {
    console.log('🔄 Connecting to database...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Skip auto-sync to avoid schema conflicts
    // Use manual migrations instead: npm run migrate
    console.log('✅ Database models loaded (manual migration required).');
    
    // Start the server
    const server = app.listen(PORT, () => {
      console.log(`🚀 KisaanCenter Backend Server running on port ${PORT}`);
      console.log(`📚 Available endpoints:`);
      console.log(`   • GET  /health - Health check`);
      console.log(`   • GET  /api/test - Test endpoint`);
      console.log(`   • POST /api/auth/login - User login`);
      console.log(`   • POST /api/auth/register - User registration`);
      console.log(`   • GET  /api/users - Get all users`);
      console.log(`   • POST /api/users - Create user`);
      console.log(`   • GET  /api/shops - Get all shops`);
      console.log(`   • POST /api/shops - Create shop`);
      console.log(`   • GET  /api/shops/:id - Get shop by ID`);
      console.log(`   • PUT  /api/shops/:id - Update shop`);
      console.log(`   • DELETE /api/shops/:id - Delete shop`);
      console.log(`\n🌐 Server URL: http://localhost:${PORT}`);
      console.log(`🌐 Health Check: http://localhost:${PORT}/health`);
    });

    return server;
  } catch (error: unknown) {
    logger.error({ err: error }, 'unable to start server');
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  try {
    await sequelize.close();
    console.log('✅ Database connection closed.');
  } catch (error: unknown) {
    logger.error({ err: error }, 'error closing database connection (SIGTERM)');
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  try {
    await sequelize.close();
    console.log('✅ Database connection closed.');
  } catch (error: unknown) {
    logger.error({ err: error }, 'error closing database connection (SIGINT)');
  }
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown, promise) => {
  logger.error({ reason, promise }, 'unhandled promise rejection');
  process.exit(1);
});

startServer();
