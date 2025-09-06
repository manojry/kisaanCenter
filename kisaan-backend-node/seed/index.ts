

async function runSeeders() {
	const plans = await import('./seed_plans');
	await seedPlans();
	const shops = await import('./seed_shops');
	await seedShops();
	const users = await import('./seed_users');
	await seedUsers();
	const categories = await import('./seed_categories');
	await seedCategories();
	const products = await import('./seed_products');
	await seedProducts();
	// Add other seeders as needed, in correct order
	await seedShopCategories();
	// Assign all products to shop 1 as active
	const { seedShopProducts } = await import('./seed_shop_products');
	await seedShopProducts();
	await seedCredits();
	await seedTransactions();
	await seedPayments();
	console.log('All seeders completed');
}

runSeeders();

import { seedPlans } from './seed_plans';
import { seedShops } from './seed_shops';
import { seedUsers } from './seed_users';
import { seedCategories } from './seed_categories';
import { seedProducts } from './seed_products';
import { seedShopCategories } from './seed_shop_categories';
import { seedCredits } from './seed_credits';
import { seedPayments } from './seed_payments';
import { seedTransactions } from './seed_transactions';
import { seedShopProducts } from './seed_shop_products';
