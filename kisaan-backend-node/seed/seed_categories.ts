import { Category } from '../src/models/index';

export async function seedCategories() {
	await Category.destroy({ where: {}, truncate: true, restartIdentity: true, cascade: true });
	await Category.bulkCreate([
		{ name: 'Fruits', description: 'All types of fruits', status: 'active' },      // id: 1
		{ name: 'Vegetables', description: 'All types of vegetables', status: 'active' }, // id: 2
		{ name: 'Grains', description: 'All types of grains', status: 'active' },        // id: 3
		{ name: 'Flowers', description: 'All types of flowers', status: 'active' },      // id: 4
	]);
	console.log('Seeded categories (fruits, vegetables, grains, flowers)');
}
