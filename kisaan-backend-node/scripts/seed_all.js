
// Unified seeder: runs all seeders in strict order using the compiled index.js from the seed folder
async function runSeeders() {
  try {
    // Use the compiled JS output of seed/index.ts
  const seedIndex = require('../dist/seed/index.js');
    if (seedIndex && typeof seedIndex.runSeeders === 'function') {
      await seedIndex.runSeeders();
    } else {
      throw new Error('No runSeeders function exported from seed/index.js');
    }
    console.log('✅ All seeders completed successfully.');
  } catch (err) {
    console.error('❌ Error running seeders:', err);
    process.exit(1);
  }
}

runSeeders();
// Load .env from project root
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
