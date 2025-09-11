import { Sequelize } from 'sequelize';
import sequelize from '../src/config/database';

const fixPlanPrice = async () => {
  try {
    console.log('🔄 Fixing plan price NULL values...');
    
    // Update all NULL price values to 0
    await sequelize.query(
      `UPDATE kisaan_plans SET price = 0.00 WHERE price IS NULL;`
    );
    
    console.log('✅ Updated NULL price values to 0.00');
    console.log('✅ Plan price fix completed successfully!');
  } catch (error) {
    console.error('❌ Plan price fix failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
};

if (require.main === module) {
  fixPlanPrice().catch(console.error);
}

export { fixPlanPrice };