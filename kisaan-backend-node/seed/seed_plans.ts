import { Plan } from '../src/models/index';

export async function seedPlans() {
	await Plan.destroy({ where: {}, truncate: true, restartIdentity: true, cascade: true });
	await Plan.bulkCreate([
		{
			name: 'Basic',
			description: 'Basic plan for small shops',
			price: 100,
			billing_cycle: 'monthly',
			max_users: 10,
			max_products: 50,
			max_transactions: 100,
			features: JSON.stringify(['basic_support']),
			is_active: true,
		},
		{
			name: 'Premium',
			description: 'Premium plan for large shops',
			price: 500,
			billing_cycle: 'monthly',
			max_users: 100,
			max_products: 500,
			max_transactions: 1000,
			features: JSON.stringify(['priority_support', 'analytics']),
			is_active: true,
		},
		{
			name: 'Enterprise',
			description: 'Enterprise plan for enterprise customers',
			price: 2000,
			billing_cycle: 'monthly',
			max_users: 1000,
			max_products: 5000,
			max_transactions: 10000,
			features: JSON.stringify(['dedicated_support', 'custom_analytics', 'integration']),
			is_active: true,
		},
	]);
	console.log('Seeded plans (Basic, Premium, Enterprise)');
}
