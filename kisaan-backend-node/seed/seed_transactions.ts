
import { sequelize, Transaction } from '../src/models/index';

export async function seedTransactions() {
   try {
	   await sequelize.sync();
		   await Transaction.bulkCreate([
		   	   {
		   	   	   shop_id: 1,
		   	   	   farmer_id: 1,
		   	   	   buyer_id: 1,
		   	   	   category_id: 1,
		   	   	   product_name: 'Apple',
		   	   	   quantity: 10,
		   	   	   unit_price: 15.0,
		   	   	   total_amount: 150.0,
		   	   	   commission_amount: 15.0,
		   	   	   farmer_earning: 135.0,
		   	   },
		   ]);
	   console.log('Seeded transactions');
   } catch (err) {
	   console.error('Error seeding transactions:', err);
   }
}
