import { Category } from '../src/models/index';

export async function seedCategories() {
	await Category.destroy({ where: {}, truncate: true, restartIdentity: true, cascade: true });
	await Category.bulkCreate([
		{ name: 'Fruits', description: 'All types of fruits', status: 'active' },
		{ name: 'Vegetables', description: 'All types of vegetables', status: 'active' },
		{ name: 'Grains', description: 'All types of grains', status: 'active' },
	]);
	console.log('Seeded categories');
}
