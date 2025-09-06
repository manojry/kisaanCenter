import { ShopCategory } from '../src/models/index';

async function seedShopCategories() {
	await ShopCategory.bulkCreate([
		{ shop_id: 1, category_id: 1 },
		{ shop_id: 1, category_id: 2 },
		{ shop_id: 1, category_id: 3 },
	]);
	console.log('Seeded shop_categories');
}

seedShopCategories();
