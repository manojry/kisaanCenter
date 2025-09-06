import { Plan } from '../src/models/index';

async function seedPlans() {
	await Plan.bulkCreate([
		{
			name: 'Basic',
			description: 'Basic plan for small shops',
			monthly_price: 100,
			quarterly_price: 270,
			yearly_price: 1000,
			max_farmers: 10,
			max_buyers: 50,
			max_transactions: 100,
			data_retention_months: 12,
			features: JSON.stringify(['basic_support']),
			status: 'active',
		},
		{
			name: 'Premium',
			description: 'Premium plan for large shops',
			monthly_price: 500,
			quarterly_price: 1350,
			yearly_price: 5000,
			max_farmers: 100,
			max_buyers: 500,
			max_transactions: 1000,
			data_retention_months: 24,
			features: JSON.stringify(['priority_support', 'analytics']),
			status: 'active',
		},
	]);
	console.log('Seeded plans');
}

seedPlans();
