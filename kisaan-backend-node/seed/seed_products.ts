import { Product } from '../src/models/index';

// Deprecated standalone product seed. Core product/category seeding moved to scripts/seed-core.ts
// Retained as a no-op wrapper to avoid import errors in legacy code paths.
export async function seedProducts() {
  console.log('seed_products.ts deprecated: run npm run seed:core instead.');
}
// Allow direct invocation
if (require.main === module) {
  seedProducts().then(() => process.exit(0));
}
