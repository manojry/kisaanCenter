import { Category } from '../src/models/index';

export async function seedCategories() {
	await Category.destroy({ where: {}, truncate: true, restartIdentity: true, cascade: true });
	await Category.bulkCreate([
		{ name: 'Fruits', description: 'All types of fruits' },      // id: 1
		{ name: 'Vegetables', description: 'All types of vegetables' }, // id: 2
		{ name: 'Grains', description: 'All types of grains' },        // id: 3
		{ name: 'Flowers', description: 'All types of flowers' },      // id: 4
	]);
	console.log('Seeded categories (fruits, vegetables, grains, flowers)');
}
