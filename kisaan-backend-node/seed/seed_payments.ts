import { Payment } from '../src/models/index';

export async function seedPayments() {
	await Payment.bulkCreate([
		{
			transaction_id: 1,
			amount: 150.0,
			payer_type: 'BUYER',
			payee_type: 'SHOP',
			method: 'CASH',
			payment_date: new Date('2025-09-01'),
		},
	]);
	console.log('Seeded payments');
}
