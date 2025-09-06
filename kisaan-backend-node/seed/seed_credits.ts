import { Credit } from '../src/models/index';

async function seedCredits() {
	await Credit.bulkCreate([
		{
			user_id: 1,
			shop_id: 1,
			amount: 1000.0,
			status: 'outstanding',
			record_status: 'active',
			address: '123 Main St',
		},
	]);
	console.log('Seeded credits');
}

seedCredits();
