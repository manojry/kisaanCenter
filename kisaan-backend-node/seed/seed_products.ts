import { Product } from '../src/models/index';

export async function seedProducts() {
	await Product.destroy({ where: {}, truncate: true, restartIdentity: true, cascade: true });
	await Product.bulkCreate([
		// Fruits (category_id: 1)
		{ name: 'Apple', description: 'Fresh apples', category_id: 1, price: 50, record_status: 'active', unit: 'kg' },
		{ name: 'Banana', description: 'Sweet bananas', category_id: 1, price: 25, record_status: 'active', unit: 'dozen' },
		{ name: 'Mango', description: 'Juicy mangoes', category_id: 1, price: 60, record_status: 'active', unit: 'kg' },
		{ name: 'Orange', description: 'Citrus oranges', category_id: 1, price: 40, record_status: 'active', unit: 'kg' },
		{ name: 'Papaya', description: 'Fresh papayas', category_id: 1, price: 35, record_status: 'active', unit: 'kg' },
		{ name: 'Grapes', description: 'Seedless grapes', category_id: 1, price: 55, record_status: 'active', unit: 'kg' },
		{ name: 'Pineapple', description: 'Tropical pineapples', category_id: 1, price: 70, record_status: 'active', unit: 'piece' },
		{ name: 'Guava', description: 'Juicy guavas', category_id: 1, price: 30, record_status: 'active', unit: 'kg' },
		{ name: 'Watermelon', description: 'Large watermelons', category_id: 1, price: 80, record_status: 'active', unit: 'piece' },
		{ name: 'Pomegranate', description: 'Red pomegranates', category_id: 1, price: 90, record_status: 'active', unit: 'kg' },
		// Vegetables (category_id: 2)
		{ name: 'Tomato', description: 'Red tomatoes', category_id: 2, price: 20, record_status: 'active', unit: 'kg' },
		{ name: 'Potato', description: 'Fresh potatoes', category_id: 2, price: 15, record_status: 'active', unit: 'kg' },
		{ name: 'Carrot', description: 'Organic carrots', category_id: 2, price: 22, record_status: 'active', unit: 'kg' },
		{ name: 'Onion', description: 'Fresh onions', category_id: 2, price: 18, record_status: 'active', unit: 'kg' },
		{ name: 'Cabbage', description: 'Green cabbages', category_id: 2, price: 25, record_status: 'active', unit: 'piece' },
		{ name: 'Cauliflower', description: 'White cauliflowers', category_id: 2, price: 28, record_status: 'active', unit: 'piece' },
		{ name: 'Spinach', description: 'Leafy spinach', category_id: 2, price: 12, record_status: 'active', unit: 'bunch' },
		{ name: 'Brinjal', description: 'Purple brinjals', category_id: 2, price: 24, record_status: 'active', unit: 'kg' },
		{ name: 'Beans', description: 'Green beans', category_id: 2, price: 30, record_status: 'active', unit: 'kg' },
		{ name: 'Peas', description: 'Fresh peas', category_id: 2, price: 35, record_status: 'active', unit: 'kg' },
		// Grains (category_id: 3)
		{ name: 'Wheat', description: 'Premium wheat', category_id: 3, price: 30, record_status: 'active', unit: 'kg' },
		{ name: 'Rice', description: 'Basmati rice', category_id: 3, price: 60, record_status: 'active', unit: 'kg' },
		{ name: 'Barley', description: 'Barley grains', category_id: 3, price: 25, record_status: 'active', unit: 'kg' },
		{ name: 'Maize', description: 'Maize corn', category_id: 3, price: 20, record_status: 'active', unit: 'kg' },
		{ name: 'Oats', description: 'Rolled oats', category_id: 3, price: 50, record_status: 'active', unit: 'kg' },
		{ name: 'Millet', description: 'Pearl millet', category_id: 3, price: 40, record_status: 'active', unit: 'kg' },
		{ name: 'Sorghum', description: 'Sorghum grains', category_id: 3, price: 32, record_status: 'active', unit: 'kg' },
		{ name: 'Ragi', description: 'Finger millet', category_id: 3, price: 38, record_status: 'active', unit: 'kg' },
		{ name: 'Corn', description: 'Sweet corn', category_id: 3, price: 28, record_status: 'active', unit: 'kg' },
		{ name: 'Quinoa', description: 'Healthy quinoa', category_id: 3, price: 90, record_status: 'active', unit: 'kg' },
		// Flowers (category_id: 4)
		{ name: 'Rose', description: 'Red roses', category_id: 4, price: 10, record_status: 'active', unit: 'bunch' },
		{ name: 'Marigold', description: 'Yellow marigolds', category_id: 4, price: 8, record_status: 'active', unit: 'bunch' },
		{ name: 'Jasmine', description: 'Fragrant jasmines', category_id: 4, price: 12, record_status: 'active', unit: 'bunch' },
		{ name: 'Lily', description: 'White lilies', category_id: 4, price: 15, record_status: 'active', unit: 'bunch' },
		{ name: 'Lotus', description: 'Sacred lotuses', category_id: 4, price: 20, record_status: 'active', unit: 'bunch' },
		{ name: 'Tulip', description: 'Colorful tulips', category_id: 4, price: 18, record_status: 'active', unit: 'bunch' },
		{ name: 'Daisy', description: 'Fresh daisies', category_id: 4, price: 14, record_status: 'active', unit: 'bunch' },
		{ name: 'Orchid', description: 'Exotic orchids', category_id: 4, price: 25, record_status: 'active', unit: 'bunch' },
		{ name: 'Sunflower', description: 'Bright sunflowers', category_id: 4, price: 16, record_status: 'active', unit: 'bunch' },
		{ name: 'Chrysanthemum', description: 'Beautiful chrysanthemums', category_id: 4, price: 22, record_status: 'active', unit: 'bunch' },
	]);
	console.log('Seeded products for all categories (10 each)');
}
