// Global test setup
import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Set test environment
process.env.NODE_ENV = 'test';

// Global test configuration
beforeAll(async () => {
  // Wait for backend to be ready
  const maxRetries = 10;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
    await axios.get('http://localhost:3000/health');
      console.log('✅ Backend is ready');
      break;
    } catch (error) {
      retries++;
      if (retries === maxRetries) {
        throw new Error('Backend not available after maximum retries');
      }
    console.log(`⏳ Waiting for backend... (${retries}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
});

// Global error handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
