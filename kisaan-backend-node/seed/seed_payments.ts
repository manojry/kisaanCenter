import { Payment } from '../src/models/index';

export async function seedPayments() {
	await Payment.bulkCreate([
		{
			transaction_id: 1,
			amount: 150.0,
			payment_type: 'full',
			payment_date: new Date('2025-09-01'),
			payer_id: '1',
			payee_id: '2',
			type: 'full_payment',
		},
	]);
	console.log('Seeded payments');
}
