import { Payment } from '../src/models/index';

async function seedPayments() {
	await Payment.bulkCreate([
		{
			transaction_id: 1,
			amount: 150.0,
			payment_method_id: 1,
			type: 'full_payment',
			record_status: 'active',
		},
	]);
	console.log('Seeded payments');
}

seedPayments();
