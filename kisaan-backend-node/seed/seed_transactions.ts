import { Transaction } from '../src/models/index';

export async function seedTransactions() {
	await Transaction.bulkCreate([
		{
			shop_id: 1,
			buyer_id: '1',
			product_id: 1,
			quantity: 10,
			price: 15.0,
			total: 150.0,
			status: 'paid',
			transaction_date: new Date(),
		},
	]);
	console.log('Seeded transactions');
}
