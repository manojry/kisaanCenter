import { Product } from '../src/models/index';

async function seedProducts() {
	await Product.bulkCreate([
		{ name: 'Apple', description: 'Fresh apples', category_id: 1, price: 50, shop_id: 1, record_status: 'active' },
		{ name: 'Tomato', description: 'Red tomatoes', category_id: 2, price: 20, shop_id: 1, record_status: 'active' },
		{ name: 'Wheat', description: 'Premium wheat', category_id: 3, price: 30, shop_id: 1, record_status: 'active' },
	]);
	console.log('Seeded products');
}

seedProducts();
