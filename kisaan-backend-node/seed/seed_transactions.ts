
import { sequelize, Transaction } from '../src/models/index';

export async function seedTransactions() {
   try {
	   await sequelize.sync();
	   await Transaction.bulkCreate([
		   {
			   shop_id: 1,
			   farmer_id: '1',
			   buyer_id: '1',
			   product_id: 1,
			   quantity: 10,
			   price: 15.0,
			   total: 150.0,
			   commission_rate: 10.0,
			   commission_amount: 0.0,
			   farmer_paid: 0.0,
			   buyer_paid: 0.0,
			   deficit: 0.0,
			   status: 'paid',
			   transaction_date: new Date(),
		   },
	   ]);
	   console.log('Seeded transactions');
   } catch (err) {
	   console.error('Error seeding transactions:', err);
   }
}
