import { config } from 'dotenv';
import { setupTestDatabase } from '../scripts/setup-test-database';
import { cleanupTestData } from '../scripts/cleanup-test-data';
import { seedGlobalData } from '../scripts/seed-global-data';

// Load test environment variables
config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
// Do not override DB_NAME; rely on .env.test for accurate shared DB configuration

// Increase timeout for integration tests
jest.setTimeout(60000);

// Global setup for all tests
beforeAll(async () => {
  // 🚫 COMPLETE BLOCK: Test setup disabled to prevent data clearing
  console.log('🚫 TEST SETUP COMPLETELY BLOCKED FOR DEVELOPMENT SAFETY');
  console.log('   Test setup was clearing user data during development');
  console.log('   Tests will not run database setup until manually re-enabled');
  return;

  if (process.env.NODE_ENV !== 'test') {
    console.log('🚫 Test setup: Skipping (not in test environment)');
    return;
  }
  
  console.log('🔄 Setting up test database...');
  await setupTestDatabase();
  await seedGlobalData();
  console.log('✅ Test database setup complete');
});