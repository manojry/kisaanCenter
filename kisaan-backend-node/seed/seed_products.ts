import { Product } from '../src/models/index';

export async function seedProducts() {
	await Product.bulkCreate([
		// Fruits
		{ name: 'Apple', description: 'Fresh apples', category_id: 1, price: 50, shop_id: 1, record_status: 'active' },
		{ name: 'Banana', description: 'Sweet bananas', category_id: 1, price: 25, shop_id: 1, record_status: 'active' },
		{ name: 'Mango', description: 'Juicy mangoes', category_id: 1, price: 60, shop_id: 1, record_status: 'active' },
		// Vegetables
		{ name: 'Tomato', description: 'Red tomatoes', category_id: 2, price: 20, shop_id: 1, record_status: 'active' },
		{ name: 'Potato', description: 'Fresh potatoes', category_id: 2, price: 15, shop_id: 1, record_status: 'active' },
		{ name: 'Carrot', description: 'Organic carrots', category_id: 2, price: 22, shop_id: 1, record_status: 'active' },
		// Flowers
		{ name: 'Rose', description: 'Red roses', category_id: 4, price: 10, shop_id: 1, record_status: 'active' },
		{ name: 'Marigold', description: 'Yellow marigolds', category_id: 4, price: 8, shop_id: 1, record_status: 'active' },
		{ name: 'Jasmine', description: 'Fragrant jasmines', category_id: 4, price: 12, shop_id: 1, record_status: 'active' },
		// Other (original)
		{ name: 'Wheat', description: 'Premium wheat', category_id: 3, price: 30, shop_id: 1, record_status: 'active' },
	]);
	console.log('Seeded products (fruits, vegetables, flowers, and more)');
}
