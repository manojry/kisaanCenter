import { config } from 'dotenv';
import { setupTestDatabase } from '../scripts/setup-test-database';
// import { seedSuperadmin } from '../scripts/seed-superadmin';

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
  console.log('✅ Test database setup complete');
  // await seedSuperadmin();
  // console.log('✅ Superadmin user seeded');
});