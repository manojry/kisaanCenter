import { Transaction } from '../src/models/index';

async function seedTransactions() {
	await Transaction.bulkCreate([
		{
			shop_id: 1,
			buyer_id: 1,
			type: 'sale',
			status: 'completed',
			commission_rate: 10.0,
			commission_amount: 15.0,
			payment_status: 'completed',
			buyer_paid_amount: 150.0,
			farmer_paid_amount: 135.0,
			commission_confirmed: true,
			completion_status: 'complete',
			date: new Date(),
			record_status: 'active',
		},
	]);
	console.log('Seeded transactions');
}

seedTransactions();
