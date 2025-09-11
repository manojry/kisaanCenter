import { config } from 'dotenv';
import { setupTestDatabase } from '../scripts/setup-test-database';
import { cleanupTestData } from '../scripts/cleanup-test-data';
import { seedGlobalData } from '../scripts/seed-global-data';

// Load test environment variables
config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.DB_NAME = 'postgres';

// Increase timeout for integration tests
jest.setTimeout(60000);

// Global setup for all tests
beforeAll(async () => {
  console.log('🔄 Setting up test database...');
  await setupTestDatabase();
  await seedGlobalData();
  console.log('✅ Test database setup complete');
});