import { CreditAdvance } from '../src/models/index';

export async function seedCredits() {
	await CreditAdvance.bulkCreate([
		{
			user_id: 1,
			shop_id: 1,
			amount: 1000.0,
			issued_date: new Date('2025-09-01'),
			due_date: new Date('2025-12-01'),
			repaid_amount: 0,
			status: 'active',
		},
	]);
	console.log('Seeded credits');
}
