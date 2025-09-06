const { execSync } = require('child_process');
const path = require('path');

console.log('🌱 Starting database seeding...');

const seedFiles = [
  'seed_users.ts',
  'seed_shops.ts', 
  'seed_categories.ts',
  'seed_plans.ts',
  'seed_products.ts',
  'seed_credits.ts',
  'seed_payments.ts',
  'seed_transactions.ts',
  'seed_shop_categories.ts'
];

async function runSeeds() {
  for (const seedFile of seedFiles) {
    try {
      console.log(`\n📝 Running ${seedFile}...`);
      execSync(`npx ts-node ${seedFile}`, { 
        cwd: path.join(__dirname, 'seed'),
        stdio: 'inherit'
      });
      console.log(`✅ ${seedFile} completed`);
    } catch (error) {
      console.error(`❌ Error running ${seedFile}:`, error.message);
      // Continue with other seeds even if one fails
    }
  }
  
  console.log('\n🎯 Database seeding completed!');
}

runSeeds();
