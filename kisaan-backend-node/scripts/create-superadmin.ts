import bcrypt from 'bcryptjs';
import { User } from '../src/models/user';
import sequelize from '../src/config/database';

const createSuperadmin = async () => {
  try {
    console.log('🔄 Creating superadmin user...');
    
    // Check if superadmin already exists
    const existingAdmin = await User.findOne({ where: { username: 'superadmin' } });
    
    if (existingAdmin) {
      console.log('✅ Superadmin already exists');
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('superadminpass', 10);
    
    // Create superadmin
    const superadmin = await User.create({
      username: 'superadmin',
      password: hashedPassword,
      role: 'superadmin',
      status: 'active',
      balance: 0
    });
    
    console.log('✅ Superadmin created successfully:', superadmin.username);
    
  } catch (error) {
    console.error('❌ Error creating superadmin:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
};

if (require.main === module) {
  createSuperadmin().catch(console.error);
}

export { createSuperadmin };