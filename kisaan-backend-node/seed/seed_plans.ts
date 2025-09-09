import { Plan } from '../src/models/index';

export async function seedPlans() {
	await Plan.destroy({ where: {}, truncate: true, restartIdentity: true, cascade: true });
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
		{
			name: 'Enterprise',
			description: 'Enterprise plan for enterprise customers',
			monthly_price: 2000,
			quarterly_price: 5400,
			yearly_price: 20000,
			max_farmers: 1000,
			max_buyers: 5000,
			max_transactions: 10000,
			data_retention_months: 60,
			features: JSON.stringify(['dedicated_support', 'custom_analytics', 'integration']),
			status: 'active',
		},
	]);
	console.log('Seeded plans (Basic, Premium, Enterprise)');
}
